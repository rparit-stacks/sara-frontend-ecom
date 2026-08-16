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
import type { AdminPendingInput } from './types';

interface Props {
  pending: Extract<AdminPendingInput, { kind: 'BUTTONS' | 'DROPDOWN' | 'MULTI_SELECT' }>;
  onSelect: (label: string, value: string) => void;
  onOther: () => void;
  disabled?: boolean;
}

/** Ops-styled structured inputs — DROPDOWN is a real select, not fake chips. */
export function AdminOptionControls({ pending, onSelect, onOther, disabled }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dropdownValue, setDropdownValue] = useState('');

  if (pending.kind === 'DROPDOWN') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 pl-1"
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
          <SelectTrigger className="w-full max-w-[300px] rounded-lg border-slate-200 bg-white text-slate-800 shadow-sm">
            <SelectValue placeholder="Select an option…" />
          </SelectTrigger>
          <SelectContent className="border-slate-200 bg-white text-slate-800">
            {pending.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="focus:bg-amber-50">
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
            className="w-fit rounded-md border border-dashed border-amber-400/70 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50"
          >
            Other…
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
    const submit = () => {
      const picked = pending.options.filter((o) => selected.has(o.value));
      if (picked.length === 0) return;
      onSelect(
        picked.map((o) => o.label).join(', '),
        picked.map((o) => o.value).join(',')
      );
    };
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        {pending.options.map((opt: ChatOptionDto) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <Checkbox
              checked={selected.has(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
              disabled={disabled}
              className="border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white"
            />
            {opt.label}
          </label>
        ))}
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            disabled={disabled || selected.size === 0}
            onClick={submit}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Done
          </Button>
          {pending.allowOther && (
            <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={onOther} className="text-amber-800">
              Other…
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // BUTTONS
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2"
    >
      {pending.options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(opt.label, opt.value)}
          className="rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-sm font-medium text-amber-900 transition hover:border-amber-400 hover:bg-amber-100 disabled:opacity-50"
        >
          {opt.label}
        </button>
      ))}
      {pending.allowOther && (
        <button
          type="button"
          disabled={disabled}
          onClick={onOther}
          className="rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50"
        >
          Other…
        </button>
      )}
    </motion.div>
  );
}
