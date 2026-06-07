import { subscriptionApi } from '@/lib/api';
import { BRAND_NAME } from '@/lib/brand';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/**
 * Initiate + open the Razorpay checkout for a subscription purchase, then verify.
 * Returns true on a verified, activated payment.
 */
export async function runSubscriptionRazorpay(
  payload: {
    type: 'PAYMENT_GATEWAY' | 'MAINTENANCE' | 'PLAN_TIER';
    duration?: string;
    selectedGateways?: string[];
    maintenancePlan?: 'STANDARD' | 'PREMIUM';
    maintenanceBase?: 'ORBIT' | 'IGNITE';
    planTier?: 'SPARK' | 'IGNITE' | 'ORBIT';
    billingMonths?: number;
  },
  opts: { onSuccess: () => void; onError: (msg: string) => void; onDismiss?: () => void },
): Promise<void> {
  const ok = await loadRazorpayScript();
  if (!ok) {
    opts.onError('Could not load the payment SDK. Check your connection.');
    return;
  }
  let order: any;
  try {
    order = await subscriptionApi.initiateRazorpay(payload);
  } catch (e: any) {
    opts.onError(e?.message || 'Could not start Razorpay payment');
    return;
  }
  if (!order?.razorpayOrderId || !order?.razorpayKeyId) {
    opts.onError('Razorpay is not configured. Please use the QR option.');
    return;
  }

  const options = {
    key: order.razorpayKeyId,
    amount: Math.round(Number(order.amount) * 100),
    currency: order.currency || 'INR',
    name: BRAND_NAME,
    description:
      payload.type === 'MAINTENANCE'
        ? 'Maintenance subscription'
        : payload.type === 'PLAN_TIER'
          ? `${payload.planTier ?? ''} plan subscription`
          : 'Payment gateway subscription',
    order_id: order.razorpayOrderId,
    handler: async (response: any) => {
      try {
        await subscriptionApi.verifyRazorpay({
          subscriptionId: order.subscriptionId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        opts.onSuccess();
      } catch (e: any) {
        opts.onError(e?.message || 'Payment verification failed');
      }
    },
    theme: { color: '#6366f1' },
    modal: { ondismiss: () => opts.onDismiss?.() },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', (resp: any) =>
    opts.onError('Payment failed: ' + (resp?.error?.description || 'Unknown error')),
  );
  rzp.open();
}
