/**
 * Hardcoded Studio Sara ↔ development payment ledger.
 * Edit amounts / dates / UPI here — no backend yet.
 */

export const PLATFORM_UPI_ID = '9810167696@ptyes';
export const PLATFORM_UPI_PAYEE_NAME = 'Elyvate Labs';

export type PlatformPaymentStatus = 'PAID' | 'DUE';

export type PlatformPayment = {
  id: string;
  /** ISO date YYYY-MM-DD, or null when only a month is known (no due banner). */
  date: string | null;
  /** Display label when date is month-only, e.g. "Jan 2026" */
  periodLabel: string;
  amount: number;
  title: string;
  detail?: string;
  status: PlatformPaymentStatus;
  /** Optional group heading (e.g. Website Development Fee). */
  group?: string;
};

/**
 * Timeline as provided:
 * - Jan 2026 Website Development Fee ₹21,000 (5 parts)
 * - Feb WhatsApp API migrate ₹2,500
 * - May UK website ₹10,000
 * - June Manufacturing portal ₹15,000
 * - Mobile App + AI ₹80,000 total → 7 Jul ₹40k PAID (1st EMI), 7 Jan ₹40k DUE (2nd EMI)
 * - December ₹8,000 DUE (no day → no banner)
 */
export const PLATFORM_PAYMENTS: PlatformPayment[] = [
  {
    id: 'web-1',
    date: '2026-01-15',
    periodLabel: 'Jan 2026',
    amount: 1000,
    title: 'Website Development Fee',
    detail: 'Part 1 of 5',
    status: 'PAID',
    group: 'Website Development Fee (₹21,000)',
  },
  {
    id: 'web-2',
    date: '2026-01-20',
    periodLabel: 'Jan 2026',
    amount: 6000,
    title: 'Website Development Fee',
    detail: 'Part 2 of 5',
    status: 'PAID',
    group: 'Website Development Fee (₹21,000)',
  },
  {
    id: 'web-3',
    date: '2026-01-25',
    periodLabel: 'Jan 2026',
    amount: 10000,
    title: 'Website Development Fee',
    detail: 'Part 3 of 5',
    status: 'PAID',
    group: 'Website Development Fee (₹21,000)',
  },
  {
    id: 'web-4',
    date: '2026-01-28',
    periodLabel: 'Jan 2026',
    amount: 1000,
    title: 'Website Development Fee',
    detail: 'Part 4 of 5',
    status: 'PAID',
    group: 'Website Development Fee (₹21,000)',
  },
  {
    id: 'web-5',
    date: '2026-01-31',
    periodLabel: 'Jan 2026',
    amount: 6000,
    title: 'Website Development Fee',
    detail: 'Part 5 of 5',
    status: 'PAID',
    group: 'Website Development Fee (₹21,000)',
  },
  {
    id: 'wa-feb',
    date: '2026-02-15',
    periodLabel: 'Feb 2026',
    amount: 2500,
    title: 'WhatsApp API migrate to DoubleTick',
    status: 'PAID',
  },
  {
    id: 'uk-may',
    date: '2026-05-15',
    periodLabel: 'May 2026',
    amount: 10000,
    title: 'UK website build and migrate',
    detail: 'As per currency diversion',
    status: 'PAID',
  },
  {
    id: 'mfg-jun',
    date: '2026-06-15',
    periodLabel: 'June 2026',
    amount: 15000,
    title: 'Manufacturing portal',
    status: 'PAID',
  },
  {
    id: 'emi-1',
    date: '2026-07-07',
    periodLabel: '7 Jul 2026',
    amount: 40000,
    title: 'Mobile App and AI — 1st EMI',
    detail: 'Part of ₹80,000 Mobile App + AI package',
    status: 'PAID',
    group: 'Mobile App and AI (₹80,000)',
  },
  {
    id: 'dec-due',
    date: null,
    periodLabel: 'December 2026',
    amount: 8000,
    title: 'Due for payment',
    detail: 'No fixed day — banner not shown until a date is set',
    status: 'DUE',
  },
  {
    id: 'emi-2',
    date: '2027-01-07',
    periodLabel: '7 Jan 2027',
    amount: 40000,
    title: 'Mobile App and AI — 2nd EMI',
    detail: 'Part of ₹80,000 Mobile App + AI package',
    status: 'DUE',
    group: 'Mobile App and AI (₹80,000)',
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Start of local calendar day. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Due items that have a concrete date, within the next `daysBefore` days
 * (inclusive of today through due date). Past-due dated items also show.
 */
export function getUpcomingDuePayments(
  payments: PlatformPayment[] = PLATFORM_PAYMENTS,
  daysBefore = 10,
  now = new Date(),
): PlatformPayment[] {
  const today = startOfDay(now).getTime();
  const windowEnd = today + daysBefore * DAY_MS;

  return payments.filter((p) => {
    if (p.status !== 'DUE' || !p.date) return false;
    const due = startOfDay(new Date(p.date + 'T00:00:00')).getTime();
    // Show from 10 days before due, through and after due (still unpaid).
    return due <= windowEnd;
  });
}

export function sumByStatus(status: PlatformPaymentStatus): number {
  return PLATFORM_PAYMENTS.filter((p) => p.status === status).reduce((s, p) => s + p.amount, 0);
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
