import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PortalShell from '@/components/portal/PortalShell';
import PortalEmptyInquiry from '@/components/portal/PortalEmptyInquiry';
import { Sym } from '@/components/portal/Sym';
import { clientProjectApi } from '@/lib/api';
import { useClientPortalAggregate } from '@/hooks/useClientPortalAggregate';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n?: number, c = 'INR') => (n == null ? '—' : `${CUR[c] ?? ''}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PAID: { bg: 'var(--p-secondary-container)', color: 'var(--p-on-secondary-container)', label: 'Paid' },
  PENDING: { bg: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)', label: 'Pending' },
  FAILED: { bg: 'var(--p-error-container)', color: 'var(--p-on-error-container)', label: 'Failed' },
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PortalPaymentHistory() {
  const [query, setQuery] = useState('');
  const { projects } = useClientPortalAggregate();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['client-payment-history'],
    queryFn: () => clientProjectApi.paymentHistory(),
    staleTime: 30_000,
  });

  const projectTitleByCode = useMemo(
    () => new Map(projects.map((p) => [p.code, p.title?.trim() || 'Untitled project'])),
    [projects],
  );

  const q = query.trim().toLowerCase();
  const shown = payments.filter((p) => {
    if (!q) return true;
    const hay = [p.invoiceReference, p.quoteReference, p.projectCode, projectTitleByCode.get(p.projectCode || '')]
      .filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });

  return (
    <PortalShell active="home">
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="h-14 px-6 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <Sym name="history" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
          <h2 className="font-display text-[18px]">Payment history</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl">
            {isLoading ? (
              <div className="flex justify-center py-20"><Sym name="progress_activity" className="text-[28px] animate-spin" /></div>
            ) : projects.length === 0 ? (
              <PortalEmptyInquiry compact />
            ) : (
              <>
                <div className="flex items-center gap-2 mb-5">
                  <div className="relative">
                    <Sym name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search project, invoice…"
                      className="pl-8 pr-3 py-1.5 rounded-lg text-[13px] w-72 outline-none border"
                      style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                    />
                  </div>
                </div>

                {shown.length === 0 ? (
                  <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
                    <Sym name="history" className="text-[40px] opacity-40" />
                    <p className="mt-2 font-semibold">{q ? `No payments match "${query}".` : 'No payments yet'}</p>
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-hidden overflow-x-auto" style={{ borderColor: 'var(--p-outline-variant)' }}>
                    <table className="w-full text-left border-collapse min-w-[720px]">
                      <thead>
                        <tr style={{ background: 'var(--p-surface-container-low)' }}>
                          {['Project', 'Invoice', 'Amount', 'Status', 'Paid on', 'Transaction ref'].map((h) => (
                            <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {shown.map((p, i) => {
                          const status = STATUS_STYLE[p.status] ?? STATUS_STYLE.PENDING;
                          return (
                            <tr key={p.id} style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                              <td className="px-4 py-3 text-[13px] font-semibold">
                                {(p.projectCode && projectTitleByCode.get(p.projectCode)) || p.projectCode || '—'}
                              </td>
                              <td className="px-4 py-3 text-[12px] font-mono">{p.invoiceReference || '—'}</td>
                              <td className="px-4 py-3 font-bold text-[13px]">{money(p.amount, p.currency)}</td>
                              <td className="px-4 py-3">
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>
                                  {status.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                                {formatDate(p.paidAt || p.createdAt)}
                              </td>
                              <td className="px-4 py-3 text-[12px] font-mono" style={{ color: 'var(--p-on-surface-variant)' }}>
                                {p.linkCode || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </PortalShell>
  );
}
