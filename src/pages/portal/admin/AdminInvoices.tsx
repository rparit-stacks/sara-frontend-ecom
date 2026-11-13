import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import { Pill } from '@/components/portal/Pill';
import StatTile from '@/components/portal/StatTile';
import ListToolbar, { ViewToggle, useListView } from '@/components/portal/ListToolbar';
import LedgerList, { LedgerSkeleton, PaAvatar } from '@/components/portal/LedgerList';
import { manufacturingApi, invoiceApi, type ManufacturingInvoiceDto } from '@/lib/api';
import { formatInquiryDate } from '@/components/inquiry/inquiryUtils';
import InvoiceViewModal from '@/components/portal/InvoiceViewModal';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number, c = 'INR') => `${CUR[c] ?? ''}${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PAGE_SIZE = 25;

export default function PortalAdminInvoices() {
  const { hasAny } = useAdminPermissions();
  const canCancel = hasAny(P.PORTAL_INVOICES_CANCEL);
  const canUpdatePdf = hasAny(P.PORTAL_INVOICES_UPDATE_PDF);
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const quoteFilter = params.get('quote');
  const inquiryFilter = params.get('inquiry');
  const [viewing, setViewing] = useState<ManufacturingInvoiceDto | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [view, setView] = useListView('invoices');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['admin-invoices', quoteFilter],
    queryFn: () => invoiceApi.list(quoteFilter || undefined),
  });

  const { data: allQuotes = [] } = useQuery({
    queryKey: ['admin-quotes'],
    queryFn: () => manufacturingApi.listQuotes(),
    enabled: !!inquiryFilter && !quoteFilter,
  });

  const scoped = useMemo(() => {
    if (quoteFilter) return invoices;
    if (!inquiryFilter) return invoices;
    const id = Number(inquiryFilter);
    const refs = new Set(allQuotes.filter((q) => q.inquiryId === id).map((q) => q.reference));
    return invoices.filter((i) => i.inquiryId === id || (i.quoteReference && refs.has(i.quoteReference)));
  }, [invoices, inquiryFilter, quoteFilter, allQuotes]);

  const term = query.trim().toLowerCase();
  const shown = useMemo(() => scoped
    .filter((i) => !statusFilter || i.status === statusFilter)
    .filter((i) => {
      if (!term) return true;
      const hay = [i.reference, i.title, i.quoteReference, i.clientName, i.clientEmail].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(term);
    }), [scoped, statusFilter, term]);

  const totals = useMemo(() => {
    let paid = 0, pending = 0;
    for (const i of scoped) {
      if (i.status === 'PAID') paid += i.amount || 0;
      else if (i.status === 'PENDING') pending += i.amount || 0;
    }
    return { paid, pending, count: scoped.length };
  }, [scoped]);

  const statuses = useMemo(() => Array.from(new Set(scoped.map((i) => i.status))).sort(), [scoped]);

  useEffect(() => { setPage(0); }, [term, statusFilter, quoteFilter, inquiryFilter]);
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const paged = shown.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const cancelInvoice = useMutation({
    mutationFn: (id: number) => invoiceApi.cancel(id),
    onSuccess: (cancelled) => {
      setViewing(null);
      qc.invalidateQueries({ queryKey: ['admin-invoices'] });
      qc.invalidateQueries({ queryKey: ['payment-links'] });
      qc.invalidateQueries({ queryKey: ['admin-project-financials'] });
      qc.invalidateQueries({ queryKey: ['client-project-financials'] });
      qc.invalidateQueries({ queryKey: ['client-portal-aggregate'] });
      toast.success(`Invoice ${cancelled.reference} cancelled`);
    },
    onError: (error) => toast.error((error as Error).message || 'Could not cancel invoice'),
  });

  const confirmCancel = (invoice: ManufacturingInvoiceDto) => {
    if (!window.confirm(
      `Cancel invoice ${invoice.reference}? Its payment link will stop working and the amount can be invoiced again.`,
    )) return;
    cancelInvoice.mutate(invoice.id);
  };

  return (
    <AdminShell title={quoteFilter || inquiryFilter ? 'Invoices · Project' : 'Invoices'}>
      <div className="p-4 sm:p-6">
        {(quoteFilter || inquiryFilter) && (
          <p className="text-[13px] mb-4" style={{ color: 'var(--p-on-surface-variant)' }}>
            {quoteFilter ? `Showing invoices for quote ${quoteFilter}` : `Showing invoices for inquiry #${inquiryFilter}`}
            <button onClick={() => window.location.assign('/portal-admin/invoices')} className="ml-2 font-bold underline" style={{ color: 'var(--p-primary)' }}>Show all</button>
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 max-w-3xl">
          <StatTile label="Total invoices" value={totals.count} icon="receipt_long" color="var(--p-primary)" />
          <StatTile label="Collected" value={money(totals.paid)} icon="check_circle" color="#15803d" />
          <StatTile label="Pending" value={money(totals.pending)} icon="pending_actions" color="#b45309" />
        </div>

        <ListToolbar
          tabs={[{ key: '', label: 'All', count: scoped.length }, ...statuses.map((st) => ({ key: st, label: st.charAt(0) + st.slice(1).toLowerCase(), count: scoped.filter((i) => i.status === st).length }))]}
          tab={statusFilter}
          onTab={(k) => { setStatusFilter(k); setPage(0); }}
          search={query}
          onSearch={(v) => { setQuery(v); setPage(0); }}
          placeholder="Invoice, title, quote, client…"
        >
          <ViewToggle view={view} onChange={setView} />
        </ListToolbar>

        {isLoading ? (
          <LedgerSkeleton />
        ) : shown.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name={query || statusFilter ? 'search_off' : 'receipt_long'} className="text-[40px] mb-2 opacity-40" />
            <p className="text-[14px]">
              {query || statusFilter
                ? 'No invoices match the current filters.'
                : 'No invoices yet. Invoices are created automatically when you request a payment from a project.'}
            </p>
          </div>
        ) : (
          <>
          <LedgerList
            layout={view}
            moreWidth={210}
            groupTotal={(rs) => money(rs.reduce((n, r) => n + (paged.find((p) => p.id === r.key)?.amount ?? 0), 0))}
            rows={paged.map((inv) => ({
              key: inv.id,
              date: inv.createdAt,
              accent: inv.status === 'PENDING' ? ('warn' as const) : inv.status === 'PAID' ? ('good' as const) : null,
              onClick: () => setViewing(inv),
              lead: <PaAvatar name={inv.clientName || inv.reference} />,
              title: <span className="truncate">{inv.title || inv.reference}</span>,
              sub: [inv.reference, inv.clientName, inv.quoteReference].filter(Boolean).join(' · '),
              amount: money(inv.amount, inv.currency),
              status: <Pill label={inv.status} />,
              actions: (
                <button onClick={() => setViewing(inv)} className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--p-outline)', color: 'var(--p-primary)' }}>
                  View / PDF
                </button>
              ),
              more: (
                <>
                  {inv.paymentLinkCode && inv.status === 'PENDING' && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/pay/${inv.paymentLinkCode}`); toast.success('Pay link copied'); }}
                      className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}
                    >Copy pay link</button>
                  )}
                  {inv.status === 'PENDING' && canCancel && (
                    <button
                      type="button"
                      disabled={cancelInvoice.isPending}
                      onClick={() => confirmCancel(inv)}
                      className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border disabled:opacity-50"
                      style={{ borderColor: 'var(--p-outline)', color: 'var(--p-error)' }}
                    >
                      {cancelInvoice.isPending && cancelInvoice.variables === inv.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </>
              ),
            }))}
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

      {viewing && <InvoiceViewModal invoice={viewing} canUpdatePdf={canUpdatePdf} onClose={() => setViewing(null)} onSaved={() => qc.invalidateQueries({ queryKey: ['admin-invoices'] })} />}
    </AdminShell>
  );
}
