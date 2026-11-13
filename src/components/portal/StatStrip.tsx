import AnimatedNumber from './AnimatedNumber';

export type StripItem = {
  label: string;
  value: string | number;
  /** Small line under the value, e.g. "3 waiting on you". */
  hint?: string;
  /** Colours the number: good = green, warn = amber, bad = red. Leave out for ink. */
  tone?: 'good' | 'warn' | 'bad';
  onClick?: () => void;
  active?: boolean;
};

/**
 * One card split into cells: label over a counting-up number. Replaces a row of separate tiles, so the numbers read as
 * one summary and take a third of the height. A cell with onClick doubles as a filter (active cell gets an underline).
 * No icons, no background art.
 */
export default function StatStrip({ items }: { items: StripItem[] }) {
  return (
    <div className="pa-strip" style={{ ['--cols' as string]: items.length } as React.CSSProperties}>
      {items.map((it) => {
        const Comp = it.onClick ? 'button' : 'div';
        return (
          <Comp
            key={it.label}
            type={it.onClick ? 'button' : undefined}
            onClick={it.onClick}
            className={`pa-strip-cell ${it.tone ? `tone-${it.tone}` : ''} ${it.active ? 'is-active' : ''}`}
          >
            <span className="pa-strip-label">{it.label}</span>
            <span className="pa-strip-value"><AnimatedNumber value={it.value} /></span>
            {it.hint && <span className="pa-strip-hint">{it.hint}</span>}
          </Comp>
        );
      })}
    </div>
  );
}
