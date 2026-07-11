import { useMemo } from 'react';
import { RichText, EditableText, alignClass } from './RichText';
import { computeTotals } from './computeTotals';
import type {
  QuoteDoc, QuoteBlock, ItemsBlock, TextBlock, ImageBlock, TableBlock,
  SummaryBlock, FieldsBlock, SignatureBlock,
} from './quoteDoc';

const CURRENCIES: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number, currency: string) =>
  `${CURRENCIES[currency] ?? ''}${(isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Renders a QuoteDoc as A4 pages. Each page is a `.quote-page` div so the
 * existing html2canvas PDF export keeps working unchanged. The optional
 * inline editors (EditableText/RichText) remain so the page is still directly
 * editable, but the left form panel is the primary editing surface.
 */
export default function QuotePreview({
  doc, accent, currency, reference, onPatchMeta, onPatchBranding, onPatchBlock, onUpdate, onEditBlock,
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
}) {
  const totals = useMemo(() => computeTotals(doc), [doc]);

  // Footer Total only shows when the doc has no visible summary block, so old
  // docs keep their total where it was and new docs don't double-count.
  const hasSummary = doc.pages.some((p) => p.blocks.some((b) => b.type === 'summary' && !b.hidden));

  const noop = () => {};
  const patchMeta = onPatchMeta ?? noop;
  const patchBranding = onPatchBranding ?? noop;

  return (
    <>
      {doc.pages.map((page, pageIdx) => (
        <div
          key={page.id}
          className="quote-page relative bg-white shadow-xl w-[794px] max-w-full min-h-[1123px] shrink-0 flex flex-col"
          style={{ borderTop: `6px solid ${accent}` }}
        >
          {/* abstract background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{ backgroundImage: 'url(/bg_images/watercolor-wallpaper-with-hand-drawn-elements.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div
            className="absolute -top-px right-0 w-40 h-40 pointer-events-none opacity-10"
            style={{ background: `radial-gradient(circle at top right, ${accent}, transparent 70%)` }}
          />

          <div className="relative z-10 flex-1 flex flex-col p-8 sm:p-12">
            {/* Branding header — first page only */}
            {pageIdx === 0 && doc.branding.showHeader && (
              <div className="flex items-start justify-between gap-6 pb-6 mb-6 border-b" style={{ borderColor: `${accent}33` }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    {doc.branding.logoUrl ? (
                      <img src={doc.branding.logoUrl} alt="logo" className="h-12 w-auto object-contain" />
                    ) : null}
                    <EditableText as="h2" value={doc.branding.name} onChange={(v) => patchBranding({ name: v })} className="font-sans font-bold text-3xl" style={{ color: accent }} placeholder="Company name" />
                  </div>
                  <EditableText value={doc.branding.tagline || ''} onChange={(v) => patchBranding({ tagline: v })} className="text-[12px] text-gray-500 mt-0.5" placeholder="Tagline" />
                  <div className="mt-3 text-[12px] text-gray-600 leading-relaxed">
                    {doc.branding.addressLines.map((line, i) => (
                      <EditableText
                        key={i}
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
                    <EditableText as="span" value={doc.branding.phone || ''} onChange={(v) => patchBranding({ phone: v })} className="inline-block" placeholder="Phone" />
                    <EditableText as="span" value={doc.branding.email || ''} onChange={(v) => patchBranding({ email: v })} className="inline-block" placeholder="Email" />
                    <EditableText as="span" value={doc.branding.website || ''} onChange={(v) => patchBranding({ website: v })} className="inline-block" placeholder="Website" />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <EditableText as="h1" value={doc.meta.quoteTitle} onChange={(v) => patchMeta({ quoteTitle: v })} className="font-sans font-bold text-2xl tracking-wide uppercase" style={{ color: accent }} placeholder="Quotation" />
                  <p className="text-[12px] text-gray-500 mt-1">Ref: {reference || '— (save to generate)'}</p>
                  <div className="text-[12px] text-gray-600 mt-1">Date: {doc.meta.date}</div>
                  <p className="text-[12px] text-gray-600">Valid for {doc.meta.validityDays} days</p>
                  {doc.branding.gstin ? (
                    <p className="text-[11px] text-gray-400 mt-1">GSTIN: {doc.branding.gstin}</p>
                  ) : null}
                </div>
              </div>
            )}

            {/* Bill-to — first page only */}
            {pageIdx === 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Prepared for</p>
                <EditableText value={doc.meta.clientName} onChange={(v) => patchMeta({ clientName: v })} className="font-semibold text-[15px] text-gray-800" placeholder="Client name" />
                <EditableText value={doc.meta.clientEmail} onChange={(v) => patchMeta({ clientEmail: v })} className="text-[12px] text-gray-500" placeholder="Client email" />
                <EditableText value={doc.meta.clientAddress} onChange={(v) => patchMeta({ clientAddress: v })} className="text-[12px] text-gray-500" placeholder="Client address (optional)" />
              </div>
            )}

            {/* Blocks */}
            <div className="flex-1 space-y-6">
              {page.blocks.filter((b) => !b.hidden).map((block) => (
                <div
                  key={block.id}
                  onDoubleClick={onEditBlock ? () => onEditBlock(page.id, block.id) : undefined}
                  className={onEditBlock ? 'group/sec relative rounded-lg hover:ring-2 hover:ring-[#00676a]/15 hover:ring-offset-4 transition-shadow' : undefined}
                  title={onEditBlock ? 'Double-click to edit this section' : undefined}
                >
                  {onEditBlock && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditBlock(page.id, block.id); }}
                      className="no-print opacity-0 group-hover/sec:opacity-100 absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full bg-white border border-gray-200 shadow text-gray-500 hover:text-[#00676a] transition-opacity"
                      title="Edit in side panel"
                    ><i className="fa-solid fa-pen text-[11px]" /></button>
                  )}
                  <PreviewBlock
                    block={block}
                    accent={accent}
                    currency={currency}
                    subtotal={totals.perBlockSubtotals[block.id] ?? 0}
                    totals={totals}
                    onPatch={onPatchBlock ? (p) => onPatchBlock(page.id, block.id, p) : undefined}
                  />
                </div>
              ))}
            </div>

            {/* Footer Total — only when no summary block owns the total */}
            {pageIdx === doc.pages.length - 1 && !hasSummary && (
              <div className="mt-8 flex justify-end">
                <div className="w-64 border-t-2 pt-3 flex items-center justify-between" style={{ borderColor: accent }}>
                  <span className="font-bold text-[15px]">Total</span>
                  <span className="font-bold text-[22px]" style={{ color: accent }}>{money(totals.grandTotal, currency)}</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-6">
              <EditableText value={doc.footerText} onChange={(v) => onUpdate?.({ ...doc, footerText: v })} className="text-center text-[11px] text-gray-400 border-t pt-3" style={{ borderColor: '#eee' }} placeholder="Footer text" />
              <p className="text-center text-[10px] text-gray-300 mt-1">Page {pageIdx + 1} of {doc.pages.length}</p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------- per-block renderer ---------- */
function PreviewBlock({
  block, accent, currency, subtotal, totals, onPatch,
}: {
  block: QuoteBlock; accent: string; currency: string; subtotal: number;
  totals: ReturnType<typeof computeTotals>;
  onPatch?: (p: Partial<QuoteBlock>) => void;
}) {
  const patch = onPatch ?? (() => {});
  return (
    <div className="relative">
      {block.title ? (
        <EditableText
          value={block.title}
          onChange={(v) => patch({ title: v })}
          className={`font-bold text-[15px] mb-1.5 ${alignClass(block.align)}`}
          style={{ color: accent }}
          placeholder="Section title"
        />
      ) : null}

      {block.type === 'items' && <ItemsView block={block as ItemsBlock} accent={accent} currency={currency} subtotal={subtotal} />}
      {block.type === 'text' && (
        <RichText html={(block as TextBlock).text} align={block.align} accent={accent} onChange={(v) => patch({ text: v } as Partial<QuoteBlock>)} />
      )}
      {block.type === 'image' && <ImageView block={block as ImageBlock} />}
      {block.type === 'table' && <TableView block={block as TableBlock} accent={accent} />}
      {block.type === 'summary' && <SummaryView block={block as SummaryBlock} accent={accent} currency={currency} totals={totals} />}
      {block.type === 'fields' && <FieldsView block={block as FieldsBlock} accent={accent} />}
      {block.type === 'signature' && <SignatureView block={block as SignatureBlock} accent={accent} />}
    </div>
  );
}

function ImageView({ block }: { block: ImageBlock }) {
  if (!block.url) return null;
  const wrap = block.align === 'center' ? 'mx-auto' : block.align === 'right' ? 'ml-auto' : '';
  const pct = block.widthPercent ?? (block.width === 'half' ? 50 : 100);
  return (
    <div className={wrap} style={{ width: `${pct}%` }}>
      <img src={block.url} alt={block.caption || ''} className="w-full rounded-lg border border-gray-100" />
      {block.caption ? <p className="text-center text-[11px] text-gray-400 mt-1">{block.caption}</p> : null}
    </div>
  );
}

/* Priced line items — Amount = Qty × Rate, optional subtotal. Feeds totals. */
function ItemsView({ block, accent, currency, subtotal }: { block: ItemsBlock; accent: string; currency: string; subtotal: number }) {
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr style={{ background: `${accent}14` }}>
          <th className="border border-gray-200 px-2 py-1.5 font-bold text-left" style={{ color: accent }}>Description</th>
          <th className="border border-gray-200 px-2 py-1.5 font-bold text-right w-16" style={{ color: accent }}>{block.qtyLabel || 'Qty'}</th>
          <th className="border border-gray-200 px-2 py-1.5 font-bold text-right w-28" style={{ color: accent }}>{block.rateLabel || 'Rate'}</th>
          <th className="border border-gray-200 px-2 py-1.5 font-bold text-right w-28" style={{ color: accent }}>{block.amountLabel || 'Amount'}</th>
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
        {block.showSubtotal !== false && (
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
function TableView({ block, accent }: { block: TableBlock; accent: string }) {
  return (
    <table className="w-full border-collapse text-[13px]">
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

function SummaryView({ block, accent, currency, totals }: { block: SummaryBlock; accent: string; currency: string; totals: ReturnType<typeof computeTotals> }) {
  const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
    <div className={`flex items-center justify-between py-1.5 ${strong ? 'border-t-2 mt-1 pt-2' : 'border-b border-gray-100'}`} style={strong ? { borderColor: accent } : undefined}>
      <span className={strong ? 'font-bold text-[15px]' : 'text-[13px] text-gray-600'}>{label}</span>
      <span className={strong ? 'font-bold text-[20px]' : 'text-[13px] text-gray-800'} style={strong ? { color: accent } : undefined}>{value}</span>
    </div>
  );
  return (
    <div className="ml-auto w-72">
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
        <div key={f.id} className="flex gap-3 text-[13px]">
          <span className="font-semibold text-gray-700 min-w-[120px]" style={{ color: accent }}>{f.label}</span>
          <span className="text-gray-600">{f.value}</span>
        </div>
      ))}
    </div>
  );
}

function SignatureView({ block, accent }: { block: SignatureBlock; accent: string }) {
  const wrap = block.align === 'left' ? '' : block.align === 'center' ? 'mx-auto text-center' : 'ml-auto text-right';
  return (
    <div className={`w-56 ${wrap}`}>
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
