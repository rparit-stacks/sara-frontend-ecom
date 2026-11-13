import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { RichText, EditableText, alignClass } from './RichText';
import { computeTotals } from './computeTotals';
import { PAGE_HEIGHT_PX, FOOTER_RESERVE_PX, sliceRows } from './paginateDoc';
import { useQuotePagination } from './useQuotePagination';
import type {
  QuoteDoc, QuoteBlock, QuoteBlockType, ItemsBlock, TextBlock, ImageBlock, TableBlock, GridBlock,
  SummaryBlock, FieldsBlock, SignatureBlock,
} from './quoteDoc';
import { createBlock } from './quoteDoc';

const GRID_CELL_TYPES: QuoteBlockType[] = ['items', 'text', 'image', 'table', 'summary', 'fields', 'signature'];
const DRAG_BLOCK_MIME = 'application/x-quote-block-id';
const CELL_META: Record<QuoteBlockType, { label: string; icon: string }> = {
  items: { label: 'Line items', icon: 'fa-list-check' },
  text: { label: 'Rich text', icon: 'fa-align-left' },
  image: { label: 'Image', icon: 'fa-image' },
  table: { label: 'Table', icon: 'fa-table' },
  summary: { label: 'Summary', icon: 'fa-calculator' },
  fields: { label: 'Fields', icon: 'fa-list' },
  signature: { label: 'Signature', icon: 'fa-signature' },
  grid: { label: 'Grid', icon: 'fa-th-large' },
};

