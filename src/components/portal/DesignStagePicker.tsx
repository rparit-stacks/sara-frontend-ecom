import { useState } from 'react';
import { STAGES } from '@/components/manufacturing/stages';
import { Sym } from './Sym';

/**
 * Per-design stage control — independent of the project's own stage stepper.
 * Offers the 6 fixed stage names plus "Custom…" for free text (e.g. "Fabric
 * Sourcing"), since different designs in the same project can be at very
 * different points. Manual only — nothing auto-advances this.
 */
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
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const current = stage || 'INQUIRY';
  const fixed = STAGES.find((s) => s.key === current);
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
        title="This design's stage"
      >
        <Sym name="flag" className="text-[13px]" /> {label}
        <Sym name="expand_more" className="text-[13px]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1 w-52 bg-white border rounded-lg shadow-lg z-40 py-1" style={{ borderColor: 'var(--p-outline-variant)' }}>
            {STAGES.map((s) => (
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
            <div className="h-px my-1" style={{ background: 'var(--p-outline-variant)' }} />
            <button
              onClick={() => { setOpen(false); setCustomValue(fixed ? '' : current); setCustomOpen(true); }}
              className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-black/[0.03] flex items-center gap-2"
              style={{ color: 'var(--p-on-surface-variant)' }}
            >
              <Sym name="edit" className="text-[14px]" /> Custom…
            </button>
          </div>
        </>
      )}

      {customOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setCustomOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 border rounded-2xl shadow-2xl p-5" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
            <h3 className="font-display text-[16px] mb-1">Custom stage</h3>
            <p className="text-[12px] mb-3" style={{ color: 'var(--p-on-surface-variant)' }}>Set a stage name specific to this design.</p>
            <input
              autoFocus
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="e.g. Fabric Sourcing"
              onKeyDown={(e) => { if (e.key === 'Enter' && customValue.trim()) { pick(customValue.trim()); setCustomOpen(false); } }}
              className="w-full h-10 px-3 rounded-lg border text-[14px] mb-4 outline-none focus:ring-2 focus:ring-[#924623]/20"
              style={{ borderColor: 'var(--p-outline-variant)' }}
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setCustomOpen(false)} className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--p-outline)' }}>Cancel</button>
              <button
                type="button"
                disabled={!customValue.trim()}
                onClick={() => { pick(customValue.trim()); setCustomOpen(false); }}
                className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--p-primary)' }}
              >
                Set stage
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
