import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, X, ShieldCheck, CreditCard, CalendarClock, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionApi } from '@/lib/api';
import { QrPaymentDialog, QrOrder } from '@/components/admin/QrPaymentDialog';
import { PaymentMethodChooser } from '@/components/admin/PaymentMethodChooser';
import { MockupHighlight } from '@/components/admin/MockupHighlight';
import { runSubscriptionRazorpay } from '@/lib/subscriptionRazorpay';
import { cn } from '@/lib/utils';

type Plan = 'STANDARD' | 'PREMIUM';

// Comparison matrix — what each plan includes (feature + optional sub-text + badge).
type Row = { feature: string; desc?: string; standard: boolean; premium: boolean; note?: string; group?: string };
const FEATURE_MATRIX: Row[] = [
  { feature: 'Bug Fixes', standard: true, premium: true },
  { feature: 'Technical Support', standard: true, premium: true },
  { feature: 'Security Updates', standard: true, premium: true },
  { feature: 'Database Maintenance', standard: true, premium: true },
  { feature: 'Backup Monitoring', standard: true, premium: true },
  { feature: 'Performance Optimization', standard: true, premium: true },
  { feature: 'VPS Renewal Included', standard: false, premium: true },
  { feature: 'Server Monitoring (24×7)', standard: false, premium: true },
  { feature: 'Priority Support', standard: false, premium: true },
  { feature: 'Emergency Fixes', standard: false, premium: true },
  { feature: 'Advanced Security', standard: false, premium: true },
  { feature: 'Monthly Health Checks', standard: false, premium: true },

  // Premium-only AI perks — the headline value.
  {
    feature: 'Razorpay payment gateway — FREE, forever',
    desc: 'No gateway subscription fee for as long as your maintenance plan is active. Accept cards, UPI, netbanking & wallets at zero extra cost.',
    standard: false, premium: true, group: 'ai',
  },
  {
    feature: 'AI product listing — 10 free every month',
    desc: 'Create up to 10 ready-to-sell products a month with the AI assistant — price, GST, variants & description done for you. Credits refresh monthly.',
    standard: false, premium: true, group: 'ai',
  },
  {
    feature: 'AI SEO optimisation — rank #1 everywhere',
    desc: 'Get found first — not just on Google, but inside ChatGPT, Gemini and other AI search/browsers. We optimise titles, descriptions & metadata so your store leads your niche and your brand value compounds over time.',
    standard: false, premium: true, group: 'ai',
  },
  {
    feature: 'AI website fault-check',
    desc: 'AI continuously scans your live store for broken pages, slow loads, checkout errors & SEO issues — and flags them before customers ever notice.',
    standard: false, premium: true, group: 'ai',
  },
  {
    feature: 'AI auto-watermark & branding',
    desc: 'The moment you upload a product image, AI automatically stamps it with your company branding/watermark — so every photo is protected and on-brand, with zero manual editing.',
    standard: false, premium: true, group: 'ai',
  },
  {
    feature: 'AI mockup generator — 10 free / month',
    desc: 'Just give a design + fabric name and get a studio-quality, on-brand product mockup in seconds. No designer, no Photoshop. 10 mockups every month.',
    standard: false, premium: true, group: 'ai',
  },
  {
    feature: 'AI social post generator',
    desc: 'Turn any product into a ready-to-post Instagram/Facebook creative — catchy caption, smart hashtags and a styled image. Market your store daily without a social media team.',
    standard: false, premium: true, group: 'ai',
  },
  {
    feature: 'AI size & fit recommender',
    desc: 'Buyers get the right size suggested from a few quick details — fewer wrong-size orders means far fewer returns and happier customers.',
    standard: false, premium: true, group: 'ai',
  },
  {
    feature: 'AI product editor',
    desc: 'Edit any product just by chatting — bulk price changes, rewrites, restyling. Early beta access included.',
    standard: false, premium: true, note: 'Beta soon', group: 'ai',
  },
  {
    feature: 'AI store themes',
    desc: 'Generate fresh, on-brand store themes with AI in seconds. Early beta access included.',
    standard: false, premium: true, note: 'Beta soon', group: 'ai',
  },
];

