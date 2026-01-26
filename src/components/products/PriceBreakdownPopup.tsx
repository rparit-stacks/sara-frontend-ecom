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
      // From cart - use stored values
      if (item.designPrice !== undefined && item.fabricPrice !== undefined) {
        const designPrice = Number(item.designPrice) || 0;
        const fabricPrice = Number(item.fabricPrice) || 0;
        const quantity = item.quantity || 1;
        const storedTotalPrice = Number(item.totalPrice) || 0;
        
        // Calculate variant modifiers
        let variantModifier = 0;
        if (effectiveProductData && effectiveProductData.variants && item.variants) {
          effectiveProductData.variants.forEach((variant: any) => {
            const selectedValue = item.variants[String(variant.id)];
            if (selectedValue && variant.options) {
              // Try to find option by value or ID
              const selectedOption = variant.options.find((opt: any) => 
                String(opt.id) === selectedValue || opt.value === selectedValue
              );
              if (selectedOption && selectedOption.priceModifier) {
                variantModifier += Number(selectedOption.priceModifier) * quantity;
              }
            }
          });
        }
        
        // If we have stored totalPrice, use it; otherwise calculate
        const totalPrice = storedTotalPrice || (designPrice + fabricPrice + variantModifier);
        const unitPrice = totalPrice / quantity;
        
        return {
          basePrice: designPrice,
          fabricPrice: fabricPrice,
          variantModifier: variantModifier,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
        };
      }
      
      // From product detail - calculate from product data
      if (productData && fabricPricePerMeter !== undefined && fabricQuantity !== undefined) {
        const designPrice = Number(productData.designPrice) || 0;
        const baseFabricPrice = Number(fabricPricePerMeter) || 0;
        const quantity = fabricQuantity || 1;
        
        // Calculate variant modifiers from product variants
        let variantModifier = 0;
        if (productData.variants && selectedVariants) {
          productData.variants.forEach((variant: any) => {
            const selectedOptionId = selectedVariants[String(variant.id)];
            if (selectedOptionId && variant.options) {
              const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
              if (selectedOption && selectedOption.priceModifier) {
                variantModifier += Number(selectedOption.priceModifier) * quantity;
              }
            }
          });
        }
        
        // Fabric variants modifiers (if any)
        let fabricVariantModifier = 0;
        // Note: Fabric variant modifiers would need fabric product data
        
        const fabricTotalPrice = baseFabricPrice * quantity;
        const totalPrice = designPrice + fabricTotalPrice + variantModifier;
        const unitPrice = totalPrice / quantity;
        
        return {
          basePrice: designPrice,
          fabricPrice: fabricTotalPrice,
          fabricBasePricePerMeter: baseFabricPrice,
          variantModifier: variantModifier,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
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
                    × {breakdown.quantity} {item.productType === 'DESIGNED' ? 'meter' : item.productType === 'PLAIN' ? getUnitName() : 'item'}{breakdown.quantity !== 1 ? 's' : ''}
                  </span>
                )}
              </h4>
            </div>
            
            {item.productType === 'DESIGNED' && breakdown.basePrice !== undefined && (
              <>
                <div className="space-y-4">
                  {/* Horizontal Price Breakdown */}
                  <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap">
                    {/* Print Price */}
                    <div className="flex flex-col">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Print Price</p>
                      <span className="font-semibold text-base sm:text-lg text-primary">{format(breakdown.basePrice)}</span>
                    </div>
                    
                    {/* Plus Sign */}
                    {breakdown.fabricPrice !== undefined && (
                      <>
                        <span className="text-2xl sm:text-3xl text-muted-foreground font-light mt-4">+</span>
                        
                        {/* Fabric Price */}
                        <div className="flex flex-col">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Fabric Price</p>
                          <div className="flex flex-col">
                            <span className="font-semibold text-base sm:text-lg text-primary">
                              {format(breakdown.fabricPrice)}
                            </span>
                            {breakdown.fabricBasePricePerMeter !== undefined && finalFabricPricePerMeter !== undefined && finalFabricPricePerMeter !== breakdown.fabricBasePricePerMeter && (
                              <span className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 leading-tight">
                                @ {format(finalFabricPricePerMeter)}/meter (slab pricing)
                              </span>
                            )}
                            {breakdown.fabricBasePricePerMeter !== undefined && (!finalFabricPricePerMeter || finalFabricPricePerMeter === breakdown.fabricBasePricePerMeter) && (
                              <span className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 leading-tight">
                                @ {format(breakdown.fabricBasePricePerMeter)}/meter × {breakdown.quantity} meter{breakdown.quantity !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Variant Modifiers with Plus */}
                    {breakdown.variantModifier !== undefined && breakdown.variantModifier > 0 && (
                      <>
                        <span className="text-2xl sm:text-3xl text-muted-foreground font-light mt-4">+</span>
                        <div className="flex flex-col">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Variant Modifiers</p>
                          <span className="font-semibold text-base sm:text-lg text-primary">{format(breakdown.variantModifier)}</span>
                        </div>
                      </>
                    )}
                    
                    {/* Equals Sign and Total */}
                    <span className="text-2xl sm:text-3xl text-muted-foreground font-light mt-4">=</span>
                    <div className="flex flex-col">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total</p>
                      <span className="font-bold text-lg sm:text-xl text-primary">{format(breakdown.totalPrice)}</span>
                    </div>
                  </div>
                  
                  {/* Discount from Slabs */}
                  {discountAmount !== undefined && discountAmount > 0 && (
                    <div className="flex justify-between items-center py-2 bg-green-50 dark:bg-green-950/20 rounded-md px-3 border border-green-200 dark:border-green-900/30 mt-3">
                      <span className="text-green-700 dark:text-green-400 font-medium text-sm">Discount Applied</span>
                      <span className="font-semibold text-sm text-green-700 dark:text-green-400">
                        -{format(discountAmount)}
                      </span>
                    </div>
                  )}
                  
                  {/* Unit Price Info */}
                  {breakdown.quantity > 1 && (
                    <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/50 mt-3">
                      Unit Price: {format(breakdown.unitPrice || 0)}/meter
                    </div>
                  )}
                </div>
              </>
            )}
            
            {item.productType === 'PLAIN' && (
              <>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">Base Price {getUnitExtension()}</span>
                    <span className="font-semibold text-base">{format(breakdown.basePrice)}</span>
                  </div>
                  
                  {breakdown.variantModifier !== undefined && breakdown.variantModifier !== 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground font-medium">Variant Modifiers</span>
                      <span className="font-semibold text-base text-primary">
                        {breakdown.variantModifier > 0 ? '+' : ''}{format(breakdown.variantModifier)}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t-2 border-primary/20 pt-3 mt-3 flex justify-between items-center bg-primary/5 dark:bg-primary/10 rounded-lg px-4 py-3">
                    <span className="font-bold text-lg">Total Amount</span>
                    <span className="font-bold text-xl text-primary">{format(breakdown.totalPrice)}</span>
                  </div>
                  
                  {breakdown.quantity > 1 && (
                    <div className="text-center text-xs text-muted-foreground pt-2">
                      Price: {format(breakdown.pricePerMeter || 0)}/{getUnitName()} × {breakdown.quantity} {getUnitName()}{breakdown.quantity !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </>
            )}
            
            {item.productType === 'DIGITAL' && (
              <>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground font-medium">Base Price</span>
                    <span className="font-semibold text-base">{format(breakdown.basePrice)}</span>
                  </div>
                  
                  <div className="border-t-2 border-primary/20 pt-3 mt-3 flex justify-between items-center bg-primary/5 dark:bg-primary/10 rounded-lg px-4 py-3">
                    <span className="font-bold text-lg">Total Amount</span>
                    <span className="font-bold text-xl text-primary">{format(breakdown.totalPrice)}</span>
                  </div>
                  
                  {breakdown.quantity > 1 && (
                    <div className="text-center text-xs text-muted-foreground pt-2">
                      Quantity: {breakdown.quantity} item{breakdown.quantity !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </>
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
