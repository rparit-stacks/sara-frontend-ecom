import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminShell from '@/components/portal/AdminShell';
import { Pill } from '@/components/portal/Pill';
import { Sym } from '@/components/portal/Sym';
import StatStrip from '@/components/portal/StatStrip';
import ListToolbar, { ViewToggle, useListView } from '@/components/portal/ListToolbar';
import LedgerList, { LedgerSkeleton, PaAvatar } from '@/components/portal/LedgerList';
import { manufacturingApi, ManufacturingInquiryDto } from '@/lib/api';
import { statusLabel } from '@/components/inquiry/inquiryUtils';
import { useMarkNavRead } from '@/hooks/useAdminNotificationCounts';
import { toast } from 'sonner';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';
import { AskAdminAiButton } from '@/components/admin-ai-chat';

const TABS: { key: string; label: string; status?: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'new', label: 'New', status: 'NEW' },
  { key: 'reviewing', label: 'Reviewing', status: 'REVIEWING' },
  { key: 'quoted', label: 'Quoted', status: 'QUOTED' },
  { key: 'all', label: 'All' },
];

export default function PortalAdminInquiries() {
  const { hasAny } = useAdminPermissions();
  const canUpdateStatus = hasAny(P.PORTAL_INQUIRIES_UPDATE_STATUS);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') ?? '';
  // Arriving with a search (e.g. from a design request) defaults to "all" so the match isn't hidden.
  const [tab, setTab] = useState(initialQ ? 'all' : 'open');
  const [query, setQuery] = useState(initialQ);
  const [view, setView] = useListView('inquiries');
  const markRead = useMarkNavRead('inquiries');

  useEffect(() => { markRead(); }, []);

  // One fetch; every tab and its count is derived from it so the counts are always honest.
  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['admin-inquiries', 'all'],
    queryFn: () => manufacturingApi.listInquiries(),
  });

  const q = query.trim().toLowerCase();
  const matchesSearch = (i: ManufacturingInquiryDto) => {
    if (!q) return true;
    const valuesText = i.values ? Object.values(i.values).map((v) => String(v ?? '')).join(' ') : '';
    const hay = [i.reference, i.clientName, i.clientEmail, i.clientPhone, i.brand, valuesText].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  };
  const inTab = (i: ManufacturingInquiryDto, key: string) => {
    const t = TABS.find((x) => x.key === key);
    if (key === 'open') return i.status !== 'DECLINED' && i.status !== 'QUOTED';
    if (t?.status) return i.status === t.status;
    return true;
  };

  const searched = inquiries.filter(matchesSearch);
  const tabs = TABS.map((t) => ({ key: t.key, label: t.label, count: searched.filter((i) => inTab(i, t.key)).length }));
  const shown = searched.filter((i) => inTab(i, tab)).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const activeTab = TABS.find((t) => t.key === tab);

  const count = (st: string) => inquiries.filter((i) => i.status === st).length;
  const weekAgo = Date.now() - 7 * 86400000;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => manufacturingApi.updateInquiryStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-inquiries'] });
      toast.success('Inquiry updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update'),
  });

  const setSearch = (v: string) => {
    setQuery(v);
    const next = new URLSearchParams(params);
    if (v) next.set('q', v); else next.delete('q');
    setParams(next, { replace: true });
  };

  const displayName = (inq: ManufacturingInquiryDto) => inq.brand || inq.clientName || inq.reference;

  const rows = shown.map((inq) => ({
    key: inq.id,
    date: inq.createdAt,
    accent: inq.status === 'NEW' ? ('warn' as const) : null,
    onClick: () => navigate(`/portal-admin/inquiries/${inq.id}`),
    lead: <PaAvatar name={displayName(inq)} />,
    title: (
      <>
        <span className="truncate">{displayName(inq)}</span>
        {inq.source === 'CUSTOM_DESIGN' && <span className="pa-chip">Custom design</span>}
      </>
    ),
    sub: [inq.reference, inq.clientName !== displayName(inq) ? inq.clientName : null, inq.clientEmail, inq.clientPhone].filter(Boolean).join(' · '),
    status: <Pill label={statusLabel(inq.status)} />,
    actions: (
      <>
        {canUpdateStatus && inq.status === 'NEW' && (
          <button
            onClick={() => statusMutation.mutate({ id: inq.id, status: 'REVIEWING' })}
            className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white hover:brightness-110"
            style={{ background: 'var(--p-primary)' }}
          >
            Start review
          </button>
        )}
        {(!canUpdateStatus || inq.status !== 'NEW') && (
          <button
            onClick={() => navigate(`/portal-admin/inquiries/${inq.id}`)}
            className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border"
            style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}
          >
            Open
          </button>
        )}
      </>
    ),
    more: (
      <>
        <AskAdminAiButton
          size="sm"
          variant="outline"
          label="Ask AI"
          entity={{
            kind: 'inquiry',
            id: inq.id,
            name: displayName(inq),
            pageKey: 'portal.inquiries',
            userEmail: inq.clientEmail,
            extra: `Reference=${inq.reference}, status=${inq.status}, source=${inq.source || 'n/a'}.`,
          }}
        />
        {canUpdateStatus && inq.status !== 'DECLINED' && (
          <button
            onClick={() => statusMutation.mutate({ id: inq.id, status: 'DECLINED' })}
            className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border"
            style={{ borderColor: 'var(--p-outline)', color: 'var(--p-error)' }}
          >
            Decline
          </button>
        )}
      </>
    ),
  }));

  return (
    <AdminShell title="Inquiries">
      <div className="p-4 sm:p-6">
        <StatStrip
          items={[
            { label: 'Waiting for a first look', value: count('NEW'), tone: count('NEW') > 0 ? 'warn' : undefined, onClick: () => setTab('new'), active: tab === 'new' },
            { label: 'Being reviewed', value: count('REVIEWING'), onClick: () => setTab('reviewing'), active: tab === 'reviewing' },
            { label: 'Quoted', value: count('QUOTED'), onClick: () => setTab('quoted'), active: tab === 'quoted' },
            { label: 'Received this week', value: inquiries.filter((i) => +new Date(i.createdAt) >= weekAgo).length },
          ]}
        />

        <ListToolbar tabs={tabs} tab={tab} onTab={setTab} search={query} onSearch={setSearch} placeholder="Name, email, reference…">
          <ViewToggle view={view} onChange={setView} />
        </ListToolbar>

        {isLoading ? (
          <LedgerSkeleton />
        ) : shown.length === 0 && q ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
            <Sym name="search_off" className="text-[40px]" />
            <p className="mt-2 text-[15px] font-semibold">No matches for “{query}”</p>
            <p className="text-[13px]">Searched reference, name, email, phone and submitted answers{tab !== 'all' ? ' in this tab' : ''}.</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button onClick={() => setSearch('')} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: 'var(--p-primary)' }}>Clear search</button>
              {tab !== 'all' && (
                <button onClick={() => setTab('all')} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}>Search all tabs</button>
              )}
            </div>
          </div>
        ) : shown.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
            <Sym name="inbox" className="text-[40px]" />
            <p className="mt-2 text-[15px] font-semibold">{inquiries.length === 0 ? 'No inquiries yet' : `Nothing in ${activeTab?.label ?? 'this view'}`}</p>
            <p className="text-[13px]">{inquiries.length === 0 ? 'Submissions from your website inquiry form will appear here.' : 'Try another tab.'}</p>
            {inquiries.length === 0 && (
              <button onClick={() => navigate('/portal-admin/inquiry-form')} className="mt-4 px-4 py-2 rounded-lg text-[13px] font-semibold text-white inline-flex items-center gap-1.5" style={{ background: 'var(--p-primary)' }}>
                <Sym name="contract_edit" className="text-[16px]" /> Edit inquiry form
              </button>
            )}
          </div>
        ) : (
          <LedgerList rows={rows} layout={view} moreWidth={200} />
        )}
      </div>
    </AdminShell>
  );
}
