import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell, { AdminBtn } from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import { manufacturingApi, paymentLinkApi, type PaymentLinkDto, type PaymentLinkMode } from '@/lib/api';

const MODES: { key: PaymentLinkMode; label: string; hint: string; icon: string }[] = [
  { key: 'OPEN', label: 'Open amount', hint: 'Payer enters any amount.', icon: 'edit' },
  { key: 'FIXED', label: 'Fixed amount', hint: 'Anyone with the link pays this amount.', icon: 'lock' },
  { key: 'CLIENT', label: 'Fixed + client', hint: 'A set amount for a specific client email.', icon: 'person' },
  { key: 'QUOTE', label: 'Quotation', hint: 'Linked to a quote — amount auto-fetched.', icon: 'request_quote' },
];

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n?: number, c = 'INR') => (n == null ? '—' : `${CUR[c] ?? ''}${n.toLocaleString('en-IN')}`);
const payUrl = (code: string) => `${window.location.origin}/pay/${code}`;

export default function PortalAdminPaymentLinks() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['payment-links'],
    queryFn: () => paymentLinkApi.list(),
  });

  const createMut = useMutation({
    mutationFn: (data: Partial<PaymentLinkDto>) => paymentLinkApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-links'] }); setOpen(false); toast.success('Payment link created'); },
    onError: (e: Error) => toast.error(e.message || 'Failed to create'),
  });
  const activeMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => paymentLinkApi.setActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-links'] }),
  });

  const copy = (code: string) => { navigator.clipboard.writeText(payUrl(code)); toast.success('Link copied'); };

  return (
    <AdminShell title="Payment Links" actions={<AdminBtn icon="add" onClick={() => setOpen(true)}>New link</AdminBtn>}>
      <div className="p-5 sm:p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="progress_activity" className="text-[28px] animate-spin" />
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="link" className="text-[40px] mb-2 opacity-40" />
            <p className="text-[14px]">No payment links yet. Create one to start collecting payments.</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-x-auto" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ background: 'var(--p-surface-container-low)' }}>
                  {['Title', 'Mode', 'Amount', 'Link', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {links.map((l, i) => (
                  <tr key={l.id} style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                    <td className="px-4 py-3 text-[13px] font-semibold">{l.title || '—'}{l.quoteReference ? <span className="text-[11px] font-normal text-gray-400"> · {l.quoteReference}</span> : null}</td>
                    <td className="px-4 py-3 text-[12px]">{MODES.find((m) => m.key === l.mode)?.label || l.mode}</td>
                    <td className="px-4 py-3 text-[13px] font-medium">{l.mode === 'OPEN' || l.mode === 'QUOTE' ? <span className="text-gray-400">{l.mode === 'QUOTE' ? 'from quote' : 'any'}</span> : money(l.amount, l.currency)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => copy(l.code)} className="text-[12px] font-mono px-2 py-1 rounded border hover:bg-black/[0.03] flex items-center gap-1.5" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-primary)' }}>
                        <Sym name="content_copy" className="text-[14px]" /> /pay/{l.code}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => activeMut.mutate({ id: l.id, active: !l.active })} className="text-[12px] font-semibold" style={{ color: l.active ? '#2e7d32' : '#9e9e9e' }}>
                        {l.active ? '● Active' : '○ Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a href={payUrl(l.code)} target="_blank" rel="noreferrer" className="text-[13px] font-bold" style={{ color: 'var(--p-primary)' }}>Open</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && <CreateModal onClose={() => setOpen(false)} onCreate={(d) => createMut.mutate(d)} saving={createMut.isPending} />}
    </AdminShell>
  );
}

function CreateModal({ onClose, onCreate, saving }: { onClose: () => void; onCreate: (d: Partial<PaymentLinkDto>) => void; saving: boolean }) {
  const [mode, setMode] = useState<PaymentLinkMode>('OPEN');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [quoteReference, setQuoteReference] = useState('');
  const [note, setNote] = useState('');

  const { data: quotes = [] } = useQuery({
    queryKey: ['admin-quotes', 'link-picker'],
    queryFn: () => manufacturingApi.listQuotes(),
    enabled: mode === 'QUOTE',
  });

  const needsAmount = mode === 'FIXED' || mode === 'CLIENT';
  const inputCls = 'w-full h-10 px-3 rounded-lg border text-[14px] focus:outline-none';
  const style = { borderColor: 'var(--p-outline-variant)' } as React.CSSProperties;

  const submit = () => {
    if (needsAmount && !(parseFloat(amount) > 0)) { toast.error('Enter an amount'); return; }
    if (mode === 'CLIENT' && !clientEmail) { toast.error('Enter client email'); return; }
    if (mode === 'QUOTE' && !quoteReference) { toast.error('Enter quote reference'); return; }
    onCreate({
      mode, title: title || undefined, currency,
      amount: needsAmount ? parseFloat(amount) : undefined,
      clientEmail: mode === 'CLIENT' ? clientEmail : undefined,
      clientName: mode === 'CLIENT' ? clientName : undefined,
      quoteReference: mode === 'QUOTE' ? quoteReference : undefined,
      note: note || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={style}>
          <h3 className="font-bold text-[16px]">New payment link</h3>
          <button onClick={onClose} className="msym text-gray-400 hover:text-gray-700"><Sym name="close" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Link type</label>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button key={m.key} onClick={() => setMode(m.key)} className={`text-left p-3 rounded-xl border ${mode === m.key ? 'ring-2' : ''}`} style={{ borderColor: mode === m.key ? 'var(--p-primary)' : 'var(--p-outline-variant)', boxShadow: mode === m.key ? '0 0 0 2px var(--p-primary)' : undefined }}>
                  <div className="flex items-center gap-2 text-[13px] font-semibold"><Sym name={m.icon} className="text-[16px]" style={{ color: 'var(--p-primary)' }} /> {m.label}</div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{m.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Title (shown on page)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Advance payment" className={inputCls} style={style} />
          </div>

          {needsAmount && (
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Amount</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={inputCls} style={style} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls} style={style}>
                  {Object.keys(CUR).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {mode === 'CLIENT' && (
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Client name</label><input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} style={style} /></div>
              <div><label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Client email</label><input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={inputCls} style={style} /></div>
            </div>
          )}

          {mode === 'QUOTE' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Quotation</label>
              <select value={quoteReference} onChange={(e) => setQuoteReference(e.target.value)} className={inputCls} style={style}>
                <option value="">Select a quote…</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.reference}>{q.reference} · {q.clientName || 'No client'} · {CUR[q.currency] ?? ''}{(q.total || 0).toLocaleString('en-IN')}</option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">Amount is fetched live from the quote when the page loads.</p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} style={style} />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2" style={style}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={style}>Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: 'var(--p-primary)' }}>{saving ? 'Creating…' : 'Create link'}</button>
        </div>
      </div>
    </div>
  );
}
