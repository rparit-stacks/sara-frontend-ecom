import { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleInfo,
  faCheck,
  faWandMagicSparkles,
  faShieldHalved,
  faServer,
  faHeadset,
  faWrench,
  faCoins,
} from '@fortawesome/free-solid-svg-icons';
import {
  Wrench,
  Bug,
  Shield,
  ShieldCheck,
  Database,
  Gauge,
  Save,
  Server,
  HardDrive,
  Activity,
  Scaling,
  Lock,
  Globe,
  Headset,
  Siren,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import { FeatureInfoDialog } from '@/components/admin/FeatureInfoDialog';
import { MaintenanceInfoDialog } from '@/components/admin/MaintenanceInfoDialog';
import MaintenanceStatusBanner from '@/components/admin/MaintenanceStatusBanner';
import {
  BILLING_OPTIONS,
  AI_FEATURES,
  MAINTENANCE_GROUPS,
  type BillingOption,
  type MaintFeature,
  type AiFeature,
} from './maintenanceData';

const LUCIDE: Record<string, LucideIcon> = {
  wrench: Wrench,
  bug: Bug,
  shield: Shield,
  'shield-check': ShieldCheck,
  database: Database,
  gauge: Gauge,
  save: Save,
  server: Server,
  'hard-drive': HardDrive,
  activity: Activity,
  scaling: Scaling,
  lock: Lock,
  globe: Globe,
  headset: Headset,
  siren: Siren,
  'clipboard-list': ClipboardList,
};

const GROUP_ICONS: Record<string, typeof faWrench> = {
  wrench: faWrench,
  server: faServer,
  headset: faHeadset,
};

const inr = (n: number) => '₹' + n.toLocaleString('en-IN');

// Elyvate Labs payment page — receives amount + plan + description.
const ELYVATE_PAY_URL = 'https://www.elyvatelabs.in/pay';

export default function MaintenancePlan() {
  const [billing, setBilling] = useState<BillingOption>(BILLING_OPTIONS[1]); // default 12-month
  const [aiInfo, setAiInfo] = useState<AiFeature | null>(null);
  const [maintInfo, setMaintInfo] = useState<MaintFeature | null>(null);

  const payNow = () => {
    const plan = `Studio Sara — Website Maintenance (${billing.label})`;
    const desc = `Done-for-you website upkeep. Billed monthly: ₹${billing.perMonth.toLocaleString('en-IN')}/month × ${billing.months} months (not paid upfront).`;
    const url = `${ELYVATE_PAY_URL}?amount=${billing.total}&plan=${encodeURIComponent(plan)}&desc=${encodeURIComponent(desc)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl">
        {/* Live "free maintenance" status + countdown + activity log */}
        <MaintenanceStatusBanner />
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 p-7 text-white shadow-xl sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur"
            >
              <FontAwesomeIcon icon={faShieldHalved} className="h-3.5 w-3.5" /> Fully managed
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl"
            >
              Website Maintenance Plan
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base"
            >
              One done-for-you plan that keeps your store fast, secure and online. You build the brand; we handle
              the engine behind it.
            </motion.p>
          </div>
        </section>

        {/* Billing + price */}
        <section className="mt-8">
          {/* Big, unmissable monthly-billing disclaimer */}
          <div className="mb-5 flex items-start gap-3 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 dark:border-amber-500/60 dark:bg-amber-950/30 sm:p-5">
            <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-base font-extrabold uppercase tracking-wide text-amber-900 dark:text-amber-200 sm:text-lg">
              This is NOT a one-time payment. You will be billed EVERY MONTH for the plan you choose — not the full amount upfront.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {BILLING_OPTIONS.map((opt) => {
              const active = billing.key === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setBilling(opt)}
                  className={`relative rounded-2xl border-2 p-6 text-left transition-all ${
                    active
                      ? 'border-rose-500 bg-rose-50 shadow-md dark:bg-rose-950/20'
                      : 'border-border bg-card hover:border-rose-300'
                  }`}
                >
                  {opt.badge && (
                    <span className="absolute -top-3 right-5 rounded-full bg-rose-600 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                      {opt.badge}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{opt.label}</span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        active ? 'border-rose-500 bg-rose-500 text-white' : 'border-muted-foreground/40'
                      }`}
                    >
                      {active && <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-4xl font-extrabold">{inr(opt.perMonth)}</span>
                    <span className="pb-1 text-sm text-muted-foreground">/ month</span>
                  </div>
                  <p className="mt-1 text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Paid monthly — {opt.months} separate payments of {inr(opt.perMonth)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    ({inr(opt.total)} total over {opt.months} months, NOT paid upfront)
                  </p>
                </button>
              );
            })}
          </div>

          {/* Pay CTA */}
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Selected plan · {billing.label}</p>
              <p className="text-2xl font-extrabold">
                {inr(billing.perMonth)}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Billed every month — {billing.months} payments of {inr(billing.perMonth)} each, not {inr(billing.total)} at once
              </p>
            </div>
            <button
              type="button"
              onClick={payNow}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 px-8 py-4 font-bold text-white transition-all hover:scale-[0.98] sm:w-auto"
            >
              <FontAwesomeIcon icon={faCheck} className="h-4 w-4" /> Pay Now
            </button>
          </div>
        </section>

        {/* Maintenance features */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold">What&apos;s included</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the <FontAwesomeIcon icon={faCircleInfo} className="mx-0.5 text-rose-500" /> on any feature to see how it
            works.
          </p>

          <div className="mt-6 space-y-8">
            {MAINTENANCE_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950">
                    <FontAwesomeIcon icon={GROUP_ICONS[group.icon] ?? faWrench} className="h-4 w-4" />
                  </span>
                  <h3 className="text-lg font-bold">{group.title}</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((f, i) => {
                    const Icon = LUCIDE[f.icon] ?? Wrench;
                    return (
                      <motion.div
                        key={f.key}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.03 }}
                        className="group relative flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-rose-300 hover:shadow-md"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold leading-tight">{f.title}</h4>
                            <button
                              type="button"
                              aria-label={`How ${f.title} works`}
                              onClick={() => setMaintInfo(f)}
                              className="shrink-0 text-muted-foreground/60 transition-colors hover:text-rose-500"
                            >
                              <FontAwesomeIcon icon={faCircleInfo} className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{f.short}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI features — shown grayscale/locked: not included in this plan, must be added separately */}
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-gray-500 dark:bg-gray-800">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">AI features (not included)</h3>
                <p className="text-xs text-muted-foreground">Preview of what's available — not part of this maintenance plan.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-gray-100 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900">
              <FontAwesomeIcon icon={faHeadset} className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                Want AI features added? <span className="underline">Call admin dev</span> to enable them.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 grayscale opacity-70">
            {AI_FEATURES.map((f, i) => (
              <motion.div
                key={f.key}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="group relative flex flex-col rounded-2xl border border-border bg-card p-4 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold leading-tight">
                    {f.label}
                    {f.beta && (
                      <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600">
                        Beta soon
                      </span>
                    )}
                  </h4>
                  <button
                    type="button"
                    aria-label={`How ${f.label} works`}
                    onClick={() => setAiInfo(f)}
                    className="shrink-0 text-muted-foreground/60 transition-colors hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={faCircleInfo} className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 flex-1 text-xs text-muted-foreground">{f.short}</p>
                <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {f.value === '20/mo' && <FontAwesomeIcon icon={faCoins} className="h-3 w-3" />}
                  {f.value}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Trust line */}
        <section className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            'Razorpay gateway — free while maintenance is active',
            'Free minor feature additions as we ship them',
            'Everything in Orbit — included',
          ].map((t) => (
            <div key={t} className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              <FontAwesomeIcon icon={faCheck} className="h-4 w-4 shrink-0" />
              {t}
            </div>
          ))}
        </section>
      </div>

      {/* Info popups */}
      <FeatureInfoDialog feature={aiInfo} open={aiInfo !== null} onOpenChange={(v) => !v && setAiInfo(null)} />
      <MaintenanceInfoDialog feature={maintInfo} open={maintInfo !== null} onOpenChange={(v) => !v && setMaintInfo(null)} />
    </AdminLayout>
  );
}
