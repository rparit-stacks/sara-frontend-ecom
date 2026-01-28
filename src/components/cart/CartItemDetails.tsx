import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { usePrice } from '@/lib/currency';
import { Loader2 } from 'lucide-react';

interface CartItemDetailsProps {
  item: {
    productType: string;
    productId: number;
    fabricId?: number;
    quantity: number;
    variants?: Record<string, string>;
    variantSelections?: Record<string, { variantName?: string; optionValue?: string }>;
    customFormData?: Record<string, any>;
    designPrice?: number;
    fabricPrice?: number;
    uploadedDesignUrl?: string;
  };
}

export const CartItemDetails = ({ item }: CartItemDetailsProps) => {
  const isCustom = item.productType === 'CUSTOM';
  const { format } = usePrice();

  // Fetch product details (skip for CUSTOM - catalog product not used)
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['product-details', item.productId],
    queryFn: () => productsApi.getById(item.productId),
    enabled: !!item.productId && !isCustom,
  });

  // Fetch fabric details for DESIGNED or CUSTOM with fabricId
  const { data: fabricData, isLoading: fabricLoading } = useQuery({
    queryKey: ['fabric-details', item.fabricId],
    queryFn: () => productsApi.getById(item.fabricId!),
    enabled: !!item.fabricId && (item.productType === 'DESIGNED' || isCustom),
  });

  if (productLoading || fabricLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Loading details...</span>
      </div>
    );
  }

  // Get product variant display names
  const getProductVariantDisplay = () => {
    if (!item.variants || !productData?.variants) return null;

    const variantDisplays: string[] = [];
    
    productData.variants.forEach((variant: any) => {
      const selectedValue = item.variants[String(variant.id)];
      if (selectedValue && variant.options) {
        // Try to find option by ID or value
        const selectedOption = variant.options.find((opt: any) => 
          String(opt.id) === selectedValue || opt.value === selectedValue
        );
        if (selectedOption) {
          variantDisplays.push(`${variant.name}: ${selectedOption.value}`);
        } else {
          // Fallback to just show the value
          variantDisplays.push(`${variant.name}: ${selectedValue}`);
        }
      }
    });

    return variantDisplays.length > 0 ? variantDisplays : null;
  };

  // Get fabric variant display names (DESIGNED or CUSTOM with fabric)
  const getFabricVariantDisplay = () => {
    if (!fabricData?.variants || (item.productType !== 'DESIGNED' && !isCustom)) return null;
    const v = item.variants;
    if (!v || !Object.keys(v).length) return null;

    const variantDisplays: string[] = [];
    fabricData.variants.forEach((variant: any) => {
      const selectedValue = v[String(variant.id)];
      if (selectedValue && variant.options) {
        const selectedOption = variant.options.find((opt: any) =>
          String(opt.id) === selectedValue || opt.value === selectedValue
        );
        if (selectedOption) {
          variantDisplays.push(`${variant.name}: ${selectedOption.value}`);
        } else {
          variantDisplays.push(`${variant.name}: ${selectedValue}`);
        }
      }
    });

    return variantDisplays.length > 0 ? variantDisplays : null;
  };

  // Variant display from structured variantSelections (CUSTOM and DESIGNED)
  const variantSelectionsDisplays = (() => {
    const vs = item.variantSelections;
    if (!vs || !Object.keys(vs).length) return null;
    const arr = Object.values(vs)
      .filter((s): s is { variantName?: string; optionValue?: string } => s != null && (s.variantName != null || s.optionValue != null))
      .map((s) => `${s.variantName ?? 'Option'}: ${s.optionValue ?? ''}`)
      .filter(Boolean);
    return arr.length > 0 ? arr : null;
  })();

  const productVariantDisplays = getProductVariantDisplay();
  const fabricVariantDisplays = getFabricVariantDisplay();
  const showVariantSelections = !!variantSelectionsDisplays?.length;

  return (
    <div className="space-y-1.5 mt-2">
      {/* Fabric Name for DESIGNED / CUSTOM */}
      {(item.productType === 'DESIGNED' || isCustom) && fabricData && (
        <div className="text-xs sm:text-sm">
          <span className="text-muted-foreground">Fabric: </span>
          <span className="font-medium text-foreground">{fabricData.name}</span>
        </div>
      )}

      {/* Quantity/Meters */}
      {item.productType === 'PLAIN' && (
        <div className="text-xs sm:text-sm">
          <span className="text-muted-foreground">Quantity: </span>
          <span className="font-medium text-foreground">{item.quantity} meter{item.quantity !== 1 ? 's' : ''}</span>
        </div>
      )}

      {(item.productType === 'DESIGNED' || isCustom) && (() => {
        const fabricMeters = (item as any).customFormData?.fabricMeters;
        return (
          <>
            {typeof fabricMeters === 'number' && fabricMeters > 0 && (
              <div className="text-xs sm:text-sm">
                <span className="text-muted-foreground">Fabric: </span>
                <span className="font-medium text-foreground">{fabricMeters} meter{fabricMeters !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="text-xs sm:text-sm">
              <span className="text-muted-foreground">Quantity: </span>
              <span className="font-medium text-foreground">{item.quantity} unit{item.quantity !== 1 ? 's' : ''}</span>
            </div>
          </>
        );
      })()}

      {/* Pricing for CUSTOM: design + fabric */}
      {isCustom && (item.designPrice != null || item.fabricPrice != null) && (
        <div className="space-y-0.5 text-xs sm:text-sm">
          {item.designPrice != null && (
            <div>
              <span className="text-muted-foreground">Design: </span>
              <span className="font-medium text-foreground">{format(Number(item.designPrice))}</span>
            </div>
          )}
          {item.fabricPrice != null && (
            <div>
              <span className="text-muted-foreground">Fabric: </span>
              <span className="font-medium text-foreground">{format(Number(item.fabricPrice))}</span>
            </div>
          )}
        </div>
      )}

      {/* Selected Variant – Fabric (DESIGNED/CUSTOM) and/or Product variants, or variantSelections */}
      {((fabricVariantDisplays?.length ?? 0) > 0 || (productVariantDisplays?.length ?? 0) > 0 || showVariantSelections) ? (
        <div className="space-y-1">
          <div className="text-[10px] sm:text-xs text-muted-foreground/70 uppercase tracking-wide font-medium mt-1">
            Selected Variant
          </div>
          {fabricVariantDisplays && fabricVariantDisplays.length > 0 && (
            <div className="space-y-0.5 pl-2 border-l-2 border-primary/20">
              {fabricVariantDisplays.map((display, index) => (
                <div key={index} className="text-xs sm:text-sm">
                  <span className="text-muted-foreground">{display}</span>
                </div>
              ))}
            </div>
          )}
          {productVariantDisplays && productVariantDisplays.length > 0 && (
            <div className="space-y-0.5">
              {productVariantDisplays.map((display, index) => (
                <div key={index} className="text-xs sm:text-sm">
                  <span className="text-muted-foreground">{display}</span>
                </div>
              ))}
            </div>
          )}
          {showVariantSelections && variantSelectionsDisplays?.map((display, index) => (
            <div key={index} className="text-xs sm:text-sm">
              <span className="text-muted-foreground">{display}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Selected Custom Field */}
      {item.customFormData && Object.keys(item.customFormData).length > 0 && (
        <div className="space-y-0.5 mt-1.5">
          <div className="text-[10px] sm:text-xs text-muted-foreground/70 uppercase tracking-wide font-medium">
            Selected Custom Field
          </div>
          {Object.entries(item.customFormData).map(([key, value]) => {
            if (value == null || value === '') return null;
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
            return (
              <div key={key} className="text-xs sm:text-sm">
                <span className="text-muted-foreground">{label}: </span>
                <span className="font-medium text-foreground">{String(value)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* If no variants but quantity exists for DIGITAL products */}
      {!productVariantDisplays && !fabricVariantDisplays && item.quantity > 1 && item.productType === 'DIGITAL' && (
        <div className="text-xs sm:text-sm">
          <span className="text-muted-foreground">Quantity: </span>
          <span className="font-medium text-foreground">{item.quantity}</span>
        </div>
      )}
    </div>
  );
};

export default CartItemDetails;
