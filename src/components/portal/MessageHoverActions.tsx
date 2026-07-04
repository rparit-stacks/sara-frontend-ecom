import { useState } from 'react';
import { Sym } from './Sym';

/** A small, curated reaction set — Slack-style quick reactions. */
export const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '👀', '🙏', '🔥', '✅', '😮', '💯', '👏', '🚀'];

export default function MessageHoverActions({
  inThread,
  isSystem,
  pending,
  menuOpen,
  onMenuToggle,
  onReply,
  onDelete,
  onCopyLink,
  onReact,
  canDelete = true,
}: {
  inThread?: boolean;
  isSystem?: boolean;
  pending?: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onReply: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  onReact?: (emoji: string) => void;
  canDelete?: boolean;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  if (isSystem || pending) return null;

  const btn = 'p-1.5 rounded-md hover:bg-black/6 transition-colors';

  return (
    <div
      className={`absolute right-2 sm:right-4 top-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-150 flex items-center gap-0.5 border rounded-lg px-0.5 py-0.5 shadow-sm scale-95 group-hover:scale-100 ${inThread ? 'right-0' : ''}`}
      style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
    >
      <div className="relative">
        <button type="button" title="Add reaction" className={btn} onClick={() => setEmojiOpen((o) => !o)}>
          <Sym name="add_reaction" className="text-[17px]" style={{ color: 'var(--p-on-surface-variant)' }} />
        </button>
        {emojiOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setEmojiOpen(false)} />
            <div
              className="absolute right-0 top-9 z-40 grid grid-cols-6 gap-0.5 p-1.5 border rounded-xl shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
              style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
            >
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { onReact?.(e); setEmojiOpen(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-black/6 text-[18px] leading-none"
                >
                  {e}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {!inThread && (
        <button type="button" title="Reply in thread" onClick={onReply} className={btn}>
          <Sym name="forum" className="text-[17px]" style={{ color: 'var(--p-on-surface-variant)' }} />
        </button>
      )}
      <div className="relative">
        <button type="button" title="More actions" onClick={onMenuToggle} className={btn}>
          <Sym name="more_horiz" className="text-[17px]" style={{ color: 'var(--p-on-surface-variant)' }} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={onMenuToggle} />
            <div
              className="absolute right-0 top-9 w-44 border rounded-lg py-1 z-40 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
              style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
            >
              {!inThread && (
                <button type="button" onClick={() => { onReply(); onMenuToggle(); }} className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-2 hover:bg-black/5">
                  <Sym name="forum" className="text-[16px]" /> Open thread
                </button>
              )}
              <button type="button" onClick={() => { onCopyLink(); onMenuToggle(); }} className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-2 hover:bg-black/5">
                <Sym name="content_copy" className="text-[16px]" /> Copy link
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => { onDelete(); onMenuToggle(); }}
                  className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-2 hover:bg-red-50"
                  style={{ color: '#b42318' }}
                >
                  <Sym name="delete" className="text-[16px]" /> Delete message
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {canDelete && (
        <button type="button" title="Delete" onClick={onDelete} className={`${btn} hover:!bg-red-50`}>
          <Sym name="delete" className="text-[17px]" style={{ color: '#b42318' }} />
        </button>
      )}
    </div>
  );
}
