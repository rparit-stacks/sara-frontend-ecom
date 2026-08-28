import { Sym } from './Sym';

/**
 * Shared metric card used across admin list pages (Invoices, Payment Links,
 * Payment History, Tech Packs, Dashboard) — icon chip + value + label, the
 * consistent "at a glance" summary row every CRM-style page opens with.
 */
export default function StatTile({
  label,
  value,
  icon,
  color = 'var(--p-primary)',
  onClick,
}: {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`text-left border rounded-2xl p-4 ${onClick ? 'transition-shadow hover:shadow-md' : ''}`}
      style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{label}</p>
        {icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}17`, color }}>
            <Sym name={icon} className="text-[15px]" />
          </div>
        )}
      </div>
      <p className="font-bold text-[24px] leading-none" style={{ color: color !== 'var(--p-primary)' ? color : undefined }}>{value}</p>
    </Comp>
  );
}
