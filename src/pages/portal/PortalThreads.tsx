import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalShell from '@/components/portal/PortalShell';
import PortalEmptyInquiry from '@/components/portal/PortalEmptyInquiry';
import ThreadListItem from '@/components/portal/ThreadListItem';
import { Sym } from '@/components/portal/Sym';
import { relTime } from '@/lib/clientPortalAggregate';
import { useClientPortalAggregate } from '@/hooks/useClientPortalAggregate';

export default function PortalThreads() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const { projects, threads, isLoading } = useClientPortalAggregate();
  const shown = threads.filter((t) => tab === 'all' || t.unread);

  return (
    <PortalShell active="home">
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="h-14 px-6 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="flex items-center gap-3">
            <Sym name="list_alt" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            <h2 className="font-display text-[18px]">All threads</h2>
          </div>
          {projects.length > 0 && (
            <div className="flex gap-2">
              {(['all', 'unread'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} className="px-3 py-1.5 rounded-full text-[13px] font-semibold capitalize" style={t === tab ? { background: 'var(--p-primary)', color: '#fff' } : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}>{t}</button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          <div className="max-w-2xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center py-20"><Sym name="progress_activity" className="text-[28px] animate-spin" /></div>
            ) : projects.length === 0 ? (
              <PortalEmptyInquiry compact />
            ) : shown.length === 0 ? (
              <div className="text-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
                <Sym name="forum" className="text-[40px]" />
                <p className="mt-2 text-[14px]">{tab === 'unread' ? 'No unread threads.' : 'No threads yet.'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shown.map((t) => (
                  <ThreadListItem
                    key={`${t.projectCode}-${t.messageId}`}
                    thread={t}
                    showProject
                    timeLabel={relTime(t.lastReplyAt || t.createdAt)}
                    onClick={() => navigate(`/portal/projects/${encodeURIComponent(t.projectCode)}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </PortalShell>
  );
}
