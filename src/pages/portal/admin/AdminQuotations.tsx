import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell, { AdminBtn } from '@/components/portal/AdminShell';
import { Pill } from '@/components/portal/Pill';
import { Sym } from '@/components/portal/Sym';
import { manufacturingApi, type ManufacturingQuoteDto } from '@/lib/api';
import { formatInquiryDate, portalDateKey, portalDateSearchText } from '@/components/inquiry/inquiryUtils';

const CUR: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const money = (n: number, c: string) => `${CUR[c] ?? ''}${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Tab = 'quotes' | 'templates';
type ForKind = 'inquiry' | 'external';

function quoteMatchesSearch(q: ManufacturingQuoteDto, term: string, dateFilter: string): boolean {
  if (dateFilter) {
    const created = portalDateKey(q.createdAt);
    const updated = portalDateKey(q.updatedAt);
    if (created !== dateFilter && updated !== dateFilter) return false;
  }
  if (!term) return true;
  const hay = [
    q.reference,
    String(q.id),
    q.title,
    q.clientName,
    q.clientEmail,
    q.clientPhone,
    q.status,
    q.inquiryId != null ? String(q.inquiryId) : '',
    portalDateSearchText(q.createdAt),
    portalDateSearchText(q.updatedAt),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  // Allow multi-word search: every token must match somewhere.
  return term.split(/\s+/).filter(Boolean).every((tok) => hay.includes(tok));
}

/**
 * "Use template" asks who the new quotation is for, then either links an
 * existing inquiry (client data pulled from it; nothing else about the
 * template changes) or takes manually-entered client details for a
 * standalone/external quote. Everything else — sections, pricing, branding —
 * is always copied byte-for-byte from the template.
 */
function UseTemplateModal({
  template,
  onClose,
  onConfirm,
  pending,
}: {
  template: ManufacturingQuoteDto;
  onClose: () => void;
  onConfirm: (opts: { inquiryId?: number; clientName?: string; clientEmail?: string; clientPhone?: string }) => void;
  pending: boolean;
}) {
  const [kind, setKind] = useState<ForKind>('inquiry');
  const [q, setQ] = useState('');
  const [pickedInquiryId, setPickedInquiryId] = useState<number | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['admin-inquiries', 'use-template'],
    queryFn: () => manufacturingApi.listInquiries(),
    enabled: kind === 'inquiry',
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return inquiries;
    return inquiries.filter((i) =>
      [i.reference, i.clientName, i.brand, i.clientEmail, i.clientPhone].filter(Boolean).some((s) => String(s).toLowerCase().includes(term)),
    );
  }, [inquiries, q]);

  const canConfirm = kind === 'inquiry' ? pickedInquiryId != null : clientName.trim().length > 0 || clientEmail.trim().length > 0 || clientPhone.trim().length > 0;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border rounded-2xl shadow-2xl p-6" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
        <h3 className="font-display text-[18px] mb-1">Use template</h3>
        <p className="text-[13px] mb-4" style={{ color: 'var(--p-on-surface-variant)' }}>
          "{template.title}" — everything stays the same, only the client changes.
        </p>

        <div className="flex items-center bg-black/[0.04] rounded-lg p-1 w-fit mb-4">
          {([['inquiry', 'For an inquiry'], ['external', 'External']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setKind(key)}
              className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${kind === key ? 'bg-white shadow-sm' : ''}`}
              style={{ color: kind === key ? 'var(--p-primary)' : 'var(--p-on-surface-variant)' }}
            >
              {label}
            </button>
          ))}
        </div>

        {kind === 'inquiry' ? (
          <div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by reference, client, brand…"
              className="w-full h-9 px-2.5 rounded-lg border text-[13px] mb-2 outline-none focus:ring-2 focus:ring-[#00676a]/20"
              style={{ borderColor: 'var(--p-outline-variant)' }}
            />
            <div className="max-h-56 overflow-y-auto rounded-lg border divide-y" style={{ borderColor: 'var(--p-outline-variant)' }}>
              {isLoading ? (
                <p className="px-3 py-4 text-[12px] text-center" style={{ color: 'var(--p-on-surface-variant)' }}>Loading…</p>
              ) : filtered.length === 0 ? (
                <p className="px-3 py-4 text-[12px] text-center" style={{ color: 'var(--p-on-surface-variant)' }}>No inquiries found.</p>
              ) : (
                filtered.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => setPickedInquiryId(i.id)}
                    className="w-full text-left px-3 py-2 hover:bg-black/[0.02] flex items-center gap-3"
                    style={{ background: pickedInquiryId === i.id ? 'var(--p-primary-container)' : undefined }}
                  >
                    <span className="text-[12px] font-bold shrink-0" style={{ color: 'var(--p-primary)' }}>{i.reference}</span>
                    <span className="text-[13px] truncate flex-1">{i.clientName || i.brand || '—'}</span>
                    <span className="text-[11px] truncate hidden sm:block" style={{ color: 'var(--p-on-surface-variant)' }}>{i.clientEmail}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Client name</label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Aanya Textiles"
                className="w-full h-10 px-3 rounded-lg border text-[14px] outline-none focus:ring-2 focus:ring-[#00676a]/20"
                style={{ borderColor: 'var(--p-outline-variant)' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Client email</label>
              <input
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="e.g. client@example.com"
                className="w-full h-10 px-3 rounded-lg border text-[14px] outline-none focus:ring-2 focus:ring-[#00676a]/20"
                style={{ borderColor: 'var(--p-outline-variant)' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Client phone</label>
              <input
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="e.g. 98290 00000"
                className="w-full h-10 px-3 rounded-lg border text-[14px] outline-none focus:ring-2 focus:ring-[#00676a]/20"
                style={{ borderColor: 'var(--p-outline-variant)' }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--p-outline)' }}>Cancel</button>
          <button
            type="button"
            disabled={!canConfirm || pending}
            onClick={() =>
              onConfirm(
                kind === 'inquiry'
                  ? { inquiryId: pickedInquiryId! }
                  : {
                      clientName: clientName.trim() || undefined,
                      clientEmail: clientEmail.trim() || undefined,
                      clientPhone: clientPhone.trim() || undefined,
                    },
              )
            }
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--p-primary)' }}
          >
            {pending ? 'Creating…' : 'Create quotation'}
          </button>
        </div>
      </div>
    </>
  );
}

/** "New quotation" asks Fresh vs Template before landing in either flow. */
function NewQuotationChooserModal({
  onClose, onFresh, onPickTemplate,
}: {
  onClose: () => void;
  onFresh: () => void;
  onPickTemplate: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border rounded-2xl shadow-2xl p-6" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
        <h3 className="font-display text-[18px] mb-1">New quotation</h3>
        <p className="text-[13px] mb-4" style={{ color: 'var(--p-on-surface-variant)' }}>How do you want to start?</p>
        <div className="grid gap-3">
          <button
            onClick={onPickTemplate}
            className="text-left p-4 rounded-xl border hover:bg-black/[0.02] flex items-center gap-3"
            style={{ borderColor: 'var(--p-outline-variant)' }}
          >
            <Sym name="content_copy" className="text-[22px]" style={{ color: 'var(--p-primary)' }} />
            <div>
              <div className="text-[14px] font-semibold">Create from existing template</div>
              <div className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>Reuse sections, pricing & branding from a saved template.</div>
            </div>
          </button>
          <button
            onClick={onFresh}
            className="text-left p-4 rounded-xl border hover:bg-black/[0.02] flex items-center gap-3"
            style={{ borderColor: 'var(--p-outline-variant)' }}
          >
            <Sym name="note_add" className="text-[22px]" style={{ color: 'var(--p-primary)' }} />
            <div>
              <div className="text-[14px] font-semibold">Create fresh</div>
              <div className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>Start from a blank quotation.</div>
            </div>
          </button>
        </div>
        <div className="flex justify-end mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--p-outline)' }}>Cancel</button>
        </div>
      </div>
    </>
  );
}

export default function PortalAdminQuotations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const inquiryFilter = params.get('inquiry');
  const [tab, setTab] = useState<Tab>('quotes');
  const [templateModal, setTemplateModal] = useState<ManufacturingQuoteDto | null>(null);
  const [showEntryChooser, setShowEntryChooser] = useState(false);
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [dateFilter, setDateFilter] = useState(params.get('date') ?? '');
  const [statusFilter, setStatusFilter] = useState(params.get('status') ?? '');
  const [minAmount, setMinAmount] = useState(params.get('minAmount') ?? '');
  const [maxAmount, setMaxAmount] = useState(params.get('maxAmount') ?? '');
  const [menu, setMenu] = useState<number | null>(null);

  const { data: quotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ['admin-quotes', 'quotes'],
    queryFn: () => manufacturingApi.listQuotes(false),
  });
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['admin-quotes', 'templates'],
    queryFn: () => manufacturingApi.listQuotes(true),
  });

  const useTemplate = useMutation({
    mutationFn: (opts: { inquiryId?: number; clientName?: string; clientEmail?: string; clientPhone?: string }) =>
      manufacturingApi.duplicateQuote(templateModal!.id, opts),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      setTemplateModal(null);
      toast.success(`New quotation created from template · ${created.reference}`);
      navigate(`/portal-admin/quote-editor/${created.reference}`);
    },
    onError: (e) => toast.error((e as Error).message || 'Failed to use template'),
  });

  const deleteQuote = useMutation({
    mutationFn: (id: number) => manufacturingApi.deleteQuote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-project-financials'] });
      queryClient.invalidateQueries({ queryKey: ['admin-project-shell'] });
      queryClient.invalidateQueries({ queryKey: ['admin-project-messages'] });
      queryClient.invalidateQueries({ queryKey: ['client-project-financials'] });
      queryClient.invalidateQueries({ queryKey: ['client-project-shell'] });
      queryClient.invalidateQueries({ queryKey: ['client-portal-aggregate'] });
      toast.success(tab === 'templates' ? 'Template deleted' : 'Quotation deleted');
    },
    onError: (e) => toast.error((e as Error).message || 'Failed to delete'),
  });

  const convertToProject = useMutation({
    mutationFn: (id: number) => manufacturingApi.convertQuoteToProject(id),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      toast.success(`Project created · ${project.code}`);
      navigate(`/portal-admin/projects/${project.code}`);
    },
    onError: (e) => toast.error((e as Error).message || 'Failed to convert to project'),
  });

  const confirmDelete = (q: ManufacturingQuoteDto) => {
    const kind = tab === 'templates' ? 'template' : 'quotation';
    const linked = q.inquiryId
      ? ' It will also be removed from the linked project (and from the client portal if it was already sent).'
      : '';
    if (!window.confirm(`Delete ${kind} "${q.reference}" permanently?${linked} This cannot be undone.`)) return;
    deleteQuote.mutate(q.id);
  };

  const syncParams = (nextQ: string, nextDate: string, nextStatus: string, nextMinAmount: string, nextMaxAmount: string) => {
    const next = new URLSearchParams(params);
    if (nextQ) next.set('q', nextQ); else next.delete('q');
    if (nextDate) next.set('date', nextDate); else next.delete('date');
    if (nextStatus) next.set('status', nextStatus); else next.delete('status');
    if (nextMinAmount) next.set('minAmount', nextMinAmount); else next.delete('minAmount');
    if (nextMaxAmount) next.set('maxAmount', nextMaxAmount); else next.delete('maxAmount');
    setParams(next, { replace: true });
  };

  const isLoading = tab === 'quotes' ? loadingQuotes : loadingTemplates;
  const list = tab === 'quotes' ? quotes : templates;
  const term = query.trim().toLowerCase();
  const statuses = useMemo(
    () => Array.from(new Set(quotes.map((q) => q.status).filter(Boolean))).sort(),
    [quotes],
  );

  const shown = useMemo(() => {
    let rows = list;
    if (inquiryFilter && tab === 'quotes') {
      const id = Number(inquiryFilter);
      rows = rows.filter((q) => q.inquiryId === id);
    }
    const minimum = minAmount === '' ? null : Number(minAmount);
    const maximum = maxAmount === '' ? null : Number(maxAmount);
    return rows.filter((q) =>
      quoteMatchesSearch(q, term, dateFilter)
      && (!statusFilter || tab === 'templates' || q.status === statusFilter)
      && (minimum == null || Number.isNaN(minimum) || q.total >= minimum)
      && (maximum == null || Number.isNaN(maximum) || q.total <= maximum),
    );
  }, [list, inquiryFilter, tab, term, dateFilter, statusFilter, minAmount, maxAmount]);

  const hasFilters = !!term || !!dateFilter || !!statusFilter || !!minAmount || !!maxAmount;
  const clearFilters = () => {
    setQuery('');
    setDateFilter('');
    setStatusFilter('');
    setMinAmount('');
    setMaxAmount('');
    syncParams('', '', '', '', '');
  };

  return (
    <AdminShell
      title={inquiryFilter ? 'Quotations · Project' : 'Quotations'}
      actions={<AdminBtn icon="add" onClick={() => setShowEntryChooser(true)}>New quotation</AdminBtn>}
    >
      <div className="p-5 sm:p-8">
        {inquiryFilter && (
          <p className="text-[13px] mb-4" style={{ color: 'var(--p-on-surface-variant)' }}>
            Showing quotes for inquiry #{inquiryFilter}
            <button onClick={() => navigate('/portal-admin/quotations')} className="ml-2 font-bold underline" style={{ color: 'var(--p-primary)' }}>Show all</button>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center bg-black/[0.04] rounded-lg p-1 w-fit">
            {([['quotes', 'Quotations'], ['templates', 'Templates']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${tab === key ? 'bg-white shadow-sm' : ''}`}
                style={{ color: tab === key ? 'var(--p-primary)' : 'var(--p-on-surface-variant)' }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <Sym name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  syncParams(e.target.value, dateFilter, statusFilter, minAmount, maxAmount);
                }}
                placeholder="Search name, phone, quote ID, date…"
                className="pl-8 pr-3 py-1.5 rounded-lg text-[13px] w-64 sm:w-72 outline-none border"
                style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
              />
            </div>
            {tab === 'quotes' && (
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  syncParams(query, dateFilter, e.target.value, minAmount, maxAmount);
                }}
                aria-label="Filter by status"
                className="px-3 py-1.5 rounded-lg text-[13px] outline-none border"
                style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface)' }}
              >
                <option value="">All statuses</option>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            )}
            <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
              <input
                type="number"
                min="0"
                value={minAmount}
                onChange={(e) => {
                  setMinAmount(e.target.value);
                  syncParams(query, dateFilter, statusFilter, e.target.value, maxAmount);
                }}
                placeholder="Min amount"
                aria-label="Minimum amount"
                className="w-24 px-2.5 py-1.5 text-[13px] outline-none bg-transparent"
              />
              <span className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>–</span>
              <input
                type="number"
                min="0"
                value={maxAmount}
                onChange={(e) => {
                  setMaxAmount(e.target.value);
                  syncParams(query, dateFilter, statusFilter, minAmount, e.target.value);
                }}
                placeholder="Max amount"
                aria-label="Maximum amount"
                className="w-24 px-2.5 py-1.5 text-[13px] outline-none bg-transparent"
              />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                syncParams(query, e.target.value, statusFilter, minAmount, maxAmount);
              }}
              title="Filter by created or updated date"
              aria-label="Filter by created or updated date"
              className="px-3 py-1.5 rounded-lg text-[13px] outline-none border"
              style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface)' }}
            />
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[12px] font-bold underline"
                style={{ color: 'var(--p-primary)' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {hasFilters && shown.length > 0 && (
          <p className="text-[12px] mb-3" style={{ color: 'var(--p-on-surface-variant)' }}>
            {shown.length} result{shown.length !== 1 ? 's' : ''}
            {term ? <> for “{query}”</> : null}
            {dateFilter ? <> on {formatInquiryDate(dateFilter).replace(/,.*/, '')}</> : null}
          </p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="progress_activity" className="text-[28px] animate-spin" />
          </div>
        ) : shown.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
            <Sym name={hasFilters ? 'search_off' : 'request_quote'} className="text-[40px]" />
            <p className="mt-2 text-[15px] font-semibold">
              {hasFilters
                ? 'No matches'
                : tab === 'templates'
                  ? 'No templates yet'
                  : 'No quotations yet'}
            </p>
            <p className="text-[13px]">
              {hasFilters
                ? 'Try changing or clearing the active filters.'
                : tab === 'templates'
                  ? 'Open a quotation and choose "Save as template" to reuse it later.'
                  : 'Create one from an inquiry or start a blank quotation.'}
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 px-4 py-2 rounded-lg text-[13px] font-semibold border"
                style={{ borderColor: 'var(--p-outline)' }}
              >
                Clear filters
              </button>
            ) : tab === 'quotes' ? (
              <button onClick={() => setShowEntryChooser(true)} className="mt-4 px-4 py-2 rounded-lg text-[13px] font-semibold text-white inline-flex items-center gap-1.5" style={{ background: 'var(--p-primary)' }}>
                <Sym name="add" className="text-[16px]" /> New quotation
              </button>
            ) : null}
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden overflow-x-auto" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr style={{ background: 'var(--p-surface-container-low)' }}>
                  {[tab === 'templates' ? 'Template' : 'Quote', 'Title', 'Client', 'Amount', tab === 'templates' ? 'Updated' : 'Status', 'Created', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((q, i) => (
                  <tr
                    key={q.id}
                    className="cursor-pointer hover:bg-black/[0.02]"
                    style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}
                    onClick={() => (tab === 'templates' ? undefined : navigate(`/portal-admin/quote-editor/${q.reference}`))}
                  >
                    <td className="px-4 py-3 font-semibold text-[13px]">{q.reference}</td>
                    <td className="px-4 py-3 text-[13px]">{q.title}</td>
                    <td className="px-4 py-3 text-[13px]">
                      <div>{q.clientName || '—'}</div>
                      {(q.clientPhone || q.clientEmail) && (
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
                          {[q.clientPhone, q.clientEmail].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-[13px]">{money(q.total, q.currency)}</td>
                    {tab === 'templates' ? (
                      <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{q.updatedAt ? formatInquiryDate(q.updatedAt) : '—'}</td>
                    ) : (
                      <td className="px-4 py-3"><Pill label={q.status} /></td>
                    )}
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{q.createdAt ? formatInquiryDate(q.createdAt) : '—'}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        {tab === 'templates' ? (
                          <button
                            onClick={() => setTemplateModal(q)}
                            className="text-[13px] font-bold px-2 py-1"
                            style={{ color: 'var(--p-primary)' }}
                          >
                            Use template
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/portal-admin/quote-editor/${q.reference}`)}
                            className="text-[13px] font-bold px-2 py-1"
                            style={{ color: 'var(--p-primary)' }}
                          >
                            Edit
                          </button>
                        )}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setMenu(menu === q.id ? null : q.id)}
                            className="p-1.5 rounded hover:bg-black/5"
                          >
                            <Sym name="more_vert" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                          </button>
                          {menu === q.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />
                              <div
                                className="absolute right-0 top-9 w-52 border rounded-lg py-1 z-20 shadow-lg"
                                style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                              >
                                {tab === 'quotes' && q.inquiryId == null && (
                                  <button
                                    type="button"
                                    disabled={convertToProject.isPending}
                                    onClick={() => { setMenu(null); convertToProject.mutate(q.id); }}
                                    className="w-full text-left px-3 py-1.5 text-[13px] flex items-center gap-2 hover:bg-black/5 disabled:opacity-50"
                                    style={{ color: 'var(--p-on-surface)' }}
                                  >
                                    <Sym name="folder_open" className="text-[16px]" />
                                    {convertToProject.isPending && convertToProject.variables === q.id ? 'Creating…' : 'Convert to project'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={deleteQuote.isPending}
                                  onClick={() => { setMenu(null); confirmDelete(q); }}
                                  className="w-full text-left px-3 py-1.5 text-[13px] flex items-center gap-2 hover:bg-black/5 disabled:opacity-50"
                                  style={{ color: '#b42318' }}
                                >
                                  <Sym name="delete" className="text-[16px]" />
                                  {tab === 'templates' ? 'Delete template' : 'Delete quotation'}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEntryChooser && (
        <NewQuotationChooserModal
          onClose={() => setShowEntryChooser(false)}
          onFresh={() => { setShowEntryChooser(false); navigate('/portal-admin/quote-editor/new'); }}
          onPickTemplate={() => { setShowEntryChooser(false); setTab('templates'); }}
        />
      )}

      {templateModal && (
        <UseTemplateModal
          template={templateModal}
          onClose={() => setTemplateModal(null)}
          onConfirm={(opts) => useTemplate.mutate(opts)}
          pending={useTemplate.isPending}
        />
      )}
    </AdminShell>
  );
}
