import { FormField } from '@/components/portal/formbuilder/types';

/**
 * The three contact fields every inquiry form MUST have. They are `locked`:
 * admin cannot delete them, cannot make them optional, and they always auto-fill
 * into the quotation. Keys are chosen to match the backend contact extractor
 * (key contains "name" / "email" / "phone").
 */
export const SYSTEM_FIELD_KEYS = ['full_name', 'email', 'phone'] as const;
export type SystemFieldKey = (typeof SYSTEM_FIELD_KEYS)[number];

export const SYSTEM_FIELDS: FormField[] = [
  {
    id: 'sys_full_name',
    type: 'short_text',
    key: 'full_name',
    label: 'Full name',
    placeholder: 'Your full name',
    required: true,
    locked: true,
    width: '50',
    icon: 'person',
  },
  {
    id: 'sys_email',
    type: 'email',
    key: 'email',
    label: 'Email address',
    placeholder: 'you@example.com',
    required: true,
    locked: true,
    width: '50',
    icon: 'mail',
  },
  {
    id: 'sys_phone',
    type: 'phone',
    key: 'phone',
    label: 'Phone number',
    placeholder: '+91 …',
    required: true,
    locked: true,
    width: '50',
    icon: 'call',
  },
];

const isSystemKey = (key: string): key is SystemFieldKey =>
  (SYSTEM_FIELD_KEYS as readonly string[]).includes(key);

/**
 * Guarantee the three locked contact fields exist, are required, and come first.
 * Any locked field already present (loaded from a saved schema) is re-normalized
 * to enforce required=true + locked=true; missing ones are prepended.
 */
export function ensureSystemFields(fields: FormField[]): FormField[] {
  const flat = fields;
  const present = new Map<string, FormField>();
  for (const f of flat) {
    if (isSystemKey(f.key)) present.set(f.key, { ...f, required: true, locked: true });
  }
  const systemInOrder = SYSTEM_FIELDS.map((sf) => present.get(sf.key) ?? sf);
  const rest = flat.filter((f) => !isSystemKey(f.key));
  return [...systemInOrder, ...rest];
}

export const isLockedField = (f: FormField) => f.locked === true || isSystemKey(f.key);
