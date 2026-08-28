import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell, { AdminBtn } from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import StatTile from '@/components/portal/StatTile';
import {
  manufacturingApi, paymentLinkApi, projectApi,
  type PaymentLinkDto, type PaymentLinkMode, type PaymentLinkPaymentDto, type PaymentLinkItem,
  type ManufacturingProjectDto,
} from '@/lib/api';
import { useMarkNavRead } from '@/hooks/useAdminNotificationCounts';

const PAYMENT_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PAID: { bg: '#2e7d3220', color: '#2e7d32', label: 'Paid' },
  PENDING: { bg: '#9e9e9e20', color: '#757575', label: 'Pending' },
  FAILED: { bg: '#c6282820', color: '#c62828', label: 'Failed' },
};

function formatAttemptDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

type LinkKind = 'FREE' | 'CLIENT';

const KINDS: { key: LinkKind; label: string; hint: string; icon: string; info: string }[] = [
  {
    key: 'FREE', label: 'Free link', hint: 'Anyone can pay — not tied to a project.', icon: 'link',
    info: 'Not linked to any client or project. Build the amount by adding line items (they sum to a total) or just type one flat amount. You fill in who it\'s for — name/email/phone — and they get notified. Anyone who opens the link can pay it; there\'s no restriction on who pays.',
  },
  {
    key: 'CLIENT', label: 'Client link', hint: 'Pick a client and their project — for your reference.', icon: 'person',
    info: 'Pick a client, then one of their projects. The project\'s current live quotation is shown purely for your reference — it never sets or limits the amount. You always type the amount yourself, whatever it is; it can be more, less, or unrelated to the quotation total. Customer details are filled in automatically from the client you picked.',
  },
];

const MODE_LABEL: Record<string, string> = {
  OPEN: 'Open amount', FIXED: 'Free link', QUOTE: 'Client link', CLIENT: 'Client link',
};

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n?: number, c = 'INR') => (n == null ? '—' : `${CUR[c] ?? ''}${n.toLocaleString('en-IN')}`);
const payUrl = (code: string) => `${window.location.origin}/pay/${code}`;
const PAGE_SIZE = 25;

