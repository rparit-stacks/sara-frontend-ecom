import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { projectApi, clientProjectApi } from '@/lib/api';
import { formatInquiryDate } from '@/components/inquiry/inquiryUtils';
import { Sym } from '@/components/portal/Sym';
import { Pill } from '@/components/portal/Pill';
import QuoteViewerModal from '@/components/portal/QuoteViewerModal';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number, c = 'INR') => `${CUR[c] ?? ''}${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAYMENT_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PAID: { bg: '#2e7d3220', color: '#2e7d32', label: 'Paid' },
  PENDING: { bg: '#9e9e9e20', color: '#757575', label: 'Pending' },
  FAILED: { bg: '#c6282820', color: '#c62828', label: 'Failed' },
};

function formatAttemptDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Real-time "Project Financial Overview" — the live quotation shown purely for reference,
 * every invoice for the project, and the total actually collected (PAID only). Never shows
 * a remaining/outstanding/pending amount derived from the quote: quotation, invoices and
 * payments are independent entities by design.
 */
export default function FinancialOverviewPanel({ mode, projectCode, projectClosed }: { mode: 'admin' | 'client'; projectCode: string; projectClosed?: boolean }) {
  const [viewingQuoteId, setViewingQuoteId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['financial-overview', mode, projectCode],
    queryFn: () => (mode === 'client' ? clientProjectApi : projectApi).getFinancialOverview(projectCode),
    enabled: !!projectCode,
  });

  const download = async () => {
    const root = printRef.current;
    if (!root) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(root, {
        scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
        ignoreElements: (el) => (el as HTMLElement).classList?.contains('no-print'),
      });
      const img = canvas.toDataURL('image/jpeg', 0.96);
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      let w = pw, h = (canvas.height * pw) / canvas.width;
      if (h > ph) { h = ph; w = (canvas.width * ph) / canvas.height; }
      pdf.addImage(img, 'JPEG', (pw - w) / 2, 0, w, h);
      pdf.save(`${projectCode}-financial-overview.pdf`);
    } catch (e) {
      toast.error((e as Error).message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
        <Sym name="progress_activity" className="text-[28px] animate-spin" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{data.projectCode} — Financial Overview</p>
          {data.status && <Pill label={data.status} />}
        </div>
        {projectClosed ? (
          <button
            onClick={download}
            disabled={downloading}
            className="h-8 px-3 rounded-lg text-[12px] font-semibold border flex items-center gap-1.5 disabled:opacity-50"
            style={{ borderColor: 'var(--p-outline-variant)' }}
          >
            <Sym name="download" className="text-[16px]" /> {downloading ? 'Preparing…' : 'Download'}
          </button>
        ) : (
          <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>Download will be available when the project is closed.</p>
        )}
      </div>

      <div ref={printRef} className="space-y-5 bg-white">
      <section className="border rounded-xl p-4" style={{ borderColor: 'var(--p-outline-variant)' }}>
        <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--p-on-surface-variant)' }}>Live quotation</p>
        {data.liveQuotation ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold text-[14px]">{data.liveQuotation.reference} — {money(data.liveQuotation.total, data.liveQuotation.currency)}</p>
              <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                {data.liveQuotation.title}{data.liveQuotation.createdAt ? ` · ${formatInquiryDate(data.liveQuotation.createdAt)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {data.quotationHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="text-[13px] font-bold hover:underline no-print"
                  style={{ color: 'var(--p-on-surface-variant)' }}
                >
                  Quotation history ({data.quotationHistory.length}) →
                </button>
              )}
              <button
                onClick={() => setViewingQuoteId(data.liveQuotation!.id)}
                className="text-[13px] font-bold hover:underline no-print"
                style={{ color: 'var(--p-primary)' }}
              >
                View full quotation →
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>No quotation yet for this project.</p>
        )}

        {showHistory && data.quotationHistory.length > 0 && (
          <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Superseded revisions</p>
            {data.quotationHistory.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-3 text-[13px]">
                <span>{q.reference} — {money(q.total, q.currency)} <span style={{ color: 'var(--p-on-surface-variant)' }}>({q.status})</span></span>
                <button onClick={() => setViewingQuoteId(q.id)} className="font-bold hover:underline no-print" style={{ color: 'var(--p-primary)' }}>View →</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Invoices &amp; payments</p>
        </div>
        {data.invoices.length === 0 ? (
          <p className="text-center text-[13px] py-10" style={{ color: 'var(--p-on-surface-variant)' }}>No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr style={{ background: 'var(--p-surface-container-low)' }}>
                  {['Invoice', 'Title', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv, i) => (
                  <tr key={inv.id} style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                    <td className="px-4 py-2.5 font-semibold text-[13px]">{inv.reference}</td>
                    <td className="px-4 py-2.5 text-[13px]">{inv.title}</td>
                    <td className="px-4 py-2.5 font-bold text-[13px]">{money(inv.amount, inv.currency)}</td>
                    <td className="px-4 py-2.5"><Pill label={inv.status} /></td>
                    <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{inv.createdAt ? formatInquiryDate(inv.createdAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
          <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Total collected so far</p>
          <p className="font-bold text-[18px]" style={{ color: 'var(--p-secondary)' }}>{money(data.totalCollected, data.currency)}</p>
        </div>
      </section>

      <section className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Payment history</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>Every payment attempt for this project — including failed ones, kept forever.</p>
        </div>
        {data.paymentHistory.length === 0 ? (
          <p className="text-center text-[13px] py-10" style={{ color: 'var(--p-on-surface-variant)' }}>No payment attempts recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr style={{ background: 'var(--p-surface-container-low)' }}>
                  {['Payer', 'Amount', 'Status', 'Link', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.paymentHistory.map((p, i) => {
                  const status = PAYMENT_STATUS_STYLE[p.status] ?? PAYMENT_STATUS_STYLE.PENDING;
                  return (
                    <tr key={p.id} style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                      <td className="px-4 py-2.5 text-[13px] font-semibold">
                        {p.payerName || '—'}
                        {p.payerEmail && <span className="text-[11px] font-normal" style={{ color: 'var(--p-on-surface-variant)' }}> · {p.payerEmail}</span>}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-[13px]">{money(p.amount, p.currency)}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] font-mono" style={{ color: 'var(--p-on-surface-variant)' }}>{p.linkCode || '—'}</td>
                      <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{formatAttemptDate(p.paidAt || p.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </div>

      {viewingQuoteId != null && (
        <QuoteViewerModal
          open
          onClose={() => setViewingQuoteId(null)}
          mode={mode}
          projectCode={projectCode}
          quoteId={viewingQuoteId}
        />
      )}
    </div>
  );
}
