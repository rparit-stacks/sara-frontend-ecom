import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import {
  formatInr,
  getUpcomingDuePayments,
  PLATFORM_UPI_ID,
} from '@/data/platformPayments';

/** Amber bordered due banner — only when a dated DUE is within 10 days (or overdue). */
export function PlatformPaymentDueBanner() {
  const items = getUpcomingDuePayments();
  if (items.length === 0) return null;

  const total = items.reduce((s, p) => s + p.amount, 0);

  return (
    <div
      className="rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 p-4 shadow-sm"
      role="alert"
    >
      <div className="flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-amber-950 dark:text-amber-100">
            Pay due amount — {formatInr(total)}
          </p>
          <p className="text-sm text-amber-900/85 dark:text-amber-200/85 mt-0.5">
            {items.map((p) => `${p.title} (${p.periodLabel})`).join(' · ')}
          </p>
          <p className="text-sm mt-2 text-amber-950 dark:text-amber-100">
            UPI: <span className="font-mono font-semibold">{PLATFORM_UPI_ID}</span>
            {' · '}
            <Link
              to="/admin-sara/payments"
              className="underline font-medium underline-offset-2 hover:text-amber-800"
            >
              Open Payments
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
