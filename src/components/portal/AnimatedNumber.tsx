import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/** Splits "₹12,300.50" / "42" / "3 days" into prefix, number and suffix. Returns null when there is no number. */
function parse(value: string | number) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? { prefix: '', num: value, suffix: '', decimals: 0, grouped: false } : null;
  }
  const m = value.match(/^(\D*?)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const numStr = m[2].replace(/,/g, '');
  const num = Number(numStr);
  if (!Number.isFinite(num)) return null;
  return {
    prefix: m[1],
    num,
    suffix: m[3],
    decimals: (numStr.split('.')[1] ?? '').length,
    grouped: m[2].includes(','),
  };
}

/**
 * Counts up to its value (and from the previous value when it changes). The final text is always the exact original
 * string, so formatting never drifts; reduced-motion users get the value at once.
 */
export default function AnimatedNumber({ value, className }: { value: string | number; className?: string }) {
  const reduced = !!useReducedMotion();
  const parsed = parse(value);
  const finalText = String(value);
  const [text, setText] = useState(() => (parsed && !reduced ? `${parsed.prefix}0${parsed.suffix}` : finalText));
  const fromRef = useRef(0);

  useEffect(() => {
    const p = parse(value);
    if (!p || reduced) {
      setText(String(value));
      return;
    }
    const controls = animate(fromRef.current, p.num, {
      duration: 0.8,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => {
        const body = p.grouped || p.decimals > 0
          ? v.toLocaleString('en-IN', { minimumFractionDigits: p.decimals, maximumFractionDigits: p.decimals })
          : String(Math.round(v));
        setText(`${p.prefix}${body}${p.suffix}`);
      },
      onComplete: () => setText(String(value)),
    });
    fromRef.current = p.num;
    return () => controls.stop();
  }, [value, reduced]);

  return <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>{text}</span>;
}
