import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, X, Info, CalendarClock, Sparkles, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionApi } from '@/lib/api';
import { runSubscriptionRazorpay } from '@/lib/subscriptionRazorpay';
import {
  PLANS,
  PLAN_FEATURES,
  BILLING_OPTIONS,
  type Plan,
  type PlanCode,
  type PlanFeature,
} from '@/lib/planFeatures';
import { FeatureInfoDialog } from '@/components/admin/FeatureInfoDialog';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const SubscriptionPlans = () => {
  const queryClient = useQueryClient();
  const [billingMonths, setBillingMonths] = useState(6);
  const [selected, setSelected] = useState<PlanCode>('ORBIT');
  const [infoFeature, setInfoFeature] = useState<PlanFeature | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const { data: status } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => subscriptionApi.getStatus(),
  });
  const s: any = status || {};

  // Live per-month prices from the server (super-admin can edit); fall back to defaults.
  const monthlyOf = (p: Plan): number => {
    const live =
      p.code === 'SPARK' ? s.sparkMonthlyPrice
      : p.code === 'IGNITE' ? s.igniteMonthlyPrice
      : s.orbitMonthlyPrice;
    return Number(live ?? p.pricePerMonth);
  };

  // Server-driven 12-month discount; 6-month is always full price.
  const liveAnnualDiscount = Number(s.planAnnualDiscountPercent ?? 10);

  const billing = BILLING_OPTIONS.find((b) => b.months === billingMonths) ?? BILLING_OPTIONS[0];
  const discountPct = billing.months === 12 ? liveAnnualDiscount : 0;

  // Effective per-month price after the billing-pack discount.
  const effMonthly = (p: Plan) => Math.round(monthlyOf(p) * (1 - discountPct / 100));
  const packTotal = (p: Plan) => effMonthly(p) * billing.months;

  const selectedPlan = useMemo(() => PLANS.find((p) => p.code === selected)!, [selected]);

  const openInfo = (f: PlanFeature) => {
    setInfoFeature(f);
    setInfoOpen(true);
  };

  // Render a single cell value (boolean | string label | false).
  const renderValue = (v: boolean | string) => {
    if (v === true) return <Check className="mx-auto h-4 w-4 text-emerald-600" />;
    if (v === false) return <X className="mx-auto h-4 w-4 text-muted-foreground/40" />;
    return <span className="text-xs font-semibold text-foreground">{v}</span>;
  };

  const handleSubscribe = async () => {
    setPaying(true);
    await runSubscriptionRazorpay(
      { type: 'PLAN_TIER', planTier: selectedPlan.code, billingMonths: billing.months },
      {
        onSuccess: () => {
          toast.success(`${selectedPlan.emoji} ${selectedPlan.name} plan activated.`);
          queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
          setPaying(false);
        },
        onError: (m) => {
          toast.error(m);
          setPaying(false);
        },
        onDismiss: () => setPaying(false),
      },
    );
  };

  const active = s.planActive;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Choose Your Plan</h1>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Unlock the full Studio Sara AI engine. Pick a plan, tap any{' '}
            <Info className="inline h-4 w-4 align-text-bottom text-rose-500" /> to see exactly how a feature works.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            {BILLING_OPTIONS.map((b) => (
              <button
                key={b.months}
                type="button"
                onClick={() => setBillingMonths(b.months)}
                className={cn(
                  'relative rounded-full px-5 py-2 text-sm font-semibold transition-colors',
                  billingMonths === b.months ? 'bg-rose-600 text-white shadow' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {b.label}
                {b.months === 12 && liveAnnualDiscount > 0 && (
                  <span
                    className={cn(
                      'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      billingMonths === b.months ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700',
                    )}
                  >
                    Save {liveAnnualDiscount}%
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5 text-rose-500" />
            Price shown per month · billed as a {billing.months}-month pack · convert to EMI at checkout with Razorpay
          </p>
        </div>

        {active && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-400">
            <Check className="h-4 w-4" /> A subscription is currently active.
          </div>
        )}

        {/* Plan headers */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLANS.map((p) => {
            const isSel = selected === p.code;
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => setSelected(p.code)}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-5 text-left transition-all',
                  isSel ? 'border-rose-500 shadow-lg ring-2 ring-rose-500/30' : 'border-border hover:border-rose-300 hover:shadow',
                )}
              >
                {p.recommended && (
                  <Badge className="absolute -top-2.5 right-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-600">
                    ⭐ Best value
                  </Badge>
                )}
                <div className={cn('inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-tr px-3 py-1.5 text-white', p.accent)}>
                  <span className="text-lg">{p.emoji}</span>
                  <span className="font-bold">{p.name}</span>
                </div>
                <p className="mt-3 text-3xl font-bold">
                  {inr(effMonthly(p))}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                {discountPct > 0 && (
                  <p className="text-xs text-muted-foreground line-through">{inr(monthlyOf(p))}/mo</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {inr(packTotal(p))} billed for {billing.months} months
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
                <span
                  className={cn(
                    'mt-3 inline-flex h-5 w-5 items-center justify-center rounded-full border-2',
                    isSel ? 'border-rose-500 bg-rose-500 text-white' : 'border-muted-foreground/30',
                  )}
                >
                  {isSel && <Check className="h-3 w-3" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <div className="min-w-[640px]">
            {/* sticky-ish header */}
            <div className="grid grid-cols-[minmax(0,1.8fr)_1fr_1fr_1fr] items-center border-b border-border bg-muted/40">
              <div className="px-4 py-3 text-sm font-semibold text-muted-foreground">
                <Sparkles className="mr-1.5 inline h-4 w-4 text-rose-500" /> Features
              </div>
              {PLANS.map((p) => (
                <div
                  key={p.code}
                  className={cn(
                    'py-3 text-center text-sm font-bold',
                    selected === p.code && 'bg-rose-50 dark:bg-rose-950/20',
                  )}
                >
                  {p.emoji} {p.name}
                </div>
              ))}
            </div>

            {PLAN_FEATURES.map((f, i) => (
              <div
                key={f.key}
                className={cn(
                  'grid grid-cols-[minmax(0,1.8fr)_1fr_1fr_1fr] items-center text-sm',
                  i % 2 === 1 && 'bg-muted/30',
                )}
              >
                <div className="flex items-center gap-2 px-4 py-3">
                  <span className="break-words font-medium">{f.label}</span>
                  {f.beta && (
                    <span className="whitespace-nowrap rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                      Beta soon
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`How ${f.label} works`}
                    onClick={() => openInfo(f)}
                    className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/40"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
                {PLANS.map((p) => (
                  <div
                    key={p.code}
                    className={cn('py-3 text-center', selected === p.code && 'bg-rose-50/60 dark:bg-rose-950/20')}
                  >
                    {renderValue(f.values[p.code])}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Selected + subscribe */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{selectedPlan.emoji} {selectedPlan.name}</span>
            </p>
            <p className="text-3xl font-bold">
              {inr(effMonthly(selectedPlan))}<span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {inr(packTotal(selectedPlan))} billed for {billing.months} months · EMI available on Razorpay
            </p>
          </div>
          <Button
            size="lg"
            className="min-w-[200px] bg-gradient-to-tr from-rose-600 to-red-600"
            disabled={paying}
            onClick={handleSubscribe}
          >
            {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Subscribe — {inr(packTotal(selectedPlan))}
          </Button>
        </div>
      </div>

      <FeatureInfoDialog feature={infoFeature} open={infoOpen} onOpenChange={setInfoOpen} />
    </AdminLayout>
  );
};

export default SubscriptionPlans;
