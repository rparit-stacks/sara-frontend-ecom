/**
 * Customer order price ledger — same story as checkout:
 * subtotal → discounts → amount before tax → GST → shipping → total.
 * Numbers come from the order API; do not re-derive GST rates here.
 */

type OrderLike = {
  subtotal?: number | null;
  fabricDiscount?: number | null;
  couponCode?: string | null;
  couponDiscount?: number | null;
  gst?: number | null;
  shipping?: number | null;
  total?: number | null;
  paymentMethod?: string | null;
  deliveryType?: string | null;
};

type Props = {
  order: OrderLike;
  format: (amount: number) => string;
  /** Override shipping value cell (e.g. Porter / TBD copy). */
  shippingValue?: string;
  className?: string;
  compact?: boolean;
};

function num(v: number | null | undefined) {
  return v != null ? Number(v) : 0;
}

export function orderLedgerParts(order: OrderLike) {
  const subtotal = num(order.subtotal);
  const fabricDiscount = num(order.fabricDiscount);
  const couponDiscount = num(order.couponDiscount);
  const gst = num(order.gst);
  const shipping = num(order.shipping);
  const total = num(order.total);
  const taxable = Math.max(0, subtotal - fabricDiscount - couponDiscount);
  const baseWithoutCod = taxable + gst + shipping;
  const method = (order.paymentMethod || '').toUpperCase();
  const isCod = method === 'COD' || method === 'CASH_ON_DELIVERY';
  const codCharge = isCod && total > baseWithoutCod + 0.01 ? total - baseWithoutCod : 0;
  return {
    subtotal,
    fabricDiscount,
    couponDiscount,
    couponCode: order.couponCode || null,
    taxable,
    gst,
    shipping,
    codCharge,
    total,
    hasDiscounts: fabricDiscount > 0 || couponDiscount > 0,
  };
}

/** Compact meta line under an order item name (qty, GST %, GST amount). */
export function orderItemMetaLine(item: {
  quantity?: number | null;
  price?: number | null;
  unitPrice?: number | null;
  gstRate?: number | null;
  gstAmount?: number | null;
  breakdown?: {
    fabricAmount?: number | null;
    printAmount?: number | null;
    fabricName?: string | null;
  } | null;
}, format: (n: number) => string): string[] {
  const parts: string[] = [];
  const qty = item.quantity ?? 1;
  const unit = item.price ?? item.unitPrice;
  if (unit != null) parts.push(`${qty} × ${format(Number(unit))}`);
  else parts.push(`Qty ${qty}`);

  const rate = item.gstRate != null ? Number(item.gstRate) : 0;
  if (rate > 0) parts.push(`GST ${rate}%`);

  const gstAmt = item.gstAmount != null ? Number(item.gstAmount) : 0;
  if (gstAmt > 0) parts.push(`Tax ${format(gstAmt)}`);

  const b = item.breakdown;
  if (b?.fabricAmount != null && Number(b.fabricAmount) > 0) {
    parts.push(`Fabric ${format(Number(b.fabricAmount))}`);
  }
  if (b?.printAmount != null && Number(b.printAmount) > 0) {
    parts.push(`Design ${format(Number(b.printAmount))}`);
  }
  return parts;
}

export default function OrderPriceLedger({
  order,
  format,
  shippingValue,
  className = '',
  compact = false,
}: Props) {
  const p = orderLedgerParts(order);
  const shipLabel =
    shippingValue ??
    (order.deliveryType === 'PORTER'
      ? 'Porter (charges confirmed by team)'
      : p.shipping === 0
        ? 'Free'
        : format(p.shipping));

  const row = 'flex justify-between gap-3';
  const muted = compact ? 'text-xs text-muted-foreground' : 'text-sm text-muted-foreground';

  return (
    <div className={`space-y-2 ${compact ? 'text-sm' : 'text-sm'} ${className}`}>
      <div className={row}>
        <span className={muted}>Subtotal</span>
        <span>{format(p.subtotal)}</span>
      </div>

      {p.fabricDiscount > 0 && (
        <div className={`${row} text-emerald-700 dark:text-emerald-400`}>
          <span>
            Fabric quantity discount
            <span className={`block ${muted} !text-emerald-700/70 dark:!text-emerald-400/70 font-normal`}>
              Combined metres across matching fabric lines
            </span>
          </span>
          <span className="whitespace-nowrap">−{format(p.fabricDiscount)}</span>
        </div>
      )}

      {p.couponDiscount > 0 && (
        <div className={`${row} text-emerald-700 dark:text-emerald-400`}>
          <span>Coupon{p.couponCode ? ` (${p.couponCode})` : ''}</span>
          <span className="whitespace-nowrap">−{format(p.couponDiscount)}</span>
        </div>
      )}

      {p.hasDiscounts && (
        <div className={`${row} border-t border-dashed pt-2 ${muted}`}>
          <span>Amount before tax</span>
          <span>{format(p.taxable)}</span>
        </div>
      )}

      <div className={row}>
        <span>
          GST
          <span className={`block ${muted} font-normal`}>Charged at each product&apos;s own rate</span>
        </span>
        <span>{format(p.gst)}</span>
      </div>

      <div className={row}>
        <span className={muted}>Shipping</span>
        <span className="text-right">{shipLabel}</span>
      </div>

      {p.codCharge > 0 && (
        <div className={`${row} text-primary`}>
          <span>COD charge</span>
          <span>+{format(p.codCharge)}</span>
        </div>
      )}

      <div className={`${row} font-semibold ${compact ? 'text-base' : 'text-lg'} pt-2 border-t`}>
        <span>Total</span>
        <span>{format(p.total)}</span>
      </div>
    </div>
  );
}
