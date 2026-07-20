import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sym } from '@/components/portal/Sym';
import { Pill } from '@/components/portal/Pill';
import InvoiceViewerModal from '@/components/portal/InvoiceViewerModal';
import { invoiceApi, type ManufacturingInvoiceDto, type ManufacturingProjectDetailDto } from '@/lib/api';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number | undefined, c?: string) =>
  `${CUR[c || 'INR'] ?? ''}${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusTone = (s: string): { bg: string; fg: string } => {
  const k = s.toUpperCase();
  if (k === 'PAID') return { bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' };
  if (k === 'OVERDUE' || k === 'CANCELLED') return { bg: 'var(--p-error-container)', fg: 'var(--p-on-error-container)' };
  return { bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface-variant)' };
};

/**
 * In-workspace Invoices — same shell as the Brief/Quotation panels (no redirect).
 * Lists every invoice for the project with status + amount, and a button to open
 * the full invoice document.
 */
export default function ProjectInvoicesPanel({ project, clientMode }: { project: ManufacturingProjectDetailDto; clientMode?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewing, setViewing] = useState<ManufacturingInvoiceDto | null>(null);
  const invoices = project.invoices || [];
  const cancelInvoice = useMutation({
    mutationFn: (id: number) => invoiceApi.cancel(id),
    onSuccess: (cancelled) => {
      setViewing(null);
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-project-financials'] });
      queryClient.invalidateQueries({ queryKey: ['admin-project-shell'] });
      queryClient.invalidateQueries({ queryKey: ['client-project-financials'] });
      queryClient.invalidateQueries({ queryKey: ['client-project-shell'] });
      queryClient.invalidateQueries({ queryKey: ['client-portal-aggregate'] });
      toast.success(`Invoice ${cancelled.reference} cancelled`);
    },
    onError: (error) => toast.error((error as Error).message || 'Could not cancel invoice'),
  });

  const confirmCancel = (invoice: ManufacturingInvoiceDto) => {
    if (!window.confirm(
      `Cancel invoice ${invoice.reference}? Its payment link will stop working and this amount will become available to invoice again.`,
    )) return;
    cancelInvoice.mutate(invoice.id);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-[20px]">Invoices</h2>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>Advance & balance invoices for this project.</p>
          </div>
          {!clientMode && (
            <button
              type="button"
              onClick={() => navigate(`/portal-admin/invoices?inquiry=${project.inquiryId}`)}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-1.5"
              style={{ background: 'var(--p-primary)' }}
            >
              <Sym name="add" className="text-[16px]" /> New / manage invoices
            </button>
          )}
        </div>

        {invoices.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
            <Sym name="receipt_long" className="text-[40px] opacity-40" />
            <p className="mt-2 font-semibold">No invoices yet</p>
            <p className="text-[13px]">Raise an advance or balance invoice from a quotation.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => {
              const tone = statusTone(inv.status);
              const cancelled = inv.status?.toUpperCase() === 'CANCELLED';
              return (
                <div
                  key={inv.id}
                  className="border rounded-xl p-4 flex flex-wrap items-center gap-4"
                  style={{
                    borderColor: cancelled ? 'var(--p-error)' : 'var(--p-outline-variant)',
                    background: cancelled ? 'var(--p-error-container)' : 'var(--p-surface-container-lowest)',
                  }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--p-surface-container-high)' }}>
                    <Sym name="receipt_long" className="text-[20px]" style={{ color: 'var(--p-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[14px]">{inv.reference}</span>
                      <Pill label={inv.status} tone={tone} />
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
                      {inv.title || 'Invoice'}{inv.quoteReference ? ` · from ${inv.quoteReference}` : ''}
                      {cancelled ? ' · Not included in payable balance' : ''}
                    </p>
                  </div>
                  <p className="font-bold text-[15px]">{money(inv.amount, inv.currency)}</p>
                  <button
                    type="button"
                    onClick={() => setViewing(inv)}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border"
                    style={{ borderColor: 'var(--p-outline)', color: 'var(--p-primary)' }}
                  >
                    View / PDF
                  </button>
                  {!clientMode && inv.status?.toUpperCase() === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => confirmCancel(inv)}
                      disabled={cancelInvoice.isPending}
                      className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border disabled:opacity-50"
                      style={{ borderColor: 'var(--p-error)', color: 'var(--p-error)' }}
                    >
                      {cancelInvoice.isPending && cancelInvoice.variables === inv.id ? 'Cancelling…' : 'Cancel invoice'}
                    </button>
                  )}
                  {clientMode && inv.status?.toUpperCase() === 'PENDING' && (
                    inv.paymentLinkCode ? (
                      <a
                        href={`/pay/${encodeURIComponent(inv.paymentLinkCode)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-1.5"
                        style={{ background: 'var(--p-primary)' }}
                      >
                        <Sym name="payments" className="text-[16px]" /> Pay now
                      </a>
                    ) : (
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--p-on-surface-variant)' }}>
                        Payment link not available yet
                      </span>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {viewing && <InvoiceViewerModal invoice={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
