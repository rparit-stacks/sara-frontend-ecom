import { useEffect, useMemo, useRef, useState } from 'react';
import { Sym } from './Sym';
import type { CustomerChatStatus, CustomerTagDto } from '@/lib/api';

/** Small chips (up to 3, "+N more" beyond that) showing a customer's tags on their row —
 *  right-click or double-click the row (or click this pill) to open the multi-tag editor. */
export function CustomerTagChips({ tags, onClick }: { tags?: string[]; onClick?: (e: React.MouseEvent) => void }) {
  if (!tags || tags.length === 0) return null;
  const shown = tags.slice(0, 3);
  const extra = tags.length - shown.length;
  return (
    <span className="inline-flex items-center gap-1 shrink-0" onClick={onClick}>
      {shown.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide"
          style={{ background: 'rgba(109,40,217,0.12)', color: '#6d28d9' }}
        >
          <Sym name="label" className="text-[11px]" />
          {t}
        </span>
      ))}
      {extra > 0 && (
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold"
          style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}

/** Small status marker for a customer row — a colored dot for Priority, a muted badge for
 *  Closed. Nothing rendered for the default Open status (keeps the common case visually quiet). */
export function CustomerStatusBadge({ status }: { status?: CustomerChatStatus }) {
  if (!status || status === 'OPEN') return null;
  if (status === 'PRIORITY') {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0"
        style={{ background: 'rgba(180,35,24,0.12)', color: 'var(--p-error, #b42318)' }}
        title="Priority"
      >
        <Sym name="flag" className="text-[11px]" />
        Priority
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0"
      style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
      title="Closed"
    >
      <Sym name="archive" className="text-[11px]" />
      Closed
    </span>
  );
}

const STATUS_OPTIONS: { key: CustomerChatStatus; label: string; icon: string }[] = [
  { key: 'OPEN', label: 'Open', icon: 'chat_bubble' },
  { key: 'PRIORITY', label: 'Priority', icon: 'flag' },
  { key: 'CLOSED', label: 'Closed', icon: 'archive' },
];

/** Popup editor for a customer's tags (add/remove, many) plus its chat status
 *  (Open/Priority/Closed) — replaces the old single-tag EntityTagMenu for customer rows.
 *  Positioned at the (x, y) viewport coordinates the triggering right-click/double-click
 *  supplied, clamped so it never spills off-screen. */
export default function CustomerTagMenu({
  open,
  position,
  tags,
  knownTags,
  status,
  onAddTag,
  onRemoveTag,
  onSetStatus,
  onClose,
}: {
  open: boolean;
  position: { x: number; y: number } | null;
  tags: CustomerTagDto[];
  knownTags: string[];
  status: CustomerChatStatus;
  onAddTag: (tagText: string) => void;
  onRemoveTag: (tagId: number) => void;
  onSetStatus: (status: CustomerChatStatus) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    const existing = new Set(tags.map((t) => t.tagText.toLowerCase()));
    return knownTags
      .filter((t) => !existing.has(t.toLowerCase()))
      .filter((t) => !q || t.toLowerCase().includes(q))
      .slice(0, 6);
  }, [value, knownTags, tags]);

  if (!open || !position) return null;

  const WIDTH = 280;
  const left = Math.min(position.x, window.innerWidth - WIDTH - 8);
  const top = Math.min(position.y, window.innerHeight - 320);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddTag(trimmed);
    setValue('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="fixed z-[101] border rounded-xl shadow-lg p-3"
        style={{ left: Math.max(8, left), top: Math.max(8, top), width: WIDTH, background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1" style={{ color: 'var(--p-on-surface-variant)' }}>
          <Sym name="flag" className="text-[13px]" /> Chat status
        </p>
        <div className="flex gap-1 mb-3">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSetStatus(opt.key)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold"
              style={opt.key === status
                ? { background: 'var(--p-primary)', color: '#fff' }
                : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
            >
              <Sym name={opt.icon} className="text-[13px]" />
              {opt.label}
            </button>
          ))}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1" style={{ color: 'var(--p-on-surface-variant)' }}>
          <Sym name="label" className="text-[13px]" /> Tags
        </p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-md text-[11px] font-semibold"
                style={{ background: 'rgba(109,40,217,0.12)', color: '#6d28d9' }}
              >
                {t.tagText}
                <button
                  type="button"
                  onClick={() => onRemoveTag(t.id)}
                  className="rounded-full hover:bg-black/10 p-0.5"
                  aria-label={`Remove tag ${t.tagText}`}
                >
                  <Sym name="close" className="text-[11px]" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit(value);
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Add a tag…"
            maxLength={60}
            className="w-full px-2.5 py-1.5 rounded-lg border text-[13px] outline-none"
            style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
          />
          {suggestions.length > 0 && (
            <div
              className="mt-1 border rounded-lg overflow-hidden max-h-32 overflow-y-auto"
              style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className="w-full text-left px-2.5 py-1.5 text-[12px] hover:bg-black/5"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end mt-2.5">
          <button
            type="button"
            onClick={() => submit(value)}
            disabled={!value.trim()}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white disabled:opacity-40"
            style={{ background: 'var(--p-primary)' }}
          >
            Add tag
          </button>
        </div>
      </div>
    </>
  );
}
