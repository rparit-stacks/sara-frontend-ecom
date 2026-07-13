import { normalizeQuoteDoc, type QuoteDoc, type ItemsBlock, type TextBlock } from './quoteDoc';
import { computeTotals } from './computeTotals';
import type { ManufacturingInvoiceDto } from '@/lib/api';

const CURRENCIES: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number, c = 'INR') =>
  `${CURRENCIES[c] ?? ''}${(isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Strip HTML to readable text for the notes/terms lines. */
const stripHtml = (html: string) => html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

/**
 * A self-contained, printable, branded invoice document (single A4 page,
 * `.quote-page` so the html2canvas PDF path works). It pulls the line items and
 * totals from the quote snapshot the invoice carries — it does NOT reuse the
 * quote editor preview, so there are no duplicate headers / stray sections.
 */
export default function InvoiceDocument({ invoice, txnId }: { invoice: ManufacturingInvoiceDto; txnId?: string }) {
  const doc: QuoteDoc = normalizeQuoteDoc(invoice.doc ?? {}, null);
  const accent = doc.accent || '#00676a';
  const cur = invoice.currency || 'INR';
  const branding = doc.branding;
  const paid = invoice.status === 'PAID';
  const dateStr = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const paidAtStr = paid && invoice.updatedAt
    ? new Date(invoice.updatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  // Line items across all pages.
  const items = doc.pages.flatMap((p) => p.blocks)
    .filter((b) => b.type === 'items' && !b.hidden)
    .flatMap((b) => (b as ItemsBlock).items || []);

  const totals = computeTotals(doc);

  // First text block → notes/terms.
  const notes = doc.pages.flatMap((p) => p.blocks)
    .filter((b) => b.type === 'text' && !b.hidden)
    .map((b) => ({ title: b.title, text: stripHtml((b as TextBlock).text || '') }))
    .filter((n) => n.text);

  const addressLines = (branding.addressLines || []).filter(Boolean);

  return (
    <div
      className="quote-page relative bg-white shadow-xl w-[794px] max-w-full min-h-[1123px] shrink-0 flex flex-col"
      style={{ borderTop: `6px solid ${accent}`, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
    >
      <div className="flex-1 flex flex-col p-10 sm:p-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 pb-6 border-b-2" style={{ borderColor: accent }}>
          <div className="min-w-0">
            {branding.logoUrl ? <img src={branding.logoUrl} alt="" className="h-12 w-auto object-contain mb-2" /> : null}
            <h1 className="text-[24px] font-bold leading-tight" style={{ color: accent }}>{branding.name || 'Studio Sara'}</h1>
            {branding.tagline && <p className="text-[12px] text-gray-500">{branding.tagline}</p>}
            <div className="text-[11px] text-gray-500 mt-2 leading-relaxed">
              {addressLines.map((l, i) => <div key={i}>{l}</div>)}
              <div className="mt-1 space-x-2">
                {branding.phone && <span>{branding.phone}</span>}
                {branding.email && <span>· {branding.email}</span>}
              </div>
              {branding.gstin && <div className="mt-1">GSTIN: {branding.gstin}</div>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[13px] font-bold uppercase tracking-[4px]" style={{ color: accent }}>Invoice</div>
            <p className="text-[18px] font-bold text-gray-800 mt-1">{invoice.reference}</p>
            {invoice.quoteReference && <p className="text-[12px] text-gray-500">Against quote {invoice.quoteReference}</p>}
            {dateStr && <p className="text-[12px] text-gray-500">Date: {dateStr}</p>}
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-bold"
              style={{ background: paid ? '#e7f3e7' : '#fbeee0', color: paid ? '#2e7d32' : accent }}>
              {paid ? 'PAID' : 'PAYMENT DUE'}
            </span>
          </div>
        </div>

        {/* Billed to */}
        <div className="flex items-start justify-between gap-6 mt-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Billed to</p>
            <p className="font-semibold text-[15px] text-gray-800">{invoice.clientName || doc.meta.clientName || '—'}</p>
            {(invoice.clientEmail || doc.meta.clientEmail) && <p className="text-[12px] text-gray-500">{invoice.clientEmail || doc.meta.clientEmail}</p>}
            {doc.meta.clientAddress && <p className="text-[12px] text-gray-500 whitespace-pre-line">{doc.meta.clientAddress}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">For</p>
            <p className="font-semibold text-[14px] text-gray-800">{invoice.title}</p>
          </div>
        </div>

        {/* Items table */}
        <div className="mt-6">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ background: accent, color: '#fff' }}>
                <th className="text-left font-semibold px-3 py-2.5">Description</th>
                <th className="text-right font-semibold px-3 py-2.5 w-16">Qty</th>
                <th className="text-right font-semibold px-3 py-2.5 w-28">Rate</th>
                <th className="text-right font-semibold px-3 py-2.5 w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-400 border-b border-gray-100">{invoice.title || 'Invoice item'}</td></tr>
              ) : items.map((it, i) => (
                <tr key={it.id || i} style={{ background: i % 2 ? '#faf7f1' : '#fff' }}>
                  <td className="px-3 py-2.5 text-gray-800 border-b border-gray-100">{it.description}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600 border-b border-gray-100">{it.qty}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600 border-b border-gray-100">{money(it.rate, cur)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-gray-800 border-b border-gray-100">{money((Number(it.qty) || 0) * (Number(it.rate) || 0), cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Breakdown */}
        <div className="mt-5 flex justify-end">
          <div className="w-72 text-[13px]">
            {items.length > 0 && (
              <>
                <Row label="Subtotal" value={money(totals.subtotal, cur)} />
                {totals.discount > 0 && <Row label="Discount" value={`− ${money(totals.discount, cur)}`} />}
                {totals.gstPercent > 0 && <Row label={`GST (${totals.gstPercent}%)`} value={money(totals.gstAmount, cur)} />}
                <div className="flex items-center justify-between py-2 mt-1 border-t-2" style={{ borderColor: accent }}>
                  <span className="font-bold text-[14px]">Invoice total</span>
                  <span className="font-bold text-[15px] text-gray-800">{money(totals.grandTotal, cur)}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between px-3 py-3 mt-2 rounded-lg" style={{ background: `${accent}12` }}>
              <span className="font-bold text-[15px]" style={{ color: accent }}>{paid ? 'Amount paid' : 'Amount due'}</span>
              <span className="font-bold text-[22px]" style={{ color: accent }}>{money(invoice.amount, cur)}</span>
            </div>
          </div>
        </div>

        {/* Payment meta */}
        <div className="mt-5 rounded-lg p-4 text-[12px] grid grid-cols-2 gap-y-1.5 gap-x-6" style={{ background: '#faf7f1' }}>
          <Meta label="Payment status" value={paid ? 'Paid' : 'Pending'} />
          <Meta label="Payment method" value={paid ? 'Razorpay' : '—'} />
          {paidAtStr && <Meta label="Paid on" value={paidAtStr} />}
          {txnId && <Meta label="Transaction ID" value={txnId} />}
          {invoice.quoteReference && <Meta label="Quotation" value={invoice.quoteReference} />}
        </div>

        {/* Notes / terms */}
        {notes.length > 0 && (
          <div className="mt-6 space-y-3">
            {notes.map((n, i) => (
              <div key={i}>
                {n.title && <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: accent }}>{n.title}</p>}
                <p className="text-[12px] text-gray-600 whitespace-pre-line leading-relaxed">{n.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-8 text-center">
          <p className="text-[11px] text-gray-400 border-t pt-3" style={{ borderColor: '#eee' }}>
            {doc.footerText || `Thank you for choosing ${branding.name || 'Studio Sara'}.`}
          </p>
          {(branding.email || branding.phone) && (
            <p className="text-[10px] text-gray-400 mt-1">
              Need help? {branding.email}{branding.email && branding.phone ? ' · ' : ''}{branding.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between py-1.5 border-b border-gray-100"><span className="text-gray-500">{label}</span><span className="font-medium text-gray-800">{value}</span></div>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-gray-500">{label}</span><span className="font-medium text-gray-800">{value}</span></div>;
}
