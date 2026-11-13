import { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PreviewBlock, PageHeader } from './QuotePreview';
import { computeTotals } from './computeTotals';
import {
  packLayoutPages, flattenVisibleBlocks, rowCount, sliceRows,
  PAGE_WIDTH_PX, PAGE_PADDING_PX, PAGE_CONTENT_HEIGHT_PX,
  type LayoutPage,
} from './paginateDoc';
import type { QuoteDoc, QuoteBlock } from './quoteDoc';

/**
 * Measures every block (and, for an oversized items/table block, every
 * candidate row-split point) by mounting it off-screen through a REAL React
 * root using the exact same `PreviewBlock` component the visible page uses,
 * then reads back `offsetHeight`. This is the only reliable way to know a
 * block's rendered height — anything image-based (a logo, an uploaded
 * signature) can change height once its `<img>` finishes loading, and text
 * wrapping depends on the live font/box-width, so no static estimate would
 * survive real content.
 *
 * Runs the whole packing pass whenever `doc`/`accent`/`currency` change,
 * debounced by a rAF so a fast sequence of edits doesn't re-measure on every
 * keystroke. Returns `null` while a pass is in flight — callers should keep
 * showing the previous result (or a spinner) rather than an empty page.
 */
export function useQuotePagination(doc: QuoteDoc, accent: string, currency: string): LayoutPage[] | null {
  const [pages, setPages] = useState<LayoutPage[] | null>(null);
  const probeRootRef = useRef<{ container: HTMLDivElement; root: Root } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const raf = requestAnimationFrame(async () => {
      const result = await measure(doc, accent, currency, getProbeRoot());
      if (!cancelled) setPages(result);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, accent, currency]);

  useEffect(() => () => {
    // Unmount the probe root on unmount only — kept alive across re-measures
    // so every pass doesn't pay React's mount/unmount cost.
    if (probeRootRef.current) {
      probeRootRef.current.root.unmount();
      document.body.removeChild(probeRootRef.current.container);
      probeRootRef.current = null;
    }
  }, []);

  function getProbeRoot() {
    if (!probeRootRef.current) {
      const container = document.createElement('div');
      // Off-screen but still laid out at real dimensions (display:none would
      // report 0 for every measurement) — shifted far outside the viewport
      // and hidden from assistive tech / interaction instead.
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '-99999px';
      container.style.width = `${PAGE_WIDTH_PX}px`;
      container.setAttribute('aria-hidden', 'true');
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
      probeRootRef.current = { container, root: createRoot(container) };
    }
    return probeRootRef.current;
  }

  return pages;
}

/** Renders one candidate node into the probe root and resolves its offsetHeight
 *  once React has committed and any images inside have settled. */
function measureNode(
  probe: { container: HTMLDivElement; root: Root },
  node: React.ReactElement,
): Promise<number> {
  return new Promise((resolve) => {
    probe.root.render(
      // flow-root so children's outer margins (e.g. the bill-to `mb-6`) count
      // toward the measured height instead of collapsing out of it.
      <div style={{ width: PAGE_WIDTH_PX - PAGE_PADDING_PX * 2, display: 'flow-root' }}>{node}</div>,
    );
    // Two rAFs: one for React's commit to land in the DOM, one more so any
    // <img> that was already cached reports its natural size before we read
    // offsetHeight (a single rAF occasionally raced ahead of layout in testing).
    requestAnimationFrame(() => requestAnimationFrame(async () => {
      const wrapper = probe.container.firstElementChild as HTMLElement | null;
      // Images change height once loaded — wait for them (bounded) before measuring.
      if (wrapper) {
        const pending = Array.from(wrapper.querySelectorAll('img')).filter((i) => !i.complete);
        if (pending.length) {
          await Promise.race([
            Promise.all(pending.map((i) => new Promise<void>((r) => { i.onload = () => r(); i.onerror = () => r(); }))),
            new Promise((r) => setTimeout(r, 5000)),
          ]);
        }
      }
      resolve(wrapper ? wrapper.offsetHeight : probe.container.offsetHeight);
    }));
  });
}

async function measure(
  doc: QuoteDoc,
  accent: string,
  currency: string,
  probe: { container: HTMLDivElement; root: Root },
): Promise<LayoutPage[]> {
  const totals = computeTotals(doc);
  const blocks = flattenVisibleBlocks(doc);

  const renderBlock = (block: QuoteBlock, isFinalSlice = true) => (
    <PreviewBlock
      block={block}
      accent={accent}
      currency={currency}
      subtotal={totals.perBlockSubtotals[block.id] ?? 0}
      totals={totals}
      readOnly
      isFinalSlice={isFinalSlice}
    />
  );

  const heights: Record<string, number> = {};
  const splitPoints: Record<string, number[] | undefined> = {};

  for (const block of blocks) {
    heights[block.id] = await measureNode(probe, renderBlock(block));
  }

  // Second pass: only blocks whose full height alone could overflow a page
  // get their row-by-row split points measured (cumulative height of the
  // first n rows, n = 0..rows) — this keeps the common case, where every
  // block comfortably fits, down to one probe render per block.
  for (const block of blocks) {
    const rows = rowCount(block);
    if (rows == null || rows <= 1) continue;
    // Grids always get split points: a grid that merely doesn't fit the space left on
    // the current page should break between its rows instead of leaving a blank gap.
    if (block.type !== 'grid' && heights[block.id] <= PAGE_CONTENT_HEIGHT_PX) continue;
    const points: number[] = [];
    for (let n = 0; n <= rows; n++) {
      const slice = sliceRows(block, 0, n);
      // Every slice after the first row is necessarily a "final" slice for
      // measurement purposes — we're probing candidate cut points, not
      // rendering the real continuation, so always show the subtotal here;
      // packLayoutPages only uses these numbers for height, never renders them.
      points.push(await measureNode(probe, renderBlock(slice, true)));
    }
    splitPoints[block.id] = points;
  }

  // Always measured — the "Prepared for" block renders on page 1 regardless
  // of whether the branding header itself is toggled on.
  const headerHeight = await measureNode(probe, <PageHeader doc={doc} accent={accent} reference={null} />);

  return packLayoutPages(
    doc,
    (id) => heights[id] ?? 0,
    (id) => splitPoints[id],
    headerHeight,
    !hasSummaryBlock(doc) && doc.showTotal !== false,
  );
}

function hasSummaryBlock(doc: QuoteDoc) {
  return doc.pages.some((p) => p.blocks.some((b) => b.type === 'summary' && !b.hidden));
}
