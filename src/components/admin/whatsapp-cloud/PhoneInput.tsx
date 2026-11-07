import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { COUNTRIES, DEFAULT_COUNTRY, countryLabel, parsePhone } from '@/lib/phone';
import { cn } from '@/lib/utils';

export interface PhoneValue {
  code: string; // "+91"
  national: string; // digits the person typed
}

export const emptyPhone = (code: string = DEFAULT_COUNTRY): PhoneValue => ({ code, national: '' });

/** The checked number for a PhoneValue (country code + digits). */
export const phoneResult = (v: PhoneValue) => parsePhone(`${v.code}${v.national.replace(/\D/g, '')}`, v.code);

/**
 * Phone number with a searchable country list (the shared list of countries and dialling codes).
 * Shows what is wrong with the number as the person types, once they have typed something.
 */
export const PhoneInput = ({
  value, onChange, disabled, id, className, placeholder = '98765 43210',
}: {
  value: PhoneValue; onChange: (v: PhoneValue) => void; disabled?: boolean; id?: string; className?: string; placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const result = useMemo(() => (value.national ? phoneResult(value) : null), [value]);

  return (
    <div className={className}>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className="w-[150px] shrink-0 justify-between px-3 font-normal">
              <span className="truncate">{value.code} <span className="text-muted-foreground">{countryLabel(value.code).split(' / ')[0].slice(0, 9)}</span></span>
              <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search country or code…" />
              <CommandList className="max-h-64">
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {COUNTRIES.map((c) => (
                    <CommandItem
                      key={`${c.country}-${c.code}`}
                      value={`${c.country} ${c.code}`}
                      onSelect={() => { onChange({ ...value, code: c.code }); setOpen(false); }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', value.code === c.code ? 'opacity-100' : 'opacity-0')} />
                      <span className="flex-1 truncate">{c.country}</span>
                      <span className="text-xs text-muted-foreground">{c.code}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          disabled={disabled}
          value={value.national}
          placeholder={placeholder}
          onChange={(e) => onChange({ ...value, national: e.target.value.replace(/[^\d\s-]/g, '') })}
          className={cn(result && !result.ok && 'border-red-300 focus-visible:ring-red-300')}
        />
      </div>
      {result && (
        <p className={cn('mt-1 text-xs', result.ok ? 'text-emerald-700' : 'text-red-600')}>
          {result.ok ? `${result.display} · ${result.country}` : result.reason}
        </p>
      )}
    </div>
  );
};

/** Just the country list, for places that need a default country (for example a pasted list of numbers). */
export const CountryPicker = ({ value, onChange, className }: { value: string; onChange: (code: string) => void; className?: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className={cn('justify-between px-3 font-normal', className)}>
          <span className="truncate">{countryLabel(value).split(' / ')[0]} <span className="text-muted-foreground">{value}</span></span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country or code…" />
          <CommandList className="max-h-64">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((c) => (
                <CommandItem key={`${c.country}-${c.code}`} value={`${c.country} ${c.code}`} onSelect={() => { onChange(c.code); setOpen(false); }}>
                  <Check className={cn('mr-2 h-4 w-4', value === c.code ? 'opacity-100' : 'opacity-0')} />
                  <span className="flex-1 truncate">{c.country}</span>
                  <span className="text-xs text-muted-foreground">{c.code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
