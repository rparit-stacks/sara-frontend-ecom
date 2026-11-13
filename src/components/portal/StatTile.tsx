import AnimatedNumber from './AnimatedNumber';
import { Sym } from './Sym';

/**
 * Shared metric tile used across the admin list pages (Invoices, Payment Links, Payment History, Tech Packs,
 * Quotations): a coloured top edge, the label, a counting-up value and a faint icon in the background.
 * Styles live in portal-admin-skin.css (.pa-stat).
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
  const toned = color !== 'var(--p-primary)';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`pa-stat ${toned ? 'has-tone' : ''}`}
      style={{ ['--stat' as string]: color } as React.CSSProperties}
    >
      {icon && <Sym name={icon} className="pa-stat-ghost" />}
      <p className="pa-stat-label">{label}</p>
      <p className={`pa-stat-value ${String(value).length > 9 ? 'is-long' : ''}`}><AnimatedNumber value={value} /></p>
    </Comp>
  );
}
