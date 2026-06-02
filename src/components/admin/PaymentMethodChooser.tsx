import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, QrCode, Zap, FileText, BadgeCheck, Clock, CircleSlash, Check } from 'lucide-react';

/**
 * Lets the store admin choose how to pay a subscription. Shows the benefits of each method:
 * Razorpay (instant + GST invoice + registered/official payment) vs QR (free, no invoice, manual approval).
 */
export function PaymentMethodChooser({
  open,
  onOpenChange,
  basePrice,
  surcharge,
  razorpayEnabled,
  busy,
  onQr,
  onRazorpay,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  basePrice: number;
  surcharge: number;
  razorpayEnabled: boolean;
  busy?: 'qr' | 'razorpay' | null;
  onQr: () => void;
  onRazorpay: () => void;
}) {
  const razorpayTotal = Math.round(basePrice * (1 + surcharge / 100));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose how to pay</DialogTitle>
          <DialogDescription>Pick the option that suits you. Razorpay gives you an instant invoice.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Razorpay — recommended */}
          <div className={`rounded-xl border p-4 ${razorpayEnabled ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20' : 'border-border bg-muted/30 opacity-70'}`}>
            <div className="mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-rose-600" />
              <span className="font-semibold">Pay by Razorpay</span>
              <span className="ml-auto rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Recommended
              </span>
            </div>
            <ul className="mb-3 space-y-1.5 text-sm">
              <Benefit icon={FileText} good>GST invoice emailed instantly</Benefit>
              <Benefit icon={BadgeCheck} good>Official, registered payment record</Benefit>
              <Benefit icon={Zap} good>Activates immediately — no waiting</Benefit>
            </ul>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">₹{razorpayTotal.toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">includes {surcharge}% gateway fee</p>
              </div>
              {razorpayEnabled ? (
                <Button className="bg-gradient-to-tr from-rose-600 to-red-600" disabled={!!busy} onClick={onRazorpay}>
                  {busy === 'razorpay' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  Pay now
                </Button>
              ) : (
                <Button variant="outline" disabled>Not available</Button>
              )}
            </div>
          </div>

          {/* QR — free, but no invoice */}
          <div className="rounded-xl border border-border p-4">
            <div className="mb-2 flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              <span className="font-semibold">Pay by UPI QR</span>
              <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                No extra fee
              </span>
            </div>
            <ul className="mb-3 space-y-1.5 text-sm">
              <Benefit icon={Check} good>No gateway charge — pay the exact price</Benefit>
              <Benefit icon={CircleSlash}>No invoice / not a registered payment</Benefit>
              <Benefit icon={Clock}>Activates after manual approval (not instant)</Benefit>
            </ul>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">₹{basePrice.toLocaleString('en-IN')}</p>
              <Button variant="outline" disabled={!!busy} onClick={onQr}>
                {busy === 'qr' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                Pay by QR
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Benefit({ icon: Icon, good, children }: { icon: any; good?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${good ? 'text-green-600' : 'text-muted-foreground'}`} />
      <span className={good ? '' : 'text-muted-foreground'}>{children}</span>
    </li>
  );
}
