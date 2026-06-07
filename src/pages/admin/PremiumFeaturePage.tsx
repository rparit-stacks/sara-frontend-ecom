import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { PLAN_FEATURES, PLANS, type PlanCode } from '@/lib/planFeatures';
import { FEATURE_DEMOS, GenericDemo } from '@/components/admin/featureDemos';
import { PaidPlanDialog } from '@/components/admin/PaidPlanDialog';

const planLabel: Record<PlanCode, string> = { SPARK: '🌱 Spark', IGNITE: '🔥 Ignite', ORBIT: '🚀 Orbit' };

const PremiumFeaturePage = () => {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const feature = PLAN_FEATURES.find((f) => f.key === key);

  if (!feature) {
    return (
      <AdminLayout>
        <div className="p-10 text-center text-muted-foreground">Feature not found.</div>
      </AdminLayout>
    );
  }

  const Demo = FEATURE_DEMOS[feature.key] ?? GenericDemo;
  const onLockedAction = () => setDialogOpen(true);

  // Which plans include this feature (for the "available in" line).
  const includedIn = PLANS.filter((p) => feature.values[p.code] && feature.values[p.code] !== false);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white p-5 dark:border-rose-900/40 dark:from-rose-950/20 dark:to-zinc-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{feature.label}</h1>
              <Badge className="bg-rose-600 hover:bg-rose-600"><Lock className="mr-1 h-3 w-3" />Premium</Badge>
              {feature.beta && <Badge variant="secondary">Beta soon</Badge>}
            </div>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{feature.short}</p>
          </div>
          <Button className="shrink-0 bg-gradient-to-tr from-rose-600 to-red-600" onClick={() => navigate('/admin-sara/subscriptions/plans')}>
            <Sparkles className="mr-2 h-4 w-4" /> Unlock with a plan
          </Button>
        </div>

        {/* Locked notice */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            This is a preview. The feature is locked until it’s included in your active plan. After payment, it may take
            some time to activate on your store.
          </p>
        </div>

        {/* The realistic (inert) demo */}
        <Demo onLockedAction={onLockedAction} />

        {/* How it works */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">How it works</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.how}</p>
          <ol className="mt-4 space-y-2">
            {feature.steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {includedIn.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm">
              <span className="text-muted-foreground">Available in:</span>
              {includedIn.map((p) => (
                <span key={p.code} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                  {planLabel[p.code]}
                  {typeof feature.values[p.code] === 'string' ? ` · ${feature.values[p.code]}` : ''}
                </span>
              ))}
            </div>
          )}

          <Button variant="outline" className="mt-5" onClick={() => navigate('/admin-sara/subscriptions/plans')}>
            See plans & pricing <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <PaidPlanDialog open={dialogOpen} onOpenChange={setDialogOpen} featureName={feature.label} />
    </AdminLayout>
  );
};

export default PremiumFeaturePage;
