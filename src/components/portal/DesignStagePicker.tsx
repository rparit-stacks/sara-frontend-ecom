import { useState } from 'react';
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
  const current = stage || 'DESIGN';
  const fixed = DESIGN_STAGES.find((s) => s.key === current);
  const label = fixed?.label || current;

  const pick = (value: string) => {
    setOpen(false);
    if (value !== current) onChange(value);
  };

  return (
    <div className="relative shrink-0">
      <button
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
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1 w-52 bg-white border rounded-lg shadow-lg z-40 py-1" style={{ borderColor: 'var(--p-outline-variant)' }}>
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
