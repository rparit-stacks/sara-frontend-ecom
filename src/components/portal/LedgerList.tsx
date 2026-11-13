import { ReactNode, useMemo } from 'react';

export type LedgerRow = {
  key: string | number;
  /** ISO date used to group the rows under "Today", "Yesterday", a day or a month. */
  date?: string | null;
  /** Leading mark, usually <PaAvatar/>. */
  lead?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  amount?: ReactNode;
  amountSub?: ReactNode;
  status?: ReactNode;
  /** Primary actions: always visible. */
  actions?: ReactNode;
  /** Secondary actions: appear when the row is hovered or focused. */
  more?: ReactNode;
  onClick?: () => void;
  /** A 3px edge on the row for what needs attention. */
  accent?: 'good' | 'warn' | 'bad' | null;
  /** Full-width area under the row (e.g. an attempt history). */
  expanded?: ReactNode;
};

export function PaAvatar({ name, size = 40 }: { name?: string | null; size?: number }) {
  const t = (name || '?').trim().split(/\s+/).map((p) => p[0]).filter(Boolean).join('').slice(0, 2) || '?';
  return <span className="pa-avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.35) }}>{t}</span>;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function dayLabel(d: Date, today: number): string {
  const diff = Math.round((today - startOfDay(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7 && diff > 0) return d.toLocaleDateString('en-IN', { weekday: 'long' });
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

/**
 * Rows grouped by date, one clear line per item: who/what, the key figure, its status and what you can do.
 * Replaces the wide table: nothing is cut off, the eye scans down one edge, and "when" is the heading, not a column.
 */
export default function LedgerList({ rows, groupTotal, layout = 'list', moreWidth = 0, actionsWidth = 112, amountWidth = 150, statusWidth = 96 }: { rows: LedgerRow[]; groupTotal?: (rows: LedgerRow[]) => ReactNode; layout?: 'list' | 'grid-2' | 'grid-3'; /** Width reserved for the hover-only buttons, so columns never shift. */ moreWidth?: number; /** Width of the always-visible action column (px). */ actionsWidth?: number; /** Width of the amount column (px). */ amountWidth?: number; /** Width of the status column (px). */ statusWidth?: number }) {
  const hasAmount = rows.some((r) => r.amount !== undefined);
  const hasStatus = rows.some((r) => r.status);
  const hasActions = rows.some((r) => r.actions || r.more);
  const hasMore = rows.some((r) => r.more);
  const groups = useMemo(() => {
    const dated = rows.filter((r) => r.date).map((r) => new Date(r.date as string).getTime()).filter((n) => !Number.isNaN(n));
    const span = dated.length ? (Math.max(...dated) - Math.min(...dated)) / 86400000 : 0;
    const monthly = span > 62;
    const anyDated = dated.length > 0;
    const today = startOfDay(new Date());
    const map = new Map<string, { label: string; rows: LedgerRow[] }>();
    for (const r of rows) {
      const d = r.date ? new Date(r.date) : null;
      const valid = d && !Number.isNaN(d.getTime());
      const key = !valid ? 'none' : monthly ? `${d!.getFullYear()}-${d!.getMonth()}` : String(startOfDay(d!));
      const label = !valid ? (anyDated ? 'No date' : '') : monthly ? d!.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : dayLabel(d!, today);
      if (!map.has(key)) map.set(key, { label, rows: [] });
      map.get(key)!.rows.push(r);
    }
    return [...map.values()];
  }, [rows]);

  return (
    <div className="pa-ledger">
      {groups.map((g) => (
        <section key={g.label}>
          {g.label !== '' && <header className="pa-ledger-head">
            <span>{g.label}</span>
            <span className="pa-ledger-count">{g.rows.length}{groupTotal ? <> · {groupTotal(g.rows)}</> : null}</span>
          </header>}
          <div className={`pa-ledger-rows ${layout !== 'list' ? `is-grid ${layout}` : ''}`} style={{ ['--more-w' as string]: `${moreWidth}px`, ['--act-w' as string]: `${actionsWidth}px`, ['--amt-w' as string]: `${amountWidth}px`, ['--sts-w' as string]: `${statusWidth}px` } as React.CSSProperties}>
            {g.rows.map((r, i) => {
              const clickable = !!r.onClick;
              return (
                <div
                  key={r.key}
                  className={`pa-li ${r.expanded ? 'has-expand' : ''} ${clickable ? 'is-click' : ''} ${r.accent ? `accent-${r.accent}` : ''}`}
                  style={{ ['--i' as string]: Math.min(i, 8) } as React.CSSProperties}
                  onClick={r.onClick}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onKeyDown={clickable ? (e) => { if (e.key === 'Enter') r.onClick?.(); } : undefined}
                >
                  {r.lead !== undefined && <div className="pa-li-lead">{r.lead}</div>}
                  <div className="pa-li-main">
                    <div className="pa-li-title">{r.title}</div>
                    {r.sub && <div className="pa-li-sub">{r.sub}</div>}
                  </div>
                  {hasMore && (
                    <div className="pa-li-more" onClick={(e) => e.stopPropagation()}>{r.more}</div>
                  )}
                  {hasAmount && (
                    <div className="pa-li-amount">
                      <div>{r.amount}</div>
                      {r.amountSub && <div className="pa-li-sub">{r.amountSub}</div>}
                    </div>
                  )}
                  {hasStatus && <div className="pa-li-status">{r.status}</div>}
                  {hasActions && (
                    <div className="pa-li-primary" onClick={(e) => e.stopPropagation()}>{r.actions}</div>
                  )}
                  {r.expanded && <div className="pa-li-expand" onClick={(e) => e.stopPropagation()}>{r.expanded}</div>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function LedgerSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="pa-ledger">
      <div className="pa-ledger-rows">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="pa-li animate-pulse">
            <div className="pa-li-lead"><span className="pa-avatar" style={{ background: 'var(--p-surface-container)' }} /></div>
            <div className="pa-li-main">
              <div className="h-3.5 w-48 rounded" style={{ background: 'var(--p-surface-container)' }} />
              <div className="h-3 w-32 rounded mt-2" style={{ background: 'var(--p-surface-container)' }} />
            </div>
            <div className="pa-li-amount"><div className="h-3.5 w-20 rounded ml-auto" style={{ background: 'var(--p-surface-container)' }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
