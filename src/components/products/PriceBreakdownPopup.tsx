import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calculator, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrice } from '@/lib/currency';

/**
 * Server-computed price explanation for a cart / preview line.
 * Frontend must render these values as-is — never re-derive, re-sum, or re-order money.
 */
export type ServerBreakdown = {
  productName?: string | null;
  productType?: string | null;
  unitLabel?: string | null;
  quantity?: number | null;
  fabricName?: string | null;
  fabricBasePerUnit?: number | null;
  fabricPerUnit?: number | null;
  fabricAmount?: number | null;
  printBasePerUnit?: number | null;
  printPerUnit?: number | null;
  printAmount?: number | null;
  variants?: Array<{
    name?: string | null;
    value?: string | null;
    pricePerUnit?: number | null;
    amount?: number | null;
    appliesTo?: string | null;
  }> | null;
  discounts?: Array<{
    type?: string | null;
    label?: string | null;
    pricePerUnit?: number | null;
    amount?: number | null;
  }> | null;
  variantsPerUnit?: number | null;
  discountPerUnit?: number | null;
  unitPrice?: number | null;
  subtotal?: number | null;
  gstRate?: number | null;
  gstAmount?: number | null;
  total?: number | null;
};

interface PriceBreakdownPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Product title fallback while breakdown is loading. */
  productName?: string;
  /** Server JSON only — no client-side price maths. */
  breakdown?: ServerBreakdown | null;
  /** True while waiting for /api/cart/pricing-preview or cart fetch. */
  loading?: boolean;
  /** Optional error message when preview failed. */
  error?: string | null;
  /**
   * Optional money formatter (e.g. order pages that use order exchange rate).
   * Defaults to live currency context via usePrice().
   */
  formatMoney?: (amount: number) => string;
}

type DesignedLedgerRow =
  | { kind: 'section'; title: string }
  | { kind: 'pair'; label: string; value: string; indent?: boolean; tone?: 'muted' | 'primary' | 'success' | 'semibold' }
  | { kind: 'rule' }
  | { kind: 'grand'; label: string; value: string };

const MONEY_EPS = 0.02;
function approxEq(a: number, b: number): boolean {
  return Math.abs(a - b) <= MONEY_EPS;
}

/**
 * Pure formatting of the server breakdown.
 * Order: catalogue base → variants → before discount → discount → charged rate.
 */
