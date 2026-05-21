import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { usePrice } from '@/lib/currency';

type VariantLine = { variantName: string; optionLabel: string; priceModifier: number };

interface PriceBreakdownPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    productType: string;
    productName: string;
    productId?: number;
    fabricId?: number;
    designPrice?: number;
    fabricPrice?: number;
    unitPrice?: number;
    totalPrice?: number;
    quantity: number;
    variants?: Record<string, string>;
    variantSelections?: Record<string, { variantId?: number | string; optionId?: number | string; variantName?: string; optionName?: string; optionValue?: string; priceModifier?: number }>;
    pricePerMeter?: number;
    basePrice?: number;
    customFormData?: Record<string, any>;
    /** "FABRIC_SLAB" | "DESIGN_SLAB" | "NONE" — surfaced by the server when hybrid pricing is on. */
    discountSource?: string;
    /** Combined fabric metres across the cart when a fabric slab matched. */
    combinedFabricMetres?: number;
    /** From cart API when hybrid fabric slabs applied (list fabric ₹/m before slab). */
    baseFabricPerMeter?: number;
    /** From cart API — fabric discount ₹/m from matched FABRIC slab. */
    fabricSlabDiscountPerMeter?: number;
    /** From cart API — fabric ₹/m after slab (matches line fabric total ÷ qty). */
    effectiveFabricPerMeter?: number;
  };
  // For product detail page - we need to calculate from product data
  productData?: {
    type: string;
    designPrice?: number;
    pricePerMeter?: number;
    price?: number;
    variants?: any[];
    plainProduct?: {
      unitExtension?: string;
    };
    unitExtension?: string;
  };
  selectedVariants?: Record<string, string>;
  fabricQuantity?: number;
  fabricPricePerMeter?: number;
  selectedFabricVariants?: Record<string, string>;
  discountAmount?: number; // Discount from pricing slabs
  finalFabricPricePerMeter?: number; // Final fabric price after discount
}

/** Internal shape for DESIGNED / CUSTOM after `calculateBreakdown`. */
interface DesignedBreakdown {
  basePrice: number;
  fabricPrice: number;
  fabricBasePricePerMeter: number;
  fabricBasePriceRaw?: number;
  fabricVariantLines: VariantLine[];
  fabricVariantModifier: number;
  fabricPricePerMeterBeforeSlab?: number;
  printVariantLines: VariantLine[];
  printVariantModifier: number;
  printTotal: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount?: number;
  /** When server applied a fabric slab (cart / preview). */
  fabricSlabFromServer?: boolean;
}

type DesignedLedgerRow =
  | { kind: 'section'; title: string }
  | { kind: 'pair'; label: string; value: string; indent?: boolean; tone?: 'muted' | 'primary' | 'success' | 'semibold' }
  | { kind: 'rule' }
  | { kind: 'grand'; label: string; value: string };

function buildFabricVariantLines(
  fabricProduct: any,
  selections: Record<string, string> | undefined
): VariantLine[] {
  const lines: VariantLine[] = [];
  if (!fabricProduct?.variants?.length || !selections) return lines;
  fabricProduct.variants.forEach((variant: any) => {
    const selectedVal = selections[String(variant.id)] ?? selections[String(variant.frontendId)];
    if (!selectedVal || !variant.options) return;
    const opt = variant.options.find(
      (o: any) => String(o.id) === selectedVal || String(o.value) === selectedVal || o.value === selectedVal
    );
    if (opt) {
      const mod = Number(opt.priceModifier) || 0;
      lines.push({
        variantName: variant.name || 'Variant',
        optionLabel: opt.value || opt.name || '—',
        priceModifier: mod,
      });
    }
  });
  return lines;
}

function formatVariantCell(mod: number, format: (n: number) => string): string {
  if (mod === 0) return '—';
  return `${mod > 0 ? '+' : ''}${format(mod)}`;
}

const MONEY_EPS = 0.02;
function approxEq(a: number, b: number): boolean {
  return Math.abs(a - b) <= MONEY_EPS;
}

