import { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PreviewBlock } from './QuotePreview';
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
      <div style={{ width: PAGE_WIDTH_PX - PAGE_PADDING_PX * 2 }}>{node}</div>,
    );
    // Two rAFs: one for React's commit to land in the DOM, one more so any
    // <img> that was already cached reports its natural size before we read
    // offsetHeight (a single rAF occasionally raced ahead of layout in testing).
    requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve(probe.container.firstElementChild?.firstElementChild instanceof HTMLElement
        ? (probe.container.firstElementChild.firstElementChild as HTMLElement).offsetHeight
        : probe.container.offsetHeight);
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
    if (heights[block.id] <= PAGE_CONTENT_HEIGHT_PX) continue;
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
  const headerHeight = await measureNode(probe, <BrandingAndBillToProbe doc={doc} accent={accent} />);

  return packLayoutPages(
    doc,
    (id) => heights[id] ?? 0,
    (id) => splitPoints[id],
    headerHeight,
  );
}

/** Mirrors QuotePreview's page-0-only branding header + "Prepared for" block,
 *  so its measured height matches exactly what the real first page reserves. */
function BrandingAndBillToProbe({ doc, accent }: { doc: QuoteDoc; accent: string }) {
  return (
    <div>
      {doc.branding.showHeader && (
        <div className="flex items-start justify-between gap-6 pb-6 mb-6 border-b" style={{ borderColor: `${accent}33` }}>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {doc.branding.logoUrl ? <img src={doc.branding.logoUrl} alt="logo" className="h-12 w-auto object-contain" /> : null}
              <h2 className="font-sans font-bold text-3xl" style={{ color: accent }}>{doc.branding.name}</h2>
            </div>
            <p className="text-[12px] text-gray-500 mt-0.5">{doc.branding.tagline || ''}</p>
            <div className="mt-3 text-[12px] text-gray-600 leading-relaxed">
              {doc.branding.addressLines.map((line, i) => <p key={i}>{line}</p>)}
            </div>
            <div className="mt-2 text-[12px] text-gray-600 space-x-3">
              <span>{doc.branding.phone}</span><span>{doc.branding.email}</span><span>{doc.branding.website}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <h1 className="font-sans font-bold text-2xl tracking-wide uppercase" style={{ color: accent }}>{doc.meta.quoteTitle}</h1>
            <p className="text-[12px] text-gray-500 mt-1">Ref: —</p>
            <div className="text-[12px] text-gray-600 mt-1">Date: {doc.meta.date}</div>
            <p className="text-[12px] text-gray-600">Valid for {doc.meta.validityDays} days</p>
            {doc.branding.gstin ? <p className="text-[11px] text-gray-400 mt-1">GSTIN: {doc.branding.gstin}</p> : null}
          </div>
        </div>
      )}
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Prepared for</p>
        <p className="font-semibold text-[15px] text-gray-800">{doc.meta.clientName}</p>
        <p className="text-[12px] text-gray-500">{doc.meta.clientEmail}</p>
        <p className="text-[12px] text-gray-500">{doc.meta.clientAddress}</p>
      </div>
    </div>
  );
}
