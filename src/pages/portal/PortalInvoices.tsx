import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalShell from '@/components/portal/PortalShell';
import PortalEmptyInquiry from '@/components/portal/PortalEmptyInquiry';
import { Sym } from '@/components/portal/Sym';
import { useClientPortalAggregate } from '@/hooks/useClientPortalAggregate';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number | undefined, c?: string) =>
  `${CUR[c || 'INR'] ?? ''}${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusTone = (s: string): { bg: string; fg: string } => {
  const k = s.toUpperCase();
  if (k === 'PAID') return { bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' };
  if (k === 'PENDING') return { bg: 'var(--p-primary-fixed)', fg: 'var(--p-on-primary-fixed-variant)' };
  if (k === 'CANCELLED') return { bg: 'var(--p-error-container)', fg: 'var(--p-on-error-container)' };
  return { bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface-variant)' };
};

export default function PortalInvoices() {
  const navigate = useNavigate();
  const { projects, invoices, isLoading } = useClientPortalAggregate();

  const { totalPaid, totalDue } = useMemo(() => {
    let paid = 0;
    let due = 0;
    for (const inv of invoices) {
      const amt = inv.amount || 0;
      if ((inv.status || '').toUpperCase() === 'PAID') paid += amt;
      else if ((inv.status || '').toUpperCase() === 'PENDING') due += amt;
    }
    return { totalPaid: paid, totalDue: due };
  }, [invoices]);

  return (
    <PortalShell active="home">
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="h-14 px-6 border-b flex items-center gap-3 shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <Sym name="receipt_long" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
          <h2 className="font-display text-[18px]">Invoices</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl">
            {isLoading ? (
              <div className="flex justify-center py-20"><Sym name="progress_activity" className="text-[28px] animate-spin" /></div>
            ) : projects.length === 0 ? (
              <PortalEmptyInquiry compact />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {[
                    { l: 'Total Paid', v: money(totalPaid), c: 'var(--p-secondary)' },
                    { l: 'Outstanding', v: money(totalDue), c: 'var(--p-error)' },
                    { l: 'Invoices', v: String(invoices.length), c: 'var(--p-on-surface)' },
                  ].map((s) => (
                    <div key={s.l} className="border rounded-xl p-4" style={{ borderColor: 'var(--p-outline-variant)' }}>
                      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{s.l}</p>
                      <p className="font-display text-[26px] mt-1" style={{ color: s.c }}>{s.v}</p>
                    </div>
                  ))}
                </div>

                {invoices.length === 0 ? (
                  <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
                    <Sym name="receipt_long" className="text-[40px] opacity-40" />
                    <p className="mt-2 font-semibold">No invoices yet</p>
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-hidden overflow-x-auto" style={{ borderColor: 'var(--p-outline-variant)' }}>
                    <table className="w-full text-left border-collapse min-w-[640px]">
                      <thead>
                        <tr style={{ background: 'var(--p-surface-container-low)' }}>
                          {['Invoice', 'Project', 'Amount', 'Status', ''].map((h) => (
                            <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv, i) => {
                          const st = statusTone(inv.status);
                          return (
                            <tr key={inv.id} style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                              <td className="px-4 py-3 font-semibold text-[13px]">{inv.reference}</td>
                              <td className="px-4 py-3 text-[13px]">{inv.projectTitle}</td>
                              <td className="px-4 py-3 font-bold text-[13px]">{money(inv.amount, inv.currency)}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: st.bg, color: st.fg }}>{inv.status}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/portal/projects/${encodeURIComponent(inv.projectCode)}?tab=invoices`)}
                                  className="text-[13px] font-bold hover:underline"
                                  style={{ color: 'var(--p-primary)' }}
                                >
                                  Open project
                                </button>
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
