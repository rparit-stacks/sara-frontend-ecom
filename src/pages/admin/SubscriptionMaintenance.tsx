import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, ShieldCheck, CreditCard, CalendarClock, Rocket } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScrewdriverWrench, faServer, faHeadset, faRocket } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { subscriptionApi } from '@/lib/api';
import { QrPaymentDialog, QrOrder } from '@/components/admin/QrPaymentDialog';
import { PaymentMethodChooser } from '@/components/admin/PaymentMethodChooser';
import { runSubscriptionRazorpay } from '@/lib/subscriptionRazorpay';
import { cn } from '@/lib/utils';
import {
  MAINT_ANNUAL_BASE,
  MAINT_BASE_CHOICES,
  MAINT_BILLING,
  MAINT_GROUPS,
  type MaintBase,
} from '@/lib/maintenancePlan';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const SECTION_ICONS: Record<string, any> = {
  'screwdriver-wrench': faScrewdriverWrench,
  server: faServer,
  headset: faHeadset,
  rocket: faRocket,
};

const SubscriptionMaintenance = () => {
  const queryClient = useQueryClient();
  const [base, setBase] = useState<MaintBase>('ORBIT');
  const [months, setMonths] = useState(12);
  const [starting, setStarting] = useState(false);
  const [payingRzp, setPayingRzp] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [order, setOrder] = useState<QrOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => subscriptionApi.getStatus(),
  });
  const s: any = status || {};

  const razorpayEnabled: boolean = s.razorpayEnabled ?? false;
  const surcharge: number = Number(s.razorpaySurchargePercent ?? 2);

  // Live annual base per choice; fall back to the static defaults.
  const annualBase = (b: MaintBase): number =>
    Number((b === 'IGNITE' ? s.maintenanceIgniteAnnual : s.maintenanceOrbitAnnual) ?? MAINT_ANNUAL_BASE[b]);
  const monthlyBase = (b: MaintBase) => Math.round(annualBase(b) / 12);

  // Live discounts (6m / 12m); 3m is always full price.
  const discountFor = (m: number): number =>
    m === 12 ? Number(s.maintenance12mDiscountPercent ?? 10)
    : m === 6 ? Number(s.maintenance6mDiscountPercent ?? 5)
    : 0;

  const billing = MAINT_BILLING.find((b) => b.months === months) ?? MAINT_BILLING[2];
  const discountPct = discountFor(billing.months);
  const effMonthly = (b: MaintBase) => Math.round(monthlyBase(b) * (1 - discountPct / 100));
  const packTotal = (b: MaintBase) => effMonthly(b) * billing.months;

  const price = packTotal(base);

  const handleSubscribe = async () => {
    setStarting(true);
    try {
      const res = await subscriptionApi.initiateManual({
        type: 'MAINTENANCE',
        maintenanceBase: base,
        billingMonths: billing.months,
      });
      setChooserOpen(false);
      setOrder(res as QrOrder);
      setDialogOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Could not start purchase');
    } finally {
      setStarting(false);
    }
  };

  const handleRazorpay = async () => {
    setPayingRzp(true);
    await runSubscriptionRazorpay(
      { type: 'MAINTENANCE', maintenanceBase: base, billingMonths: billing.months },
      {
        onSuccess: () => {
          toast.success('Maintenance plan activated.');
          queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
          setPayingRzp(false);
          setChooserOpen(false);
        },
        onError: (m) => { toast.error(m); setPayingRzp(false); },
        onDismiss: () => setPayingRzp(false),
      },
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Maintenance Plan</h1>
          <p className="text-muted-foreground">
            Fully managed, done-for-you maintenance + multi-server hosting — with the entire{' '}
            <span className="font-semibold text-foreground">Orbit plan included</span>.
          </p>
        </div>

        {/* Headline value banner */}
        <div className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white p-5 dark:border-violet-900/40 dark:from-violet-950/20 dark:to-zinc-900 sm:flex-row sm:items-center">
          <Rocket className="h-8 w-8 shrink-0 text-violet-600" />
          <p className="text-sm text-violet-900 dark:text-violet-100">
            <span className="font-bold">Everything in 🚀 Orbit is included</span> — all 13 AI features at full Orbit
            credits, free Razorpay gateway, multi-server hosting and 24×7 monitoring. One plan, fully managed.
          </p>
        </div>

        {s.maintenanceActive && (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-950/20">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800 dark:text-green-400">Maintenance is active.</p>
          </div>
        )}

        {/* Feature base choice */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">Choose your feature base</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Either way you get <span className="font-medium text-foreground">Orbit-level value</span> — pick Ignite to
            save a little.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {MAINT_BASE_CHOICES.map((c) => {
              const sel = base === c.code;
              const saving = annualBase('ORBIT') - annualBase(c.code);
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setBase(c.code)}
                  className={cn(
                    'relative flex flex-col rounded-xl border p-4 text-left transition-all',
                    sel ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-border hover:border-rose-300',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{c.emoji} {c.label}</span>
                    <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2',
                      sel ? 'border-rose-500 bg-rose-500 text-white' : 'border-muted-foreground/30')}>
                      {sel && <Check className="h-3 w-3" />}
                    </span>
                  </div>
                  <span className="mt-1 text-xs text-muted-foreground">{c.note}</span>
                  <span className="mt-2 text-sm font-semibold">
                    {inr(annualBase(c.code))}<span className="font-normal text-muted-foreground">/year base</span>
                  </span>
                  {saving > 0 && (
                    <span className="mt-1 text-[11px] font-semibold text-emerald-600">Save {inr(saving)} / year</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Billing pack toggle */}
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            {MAINT_BILLING.map((b) => (
              <button
                key={b.months}
                type="button"
                onClick={() => setMonths(b.months)}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-semibold transition-colors',
                  months === b.months ? 'bg-rose-600 text-white shadow' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {b.label}
                {discountFor(b.months) > 0 && (
                  <span className={cn('ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    months === b.months ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700')}>
                    Save {discountFor(b.months)}%
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5 text-rose-500" />
            Price shown per month · billed as a {billing.months}-month pack · EMI available on Razorpay
          </p>
        </div>

        {/* Price summary cards (both choices, side by side) */}
        <div className="grid gap-3 sm:grid-cols-2">
          {MAINT_BASE_CHOICES.map((c) => (
            <div
              key={c.code}
              className={cn('rounded-2xl border p-5', base === c.code ? 'border-rose-500 shadow' : 'border-border')}
            >
              <p className="text-sm font-semibold">{c.emoji} {c.label} base</p>
              <p className="mt-1 text-3xl font-bold">
                {inr(effMonthly(c.code))}<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              {discountPct > 0 && <p className="text-xs text-muted-foreground line-through">{inr(monthlyBase(c.code))}/mo</p>}
              <p className="mt-1 text-xs text-muted-foreground">{inr(packTotal(c.code))} for {billing.months} months</p>
            </div>
          ))}
        </div>

        {/* What's included */}
        <div className="space-y-4">
          {MAINT_GROUPS.map((g) => (
            <div key={g.title} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <FontAwesomeIcon icon={SECTION_ICONS[g.icon] ?? faServer} className="h-4 w-4 text-rose-500" />
                {g.title}
              </h2>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {g.items.map((it) => (
                  <div key={it.label} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium">{it.label}</p>
                      {it.desc && <p className="text-xs text-muted-foreground">{it.desc}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Selected + pay */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">
                {MAINT_BASE_CHOICES.find((c) => c.code === base)?.emoji} {base === 'IGNITE' ? 'Ignite' : 'Orbit'} base · {billing.months} months
              </span>
            </p>
            <p className="text-3xl font-bold">
              {inr(effMonthly(base))}<span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-xs text-muted-foreground">{inr(price)} billed for {billing.months} months · EMI on Razorpay</p>
          </div>
          <Button
            size="lg"
            className="min-w-[200px] bg-gradient-to-tr from-rose-600 to-red-600"
            disabled={starting || payingRzp}
            onClick={() => setChooserOpen(true)}
          >
            <CreditCard className="mr-2 h-4 w-4" /> Subscribe — {inr(price)}
          </Button>
        </div>
      </div>

      <PaymentMethodChooser
        open={chooserOpen}
        onOpenChange={setChooserOpen}
        basePrice={price}
        surcharge={surcharge}
        razorpayEnabled={razorpayEnabled}
        busy={starting ? 'qr' : payingRzp ? 'razorpay' : null}
        onQr={handleSubscribe}
        onRazorpay={handleRazorpay}
      />

      <QrPaymentDialog
        order={order}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['subscription-status'] })}
      />
    </AdminLayout>
  );
};

export default SubscriptionMaintenance;
