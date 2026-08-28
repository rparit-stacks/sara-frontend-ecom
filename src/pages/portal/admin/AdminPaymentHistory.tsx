import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminShell from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import StatTile from '@/components/portal/StatTile';
import { paymentLinkApi, type PaymentLinkPaymentDto } from '@/lib/api';
import { useMarkNavRead } from '@/hooks/useAdminNotificationCounts';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n?: number, c = 'INR') => (n == null ? '—' : `${CUR[c] ?? ''}${n.toLocaleString('en-IN')}`);
const PAGE_SIZE = 25;

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
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const markRead = useMarkNavRead('payment_history');

  useEffect(() => { markRead(); }, []);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => paymentLinkApi.listAllPayments(),
  });

  const q = query.trim().toLowerCase();
  const shown = useMemo(() => payments
    .filter((p) => !statusFilter || p.status === statusFilter)
    .filter((p) => {
      if (!q) return true;
      const hay = [p.payerName, p.payerEmail, p.linkCode, p.quoteReference, p.invoiceReference, p.projectCode]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    }), [payments, statusFilter, q]);

  useEffect(() => { setPage(0); }, [q, statusFilter]);

  const totals = useMemo(() => {
    let paid = 0, paidCount = 0;
    for (const p of payments) {
      if (p.status === 'PAID') { paid += p.amount || 0; paidCount++; }
    }
    return { paid, paidCount, total: payments.length };
  }, [payments]);

  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const paged = shown.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <AdminShell title="Payment History">
      <div className="p-5 sm:p-8">
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-xl">
          <StatTile label="Total attempts" value={totals.total} icon="history" color="var(--p-primary)" />
          <StatTile label="Successful" value={totals.paidCount} icon="check_circle" color="#15803d" />
          <StatTile label="Collected" value={money(totals.paid)} icon="payments" color="var(--p-primary)" />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="px-3 py-1.5 rounded-lg text-[13px] outline-none border"
            style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface)' }}
          >
            <option value="">All statuses</option>
            {Object.keys(STATUS_STYLE).map((s) => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}
          </select>
          {(query || statusFilter) && (
            <button
              type="button"
              onClick={() => { setQuery(''); setStatusFilter(''); }}
              className="text-[12px] font-bold underline"
              style={{ color: 'var(--p-primary)' }}
            >
              Clear
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="progress_activity" className="text-[28px] animate-spin" />
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="history" className="text-[40px] mb-2 opacity-40" />
            <p className="text-[14px]">{q || statusFilter ? 'No payments match the current filters.' : 'No payments recorded yet.'}</p>
          </div>
        ) : (
          <>
            <div className="border rounded-2xl overflow-x-auto" style={{ borderColor: 'var(--p-outline-variant)' }}>
              <table className="w-full text-left">
                <thead>
                  <tr style={{ background: 'var(--p-surface-container-low)' }}>
                    {['Customer', 'Project', 'Invoice', 'Amount', 'Gateway', 'Status', 'Paid at', 'Transaction ref'].map((h) => (
                      <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p: PaymentLinkPaymentDto, i) => {
                    const status = STATUS_STYLE[p.status] ?? STATUS_STYLE.PENDING;
                    const invoiceRef = p.invoiceReference || p.quoteReference || '—';
                    return (
                      <tr key={p.id} style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                        <td className="px-4 py-3 text-[13px] font-semibold">
                          {p.payerName || '—'}
                          {p.payerEmail && <span className="text-[11px] font-normal" style={{ color: 'var(--p-on-surface-variant)' }}> · {p.payerEmail}</span>}
                        </td>
                        <td className="px-4 py-3 text-[12px] font-mono">{p.projectCode || '—'}</td>
                        <td className="px-4 py-3 text-[12px] font-mono">{invoiceRef}</td>
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
                        <td className="px-4 py-3 text-[12px] font-mono" style={{ color: 'var(--p-on-surface-variant)' }}>
                          {p.linkCode || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pageCount > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                  Showing {page * PAGE_SIZE + 1}–{Math.min(shown.length, (page + 1) * PAGE_SIZE)} of {shown.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-40"
                    style={{ borderColor: 'var(--p-outline-variant)' }}
                  >
                    <Sym name="chevron_left" className="text-[18px]" />
                  </button>
                  <span className="text-[12px] font-semibold px-2">{page + 1} / {pageCount}</span>
                  <button
                    type="button"
                    disabled={page >= pageCount - 1}
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-40"
                    style={{ borderColor: 'var(--p-outline-variant)' }}
                  >
                    <Sym name="chevron_right" className="text-[18px]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
