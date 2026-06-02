import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { mediaApi, subscriptionApi } from '@/lib/api';

export interface QrOrder {
  manual: boolean;
  subscriptionId: number;
  paymentId?: number;
  upiLink: string;
  qrDataUri: string;
  amount: number;
  currency?: string;
  upiConfigured?: boolean;
}

/** Shows the generated UPI QR, lets the store admin upload a screenshot / ref, then submit for approval. */
export function QrPaymentDialog({
  order,
  open,
  onOpenChange,
  onSubmitted,
}: {
  order: QrOrder | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitted?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [done, setDone] = useState(false);

  const reset = () => {
    setScreenshotUrl(null);
    setTransactionRef('');
    setDone(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await mediaApi.upload(file, 'subscription-payments');
      setScreenshotUrl(url);
      toast.success('Screenshot uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      await subscriptionApi.submitScreenshot(order.subscriptionId, {
        transactionScreenshotUrl: screenshotUrl || undefined,
        transactionRef: transactionRef || undefined,
      });
      setDone(true);
      toast.success('Submitted for approval');
      onSubmitted?.();
    } catch (err: any) {
      toast.error(err.message || 'Could not submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;
  const cur = order.currency || 'INR';

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete payment</DialogTitle>
          <DialogDescription>
            Scan the QR with any UPI app to pay {cur === 'INR' ? '₹' : ''}
            {Number(order.amount).toLocaleString('en-IN')}, then submit for approval.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Clock className="h-10 w-10 text-amber-500" />
            <p className="font-medium">Waiting for approval</p>
            <p className="text-sm text-muted-foreground">
              Your payment is submitted. The super admin will verify and activate your subscription shortly.
            </p>
            <Button className="mt-2" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {order.upiConfigured === false && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                A UPI ID has not been configured yet. Please contact support to complete payment.
              </div>
            )}
            <div className="flex flex-col items-center gap-2">
              <img
                src={order.qrDataUri}
                alt="UPI payment QR code"
                className="h-56 w-56 rounded-lg border border-border bg-white p-2"
              />
              <a
                href={order.upiLink}
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                Open in UPI app
              </a>
            </div>

            <div className="space-y-2">
              <Label>Transaction screenshot (optional)</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
                {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {screenshotUrl && !uploading && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Transaction reference / UTR (optional)</Label>
              <Input
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. 4012XXXXXX"
              />
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  I've paid — submit for approval
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
