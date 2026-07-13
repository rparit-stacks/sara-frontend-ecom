import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import PortalShell from '@/components/portal/PortalShell';
import PortalEmptyInquiry from '@/components/portal/PortalEmptyInquiry';
import { Sym } from '@/components/portal/Sym';
import { STAGES, stageDef, statusLabelFor, type StageKey } from '@/components/manufacturing/stages';
import { getUserEmailFromToken, clientProjectApi } from '@/lib/api';
import { useClientPortalAggregate } from '@/hooks/useClientPortalAggregate';
import type { ActivityTone } from '@/lib/clientPortalAggregate';

const RADIUS = 45;
const CIRC = 2 * Math.PI * RADIUS;

const TONE: Record<ActivityTone, { icon: string; bg: string; fg: string }> = {
  approval: { icon: 'request_quote', bg: 'rgba(0,103,106,0.12)', fg: 'var(--p-primary)' },
  message: { icon: 'forum', bg: 'rgba(0,103,106,0.1)', fg: 'var(--p-primary)' },
  stage: { icon: 'conveyor_belt', bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  payment: { icon: 'payments', bg: 'var(--p-primary-fixed)', fg: 'var(--p-on-primary-fixed-variant)' },
  file: { icon: 'description', bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface)' },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function ProgressRing({ pct, size = 'md' }: { pct: number; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-16 h-16' : 'w-20 h-20';
  const text = size === 'sm' ? 'text-[14px]' : 'text-[18px]';
  return (
    <div className={`relative ${dim} shrink-0`}>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={RADIUS} fill="transparent" strokeWidth="3" style={{ stroke: 'var(--p-surface-container)' }} />
        <circle
          className="progress-ring__circle"
          cx="50"
          cy="50"
          r={RADIUS}
          fill="transparent"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - pct / 100)}
          style={{ stroke: 'var(--p-primary)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${text}`} style={{ color: 'var(--p-primary)' }}>{pct}%</span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`border rounded-xl p-4 text-left transition-all ${onClick ? 'card-hover cursor-pointer' : ''}`}
      style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-60" style={{ color: 'var(--p-on-surface-variant)' }}>
            {label}
          </p>
          <p className="font-display text-[28px] mt-1" style={{ color: accent ? 'var(--p-primary)' : 'var(--p-on-surface)' }}>
            {value}
          </p>
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: accent ? 'rgba(0,103,106,0.12)' : 'var(--p-surface-container-high)' }}>
          <Sym name={icon} className="text-[20px]" style={{ color: accent ? 'var(--p-primary)' : 'var(--p-on-surface-variant)' }} />
        </div>
      </div>
    </Tag>
  );
}

function QuickAction({ icon, label, desc, onClick }: { icon: string; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border rounded-xl p-4 text-left card-hover flex items-center gap-3 w-full"
      style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(0,103,106,0.1)' }}>
        <Sym name={icon} className="text-[22px]" style={{ color: 'var(--p-primary)' }} />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-[14px]" style={{ color: 'var(--p-on-surface)' }}>{label}</p>
        <p className="text-[12px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{desc}</p>
      </div>
      <Sym name="chevron_right" className="text-[18px] shrink-0 ml-auto opacity-40" />
    </button>
  );
}

