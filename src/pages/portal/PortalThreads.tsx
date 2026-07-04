import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalShell from '@/components/portal/PortalShell';
import PortalEmptyInquiry from '@/components/portal/PortalEmptyInquiry';
import { Sym } from '@/components/portal/Sym';
import { formatMessagePreview } from '@/components/portal/PaymentCard';
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

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="max-w-3xl">
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
                  <button
                    key={`${t.projectCode}-${t.messageId}`}
                    type="button"
                    onClick={() => navigate(`/portal/projects/${encodeURIComponent(t.projectCode)}`)}
                    className="w-full text-left border rounded-xl p-4 transition-all hover:shadow-sm"
                    style={{ background: t.unread ? 'var(--p-surface-container-low)' : 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Sym name="tag" className="text-[15px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }} />
                        <span className="font-bold text-[14px] truncate">{t.designName}</span>
                        <span className="text-[10px] shrink-0 opacity-60">{t.projectCode}</span>
                        {t.unread && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--p-primary)' }} />}
                      </div>
                      <span className="text-[11px] shrink-0" style={{ color: 'var(--p-on-surface-variant)' }}>{relTime(t.lastReplyAt || t.createdAt)}</span>
                    </div>
                    <p className="text-[14px] mb-2 break-words" style={{ color: 'var(--p-on-surface)' }}>
                      <span className="font-semibold">{t.rootAuthorName || 'User'}:</span> {formatMessagePreview(t.snippet)}
                    </p>
                    <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--p-primary)' }}>
                      <Sym name="forum" className="text-[14px]" />
                      <span className="font-semibold">{t.replyCount} replies</span>
                      {t.lastReplyBy && <span style={{ color: 'var(--p-on-surface-variant)' }}>· last by {t.lastReplyBy}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </PortalShell>
  );
}
