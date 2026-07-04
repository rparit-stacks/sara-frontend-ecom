import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminShell from '@/components/portal/AdminShell';
import { Pill } from '@/components/portal/Pill';
import { Sym } from '@/components/portal/Sym';
import { manufacturingApi, ManufacturingInquiryDto } from '@/lib/api';
import { formatInquiryDate, statusLabel } from '@/components/inquiry/inquiryUtils';
import { toast } from 'sonner';

const TABS: { key: string; label: string; status?: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'new', label: 'New', status: 'NEW' },
  { key: 'reviewing', label: 'Reviewing', status: 'REVIEWING' },
  { key: 'quoted', label: 'Quoted', status: 'QUOTED' },
  { key: 'all', label: 'All' },
];

export default function PortalAdminInquiries() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') ?? '';
  // When arriving with a search (e.g. from a design request), default to "all"
  // so the match isn't hidden by the Open-only filter.
  const [tab, setTab] = useState(initialQ ? 'all' : 'open');
  const [query, setQuery] = useState(initialQ);

  const activeTab = TABS.find((t) => t.key === tab);

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['admin-inquiries', activeTab?.status ?? null],
    queryFn: () => manufacturingApi.listInquiries(activeTab?.status),
  });

  const q = query.trim().toLowerCase();
  const shown = inquiries
    .filter((i) => (tab === 'open' ? i.status !== 'DECLINED' && i.status !== 'QUOTED' : true))
    .filter((i) => {
      if (!q) return true;
      // Search top-level fields + all submitted answer values (design type, etc).
      const valuesText = i.values ? Object.values(i.values).map((v) => String(v ?? '')).join(' ') : '';
      const hay = [i.reference, i.clientName, i.clientEmail, i.clientPhone, i.brand, valuesText]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      manufacturingApi.updateInquiryStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-inquiries'] });
      toast.success('Inquiry updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update'),
  });

  const displayName = (inq: ManufacturingInquiryDto) =>
    inq.brand || inq.clientName || inq.reference;

  return (
    <AdminShell title="Inquiries">
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-3 py-1.5 rounded-full text-[13px] font-semibold"
              style={
                t.key === tab
                  ? { background: 'var(--p-primary)', color: '#fff' }
                  : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }
              }
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto relative">
            <Sym name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                const next = new URLSearchParams(params);
                if (e.target.value) next.set('q', e.target.value);
                else next.delete('q');
                setParams(next, { replace: true });
              }}
              placeholder="Search name, email, reference…"
              className="pl-8 pr-3 py-1.5 rounded-lg text-[13px] w-64 outline-none border"
              style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
            />
          </div>
        </div>
        {q && shown.length > 0 && (
          <p className="text-[12px] mb-3" style={{ color: 'var(--p-on-surface-variant)' }}>
            {shown.length} result{shown.length !== 1 ? 's' : ''} for “{query}”
            {tab !== 'all' && <> in <b>{activeTab?.label}</b> · <button onClick={() => setTab('all')} className="underline">search all</button></>}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="border rounded-xl p-5 animate-pulse"
                style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
              >
                <div className="h-3 w-24 rounded mb-3" style={{ background: 'var(--p-surface-container-high)' }} />
                <div className="h-4 w-40 rounded mb-2" style={{ background: 'var(--p-surface-container-high)' }} />
                <div className="h-3 w-56 rounded mb-4" style={{ background: 'var(--p-surface-container-high)' }} />
                <div className="h-8 w-28 rounded-lg" style={{ background: 'var(--p-surface-container-high)' }} />
              </div>
            ))}
          </div>
        ) : shown.length === 0 && q ? (
          // Search returned nothing — make it clear it's a search, not "no data".
          <div
            className="border-2 border-dashed rounded-xl p-12 text-center"
            style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}
          >
            <Sym name="search_off" className="text-[40px]" />
            <p className="mt-2 text-[15px] font-semibold">No matches for “{query}”</p>
            <p className="text-[13px]">
              Searched reference, name, email, phone and submitted answers
              {tab !== 'all' ? ' in this tab' : ''}.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setQuery('');
                  const next = new URLSearchParams(params);
                  next.delete('q');
                  setParams(next, { replace: true });
                }}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white"
                style={{ background: 'var(--p-primary)' }}
              >
                Clear search
              </button>
              {tab !== 'all' && (
                <button
                  onClick={() => setTab('all')}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold border"
                  style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}
                >
                  Search all tabs
                </button>
              )}
            </div>
          </div>
        ) : shown.length === 0 ? (
          <div
            className="border-2 border-dashed rounded-xl p-12 text-center"
            style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}
          >
            <Sym name="inbox" className="text-[40px]" />
            <p className="mt-2 text-[15px] font-semibold">No inquiries yet</p>
            <p className="text-[13px]">
              Submissions from your website inquiry form will appear here.
            </p>
            <button
              onClick={() => navigate('/portal-admin/inquiry-form')}
              className="mt-4 px-4 py-2 rounded-lg text-[13px] font-semibold text-white inline-flex items-center gap-1.5"
              style={{ background: 'var(--p-primary)' }}
            >
              <Sym name="contract_edit" className="text-[16px]" /> Edit inquiry form
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {shown.map((inq) => (
              <div
                key={inq.id}
                className="border rounded-xl p-5"
                style={{
                  borderColor: 'var(--p-outline-variant)',
                  background: inq.status === 'NEW' ? 'var(--p-surface-container-low)' : 'var(--p-surface-container-lowest)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold opacity-60" style={{ color: 'var(--p-on-surface-variant)' }}>
                        {inq.reference}
                      </span>
                      <Pill label={statusLabel(inq.status)} />
                      {inq.source === 'CUSTOM_DESIGN' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#924623]/10 text-[#924623]">
                          Custom Design
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-[16px] mt-1">{displayName(inq)}</h3>
                    <p className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                      {[inq.clientName, inq.clientEmail].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <span className="text-[11px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }}>
                    {formatInquiryDate(inq.createdAt)}
                  </span>
                </div>
                {inq.clientPhone && (
                  <div className="flex items-center gap-4 mb-4 text-[13px]">
                    <span className="flex items-center gap-1">
                      <Sym name="call" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                      {inq.clientPhone}
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/portal-admin/inquiries/${inq.id}`)}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white hover:brightness-110"
                    style={{ background: 'var(--p-primary)' }}
                  >
                    View details
                  </button>
                  {inq.status === 'NEW' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: inq.id, status: 'REVIEWING' })}
                      className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border"
                      style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}
                    >
                      Mark reviewing
                    </button>
                  )}
                  <button
                    onClick={() => statusMutation.mutate({ id: inq.id, status: 'DECLINED' })}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border"
                    style={{ borderColor: 'var(--p-outline)', color: 'var(--p-error)' }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
