import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminShell, { AdminBtn } from '@/components/portal/AdminShell';
import { Pill } from '@/components/portal/Pill';
import { Sym } from '@/components/portal/Sym';
import { STAGE_TONE, type Stage } from '@/components/portal/adminData';
import { STAGES, stageDef, statusLabelFor, type StageKey } from '@/components/manufacturing/stages';
import { manufacturingApi, projectApi } from '@/lib/api';

const stageLabel = (key?: string) => stageDef((key as StageKey) || 'INQUIRY').label;
const stageTone = (key?: string) => STAGE_TONE[stageLabel(key) as Stage];

function formatUpdated(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function PortalAdminDashboard() {
  const navigate = useNavigate();

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: () => projectApi.list(),
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ['admin-inquiries-new'],
    queryFn: () => manufacturingApi.listInquiries('NEW'),
  });

  const actionItems = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.currentStatus?.includes('AWAITING') ||
          p.currentStatus?.includes('PENDING') ||
          p.currentStage === 'QUOTATION',
      ),
    [projects],
  );

  const stageCounts = STAGES.map((s) => ({
    s: s.label,
    n: projects.filter((p) => p.currentStage === s.key).length,
  }));
  const maxN = Math.max(...stageCounts.map((x) => x.n), 1);

  const stats = [
    { label: 'Active projects', value: String(projects.length), icon: 'folder_open', accent: true },
    { label: 'Pending approvals', value: String(actionItems.length), icon: 'pending_actions' },
    { label: 'New inquiries', value: String(inquiries.length), icon: 'inbox' },
    { label: 'In production', value: String(projects.filter((p) => p.currentStage === 'PRODUCTION').length), icon: 'factory' },
  ];

  return (
    <AdminShell title="Dashboard" actions={<AdminBtn icon="add" onClick={() => navigate('/portal-admin/inquiries')}>View inquiries</AdminBtn>}>
      <div className="p-5 sm:p-8 max-w-6xl chat-feed-bg">
        {projectsLoading ? (
          <div className="flex justify-center py-20"><Sym name="progress_activity" className="text-[28px] animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((s) => (
                <div key={s.label} className="border rounded-xl p-5" style={{ borderColor: 'var(--p-outline-variant)', background: s.accent ? 'var(--p-surface-container-low)' : 'var(--p-surface-container-lowest)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{s.label}</span>
                    <Sym name={s.icon} className="text-[20px]" style={{ color: 'var(--p-primary)' }} />
                  </div>
                  <p className="font-display text-[32px]" style={{ color: s.accent ? 'var(--p-primary)' : 'var(--p-on-surface)' }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
                  <h3 className="font-bold text-[14px]">Needs your action</h3>
                  <span className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{actionItems.length} items</span>
                </div>
                {actionItems.length === 0 ? (
                  <p className="px-5 py-8 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>All caught up.</p>
                ) : (
                  actionItems.map((p, i) => (
                    <button key={p.code} type="button" onClick={() => navigate(`/portal-admin/projects/${p.code}`)} className="w-full text-left px-5 py-3.5 flex items-center gap-4 hover:bg-black/[0.02]" style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--p-error-container)', color: 'var(--p-on-error-container)' }}>
                        <Sym name="priority_high" className="text-[18px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[14px] truncate">{statusLabelFor(p.currentStage, p.currentStatus)}</p>
                        <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{p.code} · {p.clientName || p.clientEmail || 'Client'}</p>
                      </div>
                      <Pill label={stageLabel(p.currentStage)} tone={stageTone(p.currentStage)} />
                      <Sym name="chevron_right" className="opacity-40" style={{ color: 'var(--p-on-surface-variant)' }} />
                    </button>
                  ))
                )}
              </div>

              <div className="border rounded-xl p-5" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <h3 className="font-bold text-[14px] mb-4">Pipeline by stage</h3>
                <div className="space-y-3">
                  {stageCounts.map(({ s, n }) => (
                    <div key={s}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span style={{ color: 'var(--p-on-surface-variant)' }}>{s}</span>
                        <span className="font-bold">{n}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--p-surface-container-high)' }}>
                        <div className="h-full rounded-full" style={{ width: `${(n / maxN) * 100}%`, background: 'var(--p-primary)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
              <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
                <h3 className="font-bold text-[14px]">Recent projects</h3>
                <button type="button" onClick={() => navigate('/portal-admin/projects')} className="text-[12px] font-semibold hover:underline" style={{ color: 'var(--p-primary)' }}>View all</button>
              </div>
              {projects.slice(0, 4).map((p, i) => (
                <button key={p.code} type="button" onClick={() => navigate(`/portal-admin/projects/${p.code}`)} className="w-full text-left px-5 py-3 flex items-center gap-4 hover:bg-black/[0.02]" style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] truncate">{p.title || p.code}</p>
                    <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{p.code} · {p.clientName || '—'} · {formatUpdated(p.updatedAt)}</p>
                  </div>
                  <Pill label={stageLabel(p.currentStage)} tone={stageTone(p.currentStage)} />
                  {p.valueDisplay && <span className="font-bold text-[13px] w-20 text-right hidden sm:block">{p.valueDisplay}</span>}
                </button>
              ))}
              {projects.length === 0 && (
                <p className="px-5 py-8 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>No projects yet — inquiries auto-create projects when submitted.</p>
              )}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
