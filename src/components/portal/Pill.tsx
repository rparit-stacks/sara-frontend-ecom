import { STATUS_TONE } from './adminData';

/** Status/stage pill — looks up a tone by label, falls back to neutral. */
export function Pill({ label, tone }: { label: string; tone?: { bg: string; fg: string } }) {
  const t = tone || STATUS_TONE[label] || { bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface-variant)' };
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap" style={{ background: t.bg, color: t.fg }}>
      {label}
    </span>
  );
}
