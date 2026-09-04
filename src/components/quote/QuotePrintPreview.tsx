import { useEffect, useMemo } from 'react';
import { PreviewBlock } from './QuotePreview';
import { computeTotals } from './computeTotals';
import { useQuotePagination } from './useQuotePagination';
import type { QuoteDoc } from './quoteDoc';

const CURRENCIES: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number, currency: string) =>
  `${CURRENCIES[currency] ?? ''}${(isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Read-only, auto-paginated render of a QuoteDoc — this is what PDF export
 * and the "Preview" action actually produce, as opposed to QuotePreview's
 * authoring view (editable, one `.quote-page` per AUTHORING page, no overflow
 * handling). Every `.quote-page` here is guaranteed to fit real A4 content
 * height, because useQuotePagination measured it — an oversized items/table
 * block has already been split across as many pages as it needs.
 *
 * `onReady(pageCount)` fires once pagination finishes, so callers building a
 * PDF know when it's safe to start rasterizing `.quote-page` nodes.
 */
export default function QuotePrintPreview({
  doc, accent, currency, reference, onReady,
}: {
  doc: QuoteDoc;
  accent: string;
  currency: string;
  reference: string | null;
  onReady?: (pageCount: number) => void;
}) {
  const totals = useMemo(() => computeTotals(doc), [doc]);
  const hasSummary = doc.pages.some((p) => p.blocks.some((b) => b.type === 'summary' && !b.hidden));
  const layoutPages = useQuotePagination(doc, accent, currency);

  useEffect(() => {
    if (layoutPages) onReady?.(layoutPages.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutPages]);

  if (!layoutPages) {
    return (
      <div className="w-[794px] max-w-full min-h-[1123px] flex items-center justify-center text-gray-400">
        <i className="fa-solid fa-spinner fa-spin text-2xl" />
      </div>
    );
  }

  return (
    <>
      {layoutPages.map((page, pageIdx) => (
        <div
          key={pageIdx}
          className="quote-page relative bg-white shadow-xl w-[794px] max-w-full shrink-0 flex flex-col"
          style={{ borderTop: `6px solid ${accent}`, height: 1123 }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{ backgroundImage: 'url(/bg_images/watercolor-wallpaper-with-hand-drawn-elements.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div
            className="absolute -top-px right-0 w-40 h-40 pointer-events-none opacity-10"
            style={{ background: `radial-gradient(circle at top right, ${accent}, transparent 70%)` }}
          />

          <div className="relative z-10 flex-1 flex flex-col p-8 sm:p-12 overflow-hidden">
            {page.showBrandingHeader && (
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
                  <p className="text-[12px] text-gray-500 mt-1">Ref: {reference || '— (save to generate)'}</p>
                  <div className="text-[12px] text-gray-600 mt-1">Date: {doc.meta.date}</div>
                  <p className="text-[12px] text-gray-600">Valid for {doc.meta.validityDays} days</p>
                  {doc.branding.gstin ? <p className="text-[11px] text-gray-400 mt-1">GSTIN: {doc.branding.gstin}</p> : null}
                </div>
              </div>
            )}

            {page.showBillTo && (
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Prepared for</p>
                <p className="font-semibold text-[15px] text-gray-800">{doc.meta.clientName}</p>
                <p className="text-[12px] text-gray-500">{doc.meta.clientEmail}</p>
                <p className="text-[12px] text-gray-500">{doc.meta.clientAddress}</p>
              </div>
            )}

            <div className="flex-1 space-y-6 min-h-0">
              {page.blocks.map(({ key, block, isContinuation, isFinalSlice }) => (
                <PreviewBlock
                  key={key}
                  block={block}
                  accent={accent}
                  currency={currency}
                  subtotal={totals.perBlockSubtotals[block.id] ?? 0}
                  totals={totals}
                  readOnly
                  isContinuation={isContinuation}
                  isFinalSlice={isFinalSlice}
                />
              ))}
            </div>

            {pageIdx === layoutPages.length - 1 && !hasSummary && (
              <div className="mt-8 flex justify-end">
                <div className="w-64 border-t-2 pt-3 flex items-center justify-between" style={{ borderColor: accent }}>
                  <span className="font-bold text-[15px]">Total</span>
                  <span className="font-bold text-[22px]" style={{ color: accent }}>{money(totals.grandTotal, currency)}</span>
                </div>
              </div>
            )}

            <div className="mt-auto pt-6">
              <p className="text-center text-[11px] text-gray-400 border-t pt-3" style={{ borderColor: '#eee' }}>{doc.footerText}</p>
              <p className="text-center text-[10px] text-gray-300 mt-1">Page {pageIdx + 1} of {layoutPages.length}</p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
