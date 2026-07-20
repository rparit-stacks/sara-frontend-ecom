import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😎', '🤔', '😮', '😢', '😭', '😡', '👍', '👎', '🙏', '👏', '🎉', '✨', '🔥', '❤️', '💯', '✅'],
  },
  {
    label: 'Objects',
    emojis: ['📎', '📷', '📁', '📋', '💬', '🧵', '👗', '🛍️', '📦', '🚚', '💳', '🧾', '📐', '✂️', '🎨'],
  },
];

export default function EmojiPicker({
  open,
  anchorRef,
  onClose,
  onPick,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onPick: (emoji: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === 'undefined') return null;

  const rect = anchorRef.current?.getBoundingClientRect();
  const top = rect ? rect.top - 8 : 200;
  const left = rect ? rect.left : 16;

  return createPortal(
    <div
      ref={ref}
      className="fixed w-72 max-h-56 overflow-y-auto border rounded-xl shadow-xl p-2"
      style={{
        top,
        left,
        transform: 'translateY(-100%)',
        zIndex: 9999,
        background: 'var(--p-surface-container-lowest)',
        borderColor: 'var(--p-outline-variant)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {EMOJI_GROUPS.map((g) => (
        <div key={g.label} className="mb-2">
          <p className="text-[10px] font-bold uppercase px-1 mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>{g.label}</p>
          <div className="flex flex-wrap gap-0.5">
            {g.emojis.map((e) => (
              <button
                key={e}
                type="button"
                className="w-8 h-8 rounded hover:bg-black/5 text-[18px] leading-none"
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  onPick(e);
                  onClose();
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
