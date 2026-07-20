import type { ReactNode } from 'react';
import { Sym } from './Sym';
import type { ProjectMessageDto } from '@/lib/api';
import ThreadMessageCompact from './ThreadMessageCompact';
import Composer, { type Attachment } from './Composer';

export default function ThreadPanel({
  open,
  channelName,
  threadRoot,
  threadReplies,
  showComposer,
  onClose,
  onSend,
  formatTime,
  className = '',
}: {
  open: boolean;
  channelName: string;
  threadRoot: ProjectMessageDto | null;
  threadReplies: ProjectMessageDto[];
  showComposer?: boolean;
  onClose: () => void;
  onSend: (text: string, attachments: Attachment[]) => void | Promise<void>;
  formatTime?: (iso?: string) => string;
  className?: string;
}) {
  if (!open || !threadRoot) return null;

  return (
    <aside
      className={`flex flex-col border-l shrink-0 thread-panel-bg ${className}`}
      style={{ borderColor: 'var(--p-outline-variant)', boxShadow: '0 0 40px rgba(0,0,0,0.08)' }}
    >
      <div
        className="h-14 px-4 border-b flex items-center justify-between shrink-0 backdrop-blur-sm"
        style={{ borderColor: 'var(--p-outline-variant)', background: 'rgba(255,255,255,0.82)' }}
      >
        <div className="min-w-0">
          <h3 className="font-bold text-[16px] flex items-center gap-2">
            <Sym name="forum" className="text-[18px] shrink-0" style={{ color: 'var(--p-primary)' }} />
            Thread
          </h3>
          <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>
            #{channelName.replace(/\s+/g, '-')}
          </p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 transition-colors shrink-0" aria-label="Close thread">
          <Sym name="close" style={{ color: 'var(--p-on-surface-variant)' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        <SectionLabel>Thread starter</SectionLabel>
        <ThreadMessageCompact message={threadRoot} variant="root" formatTime={formatTime} />

        <div className="flex items-center gap-2 py-2">
          <div className="flex-1 h-px" style={{ background: 'var(--p-outline-variant)' }} />
          <span className="text-[11px] font-bold uppercase tracking-wide px-2" style={{ color: 'var(--p-on-surface-variant)' }}>
            {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--p-outline-variant)' }} />
        </div>

        <div className="space-y-2.5 pl-1">
          {threadReplies.map((r) => (
            <ThreadMessageCompact key={r.id} message={r} variant="reply" formatTime={formatTime} />
          ))}
          {threadReplies.length === 0 ? (
            <p className="text-center text-[13px] py-6 italic" style={{ color: 'var(--p-on-surface-variant)' }}>
              No replies yet — be the first.
            </p>
          ) : null}
        </div>
      </div>

      {showComposer ? (
        <div className="p-3 border-t backdrop-blur-sm shrink-0" style={{ borderColor: 'var(--p-outline-variant)', background: 'rgba(255,255,255,0.88)' }}>
          <Composer placeholder="Reply in thread…" compact showProductAttach onSend={onSend} />
        </div>
      ) : null}
    </aside>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>
      {children}
    </p>
  );
}
