import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UpiPaymentQr } from '@/components/admin/UpiPaymentQr';
import { formatInr } from '@/data/platformPayments';

/** The buy popup: just the payment QR. Nothing is checked here; the seller confirms the payment and unlocks the product. */
export const BuyQrDialog = ({
  open, onOpenChange, name, amount,
}: { open: boolean; onOpenChange: (open: boolean) => void; name: string; amount: number }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader className="items-center text-center">
        <DialogTitle className="text-2xl">Pay {formatInr(amount)}</DialogTitle>
        <DialogDescription>{name}</DialogDescription>
      </DialogHeader>
      <div className="flex justify-center py-2">
        <UpiPaymentQr amount={amount} note={`${name} - Studio Sara marketplace`} />
      </div>
    </DialogContent>
  </Dialog>
);
