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

export function formatInquiryDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
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
