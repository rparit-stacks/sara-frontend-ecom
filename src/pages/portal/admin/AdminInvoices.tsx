import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import AdminShell, { AdminBtn } from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import { Pill } from '@/components/portal/Pill';
import { manufacturingApi, invoiceApi, mediaApi, type ManufacturingQuoteDto, type ManufacturingInvoiceDto } from '@/lib/api';
import { formatInquiryDate } from '@/components/inquiry/inquiryUtils';
import InvoiceDocument from '@/components/quote/InvoiceDocument';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number, c = 'INR') => `${CUR[c] ?? ''}${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PortalAdminInvoices() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const quoteFilter = params.get('quote');
  const inquiryFilter = params.get('inquiry');
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<ManufacturingInvoiceDto | null>(null);
  const [creating, setCreating] = useState(false);
  // Invoice being rendered off-screen to capture its PDF for the email.
  const [pdfInvoice, setPdfInvoice] = useState<ManufacturingInvoiceDto | null>(null);
  const pdfRenderRef = useRef<HTMLDivElement>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['admin-invoices', quoteFilter],
    queryFn: () => invoiceApi.list(quoteFilter || undefined),
  });

  const { data: allQuotes = [] } = useQuery({
    queryKey: ['admin-quotes'],
    queryFn: () => manufacturingApi.listQuotes(),
    enabled: !!inquiryFilter && !quoteFilter,
  });

  const shown = useMemo(() => {
    if (quoteFilter) return invoices;
    if (!inquiryFilter) return invoices;
    const id = Number(inquiryFilter);
    const refs = new Set(allQuotes.filter((q) => q.inquiryId === id).map((q) => q.reference));
    return invoices.filter((i) => i.inquiryId === id || (i.quoteReference && refs.has(i.quoteReference)));
  }, [invoices, inquiryFilter, quoteFilter, allQuotes]);

  const totals = useMemo(() => {
    let paid = 0, pending = 0;
    for (const i of shown) {
      if (i.status === 'PAID') paid += i.amount || 0;
      else if (i.status === 'PENDING') pending += i.amount || 0;
    }
    return { paid, pending };
  }, [shown]);

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

  // Build a PDF from the off-screen InvoiceDocument for the given invoice.
  // Returns both a data-URI (for the email attachment) and a Blob (to upload
  // and save as invoice.pdfUrl) so payment-success receipts always have a PDF
  // to reference, not just the manually-triggered "View / PDF" flow.
  const renderInvoicePdf = async (inv: ManufacturingInvoiceDto): Promise<{ dataUri: string; blob: Blob } | undefined> => {
    setPdfInvoice(inv);
    await new Promise((r) => setTimeout(r, 450)); // let it mount + images load
    try {
      const root = pdfRenderRef.current;
      const nodes = root ? Array.from(root.querySelectorAll<HTMLElement>('.quote-page')) : [];
      if (!nodes.length) return undefined;
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
      for (let i = 0; i < nodes.length; i++) {
        const canvas = await html2canvas(nodes[i], { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
        const img = canvas.toDataURL('image/jpeg', 0.96);
        let w = pw, h = (canvas.height * pw) / canvas.width;
        if (h > ph) { h = ph; w = (canvas.width * ph) / canvas.height; }
        if (i > 0) pdf.addPage();
        pdf.addImage(img, 'JPEG', (pw - w) / 2, 0, w, h);
      }
      return { dataUri: pdf.output('datauristring'), blob: pdf.output('blob') };
    } finally {
      setPdfInvoice(null);
    }
  };

  // Create invoice, then generate its PDF, save it (pdfUrl) and email it with
  // the PDF attached. PDF generation is mandatory on send — without a saved
  // pdfUrl, the payment-received receipt has nothing to attach later.
  const createAndSend = async (d: { quoteId: number; title?: string; amount: number; send?: boolean }) => {
    setCreating(true);
    try {
      const inv = await invoiceApi.create({ ...d, send: false }); // don't auto-email; we attach PDF next
      qc.invalidateQueries({ queryKey: ['admin-invoices'] });
      qc.invalidateQueries({ queryKey: ['payment-links'] });
      setOpen(false);
      if (d.send && inv.clientEmail) {
        toast.info('Generating invoice PDF…');
        const pdf = await renderInvoicePdf(inv);
        if (!pdf) {
          toast.error('Could not generate the invoice PDF — invoice created but not sent. Open it from the list and try "Generate & save PDF", then send.');
          return;
        }
        const file = new File([pdf.blob], `${inv.reference}.pdf`, { type: 'application/pdf' });
        const url = await mediaApi.upload(file, 'invoices');
        await invoiceApi.savePdf(inv.id, url);
        await invoiceApi.send(inv.id, pdf.dataUri);
        qc.invalidateQueries({ queryKey: ['admin-invoices'] });
        toast.success(`Invoice ${inv.reference} sent with PDF`);
      } else {
        toast.success(`Invoice ${inv.reference} created`);
      }
    } catch (e) {
      toast.error((e as Error).message || 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminShell title={quoteFilter || inquiryFilter ? 'Invoices · Project' : 'Invoices'} actions={<AdminBtn icon="add" onClick={() => setOpen(true)}>New invoice</AdminBtn>}>
      <div className="p-5 sm:p-8">
        {(quoteFilter || inquiryFilter) && (
          <p className="text-[13px] mb-4" style={{ color: 'var(--p-on-surface-variant)' }}>
            {quoteFilter ? `Showing invoices for quote ${quoteFilter}` : `Showing invoices for inquiry #${inquiryFilter}`}
            <button onClick={() => window.location.assign('/portal-admin/invoices')} className="ml-2 font-bold underline" style={{ color: 'var(--p-primary)' }}>Show all</button>
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
          {[['Collected', totals.paid, 'var(--p-secondary)'], ['Pending', totals.pending, 'var(--p-on-surface)']].map(([l, v, c]) => (
            <div key={l as string} className="border rounded-xl p-4" style={{ borderColor: 'var(--p-outline-variant)' }}>
              <p className="text-[11px] font-bold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>{l}</p>
              <p className="font-display text-[24px] mt-1" style={{ color: c as string }}>{money(v as number)}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="progress_activity" className="text-[28px] animate-spin" />
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="receipt_long" className="text-[40px] mb-2 opacity-40" />
            <p className="text-[14px]">No invoices yet. Create one from an approved quotation.</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-x-auto" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr style={{ background: 'var(--p-surface-container-low)' }}>
                  {['Invoice', 'Title', 'Quote', 'Client', 'Amount', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((inv, i) => (
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
        )}
      </div>

      {open && <CreateInvoiceModal onClose={() => setOpen(false)} onCreate={createAndSend} saving={creating} />}
      {viewing && <InvoiceViewModal invoice={viewing} onClose={() => setViewing(null)} onSaved={() => qc.invalidateQueries({ queryKey: ['admin-invoices'] })} />}

      {/* Off-screen invoice render used to capture the PDF for the email */}
      {pdfInvoice && (
        <div style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }} aria-hidden>
          <div ref={pdfRenderRef}><InvoiceDocument invoice={pdfInvoice} /></div>
        </div>
      )}
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
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="font-semibold text-[14px]">{invoice.reference}</span>
        {invoice.pdfUrl && <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" className="text-[12px] font-semibold" style={{ color: 'var(--p-primary)' }}>Saved PDF ↗</a>}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={download} disabled={!!busy} className="h-9 px-3 rounded-lg text-[13px] font-semibold border border-gray-200 disabled:opacity-50">{busy === 'download' ? 'Rendering…' : 'Download PDF'}</button>
          <button onClick={generateAndSave} disabled={!!busy} className="h-9 px-3 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: 'var(--p-primary)' }}>{busy === 'save' ? 'Saving…' : 'Generate & save PDF'}</button>
          <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-gray-100"><Sym name="close" /></button>
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

function CreateInvoiceModal({ onClose, onCreate, saving }: {
  onClose: () => void;
  onCreate: (d: { quoteId: number; title?: string; amount: number; send?: boolean }) => void;
  saving: boolean;
}) {
  const [quoteId, setQuoteId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [send, setSend] = useState(true);

  const { data: quotes = [] } = useQuery({
    queryKey: ['admin-quotes', 'invoice-picker'],
    queryFn: () => manufacturingApi.listQuotes(),
  });

  const selected: ManufacturingQuoteDto | undefined = useMemo(
    () => quotes.find((q) => q.id === quoteId), [quotes, quoteId]);

  const { data: existing = [] } = useQuery({
    queryKey: ['admin-invoices', selected?.reference],
    queryFn: () => invoiceApi.list(selected!.reference),
    enabled: !!selected?.reference,
  });
  const alreadyInvoiced = existing.filter((i) => i.status !== 'CANCELLED').reduce((s, i) => s + (i.amount || 0), 0);
  const remaining = selected ? Math.max(0, (selected.total || 0) - alreadyInvoiced) : 0;

  const cur = selected?.currency || 'INR';
  const inputCls = 'w-full h-10 px-3 rounded-lg border text-[14px] focus:outline-none';
  const style = { borderColor: 'var(--p-outline-variant)' } as React.CSSProperties;

  const setPct = (pct: number) => { if (selected) setAmount(String(Math.round((selected.total || 0) * pct))); };

  const submit = () => {
    if (!quoteId) { toast.error('Select a quotation'); return; }
    const amt = parseFloat(amount);
    if (!(amt > 0)) { toast.error('Enter an amount'); return; }
    onCreate({ quoteId, title: title || undefined, amount: amt, send });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={style}>
          <h3 className="font-bold text-[16px]">New invoice</h3>
          <button onClick={onClose} className="msym text-gray-400 hover:text-gray-700"><Sym name="close" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Quotation</label>
            <select value={quoteId ?? ''} onChange={(e) => setQuoteId(e.target.value ? Number(e.target.value) : null)} className={inputCls} style={style}>
              <option value="">Select a quote…</option>
              {quotes.map((q) => (
                <option key={q.id} value={q.id}>{q.reference} · {q.clientName || 'No client'} · {money(q.total, q.currency)}</option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="rounded-xl p-4 text-[13px] space-y-1" style={{ background: 'var(--p-surface-container-low)' }}>
              <div className="flex justify-between"><span className="text-gray-500">Client</span><span className="font-medium">{selected.clientName || '—'}{selected.clientEmail ? ` · ${selected.clientEmail}` : ''}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Quote total</span><span className="font-medium">{money(selected.total, cur)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Already invoiced</span><span className="font-medium">{money(alreadyInvoiced, cur)}</span></div>
              <div className="flex justify-between border-t pt-1 mt-1" style={style}><span className="text-gray-500">Remaining</span><span className="font-bold" style={{ color: 'var(--p-primary)' }}>{money(remaining, cur)}</span></div>
              {!selected.clientEmail && <p className="text-[11px] text-amber-600 pt-1">No client email on this quote — the invoice can be created but not emailed.</p>}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Advance 40%" className={inputCls} style={style} />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Amount ({cur})</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={inputCls} style={style} />
            {selected && (
              <div className="flex flex-wrap gap-2 mt-2">
                {[40, 50, 100].map((p) => (
                  <button key={p} onClick={() => setPct(p / 100)} className="text-[12px] px-2.5 py-1 rounded-lg border hover:bg-black/[0.03]" style={style}>{p}%</button>
                ))}
                <button onClick={() => setAmount(String(remaining))} className="text-[12px] px-2.5 py-1 rounded-lg border hover:bg-black/[0.03]" style={style}>Remaining</button>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-[13px] text-gray-600 cursor-pointer">
            <input type="checkbox" checked={send} onChange={(e) => setSend(e.target.checked)} className="accent-[#00676a]" />
            Email the invoice to the client now (with a Pay button)
          </label>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2" style={style}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={style}>Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: 'var(--p-primary)' }}>{saving ? 'Creating…' : send ? 'Create & send' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
}
