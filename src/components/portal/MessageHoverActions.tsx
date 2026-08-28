import { useEffect, useState } from 'react';
import { Sym } from './Sym';

/** A small, curated reaction set — Slack-style quick reactions. */
export const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🙏', '🔥', '✅', '😮', '👏', '🚀'];

const MENU_WIDTH = 220;
const MENU_MARGIN = 8;

/** Clamp a WhatsApp-style right-click context menu inside the viewport, anchored to the
 *  click point rather than a toolbar button — flips left/up when there isn't room. */
function clampMenuPosition(clickX: number, clickY: number, estimatedHeight: number) {
  const left = Math.min(clickX, window.innerWidth - MENU_WIDTH - MENU_MARGIN);
  const openUp = window.innerHeight - clickY < estimatedHeight + MENU_MARGIN && clickY > estimatedHeight + MENU_MARGIN;
  return {
    left: Math.max(MENU_MARGIN, left),
    top: openUp ? undefined : clickY,
    bottom: openUp ? window.innerHeight - clickY : undefined,
  };
}

/**
 * WhatsApp-style message actions: nothing shows on hover — right-click (or long-press,
 * via the caller's onContextMenu wiring) opens a single popup at the click point with
 * quick-react emojis up top and reply/copy/delete actions below.
 */
export default function MessageHoverActions({
  inThread,
  isSystem,
  pending,
  disableReply = false,
  menuOpen,
  menuPosition,
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
  disableReply?: boolean;
  menuOpen: boolean;
  /** Viewport click coordinates from the triggering contextmenu event. */
  menuPosition?: { x: number; y: number } | null;
  onMenuToggle: () => void;
  onReply: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  onReact?: (emoji: string) => void;
  canDelete?: boolean;
}) {
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);

  useEffect(() => {
    if (!menuOpen || !menuPosition) {
      setPos(null);
      return;
    }
    setPos(clampMenuPosition(menuPosition.x, menuPosition.y, 320));
  }, [menuOpen, menuPosition]);

  if (isSystem || pending || !menuOpen || !pos) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onMenuToggle} onContextMenu={(e) => { e.preventDefault(); onMenuToggle(); }} />
      <div
        className="fixed z-[101] border rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
        style={{
          top: pos.top,
          bottom: pos.bottom,
          left: pos.left,
          width: MENU_WIDTH,
          background: 'var(--p-surface-container-lowest)',
          borderColor: 'var(--p-outline-variant)',
        }}
      >
        {onReact && (
          <div className="flex items-center justify-between px-2 py-2 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
            {QUICK_EMOJIS.slice(0, 6).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => { onReact(e); onMenuToggle(); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/6 text-[18px] leading-none hover:scale-125 transition-transform"
              >
                {e}
              </button>
            ))}
          </div>
        )}
        {!inThread && !disableReply && (
          <button type="button" onClick={() => { onReply(); onMenuToggle(); }} className="w-full text-left px-3 py-2.5 text-[13px] flex items-center gap-2.5 hover:bg-black/5">
            <Sym name="forum" className="text-[17px]" style={{ color: 'var(--p-on-surface-variant)' }} /> Reply in thread
          </button>
        )}
        <button type="button" onClick={() => { onCopyLink(); onMenuToggle(); }} className="w-full text-left px-3 py-2.5 text-[13px] flex items-center gap-2.5 hover:bg-black/5">
          <Sym name="content_copy" className="text-[17px]" style={{ color: 'var(--p-on-surface-variant)' }} /> Copy link
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={() => { onDelete(); onMenuToggle(); }}
            className="w-full text-left px-3 py-2.5 text-[13px] flex items-center gap-2.5 hover:bg-red-50"
            style={{ color: '#b42318' }}
          >
            <Sym name="delete" className="text-[17px]" /> Delete message
          </button>
        )}
      </div>
    </>
  );
}
