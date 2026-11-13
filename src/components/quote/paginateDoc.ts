// Auto-pagination for the print/PDF render.
//
// The authoring model (QuoteDoc.pages) is the admin's INTENT — a page break they
// placed on purpose via "Add page". It is never auto-split, because that would
// silently move content the admin deliberately grouped. What actually gets
// printed/exported is a separate, DERIVED "layout pages" array: every block from
// every authoring page, repacked to respect real A4 content height, with an
// oversized `items`/`table` block split row-by-row (repeating the header) when
// it alone doesn't fit what's left of a page.
//
// This is pure layout math over a height map the CALLER measures — see
// QuotePaginator.tsx, which mounts every block (and every candidate split
// point of an oversized items/table block) off-screen once, reads each
// `offsetHeight` from the real DOM, and hands the resulting map to
// `packLayoutPages` below. Keeping the packing algorithm free of DOM access
// makes it synchronous, testable, and re-runnable without re-measuring
// anything that didn't change.

import type { QuoteBlock, QuoteDoc, QuotePage, ItemsBlock, TableBlock, GridBlock } from './quoteDoc';
import { newId } from './quoteDoc';

/** CSS px, A4 at 96dpi — same figures QuotePreview/the PDF export already use. */
export const PAGE_WIDTH_PX = 794;
export const PAGE_HEIGHT_PX = 1123;
/** QuotePreview's `p-12` body padding on all four sides. */
export const PAGE_PADDING_PX = 48;
/** The accent bar across the top of every page (counts against the page height). */
export const PAGE_BORDER_TOP_PX = 6;
/** Fixed-height footer band (gap + footer text + "Page x of y") reserved on EVERY page. */
export const FOOTER_RESERVE_PX = 96;
/** Space the footer "Total" row needs on the last page (mt-8 + rule + 22px figure). */
export const TOTAL_ROW_RESERVE_PX = 88;
/** Height actually available to blocks on a page (excluding page-1 header). */
export const PAGE_CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_BORDER_TOP_PX - PAGE_PADDING_PX * 2 - FOOTER_RESERVE_PX;
/** Matches QuotePreview's `space-y-6` (1.5rem) gap between blocks. */
export const BLOCK_GAP_PX = 24;

/** One block as it will actually render on a layout page — either the whole
 *  original block, or a row-range slice of an oversized items/table block. */
export interface LayoutBlock {
  /** Stable per-slice React key (`block.id` or `block.id::startRow`). */
  key: string;
  /** Id of the ORIGINAL authoring block (slices share it). */
  origId: string;
  /** Row range of the original block this slice shows; undefined = whole block. */
  rowStart?: number;
  rowEnd?: number;
  block: QuoteBlock;
  /** True for every slice after the first — the renderer suppresses the
   *  block's own title on a continuation. */
  isContinuation: boolean;
  /** True only for the slice containing the block's LAST row — the renderer
   *  shows an items block's subtotal only there (see PreviewBlock). Always
   *  true for an unsplit block. */
  isFinalSlice: boolean;
}

export interface LayoutPage {
  /** Only ever true on the very first layout page — mirrors QuotePreview's
   *  existing "page 0 only" rule for the branding header + bill-to block. */
  showBrandingHeader: boolean;
  showBillTo: boolean;
  blocks: LayoutBlock[];
}

export function rowCount(block: QuoteBlock): number | null {
  if (block.type === 'items') return (block as ItemsBlock).items.length;
  if (block.type === 'table') return (block as TableBlock).rows.length;
  // A 4-cell grid is two rows of two; it may break between them.
  if (block.type === 'grid' && (block as GridBlock).layout === 4) return 2;
  return null;
}

/** A copy of `block` containing only rows `[startRow, endRow)`. */
export function sliceRows(block: QuoteBlock, startRow: number, endRow: number): QuoteBlock {
  if (block.type === 'items') return { ...block, items: (block as ItemsBlock).items.slice(startRow, endRow) } as QuoteBlock;
  if (block.type === 'table') return { ...block, rows: (block as TableBlock).rows.slice(startRow, endRow) } as QuoteBlock;
  if (block.type === 'grid') {
    const g = block as GridBlock;
    const cells = [...(g.cells || [])];
    while (cells.length < g.layout) cells.push(null);
    return { ...g, cells: cells.slice(startRow * 2, endRow * 2), layout: (endRow - startRow) * 2 } as unknown as QuoteBlock;
  }
  return block;
}

