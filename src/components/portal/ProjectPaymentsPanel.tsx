import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sym } from '@/components/portal/Sym';
import { projectApi, paymentLinkApi, type PaymentLinkDto, type PaymentLinkPaymentDto, type ManufacturingProjectDto } from '@/lib/api';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n?: number, c = 'INR') => (n == null ? '—' : `${CUR[c] ?? ''}${n.toLocaleString('en-IN')}`);
const payUrl = (code: string) => `${window.location.origin}/pay/${code}`;

const PAYMENT_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PAID: { bg: '#2e7d3220', color: '#2e7d32', label: 'Paid' },
  PENDING: { bg: '#9e9e9e20', color: '#757575', label: 'Pending' },
  FAILED: { bg: '#c6282820', color: '#c62828', label: 'Failed' },
};

function formatAttemptDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const inputCls = 'w-full h-10 px-3 rounded-lg border text-[14px] focus:outline-none';
const fieldStyle = { borderColor: 'var(--p-outline-variant)' } as const;
const labelCls = 'block text-[11px] font-semibold uppercase tracking-wide mb-1';

/**
 * Payments tab, scoped to one project. This IS the same thing as the standalone
 * Payment Links screen (list with revoke/reactivate/history-drill-down, exactly the
 * same lifecycle) — just filtered to this project's links, and the create form is
 * inline (no redirect) with client/project already known from context.
 *
 * A payment here always references the project's LIVE quotation at the moment it was
 * requested — if no quotation is live yet, creating a payment is blocked (there is
 * nothing to reference). The quotation reference is stamped once and never changes
 * even if the quotation is revised later; it never sets, caps, or derives the amount.
 * Multiple payment requests against the same quotation are always allowed.
 */
