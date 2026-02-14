import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calculator, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { usePrice } from '@/lib/currency';

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
  
  // Fetch print product data for cart items to get variant details
  const { data: fetchedProductData } = useQuery({
    queryKey: ['product-for-breakdown', item.productId],
    queryFn: () => productsApi.getById(item.productId!),
    enabled: open && !productData && !!item.productId,
  });

  // Fetch fabric product for DESIGNED cart items (for fabric variant breakdown)
  const { data: fabricProductData } = useQuery({
    queryKey: ['fabric-for-breakdown', item.fabricId],
    queryFn: () => productsApi.getById(item.fabricId!),
    enabled: open && (item.productType === 'DESIGNED' || item.productType === 'CUSTOM') && !!item.fabricId,
  });

  const effectiveProductData = productData || fetchedProductData;

  // Build fabric variant lines from fabric product + selected fabric variants
  const buildFabricVariantLines = (
    fabricProduct: any,
    selections: Record<string, string> | undefined
  ): { variantName: string; optionLabel: string; priceModifier: number }[] => {
    const lines: { variantName: string; optionLabel: string; priceModifier: number }[] = [];
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
  };

  // Calculate breakdown based on whether it's from cart or product detail
  const calculateBreakdown = () => {
    if (item.productType === 'DESIGNED' || item.productType === 'CUSTOM') {
      // PRICING LOGIC (1-meter base, quantity = meters):
      // unitPrice = per-meter total (fabric/m + print/m). totalPrice = unitPrice × quantity (meters).

      // Product detail branch (also used for cart when productData + fabric props passed for same breakdown)
      if (productData && fabricPricePerMeter !== undefined && fabricQuantity !== undefined) {
        const designPrice = Number(productData.designPrice) || 0;
        const beforeSlab = Number(fabricPricePerMeter) || 0;
        const afterSlab = (finalFabricPricePerMeter != null ? Number(finalFabricPricePerMeter) : null) ?? beforeSlab;
        const meters = fabricQuantity ?? item.quantity ?? 1;

        // Design/print variants (from product or config)
        const printVariantLines: { variantName: string; optionLabel: string; priceModifier: number }[] = [];
        let printVariantModifier = 0;
        if (productData.variants && selectedVariants) {
          productData.variants.forEach((variant: any) => {
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

        // Fabric base + variant breakdown (when fabric product data available)
        const fabricVariantLines = buildFabricVariantLines(fabricProductData, selectedFabricVariants);
        const fabricVariantModifier = fabricVariantLines.reduce((sum, l) => sum + (l.priceModifier || 0), 0);
        const fabricBasePricePerMeterRaw = fabricProductData
          ? Number(fabricProductData.pricePerMeter || fabricProductData.price || 0)
          : beforeSlab - fabricVariantModifier;
        // When we have base+variants breakdown, use calculated fabric total; else use afterSlab
        const fabricPerMeterFinal = (fabricBasePricePerMeterRaw ?? 0) + (fabricVariantModifier ?? 0);
        const effectiveFabricPerMeter = fabricProductData && fabricVariantLines.length > 0
          ? fabricPerMeterFinal
          : afterSlab;

        const printPerMeter = designPrice + printVariantModifier;
        const fabricTotalPrice = effectiveFabricPerMeter * meters;
        const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : (effectiveFabricPerMeter + printPerMeter);
        const totalPrice = item.totalPrice != null ? Number(item.totalPrice) : unitPrice * meters;

        return {
          basePrice: designPrice,
          fabricPrice: fabricTotalPrice,
          fabricBasePricePerMeter: effectiveFabricPerMeter,
          fabricBasePriceRaw: fabricProductData ? fabricBasePricePerMeterRaw : undefined,
          fabricPricePerMeterBeforeSlab: discountAmount != null && discountAmount > 0 ? beforeSlab : undefined,
          printVariantModifier: printVariantModifier,
          printVariantLines,
          fabricVariantLines,
          fabricVariantModifier,
          printTotal: printPerMeter,
          quantity: meters,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          fabricMeters: meters,
          discountAmount: discountAmount != null && discountAmount > 0 ? discountAmount : undefined,
        };
      }

      // From cart - use stored values when product detail branch not applicable
      if (item.designPrice !== undefined && item.fabricPrice !== undefined) {
        const designPrice = Number(item.designPrice) || 0;
        const fabricPrice = Number(item.fabricPrice) || 0;
        const quantity = item.quantity || 1;  // Meters - source of truth for display
        const storedTotalPrice = Number(item.totalPrice) || 0;
        const storedUnitPrice = Number(item.unitPrice) || 0;

        const printVariantIds = new Set(
          (effectiveProductData?.variants || []).map((v: any) => String(v.id))
        );
        const fabricVariantIds = new Set(
          (fabricProductData?.variants || []).map((v: any) => String(v.id))
        );

        const printVariantLines: { variantName: string; optionLabel: string; priceModifier: number }[] = [];
        const fabricVariantLines: { variantName: string; optionLabel: string; priceModifier: number }[] = [];
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
            // Config variants or unmatched variants - treat as print/design variants
            printVariantModifier += priceMod;
            printVariantLines.push({ variantName, optionLabel, priceModifier: priceMod });
          }
        }

        // If fabric variants weren't in variantSelections (e.g. CUSTOM cart stores them in item.variants), build from fabric product
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
            const selectedOption = variant.options.find((opt: any) =>
              String(opt.id) === selectedValue || opt.value === selectedValue
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
        
        // Use fabricPricePerMeter prop if available (from CustomProductDetail page), otherwise calculate from total
        const fabricPerMeter = fabricPricePerMeter !== undefined 
          ? Number(fabricPricePerMeter) 
          : (quantity > 0 ? fabricPrice / quantity : 0);
        const fabricBasePriceRaw = fabricVariantLines.length > 0 
          ? Math.max(0, fabricPerMeter - fabricVariantModifier) 
          : undefined;
        
        const unitPrice = storedUnitPrice || (fabricPerMeter + printPerMeter);
        const totalPrice = storedTotalPrice || unitPrice * quantity;

        return {
          basePrice: designPrice,
          fabricPrice: fabricPrice,
          printVariantModifier: printVariantModifier,
          printVariantLines,
          fabricVariantLines,
          fabricVariantModifier,
          fabricBasePriceRaw,
          printTotal: printPerMeter,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          fabricMeters: quantity,
          fabricBasePricePerMeter: fabricPerMeter,
        };
      }
    } else if (item.productType === 'PLAIN') {
      // Plain product
      const quantity = item.quantity || 1;
      const storedTotalPrice = Number(item.totalPrice) || 0;
      const storedUnitPrice = Number(item.unitPrice) || 0;
      
      // Try to get base price from product data or item
      let basePrice = Number(item.pricePerMeter || item.basePrice) || 0;
      if (!basePrice && effectiveProductData) {
        basePrice = Number(effectiveProductData.pricePerMeter || effectiveProductData.price) || 0;
      }
      
      // Calculate variant modifiers
      let variantModifier = 0;
      const variantsToUse = selectedVariants || item.variants;
      if (effectiveProductData && effectiveProductData.variants && variantsToUse) {
        effectiveProductData.variants.forEach((variant: any) => {
          const selectedValue = variantsToUse[String(variant.id)];
          if (selectedValue && variant.options) {
            // Try to find option by value or ID
            const selectedOption = variant.options.find((opt: any) => 
              String(opt.id) === selectedValue || opt.value === selectedValue
            );
            if (selectedOption && selectedOption.priceModifier) {
              variantModifier += Number(selectedOption.priceModifier);
            }
          }
        });
      }
      
      // If we have stored prices, use them; otherwise calculate
      const pricePerMeter = storedUnitPrice || (basePrice + variantModifier);
      const totalPrice = storedTotalPrice || (pricePerMeter * quantity);
      
      return {
        basePrice: basePrice || (pricePerMeter - variantModifier),
        variantModifier: variantModifier,
        pricePerMeter: pricePerMeter,
        quantity: quantity,
        totalPrice: totalPrice,
      };
    } else if (item.productType === 'DIGITAL') {
      // Digital product
      const basePrice = Number(item.basePrice || item.unitPrice || item.totalPrice) || 0;
      const quantity = item.quantity || 1;
      
      return {
        basePrice: basePrice,
        quantity: quantity,
        totalPrice: basePrice * quantity,
      };
    }
    
    return null;
  };

  const breakdown = calculateBreakdown();
  
  // Get unit extension for PLAIN products
  const getUnitExtension = () => {
    if (item.productType === 'PLAIN') {
      const unitExtension = effectiveProductData?.plainProduct?.unitExtension || 
                           effectiveProductData?.unitExtension || 
                           'per meter';
      return unitExtension;
    }
    return 'per meter'; // Default for DESIGNED products
  };
  
  const getUnitName = () => {
    const unitExtension = getUnitExtension();
    return unitExtension.replace(/^per\s+/i, '').trim() || 'meter';
  };
  
  if (!breakdown) return null;

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
              <h4 className="font-semibold text-base">
                {item.productName}
                {breakdown.quantity && breakdown.quantity > 1 && (
                  <span className="text-muted-foreground font-normal ml-2">
                    × {breakdown.quantity} {(item.productType === 'DESIGNED' || item.productType === 'CUSTOM') ? 'meter' : item.productType === 'PLAIN' ? getUnitName() : 'item'}{breakdown.quantity !== 1 ? 's' : ''}
                  </span>
                )}
              </h4>
            </div>
            
            {/* DESIGNED / CUSTOM - Unified detailed breakdown: fabric (base + variants), design (base + variants), combined total */}
            {(item.productType === 'DESIGNED' || item.productType === 'CUSTOM') && breakdown.basePrice !== undefined && (
              <div className="space-y-4 text-sm">
                {/* FABRIC SECTION - Base + variants breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fabric</div>
                  {/* Fabric base (e.g. ₹80/m) */}
                  {(breakdown as any).fabricBasePriceRaw !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base per meter</span>
                      <span>{format((breakdown as any).fabricBasePriceRaw)}/m</span>
                    </div>
                  )}
                  {/* Fabric variants (e.g. Color: Red +₹20) */}
                  {(breakdown as any).fabricVariantLines?.length > 0 && (
                    (breakdown as any).fabricVariantLines.map((line: { variantName: string; optionLabel: string; priceModifier: number }, idx: number) => (
                      <div key={idx} className="flex justify-between pl-2 text-muted-foreground">
                        <span>{line.variantName}: {line.optionLabel}</span>
                        <span>{line.priceModifier !== 0 ? (line.priceModifier > 0 ? '+' : '') + format(line.priceModifier) : '—'}</span>
                      </div>
                    ))
                  )}
                  {/* Fabric subtotal (base + variants) - shown when we have breakdown and either slab discount or multiple components */}
                  {(breakdown as any).fabricBasePriceRaw !== undefined && (breakdown as any).fabricVariantLines?.length > 0 && (
                    <div className="flex justify-between text-muted-foreground border-t border-border/30 pt-1 mt-1">
                      <span>Fabric subtotal (base + variants)</span>
                      <span>{format(((breakdown as any).fabricBasePriceRaw || 0) + ((breakdown as any).fabricVariantModifier || 0))}/m</span>
                    </div>
                  )}
                  {(breakdown as any).fabricPricePerMeterBeforeSlab != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per meter (before slab)</span>
                      <span>{format((breakdown as any).fabricPricePerMeterBeforeSlab)}/m</span>
                    </div>
                  )}
                  {((breakdown as any).discountAmount ?? discountAmount) != null && ((breakdown as any).discountAmount ?? discountAmount) > 0 && (
                    <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                      <span>Slab discount</span>
                      <span>-{format((breakdown as any).discountAmount ?? discountAmount ?? 0)}</span>
                    </div>
                  )}
                  {/* Fabric per meter / Fabric total - skip when we have detailed breakdown (Base + variants + Fabric subtotal) to avoid repetition */}
                  {breakdown.fabricPrice !== undefined && !((breakdown as any).fabricBasePriceRaw !== undefined && (breakdown as any).fabricVariantLines?.length > 0) && (
                    <>
                      <div className="flex justify-between font-medium">
                        <span>Fabric per meter</span>
                        <span className="text-primary">{format(breakdown.fabricBasePricePerMeter ?? 0)}/m</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Fabric total</span>
                        <span className="text-primary">{format(breakdown.fabricPrice)}</span>
                      </div>
                    </>
                  )}
                  {/* Fabric total only when qty > 1 (when we have breakdown, subtotal is per meter; total needed for qty) */}
                  {breakdown.fabricPrice !== undefined && ((breakdown as any).fabricBasePriceRaw !== undefined && (breakdown as any).fabricVariantLines?.length > 0) && breakdown.quantity > 1 && (
                    <div className="flex justify-between font-medium">
                      <span>Fabric total</span>
                      <span className="text-primary">{format(breakdown.fabricPrice)}</span>
                    </div>
                  )}
                </div>

                {/* PRINT SECTION (per meter) */}
                <div className="space-y-2 pt-3 border-t border-border/30">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Print / Design</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Print base (per m)</span>
                    <span>{format(breakdown.basePrice)}/m</span>
                  </div>
                  {(breakdown as any).printVariantLines?.length > 0 ? (
                    (breakdown as any).printVariantLines.map((line: { variantName: string; optionLabel: string; priceModifier: number }, idx: number) => (
                      <div key={idx} className="flex justify-between pl-2">
                        <span className="text-muted-foreground">{line.variantName}: {line.optionLabel}</span>
                        <span>{line.priceModifier !== 0 ? (line.priceModifier > 0 ? '+' : '') + format(line.priceModifier) : '—'}</span>
                      </div>
                    ))
                  ) : (
                    breakdown.printVariantModifier != null && breakdown.printVariantModifier !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Variant modifier</span>
                        <span>{breakdown.printVariantModifier > 0 ? '+' : ''}{format(breakdown.printVariantModifier)}</span>
                      </div>
                    )
                  )}
                  <div className="flex justify-between font-medium pt-0.5">
                    <span className="text-muted-foreground">Print total (per m)</span>
                    <span className="text-primary">{format(breakdown.printTotal ?? breakdown.basePrice)}/m</span>
                  </div>
                </div>

                {/* PER METER TOTAL & METERS */}
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <div className="flex justify-between font-semibold">
                    <span>Per meter total</span>
                    <span className="text-primary">{format(breakdown.unitPrice)}/m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meters</span>
                    <span>× {breakdown.quantity}</span>
                  </div>
                </div>

                {/* GRAND TOTAL */}
                <div className="flex justify-between pt-3 border-t-2 border-primary/30 font-bold text-base">
                  <span>Grand total</span>
                  <span className="text-primary">{format(breakdown.totalPrice)}</span>
                </div>
              </div>
            )}
            
            {item.productType === 'PLAIN' && (
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base price {getUnitExtension()}</span>
                  <span>{format(breakdown.basePrice)}</span>
                </div>
                {breakdown.variantModifier !== undefined && breakdown.variantModifier !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variant modifiers</span>
                    <span>{breakdown.variantModifier > 0 ? '+' : ''}{format(breakdown.variantModifier)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span>Price per {getUnitName()}</span>
                  <span className="text-primary">{format(breakdown.pricePerMeter || breakdown.basePrice || 0)}</span>
                </div>
                {breakdown.quantity > 1 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity ({getUnitName()}s)</span>
                    <span>× {breakdown.quantity}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t-2 border-primary/30 font-bold text-base">
                  <span>Grand total</span>
                  <span className="text-primary">{format(breakdown.totalPrice)}</span>
                </div>
                {breakdown.quantity > 1 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    {format(breakdown.pricePerMeter || 0)} × {breakdown.quantity} = {format(breakdown.totalPrice)}
                  </div>
                )}
              </div>
            )}
            
            {item.productType === 'DIGITAL' && (
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit price</span>
                  <span>{format(breakdown.basePrice)}</span>
                </div>
                {breakdown.quantity > 1 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity (items)</span>
                    <span>× {breakdown.quantity}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t-2 border-primary/30 font-bold text-base">
                  <span>Grand total</span>
                  <span className="text-primary">{format(breakdown.totalPrice)}</span>
                </div>
                {breakdown.quantity > 1 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    {format(breakdown.basePrice)} × {breakdown.quantity} = {format(breakdown.totalPrice)}
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