const CURRENCIES: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number, currency: string) =>
  `${CURRENCIES[currency] ?? ''}${(isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * The ONE renderer for quote pages — used by the live canvas AND by the PDF /
 * print preview (QuotePrintPreview is just this with `readOnly`). Pages are the
 * paginated layout (useQuotePagination), so what you see here is exactly the
 * set of A4 sheets the PDF contains: same frame, header, block markup, footer.
 * Editing handlers are optional; without them everything is read-only.
 */
export default function QuotePreview({
  doc, accent, currency, reference, onPatchMeta, onPatchBranding, onPatchBlock, onUpdate, onEditBlock,
  onMoveBlockIntoGridCell, onEjectGridCell, readOnly, onReady,
}: {
  doc: QuoteDoc;
  accent: string;
  currency: string;
  reference: string | null;
  onPatchMeta?: (p: Partial<QuoteDoc['meta']>) => void;
  onPatchBranding?: (p: Partial<QuoteDoc['branding']>) => void;
  onPatchBlock?: (pageId: string, blockId: string, p: Partial<QuoteBlock>) => void;
  onUpdate?: (next: QuoteDoc) => void;
  /** Double-click a section on the page → open its form in the left panel. */
  onEditBlock?: (pageId: string, blockId: string) => void;
  /** Kept for API compatibility — pages now reflow automatically, so no overflow banner. */
  onAddPage?: () => void;
  /** Drag an existing page section into a grid cell on the canvas. */
  onMoveBlockIntoGridCell?: (pageId: string, gridId: string, cellIndex: number, sourceBlockId: string) => void;
  /** Pull a grid cell back out as its own page section. */
  onEjectGridCell?: (pageId: string, gridId: string, cellIndex: number) => void;
  /** Force the read-only (print/PDF) render. */
  readOnly?: boolean;
  /** Fires when pagination finishes, with the number of A4 pages. */
  onReady?: (pageCount: number) => void;
}) {
  const totals = useMemo(() => computeTotals(doc), [doc]);
  const layoutPages = useQuotePagination(doc, accent, currency);

  useEffect(() => {
    if (layoutPages) onReady?.(layoutPages.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutPages]);

  // Layout pages carry only *which* block/rows go where; the content itself is
  // always read fresh from `doc`, so typing is never overwritten by a stale layout.
  const { blockById, pageOfBlock } = useMemo(() => {
    const blockById: Record<string, QuoteBlock> = {};
    const pageOfBlock: Record<string, string> = {};
    for (const p of doc.pages) for (const b of p.blocks) { blockById[b.id] = b; pageOfBlock[b.id] = p.id; }
    return { blockById, pageOfBlock };
  }, [doc]);

  // Footer Total only shows when the doc has no visible summary block.
  const hasSummary = doc.pages.some((p) => p.blocks.some((b) => b.type === 'summary' && !b.hidden));
  const showTotalRow = !hasSummary && doc.showTotal !== false;

  if (!layoutPages) {
    return (
      <div className="w-[794px] min-h-[1123px] flex items-center justify-center text-gray-400">
        <i className="fa-solid fa-spinner fa-spin text-2xl" />
      </div>
    );
  }

  const editing = !readOnly;
  return (
    <>
      {layoutPages.map((page, pageIdx) => {
        const isLast = pageIdx === layoutPages.length - 1;
        return (
          <QuotePageFrame
            key={pageIdx}
            accent={accent}
            readOnly={!!readOnly}
            pageIdx={pageIdx}
            pageCount={layoutPages.length}
            footerText={doc.footerText}
            onFooterChange={editing && onUpdate ? (v) => onUpdate({ ...doc, footerText: v }) : undefined}
            header={pageIdx === 0 ? (
              <PageHeader
                doc={doc}
                accent={accent}
                reference={reference}
                onPatchMeta={editing ? onPatchMeta : undefined}
                onPatchBranding={editing ? onPatchBranding : undefined}
              />
            ) : null}
            totalRow={isLast && showTotalRow ? (
              <div className="mt-8 flex justify-end shrink-0">
                <div className="w-64 border-t-2 pt-3 flex items-center justify-between" style={{ borderColor: accent }}>
                  <span className="font-bold text-[15px]">Total</span>
                  <span className="font-bold text-[22px]" style={{ color: accent }}>{money(totals.grandTotal, currency)}</span>
                </div>
              </div>
            ) : null}
          >
            {page.blocks.map(({ key, origId, rowStart, rowEnd, isContinuation, isFinalSlice }) => {
              const cur = blockById[origId];
              if (!cur) return null;
              const sliced = rowStart != null && rowEnd != null;
              const block = sliced ? sliceRows(cur, rowStart!, rowEnd!) : cur;
              const authoringPageId = pageOfBlock[origId];
              // A row-slice of a split table/grid can't be patched back as a whole block.
              const canEdit = editing && !sliced;
              const canDrag = canEdit && !!onMoveBlockIntoGridCell && block.type !== 'grid';
              const authoringPage = doc.pages.find((p) => p.id === authoringPageId);
              return (
                <div
                  key={key}
                  draggable={canDrag}
                  onDragStart={canDrag ? (e) => {
                    e.dataTransfer.setData(DRAG_BLOCK_MIME, block.id);
                    e.dataTransfer.effectAllowed = 'move';
                  } : undefined}
                  onDoubleClick={canEdit && onEditBlock ? () => onEditBlock(authoringPageId, block.id) : undefined}
                  className={editing && (onEditBlock || canDrag)
                    ? 'group/sec relative rounded-lg hover:ring-2 hover:ring-[#00676a]/15 hover:ring-offset-4 transition-shadow'
                    : undefined}
                  title={canDrag ? 'Drag into a grid cell, or double-click to edit' : canEdit && onEditBlock ? 'Double-click to edit this section' : undefined}
                >
                  {canEdit && onEditBlock && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditBlock(authoringPageId, block.id); }}
                      className="no-print opacity-0 group-hover/sec:opacity-100 absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full bg-white border border-gray-200 shadow text-gray-500 hover:text-[#00676a] transition-opacity"
                      title="Edit in side panel"
                    ><i className="fa-solid fa-pen text-[11px]" /></button>
                  )}
                  {canDrag && (
                    <span className="no-print opacity-0 group-hover/sec:opacity-100 absolute -top-2 -left-2 z-20 w-7 h-7 rounded-full bg-white border border-gray-200 shadow text-gray-400 flex items-center justify-center pointer-events-none" title="Drag">
                      <i className="fa-solid fa-grip-vertical text-[11px]" />
                    </span>
                  )}
                  <PreviewBlock
                    block={block}
                    accent={accent}
                    currency={currency}
                    subtotal={totals.perBlockSubtotals[block.id] ?? 0}
                    totals={totals}
                    readOnly={!canEdit}
                    isContinuation={isContinuation}
                    isFinalSlice={isFinalSlice}
                    onPatch={canEdit && onPatchBlock ? (p) => onPatchBlock(authoringPageId, block.id, p) : undefined}
                    pageId={authoringPageId}
                    pageBlocks={authoringPage?.blocks}
                    onMoveBlockIntoGridCell={canEdit ? onMoveBlockIntoGridCell : undefined}
                    onEjectGridCell={canEdit ? onEjectGridCell : undefined}
                  />
                </div>
              );
            })}
          </QuotePageFrame>
        );
      })}
    </>
  );
}

/** One fixed A4 sheet. Identical for the live canvas and the PDF. The block
 *  area is `flex-1 min-h-0`; the footer band is a fixed FOOTER_RESERVE_PX tall,
 *  which is exactly what pagination reserves — so nothing can ever overlap. */
function QuotePageFrame({
  accent, readOnly, pageIdx, pageCount, footerText, onFooterChange, header, totalRow, children,
}: {
  accent: string; readOnly: boolean; pageIdx: number; pageCount: number;
  footerText: string; onFooterChange?: (v: string) => void;
  header: React.ReactNode; totalRow: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div
      className={`quote-page relative bg-white shadow-xl w-[794px] shrink-0 flex flex-col ${readOnly ? 'overflow-hidden' : ''}`}
      style={{ borderTop: `6px solid ${accent}`, height: PAGE_HEIGHT_PX }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{ backgroundImage: 'url(/bg_images/watercolor-wallpaper-with-hand-drawn-elements.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div
        className="absolute -top-px right-0 w-40 h-40 pointer-events-none opacity-10"
        style={{ background: `radial-gradient(circle at top right, ${accent}, transparent 70%)` }}
      />
      <div className="relative z-10 flex-1 min-h-0 flex flex-col p-12">
        {header}
        <div className={`flex-1 min-h-0 space-y-6 ${readOnly ? 'overflow-hidden' : ''}`}>{children}</div>
        {totalRow}
        <div className="shrink-0 flex flex-col justify-end" style={{ height: FOOTER_RESERVE_PX }}>
          <EditableText
            readOnly={!onFooterChange}
            value={footerText}
            onChange={(v) => onFooterChange?.(v)}
            className="text-center text-[11px] text-gray-400 border-t pt-3"
            style={{ borderColor: '#eee' }}
            placeholder="Footer text"
          />
          <p className="text-center text-[10px] text-gray-300 mt-1">Page {pageIdx + 1} of {pageCount}</p>
        </div>
      </div>
    </div>
  );
}

/** Branding header + "Prepared for" block (first page). Shared with the
 *  pagination probe so its measured height is the real height. */
export function PageHeader({
  doc, accent, reference, onPatchMeta, onPatchBranding,
}: {
  doc: QuoteDoc; accent: string; reference: string | null;
  onPatchMeta?: (p: Partial<QuoteDoc['meta']>) => void;
  onPatchBranding?: (p: Partial<QuoteDoc['branding']>) => void;
}) {
  const noop = () => {};
  const patchMeta = onPatchMeta ?? noop;
  const patchBranding = onPatchBranding ?? noop;
  const ro = !onPatchMeta && !onPatchBranding;
  return (
    <div style={{ display: 'flow-root' }}>
      {doc.branding.showHeader && (
        <div className="flex items-start justify-between gap-6 pb-6 mb-6 border-b" style={{ borderColor: `${accent}33` }}>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {doc.branding.logoUrl ? <img src={doc.branding.logoUrl} alt="logo" className="h-12 w-auto object-contain" /> : null}
              <EditableText readOnly={ro} as="h2" value={doc.branding.name} onChange={(v) => patchBranding({ name: v })} className="font-sans font-bold text-3xl" style={{ color: accent }} placeholder="Company name" />
            </div>
            <EditableText readOnly={ro} value={doc.branding.tagline || ''} onChange={(v) => patchBranding({ tagline: v })} className="text-[12px] text-gray-500 mt-0.5" placeholder="Tagline" />
            <div className="mt-3 text-[12px] text-gray-600 leading-relaxed">
              {doc.branding.addressLines.map((line, i) => (
                <EditableText
                  key={i}
                  readOnly={ro}
                  value={line}
                  onChange={(v) => {
                    const lines = [...doc.branding.addressLines]; lines[i] = v;
                    patchBranding({ addressLines: lines.filter((_, idx) => idx !== i || v.length) });
                  }}
                  className="block"
                  placeholder="Address line"
                />
              ))}
            </div>
            <div className="mt-2 text-[12px] text-gray-600 space-x-3">
              <EditableText readOnly={ro} as="span" value={doc.branding.phone || ''} onChange={(v) => patchBranding({ phone: v })} className="inline-block" placeholder="Phone" />
              <EditableText readOnly={ro} as="span" value={doc.branding.email || ''} onChange={(v) => patchBranding({ email: v })} className="inline-block" placeholder="Email" />
              <EditableText readOnly={ro} as="span" value={doc.branding.website || ''} onChange={(v) => patchBranding({ website: v })} className="inline-block" placeholder="Website" />
            </div>
          </div>
          <div className="text-right shrink-0">
            <EditableText readOnly={ro} as="h1" value={doc.meta.quoteTitle} onChange={(v) => patchMeta({ quoteTitle: v })} className="font-sans font-bold text-2xl tracking-wide uppercase" style={{ color: accent }} placeholder="Quotation" />
            <p className="text-[12px] text-gray-500 mt-1">Ref: {reference || '— (save to generate)'}</p>
            <div className="text-[12px] text-gray-600 mt-1">Date: {doc.meta.date}</div>
            <p className="text-[12px] text-gray-600">Valid for {doc.meta.validityDays} days</p>
            {doc.branding.gstin ? <p className="text-[11px] text-gray-400 mt-1">GSTIN: {doc.branding.gstin}</p> : null}
          </div>
        </div>
      )}
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Prepared for</p>
        <EditableText readOnly={ro} value={doc.meta.clientName} onChange={(v) => patchMeta({ clientName: v })} className="font-semibold text-[15px] text-gray-800" placeholder="Client name" />
        <EditableText readOnly={ro} value={doc.meta.clientEmail} onChange={(v) => patchMeta({ clientEmail: v })} className="text-[12px] text-gray-500" placeholder="Client email" />
        <EditableText readOnly={ro} value={doc.meta.clientAddress} onChange={(v) => patchMeta({ clientAddress: v })} className="text-[12px] text-gray-500" placeholder="Client address (optional)" />
      </div>
    </div>
  );
}

/* ---------- per-block renderer ----------
 * Exported so QuotePaginator's off-screen measurement probe renders each
 * candidate block/slice through the EXACT same markup that ends up on a real
 * page — a probe using different JSX would measure the wrong thing. */
export function PreviewBlock({
  block, accent, currency, subtotal, totals, onPatch, readOnly, isContinuation, isFinalSlice = true,
  pageId, pageBlocks, onMoveBlockIntoGridCell, onEjectGridCell, compact,
}: {
  /** Rendered inside a half-width grid cell — tighter table columns/text. */
  compact?: boolean;
  block: QuoteBlock; accent: string; currency: string; subtotal: number;
  totals: ReturnType<typeof computeTotals>;
  onPatch?: (p: Partial<QuoteBlock>) => void;
  /** True in the paginated print/PDF render — disables inline editing. */
  readOnly?: boolean;
  /** True for every row-slice after an items/table block's first (produced
   *  when pagination splits an oversized block across pages) — hides the
   *  block's own title, which already rendered on the earlier page. */
  isContinuation?: boolean;
  /** False for every slice EXCEPT the one containing the block's last row —
   *  an items block's running subtotal is only meaningful once every row has
   *  been shown, so it renders on the final slice only. Defaults true (an
   *  unsplit block is always its own final, and only, slice). */
  isFinalSlice?: boolean;
  pageId?: string;
  pageBlocks?: QuoteBlock[];
  onMoveBlockIntoGridCell?: (pageId: string, gridId: string, cellIndex: number, sourceBlockId: string) => void;
  onEjectGridCell?: (pageId: string, gridId: string, cellIndex: number) => void;
}) {
  const patch = onPatch ?? (() => {});
  const showTitle = !!block.title && !isContinuation;
  return (
    <div className="relative min-w-0">
      {showTitle ? (
        readOnly ? (
          <p className={`font-bold text-[15px] mb-1.5 ${alignClass(block.align)}`} style={{ color: accent }}>{block.title}</p>
        ) : (
          <EditableText
            value={block.title!}
            onChange={(v) => patch({ title: v })}
            className={`font-bold text-[15px] mb-1.5 ${alignClass(block.align)}`}
            style={{ color: accent }}
            placeholder="Section title"
          />
        )
      ) : null}

      {block.type === 'items' && (
        <ItemsView block={block as ItemsBlock} accent={accent} currency={currency} subtotal={subtotal} hideSubtotal={!isFinalSlice} compact={compact} />
      )}
      {block.type === 'text' && (
        readOnly
          ? <RichText html={(block as TextBlock).text} align={block.align} accent={accent} onChange={() => {}} readOnly />
          : <RichText html={(block as TextBlock).text} align={block.align} accent={accent} onChange={(v) => patch({ text: v } as Partial<QuoteBlock>)} />
      )}
      {block.type === 'image' && <ImageView block={block as ImageBlock} />}
      {block.type === 'table' && <TableView block={block as TableBlock} accent={accent} compact={compact} />}
      {block.type === 'summary' && <SummaryView block={block as SummaryBlock} accent={accent} currency={currency} totals={totals} compact={compact} />}
      {block.type === 'fields' && <FieldsView block={block as FieldsBlock} accent={accent} />}
      {block.type === 'signature' && <SignatureView block={block as SignatureBlock} accent={accent} />}
      {block.type === 'grid' && (
        <GridView
          block={block as GridBlock}
          accent={accent}
          currency={currency}
          totals={totals}
          readOnly={readOnly}
          onPatch={onPatch}
          pageId={pageId}
          pageBlocks={pageBlocks}
          onMoveBlockIntoGridCell={onMoveBlockIntoGridCell}
          onEjectGridCell={onEjectGridCell}
        />
      )}
    </div>
  );
}

function GridView({
  block, accent, currency, totals, readOnly, onPatch,
  pageId, pageBlocks, onMoveBlockIntoGridCell, onEjectGridCell,
}: {
  block: GridBlock; accent: string; currency: string;
  totals: ReturnType<typeof computeTotals>;
  readOnly?: boolean;
  onPatch?: (p: Partial<QuoteBlock>) => void;
  pageId?: string;
  pageBlocks?: QuoteBlock[];
  onMoveBlockIntoGridCell?: (pageId: string, gridId: string, cellIndex: number, sourceBlockId: string) => void;
  onEjectGridCell?: (pageId: string, gridId: string, cellIndex: number) => void;
}) {
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const interactive = !readOnly && !!onPatch;
  const cols = block.layout === 1 ? 'grid-cols-1' : 'grid-cols-2';
  const cells = [...(block.cells || [])];
  while (cells.length < block.layout) cells.push(null);
  const compact = block.layout > 1;

  const existing = (pageBlocks || []).filter((b) => b.id !== block.id && b.type !== 'grid' && !b.hidden);

  const setCell = (index: number, cell: QuoteBlock | null) => {
    if (!onPatch) return;
    const next = [...cells];
    next[index] = cell;
    onPatch({ cells: next } as Partial<QuoteBlock>);
  };
  const patchCell = (index: number, p: Partial<QuoteBlock>) => {
    const cell = cells[index];
    if (!cell || !onPatch) return;
    const next = [...cells];
    next[index] = { ...cell, ...p } as QuoteBlock;
    onPatch({ cells: next } as Partial<QuoteBlock>);
  };
  const acceptDrop = (index: number, e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    const sourceId = e.dataTransfer.getData(DRAG_BLOCK_MIME);
    if (!sourceId || !pageId || !onMoveBlockIntoGridCell) return;
    onMoveBlockIntoGridCell(pageId, block.id, index, sourceId);
    setPickerIndex(null);
  };

  return (
    <div className={`grid ${cols} gap-4 items-start`}>
      {cells.slice(0, block.layout).map((cell, i) => (
        <div
          key={cell?.id || `empty-${i}`}
          className={`relative min-w-0 rounded-lg ${!cell ? 'min-h-[140px]' : ''} ${
            interactive && !cell
              ? `border-2 border-dashed transition-colors ${dragOverIndex === i ? 'border-[#00676a] bg-[#00676a]/8' : 'border-gray-300 bg-gray-50/60'}`
              : ''
          }`}
          onDragOver={interactive ? (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverIndex(i);
          } : undefined}
          onDragLeave={interactive ? () => setDragOverIndex((cur) => (cur === i ? null : cur)) : undefined}
          onDrop={interactive ? (e) => acceptDrop(i, e) : undefined}
        >
          {cell ? (
            <div className="group/cell relative min-w-0">
              {interactive && pageId && onEjectGridCell && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEjectGridCell(pageId, block.id, i); }}
                  className="no-print opacity-0 group-hover/cell:opacity-100 absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full bg-white border border-gray-200 shadow text-gray-400 hover:text-red-500"
                  title="Move back to page"
                ><i className="fa-solid fa-xmark text-[11px]" /></button>
              )}
              <PreviewBlock
                block={cell}
                accent={accent}
                currency={currency}
                subtotal={totals.perBlockSubtotals[cell.id] ?? 0}
                totals={totals}
                readOnly={readOnly}
                onPatch={onPatch ? (p) => patchCell(i, p) : undefined}
                compact={compact}
              />
            </div>
          ) : interactive ? (
            <>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none py-6">
                <span className={`w-12 h-12 rounded-full border-2 border-dashed bg-white flex items-center justify-center shadow-sm ${
                  dragOverIndex === i ? 'border-[#00676a] text-[#00676a]' : 'border-gray-300 text-gray-400'
                }`}>
                  <i className="fa-solid fa-plus text-[18px]" />
                </span>
                <span className="text-[11px] text-gray-400 no-print">Drop section or tap +</span>
              </div>
              <button
                type="button"
                className="no-print absolute inset-0 z-10 cursor-pointer rounded-lg"
                aria-label="Add to grid cell"
                onClick={() => setPickerIndex(pickerIndex === i ? null : i)}
              />
              {pickerIndex === i && (
                <div className="no-print absolute z-30 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%-12px,240px)] rounded-xl border border-gray-200 bg-white shadow-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between px-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Add to cell</p>
                    <button type="button" onClick={() => setPickerIndex(null)} className="w-6 h-6 rounded text-gray-400 hover:bg-gray-100"><i className="fa-solid fa-xmark text-[11px]" /></button>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 px-0.5">New</p>
                  <div className="grid grid-cols-2 gap-1">
                    {GRID_CELL_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setCell(i, createBlock(t)); setPickerIndex(null); }}
                        className="rounded-lg border border-gray-100 px-2 py-1.5 text-[11px] font-semibold text-gray-600 hover:border-[#00676a] flex items-center gap-1.5"
                      >
                        <i className={`fa-solid ${CELL_META[t].icon}`} style={{ color: accent }} />
                        {CELL_META[t].label}
                      </button>
                    ))}
                  </div>
                  {existing.length > 0 && onMoveBlockIntoGridCell && pageId && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 px-0.5 pt-1">From this quote</p>
                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {existing.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => { onMoveBlockIntoGridCell(pageId, block.id, i, b.id); setPickerIndex(null); }}
                            className="w-full text-left rounded-lg border border-gray-100 px-2 py-1.5 text-[11px] font-semibold text-gray-600 hover:border-[#00676a] flex items-center gap-1.5"
                          >
                            <i className={`fa-solid ${CELL_META[b.type].icon}`} style={{ color: accent }} />
                            <span className="truncate">{b.title || CELL_META[b.type].label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ImageView({ block }: { block: ImageBlock }) {
  if (!block.url) return null;
  const wrap = block.align === 'center' ? 'mx-auto' : block.align === 'right' ? 'ml-auto' : '';
  const pct = block.widthPercent ?? (block.width === 'half' ? 50 : 100);
  return (
    <div className={wrap} style={{ width: `${pct}%` }}>
      <img src={block.url} alt={block.caption || ''} className="block w-full max-h-[760px] object-contain rounded-lg border border-gray-100" />
      {block.caption ? <p className="text-center text-[11px] text-gray-400 mt-1">{block.caption}</p> : null}
    </div>
  );
}

/* Priced line items — Amount = Qty × Rate, optional subtotal. Feeds totals.
 * `hideSubtotal` is set on every split slice except the LAST one covering
 * this block — the running subtotal only makes sense once all of the
 * block's rows have actually been shown. */
function ItemsView({ block, accent, currency, subtotal, hideSubtotal, compact }: { block: ItemsBlock; accent: string; currency: string; subtotal: number; hideSubtotal?: boolean; compact?: boolean }) {
  const wq = compact ? 'w-10' : 'w-16';
  const wm = compact ? 'w-[72px]' : 'w-28';
  return (
    <table className={`w-full table-fixed border-collapse break-words ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
      <thead>
        <tr style={{ background: `${accent}14` }}>
          <th className="border border-gray-200 px-2 py-1.5 font-bold text-left" style={{ color: accent }}>Description</th>
          <th className={`border border-gray-200 px-2 py-1.5 font-bold text-right ${wq}`} style={{ color: accent }}>{block.qtyLabel || 'Qty'}</th>
          <th className={`border border-gray-200 px-2 py-1.5 font-bold text-right ${wm}`} style={{ color: accent }}>{block.rateLabel || 'Rate'}</th>
          <th className={`border border-gray-200 px-2 py-1.5 font-bold text-right ${wm}`} style={{ color: accent }}>{block.amountLabel || 'Amount'}</th>
        </tr>
      </thead>
      <tbody>
        {block.items.map((it) => (
          <tr key={it.id}>
            <td className="border border-gray-200 px-2 py-1 text-gray-700">{it.description}</td>
            <td className="border border-gray-200 px-2 py-1 text-right text-gray-700">{it.qty}</td>
            <td className="border border-gray-200 px-2 py-1 text-right text-gray-700">{money(it.rate, currency)}</td>
            <td className="border border-gray-200 px-2 py-1 text-right font-medium text-gray-800">{money((Number(it.qty) || 0) * (Number(it.rate) || 0), currency)}</td>
          </tr>
        ))}
        {block.showSubtotal !== false && !hideSubtotal && (
          <tr>
            <td className="px-2 py-1.5 text-right font-semibold text-gray-600" colSpan={3}>Subtotal</td>
            <td className="px-2 py-1.5 text-right font-bold border-t-2" style={{ color: accent, borderColor: accent }}>{money(subtotal, currency)}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/* Free-form data grid — no calculations, never contributes to totals. */
function TableView({ block, accent, compact }: { block: TableBlock; accent: string; compact?: boolean }) {
  return (
    <table className={`w-full table-fixed border-collapse break-words ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
      <thead>
        <tr style={{ background: `${accent}14` }}>
          {block.columns.map((col, c) => (
            <th key={c} className="border border-gray-200 px-2 py-1.5 font-bold text-left" style={{ color: accent }}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {block.rows.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => (
              <td key={c} className="border border-gray-200 px-2 py-1 text-gray-700">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SummaryView({ block, accent, currency, totals, compact }: { block: SummaryBlock; accent: string; currency: string; totals: ReturnType<typeof computeTotals>; compact?: boolean }) {
  const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
    <div className={`flex items-center justify-between py-1.5 ${strong ? 'border-t-2 mt-1 pt-2' : 'border-b border-gray-100'}`} style={strong ? { borderColor: accent } : undefined}>
      <span className={strong ? 'font-bold text-[15px]' : 'text-[13px] text-gray-600'}>{label}</span>
      <span className={strong ? 'font-bold text-[20px]' : 'text-[13px] text-gray-800'} style={strong ? { color: accent } : undefined}>{value}</span>
    </div>
  );
  return (
    <div className={`ml-auto max-w-full ${compact ? 'w-full' : 'w-72'}`}>
      {block.showSubtotal !== false && <Row label={block.subtotalLabel || 'Subtotal'} value={money(totals.subtotal, currency)} />}
      {block.showDiscount !== false && totals.discount > 0 && <Row label={block.discountLabel || 'Discount'} value={`− ${money(totals.discount, currency)}`} />}
      {block.showGst !== false && <Row label={`${block.gstLabel || 'GST'} (${totals.gstPercent}%)`} value={money(totals.gstAmount, currency)} />}
      {block.showGrandTotal !== false && <Row label={block.grandTotalLabel || 'Grand Total'} value={money(totals.grandTotal, currency)} strong />}
    </div>
  );
}

function FieldsView({ block, accent }: { block: FieldsBlock; accent: string }) {
  return (
    <div className="space-y-1">
      {block.fields.map((f) => (
        <div key={f.id} className="flex gap-3 text-[13px] min-w-0">
          <span className="font-semibold text-gray-700 w-[120px] shrink-0 break-words" style={{ color: accent }}>{f.label}</span>
          <span className="text-gray-600 min-w-0 break-words">{f.value}</span>
        </div>
      ))}
    </div>
  );
}

function SignatureView({ block, accent }: { block: SignatureBlock; accent: string }) {
  const wrap = block.align === 'left' ? '' : block.align === 'center' ? 'mx-auto text-center' : 'ml-auto text-right';
  return (
    <div className={`w-56 max-w-full ${wrap}`}>
      {block.imageUrl ? <img src={block.imageUrl} alt="signature" className="h-16 w-auto object-contain mb-1" /> : <div className="h-12" />}
      <div className="border-t pt-1" style={{ borderColor: accent }}>
        {block.signerName ? <p className="font-semibold text-[13px] text-gray-800">{block.signerName}</p> : null}
        {block.signerTitle ? <p className="text-[11px] text-gray-500">{block.signerTitle}</p> : null}
        {block.place ? <p className="text-[11px] text-gray-500 mt-1">Place: {block.place}</p> : null}
        <p className="text-[11px] text-gray-500">{block.dateLabel || 'Date'}: ____________</p>
      </div>
    </div>
  );
}
