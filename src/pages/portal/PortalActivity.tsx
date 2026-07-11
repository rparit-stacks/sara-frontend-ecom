import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalShell from '@/components/portal/PortalShell';
import PortalEmptyInquiry from '@/components/portal/PortalEmptyInquiry';
import { Sym } from '@/components/portal/Sym';
import { useClientPortalAggregate } from '@/hooks/useClientPortalAggregate';
import type { ActivityTone } from '@/lib/clientPortalAggregate';

const TONE: Record<ActivityTone, { icon: string; bg: string; fg: string }> = {
  approval: { icon: 'priority_high', bg: 'var(--p-error-container)', fg: 'var(--p-on-error-container)' },
  message: { icon: 'forum', bg: 'rgba(0,103,106,0.1)', fg: 'var(--p-primary)' },
  stage: { icon: 'conveyor_belt', bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  payment: { icon: 'payments', bg: 'var(--p-primary-fixed)', fg: 'var(--p-on-primary-fixed-variant)' },
  file: { icon: 'description', bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface)' },
};

const FILTERS = ['All', 'Approvals', 'Messages', 'Updates'] as const;

export default function PortalActivity() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<typeof FILTERS[number]>('All');
  const { projects, activities, isLoading } = useClientPortalAggregate();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const alerts = useMemo(
    () => activities.map((a) => ({ ...a, unread: a.unread && !readIds.has(a.id) })),
    [activities, readIds],
  );

  const shown = alerts.filter((a) => {
    if (filter === 'All') return true;
    if (filter === 'Approvals') return a.tone === 'approval' || a.tone === 'payment';
    if (filter === 'Messages') return a.tone === 'message';
    return a.tone === 'stage' || a.tone === 'file';
  });

  const markAllRead = () => setReadIds(new Set(alerts.map((a) => a.id)));

  return (
    <PortalShell active="activity">
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="h-14 px-4 sm:px-8 border-b flex items-center justify-between shrink-0 gap-2" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h2 className="font-display text-[18px]">Activity</h2>
            {alerts.some((a) => a.unread) && (
              <span className="text-[11px] font-bold text-white rounded-full px-2 py-0.5" style={{ background: 'var(--p-primary)' }}>
                {alerts.filter((a) => a.unread).length} new
              </span>
            )}
          </div>
          {alerts.length > 0 && (
            <button onClick={markAllRead} className="text-[13px] font-semibold hover:underline" style={{ color: 'var(--p-primary)' }}>
              Mark all as read
            </button>
          )}
        </div>

        {projects.length > 0 && (
          <div className="px-4 sm:px-8 pt-5 flex gap-2 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
                style={f === filter ? { background: 'var(--p-primary)', color: '#fff' } : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5">
          <div className="max-w-3xl">
            {isLoading ? (
              <div className="flex justify-center py-20"><Sym name="progress_activity" className="text-[28px] animate-spin" /></div>
            ) : projects.length === 0 ? (
              <PortalEmptyInquiry compact />
            ) : shown.length === 0 ? (
              <div className="text-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
                <Sym name="notifications_off" className="text-[40px]" />
                <p className="mt-2 text-[14px]">No activity in this filter.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shown.map((a) => {
                  const t = TONE[a.tone];
                  return (
                    <button
                      key={a.id}
                      onClick={() => { setReadIds((s) => new Set(s).add(a.id)); navigate(a.to); }}
                      className="w-full text-left border rounded-xl p-4 flex items-start gap-4 transition-all hover:shadow-sm"
                      style={{ background: a.unread ? 'var(--p-surface-container-low)' : 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: t.bg, color: t.fg }}>
                        <Sym name={t.icon} className="text-[20px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[14px]">{a.title}</p>
                          {a.unread && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--p-primary)' }} />}
                        </div>
                        <p className="text-[13px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>{a.body}</p>
                        <div className="flex items-center gap-2 mt-2 text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                          <Sym name="folder" className="text-[14px]" /> {a.projectTitle}
                          <span>·</span>
                          <span>{a.time}</span>
                        </div>
                      </div>
                      <Sym name="chevron_right" className="opacity-40" style={{ color: 'var(--p-on-surface-variant)' }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </PortalShell>
  );
}
