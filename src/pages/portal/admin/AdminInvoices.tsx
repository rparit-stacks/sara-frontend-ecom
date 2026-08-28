import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import AdminShell from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import { Pill } from '@/components/portal/Pill';
import StatTile from '@/components/portal/StatTile';
import { manufacturingApi, invoiceApi, mediaApi, type ManufacturingInvoiceDto } from '@/lib/api';
import { formatInquiryDate } from '@/components/inquiry/inquiryUtils';
import InvoiceDocument from '@/components/quote/InvoiceDocument';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number, c = 'INR') => `${CUR[c] ?? ''}${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PAGE_SIZE = 25;

export default function PortalAdminInvoices() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const quoteFilter = params.get('quote');
  const inquiryFilter = params.get('inquiry');
  const [viewing, setViewing] = useState<ManufacturingInvoiceDto | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

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
      <div className="p-5 sm:p-8">
        {(quoteFilter || inquiryFilter) && (
          <p className="text-[13px] mb-4" style={{ color: 'var(--p-on-surface-variant)' }}>
            {quoteFilter ? `Showing invoices for quote ${quoteFilter}` : `Showing invoices for inquiry #${inquiryFilter}`}
            <button onClick={() => window.location.assign('/portal-admin/invoices')} className="ml-2 font-bold underline" style={{ color: 'var(--p-primary)' }}>Show all</button>
          </p>
        )}
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-xl">
          <StatTile label="Total invoices" value={totals.count} icon="receipt_long" color="var(--p-primary)" />
          <StatTile label="Collected" value={money(totals.paid)} icon="check_circle" color="#15803d" />
          <StatTile label="Pending" value={money(totals.pending)} icon="pending_actions" color="#b45309" />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="relative">
            <Sym name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search invoice, title, quote, client…"
              className="pl-8 pr-3 py-1.5 rounded-lg text-[13px] w-64 sm:w-72 outline-none border"
              style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
            />
          </div>
          {statuses.length > 1 && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="px-3 py-1.5 rounded-lg text-[13px] outline-none border"
              style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface)' }}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
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
          <div className="border rounded-2xl overflow-x-auto" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr style={{ background: 'var(--p-surface-container-low)' }}>
                  {['Invoice', 'Title', 'Quote', 'Client', 'Amount', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((inv, i) => (
                  <tr key={inv.id} style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                    <td className="px-4 py-3 font-semibold text-[13px]">{inv.reference}</td>
                    <td className="px-4 py-3 text-[13px]">{inv.title}</td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{inv.quoteReference || '—'}</td>
                    <td className="px-4 py-3 text-[13px]">{inv.clientName || '—'}</td>
                    <td className="px-4 py-3 font-bold text-[13px]">{money(inv.amount, inv.currency)}</td>
                    <td className="px-4 py-3"><Pill label={inv.status} /></td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{inv.createdAt ? formatInquiryDate(inv.createdAt) : '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setViewing(inv)} className="text-[13px] font-bold hover:underline mr-3" style={{ color: 'var(--p-primary)' }}>View / PDF</button>
                      {inv.paymentLinkCode && inv.status === 'PENDING' && (
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/pay/${inv.paymentLinkCode}`); toast.success('Pay link copied'); }}
                          className="text-[13px] font-bold hover:underline mr-3" style={{ color: 'var(--p-primary)' }}
                        >Copy pay link</button>
                      )}
                      {inv.status === 'PENDING' && (
                        <button
                          type="button"
                          disabled={cancelInvoice.isPending}
                          onClick={() => confirmCancel(inv)}
                          className="text-[13px] font-bold hover:underline disabled:opacity-50"
                          style={{ color: 'var(--p-error)' }}
                        >
                          {cancelInvoice.isPending && cancelInvoice.variables === inv.id ? 'Cancelling…' : 'Cancel'}
                        </button>
                      )}
                      {inv.status === 'PAID' && <Sym name="check_circle" className="text-[18px] inline align-middle" style={{ color: 'var(--p-secondary)' }} />}
                    </td>
                  </tr>
                ))}
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

      {viewing && <InvoiceViewModal invoice={viewing} onClose={() => setViewing(null)} onSaved={() => qc.invalidateQueries({ queryKey: ['admin-invoices'] })} />}
    </AdminShell>
  );
}

function InvoiceViewModal({ invoice, onClose, onSaved }: { invoice: ManufacturingInvoiceDto; onClose: () => void; onSaved: () => void }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'' | 'download' | 'save'>('');

  const renderPdf = async (): Promise<Blob | null> => {
    const root = canvasRef.current;
    if (!root) return null;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('.quote-page'));
    if (!nodes.length) return null;
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    for (let i = 0; i < nodes.length; i++) {
      const canvas = await html2canvas(nodes[i], { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      const img = canvas.toDataURL('image/jpeg', 0.96);
      let w = pw, h = (canvas.height * pw) / canvas.width;
      if (h > ph) { h = ph; w = (canvas.width * ph) / canvas.height; }
      if (i > 0) pdf.addPage();
      pdf.addImage(img, 'JPEG', (pw - w) / 2, 0, w, h);
    }
    return pdf.output('blob');
  };

  const download = async () => {
    setBusy('download');
    try {
      const blob = await renderPdf();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${invoice.reference}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error((e as Error).message || 'PDF failed'); }
    finally { setBusy(''); }
  };

  const generateAndSave = async () => {
    setBusy('save');
    try {
      const blob = await renderPdf();
      if (!blob) return;
      const file = new File([blob], `${invoice.reference}.pdf`, { type: 'application/pdf' });
      const url = await mediaApi.upload(file, 'invoices');
      await invoiceApi.savePdf(invoice.id, url);
      toast.success('Invoice PDF saved — clients will get the link in emails');
      onSaved();
    } catch (e) { toast.error((e as Error).message || 'Save failed'); }
    finally { setBusy(''); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex flex-col" onClick={onClose}>
      <div className="border-b px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }} onClick={(e) => e.stopPropagation()}>
        <span className="font-semibold text-[14px]">{invoice.reference}</span>
        {invoice.pdfUrl && <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" className="text-[12px] font-semibold" style={{ color: 'var(--p-primary)' }}>Saved PDF ↗</a>}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={download} disabled={!!busy} className="h-9 px-3 rounded-lg text-[13px] font-semibold border disabled:opacity-50" style={{ borderColor: 'var(--p-outline-variant)' }}>{busy === 'download' ? 'Rendering…' : 'Download PDF'}</button>
          <button onClick={generateAndSave} disabled={!!busy} className="h-9 px-3 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: 'var(--p-primary)' }}>{busy === 'save' ? 'Saving…' : 'Generate & save PDF'}</button>
          <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-black/[0.04]"><Sym name="close" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-8 flex justify-center" onClick={(e) => e.stopPropagation()}>
        <div ref={canvasRef}>
          <InvoiceDocument invoice={invoice} />
        </div>
      </div>
    </div>
  );
}

