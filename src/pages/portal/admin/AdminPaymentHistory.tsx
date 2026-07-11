import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminShell from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import { paymentLinkApi, type PaymentLinkPaymentDto } from '@/lib/api';
import { useMarkNavRead } from '@/hooks/useAdminNotificationCounts';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n?: number, c = 'INR') => (n == null ? '—' : `${CUR[c] ?? ''}${n.toLocaleString('en-IN')}`);

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PAID: { bg: '#2e7d3220', color: '#2e7d32', label: 'Paid' },
  PENDING: { bg: '#9e9e9e20', color: '#757575', label: 'Pending' },
  FAILED: { bg: '#c6282820', color: '#c62828', label: 'Failed' },
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PortalAdminPaymentHistory() {
  const [query, setQuery] = useState('');
  const markRead = useMarkNavRead('payment_history');

  useEffect(() => { markRead(); }, []);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => paymentLinkApi.listAllPayments(),
  });

  const q = query.trim().toLowerCase();
  const shown = payments.filter((p) => {
    if (!q) return true;
    const hay = [p.payerName, p.payerEmail, p.linkCode, p.quoteReference, p.invoiceReference, p.projectCode]
      .filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });

  return (
    <AdminShell title="Payment History">
      <div className="p-5 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <div className="relative">
            <Sym name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search payer, link, quote, invoice…"
              className="pl-8 pr-3 py-1.5 rounded-lg text-[13px] w-72 outline-none border"
              style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="progress_activity" className="text-[28px] animate-spin" />
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="history" className="text-[40px] mb-2 opacity-40" />
            <p className="text-[14px]">{q ? `No payments match "${query}".` : 'No payments recorded yet.'}</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-x-auto" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ background: 'var(--p-surface-container-low)' }}>
                  {['Payer', 'Reference', 'Amount', 'Gateway', 'Status', 'Paid at'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((p: PaymentLinkPaymentDto, i) => {
                  const status = STATUS_STYLE[p.status] ?? STATUS_STYLE.PENDING;
                  const ref = p.quoteReference || p.invoiceReference || p.linkCode || p.projectCode || '—';
                  return (
                    <tr key={p.id} style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                      <td className="px-4 py-3 text-[13px] font-semibold">
                        {p.payerName || '—'}
                        {p.payerEmail && <span className="text-[11px] font-normal text-gray-400"> · {p.payerEmail}</span>}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-mono">{ref}</td>
                      <td className="px-4 py-3 text-[13px] font-medium">{money(p.amount, p.currency)}</td>
                      <td className="px-4 py-3 text-[12px]">{p.gateway || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                        {formatDate(p.paidAt || p.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
