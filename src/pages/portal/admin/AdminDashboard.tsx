import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminShell, { AdminBtn } from '@/components/portal/AdminShell';
import { Pill } from '@/components/portal/Pill';
import { Sym } from '@/components/portal/Sym';
import { STAGE_TONE, type Stage } from '@/components/portal/adminData';
import { STAGES, stageDef, statusLabelFor, type StageKey } from '@/components/manufacturing/stages';
import { manufacturingApi, projectApi } from '@/lib/api';
import { getStoredAdminUser, isSuperAdmin } from '@/lib/adminAccess';

const ACTION_PREVIEW_LIMIT = 6;
const RECENT_PREVIEW_LIMIT = 6;

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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function PortalAdminDashboard() {
  const navigate = useNavigate();
  const admin = getStoredAdminUser();
  const superAdmin = isSuperAdmin(admin);

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

  const recentProjects = useMemo(
    () => [...projects].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
    [projects],
  );

  const stageCounts = useMemo(
    () => STAGES.map((s) => ({ s: s.label, n: projects.filter((p) => p.currentStage === s.key).length })),
    [projects],
  );
  const maxN = Math.max(...stageCounts.map((x) => x.n), 1);

  const stats = [
    { label: 'Active projects', value: projects.length, icon: 'folder_open', color: 'var(--p-primary)', to: '/portal-admin/projects' },
    { label: 'Needs your action', value: actionItems.length, icon: 'pending_actions', color: '#b45309', to: '/portal-admin/projects' },
    { label: 'New inquiries', value: inquiries.length, icon: 'inbox', color: '#1d4ed8', to: '/portal-admin/inquiries' },
    { label: 'In production', value: projects.filter((p) => p.currentStage === 'PRODUCTION').length, icon: 'factory', color: '#15803d', to: '/portal-admin/projects' },
  ];

  const adminName = (admin as { name?: string } | null)?.name?.split(' ')[0];

  return (
    <AdminShell title="Dashboard" actions={<AdminBtn icon="inbox" onClick={() => navigate('/portal-admin/inquiries')}>View inquiries</AdminBtn>}>
      <div className="p-5 sm:p-8 max-w-7xl">
        {projectsLoading ? (
          <div className="flex justify-center py-24"><Sym name="progress_activity" className="text-[32px] animate-spin" style={{ color: 'var(--p-primary)' }} /></div>
        ) : (
          <>
            <div className="mb-7">
              <h1 className="font-bold text-[26px] leading-tight">{greeting()}{adminName ? `, ${adminName}` : ''}</h1>
              <p className="text-[13px] mt-1" style={{ color: 'var(--p-on-surface-variant)' }}>Here's what's happening across your projects today.</p>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => navigate(s.to)}
                  className="text-left border rounded-2xl p-5 transition-shadow hover:shadow-md"
                  style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${s.color}17`, color: s.color }}>
                    <Sym name={s.icon} className="text-[20px]" />
                  </div>
                  <p className="font-bold text-[30px] leading-none">{s.value}</p>
                  <p className="text-[12px] font-semibold mt-2" style={{ color: 'var(--p-on-surface-variant)' }}>{s.label}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Needs your action */}
              <div className="xl:col-span-2 border rounded-2xl overflow-hidden flex flex-col" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <div className="px-5 py-4 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="font-bold text-[15px]">Needs your action</h3>
                    <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>Projects awaiting a decision or quotation</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: 'var(--p-error-container)', color: 'var(--p-on-error-container)' }}>
                    {actionItems.length}
                  </span>
                </div>
                {actionItems.length === 0 ? (
                  <div className="px-5 pb-8 pt-2 text-center">
                    <Sym name="task_alt" className="text-[32px] opacity-30 mb-1" />
                    <p className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>All caught up — nothing needs attention right now.</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto border-t" style={{ borderColor: 'var(--p-outline-variant)', maxHeight: 380 }}>
                    {actionItems.slice(0, ACTION_PREVIEW_LIMIT).map((p, i) => (
                      <button key={p.code} type="button" onClick={() => navigate(`/portal-admin/workspace-preview?project=${p.code}`)} className="w-full text-left px-5 py-3.5 flex items-center gap-4 hover:bg-black/[0.02]" style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--p-error-container)', color: 'var(--p-on-error-container)' }}>
                          <Sym name="priority_high" className="text-[17px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[14px] truncate">{statusLabelFor(p.currentStage, p.currentStatus)}</p>
                          <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{p.code} · {p.clientName || p.clientEmail || 'Client'}</p>
                        </div>
                        <Pill label={stageLabel(p.currentStage)} tone={stageTone(p.currentStage)} />
                        <Sym name="chevron_right" className="opacity-40 shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
                      </button>
                    ))}
                  </div>
                )}
                {actionItems.length > ACTION_PREVIEW_LIMIT && (
                  <button
                    type="button"
                    onClick={() => navigate('/portal-admin/projects')}
                    className="shrink-0 px-5 py-3 text-[12px] font-bold text-center border-t hover:bg-black/[0.02]"
                    style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-primary)' }}
                  >
                    View all {actionItems.length} →
                  </button>
                )}
              </div>

              {/* Pipeline */}
              <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <h3 className="font-bold text-[15px] mb-1">Pipeline by stage</h3>
                <p className="text-[12px] mb-5" style={{ color: 'var(--p-on-surface-variant)' }}>Where every active project sits right now</p>
                <div className="space-y-4">
                  {stageCounts.map(({ s, n }) => (
                    <div key={s}>
                      <div className="flex justify-between text-[12px] mb-1.5">
                        <span style={{ color: 'var(--p-on-surface-variant)' }}>{s}</span>
                        <span className="font-bold">{n}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--p-surface-container-high)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${(n / maxN) * 100}%`, background: 'var(--p-primary)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent projects */}
            <div className="mt-6 border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[15px]">Recent projects</h3>
                  <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>Most recently updated</p>
                </div>
                <button type="button" onClick={() => navigate('/portal-admin/projects')} className="text-[12px] font-bold hover:underline shrink-0" style={{ color: 'var(--p-primary)' }}>View all →</button>
              </div>
              {projects.length === 0 ? (
                <p className="px-5 pb-8 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                  {superAdmin
                    ? 'No projects yet — inquiries auto-create projects when submitted.'
                    : 'No projects assigned to you yet. Your dashboard will show projects once a super admin assigns them to you.'}
                </p>
              ) : (
                <div className="border-t overflow-x-auto" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                      <tr style={{ background: 'var(--p-surface-container-low)' }}>
                        {['Project', 'Client', 'Stage', 'Value', 'Updated'].map((h) => (
                          <th key={h} className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentProjects.slice(0, RECENT_PREVIEW_LIMIT).map((p, i) => (
                        <tr key={p.code} className="cursor-pointer hover:bg-black/[0.02]" style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }} onClick={() => navigate(`/portal-admin/workspace-preview?project=${p.code}`)}>
                          <td className="px-5 py-3 font-semibold text-[13px]">{p.title || p.code}</td>
                          <td className="px-5 py-3 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>{p.clientName || '—'}</td>
                          <td className="px-5 py-3"><Pill label={stageLabel(p.currentStage)} tone={stageTone(p.currentStage)} /></td>
                          <td className="px-5 py-3 font-bold text-[13px]">{p.valueDisplay || '—'}</td>
                          <td className="px-5 py-3 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{formatUpdated(p.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