/** DESIGNED/CUSTOM: only rows that add information — no legend, no ₹0 options, no duplicate subtotals. */
function buildDesignedLedgerRows(
  b: DesignedBreakdown,
  item: PriceBreakdownPopupProps['item'],
  discountProp: number | undefined,
  format: (n: number) => string
): DesignedLedgerRow[] {
  const rows: DesignedLedgerRow[] = [];
  const disc = (b.discountAmount ?? discountProp ?? 0) > 0 ? (b.discountAmount ?? discountProp ?? 0) : 0;
  const nzFab = (b.fabricVariantLines ?? []).filter((l) => l.priceModifier !== 0);
  const nzPrint = (b.printVariantLines ?? []).filter((l) => l.priceModifier !== 0);
  const hasFabricBase = b.fabricBasePriceRaw !== undefined;
  const baseRaw = hasFabricBase ? b.fabricBasePriceRaw! : b.fabricBasePricePerMeter;
  const fabricListSubtotal = baseRaw + (b.fabricVariantModifier ?? 0);
  const fabPer = b.fabricBasePricePerMeter;
  const printPer = b.printTotal ?? b.basePrice;
  const q = b.quantity || 1;

  const beforeSlab = b.fabricPricePerMeterBeforeSlab;
  const showBeforeSlab = beforeSlab != null && !approxEq(beforeSlab, fabPer);
  const showSlab = disc > MONEY_EPS;

  const quantityDiscountLabel =
    item.discountSource === 'FABRIC_SLAB'
      ? `Quantity discount${item.combinedFabricMetres ? ` (${item.combinedFabricMetres} m fabric in cart)` : ''}`
      : 'Quantity discount';

  rows.push({ kind: 'section', title: 'Fabric' });
  const fabricUltraSimple = !showBeforeSlab && !showSlab && nzFab.length === 0;
  if (fabricUltraSimple) {
    rows.push({
      kind: 'pair',
      label: 'Fabric (per m)',
      value: `${format(fabPer)} / m`,
      tone: 'primary',
    });
  } else {
    if (showBeforeSlab && beforeSlab != null) {
      rows.push({
        kind: 'pair',
        label: 'Fabric (before quantity discount)',
        value: `${format(beforeSlab)} / m`,
        tone: 'muted',
      });
    }
    if (showSlab) {
      rows.push({ kind: 'pair', label: quantityDiscountLabel, value: `−${format(disc)}`, tone: 'success' });
    }
    if (hasFabricBase && nzFab.length > 0) {
      rows.push({ kind: 'pair', label: 'Fabric base', value: `${format(baseRaw)} / m`, tone: 'muted' });
      nzFab.forEach((line) => {
        rows.push({
          kind: 'pair',
          label: `${line.variantName}: ${line.optionLabel}`,
          value: formatVariantCell(line.priceModifier, format),
          indent: true,
          tone: 'muted',
        });
      });
    }
    const skipFinalFabricDup =
      nzFab.length > 0 &&
      hasFabricBase &&
      approxEq(fabricListSubtotal, fabPer) &&
      !showBeforeSlab &&
      !showSlab;
    if (!skipFinalFabricDup) {
      rows.push({
        kind: 'pair',
        label: 'Fabric (per m)',
        value: `${format(fabPer)} / m`,
        tone: 'primary',
      });
    }
  }

  rows.push({ kind: 'rule' });
  rows.push({ kind: 'section', title: 'Print / design' });
  const printSimple = nzPrint.length === 0 && approxEq(b.basePrice, printPer);
  if (printSimple) {
    rows.push({
      kind: 'pair',
      label: 'Print (per m)',
      value: `${format(printPer)} / m`,
      tone: 'primary',
    });
  } else {
    rows.push({ kind: 'pair', label: 'Print base', value: `${format(b.basePrice)} / m`, tone: 'muted' });
    nzPrint.forEach((line) => {
      rows.push({
        kind: 'pair',
        label: `${line.variantName}: ${line.optionLabel}`,
        value: formatVariantCell(line.priceModifier, format),
        indent: true,
        tone: 'muted',
      });
    });
    const nzSum = nzPrint.reduce((s, l) => s + l.priceModifier, 0);
    const restMod = (b.printVariantModifier ?? 0) - nzSum;
    if (Math.abs(restMod) > MONEY_EPS) {
      rows.push({
        kind: 'pair',
        label: 'Print options',
        value: formatVariantCell(restMod, format),
        tone: 'muted',
      });
    }
    if (!approxEq(b.basePrice + (b.printVariantModifier ?? 0), printPer)) {
      rows.push({
        kind: 'pair',
        label: 'Print (per m)',
        value: `${format(printPer)} / m`,
        tone: 'primary',
      });
    }
  }

  rows.push({ kind: 'rule' });
  rows.push({ kind: 'section', title: 'Total' });
  rows.push({
    kind: 'pair',
    label: 'Per meter (fabric + print)',
    value: `${format(b.unitPrice)} / m`,
    tone: 'semibold',
  });
  rows.push({ kind: 'pair', label: 'Meters', value: `× ${q}`, tone: 'muted' });
  rows.push({ kind: 'grand', label: 'Grand total', value: format(b.totalPrice) });

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
  item,
  productData,
  selectedVariants,
  fabricQuantity,
  fabricPricePerMeter,
  selectedFabricVariants,
  discountAmount,
  finalFabricPricePerMeter,
}: PriceBreakdownPopupProps) => {
  const { format } = usePrice();

  const { data: fetchedProductData } = useQuery({
    queryKey: ['product-for-breakdown', item.productId],
    queryFn: () => productsApi.getById(item.productId!),
    enabled: open && !productData && !!item.productId,
  });

  const { data: fabricProductData } = useQuery({
    queryKey: ['fabric-for-breakdown', item.fabricId],
    queryFn: () => productsApi.getById(item.fabricId!),
    enabled: open && (item.productType === 'DESIGNED' || item.productType === 'CUSTOM') && !!item.fabricId,
  });

  const effectiveProductData = productData || fetchedProductData;

  const calculateBreakdown = (): DesignedBreakdown | Record<string, unknown> | null => {
    if (item.productType === 'DESIGNED' || item.productType === 'CUSTOM') {
      const useLiveFabricSlabBranch =
        productData &&
        fabricPricePerMeter !== undefined &&
        fabricQuantity !== undefined &&
        (finalFabricPricePerMeter !== undefined ||
          (discountAmount != null && Number(discountAmount) > 0));

      if (useLiveFabricSlabBranch) {
        const designPrice = Number(productData!.designPrice) || 0;
        const beforeSlab = Number(fabricPricePerMeter) || 0;
        const afterSlab =
          (finalFabricPricePerMeter != null ? Number(finalFabricPricePerMeter) : null) ?? beforeSlab;
        const meters = fabricQuantity ?? item.quantity ?? 1;

        const printVariantLines: VariantLine[] = [];
        let printVariantModifier = 0;
        if (productData!.variants && selectedVariants) {
          productData!.variants.forEach((variant: any) => {
            const selectedVal = selectedVariants[String(variant.id)] ?? selectedVariants[String(variant.frontendId)];
            if (selectedVal && variant.options) {
              const selectedOption = variant.options.find(
                (opt: any) => String(opt.id) === selectedVal || String(opt.value) === selectedVal || opt.value === selectedVal
              );
              if (selectedOption) {
                const mod = Number(selectedOption.priceModifier) || 0;
                printVariantModifier += mod;
                printVariantLines.push({
                  variantName: variant.name || 'Variant',
                  optionLabel: selectedOption.value || selectedOption.name || '—',
                  priceModifier: mod,
                });
              }
            }
          });
        }

        const fabricVariantLines = buildFabricVariantLines(fabricProductData, selectedFabricVariants);
        const fabricVariantModifier = fabricVariantLines.reduce((sum, l) => sum + (l.priceModifier || 0), 0);
        const fabricBasePricePerMeterRaw = fabricProductData
          ? Number(fabricProductData.pricePerMeter || fabricProductData.price || 0)
          : beforeSlab - fabricVariantModifier;
        const fabricPerMeterFinal = (fabricBasePricePerMeterRaw ?? 0) + (fabricVariantModifier ?? 0);
        const effectiveFabricPerMeter =
          fabricProductData && fabricVariantLines.length > 0 ? fabricPerMeterFinal : afterSlab;

        const printPerMeter = designPrice + printVariantModifier;
        const fabricTotalPrice = effectiveFabricPerMeter * meters;
        const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : effectiveFabricPerMeter + printPerMeter;
        const totalPrice = item.totalPrice != null ? Number(item.totalPrice) : unitPrice * meters;

        const designed: DesignedBreakdown = {
          basePrice: designPrice,
          fabricPrice: fabricTotalPrice,
          fabricBasePricePerMeter: effectiveFabricPerMeter,
          fabricBasePriceRaw: fabricProductData ? fabricBasePricePerMeterRaw : undefined,
          fabricPricePerMeterBeforeSlab: discountAmount != null && discountAmount > 0 ? beforeSlab : undefined,
          printVariantModifier,
          printVariantLines,
          fabricVariantLines,
          fabricVariantModifier,
          printTotal: printPerMeter,
          quantity: meters,
          unitPrice,
          totalPrice,
          discountAmount: discountAmount != null && discountAmount > 0 ? Number(discountAmount) : undefined,
        };
        return designed;
      }

      if (item.designPrice !== undefined && item.fabricPrice !== undefined) {
        const designPrice = Number(item.designPrice) || 0;
        const fabricPrice = Number(item.fabricPrice) || 0;
        const quantity = item.quantity || 1;
        const storedTotalPrice = Number(item.totalPrice) || 0;
        const storedUnitPrice = Number(item.unitPrice) || 0;

        const printVariantIds = new Set((effectiveProductData?.variants || []).map((v: any) => String(v.id)));
        const fabricVariantIds = new Set((fabricProductData?.variants || []).map((v: any) => String(v.id)));

        const printVariantLines: VariantLine[] = [];
        const fabricVariantLines: VariantLine[] = [];
        let printVariantModifier = 0;
        let fabricVariantModifier = 0;

        const selections = item.variantSelections ? Object.entries(item.variantSelections) : [];
        for (const [, selection] of selections) {
          if (!selection || typeof selection !== 'object') continue;
          const variantId = selection.variantId != null ? String(selection.variantId) : '';
          const priceMod = Number(selection.priceModifier) || 0;
          const variantName = selection.variantName || 'Variant';
          const optionLabel = selection.optionName || selection.optionValue || '—';
          if (printVariantIds.has(variantId)) {
            printVariantModifier += priceMod;
            printVariantLines.push({ variantName, optionLabel, priceModifier: priceMod });
          } else if (fabricVariantIds.has(variantId)) {
            fabricVariantModifier += priceMod;
            fabricVariantLines.push({ variantName, optionLabel, priceModifier: priceMod });
          } else {
            printVariantModifier += priceMod;
            printVariantLines.push({ variantName, optionLabel, priceModifier: priceMod });
          }
        }

        const fabricVarsFromProduct = buildFabricVariantLines(fabricProductData, item.variants || selectedFabricVariants);
        if (fabricVarsFromProduct.length > 0 && fabricVariantLines.length === 0) {
          fabricVarsFromProduct.forEach((l) => {
            fabricVariantLines.push(l);
            fabricVariantModifier += l.priceModifier || 0;
          });
        }

        if (printVariantLines.length === 0 && effectiveProductData?.variants && (item.variants || item.variantSelections)) {
          const variantMap: Record<string, string> = {};
          if (item.variants) Object.assign(variantMap, item.variants);
          else if (item.variantSelections) {
            effectiveProductData.variants.forEach((v: any) => {
              const sel = Object.values(item.variantSelections || {}).find(
                (s: any) => s && String(s.variantId) === String(v.id)
              );
              if (sel?.optionId != null) variantMap[String(v.id)] = String(sel.optionId);
              else if (sel?.optionValue != null) variantMap[String(v.id)] = sel.optionValue;
            });
          }
          effectiveProductData.variants.forEach((variant: any) => {
            const selectedValue = variantMap[String(variant.id)];
            if (!selectedValue || !variant.options) return;
            const selectedOption = variant.options.find(
              (opt: any) => String(opt.id) === selectedValue || opt.value === selectedValue
            );
            if (selectedOption) {
              const mod = Number(selectedOption.priceModifier) || 0;
              printVariantModifier += mod;
              printVariantLines.push({
                variantName: variant.name || 'Variant',
                optionLabel: selectedOption.value || selectedOption.name || '—',
                priceModifier: mod,
              });
            }
          });
        }

        const printPerMeter = designPrice + printVariantModifier;

        const useServerFabricSlab =
          item.discountSource === 'FABRIC_SLAB' &&
          item.effectiveFabricPerMeter != null &&
          Number.isFinite(Number(item.effectiveFabricPerMeter));

        const fabricFromField = useServerFabricSlab
          ? Number(item.effectiveFabricPerMeter)
          : fabricPricePerMeter !== undefined && Number.isFinite(Number(fabricPricePerMeter))
            ? Number(fabricPricePerMeter)
            : quantity > 0
              ? fabricPrice / quantity
              : 0;

        const impliedFabricPm =
          storedUnitPrice > 0 ? Math.max(0, storedUnitPrice - printPerMeter) : null;
        const fabricPerMeter = useServerFabricSlab
          ? Number(item.effectiveFabricPerMeter)
          : impliedFabricPm != null &&
              storedUnitPrice > 0 &&
              Math.abs(fabricFromField + printPerMeter - storedUnitPrice) > 0.02
            ? impliedFabricPm
            : fabricFromField;

        const fabricBasePriceRaw =
          fabricVariantLines.length > 0 ? Math.max(0, fabricPerMeter - fabricVariantModifier) : undefined;

        const unitPrice = storedUnitPrice || fabricPerMeter + printPerMeter;
        const totalPrice = storedTotalPrice || unitPrice * quantity;

        const baseFabPm =
          item.baseFabricPerMeter != null ? Number(item.baseFabricPerMeter) : undefined;
        let slabDiscPm =
          item.fabricSlabDiscountPerMeter != null ? Number(item.fabricSlabDiscountPerMeter) : 0;
        if ((!Number.isFinite(slabDiscPm) || slabDiscPm <= MONEY_EPS) && baseFabPm != null) {
          const impliedDisc = baseFabPm - fabricPerMeter;
          if (impliedDisc > MONEY_EPS) slabDiscPm = impliedDisc;
        }
        const isFabricSlab =
          item.discountSource === 'FABRIC_SLAB' &&
          (useServerFabricSlab || slabDiscPm > MONEY_EPS || (baseFabPm != null && !approxEq(baseFabPm, fabricPerMeter)));

        const designed: DesignedBreakdown = {
          basePrice: designPrice,
          fabricPrice: fabricPerMeter * quantity,
          printVariantModifier,
          printVariantLines,
          fabricVariantLines,
          fabricVariantModifier,
          fabricBasePriceRaw,
          printTotal: printPerMeter,
          quantity,
          unitPrice,
          totalPrice,
          fabricBasePricePerMeter: fabricPerMeter,
          fabricPricePerMeterBeforeSlab:
            isFabricSlab && baseFabPm != null && !approxEq(baseFabPm, fabricPerMeter)
              ? baseFabPm
              : undefined,
          discountAmount: isFabricSlab && slabDiscPm > MONEY_EPS ? slabDiscPm : undefined,
          fabricSlabFromServer: isFabricSlab,
        };
        return designed;
      }
    } else if (item.productType === 'PLAIN') {
      const quantity = item.quantity || 1;
      const storedTotalPrice = Number(item.totalPrice) || 0;
      const storedUnitPrice = Number(item.unitPrice) || 0;

      let basePrice = Number(item.pricePerMeter || item.basePrice) || 0;
      if (!basePrice && effectiveProductData) {
        basePrice = Number(effectiveProductData.pricePerMeter || effectiveProductData.price) || 0;
      }

      let variantModifier = 0;
      const variantsToUse = selectedVariants || item.variants;
      if (effectiveProductData && effectiveProductData.variants && variantsToUse) {
        effectiveProductData.variants.forEach((variant: any) => {
          const selectedValue = variantsToUse[String(variant.id)];
          if (selectedValue && variant.options) {
            const selectedOption = variant.options.find(
              (opt: any) => String(opt.id) === selectedValue || opt.value === selectedValue
            );
            if (selectedOption && selectedOption.priceModifier) {
              variantModifier += Number(selectedOption.priceModifier);
            }
          }
        });
      }

      const pricePerMeter = storedUnitPrice || basePrice + variantModifier;
      const totalPrice = storedTotalPrice || pricePerMeter * quantity;

      return {
        basePrice: basePrice || pricePerMeter - variantModifier,
        variantModifier,
        pricePerMeter,
        quantity,
        totalPrice,
      };
    } else if (item.productType === 'DIGITAL') {
      const basePrice = Number(item.basePrice || item.unitPrice || item.totalPrice) || 0;
      const quantity = item.quantity || 1;
      return {
        basePrice,
        quantity,
        totalPrice: basePrice * quantity,
      };
    }

    return null;
  };

  const breakdown = calculateBreakdown();

  const getUnitExtension = () => {
    if (item.productType === 'PLAIN') {
      return (
        effectiveProductData?.plainProduct?.unitExtension ||
        effectiveProductData?.unitExtension ||
        'per meter'
      );
    }
    return 'per meter';
  };

  const getUnitName = () => {
    const unitExtension = getUnitExtension();
    return unitExtension.replace(/^per\s+/i, '').trim() || 'meter';
  };

  if (!breakdown) return null;

  const isDesigned =
    (item.productType === 'DESIGNED' || item.productType === 'CUSTOM') &&
    breakdown != null &&
    typeof breakdown === 'object' &&
    'printTotal' in breakdown;

  const designedRows = isDesigned
    ? buildDesignedLedgerRows(breakdown as DesignedBreakdown, item, discountAmount, format)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <span>Price Breakdown</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
            <div className="border-b border-border pb-3">
              <h4 className="font-sans font-semibold text-base not-italic">{item.productName}</h4>
            </div>

            {isDesigned && (
              <div className="space-y-1 text-sm">
                {designedRows.map((row, i) => (
                  <LedgerRowEl key={i} row={row} />
                ))}
              </div>
            )}

            {item.productType === 'PLAIN' && 'pricePerMeter' in breakdown && (
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base price {getUnitExtension()}</span>
                  <span>{format((breakdown as any).basePrice)}</span>
                </div>
                {(breakdown as any).variantModifier !== undefined && (breakdown as any).variantModifier !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variant modifiers</span>
                    <span>
                      {(breakdown as any).variantModifier > 0 ? '+' : ''}
                      {format((breakdown as any).variantModifier)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span>Price per {getUnitName()}</span>
                  <span className="text-primary">
                    {format((breakdown as any).pricePerMeter || (breakdown as any).basePrice || 0)}
                  </span>
                </div>
                {(breakdown as any).quantity > 1 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Quantity ({getUnitName()}s)</span>
                    <span>× {(breakdown as any).quantity}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t-2 border-primary/30 font-bold text-base">
                  <span>Grand total</span>
                  <span className="text-primary">{format((breakdown as any).totalPrice)}</span>
                </div>
                {(breakdown as any).quantity > 1 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    {format((breakdown as any).pricePerMeter || 0)} × {(breakdown as any).quantity} ={' '}
                    {format((breakdown as any).totalPrice)}
                  </div>
                )}
              </div>
            )}

            {item.productType === 'DIGITAL' && 'basePrice' in breakdown && (
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit price</span>
                  <span>{format((breakdown as any).basePrice)}</span>
                </div>
                {(breakdown as any).quantity > 1 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Quantity (items)</span>
                    <span>× {(breakdown as any).quantity}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t-2 border-primary/30 font-bold text-base">
                  <span>Grand total</span>
                  <span className="text-primary">{format((breakdown as any).totalPrice)}</span>
                </div>
                {(breakdown as any).quantity > 1 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    {format((breakdown as any).basePrice)} × {(breakdown as any).quantity} ={' '}
                    {format((breakdown as any).totalPrice)}
                  </div>
                )}
              </div>
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