export default function ProjectPaymentsPanel({ mode, project }: { mode: 'admin' | 'client'; project: ManufacturingProjectDto }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [historyForId, setHistoryForId] = useState<number | null>(null);

  const { data: overview } = useQuery({
    queryKey: ['financial-overview', mode, project.code],
    queryFn: () => projectApi.getFinancialOverview(project.code),
    enabled: !!project.code,
  });
  const liveQuotation = overview?.liveQuotation ?? null;

  const { data: allLinks = [], isLoading } = useQuery({
    queryKey: ['payment-links'],
    queryFn: () => paymentLinkApi.list(),
    enabled: mode === 'admin',
  });
  const links = allLinks.filter((l) => l.projectCode === project.code);

  const createMut = useMutation({
    mutationFn: (data: Partial<PaymentLinkDto>) => paymentLinkApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-links'] });
      setShowForm(false);
      setAmount(''); setTitle(''); setNote('');
      toast.success('Payment request created');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create payment'),
  });

  const activeMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => paymentLinkApi.setActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-links'] }),
  });

  const submit = () => {
    if (!liveQuotation) { toast.error('This project needs a live quotation before you can request a payment'); return; }
    const amt = Number(amount);
    if (!(amt > 0)) { toast.error('Enter an amount'); return; }
    createMut.mutate({
      mode: 'QUOTE',
      title: title || undefined,
      currency,
      amount: amt,
      clientName: project.clientName,
      clientEmail: project.clientEmail,
      projectCode: project.code,
      quoteReference: liveQuotation.reference,
      note: note || undefined,
    });
  };

  const copy = (code: string) => { navigator.clipboard.writeText(payUrl(code)); toast.success('Link copied'); };

  if (mode !== 'admin') return null;

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Payments — {project.code}</p>
        <button
          onClick={() => setShowForm((v) => !v)}
          disabled={!liveQuotation}
          title={!liveQuotation ? 'This project needs a live quotation first' : undefined}
          className="h-9 px-3 rounded-lg text-[13px] font-semibold text-white flex items-center gap-1.5 disabled:opacity-50"
          style={{ background: 'var(--p-primary)' }}
        >
          <Sym name={showForm ? 'close' : 'add'} className="text-[16px]" /> {showForm ? 'Cancel' : 'New payment'}
        </button>
      </div>

      {!liveQuotation && (
        <div className="border rounded-xl p-4 flex items-start gap-3" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
          <Sym name="info" className="text-[18px] shrink-0 mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }} />
          <p className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>
            This project has no live quotation yet — create one under the Quotation tab first. Every payment request references the quotation that was live at the time it was made.
          </p>
        </div>
      )}

      {showForm && liveQuotation && (
        <section className="border rounded-xl p-4 space-y-4" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="grid grid-cols-3 gap-3 text-[13px]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Client</p>
              <p className="font-semibold">{project.clientName || project.clientEmail || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Project</p>
              <p className="font-semibold">{project.title || project.code}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Live quotation</p>
              <p className="font-semibold">{liveQuotation.reference} — {money(liveQuotation.total, liveQuotation.currency)}</p>
            </div>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>
            This payment will reference {liveQuotation.reference} (the quote live right now). It never sets or limits the amount below — you can request this again later for the same or a different amount, even after this one is paid.
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className={labelCls} style={{ color: 'var(--p-on-surface-variant)' }}>Amount</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={inputCls} style={fieldStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--p-on-surface-variant)' }}>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls} style={fieldStyle}>
                {Object.keys(CUR).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--p-on-surface-variant)' }}>Title (shown on pay page)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Advance payment" className={inputCls} style={fieldStyle} />
          </div>
          <div>
            <label className={labelCls} style={{ color: 'var(--p-on-surface-variant)' }}>Note — what this is for (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} style={fieldStyle} />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={fieldStyle}>Cancel</button>
            <button
              onClick={submit}
              disabled={createMut.isPending}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--p-primary)' }}
            >
              {createMut.isPending ? 'Creating…' : 'Create payment request'}
            </button>
          </div>
        </section>
      )}

      <section className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Payment requests for this project</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>Every request you've made — pending, paid, or revoked. Nothing is ever hidden.</p>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Sym name="progress_activity" className="text-[24px] animate-spin" style={{ color: 'var(--p-primary)' }} />
          </div>
        ) : links.length === 0 ? (
          <p className="text-center text-[13px] py-10" style={{ color: 'var(--p-on-surface-variant)' }}>No payment requests yet for this project.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ background: 'var(--p-surface-container-low)' }}>
                  {['Title', 'Quotation', 'Amount', 'Link', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {links.map((l, i) => (
                  <React.Fragment key={l.id}>
                    <tr style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                      <td className="px-4 py-2.5 text-[13px] font-semibold">{l.title || '—'}</td>
                      <td className="px-4 py-2.5 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{l.quoteReference || '—'}</td>
                      <td className="px-4 py-2.5 font-bold text-[13px]">{money(l.amount, l.currency)}</td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => copy(l.code)} className="text-[12px] font-mono px-2 py-1 rounded border hover:bg-black/[0.03] flex items-center gap-1.5" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-primary)' }}>
                          <Sym name="content_copy" className="text-[14px]" /> /pay/{l.code}
                        </button>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[12px] font-semibold flex items-center gap-1" style={{ color: l.active ? '#2e7d32' : '#9e9e9e' }}>
                          <span>{l.active ? '●' : '○'}</span> {l.active ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <a href={payUrl(l.code)} target="_blank" rel="noreferrer" className="text-[13px] font-bold mr-3" style={{ color: 'var(--p-primary)' }}>Open</a>
                        <button
                          onClick={() => setHistoryForId(historyForId === l.id ? null : l.id)}
                          className="text-[13px] font-bold mr-3"
                          style={{ color: 'var(--p-on-surface-variant)' }}
                        >
                          {historyForId === l.id ? 'Hide history' : 'History'}
                        </button>
                        <button
                          onClick={() => {
                            if (l.active && !window.confirm(`Revoke this payment link? "${payUrl(l.code)}" will stop working immediately — this does not affect any payment already made.`)) return;
                            activeMut.mutate({ id: l.id, active: !l.active });
                          }}
                          disabled={activeMut.isPending}
                          className="text-[13px] font-bold disabled:opacity-50"
                          style={{ color: l.active ? '#b42318' : 'var(--p-primary)' }}
                        >
                          {l.active ? 'Revoke' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                    {historyForId === l.id && <LinkHistoryRow linkId={l.id} />}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/** Full attempt trail for one link — every Requested/Failed/Paid row, kept forever. */
function LinkHistoryRow({ linkId }: { linkId: number }) {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payment-link-history', linkId],
    queryFn: () => paymentLinkApi.paymentsForLink(linkId),
  });

  return (
    <tr>
      <td colSpan={6} className="px-4 py-3" style={{ background: 'var(--p-surface-container-low)' }}>
        {isLoading ? (
          <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>Loading history…</p>
        ) : payments.length === 0 ? (
          <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>No payment attempts recorded on this link yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                {['Attempt', 'Amount', 'Status', 'Payer', 'Date'].map((h) => (
                  <th key={h} className="pb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p: PaymentLinkPaymentDto, idx) => {
                const status = PAYMENT_STATUS_STYLE[p.status] ?? PAYMENT_STATUS_STYLE.PENDING;
                return (
                  <tr key={p.id} style={{ borderTop: idx ? '1px solid var(--p-outline-variant)' : undefined }}>
                    <td className="py-1.5 text-[12px] font-mono">#{payments.length - idx}</td>
                    <td className="py-1.5 text-[12px] font-medium">{money(p.amount, p.currency)}</td>
                    <td className="py-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-1.5 text-[12px]">{p.payerName || p.payerEmail || '—'}</td>
                    <td className="py-1.5 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                      {formatAttemptDate(p.paidAt || p.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </td>
    </tr>
  );
}
