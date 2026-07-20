/** Shared tone maps for admin portal pills — no mock data. */

export type Stage = 'Inquiry' | 'Quotation' | 'Invoicing' | 'Designing' | 'Sampling' | 'Production' | 'Delivered';

export const STAGE_TONE: Record<Stage, { bg: string; fg: string }> = {
  Inquiry: { bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface)' },
  Quotation: { bg: 'var(--p-surface-container)', fg: 'var(--p-on-surface-variant)' },
  Invoicing: { bg: 'var(--p-primary-fixed-dim)', fg: 'var(--p-on-primary-fixed)' },
  Designing: { bg: 'var(--p-primary-fixed)', fg: 'var(--p-on-primary-fixed-variant)' },
  Sampling: { bg: 'var(--p-primary-fixed)', fg: 'var(--p-on-primary-fixed-variant)' },
  Production: { bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  Delivered: { bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
};

export const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  New: { bg: 'var(--p-error-container)', fg: 'var(--p-on-error-container)' },
  NEW: { bg: 'var(--p-error-container)', fg: 'var(--p-on-error-container)' },
  Reviewing: { bg: 'var(--p-primary-fixed)', fg: 'var(--p-on-primary-fixed-variant)' },
  REVIEWING: { bg: 'var(--p-primary-fixed)', fg: 'var(--p-on-primary-fixed-variant)' },
  Quoted: { bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  QUOTED: { bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  Declined: { bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface-variant)' },
  DECLINED: { bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface-variant)' },
  Draft: { bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface-variant)' },
  DRAFT: { bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface-variant)' },
  Sent: { bg: 'var(--p-primary-fixed)', fg: 'var(--p-on-primary-fixed-variant)' },
  SENT: { bg: 'var(--p-primary-fixed)', fg: 'var(--p-on-primary-fixed-variant)' },
  Approved: { bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  APPROVED: { bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  'Revision requested': { bg: 'var(--p-error-container)', fg: 'var(--p-on-error-container)' },
  Paid: { bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  PAID: { bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  Pending: { bg: 'var(--p-primary-fixed)', fg: 'var(--p-on-primary-fixed-variant)' },
  PENDING: { bg: 'var(--p-primary-fixed)', fg: 'var(--p-on-primary-fixed-variant)' },
  Cancelled: { bg: 'var(--p-error-container)', fg: 'var(--p-on-error-container)' },
  CANCELLED: { bg: 'var(--p-error-container)', fg: 'var(--p-on-error-container)' },
  Overdue: { bg: 'var(--p-error-container)', fg: 'var(--p-on-error-container)' },
  published: { bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  draft: { bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface-variant)' },
  archived: { bg: 'var(--p-error-container)', fg: 'var(--p-on-error-container)' },
};