/** Flat list of every visible block across every authoring page, in order. */
export function flattenVisibleBlocks(doc: QuoteDoc): QuoteBlock[] {
  return doc.pages.flatMap((p) => p.blocks.filter((b) => !b.hidden));
}

/**
 * Greedy-fill packer: places each block on the current layout page if its
 * measured height fits what's left; otherwise starts a new page. A block
 * taller than a whole empty page is split at the largest row-count whose
 * measured height still fits (`splitPointsOf`, provided by the caller — it
 * already measured every row-count candidate up front), so the split point
 * is exact rather than estimated from a per-row average.
 *
 * @param heightOf       measured height (px) of a whole block, by block id.
 * @param splitPointsOf  for a splittable (items/table) block id, an ascending
 *                       array where `result[n]` = measured height of the
 *                       block's first `n` rows. Only consulted when the whole
 *                       block doesn't fit — most blocks never need this.
 * @param headerHeight   combined measured height of the branding header +
 *                       "Prepared for" block, reserved on page 1 only.
 */
export function packLayoutPages(
  doc: QuoteDoc,
  heightOf: (blockId: string) => number,
  splitPointsOf: (blockId: string) => number[] | undefined,
  headerHeight: number,
  reserveTotalRow = false,
): LayoutPage[] {
  const pages: LayoutPage[] = [];
  let current: LayoutBlock[] = [];
  let usedHeight = 0;
  let isFirstPage = true;

  const flushPage = () => {
    pages.push({
      showBrandingHeader: isFirstPage && doc.branding.showHeader,
      showBillTo: isFirstPage,
      blocks: current,
    });
    current = [];
    usedHeight = 0;
    isFirstPage = false;
  };

  const remainingHeight = () => {
    const reserved = isFirstPage ? headerHeight : 0;
    const gaps = current.length > 0 ? BLOCK_GAP_PX : 0;
    return PAGE_CONTENT_HEIGHT_PX - reserved - usedHeight - gaps;
  };

  const push = (
    key: string, block: QuoteBlock, isContinuation: boolean, isFinalSlice: boolean, height: number,
    origId: string, range?: [number, number] | null,
  ) => {
    const gap = current.length > 0 ? BLOCK_GAP_PX : 0;
    current.push({ key, block, isContinuation, isFinalSlice, origId, rowStart: range?.[0], rowEnd: range?.[1] });
    usedHeight += height + gap;
  };

  // `originalId`/`trueTotalRows` describe the block's real identity — used as
  // the lookup key into heightOf/splitPointsOf (always keyed by original
  // block id, however many times a block has already been sliced by a
  // previous recursive call) and to know whether a given range reaches the
  // block's actual last row. `rowRange` is the SLICE of that original block
  // still to be placed (null = the whole thing).
  const place = (
    originalBlock: QuoteBlock,
    originalId: string,
    trueTotalRows: number | null,
    isContinuation: boolean,
    rowRange: [start: number, end: number] | null,
  ) => {
    const key = rowRange ? `${originalId}::${rowRange[0]}` : originalId;
    const points = splitPointsOf(originalId);
    // A slice that doesn't start at row 0 renders its own header row again (and
    // no title), so it costs (rows delta) + the empty-block overhead points[0].
    const sliceHeight = (a: number, b: number) =>
      (points![b] ?? Infinity) - (a === 0 ? 0 : (points![a] ?? 0) - (points![0] ?? 0));
    const wholeHeight = rowRange && points
      ? sliceHeight(rowRange[0], rowRange[1])
      : heightOf(originalId);
    const remaining = remainingHeight();
    const sliceBlock = rowRange ? sliceRows(originalBlock, rowRange[0], rowRange[1]) : originalBlock;
    const isFinalSlice = trueTotalRows == null || (rowRange ? rowRange[1] : trueTotalRows) >= trueTotalRows;

    if (wholeHeight <= remaining) {
      push(key, sliceBlock, isContinuation, isFinalSlice, wholeHeight, originalId, rowRange);
      return;
    }

    const rangeRows = rowRange ? rowRange[1] - rowRange[0] : trueTotalRows;
    if (rangeRows == null || rangeRows <= 1 || !points) {
      // Not splittable — start fresh page unless already empty, then place
      // it regardless (a single block genuinely bigger than one A4 page,
      // e.g. one oversized image, is a content problem, not a pagination bug).
      if (current.length > 0) flushPage();
      push(key, sliceBlock, isContinuation, isFinalSlice, wholeHeight, originalId, rowRange);
      return;
    }

    // Find the largest row-count (within this slice's range) whose measured
    // height fits what's left of THIS page — `remaining` already accounts for
    // the header reservation on page 1 and for whether the page is otherwise
    // empty (remainingHeight() only subtracts a block-gap when current.length > 0).
    const budget = remaining;
    const rangeStart = rowRange ? rowRange[0] : 0;
    const rangeEnd = rowRange ? rowRange[1] : rangeRows;
    let fitCount = 0;
    for (let n = rangeStart + 1; n <= rangeEnd; n++) {
      if (sliceHeight(rangeStart, n) <= budget) fitCount = n - rangeStart; else break;
    }
    if (fitCount === 0) {
      // Not even one row fits here. Move to a fresh page and retry; on an
      // already-empty page force one row so we always make progress.
      if (current.length > 0) {
        flushPage();
        place(originalBlock, originalId, trueTotalRows, isContinuation, rowRange);
        return;
      }
      fitCount = 1;
    }

    if (fitCount > 0) {
      const headHeight = sliceHeight(rangeStart, rangeStart + fitCount);
      const head = sliceRows(originalBlock, rangeStart, rangeStart + fitCount);
      const headIsFinal = trueTotalRows != null && rangeStart + fitCount >= trueTotalRows;
      push(`${originalId}::${rangeStart}`, head, isContinuation || rangeStart > 0, headIsFinal, headHeight, originalId, [rangeStart, rangeStart + fitCount]);
    }
    flushPage();

    if (rangeStart + fitCount < rangeEnd) {
      place(originalBlock, originalId, trueTotalRows, true, [rangeStart + fitCount, rangeEnd]);
    }
  };

  // Respect the admin's own page breaks so the PDF matches the quote page:
  // every authoring page starts a fresh layout page; only a page whose content
  // truly overflows A4 spills onto extra pages.
  doc.pages.forEach((authoringPage, pi) => {
    const visible = authoringPage.blocks.filter((b) => !b.hidden);
    if (pi > 0) {
      const prevEmpty = doc.pages[pi - 1].blocks.every((b) => b.hidden);
      if (current.length > 0 || prevEmpty) flushPage();
    }
    for (const block of visible) place(block, block.id, rowCount(block), false, null);
  });
  // The footer Total row lives under the last page's blocks — if it doesn't
  // fit there, it gets its own page rather than overlapping the footer.
  if (reserveTotalRow) {
    const used = (isFirstPage ? headerHeight : 0) + usedHeight;
    if (used + TOTAL_ROW_RESERVE_PX > PAGE_CONTENT_HEIGHT_PX && (current.length > 0 || pages.length > 0)) {
      if (current.length > 0) flushPage();
      flushPage();
      return pages;
    }
  }
  if (current.length > 0 || pages.length === 0) flushPage();
  return pages;
}

