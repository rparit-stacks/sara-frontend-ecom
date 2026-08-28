import { useEffect, useRef, useState } from 'react';
import { Sym } from './Sym';

/** Small pill showing the current private tag (if any) on a customer/project/design row —
 *  right-click or double-click anywhere on the row to open the editor. Purely visual +
 *  local edit-state; the caller owns fetching/saving via onSave. */
export function EntityTagPill({ tag }: { tag?: string | null }) {
  if (!tag) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0"
      style={{ background: 'rgba(109,40,217,0.12)', color: '#6d28d9' }}
    >
      <Sym name="label" className="text-[11px]" />
      {tag}
    </span>
  );
}

/** Popup editor for a private WhatsApp-style tag — free text, single value, save/clear.
 *  Positioned at the (x, y) viewport coordinates the triggering right-click/double-click
 *  event supplied, clamped so it never spills off-screen. */
export default function EntityTagMenu({
  open,
  position,
  currentTag,
  onSave,
  onClose,
}: {
  open: boolean;
  position: { x: number; y: number } | null;
  currentTag?: string | null;
  onSave: (tag: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentTag || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(currentTag || '');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, currentTag]);

  if (!open || !position) return null;

  const WIDTH = 240;
  const left = Math.min(position.x, window.innerWidth - WIDTH - 8);
  const top = Math.min(position.y, window.innerHeight - 120);

  const save = () => {
    onSave(value.trim());
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="fixed z-[101] border rounded-xl shadow-lg p-3"
        style={{ left: Math.max(8, left), top: Math.max(8, top), width: WIDTH, background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: 'var(--p-on-surface-variant)' }}>
          <Sym name="label" className="text-[13px]" /> Private tag
        </p>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') onClose();
          }}
          placeholder="e.g. Pending, Follow-up…"
          maxLength={60}
          className="w-full px-2.5 py-1.5 rounded-lg border text-[13px] outline-none"
          style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
        />
        <div className="flex items-center justify-between mt-2.5">
          <button
            type="button"
            onClick={() => { onSave(''); onClose(); }}
            disabled={!currentTag}
            className="text-[11px] font-semibold disabled:opacity-40"
            style={{ color: '#b42318' }}
          >
            Clear tag
          </button>
          <button
            type="button"
            onClick={save}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
            style={{ background: 'var(--p-primary)' }}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
