import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  /** Current committed quantity */
  value: number;
  /** Called with the new (clamped) quantity whenever it changes */
  onChange: (next: number) => void;
  /** Minimum allowed quantity (default 1) */
  min?: number;
  /** Maximum allowed quantity (null/undefined = no max) */
  max?: number | null;
  /** Disable all controls */
  disabled?: boolean;
  /** Size preset for the +/- buttons and input */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { btn: 'h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10', field: 'w-10 sm:w-12', icon: 'w-3 h-3 xs:w-4 xs:h-4', text: 'text-xs xs:text-sm sm:text-base' },
  md: { btn: 'w-10 h-10', field: 'w-12', icon: 'w-4 h-4', text: 'text-sm font-medium' },
  lg: { btn: 'w-12 h-12', field: 'w-16', icon: 'w-5 h-5', text: 'text-lg font-medium' },
} as const;

/**
 * Quantity selector with +/- buttons AND a manually-editable number field
 * in the middle, so large quantities can be typed instead of clicked.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = null,
  disabled = false,
  size = 'md',
  className,
}: QuantityStepperProps) {
  const s = SIZE_MAP[size];
  // Local text state so the user can clear the field while typing.
  const [draft, setDraft] = useState(String(value));

  // Keep the visible field in sync when the committed value changes externally.
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const clamp = (n: number) => {
    let next = n;
    if (next < min) next = min;
    if (max != null && next > max) next = max;
    return next;
  };

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) {
      setDraft(String(value)); // revert empty / invalid input
      return;
    }
    const next = clamp(parsed);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const step = (delta: number) => {
    const next = clamp(value + delta);
    if (next !== value) onChange(next);
  };

  return (
    <div className={cn('flex items-center border border-border rounded-full', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn('rounded-full', s.btn)}
        onClick={() => step(-1)}
        disabled={disabled || value <= min}
      >
        <Minus className={s.icon} />
      </Button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).blur();
          }
        }}
        onFocus={(e) => e.target.select()}
        aria-label="Quantity"
        className={cn(
          'text-center bg-transparent border-0 outline-none focus:ring-0 p-0 disabled:opacity-50',
          s.field,
          s.text,
        )}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn('rounded-full', s.btn)}
        onClick={() => step(1)}
        disabled={disabled || (max != null && value >= max)}
      >
        <Plus className={s.icon} />
      </Button>
    </div>
  );
}

export default QuantityStepper;