const SubscriptionMaintenance = () => {
  const queryClient = useQueryClient();
  const [plan, setPlan] = useState<Plan>('STANDARD');
  const [starting, setStarting] = useState(false);
  const [order, setOrder] = useState<QrOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => subscriptionApi.getStatus(),
  });

  const s: any = status || {};
  const standardPrice = Number(s.standardMaintenancePrice ?? 4999);
  const premiumPrice = Number(s.premiumMaintenancePrice ?? 9999);
  const price = plan === 'PREMIUM' ? premiumPrice : standardPrice;
  const razorpayEnabled: boolean = s.razorpayEnabled ?? false;
  const surcharge: number = Number(s.razorpaySurchargePercent ?? 2);
  const razorpayTotal = Math.round(price * (1 + surcharge / 100));
  const [payingRzp, setPayingRzp] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [mockupOpen, setMockupOpen] = useState(false);

  const handleSubscribe = async () => {
    setStarting(true);
    try {
      const res = await subscriptionApi.initiateManual({ type: 'MAINTENANCE', maintenancePlan: plan });
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
      { type: 'MAINTENANCE', maintenancePlan: plan },
      {
        onSuccess: () => {
          toast.success('Maintenance subscription activated.');
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

  const perMonth = (annual: number) => Math.round(annual / 12);

  // Small reusable column header (plan select + price + EMI).
  const PlanHead = ({ title, annual, recommended }: { title: string; annual: number; recommended?: boolean }) => {
    const k: Plan = title.includes('Premium') ? 'PREMIUM' : 'STANDARD';
    const selected = plan === k;
    return (
      <button
        type="button"
        onClick={() => setPlan(k)}
        className={cn(
          // Inner padding + top accent bar instead of a ring, so nothing clips inside the scroll container.
          'relative flex w-full flex-col items-center px-3 pb-4 pt-5 text-center transition-colors',
          selected ? 'bg-rose-50 dark:bg-rose-950/30' : 'hover:bg-muted/40',
        )}
      >
        {selected && <span className="absolute inset-x-0 top-0 h-1 bg-rose-500" />}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="font-bold">{title}</span>
          {recommended && <Badge className="bg-rose-600 text-[9px] hover:bg-rose-600">Best value</Badge>}
        </div>
        <p className="mt-1 text-xl font-bold sm:text-2xl">
          ₹{perMonth(annual).toLocaleString('en-IN')}
          <span className="text-xs font-normal text-muted-foreground">/mo</span>
        </p>
        <p className="text-[11px] text-muted-foreground">₹{annual.toLocaleString('en-IN')} / year</p>
        <span
          className={cn(
            'mt-2 inline-flex h-5 w-5 items-center justify-center rounded-full border-2',
            selected ? 'border-rose-500 bg-rose-500 text-white' : 'border-muted-foreground/30',
          )}
        >
          {selected && <Check className="h-3 w-3" />}
        </span>
      </button>
    );
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Website Maintenance</h1>
          <p className="text-muted-foreground">
            Keep your store fast, secure and always-on. Pick a plan — compare what each includes below.
          </p>
        </div>

        {/* EMI highlight banner */}
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
          <CalendarClock className="h-6 w-6 shrink-0 text-rose-600" />
          <p className="text-sm text-rose-900 dark:text-rose-100">
            <span className="font-bold">12-month EMI available</span> — pay as low as{' '}
            <span className="font-bold">₹{perMonth(standardPrice).toLocaleString('en-IN')}/month</span>. Billed annually;
            convert to no-cost / low-cost EMI at checkout with Razorpay.
          </p>
        </div>

        {/* AI Mockup generator highlight — click to see how it works */}
        <button
          type="button"
          onClick={() => setMockupOpen(true)}
          className="group flex w-full items-center gap-4 overflow-hidden rounded-xl border border-rose-300 bg-gradient-to-r from-rose-50 to-white p-4 text-left transition-all hover:shadow-md dark:border-rose-900/40 dark:from-rose-950/30 dark:to-zinc-900"
        >
          <div className="flex shrink-0 items-center gap-1.5">
            <img src="/bg_vectors/design.png" alt="" className="h-14 w-14 rounded-lg bg-white object-contain p-1 ring-1 ring-black/10" />
            <span className="text-lg font-bold text-rose-500">+</span>
            <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-rose-600 ring-1 ring-black/10">cotton</span>
            <span className="text-lg font-bold text-rose-500">=</span>
            <img src="/bg_vectors/mockup.png" alt="" className="h-14 w-14 rounded-lg bg-white object-contain p-0.5 ring-2 ring-rose-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <Wand2 className="h-4 w-4 text-rose-600" /> New: AI Mockup Generator
              <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Premium</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Design + fabric name → branded mockup in seconds. 10 free/month. <span className="font-medium text-rose-600 group-hover:underline">See how it works →</span>
            </p>
          </div>
        </button>

        {s.maintenanceActive && (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-950/20">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800 dark:text-green-400">
              Maintenance is active{s.maintenancePlan ? ` · ${s.maintenancePlan}` : ''}.
            </p>
          </div>
        )}

        {/* Comparison table — horizontally scrollable on small screens so nothing gets cut */}
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <div className="min-w-[520px]">
            {/* Header */}
            <div className="grid grid-cols-[minmax(0,1.6fr)_1fr_1fr] items-stretch border-b border-border">
              <div className="flex items-end p-4 text-sm font-semibold text-muted-foreground">Compare plans</div>
              <PlanHead title="Standard" annual={standardPrice} />
              <PlanHead title="Premium" annual={premiumPrice} recommended />
            </div>

            {FEATURE_MATRIX.map((row, i) => {
              const firstAi = row.group === 'ai' && FEATURE_MATRIX[i - 1]?.group !== 'ai';
              return (
                <div key={row.feature}>
                  {firstAi && (
                    <div className="bg-rose-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                      ✨ AI perks — free with Premium
                    </div>
                  )}
                  <div
                    className={cn(
                      'grid grid-cols-[minmax(0,1.6fr)_1fr_1fr] items-start text-sm',
                      i % 2 === 1 && 'bg-muted/30',
                    )}
                  >
                    <div className="px-4 py-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="break-words font-medium">{row.feature}</span>
                        {row.note && (
                          <span className="whitespace-nowrap rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            {row.note}
                          </span>
                        )}
                      </div>
                      {row.desc && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{row.desc}</p>}
                    </div>
                    <div className={cn('flex justify-center py-2.5', plan === 'STANDARD' && 'bg-rose-50/60 dark:bg-rose-950/20')}>
                      {row.standard ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground/40" />}
                    </div>
                    <div className={cn('flex justify-center py-2.5', plan === 'PREMIUM' && 'bg-rose-50/60 dark:bg-rose-950/20')}>
                      {row.premium ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground/40" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected + pay */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Selected: <span className="font-medium text-foreground">{plan === 'PREMIUM' ? 'Premium' : 'Standard'}</span></p>
            <p className="text-3xl font-bold">
              ₹{perMonth(price).toLocaleString('en-IN')}<span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-xs text-muted-foreground">₹{price.toLocaleString('en-IN')} billed annually · 12-month EMI</p>
          </div>
          <Button
            size="lg"
            className="min-w-[180px] bg-gradient-to-tr from-rose-600 to-red-600"
            disabled={starting || payingRzp}
            onClick={() => setChooserOpen(true)}
          >
            <CreditCard className="mr-2 h-4 w-4" /> Subscribe
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

      <MockupHighlight open={mockupOpen} onOpenChange={setMockupOpen} />
    </AdminLayout>
  );
};

export default SubscriptionMaintenance;