export default function PortalHome() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const markActivityRead = (id: string) => {
    clientProjectApi.markActivityRead(id)
      .then(() => qc.invalidateQueries({ queryKey: ['client-portal-aggregate'] }))
      .catch(() => {});
  };
  const [search, setSearch] = useState('');
  const email = getUserEmailFromToken();
  const displayName = email?.split('@')[0].replace(/[._]/g, ' ') || 'there';

  const { projects, threads, files, quotes, invoices, activities, isLoading } = useClientPortalAggregate();

  const filtered = projects.filter(
    (p) =>
      !search ||
      (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()),
  );

  const unreadThreads = threads.filter((t) => t.unread).length;
  const pendingQuotes = quotes.filter((q) => {
    const st = (q.status || '').toUpperCase();
    return st.includes('AWAITING') || st.includes('SENT');
  }).length;
  const pendingInvoices = invoices.filter((i) => (i.status || '').toUpperCase() === 'PENDING').length;
  const needsAttention = useMemo(() => activities.filter((a) => a.unread).slice(0, 5), [activities]);
  const recentActivity = useMemo(() => activities.slice(0, 6), [activities]);
  const recentFiles = useMemo(() => files.slice(0, 4), [files]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STAGES.forEach((s) => { counts[s.key] = 0; });
    projects.forEach((p) => {
      const k = p.currentStage || 'INQUIRY';
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [projects]);

  const inProduction = projects.filter((p) => p.currentStage === 'PRODUCTION').length;
  const hasProjects = projects.length > 0;
  const attentionCount = needsAttention.length;

  return (
    <PortalShell active="home" search={search} onSearchChange={setSearch}>
      {hasProjects && (
        <aside
          className="w-64 border-r flex flex-col shrink-0 hidden lg:flex"
          style={{ background: 'var(--p-surface-container-low)', borderColor: 'var(--p-outline-variant)' }}
        >
          <div className="p-4 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <h3 className="font-bold text-[15px]">Your projects</h3>
            {unreadThreads > 0 && (
              <p className="text-[12px] mt-0.5 font-semibold" style={{ color: 'var(--p-primary)' }}>
                {unreadThreads} unread thread{unreadThreads === 1 ? '' : 's'}
              </p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <nav className="space-y-1">
              {projects.map((p) => {
                const unread = threads.filter((t) => t.projectCode === p.code && t.unread).length;
                return (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => navigate(`/portal/projects/${encodeURIComponent(p.code)}`)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors text-left"
                    style={{ color: 'var(--p-on-surface-variant)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--p-surface-container-high)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="w-8 h-8 rounded overflow-hidden shrink-0 border flex items-center justify-center" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-high)' }}>
                      <Sym name="factory" className="text-[16px]" style={{ color: 'var(--p-primary)' }} />
                    </div>
                    <span className="text-[13px] truncate flex-1">{p.title?.trim() || p.code}</span>
                    {unread > 0 && (
                      <span className="text-[10px] font-bold text-white rounded-full px-1.5 min-w-[18px] text-center" style={{ background: 'var(--p-primary)' }}>
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="h-14 px-6 sm:px-8 border-b flex items-center justify-between shrink-0 gap-4" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="min-w-0">
            <h2 className="font-display text-[18px] truncate capitalize" style={{ color: 'var(--p-on-surface)' }}>
              {greeting()}, {displayName}
            </h2>
            {hasProjects && attentionCount > 0 && (
              <p className="text-[12px] font-semibold" style={{ color: 'var(--p-primary)' }}>
                {attentionCount} item{attentionCount === 1 ? '' : 's'} need your attention
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/inquiry')}
            className="text-white px-4 sm:px-5 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-all shadow-sm hover:brightness-110 shrink-0"
            style={{ background: 'var(--p-primary)' }}
          >
            <Sym name="add_circle" className="text-[18px]" />
            <span className="hidden sm:inline">Make an inquiry</span>
            <span className="sm:hidden">Inquiry</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-8 chat-feed-bg">
          <div className="max-w-6xl mx-auto space-y-10">
            {isLoading ? (
              <div className="flex justify-center py-24">
                <Sym name="progress_activity" className="text-[32px] animate-spin" style={{ color: 'var(--p-primary)' }} />
              </div>
            ) : !hasProjects ? (
              <PortalEmptyInquiry />
            ) : (
              <>
                {/* Stats */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Projects" value={projects.length} icon="factory" accent onClick={() => navigate('/portal/messages')} />
                  <StatCard label="Unread threads" value={unreadThreads} icon="forum" accent={unreadThreads > 0} onClick={() => navigate('/portal/threads')} />
                  <StatCard label="Quotes" value={pendingQuotes} icon="request_quote" accent={pendingQuotes > 0} onClick={() => navigate('/portal/activity')} />
                  <StatCard label="Invoices due" value={pendingInvoices} icon="receipt_long" accent={pendingInvoices > 0} onClick={() => navigate('/portal/invoices')} />
                </section>

                {/* Quick actions */}
                <section>
                  <h3 className="text-[13px] font-bold uppercase tracking-wider mb-3 opacity-60" style={{ color: 'var(--p-on-surface-variant)' }}>
                    Quick actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <QuickAction icon="add_circle" label="New inquiry" desc="Start a manufacturing project" onClick={() => navigate('/inquiry')} />
                    <QuickAction icon="notifications" label="Activity" desc="Updates across all projects" onClick={() => navigate('/portal/activity')} />
                    <QuickAction icon="folder" label="All files" desc={`${files.length} shared attachment${files.length === 1 ? '' : 's'}`} onClick={() => navigate('/portal/files')} />
                    <QuickAction icon="payments" label="Invoices" desc="Payments & billing" onClick={() => navigate('/portal/invoices')} />
                    <QuickAction icon="history" label="Payment history" desc="All past payments" onClick={() => navigate('/portal/payment-history')} />
                  </div>
                </section>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Needs attention + recent activity */}
                  <div className="xl:col-span-2 space-y-8">
                    {needsAttention.length > 0 && (
                      <section className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
                        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--p-outline-variant)' }}>
                          <h3 className="font-semibold text-[15px] flex items-center gap-2">
                            <Sym name="priority_high" style={{ color: 'var(--p-primary)' }} />
                            Needs attention
                          </h3>
                          <button type="button" onClick={() => navigate('/portal/activity')} className="text-[12px] font-semibold" style={{ color: 'var(--p-primary)' }}>
                            View all
                          </button>
                        </div>
                        <div className="divide-y" style={{ borderColor: 'var(--p-outline-variant)' }}>
                          {needsAttention.map((a) => {
                            const t = TONE[a.tone];
                            return (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => { markActivityRead(a.id); navigate(a.to); }}
                                className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-black/[0.02] transition-colors"
                              >
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: t.bg, color: t.fg }}>
                                  <Sym name={t.icon} className="text-[18px]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-[13px]">{a.title}</p>
                                  <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>{a.body}</p>
                                  <p className="text-[11px] mt-1" style={{ color: 'var(--p-on-surface-variant)' }}>
                                    {a.projectTitle} · {a.time}
                                  </p>
                                </div>
                                <span className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: 'var(--p-primary)' }} />
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* Pipeline */}
                    <section className="border rounded-xl p-5" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
                      <h3 className="font-semibold text-[15px] mb-4">Production pipeline</h3>
                      <div className="flex flex-wrap gap-2">
                        {STAGES.map((st) => {
                          const n = stageCounts[st.key] || 0;
                          if (n === 0) return null;
                          return (
                            <div
                              key={st.key}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                              style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}
                            >
                              <span className="font-bold text-[16px]" style={{ color: 'var(--p-primary)' }}>{n}</span>
                              <span className="text-[12px] font-semibold" style={{ color: 'var(--p-on-surface-variant)' }}>{st.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Projects grid */}
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[15px]">Your projects</h3>
                        <span className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                          {filtered.length} of {projects.length}
                        </span>
                      </div>
                      {filtered.length === 0 && search ? (
                        <p className="text-center py-12 text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                          No projects match &ldquo;{search}&rdquo;
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {filtered.map((p) => {
                            const stageLabel = stageDef(p.currentStage).label;
                            const status = statusLabelFor(p.currentStage as StageKey, p.currentStatus);
                            const unread = threads.filter((t) => t.projectCode === p.code && t.unread).length;
                            return (
                              <div
                                key={p.code}
                                onClick={() => navigate(`/portal/projects/${encodeURIComponent(p.code)}`)}
                                className="border p-5 card-hover flex flex-col rounded-xl cursor-pointer relative"
                                style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                              >
                                {unread > 0 && (
                                  <span className="absolute top-4 right-4 text-[10px] font-bold text-white rounded-full px-2 py-0.5" style={{ background: 'var(--p-primary)' }}>
                                    {unread} new
                                  </span>
                                )}
                                <div className="mb-4">
                                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--p-on-surface-variant)' }}>
                                    {p.code}
                                  </span>
                                  <h3 className="text-[17px] font-semibold mt-0.5 pr-14" style={{ color: 'var(--p-on-surface)' }}>
                                    {p.title?.trim() || 'Untitled project'}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                  <ProgressRing pct={p.progressPercent ?? 0} size="sm" />
                                  <div>
                                    <p className="text-[10px] font-bold uppercase opacity-60" style={{ color: 'var(--p-on-surface-variant)' }}>{stageLabel}</p>
                                    <p className="font-semibold text-[13px]" style={{ color: 'var(--p-on-surface)' }}>{status}</p>
                                  </div>
                                </div>
                                {p.valueDisplay && (
                                  <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold w-fit mb-3" style={{ background: 'var(--p-surface-container-high)' }}>
                                    <Sym name="payments" className="text-[14px]" />
                                    {p.valueDisplay}
                                  </div>
                                )}
                                <div className="mt-auto pt-3 border-t flex justify-between items-center" style={{ borderColor: 'var(--p-outline-variant)' }}>
                                  <span className="text-[12px] font-bold" style={{ color: 'var(--p-primary)' }}>Open workspace</span>
                                  <Sym name="arrow_forward_ios" className="opacity-40 text-[14px]" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </div>

                  {/* Right column */}
                  <div className="space-y-8">
                    {/* Recent activity */}
                    <section className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
                      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--p-outline-variant)' }}>
                        <h3 className="font-semibold text-[15px]">Recent activity</h3>
                        <button type="button" onClick={() => navigate('/portal/activity')} className="text-[12px] font-semibold" style={{ color: 'var(--p-primary)' }}>
                          See all
                        </button>
                      </div>
                      {recentActivity.length === 0 ? (
                        <p className="px-5 py-8 text-[13px] text-center" style={{ color: 'var(--p-on-surface-variant)' }}>No activity yet.</p>
                      ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--p-outline-variant)' }}>
                          {recentActivity.map((a) => {
                            const t = TONE[a.tone];
                            return (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => { markActivityRead(a.id); navigate(a.to); }}
                                className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-black/[0.02]"
                              >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: t.bg, color: t.fg }}>
                                  <Sym name={t.icon} className="text-[16px]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-semibold truncate">{a.title}</p>
                                  <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{a.body}</p>
                                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>{a.time}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    {/* Recent files */}
                    {recentFiles.length > 0 && (
                      <section className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
                        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--p-outline-variant)' }}>
                          <h3 className="font-semibold text-[15px]">Recent files</h3>
                          <button type="button" onClick={() => navigate('/portal/files')} className="text-[12px] font-semibold" style={{ color: 'var(--p-primary)' }}>
                            Browse
                          </button>
                        </div>
                        <div className="divide-y" style={{ borderColor: 'var(--p-outline-variant)' }}>
                          {recentFiles.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => navigate(`/portal/projects/${encodeURIComponent(f.projectCode)}`)}
                              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-black/[0.02]"
                            >
                              <Sym name="attach_file" className="text-[18px] shrink-0" style={{ color: 'var(--p-primary)' }} />
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold truncate">{f.name}</p>
                                <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{f.projectTitle}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Summary */}
                    <section className="border rounded-xl p-5 space-y-4" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
                      <h3 className="font-semibold text-[15px]">Overview</h3>
                      {[
                        { label: 'In production', value: inProduction },
                        { label: 'At quotation', value: stageCounts.QUOTATION || 0 },
                        { label: 'Sampling', value: stageCounts.SAMPLING || 0 },
                        { label: 'Completed', value: stageCounts.COMPLETED || 0 },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between text-[13px]">
                          <span style={{ color: 'var(--p-on-surface-variant)' }}>{row.label}</span>
                          <span className="font-bold" style={{ color: 'var(--p-on-surface)' }}>{row.value}</span>
                        </div>
                      ))}
                    </section>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </PortalShell>
  );
}
