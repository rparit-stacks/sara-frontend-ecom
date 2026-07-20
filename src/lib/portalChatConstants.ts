/** Project-level announcement categories (Announcements channel only — NOT design workflow). */
export const ANNOUNCEMENT_CATEGORIES = [
  { key: 'INQUIRY', label: 'Inquiry' },
  { key: 'QUOTATION', label: 'Quotation' },
  { key: 'INVOICE', label: 'Invoice' },
  { key: 'DESIGN', label: 'Design' },
  { key: 'SAMPLING', label: 'Sampling' },
  { key: 'PRODUCTION', label: 'Production' },
  { key: 'DELIVERY', label: 'Delivery' },
] as const;

export type AnnouncementCategoryKey = (typeof ANNOUNCEMENT_CATEGORIES)[number]['key'];

export function announcementCategoryLabel(key?: string | null): string {
  if (!key) return 'Update';
  return ANNOUNCEMENT_CATEGORIES.find((c) => c.key === key)?.label || key;
}

/** Design-level workflow statuses (Design module only — NOT project announcements). */
export const DESIGN_STAGES = [
  { key: 'DESIGN', label: 'Design' },
  { key: 'SAMPLING', label: 'Sampling' },
  { key: 'QUOTATION', label: 'Quotation' },
  { key: 'INVOICING', label: 'Invoicing' },
  { key: 'PRODUCTION', label: 'Production' },
  { key: 'DELIVERED', label: 'Delivered' },
] as const;

export type DesignStageKey = (typeof DESIGN_STAGES)[number]['key'];

export function designStageLabel(stage?: string | null): string {
  if (!stage) return 'Design';
  return DESIGN_STAGES.find((s) => s.key === stage)?.label || stage;
}

export function defaultActiveDesignId(
  designs: { id: number; system?: boolean; general?: boolean }[] | undefined,
): number | undefined {
  if (!designs?.length) return undefined;
  return (
    designs.find((d) => d.general)?.id
    ?? designs.find((d) => !d.system && !d.general)?.id
    ?? designs.find((d) => !d.system)?.id
    ?? designs[0]?.id
  );
}
