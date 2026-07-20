import { Sym } from './Sym';
import type { ProjectThreadSummaryDto } from '@/lib/api';
import { formatMessagePreview } from '@/lib/messagePreview';
import { ThreadPreviewIcon } from './ThreadMessageCompact';

export type ThreadListItemData = ProjectThreadSummaryDto & {
  projectCode?: string;
  projectTitle?: string;
};

export default function ThreadListItem({
  thread,
  onClick,
  timeLabel,
  showProject = false,
}: {
  thread: ThreadListItemData;
  onClick: () => void;
  timeLabel: string;
  showProject?: boolean;
}) {
  const hasReplies = thread.replyCount > 0;
  const headline = hasReplies && thread.lastReplyBy
    ? `${thread.lastReplyBy} replied`
    : `${thread.rootAuthorName || 'Someone'} started a thread`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border transition-all hover:shadow-md active:scale-[0.995] overflow-hidden"
      style={{
        background: thread.unread ? 'var(--p-surface-container-low)' : 'var(--p-surface-container-lowest)',
        borderColor: thread.unread ? 'var(--p-primary)' : 'var(--p-outline-variant)',
        boxShadow: thread.unread ? '0 0 0 1px rgba(0,103,106,0.08)' : undefined,
      }}
    >
      <div className="flex gap-3 p-4">
        <ThreadPreviewIcon body={thread.snippet} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className="font-bold text-[14px] leading-snug truncate" style={{ color: 'var(--p-on-surface)' }}>
              {headline}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {thread.unread ? (
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--p-primary)' }} aria-hidden />
              ) : null}
              <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--p-on-surface-variant)' }}>
                {timeLabel}
              </span>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed line-clamp-2 mb-2 break-words" style={{ color: 'var(--p-on-surface-variant)' }}>
            {formatMessagePreview(thread.snippet)}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
            >
              <Sym name="tag" className="text-[13px]" />
              {thread.designName}
            </span>
            {showProject && thread.projectCode ? (
              <span className="text-[11px] font-medium truncate max-w-[120px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                {thread.projectTitle || thread.projectCode}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--p-primary)' }}>
              <Sym name="forum" className="text-[13px]" />
              {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
            </span>
            {thread.unread ? (
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded text-white ml-auto" style={{ background: 'var(--p-primary)' }}>
                New
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}
