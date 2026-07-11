// The unified manufacturing project journey (MANUFACTURING_PORTAL_PLAN.md §3):
//   INQUIRY -> QUOTATION -> INVOICING -> DESIGNING -> SAMPLING -> PRODUCTION -> DELIVERED
// Invoicing is an upfront/advance payment step, collected before design work
// starts — not a final formality. Each stage carries its own set of
// stage-specific statuses.

export type StageKey = 'INQUIRY' | 'QUOTATION' | 'INVOICING' | 'DESIGNING' | 'SAMPLING' | 'PRODUCTION' | 'DELIVERED';

export interface StageDef {
  key: StageKey;
  label: string;
  icon: string;
  statuses: { value: string; label: string }[];
}

const s = (value: string, label: string) => ({ value, label });

export const STAGES: StageDef[] = [
  {
    key: 'INQUIRY', label: 'Inquiry', icon: 'fa-inbox',
    statuses: [s('INQUIRY_RECEIVED', 'Inquiry received')],
  },
  {
    key: 'QUOTATION', label: 'Quotation', icon: 'fa-file-invoice-dollar',
    statuses: [
      s('QUOTATION_SENT', 'Quotation sent'),
      s('AWAITING_APPROVAL', 'Awaiting approval'),
      s('APPROVED', 'Approved'),
      s('REVISION_REQUESTED', 'Revision requested'),
      s('REJECTED', 'Rejected'),
    ],
  },
  {
    key: 'INVOICING', label: 'Invoicing', icon: 'fa-receipt',
    statuses: [
      s('PAYMENT_PENDING', 'Payment pending'),
      s('PARTIALLY_PAID', 'Partially paid'),
      s('PAID', 'Paid'),
    ],
  },
  {
    key: 'DESIGNING', label: 'Designing', icon: 'fa-pen-ruler',
    statuses: [s('DESIGN_IN_PROGRESS', 'Design in progress')],
  },
  {
    key: 'SAMPLING', label: 'Sampling', icon: 'fa-scissors',
    statuses: [
      s('PATTERN_MAKING', 'Pattern making'),
      s('FABRIC_SOURCING', 'Fabric sourcing'),
      s('SAMPLE_UNDER_DEVELOPMENT', 'Sample under development'),
      s('SAMPLE_SENT', 'Sample sent'),
      s('SAMPLE_REVISION', 'Sample revision'),
      s('SAMPLE_APPROVED', 'Sample approved'),
    ],
  },
  {
    key: 'PRODUCTION', label: 'Production', icon: 'fa-industry',
    statuses: [
      s('ORDER_CONFIRMED', 'Order confirmed'),
      s('FABRIC_ORDERED', 'Fabric ordered'),
      s('FABRIC_RECEIVED', 'Fabric received'),
      s('CUTTING', 'Cutting'),
      s('STITCHING', 'Stitching'),
      s('FINISHING', 'Finishing'),
      s('QUALITY_CHECK', 'Quality check'),
      s('PACKING', 'Packing'),
      s('DISPATCH', 'Dispatch'),
      s('DELIVERED', 'Delivered'),
    ],
  },
  {
    key: 'DELIVERED', label: 'Delivered', icon: 'fa-circle-check',
    statuses: [s('DELIVERED', 'Delivered')],
  },
];

export const STAGE_INDEX: Record<StageKey, number> = STAGES.reduce((acc, st, i) => {
  acc[st.key] = i; return acc;
}, {} as Record<StageKey, number>);

export function stageDef(key?: string): StageDef {
  return STAGES.find((st) => st.key === key) ?? STAGES[0];
}

export function statusLabelFor(stage?: string, status?: string): string {
  const def = stageDef(stage);
  return def.statuses.find((x) => x.value === status)?.label
    ?? (status ? status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : def.statuses[0].label);
}

/** First status of a stage — the sensible default when entering it. */
export function defaultStatusFor(stage: string): string {
  return stageDef(stage).statuses[0].value;
}
