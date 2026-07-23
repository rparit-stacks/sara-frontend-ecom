import { useLayoutEffect, useRef, useState } from 'react';
import { DESIGN_STAGES } from '@/lib/portalChatConstants';
import { Sym } from './Sym';

/** Per-design workflow status — independent from project announcements. */
export default function DesignStagePicker({
  stage,
  onChange,
  disabled,
}: {
  stage?: string;
  onChange: (stage: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const current = stage || 'DESIGN';
  const fixed = DESIGN_STAGES.find((s) => s.key === current);
  const label = fixed?.label || current;

  // The picker lives inside an `overflow-x-auto` bar under the header, which would clip
  // an absolutely-positioned menu. Render the menu as `position: fixed` anchored to the
  // button's viewport rect so it escapes the overflow/stacking context entirely.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current!.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const pick = (value: string) => {
    setOpen(false);
    if (value !== current) onChange(value);
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border disabled:opacity-50"
        style={{ borderColor: 'var(--p-outline)', color: 'var(--p-primary)' }}
        title="This design's workflow status"
      >
        <Sym name="flag" className="text-[13px]" /> {label}
        <Sym name="expand_more" className="text-[13px]" />
      </button>
      {open && pos && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            className="fixed w-52 bg-white border rounded-lg shadow-lg z-[61] py-1"
            style={{ top: pos.top, left: pos.left, borderColor: 'var(--p-outline-variant)' }}
          >
            {DESIGN_STAGES.map((s) => (
              <button
                key={s.key}
                onClick={() => pick(s.key)}
                className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-black/[0.03] flex items-center gap-2"
                style={s.key === current ? { color: 'var(--p-primary)', fontWeight: 700 } : { color: 'var(--p-on-surface)' }}
              >
                {s.key === current && <Sym name="check" className="text-[14px]" />}
                <span className={s.key === current ? '' : 'ml-[18px]'}>{s.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
