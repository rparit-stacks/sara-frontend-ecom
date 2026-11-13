import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminShell, { AdminBtn } from '@/components/portal/AdminShell';
import StatTile from '@/components/portal/StatTile';
import { Pill } from '@/components/portal/Pill';
import { Sym } from '@/components/portal/Sym';
import { STAGE_TONE, type Stage } from '@/components/portal/adminData';
import { STAGES, stageDef, statusLabelFor, type StageKey } from '@/components/manufacturing/stages';
import { manufacturingApi, projectApi } from '@/lib/api';
import { getStoredAdminUser, isSuperAdmin } from '@/lib/adminAccess';
import { resolvePortalNavPermissionRule } from '@/lib/portalNavPermissions';
import TasksAndRequestsPanel from './TasksAndRequestsPanel';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';

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

const QUICK_LINKS = [
  { label: 'Quotations', icon: 'request_quote', to: '/portal-admin/quotations' },
  { label: 'Invoices', icon: 'receipt_long', to: '/portal-admin/invoices' },
  { label: 'Payment links', icon: 'link', to: '/portal-admin/payment-links' },
  { label: 'Clients', icon: 'group', to: '/portal-admin/clients' },
];

function SkeletonBlock({ h = 120 }: { h?: number }) {
  return <div className="pa-card animate-pulse" style={{ height: h }} />;
}

