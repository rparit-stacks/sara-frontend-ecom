import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { usePrice } from '@/lib/currency';
import { Loader2, FileText, ExternalLink } from 'lucide-react';

interface WishlistItemDetailsProps {
  item: {
    productType: string;
    productId: number;
    fabricId?: number;
    quantity?: number;
    variants?: Record<string, string>;
    variantSelections?: Record<string, { variantName?: string; optionValue?: string; optionName?: string }>;
    customFormData?: Record<string, any>;
    designPrice?: number;
    fabricPrice?: number;
    uploadedDesignUrl?: string;
  };
}

// Helper function to format field names
const formatFieldName = (key: string): string => {
  const cleaned = key.replace(/^field-/, '');
  return cleaned
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
};

// Helper function to format field values
const formatFieldValue = (value: any): string => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

// Helper function to check if value is a URL
const isUrl = (value: any): boolean => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const WishlistItemDetails = ({ item }: WishlistItemDetailsProps) => {
  const isCustom = item.productType === 'CUSTOM';
  const { format } = usePrice();

  // Fetch fabric details for print products (DESIGNED or CUSTOM with fabric)
  const { data: fabricData, isLoading: fabricLoading } = useQuery({
    queryKey: ['fabric-details', item.fabricId],
    queryFn: () => productsApi.getById(item.fabricId!),
    enabled: !!item.fabricId && (item.productType === 'DESIGNED' || isCustom),
  });

  if (fabricLoading && (item.productType === 'DESIGNED' || isCustom) && item.fabricId) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Loading details...</span>
      </div>
    );
  }

  const isPrintProduct = item.productType === 'DESIGNED' || isCustom;
  const fabricMeters = (item as any).customFormData?.fabricMeters;
  const totalMeters = typeof fabricMeters === 'number' && fabricMeters > 0 ? fabricMeters : item.quantity || 1;

  // Get variant selections to display
  const variantEntries = item.variantSelections 
    ? Object.entries(item.variantSelections)
    : item.variants 
    ? Object.entries(item.variants).map(([key, value]) => [key, { optionValue: value }])
    : [];

  // Get custom form data entries (excluding internal fields)
  const customFormEntries = item.customFormData 
    ? Object.entries(item.customFormData).filter(([key]) => 
        key !== 'fabricMeters' && !key.startsWith('_')
      )
    : [];

  return (
    <div className="space-y-1.5 mt-2">
      {/* Print product (DESIGNED/CUSTOM): fabric name + total meters */}
      {isPrintProduct && fabricData && (
        <>
          <div className="text-xs sm:text-sm">
            <span className="text-muted-foreground">Fabric: </span>
            <span className="font-medium text-foreground">{fabricData.name}</span>
          </div>
          <div className="text-xs sm:text-sm">
            <span className="text-muted-foreground">Meters: </span>
            <span className="font-medium text-foreground">{totalMeters} m</span>
          </div>
        </>
      )}

      {/* Quantity for non-print products */}
      {!isPrintProduct && item.quantity && (
        <div className="text-xs sm:text-sm">
          <span className="text-muted-foreground">Quantity: </span>
          <span className="font-medium text-foreground">{item.quantity}</span>
        </div>
      )}

      {/* Variants */}
      {variantEntries.length > 0 && (
        <div className="space-y-0.5 pt-1">
          <div className="text-xs font-medium text-muted-foreground">Variants:</div>
          {variantEntries.map(([key, selection]: [string, any]) => (
            <div key={key} className="text-xs sm:text-sm pl-2">
              <span className="text-muted-foreground">
                {selection.variantName || formatFieldName(key)}:{' '}
              </span>
              <span className="font-medium text-foreground">
                {selection.optionName || selection.optionValue || 'N/A'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Custom Form Fields */}
      {customFormEntries.length > 0 && (
        <div className="space-y-0.5 pt-1">
          <div className="text-xs font-medium text-muted-foreground">Custom Details:</div>
          {customFormEntries.map(([key, value]) => {
            const isUrlValue = isUrl(value);
            return (
              <div key={key} className="text-xs sm:text-sm pl-2">
                <span className="text-muted-foreground">{formatFieldName(key)}: </span>
                {isUrlValue ? (
                  <a 
                    href={value as string} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    View File
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <span className="font-medium text-foreground">{formatFieldValue(value)}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Uploaded Design URL (for CUSTOM products) */}
      {item.uploadedDesignUrl && (
        <div className="text-xs sm:text-sm pt-1">
          <span className="text-muted-foreground">Uploaded Design: </span>
          <a 
            href={item.uploadedDesignUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            View Design
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      )}

      {/* Pricing for CUSTOM: design + fabric */}
      {isCustom && (item.designPrice != null || item.fabricPrice != null) && (
        <div className="space-y-0.5 text-xs sm:text-sm pt-1">
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
    </div>
  );
};

export default WishlistItemDetails;
