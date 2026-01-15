import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calculator, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';

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
  };
  selectedVariants?: Record<string, string>;
  fabricQuantity?: number;
  fabricPricePerMeter?: number;
  selectedFabricVariants?: Record<string, string>;
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
}: PriceBreakdownPopupProps) => {
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
          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {item.productName}
            </h4>
            
            {item.productType === 'DESIGNED' && breakdown.basePrice !== undefined && (
              <>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Design Price</span>
                    <span className="font-medium">₹{breakdown.basePrice.toLocaleString('en-IN')}</span>
                  </div>
                  
                  {breakdown.fabricPrice !== undefined && (
                    <>
                      {breakdown.fabricBasePricePerMeter !== undefined && (
                        <div className="flex justify-between text-xs text-muted-foreground pl-4">
                          <span>Fabric (₹{breakdown.fabricBasePricePerMeter.toLocaleString('en-IN')}/meter)</span>
                          <span>× {breakdown.quantity} meter{breakdown.quantity !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fabric Price</span>
                        <span className="font-medium">₹{breakdown.fabricPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                  
                  {breakdown.variantModifier !== undefined && breakdown.variantModifier > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Variant Modifiers</span>
                      <span className="font-medium text-primary">+₹{breakdown.variantModifier.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit Price</span>
                      <span className="font-medium">₹{breakdown.unitPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-medium">{breakdown.quantity}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2 mt-2 flex justify-between items-center">
                    <span className="font-semibold text-base">Total</span>
                    <span className="font-bold text-lg text-primary">₹{breakdown.totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </>
            )}
            
            {item.productType === 'PLAIN' && (
              <>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price per Meter</span>
                    <span className="font-medium">₹{breakdown.basePrice.toLocaleString('en-IN')}</span>
                  </div>
                  
                  {breakdown.variantModifier !== undefined && breakdown.variantModifier !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Variant Modifiers</span>
                      <span className="font-medium text-primary">
                        {breakdown.variantModifier > 0 ? '+' : ''}₹{breakdown.variantModifier.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per Meter</span>
                      <span className="font-medium">₹{breakdown.pricePerMeter?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-medium">{breakdown.quantity} meter{breakdown.quantity !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2 mt-2 flex justify-between items-center">
                    <span className="font-semibold text-base">Total</span>
                    <span className="font-bold text-lg text-primary">₹{breakdown.totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </>
            )}
            
            {item.productType === 'DIGITAL' && (
              <>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price</span>
                    <span className="font-medium">₹{breakdown.basePrice.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-medium">{breakdown.quantity}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2 mt-2 flex justify-between items-center">
                    <span className="font-semibold text-base">Total</span>
                    <span className="font-bold text-lg text-primary">₹{breakdown.totalPrice.toLocaleString('en-IN')}</span>
                  </div>
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