/**
 * Turns the DERIVED print/PDF layout back into the admin's authoring model —
 * the "Repaginate" action for a quote whose manual page breaks no longer
 * match its actual content (typically an older quote that had rows added
 * since the pages were last arranged by hand, so it now overflows in the
 * editor even though PDF export already reflows it correctly on its own).
 *
 * One authoring page per `LayoutPage`, each block from `LayoutPage.blocks`
 * kept as its (possibly row-sliced) form. A block that pagination split
 * across pages becomes several smaller blocks with fresh ids rather than a
 * single block spanning pages — the authoring model has no cross-page block
 * concept, and there is nothing to preserve by pretending otherwise: the
 * NEXT repagination (or PDF export) re-derives the correct split from the
 * content again regardless of how this pass happened to cut it.
 *
 * Hidden blocks are dropped from `flattenVisibleBlocks` already (pagination
 * only ever sees visible blocks), so nothing here needs to re-attach them —
 * callers that care should preserve `doc.pages` blocks with `hidden: true`
 * separately rather than relying on this function to round-trip them.
 */
export function layoutPagesToQuotePages(layoutPages: LayoutPage[]): QuotePage[] {
  if (layoutPages.length === 0) return [{ id: newId('p'), blocks: [] }];
  return layoutPages.map((lp) => ({
    id: newId('p'),
    blocks: lp.blocks.map(({ block }) => ({ ...block, id: newId() })),
  }));
}
