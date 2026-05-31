import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CreditCard, ShieldCheck, Gift, Wrench, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { subscriptionApi } from '@/lib/api';
import { MAINTENANCE_SCOPE_SECTIONS } from '@/lib/maintenancePlanCopy';

const BRAND_NAME = 'Studio Sara';
type BillingProvider = 'RAZORPAY' | 'CASHFREE';

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    // @ts-ignore
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const loadCashfreeScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    // @ts-ignore
    if (window.Cashfree) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const AdminMaintenance = () => {
  const queryClient = useQueryClient();
  const [paying, setPaying] = useState(false);

  const {
    data: status,
    isLoading: statusLoading,
    isError: statusError,
    refetch: refetchStatus,
    isFetching: statusFetching,
  } = useQuery({
    queryKey: ['maintenance-status'],
    queryFn: () => subscriptionApi.getMaintenanceStatus(),
    retry: 1,
  });

  const { data: providers } = useQuery({
    queryKey: ['payment-providers'],
    queryFn: () => subscriptionApi.getPaymentProviders(),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['maintenance-history'],
    queryFn: () => subscriptionApi.getHistory(),
  });

  const razorpayEnabled = providers?.razorpay ?? false;
  const cashfreeEnabled = providers?.cashfree ?? false;
  const anyProviderEnabled = razorpayEnabled || cashfreeEnabled;
  const bothProviders = razorpayEnabled && cashfreeEnabled;

  const [provider, setProvider] = useState<BillingProvider>('RAZORPAY');
  useEffect(() => {
    if (cashfreeEnabled && !razorpayEnabled) setProvider('CASHFREE');
    else if (razorpayEnabled && !cashfreeEnabled) setProvider('RAZORPAY');
  }, [razorpayEnabled, cashfreeEnabled]);
  const effectiveProvider: BillingProvider = bothProviders ? provider : cashfreeEnabled ? 'CASHFREE' : 'RAZORPAY';

  const monthlyPrice = useMemo(() => {
    const n = Number(status?.monthlyPrice);
    return Number.isFinite(n) && n > 0 ? n : 2500;
  }, [status?.monthlyPrice]);

  const coverage = Boolean(status?.coverageActive);
  const complimentary = Boolean(status?.complimentaryActive);
  const paidActive = Boolean(status?.paidActive);
  const freeUntil = status?.maintenanceFreeUntil ? new Date(status.maintenanceFreeUntil) : null;
  const paidUntil = status?.paidUntil ? new Date(status.paidUntil) : null;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['maintenance-status'] });
    queryClient.invalidateQueries({ queryKey: ['maintenance-history'] });
  };

  const runCashfreeCheckout = async (order: any) => {
    const ok = await loadCashfreeScript();
    if (!ok) {
      toast.error('Could not load the payment SDK. Check your connection.');
      setPaying(false);
      return;
    }
    if (!order.cashfreePaymentSessionId || !order.cashfreeOrderId) {
      toast.error('Could not start payment. Please try again or contact support.');
      setPaying(false);
      return;
    }
    try {
      // @ts-ignore
      const cashfree = window.Cashfree({ mode: order.cashfreeEnv === 'SANDBOX' ? 'sandbox' : 'production' });
      const result = await cashfree.checkout({
        paymentSessionId: order.cashfreePaymentSessionId,
        redirectTarget: '_modal',
      });
      if (result?.error) {
        toast.info('Payment cancelled');
        setPaying(false);
        return;
      }
      await subscriptionApi.verify({
        subscriptionId: order.subscriptionId,
        paymentProvider: 'CASHFREE',
        cashfreeOrderId: order.cashfreeOrderId,
      });
      toast.success('Maintenance subscription activated.');
      invalidateAll();
    } catch (err: any) {
      toast.error(err.message || 'Payment verification failed');
    } finally {
      setPaying(false);
    }
  };

  const handleSubscribe = async () => {
    if (paidActive) {
      toast.error('Paid maintenance is already active.');
      return;
    }
    if (!anyProviderEnabled) {
      toast.error('No payment method is enabled. Please contact support.');
      return;
    }
    setPaying(true);
    try {
      const isFree = monthlyPrice <= 0;
      if (!isFree && effectiveProvider === 'RAZORPAY') {
        const ok = await loadRazorpayScript();
        if (!ok) {
          toast.error('Could not load the payment SDK. Check your connection.');
          setPaying(false);
          return;
        }
      }

      const order = await subscriptionApi.initiateMaintenance(effectiveProvider);

      if (order.free === true) {
        toast.success('Maintenance plan activated.');
        invalidateAll();
        setPaying(false);
        return;
      }

      if (effectiveProvider === 'CASHFREE') {
        await runCashfreeCheckout(order);
        return;
      }

      if (!order.razorpayOrderId || !order.razorpayKeyId) {
        toast.error('Could not start payment. Please try again or contact support.');
        setPaying(false);
        return;
      }
      const options = {
        key: order.razorpayKeyId,
        amount: Math.round(Number(order.amount) * 100),
        currency: order.currency || 'INR',
        name: BRAND_NAME,
        description: `Website maintenance · monthly · ${BRAND_NAME}`,
        order_id: order.razorpayOrderId,
        handler: async (response: any) => {
          try {
            await subscriptionApi.verify({
              subscriptionId: order.subscriptionId,
              paymentProvider: 'RAZORPAY',
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Maintenance subscription activated.');
            invalidateAll();
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed');
          } finally {
            setPaying(false);
          }
        },
        theme: { color: '#111827' },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast.info('Payment cancelled');
          },
        },
      };
      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        toast.error('Payment failed: ' + (resp.error?.description || 'Unknown error'));
        setPaying(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start maintenance payment');
      setPaying(false);
    }
  };

  if (statusLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">{status?.productTitle || 'Website maintenance'}</h1>
          </div>
          <p className="mt-1 text-muted-foreground">Monthly maintenance for your live {BRAND_NAME} store.</p>
        </motion.div>

        {statusError && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Couldn't reach the billing service</p>
              <p>Showing the last-known status. Some actions may be unavailable until it reconnects.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchStatus()} disabled={statusFetching}>
              {statusFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Retry
            </Button>
          </div>
        )}

        {status?.stale && !statusError && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            Showing cached status (billing service was briefly unreachable). It refreshes automatically.
          </div>
        )}

        {coverage ? (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div className="text-sm text-green-800">
              <p className="font-medium">Maintenance coverage is active</p>
              {complimentary && freeUntil && (
                <p className="mt-1">
                  Complimentary maintenance runs until <span className="font-medium">{freeUntil.toLocaleString()}</span>
                  {paidActive ? '.' : ' After that, subscribe below to continue with the paid plan.'}
                </p>
              )}
              {paidActive && paidUntil && (
                <p className="mt-1">
                  Paid maintenance is valid until <span className="font-medium">{paidUntil.toLocaleString()}</span>. Renew
                  before it ends.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            There is no active maintenance coverage right now. Subscribe below to start the paid monthly plan.
          </div>
        )}

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-lg font-semibold">What is included</h2>
            <p className="text-xs text-muted-foreground">Scope for this maintenance plan.</p>
          </div>
          <div className="max-h-[min(60vh,520px)] space-y-5 overflow-y-auto p-4 text-sm">
            {MAINTENANCE_SCOPE_SECTIONS.map((section) => (
              <div key={section.heading}>
                <p className="mb-2 font-semibold text-foreground">{section.heading}</p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        {bothProviders && monthlyPrice > 0 && !paidActive && (
          <Card className="p-6">
            <h2 className="mb-1 text-xl font-semibold">Pay using</h2>
            <p className="mb-4 text-sm text-muted-foreground">Choose how you want to complete this payment.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { key: 'RAZORPAY' as const, label: 'Razorpay', note: 'Cards, UPI, netbanking, wallets' },
                { key: 'CASHFREE' as const, label: 'Cashfree', note: 'Cards, UPI, netbanking' },
              ]).map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setProvider(o.key)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    provider === o.key
                      ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{o.label}</span>
                    {provider === o.key && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{o.note}</p>
                </button>
              ))}
            </div>
          </Card>
        )}

        {!anyProviderEnabled && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            No payment method is enabled right now. Please contact support.
          </div>
        )}

        <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Monthly plan</p>
            <p className="text-3xl font-bold">
              {monthlyPrice <= 0 ? 'Free' : `₹${monthlyPrice.toLocaleString('en-IN')}`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Billed monthly. One active plan at a time.</p>
          </div>
          <Button
            size="lg"
            disabled={paying || paidActive || !anyProviderEnabled}
            onClick={handleSubscribe}
            className="min-w-[200px]"
          >
            {paying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : paidActive ? (
              'Already active'
            ) : monthlyPrice <= 0 ? (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Activate free
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Subscribe &amp; pay
              </>
            )}
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 text-lg font-semibold">History</h2>
          {!history || history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No maintenance subscriptions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Line</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Created</th>
                    <th className="pb-2 font-medium">Ends</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history
                    .filter((s: any) => (s.productLine || 'PAYMENT') === 'MAINTENANCE')
                    .map((s: any) => (
                      <tr key={s.id}>
                        <td className="py-2 text-muted-foreground">{s.productLine || '—'}</td>
                        <td className="py-2">{s.amount != null ? `₹${Number(s.amount).toLocaleString('en-IN')}` : '—'}</td>
                        <td className="py-2">{s.status}</td>
                        <td className="py-2 text-muted-foreground">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMaintenance;
