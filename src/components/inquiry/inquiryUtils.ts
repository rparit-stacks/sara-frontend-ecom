import { FormField, FormSchema, FormSettings } from '@/components/portal/formbuilder/types';
import { ManufacturingFormDto } from '@/lib/api';

const DEFAULT_SETTINGS: FormSettings = {
  visibility: 'public',
  successMessage: "Thank you! We'll review your inquiry and get back to you soon.",
};

export function parseFormFromDto(dto: ManufacturingFormDto | null | undefined) {
  if (!dto) return null;
  const schema = (dto.schema || {}) as Partial<FormSchema>;
  return {
    formId: dto.id,
    name: dto.name || schema.name || 'Manufacturing Inquiry',
    status: dto.status,
    version: dto.version,
    fields: (schema.fields || []) as FormField[],
    steps: schema.steps || [{ id: 's1', title: 'Details' }],
    settings: { ...DEFAULT_SETTINGS, ...(schema.settings || {}) },
  };
}

export function buildSchemaPayload(
  fields: FormField[],
  name: string,
  settings: FormSettings,
  steps: { id: string; title: string }[] = [{ id: 's1', title: 'Details' }],
): Record<string, unknown> {
  return {
    id: 'inquiry',
    name,
    category: 'Inquiry',
    fields,
    steps,
    settings,
    workflow: [],
    notifications: [],
    permissions: [],
    updatedAt: new Date().toISOString(),
  };
}

export function formatInquiryDate(iso: string | number[] | null | undefined) {
  if (iso == null || iso === '') return '—';
  try {
    const d = parsePortalDate(iso);
    if (!d || Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(iso);
  }
}

/** Compact date for search matching, e.g. "12 Jul 2026", "12/07/2026", "2026-07-12". */
export function portalDateSearchText(iso: string | number[] | null | undefined): string {
  const d = parsePortalDate(iso);
  if (!d || Number.isNaN(d.getTime())) return '';
  const day = d.getDate();
  const monthShort = d.toLocaleString('en-IN', { month: 'short' });
  const monthLong = d.toLocaleString('en-IN', { month: 'long' });
  const year = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return [
    `${day} ${monthShort} ${year}`,
    `${day} ${monthLong} ${year}`,
    `${dd}/${mm}/${year}`,
    `${dd}-${mm}-${year}`,
    `${year}-${mm}-${dd}`,
    `${day}/${d.getMonth() + 1}/${year}`,
  ].join(' ');
}

/** Local calendar day key YYYY-MM-DD for filtering. */
export function portalDateKey(iso: string | number[] | null | undefined): string | null {
  const d = parsePortalDate(iso);
  if (!d || Number.isNaN(d.getTime())) return null;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Backend stores LocalDateTime (no zone). Parse wall-clock as-is so IST
 * times don't shift when the browser treats a bare ISO string as UTC.
 */
function parsePortalDate(iso: string | number[]): Date | null {
  if (Array.isArray(iso)) {
    const [y, m, d, h = 0, min = 0, s = 0] = iso.map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, h, min, Math.floor(s));
  }
  const raw = String(iso).trim();
  if (!raw) return null;

  // Bare local datetime from Jackson: 2026-07-12T18:30:00[.sss]
  const local = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/,
  );
  if (local) {
    return new Date(
      Number(local[1]),
      Number(local[2]) - 1,
      Number(local[3]),
      Number(local[4]),
      Number(local[5]),
      Number(local[6] || 0),
    );
  }

  // Date-only
  const dayOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dayOnly) {
    return new Date(Number(dayOnly[1]), Number(dayOnly[2]) - 1, Number(dayOnly[3]));
  }

  return new Date(raw);
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    NEW: 'New',
    REVIEWING: 'Reviewing',
    QUOTED: 'Quoted',
    DECLINED: 'Declined',
  };
  return map[status.toUpperCase()] || status;
}

export const WIDTH_CLASS: Record<string, string> = {
  '25': 'w-full sm:w-[calc(25%-12px)]',
  '50': 'w-full sm:w-[calc(50%-8px)]',
  '75': 'w-full sm:w-[calc(75%-4px)]',
  '100': 'w-full',
};
