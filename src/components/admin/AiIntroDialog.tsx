import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles,
  faBolt,
  faComments,
  faImages,
  faReceipt,
  faLanguage,
  faCheck,
  faCoins,
  faClock,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { aiProductApi, subscriptionApi } from '@/lib/api';
import { PaymentMethodChooser } from '@/components/admin/PaymentMethodChooser';
import { QrPaymentDialog, QrOrder } from '@/components/admin/QrPaymentDialog';
import { runSubscriptionRazorpay } from '@/lib/subscriptionRazorpay';

// Honest, but enthusiastically framed — every claim maps to something the AI actually does.
const PERKS = [
  { icon: faComments, title: 'Just chat — it builds the product', text: 'Describe it in plain English; the assistant asks a few quick questions and fills the rest.' },
  { icon: faImages, title: 'Upload photos, done', text: 'Drop your product images in the chat — they’re attached automatically.' },
  { icon: faReceipt, title: 'Smart HSN & GST', text: 'Suggests the right HSN code and sets the matching GST for you.' },
  { icon: faBolt, title: 'Variants & details, auto-drafted', text: 'Sizes, colors with prices, a clean description and detail sections — all drafted for you to confirm.' },
  { icon: faLanguage, title: 'You stay in control', text: 'Nothing goes live until you review the preview and hit Create.' },
];

export function AiIntroDialog({
  open,
  onOpenChange,
  onStart,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStart: () => void; // open the chat (called when credits available)
}) {
  const queryClient = useQueryClient();
  const { data: status, isLoading } = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => aiProductApi.status(),
    enabled: open,
  });

  const credits = Number((status as any)?.credits ?? 0);
  const plans: any[] = (status as any)?.plans ?? [];

  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [busy, setBusy] = useState<'qr' | 'razorpay' | null>(null);
  const [qrOrder, setQrOrder] = useState<QrOrder | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  // fetch razorpay availability via subscription status (reuse)
  const { data: subStatus } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => subscriptionApi.getStatus(),
    enabled: open,
  });
  const razorpayEnabled = (subStatus as any)?.razorpayEnabled ?? false;
  const surcharge = Number((subStatus as any)?.razorpaySurchargePercent ?? 2);

  const openBuy = (plan: any) => {
    setSelectedPlan(plan);
    setChooserOpen(true);
  };

  const buyQr = async () => {
    if (!selectedPlan) return;
    setBusy('qr');
    try {
      const res = await subscriptionApi.initiateManual({
        type: 'AI_CREDITS',
        aiCreditPlanId: selectedPlan.id,
      });
      setChooserOpen(false);
      setQrOrder(res as QrOrder);
      setQrOpen(true);
    } catch (e: any) {
      toast.error(e?.message || 'Could not start purchase');
    } finally {
      setBusy(null);
    }
  };

  const buyRazorpay = async () => {
    if (!selectedPlan) return;
    setBusy('razorpay');
    await runSubscriptionRazorpay(
      { type: 'AI_CREDITS', aiCreditPlanId: selectedPlan.id } as any,
      {
        onSuccess: () => {
          toast.success('Payment received! Credits will be added after super-admin approval.');
          setBusy(null);
          setChooserOpen(false);
          queryClient.invalidateQueries({ queryKey: ['ai-status'] });
        },
        onError: (m) => { toast.error(m); setBusy(null); },
        onDismiss: () => setBusy(null),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-3xl gap-0 overflow-hidden rounded-[28px] border-0 p-0 shadow-2xl [&>button]:hidden">
        {/* Custom close — sits above the z-10 content so it's always clickable */}
        <button
          type="button"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-zinc-600 shadow-md ring-1 ring-black/5 backdrop-blur transition hover:bg-white hover:text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-300"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </button>
        <div className="relative bg-gradient-to-b from-slate-50 via-white to-rose-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-red-950/40">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-rose-300/20 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-rose-300/20 blur-3xl" />
          </div>

          <div className="relative z-10 max-h-[82vh] overflow-y-auto px-6 py-8 sm:px-10">
            {/* Hero */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30"
              >
                <FontAwesomeIcon icon={faWandMagicSparkles} className="h-7 w-7" />
              </motion.div>
              <h2 className="text-3xl font-bold tracking-tight">Create products with AI</h2>
              <p className="mx-auto mt-2 max-w-lg text-[15px] text-muted-foreground">
                Turn a few sentences into a ready-to-publish product. Faster than the form, and it handles the boring
                parts — HSN, GST, variants and a polished description.
              </p>
              {credits > 0 && (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                  <FontAwesomeIcon icon={faCoins} className="h-3.5 w-3.5" /> {credits} credits left
                </span>
              )}
            </div>

            {/* Perks */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {PERKS.map((p) => (
                <div key={p.title} className="flex gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-black/[0.05] backdrop-blur dark:bg-white/5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950">
                    <FontAwesomeIcon icon={p.icon} className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* If has credits: start. Else: plans */}
            {credits > 0 ? (
              <div className="mt-7 flex justify-center">
                <Button
                  size="lg"
                  className="gap-2 rounded-full bg-gradient-to-tr from-rose-600 to-red-600 px-8"
                  onClick={() => { onOpenChange(false); onStart(); }}
                >
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="h-4 w-4" /> Start creating
                </Button>
              </div>
            ) : (
              <div className="mt-7">
                <div className="mb-3 text-center">
                  <h3 className="text-lg font-bold">Pick a credit pack</h3>
                  <p className="text-sm text-muted-foreground">1 credit = 1 product. Buy once, use anytime.</p>
                </div>
                {isLoading ? (
                  <p className="text-center text-sm text-muted-foreground">Loading plans…</p>
                ) : plans.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">No plans available right now. Please contact support.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {plans.map((plan, i) => (
                      <div
                        key={plan.id}
                        className={`relative flex flex-col rounded-2xl border p-5 ${
                          i === 1 ? 'border-rose-400 bg-rose-50/50 shadow-md dark:bg-rose-950/20' : 'border-border bg-white/70 dark:bg-white/5'
                        }`}
                      >
                        {i === 1 && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Popular
                          </span>
                        )}
                        <p className="text-sm font-semibold text-muted-foreground">{plan.label}</p>
                        <p className="mt-1 text-3xl font-bold">{plan.credits}</p>
                        <p className="text-xs text-muted-foreground">products</p>
                        <div className="mt-3">
                          <p className="text-xl font-bold">₹{Number(plan.totalPrice).toLocaleString('en-IN')}</p>
                          <p className="text-xs text-muted-foreground">₹{Number(plan.pricePerProduct)}/product</p>
                        </div>
                        <Button
                          className={`mt-4 w-full rounded-full ${i === 1 ? 'bg-gradient-to-tr from-rose-600 to-red-600' : ''}`}
                          variant={i === 1 ? 'default' : 'outline'}
                          onClick={() => openBuy(plan)}
                        >
                          Buy
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                  <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
                  After payment, the super admin approves it and your credits are added.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Buy: method chooser */}
      {selectedPlan && (
        <PaymentMethodChooser
          open={chooserOpen}
          onOpenChange={setChooserOpen}
          basePrice={Number(selectedPlan.totalPrice)}
          surcharge={surcharge}
          razorpayEnabled={razorpayEnabled}
          busy={busy}
          onQr={buyQr}
          onRazorpay={buyRazorpay}
        />
      )}

      {/* QR pay dialog (then super-admin approval) */}
      <QrPaymentDialog
        order={qrOrder}
        open={qrOpen}
        onOpenChange={setQrOpen}
        onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['ai-status'] })}
      />
    </Dialog>
  );
}
