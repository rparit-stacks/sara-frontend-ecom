import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminShell from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import StatTile from '@/components/portal/StatTile';
import ListToolbar, { ViewToggle, useListView } from '@/components/portal/ListToolbar';
import LedgerList, { LedgerSkeleton, PaAvatar } from '@/components/portal/LedgerList';
import InvoiceViewModal, { type InvoiceMode } from '@/components/portal/InvoiceViewModal';
import { paymentLinkApi, invoiceApi, type PaymentLinkPaymentDto, type ManufacturingInvoiceDto } from '@/lib/api';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';
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
  const [view, setView] = useListView('payment-history');
  const { hasAny } = useAdminPermissions();
  const canSeeInvoices = hasAny(P.PORTAL_INVOICES_VIEW);
  const canSend = hasAny(P.PORTAL_INVOICES_SEND);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [job, setJob] = useState<{ invoice: ManufacturingInvoiceDto; mode: InvoiceMode } | null>(null);
  const markRead = useMarkNavRead('payment_history');

  useEffect(() => { markRead(); }, []);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => paymentLinkApi.listAllPayments(),
  });

  const { data: invoices = [], refetch: refetchInvoices } = useQuery({
    queryKey: ['admin-invoices', null],
    queryFn: () => invoiceApi.list(),
    enabled: canSeeInvoices,
  });
  const invoiceByRef = useMemo(() => new Map(invoices.map((i) => [i.reference, i])), [invoices]);

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
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 max-w-3xl">
          <StatTile label="Total attempts" value={totals.total} icon="history" color="var(--p-primary)" />
          <StatTile label="Successful" value={totals.paidCount} icon="check_circle" color="#15803d" />
          <StatTile label="Collected" value={money(totals.paid)} icon="payments" color="var(--p-primary)" />
        </div>

        <ListToolbar
          tabs={[{ key: '', label: 'All', count: payments.length }, ...Object.keys(STATUS_STYLE).map((k) => ({ key: k, label: STATUS_STYLE[k].label, count: payments.filter((p) => p.status === k).length }))]}
          tab={statusFilter}
          onTab={setStatusFilter}
          search={query}
          onSearch={setQuery}
          placeholder="Payer, link, quote, invoice…"
        >
          <ViewToggle view={view} onChange={setView} />
        </ListToolbar>

        {isLoading ? (
          <LedgerSkeleton />
        ) : shown.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="history" className="text-[40px] mb-2 opacity-40" />
            <p className="text-[14px]">{q || statusFilter ? 'No payments match the current filters.' : 'No payments recorded yet.'}</p>
          </div>
        ) : (
          <>
            <LedgerList
              layout={view}
              actionsWidth={40}
              statusWidth={76}
              amountWidth={210}
              rows={paged.map((p: PaymentLinkPaymentDto) => {
                const status = STATUS_STYLE[p.status] ?? STATUS_STYLE.PENDING;
                const invoiceRef = p.invoiceReference || p.quoteReference;
                return {
                  key: p.id,
                  date: p.paidAt || p.createdAt,
                  accent: p.status === 'PAID' ? ('good' as const) : p.status === 'FAILED' ? ('bad' as const) : null,
                  lead: <PaAvatar name={p.payerName || p.payerEmail} />,
                  title: <span className="truncate">{p.payerName || p.payerEmail || 'Unknown payer'}</span>,
                  sub: [p.projectCode, invoiceRef, p.gateway, p.linkCode].filter(Boolean).join(' · '),
                  amount: money(p.amount, p.currency),
                  amountSub: formatDate(p.paidAt || p.createdAt),
                  status: (
                    <span className="text-[12px] font-semibold py-0.5 rounded-full text-center" style={{ background: status.bg, color: status.color, display: 'inline-block', width: 74 }}>{status.label}</span>
                  ),
                  actions: (() => {
                    const inv = p.status === 'PAID' && canSeeInvoices && p.invoiceReference ? invoiceByRef.get(p.invoiceReference) : undefined;
                    if (!inv) return undefined;
                    const run = (mode: InvoiceMode) => { setMenuFor(null); setJob({ invoice: inv, mode }); };
                    const item = 'w-full text-left px-3 py-2 text-[13px] flex items-center gap-2 hover:bg-black/5';
                    return (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}
                          className="w-9 h-9 rounded-lg border flex items-center justify-center hover:bg-black/[0.04] active:scale-95 transition"
                          style={{ borderColor: 'var(--p-outline-variant)' }}
                          aria-label="Invoice actions"
                        >
                          <Sym name="more_vert" className="text-[20px]" />
                        </button>
                        {menuFor === p.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                            <div className="absolute right-0 top-10 w-56 border rounded-xl py-1 z-20 shadow-lg" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
                              <button type="button" className={item} onClick={() => run('view')}><Sym name="visibility" className="text-[18px]" /> View invoice</button>
                              <button type="button" className={item} onClick={() => run('download')}><Sym name="download" className="text-[18px]" /> Download invoice</button>
                              {canSend && (
                                <button type="button" className={item} onClick={() => run('send')}><Sym name="send" className="text-[18px]" /> Send to customer</button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })(),
                };
              })}
            />

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
      {job && (
        <InvoiceViewModal invoice={job.invoice} mode={job.mode} onClose={() => setJob(null)} onSaved={() => { void refetchInvoices(); }} />
      )}
    </AdminShell>
  );
}
