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
    designPrice?: number;
    fabricPrice?: number;
    unitPrice?: number;
    totalPrice?: number;
    quantity: number;
    variants?: Record<string, string>;
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
  
  // Fetch product data for cart items to get variant details
  const { data: fetchedProductData } = useQuery({
    queryKey: ['product-for-breakdown', item.productId],
    queryFn: () => productsApi.getById(item.productId!),
    enabled: open && !productData && !!item.productId,
  });

  const effectiveProductData = productData || fetchedProductData;

  // Calculate breakdown based on whether it's from cart or product detail
  const calculateBreakdown = () => {
    if (item.productType === 'DESIGNED') {
      // PRICING LOGIC:
      // Fabric: (base + fabric variant) × meters = Fabric Total
      // Print: base + print variant = Print Total (NO meter multiplication)
      // Unit Price = Fabric Total + Print Total
      // Final Total = Unit Price × Product Quantity
      
      // From cart - use stored values
      if (item.designPrice !== undefined && item.fabricPrice !== undefined) {
        const designPrice = Number(item.designPrice) || 0;  // Print base price
        const fabricPrice = Number(item.fabricPrice) || 0;  // Fabric total for X meters
        const quantity = item.quantity || 1;  // Product quantity (units)
        const storedTotalPrice = Number(item.totalPrice) || 0;
        const storedUnitPrice = Number(item.unitPrice) || 0;
        const fabricMeters = item.customFormData?.fabricMeters;
        
        // Calculate print variant modifier (added ONCE, not per meter)
        let printVariantModifier = 0;
        if (effectiveProductData && effectiveProductData.variants && item.variants) {
          effectiveProductData.variants.forEach((variant: any) => {
            const selectedValue = item.variants[String(variant.id)];
            if (selectedValue && variant.options) {
              const selectedOption = variant.options.find((opt: any) => 
                String(opt.id) === selectedValue || opt.value === selectedValue
              );
              if (selectedOption && selectedOption.priceModifier) {
                // Print variants add ONCE, not multiplied by anything
                printVariantModifier += Number(selectedOption.priceModifier);
              }
            }
          });
        }
        
        // Print total = base + variant
        const printTotal = designPrice + printVariantModifier;
        
        // Use stored values if available
        const unitPrice = storedUnitPrice || (fabricPrice + printTotal);
        const totalPrice = storedTotalPrice || (unitPrice * quantity);
        
        return {
          basePrice: designPrice,
          fabricPrice: fabricPrice,
          printVariantModifier: printVariantModifier,
          printTotal: printTotal,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          fabricMeters: fabricMeters != null ? Number(fabricMeters) : undefined,
          fabricBasePricePerMeter: fabricPrice != null && fabricMeters != null && Number(fabricMeters) > 0
            ? fabricPrice / Number(fabricMeters) : undefined,
        };
      }
      
      // From product detail page
      if (productData && fabricPricePerMeter !== undefined && fabricQuantity !== undefined) {
        const designPrice = Number(productData.designPrice) || 0;  // Print base price
        const beforeSlab = Number(fabricPricePerMeter) || 0;  // Price per meter before slab
        const afterSlab = (finalFabricPricePerMeter != null ? Number(finalFabricPricePerMeter) : null) ?? beforeSlab;
        const productQuantity = item.quantity ?? 1;  // Product quantity (units)
        const metersPerUnit = fabricQuantity || 1;  // Fabric meters per unit
        
        // Calculate print variant modifier (added ONCE, not per meter)
        let printVariantModifier = 0;
        if (productData.variants && selectedVariants) {
          productData.variants.forEach((variant: any) => {
            const selectedOptionId = selectedVariants[String(variant.id)];
            if (selectedOptionId && variant.options) {
              const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
              if (selectedOption && selectedOption.priceModifier) {
                printVariantModifier += Number(selectedOption.priceModifier);
              }
            }
          });
        }
        
        // Fabric total = price per meter (after slab) × meters
        const fabricTotalPrice = afterSlab * metersPerUnit;
        const printTotal = designPrice + printVariantModifier;
        const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : (fabricTotalPrice + printTotal);
        const totalPrice = item.totalPrice != null ? Number(item.totalPrice) : unitPrice * productQuantity;
        
        return {
          basePrice: designPrice,
          fabricPrice: fabricTotalPrice,
          fabricBasePricePerMeter: afterSlab,
          fabricPricePerMeterBeforeSlab: discountAmount != null && discountAmount > 0 ? beforeSlab : undefined,
          printVariantModifier: printVariantModifier,
          printTotal: printTotal,
          quantity: productQuantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          fabricMeters: metersPerUnit,
          discountAmount: discountAmount != null && discountAmount > 0 ? discountAmount : undefined,
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
                    × {breakdown.quantity} {item.productType === 'DESIGNED' ? 'unit' : item.productType === 'PLAIN' ? getUnitName() : 'item'}{breakdown.quantity !== 1 ? 's' : ''}
                  </span>
                )}
              </h4>
            </div>
            
            {item.productType === 'DESIGNED' && breakdown.basePrice !== undefined && (
              <div className="space-y-4 text-sm">
                {/* FABRIC SECTION */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fabric</div>
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
                  {breakdown.fabricBasePricePerMeter !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per meter{(breakdown as any).fabricPricePerMeterBeforeSlab != null ? ' (after slab)' : ''}</span>
                      <span>{format(breakdown.fabricBasePricePerMeter)}/m</span>
                    </div>
                  )}
                  {breakdown.fabricMeters != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Meters</span>
                      <span>× {breakdown.fabricMeters}</span>
                    </div>
                  )}
                  {breakdown.fabricPrice !== undefined && (
                    <div className="flex justify-between font-medium">
                      <span>Fabric total</span>
                      <span className="text-primary">{format(breakdown.fabricPrice)}</span>
                    </div>
                  )}
                </div>

                {/* PRINT SECTION */}
                <div className="space-y-2 pt-3 border-t border-border/30">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Print / Design</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base print price</span>
                    <span>{format(breakdown.basePrice)}</span>
                  </div>
                  {breakdown.printVariantModifier != null && breakdown.printVariantModifier !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Print variant</span>
                      <span>{breakdown.printVariantModifier > 0 ? '+' : ''}{format(breakdown.printVariantModifier)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>Print total</span>
                    <span className="text-primary">{format(breakdown.printTotal ?? breakdown.basePrice)}</span>
                  </div>
                </div>

                {/* COMBINED UNIT PRICE */}
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <div className="flex justify-between font-semibold">
                    <span>Per unit total</span>
                    <span className="text-primary">{format(breakdown.unitPrice)}</span>
                  </div>
                  {breakdown.quantity > 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity (units)</span>
                      <span>× {breakdown.quantity}</span>
                    </div>
                  )}
                </div>

                {/* GRAND TOTAL */}
                <div className="flex justify-between pt-3 border-t-2 border-primary/30 font-bold text-base">
                  <span>Grand total</span>
                  <span className="text-primary">{format(breakdown.totalPrice)}</span>
                </div>
                {breakdown.quantity > 1 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    {format(breakdown.unitPrice)} × {breakdown.quantity} = {format(breakdown.totalPrice)}
                  </div>
                )}
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