export default function PortalAdminPaymentLinks() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [historyForId, setHistoryForId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'revoked'>('');
  const [page, setPage] = useState(0);
  const markRead = useMarkNavRead('payment_links');

  useEffect(() => { markRead(); }, []);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['payment-links'],
    queryFn: () => paymentLinkApi.list(),
  });

  const q = query.trim().toLowerCase();
  const shown = useMemo(() => links
    .filter((l) => !statusFilter || (statusFilter === 'active' ? l.active : !l.active))
    .filter((l) => {
      if (!q) return true;
      const hay = [l.title, l.code, l.quoteReference, l.clientName, l.clientEmail].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    }), [links, statusFilter, q]);

  useEffect(() => { setPage(0); }, [q, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const paged = shown.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const stats = useMemo(() => ({
    total: links.length,
    active: links.filter((l) => l.active).length,
  }), [links]);

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
        {!isLoading && links.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm">
            <StatTile label="Total links" value={stats.total} icon="link" color="var(--p-primary)" />
            <StatTile label="Active" value={stats.active} icon="check_circle" color="#15803d" />
          </div>
        )}

        {!isLoading && links.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <div className="relative">
              <Sym name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, code, quote, client…"
                className="pl-8 pr-3 py-1.5 rounded-lg text-[13px] w-64 sm:w-72 outline-none border"
                style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'revoked')}
              aria-label="Filter by status"
              className="px-3 py-1.5 rounded-lg text-[13px] outline-none border"
              style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface)' }}
            >
              <option value="">All links</option>
              <option value="active">Active only</option>
              <option value="revoked">Revoked only</option>
            </select>
            {(query || statusFilter) && (
              <button type="button" onClick={() => { setQuery(''); setStatusFilter(''); }} className="text-[12px] font-bold underline" style={{ color: 'var(--p-primary)' }}>Clear</button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="progress_activity" className="text-[28px] animate-spin" />
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="link" className="text-[40px] mb-2 opacity-40" />
            <p className="text-[14px]">No payment links yet. Create one to start collecting payments.</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="search_off" className="text-[40px] mb-2 opacity-40" />
            <p className="text-[14px]">No links match the current filters.</p>
          </div>
        ) : (
          <>
          <div className="border rounded-2xl overflow-x-auto" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ background: 'var(--p-surface-container-low)' }}>
                  {['Title', 'Mode', 'Amount', 'Link', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((l, i) => (
                  <React.Fragment key={l.id}>
                  <tr style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                    <td className="px-4 py-3 text-[13px] font-semibold">{l.title || '—'}{l.quoteReference ? <span className="text-[11px] font-normal text-[color:var(--p-on-surface-variant)]"> · {l.quoteReference}</span> : null}</td>
                    <td className="px-4 py-3 text-[12px]">{MODE_LABEL[l.mode] || l.mode}</td>
                    <td className="px-4 py-3 text-[13px] font-medium">{l.mode === 'OPEN' ? <span className="text-[color:var(--p-on-surface-variant)]">any</span> : money(l.amount, l.currency)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => copy(l.code)} className="text-[12px] font-mono px-2 py-1 rounded border hover:bg-black/[0.03] flex items-center gap-1.5" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-primary)' }}>
                        <Sym name="content_copy" className="text-[14px]" /> /pay/{l.code}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-semibold flex items-center gap-1" style={{ color: l.active ? '#2e7d32' : '#9e9e9e' }}>
                        <span>{l.active ? '●' : '○'}</span> {l.active ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <a href={payUrl(l.code)} target="_blank" rel="noreferrer" className="text-[13px] font-bold mr-3" style={{ color: 'var(--p-primary)' }}>Open</a>
                      <button
                        onClick={() => setHistoryForId(historyForId === l.id ? null : l.id)}
                        className="text-[13px] font-bold mr-3"
                        style={{ color: 'var(--p-on-surface-variant)' }}
                      >
                        {historyForId === l.id ? 'Hide history' : 'Show history for this'}
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

      {open && <CreateModal onClose={() => setOpen(false)} onCreate={(d) => createMut.mutate(d)} saving={createMut.isPending} />}
    </AdminShell>
  );
}

/**
 * Full attempt trail for one link — every Requested/Failed/Paid row stays visible forever,
 * even after a later attempt on the same link succeeds. The main row above only ever shows
 * the link's current active/paid state; this is where the failed attempts live.
 */
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

const inputCls = 'w-full h-10 px-3 rounded-lg border text-[14px] focus:outline-none';
const fieldStyle = { borderColor: 'var(--p-outline-variant)' } as React.CSSProperties;
const labelCls = 'block text-[11px] font-semibold uppercase tracking-wide text-[color:var(--p-on-surface-variant)] mb-1';

function newItem(): PaymentLinkItem {
  return { id: Math.random().toString(36).slice(2), description: '', qty: 1, rate: 0 };
}

/** Every client with at least one project, derived client-side from the same
 *  project/inquiry data AdminClients.tsx uses — no dedicated backend endpoint exists. */
function buildClientOptions(projects: ManufacturingProjectDto[], inquiries: { clientEmail?: string; clientPhone?: string; accountEmail?: string; accountPhone?: string }[]) {
  const phoneByEmail = new Map<string, string>();
  for (const inq of inquiries) {
    const email = (inq.clientEmail || inq.accountEmail || '').toLowerCase().trim();
    const phone = inq.clientPhone || inq.accountPhone;
    if (email && phone && !phoneByEmail.has(email)) phoneByEmail.set(email, phone);
  }
  const byEmail = new Map<string, { email: string; name: string; phone?: string; projects: ManufacturingProjectDto[] }>();
  for (const p of projects) {
    const email = (p.clientEmail || '').toLowerCase().trim();
    if (!email) continue;
    if (!byEmail.has(email)) {
      byEmail.set(email, { email, name: p.clientName || email, phone: phoneByEmail.get(email), projects: [] });
    }
    byEmail.get(email)!.projects.push(p);
  }
  return Array.from(byEmail.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Multi-step "New payment link" flow.
 * - Free link: build an amount from optional line items (or a flat number), type in
 *   whoever it's for — not linked to any client/project.
 * - Client link: pick a client, then one of their projects. The project's live
 *   quotation is shown purely for reference; the admin always types the amount
 *   themselves — never capped, floored, or derived from the quotation.
 */
function CreateModal({ onClose, onCreate, saving }: { onClose: () => void; onCreate: (d: Partial<PaymentLinkDto>) => void; saving: boolean }) {
  const [kind, setKind] = useState<LinkKind | null>(null);
  const [step, setStep] = useState(0);

  // Free link state
  const [useItems, setUseItems] = useState(false);
  const [items, setItems] = useState<PaymentLinkItem[]>([newItem()]);
  const [flatAmount, setFlatAmount] = useState('');
  const [freeName, setFreeName] = useState('');
  const [freeEmail, setFreeEmail] = useState('');
  const [freePhone, setFreePhone] = useState('');

  // Client link state
  const [selectedClientEmail, setSelectedClientEmail] = useState('');
  const [selectedProjectCode, setSelectedProjectCode] = useState('');
  const [clientAmount, setClientAmount] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  // Shared state
  const [title, setTitle] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [note, setNote] = useState('');

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['admin-projects', 'link-picker'],
    queryFn: () => projectApi.list(),
    enabled: kind === 'CLIENT',
  });
  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery({
    queryKey: ['admin-inquiries', 'link-picker'],
    queryFn: () => manufacturingApi.listInquiries(),
    enabled: kind === 'CLIENT',
  });
  const clientsLoading = projectsLoading || inquiriesLoading;
  const clientOptions = useMemo(() => buildClientOptions(projects, inquiries), [projects, inquiries]);
  const filteredClientOptions = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clientOptions;
    return clientOptions.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [clientOptions, clientSearch]);
  const selectedClient = clientOptions.find((c) => c.email === selectedClientEmail) || null;
  const selectedProject = selectedClient?.projects.find((p) => p.code === selectedProjectCode) || null;
  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    const list = selectedClient?.projects || [];
    if (!q) return list;
    return list.filter((p) => (p.title || '').toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  }, [selectedClient, projectSearch]);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['financial-overview', 'admin', selectedProjectCode],
    queryFn: () => projectApi.getFinancialOverview(selectedProjectCode),
    enabled: !!selectedProjectCode,
  });

  const itemsTotal = useMemo(() => items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0), [items]);

  const updateItem = (id: string, patch: Partial<PaymentLinkItem>) =>
    setItems((xs) => xs.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const addItem = () => setItems((xs) => [...xs, newItem()]);
  const removeItem = (id: string) => setItems((xs) => (xs.length > 1 ? xs.filter((it) => it.id !== id) : xs));

  const reset = (nextKind: LinkKind) => {
    setKind(nextKind);
    setStep(1);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const canProceedFreeStep1 = useItems ? items.some((it) => it.description.trim() && (Number(it.qty) || 0) * (Number(it.rate) || 0) > 0) || (Number(flatAmount) > 0)
    : Number(flatAmount) > 0;
  const canProceedClientStep2 = !!selectedProjectCode;
  const canSubmitClient = Number(clientAmount) > 0;

  const submit = () => {
    if (kind === 'FREE') {
      const amount = useItems && itemsTotal > 0 ? itemsTotal : Number(flatAmount);
      if (!(amount > 0)) { toast.error('Add items or enter an amount'); return; }
      if (!freeName && !freeEmail && !freePhone) { toast.error('Add at least a name, email, or phone for this payment'); return; }
      onCreate({
        mode: 'FIXED', title: title || undefined, currency, amount,
        clientName: freeName || undefined, clientEmail: freeEmail || undefined, clientPhone: freePhone || undefined,
        itemsJson: useItems ? JSON.stringify(items.filter((it) => it.description.trim())) : undefined,
        note: note || undefined,
      });
    } else if (kind === 'CLIENT') {
      if (!selectedProject || !selectedClient) { toast.error('Select a client and project'); return; }
      if (!canSubmitClient) { toast.error('Enter an amount'); return; }
      onCreate({
        mode: 'QUOTE', title: title || undefined, currency, amount: Number(clientAmount),
        clientName: selectedClient.name, clientEmail: selectedClient.email, clientPhone: selectedClient.phone,
        projectCode: selectedProject.code,
        quoteReference: overview?.liveQuotation?.reference || undefined,
        note: note || undefined,
      });
    }
  };

  // ---- Step 0: choose kind ----
  if (step === 0) {
    return (
      <ModalShell onClose={onClose} title="New payment link">
        <div className="p-6 space-y-2">
          {KINDS.map((k) => (
            <button key={k.key} type="button" onClick={() => reset(k.key)} className="w-full text-left p-4 rounded-xl border flex items-start gap-3 hover:bg-black/[0.02]" style={fieldStyle}>
              <Sym name={k.icon} className="text-[18px] mt-0.5 shrink-0" style={{ color: 'var(--p-primary)' }} />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">{k.label}</div>
                <p className="text-[12px] text-[color:var(--p-on-surface-variant)] mt-0.5">{k.hint}</p>
              </div>
              <span title={k.info} onClick={(e) => e.stopPropagation()} className="shrink-0 mt-0.5 cursor-help" style={{ color: 'var(--p-on-surface-variant)' }}>
                <Sym name="info" className="text-[16px]" />
              </span>
            </button>
          ))}
        </div>
      </ModalShell>
    );
  }

  // ---- Free link: step 1 = amount, step 2 = who it's for ----
  if (kind === 'FREE') {
    if (step === 1) {
      return (
        <ModalShell onClose={onClose} title="Free link — amount" onBack={back}>
          <div className="p-6 space-y-4">
            <div className="flex items-center bg-black/[0.04] rounded-lg p-1 w-fit">
              <button type="button" onClick={() => setUseItems(false)} className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold ${!useItems ? 'bg-white shadow-sm' : ''}`} style={{ color: !useItems ? 'var(--p-primary)' : 'var(--p-on-surface-variant)' }}>Flat amount</button>
              <button type="button" onClick={() => setUseItems(true)} className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold ${useItems ? 'bg-white shadow-sm' : ''}`} style={{ color: useItems ? 'var(--p-primary)' : 'var(--p-on-surface-variant)' }}>Line items</button>
            </div>

            {!useItems ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className={labelCls}>Amount</label>
                  <input type="number" value={flatAmount} onChange={(e) => setFlatAmount(e.target.value)} placeholder="0" className={inputCls} style={fieldStyle} />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls} style={fieldStyle}>
                    {Object.keys(CUR).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_70px_90px_90px_28px] gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>
                  <span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span><span />
                </div>
                {items.map((it) => (
                  <div key={it.id} className="grid grid-cols-[1fr_70px_90px_90px_28px] gap-1.5 items-center">
                    <input value={it.description} onChange={(e) => updateItem(it.id, { description: e.target.value })} placeholder="e.g. Sample charges" className="h-9 px-2 rounded-lg border text-[13px] focus:outline-none" style={fieldStyle} />
                    <input type="number" value={it.qty} onChange={(e) => updateItem(it.id, { qty: Number(e.target.value) })} className="h-9 px-2 rounded-lg border text-[13px] focus:outline-none" style={fieldStyle} />
                    <input type="number" value={it.rate} onChange={(e) => updateItem(it.id, { rate: Number(e.target.value) })} className="h-9 px-2 rounded-lg border text-[13px] focus:outline-none" style={fieldStyle} />
                    <span className="text-[12px] font-semibold text-right pr-1">{money((Number(it.qty) || 0) * (Number(it.rate) || 0), currency)}</span>
                    <button type="button" onClick={() => removeItem(it.id)} className="w-7 h-7 rounded hover:bg-black/5 flex items-center justify-center" style={{ color: 'var(--p-on-surface-variant)' }}><Sym name="close" className="text-[14px]" /></button>
                  </div>
                ))}
                <button type="button" onClick={addItem} className="text-[12px] font-bold" style={{ color: 'var(--p-primary)' }}>+ Add item</button>
                <div className="flex items-center justify-between pt-2 border-t" style={fieldStyle}>
                  <span className="text-[12px] font-bold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>Items total</span>
                  <span className="text-[16px] font-bold">{money(itemsTotal, currency)}</span>
                </div>
                <div>
                  <label className={labelCls}>Amount to charge (defaults to items total — edit freely)</label>
                  <input type="number" value={flatAmount || (itemsTotal > 0 ? String(itemsTotal) : '')} onChange={(e) => setFlatAmount(e.target.value)} placeholder={String(itemsTotal || 0)} className={inputCls} style={fieldStyle} />
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>Title (shown on page)</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sample order payment" className={inputCls} style={fieldStyle} />
            </div>
          </div>
          <ModalFooter onCancel={onClose} onNext={() => setStep(2)} nextDisabled={!canProceedFreeStep1} nextLabel="Next" />
        </ModalShell>
      );
    }
    if (step === 2) {
      return (
        <ModalShell onClose={onClose} title="Free link — who's paying" onBack={back}>
          <div className="p-6 space-y-4">
            <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>Not linked to a project — anyone with the link can pay. Fill in at least one contact detail so they get notified.</p>
            <div>
              <label className={labelCls}>Name</label>
              <input value={freeName} onChange={(e) => setFreeName(e.target.value)} className={inputCls} style={fieldStyle} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Email</label><input value={freeEmail} onChange={(e) => setFreeEmail(e.target.value)} className={inputCls} style={fieldStyle} /></div>
              <div><label className={labelCls}>Phone</label><input value={freePhone} onChange={(e) => setFreePhone(e.target.value)} className={inputCls} style={fieldStyle} /></div>
            </div>
            <div>
              <label className={labelCls}>Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} style={fieldStyle} />
            </div>
          </div>
          <ModalFooter onCancel={onClose} onNext={submit} nextDisabled={saving} nextLabel={saving ? 'Creating…' : 'Create link'} />
        </ModalShell>
      );
    }
  }

  // ---- Client link: step 1 = client, step 2 = project, step 3 = amount ----
  if (kind === 'CLIENT') {
    if (step === 1) {
      return (
        <ModalShell onClose={onClose} title="Client link — choose client" onBack={back}>
          <div className="px-6 pt-4 pb-2 shrink-0">
            <div className="relative">
              <Sym name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
              <input
                autoFocus
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search clients by name or email…"
                className="w-full h-10 pl-9 pr-3 rounded-lg border text-[14px] focus:outline-none"
                style={fieldStyle}
              />
            </div>
          </div>
          <div className="px-6 pb-6 space-y-2 max-h-[55vh] overflow-y-auto">
            {clientsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Sym name="progress_activity" className="text-[24px] animate-spin" style={{ color: 'var(--p-primary)' }} />
              </div>
            ) : clientOptions.length === 0 ? (
              <p className="text-[13px] text-center py-8" style={{ color: 'var(--p-on-surface-variant)' }}>No clients with projects yet.</p>
            ) : filteredClientOptions.length === 0 ? (
              <p className="text-[13px] text-center py-8" style={{ color: 'var(--p-on-surface-variant)' }}>No clients match "{clientSearch}".</p>
            ) : filteredClientOptions.map((c) => (
              <button
                key={c.email}
                type="button"
                onClick={() => { setSelectedClientEmail(c.email); setSelectedProjectCode(''); setProjectSearch(''); setStep(2); }}
                className="w-full text-left p-3 rounded-xl border hover:bg-black/[0.02] flex items-center gap-3"
                style={fieldStyle}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-[13px]" style={{ background: 'rgba(0,103,106,0.1)', color: 'var(--p-primary)' }}>
                  {c.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold truncate">{c.name}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{c.email} · {c.projects.length} project{c.projects.length === 1 ? '' : 's'}</p>
                </div>
                <Sym name="chevron_right" className="text-[16px] opacity-40 shrink-0" />
              </button>
            ))}
          </div>
        </ModalShell>
      );
    }
    if (step === 2 && selectedClient) {
      return (
        <ModalShell onClose={onClose} title={`${selectedClient.name} — choose project`} onBack={back}>
          {selectedClient.projects.length > 5 && (
            <div className="px-6 pt-4 pb-2 shrink-0">
              <div className="relative">
                <Sym name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                <input
                  autoFocus
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search projects…"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border text-[14px] focus:outline-none"
                  style={fieldStyle}
                />
              </div>
            </div>
          )}
          <div className="px-6 pb-6 space-y-2 max-h-[55vh] overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <p className="text-[13px] text-center py-8" style={{ color: 'var(--p-on-surface-variant)' }}>No projects match "{projectSearch}".</p>
            ) : filteredProjects.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => { setSelectedProjectCode(p.code); setStep(3); }}
                className="w-full text-left p-3 rounded-xl border hover:bg-black/[0.02] flex items-center gap-3"
                style={fieldStyle}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold truncate">{p.title || p.code}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{p.code} · {p.currentStage}</p>
                </div>
                <Sym name="chevron_right" className="text-[16px] opacity-40 shrink-0" />
              </button>
            ))}
          </div>
        </ModalShell>
      );
    }
    if (step === 3 && selectedProject) {
      return (
        <ModalShell onClose={onClose} title="Client link — amount" onBack={back}>
          <div className="p-6 space-y-4">
            <div className="rounded-xl border p-3" style={fieldStyle}>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Live quotation (reference only)</p>
              {overviewLoading ? (
                <div className="flex items-center gap-2 py-1">
                  <Sym name="progress_activity" className="text-[16px] animate-spin" style={{ color: 'var(--p-primary)' }} />
                  <span className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>Loading…</span>
                </div>
              ) : overview?.liveQuotation ? (
                <p className="text-[13px] font-semibold">{overview.liveQuotation.reference} — {money(overview.liveQuotation.total, overview.liveQuotation.currency)}</p>
              ) : (
                <p className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>No quotation on this project yet.</p>
              )}
              <p className="text-[11px] mt-1" style={{ color: 'var(--p-on-surface-variant)' }}>Shown for context only — the amount you charge below is never capped, floored, or derived from this.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className={labelCls}>Amount to charge</label>
                <input type="number" value={clientAmount} onChange={(e) => setClientAmount(e.target.value)} placeholder="0" className={inputCls} style={fieldStyle} />
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls} style={fieldStyle}>
                  {Object.keys(CUR).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Title (shown on page)</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Advance payment" className={inputCls} style={fieldStyle} />
            </div>
            <div>
              <label className={labelCls}>Note — what this is for (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} style={fieldStyle} />
            </div>
          </div>
          <ModalFooter onCancel={onClose} onNext={submit} nextDisabled={!canSubmitClient || saving} nextLabel={saving ? 'Creating…' : 'Create link'} />
        </ModalShell>
      );
    }
  }

  return null;
}

function ModalShell({ onClose, onBack, title, children }: { onClose: () => void; onBack?: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center gap-2 shrink-0" style={fieldStyle}>
          {onBack && (
            <button onClick={onBack} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center -ml-1" style={{ color: 'var(--p-on-surface-variant)' }}>
              <Sym name="arrow_back" className="text-[18px]" />
            </button>
          )}
          <h3 className="font-bold text-[16px] flex-1">{title}</h3>
          <button onClick={onClose} className="msym text-[color:var(--p-on-surface-variant)] hover:opacity-70"><Sym name="close" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onNext, nextDisabled, nextLabel }: { onCancel: () => void; onNext: () => void; nextDisabled?: boolean; nextLabel: string }) {
  return (
    <div className="px-6 py-4 border-t flex justify-end gap-2 shrink-0" style={fieldStyle}>
      <button onClick={onCancel} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={fieldStyle}>Cancel</button>
      <button onClick={onNext} disabled={nextDisabled} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: 'var(--p-primary)' }}>{nextLabel}</button>
    </div>
  );
}
