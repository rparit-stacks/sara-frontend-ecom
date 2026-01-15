import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface CartItemDetailsProps {
  item: {
    productType: string;
    productId: number;
    fabricId?: number;
    quantity: number;
    variants?: Record<string, string>;
  };
}

export const CartItemDetails = ({ item }: CartItemDetailsProps) => {
  // Fetch product details to get variant names
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['product-details', item.productId],
    queryFn: () => productsApi.getById(item.productId),
    enabled: !!item.productId,
  });

  // Fetch fabric details if it's a DESIGNED product
  const { data: fabricData, isLoading: fabricLoading } = useQuery({
    queryKey: ['fabric-details', item.fabricId],
    queryFn: () => productsApi.getById(item.fabricId!),
    enabled: !!item.fabricId && item.productType === 'DESIGNED',
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

  // Get fabric variant display names
  const getFabricVariantDisplay = () => {
    if (!item.variants || !fabricData?.variants || item.productType !== 'DESIGNED') return null;

    const variantDisplays: string[] = [];
    
    fabricData.variants.forEach((variant: any) => {
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

  const productVariantDisplays = getProductVariantDisplay();
  const fabricVariantDisplays = getFabricVariantDisplay();

  return (
    <div className="space-y-1.5 mt-2">
      {/* Fabric Name for DESIGNED products */}
      {item.productType === 'DESIGNED' && fabricData && (
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

      {item.productType === 'DESIGNED' && (
        <div className="text-xs sm:text-sm">
          <span className="text-muted-foreground">Fabric Quantity: </span>
          <span className="font-medium text-foreground">{item.quantity} meter{item.quantity !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Fabric Variant Names (for DESIGNED products) */}
      {fabricVariantDisplays && fabricVariantDisplays.length > 0 && (
        <div className="space-y-0.5 pl-2 border-l-2 border-primary/20">
          <div className="text-[10px] sm:text-xs text-muted-foreground/70 uppercase tracking-wide font-medium mt-1">
            Fabric Variants:
          </div>
          {fabricVariantDisplays.map((display, index) => (
            <div key={index} className="text-xs sm:text-sm">
              <span className="text-muted-foreground">{display}</span>
            </div>
          ))}
        </div>
      )}

      {/* Product Variant Names */}
      {productVariantDisplays && productVariantDisplays.length > 0 && (
        <div className="space-y-0.5">
          {fabricVariantDisplays && fabricVariantDisplays.length > 0 && (
            <div className="text-[10px] sm:text-xs text-muted-foreground/70 uppercase tracking-wide font-medium mt-1">
              Product Variants:
            </div>
          )}
          {productVariantDisplays.map((display, index) => (
            <div key={index} className="text-xs sm:text-sm">
              <span className="text-muted-foreground">{display}</span>
            </div>
          ))}
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
