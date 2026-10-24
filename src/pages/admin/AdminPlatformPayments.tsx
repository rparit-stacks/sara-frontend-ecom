import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, Copy, CreditCard, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UpiPaymentQr } from '@/components/admin/UpiPaymentQr';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PLATFORM_PAYMENTS,
  PLATFORM_UPI_ID,
  formatInr,
  getUpcomingDuePayments,
  sumByStatus,
  type PlatformPayment,
} from '@/data/platformPayments';

function DueBanner({ items }: { items: PlatformPayment[] }) {
  if (items.length === 0) return null;
  const total = items.reduce((s, p) => s + p.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 p-4 md:p-5 shadow-sm"
      role="alert"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 shrink-0 w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-amber-950 dark:text-amber-100 text-base">
              Payment due — please pay
            </p>
            <p className="text-sm text-amber-900/80 dark:text-amber-200/80 mt-0.5">
              {items.length === 1
                ? `${items[0].title} · ${formatInr(items[0].amount)} · due ${items[0].periodLabel}`
                : `${items.length} dues totaling ${formatInr(total)} are due within 10 days (or overdue).`}
            </p>
            {items.length > 1 && (
              <ul className="mt-2 text-sm text-amber-900 dark:text-amber-100 space-y-1">
                {items.map((p) => (
                  <li key={p.id}>
                    · {p.title} — {formatInr(p.amount)} ({p.periodLabel})
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm mt-3 text-amber-950 dark:text-amber-100">
              Pay via UPI:{' '}
              <span className="font-mono font-semibold">{PLATFORM_UPI_ID}</span>
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-amber-600 text-amber-900 hover:bg-amber-100 shrink-0"
          onClick={() => {
            void navigator.clipboard.writeText(PLATFORM_UPI_ID);
            toast.success('UPI ID copied');
          }}
        >
          <Copy className="w-4 h-4 mr-1.5" />
          Copy UPI
        </Button>
      </div>
    </motion.div>
  );
}

const AdminPlatformPayments = () => {
  const upcomingDue = useMemo(() => getUpcomingDuePayments(), []);
  const paidTotal = sumByStatus('PAID');
  const dueTotal = sumByStatus('DUE');

  const copyUpi = () => {
    void navigator.clipboard.writeText(PLATFORM_UPI_ID);
    toast.success('UPI ID copied');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="font-semibold text-3xl lg:text-4xl mb-1">
            Platform <span className="text-primary">Payments</span>
          </h1>
          <p className="text-muted-foreground">
            Development &amp; project payment history — paid amounts, dues, and UPI for clearance.
          </p>
        </div>

        <DueBanner items={upcomingDue} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Paid so far
              </div>
              <p className="text-2xl font-semibold tabular-nums">{formatInr(paidTotal)}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4 text-amber-600" />
                Outstanding due
              </div>
              <p className="text-2xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                {formatInr(dueTotal)}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CreditCard className="w-4 h-4" />
                UPI
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-mono text-sm font-medium break-all">{PLATFORM_UPI_ID}</p>
                <Button type="button" size="sm" variant="ghost" onClick={copyUpi}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 flex flex-col items-center gap-2 lg:min-w-[320px]">
            <p className="text-sm font-semibold self-start">Pay via UPI QR</p>
            <UpiPaymentQr
              amount={dueTotal > 0 ? dueTotal : undefined}
              note="Studio Sara platform dues"
            />
          </div>
        </div>

        <section className="rounded-xl border overflow-hidden bg-card">
          <div className="px-4 py-3 border-b bg-muted/40 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-base">Payment log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">When</th>
                  <th className="text-left p-3 font-medium">What</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {PLATFORM_PAYMENTS.map((p) => (
                  <tr key={p.id} className="border-t align-top">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {p.periodLabel}
                      {!p.date && p.status === 'DUE' && (
                        <span className="block text-[11px] text-muted-foreground/80">No fixed date</span>
                      )}
                    </td>
                    <td className="p-3">
                      <p className="font-medium">{p.title}</p>
                      {p.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5">{p.detail}</p>
                      )}
                      {p.group && (
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">{p.group}</p>
                      )}
                    </td>
                    <td className="p-3 text-right font-semibold tabular-nums whitespace-nowrap">
                      {formatInr(p.amount)}
                    </td>
                    <td className="p-3">
                      {p.status === 'PAID' ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">PAID</Badge>
                      ) : (
                        <Badge variant="destructive">DUE</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          Due banner appears only when a row has a concrete date and you are within 10 days of that date
          (or past it while still DUE). Edit amounts in{' '}
          <code className="text-[11px]">src/data/platformPayments.ts</code>.{' '}
          <Link to="/admin-sara" className="text-primary underline-offset-2 hover:underline">
            Back to Dashboard
          </Link>
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminPlatformPayments;
