import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const useDebounced = <T,>(value: T, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const tone = {
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  blue: 'bg-sky-100 text-sky-800 border-sky-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  gray: 'bg-slate-100 text-slate-700 border-slate-200',
  violet: 'bg-violet-100 text-violet-800 border-violet-200',
} as const;

const messageTone: Record<string, keyof typeof tone> = {
  QUEUED: 'gray',
  SENDING: 'amber',
  SENT: 'blue',
  DELIVERED: 'green',
  READ: 'violet',
  FAILED: 'red',
  SKIPPED: 'amber',
};
const templateTone: Record<string, keyof typeof tone> = {
  APPROVED: 'green',
  PENDING: 'amber',
  REJECTED: 'red',
  PAUSED: 'amber',
  DISABLED: 'red',
};
const broadcastTone: Record<string, keyof typeof tone> = {
  DRAFT: 'gray',
  SCHEDULED: 'blue',
  RUNNING: 'amber',
  PAUSED: 'amber',
  COMPLETED: 'green',
  CANCELLED: 'red',
};
const categoryTone: Record<string, keyof typeof tone> = {
  UTILITY: 'blue',
  MARKETING: 'violet',
  AUTHENTICATION: 'gray',
};

const Pill = ({ label, color }: { label: string; color: keyof typeof tone }) => (
  <Badge variant="outline" className={cn('font-medium text-xs px-2 py-0.5', tone[color])}>
    {label}
  </Badge>
);

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export const MessageStatusBadge = ({ status }: { status: string }) => (
  <Pill label={titleCase(status)} color={messageTone[status] ?? 'gray'} />
);
export const TemplateStatusBadge = ({ status }: { status: string }) => (
  <Pill label={titleCase(status)} color={templateTone[status] ?? 'gray'} />
);
export const BroadcastStatusBadge = ({ status }: { status: string }) => (
  <Pill label={titleCase(status)} color={broadcastTone[status] ?? 'gray'} />
);
export const CategoryBadge = ({ category }: { category: string }) => (
  <Pill label={titleCase(category)} color={categoryTone[category] ?? 'gray'} />
);

/** 919810167696 -> +91 98101 67696 (India grouped, others plain). */
export const formatPhone = (digits: string) => {
  if (!digits) return '';
  if (/^91\d{10}$/.test(digits)) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return /^\d+$/.test(digits) ? `+${digits}` : digits;
};

export const fmtDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

export const timeAgo = (iso?: string | null) => {
  if (!iso) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Plain-language reason for a failed or skipped message. */
export const failureHint = (code?: string | null, message?: string | null, skipReason?: string | null) => {
  if (skipReason) {
    const map: Record<string, string> = {
      NO_CONSENT: 'Customer has not opted in, or has opted out',
      INVALID_NUMBER: 'The phone number is not valid',
      TEMPLATE_NOT_APPROVED: 'Template is not approved yet',
    };
    return map[skipReason] ?? skipReason.replace(/_/g, ' ').toLowerCase();
  }
  if (code === '131042') return 'Payment method problem on the WhatsApp account';
  if (code === '131026') return 'Message could not be delivered (number may not be on WhatsApp)';
  if (code === '131049') return 'WhatsApp held this message to protect the customer experience';
  if (code === '10') return 'Permission problem with the WhatsApp account';
  return message || (code ? `Error ${code}` : '');
};

export const ErrorNote = ({ error }: { error: unknown }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
    {(error as { message?: string } | null)?.message || 'Something went wrong. Please try again.'}
  </div>
);