function buildServerLedgerRows(
  b: ServerBreakdown,
  format: (n: number) => string
): DesignedLedgerRow[] {
  const rows: DesignedLedgerRow[] = [];
  const unit = b.unitLabel || 'm';
  const qty = Number(b.quantity ?? 1);
  const num = (v: number | null | undefined) => Number(v ?? 0);
  const per = (v: number | null | undefined) => `${format(num(v))} / ${unit}`;

  const variants = b.variants ?? [];
  const fabricVariants = variants.filter((v) => (v.appliesTo || '').toUpperCase() === 'FABRIC');
  const printVariants = variants.filter((v) => (v.appliesTo || '').toUpperCase() !== 'FABRIC');
  const discounts = b.discounts ?? [];
  const signed = (v: number | null | undefined) => {
    const n = num(v);
    return `${n < 0 ? '−' : '+'}${format(Math.abs(n))} / ${unit}`;
  };

  if (b.fabricPerUnit != null) {
    const fabricBase = num(b.fabricBasePerUnit);
    const fabricVariantSum = fabricVariants.reduce((s, v) => s + num(v.pricePerUnit), 0);
    const beforeDiscount = fabricBase + fabricVariantSum;
    const hasFabVariants = fabricVariants.some((v) => Math.abs(num(v.pricePerUnit)) > MONEY_EPS);
    const hasDiscount = discounts.some((d) => num(d.pricePerUnit) > MONEY_EPS);

    rows.push({ kind: 'section', title: b.fabricName || 'Fabric' });
    rows.push({ kind: 'pair', label: 'Fabric base', value: per(fabricBase), tone: 'muted' });
    fabricVariants.forEach((v) => {
      if (Math.abs(num(v.pricePerUnit)) <= MONEY_EPS) return;
      rows.push({
        kind: 'pair',
        label: `${v.name || 'Option'}: ${v.value ?? ''}`.trim(),
        value: signed(v.pricePerUnit),
        indent: true,
        tone: 'muted',
      });
    });
    if (hasFabVariants || hasDiscount) {
      rows.push({
        kind: 'pair',
        label: 'Fabric before discount',
        value: per(beforeDiscount),
        tone: 'muted',
      });
    }
    discounts.forEach((d) => {
      if (num(d.pricePerUnit) <= MONEY_EPS) return;
      rows.push({
        kind: 'pair',
        label: d.label || 'Quantity discount',
        value: `−${format(num(d.pricePerUnit))} / ${unit}`,
        indent: true,
        tone: 'success',
      });
    });
    rows.push({
      kind: 'pair',
      label: `Fabric (per ${unit})`,
      value: per(b.fabricPerUnit),
      tone: 'primary',
    });
  }

  if (b.printPerUnit != null) {
    rows.push({ kind: 'rule' });
    rows.push({ kind: 'section', title: 'Print / design' });
    const printHasDetail =
      printVariants.some((v) => Math.abs(num(v.pricePerUnit)) > MONEY_EPS) &&
      !approxEq(num(b.printBasePerUnit), num(b.printPerUnit));
    if (printHasDetail) {
      rows.push({ kind: 'pair', label: 'Print base', value: per(b.printBasePerUnit), tone: 'muted' });
      printVariants.forEach((v) => {
        if (Math.abs(num(v.pricePerUnit)) <= MONEY_EPS) return;
        rows.push({
          kind: 'pair',
          label: `${v.name || 'Option'}: ${v.value ?? ''}`.trim(),
          value: signed(v.pricePerUnit),
          indent: true,
          tone: 'muted',
        });
      });
    }
    rows.push({
      kind: 'pair',
      label: `Print (per ${unit})`,
      value: per(b.printPerUnit),
      tone: 'primary',
    });
  }

  rows.push({ kind: 'rule' });
  rows.push({ kind: 'section', title: 'Total' });
  rows.push({
    kind: 'pair',
    label:
      b.fabricPerUnit != null && b.printPerUnit != null
        ? `Per ${unit} (fabric + print)`
        : `Per ${unit}`,
    value: per(b.unitPrice),
    tone: 'semibold',
  });
  rows.push({
    kind: 'pair',
    label: unit === 'm' ? 'Meters' : 'Quantity',
    value: `× ${qty}`,
    tone: 'muted',
  });
  if (num(b.gstAmount) > 0) {
    rows.push({ kind: 'pair', label: 'Subtotal', value: format(num(b.subtotal)), tone: 'muted' });
    rows.push({
      kind: 'pair',
      label: `GST${b.gstRate ? ` (${num(b.gstRate)}%)` : ''}`,
      value: format(num(b.gstAmount)),
      tone: 'muted',
    });
  }
  rows.push({ kind: 'grand', label: 'Grand total', value: format(num(b.total)) });

  return rows;
}

function LedgerRowEl({ row }: { row: DesignedLedgerRow }) {
  if (row.kind === 'section') {
    return (
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2 first:pt-0">
        {row.title}
      </div>
    );
  }
  if (row.kind === 'rule') {
    return <div className="border-t border-border/50 my-2" />;
  }
  if (row.kind === 'grand') {
    return (
      <div className="flex justify-between pt-3 border-t-2 border-primary/30 font-bold text-base">
        <span>{row.label}</span>
        <span className="text-primary">{row.value}</span>
      </div>
    );
  }
  const valueTone =
    row.tone === 'success'
      ? 'text-green-600 dark:text-green-400'
      : row.tone === 'primary'
        ? 'text-primary font-medium'
        : row.tone === 'semibold'
          ? 'font-semibold text-foreground'
          : '';
  return (
    <div className={`flex justify-between text-sm ${row.indent ? 'pl-2' : ''}`}>
      <span className="text-muted-foreground">{row.label}</span>
      <span className={valueTone || (row.tone === 'muted' ? 'text-muted-foreground' : '')}>{row.value}</span>
    </div>
  );
}

export const PriceBreakdownPopup = ({
  open,
  onOpenChange,
  productName,
  breakdown,
  loading = false,
  error = null,
  formatMoney,
}: PriceBreakdownPopupProps) => {
  const { format } = usePrice();
  const money = formatMoney ?? format;

  if (!open) return null;

  const ready = breakdown != null && breakdown.unitPrice != null;
  const rows = ready ? buildServerLedgerRows(breakdown!, money) : [];
  const titleName = breakdown?.productName || productName || 'Product';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <span>Price Breakdown</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detailed breakdown of the selected product, fabric, variants, and total price.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
            <div className="border-b border-border pb-3">
              <h4 className="font-sans font-semibold text-base not-italic">{titleName}</h4>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculating price…
              </div>
            )}

            {!loading && error && (
              <p className="text-sm text-destructive py-4 text-center">{error}</p>
            )}

            {!loading && !error && ready && (
              <div className="space-y-1 text-sm">
                {rows.map((row, i) => (
                  <LedgerRowEl key={i} row={row} />
                ))}
              </div>
            )}

            {!loading && !error && !ready && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Price breakdown is not available yet.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceBreakdownPopup;