export default function PortalAdminDashboard() {
  const { hasAny, ready, canAccessPath } = useAdminPermissions();
  const canViewActions = hasAny(P.PORTAL_DASHBOARD_VIEW_ACTIONS);
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
  const totalInPipeline = stageCounts.reduce((sum, x) => sum + x.n, 0);

  const stats = [
    { label: 'Active projects', value: projects.length, icon: 'folder_open', color: 'var(--p-primary)', to: '/portal-admin/projects' },
    { label: 'Needs your action', value: actionItems.length, icon: 'pending_actions', color: '#b45309', to: '/portal-admin/projects' },
    { label: 'New inquiries', value: inquiries.length, icon: 'inbox', color: '#1d4ed8', to: '/portal-admin/inquiries' },
    { label: 'In production', value: projects.filter((p) => p.currentStage === 'PRODUCTION').length, icon: 'factory', color: '#15803d', to: '/portal-admin/projects' },
  ];

  const adminName = (admin as { name?: string } | null)?.name?.split(' ')[0];
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const quickLinks = QUICK_LINKS.filter((q) => !ready || canAccessPath(q.to, resolvePortalNavPermissionRule(q.to)));

  return (
    <AdminShell title="Dashboard" actions={<AdminBtn icon="inbox" onClick={() => navigate('/portal-admin/inquiries')}>View inquiries</AdminBtn>}>
      <div className="p-5 sm:p-8 max-w-[1400px]">
        {projectsLoading ? (
          <div className="space-y-6">
            <SkeletonBlock h={92} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} h={104} />)}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2"><SkeletonBlock h={340} /></div>
              <SkeletonBlock h={340} />
            </div>
          </div>
        ) : (
          <>
            {/* Greeting + the places you jump to most */}
            <div className="pa-card px-6 py-5 mb-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold" style={{ color: 'var(--p-primary)' }}>{today}</p>
                <h2 className="font-display font-bold text-[26px] leading-tight mt-0.5">
                  {greeting()}{adminName ? `, ${adminName}` : ''}
                </h2>
                <p className="text-[14px] mt-1" style={{ color: 'var(--p-on-surface-variant)' }}>
                  {canViewActions && actionItems.length > 0
                    ? `${actionItems.length} project${actionItems.length === 1 ? '' : 's'} waiting on you.`
                    : 'Here is where your projects stand today.'}
                </p>
              </div>
              {quickLinks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {quickLinks.map((q) => (
                    <button
                      key={q.to}
                      type="button"
                      onClick={() => navigate(q.to)}
                      className="px-3.5 py-2 rounded-xl border text-[13px] font-semibold flex items-center gap-2 hover:border-[var(--p-primary)] hover:text-[var(--p-primary)] hover:bg-[var(--pa-teal-06)]"
                      style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface)' }}
                    >
                      <Sym name={q.icon} className="text-[18px]" /> {q.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map((s) => {
                const isActionTile = s.label === 'Needs your action';
                const clickable = !isActionTile || canViewActions;
                return (
                  <StatTile
                    key={s.label}
                    label={s.label}
                    value={s.value}
                    icon={s.icon}
                    color={s.color}
                    onClick={clickable ? () => navigate(s.to) : undefined}
                  />
                );
              })}
            </div>

            {canViewActions && <TasksAndRequestsPanel />}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
              {/* Needs your action */}
              {canViewActions && (
              <div className="pa-card xl:col-span-2 overflow-hidden flex flex-col" data-ghost="pending_actions">
                <div className="px-6 py-5 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="pa-card-title">Needs your action</h3>
                    <p className="pa-card-sub">Projects awaiting a decision or quotation</p>
                  </div>
                  <span className="text-[13px] font-bold px-3 py-1 rounded-full shrink-0 tabular-nums" style={{ background: 'var(--p-error-container)', color: 'var(--p-on-error-container)' }}>
                    {actionItems.length}
                  </span>
                </div>
                {actionItems.length === 0 ? (
                  <div className="px-6 pb-10 pt-2 text-center">
                    <Sym name="task_alt" className="text-[40px] opacity-40 mb-1" style={{ color: 'var(--p-primary)' }} />
                    <p className="text-[14px] font-semibold">All caught up</p>
                    <p className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>Nothing needs your attention right now.</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto border-t" style={{ borderColor: 'var(--p-outline-variant)', maxHeight: 420 }}>
                    {actionItems.slice(0, ACTION_PREVIEW_LIMIT).map((p, i) => (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => navigate(`/portal-admin/workspace-preview?project=${p.code}`)}
                        className="pa-row w-full text-left px-6 py-4 flex items-center gap-4"
                        style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--p-error-container)', color: 'var(--p-on-error-container)' }}>
                          <Sym name="priority_high" className="text-[20px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[14.5px] truncate">{statusLabelFor(p.currentStage, p.currentStatus)}</p>
                          <p className="text-[12.5px] mt-0.5 truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{p.code} · {p.clientName || p.clientEmail || 'Client'}</p>
                        </div>
                        <Pill label={stageLabel(p.currentStage)} tone={stageTone(p.currentStage)} />
                        <Sym name="chevron_right" className="pa-chev shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
                {actionItems.length > ACTION_PREVIEW_LIMIT && (
                  <button
                    type="button"
                    onClick={() => navigate('/portal-admin/projects')}
                    className="shrink-0 px-6 py-3.5 text-[13px] font-bold text-center border-t hover:bg-[var(--pa-teal-06)]"
                    style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-primary)' }}
                  >
                    View all {actionItems.length} →
                  </button>
                )}
              </div>
              )}

              {/* Pipeline */}
              <div className={`pa-card p-6 ${canViewActions ? '' : 'xl:col-span-3'}`} data-ghost="account_tree">
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="pa-card-title">Pipeline by stage</h3>
                  <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--p-on-surface-variant)' }}>{totalInPipeline} total</span>
                </div>
                <p className="pa-card-sub mb-5">Where every active project sits right now</p>
                <div className="space-y-4">
                  {stageCounts.map(({ s, n }, i) => (
                    <div key={s}>
                      <div className="flex justify-between text-[13px] mb-1.5">
                        <span className="font-medium">{s}</span>
                        <span className="font-bold tabular-nums">
                          {n}
                          <span className="font-medium ml-1.5" style={{ color: 'var(--p-on-surface-variant)' }}>
                            {totalInPipeline ? `${Math.round((n / totalInPipeline) * 100)}%` : '—'}
                          </span>
                        </span>
                      </div>
                      <div className="pa-bar">
                        <i style={{ width: `${(n / maxN) * 100}%`, animationDelay: `${i * 70}ms`, opacity: n === 0 ? 0 : 1 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent projects */}
            <div className="pa-card mt-6 overflow-hidden" data-ghost="folder_open">
              <div className="px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="pa-card-title">Recent projects</h3>
                  <p className="pa-card-sub">Most recently updated</p>
                </div>
                <button type="button" onClick={() => navigate('/portal-admin/projects')} className="text-[13px] font-bold hover:underline shrink-0" style={{ color: 'var(--p-primary)' }}>View all →</button>
              </div>
              {projects.length === 0 ? (
                <p className="px-6 pb-8 text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                  {superAdmin
                    ? 'No projects yet — inquiries auto-create projects when submitted.'
                    : 'No projects assigned to you yet. Your dashboard will show projects once a super admin assigns them to you.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[640px]">
                    <thead>
                      <tr>
                        {['Project', 'Client', 'Stage', 'Value', 'Updated'].map((h) => (
                          <th key={h} className={`px-6 py-3 ${h === 'Value' ? 'text-right' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentProjects.slice(0, RECENT_PREVIEW_LIMIT).map((p, i) => (
                        <tr key={p.code} className="cursor-pointer" style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }} onClick={() => navigate(`/portal-admin/workspace-preview?project=${p.code}`)}>
                          <td className="px-6 py-3.5 font-bold text-[14px]">{p.title || p.code}</td>
                          <td className="px-6 py-3.5 text-[13.5px]" style={{ color: 'var(--p-on-surface-variant)' }}>{p.clientName || '—'}</td>
                          <td className="px-6 py-3.5"><Pill label={stageLabel(p.currentStage)} tone={stageTone(p.currentStage)} /></td>
                          <td className="px-6 py-3.5 font-bold text-[14px] text-right">{p.valueDisplay || '—'}</td>
                          <td className="px-6 py-3.5 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>{formatUpdated(p.updatedAt)}</td>
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
