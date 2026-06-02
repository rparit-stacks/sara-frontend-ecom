/** Shared formatting helpers for subscription status across store-admin and super-admin UIs. */

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'Pending approval',
  ACTIVE: 'Active',
  TRIAL_ACTIVE: 'Trial active',
  EXPIRING_SOON: 'Expiring soon',
  EXPIRED: 'Expired',
  SUSPENDED: 'Suspended',
  LIFETIME: 'Lifetime',
  REJECTED: 'Rejected',
};

export function statusVariant(status?: string): BadgeVariant {
  switch (status) {
    case 'ACTIVE':
    case 'LIFETIME':
      return 'default';
    case 'TRIAL_ACTIVE':
    case 'EXPIRING_SOON':
    case 'PENDING_APPROVAL':
      return 'secondary';
    case 'EXPIRED':
    case 'REJECTED':
    case 'SUSPENDED':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function statusLabel(status?: string): string {
  if (!status) return '—';
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export const DURATION_LABELS: Record<string, string> = {
  SIX_MONTH: '6 months',
  ONE_YEAR: '1 year',
  LIFETIME: 'Lifetime',
  CUSTOM: 'Custom',
};

export function durationLabel(d?: string): string {
  if (!d) return '—';
  return DURATION_LABELS[d] ?? d.replace(/_/g, ' ').toLowerCase();
}

export function planLabel(serviceCount?: number | null): string {
  switch (serviceCount) {
    case 2:
      return 'Starter';
    case 3:
      return 'Growth';
    case 4:
      return 'Premium';
    default:
      return serviceCount ? `${serviceCount} Services` : '—';
  }
}

export function formatDate(v: unknown): string {
  if (v == null) return '—';
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

export function formatMoney(amount: unknown, currency = 'INR'): string {
  if (amount == null) return '—';
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  if (n <= 0) return 'Free';
  return currency === 'INR' ? `₹${n.toLocaleString('en-IN')}` : `${n} ${currency}`;
}

export function formatRemaining(days: unknown, endDate: unknown): string {
  if (endDate == null) return 'Lifetime';
  if (days == null) return '—';
  const n = Number(days);
  if (!Number.isFinite(n)) return '—';
  if (n <= 0) return 'Expired';
  return `${n} day${n === 1 ? '' : 's'}`;
}

export const GATEWAY_LABELS: Record<string, string> = {
  RAZORPAY: 'Razorpay',
  STRIPE: 'Stripe',
  PAYU: 'PayU',
  PARTIAL_COD: 'Partial COD',
  COD: 'COD',
};

export function gatewayLabel(g: string): string {
  return GATEWAY_LABELS[g] ?? g;
}
