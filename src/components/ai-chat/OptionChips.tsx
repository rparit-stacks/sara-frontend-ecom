import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ChatOptionDto } from '@/lib/api';
import type { PendingInput } from './types';

interface OptionChipsProps {
  pending: Extract<PendingInput, { kind: 'BUTTONS' | 'DROPDOWN' | 'MULTI_SELECT' }>;
  onSelect: (label: string, value: string) => void;
  onOther: () => void;
  disabled?: boolean;
}

/**
 * Renders each inputType with a genuinely distinct UI — previously DROPDOWN and BUTTONS looked
 * pixel-identical (both plain chips), so the model choosing DROPDOWN was invisible to the user.
 * BUTTONS = single-click chips. DROPDOWN = a real collapsed <select> (good for a longer single-
 * pick list, e.g. "which of your 6 orders?"). MULTI_SELECT = a checklist with checkboxes and an
 * explicit "Done" submit, since multiple values need collecting before sending.
 */
export function OptionChips({ pending, onSelect, onOther, disabled }: OptionChipsProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dropdownValue, setDropdownValue] = useState<string>('');

  if (pending.kind === 'DROPDOWN') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="flex flex-col gap-2 pl-9"
      >
        <Select
          value={dropdownValue}
          onValueChange={(value) => {
            setDropdownValue(value);
            const opt = pending.options.find((o) => o.value === value);
            if (opt) onSelect(opt.label, opt.value);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-full max-w-[280px] rounded-xl bg-white shadow-soft ring-1 ring-black/[0.08]">
            <SelectValue placeholder="Choose an option…" />
          </SelectTrigger>
          <SelectContent>
            {pending.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pending.allowOther && (
          <button
            type="button"
            disabled={disabled}
            onClick={onOther}
            className="w-fit rounded-full bg-white px-4 py-2 text-sm font-medium text-muted-foreground shadow-soft ring-1 ring-black/[0.08] transition-all hover:-translate-y-0.5 hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
          >
            ✏️ Something else
          </button>
        )}
      </motion.div>
    );
  }

  if (pending.kind === 'MULTI_SELECT') {
    const toggle = (value: string) => {
      if (disabled) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
      });
    };

    const submitMulti = () => {
      const chosen = pending.options.filter((o) => selected.has(o.value));
      if (chosen.length === 0) return;
      onSelect(chosen.map((o) => o.label).join(', '), chosen.map((o) => o.value).join(','));
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="flex flex-col gap-1.5 rounded-2xl bg-white p-2 shadow-soft ring-1 ring-black/[0.08] pl-9 ml-0"
      >
        {pending.options.map((opt) => {
          const isSelected = selected.has(opt.value);
          return (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                isSelected ? 'bg-primary/10 text-foreground' : 'hover:bg-secondary'
              } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
            >
              <Checkbox checked={isSelected} onCheckedChange={() => toggle(opt.value)} />
              {opt.label}
            </label>
          );
        })}

        <div className="mt-1 flex items-center gap-2 px-1">
          {pending.allowOther && (
            <button
              type="button"
              disabled={disabled}
              onClick={onOther}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
            >
              ✏️ Something else
            </button>
          )}
          {selected.size > 0 && (
            <Button size="sm" onClick={submitMulti} disabled={disabled} className="ml-auto rounded-full px-4">
              Done ({selected.size})
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // BUTTONS — single-click chips, immediate send.
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="flex flex-wrap gap-2 pl-9"
    >
      {pending.options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(opt.label, opt.value)}
          className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-foreground shadow-soft ring-1 ring-black/[0.08] transition-all hover:-translate-y-0.5 hover:bg-secondary hover:ring-primary/30 disabled:pointer-events-none disabled:opacity-50"
        >
          {opt.label}
        </button>
      ))}

      {pending.allowOther && (
        <button
          type="button"
          disabled={disabled}
          onClick={onOther}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-muted-foreground shadow-soft ring-1 ring-black/[0.08] transition-all hover:-translate-y-0.5 hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
        >
          ✏️ Something else
        </button>
      )}
    </motion.div>
  );
}
