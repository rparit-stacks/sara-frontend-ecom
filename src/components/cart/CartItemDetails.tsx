import { useQuery } from '@tanstack/react-query';
import { productsApi, customConfigApi } from '@/lib/api';
import { usePrice } from '@/lib/currency';
import { Loader2, FileText, ExternalLink } from 'lucide-react';

interface CartItemDetailsProps {
  item: {
    productType: string;
    productId: number;
    fabricId?: number;
    quantity: number;
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
  // Remove 'field-' prefix if present
  const cleaned = key.replace(/^field-/, '');
  // Convert camelCase or snake_case to Title Case
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

// Helper function to check if value is a URL or data URI (base64)
const isUrl = (value: any): boolean => {
  if (typeof value !== 'string') return false;
  // Check for data URLs (base64 images/files)
  if (value.startsWith('data:')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// Helper function to map field IDs to labels
const getFieldLabel = (fieldId: string, fields: any[]): string => {
  const field = fields.find((f: any) => String(f.id) === fieldId);
  return field?.label || field?.name || formatFieldName(fieldId);
};

export const CartItemDetails = ({ item }: CartItemDetailsProps) => {
  const isCustom = item.productType === 'CUSTOM';
  const { format } = usePrice();

  // Fetch print product details (DESIGNED products)
  const { data: printProductData, isLoading: printProductLoading } = useQuery({
    queryKey: ['print-product-details', item.productId],
    queryFn: () => productsApi.getById(item.productId),
    enabled: item.productType === 'DESIGNED' && !!item.productId,
  });

  // Fetch fabric details for print products (DESIGNED or CUSTOM with fabric)
  const { data: fabricData, isLoading: fabricLoading } = useQuery({
    queryKey: ['fabric-details', item.fabricId],
    queryFn: () => productsApi.getById(item.fabricId!),
    enabled: !!item.fabricId && (item.productType === 'DESIGNED' || isCustom),
  });

  // Fetch custom config for CUSTOM products (has form field labels)
  const { data: customConfig } = useQuery({
    queryKey: ['customConfig'],
    queryFn: () => customConfigApi.getPublicConfig(),
    enabled: isCustom,
  });

  if ((fabricLoading || printProductLoading) && (item.productType === 'DESIGNED' || isCustom)) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Loading details...</span>
      </div>
    );
  }

  const isPrintProduct = item.productType === 'DESIGNED' || isCustom;
  const totalMeters = item.quantity; // Always use cart item quantity as source of truth

  // For CUSTOM: combine config form fields + fabric custom fields for label lookup
  const configFormFields = (customConfig?.formFields || []).map((f: any) => ({
    id: String(f.id ?? f.frontendId ?? ''),
    label: f.label || f.name,
    name: f.name || f.label,
  })).filter((f: any) => f.id);

  // Deduplicate entries with same URL value (user added 1 image, avoid showing 2)
  const dedupeByUrl = (entries: [string, any][]): [string, any][] => {
    const seenUrls = new Set<string>();
    return entries.filter(([key, value]) => {
      const isFileUrl = isUrl(value) || (typeof value === 'string' && value.startsWith('data:'));
      if (isFileUrl) {
        const url = String(value).trim();
        if (seenUrls.has(url)) return false;
        seenUrls.add(url);
      }
      return true;
    });
  };

  // Get fabric custom field IDs
  const fabricFieldIds = new Set(
    (fabricData?.customFields || []).map((f: any) => String(f.id))
  );

  // Get print custom field IDs
  const printFieldIds = new Set(
    (printProductData?.customFields || []).map((f: any) => String(f.id))
  );

  // Separate custom form data into fabric and print
  const fabricCustomFields: Record<string, any> = {};
  const printCustomFields: Record<string, any> = {};

  Object.entries(item.customFormData || {}).forEach(([key, value]) => {
    // Skip internal fields
    if (key === 'fabricMeters' || key.startsWith('_')) return;
    // Skip null/undefined/empty values
    if (value === null || value === undefined) return;
    if (typeof value === 'string' && value.trim() === '') return;
    
    if (fabricFieldIds.has(key)) {
      fabricCustomFields[key] = value;
    } else if (printFieldIds.has(key)) {
      printCustomFields[key] = value;
    } else {
      // Fallback: if can't determine, assume print
      printCustomFields[key] = value;
    }
  });

  // Get fabric variant IDs
  const fabricVariantIds = new Set(
    (fabricData?.variants || []).map((v: any) => String(v.id))
  );

  // Get print variant IDs  
  const printVariantIds = new Set(
    (printProductData?.variants || []).map((v: any) => String(v.id))
  );

  // Get config variant IDs for CUSTOM products
  const configVariantIds = new Set(
    (customConfig?.variants || []).map((v: any) => String(v.id))
  );

  // Separate variant selections into fabric, print, and config variants
  const fabricVariants: any[] = [];
  const printVariants: any[] = [];
  const configVariants: any[] = [];

  Object.entries(item.variantSelections || {}).forEach(([key, selection]: [string, any]) => {
    const variantId = selection.variantId || key;
    
    if (fabricVariantIds.has(String(variantId))) {
      fabricVariants.push([key, selection]);
    } else if (printVariantIds.has(String(variantId))) {
      printVariants.push([key, selection]);
    } else if (configVariantIds.has(String(variantId))) {
      // Config variants for CUSTOM products
      configVariants.push([key, selection]);
    } else {
      // Fallback: assume config/print
      configVariants.push([key, selection]);
    }
  });

  // For non-print products, get all variants and custom fields
  const allVariantEntries = item.variantSelections 
    ? Object.entries(item.variantSelections)
    : item.variants 
    ? Object.entries(item.variants).map(([key, value]) => [key, { optionValue: value }])
    : [];

  const allCustomFormEntries = item.customFormData 
    ? Object.entries(item.customFormData).filter(([key, value]) => {
        if (key === 'fabricMeters' || key.startsWith('_')) return false;
        if (value === null || value === undefined) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        return true;
      })
    : [];

  return (
    <div className="space-y-3 mt-2">
      {/* FABRIC SECTION - For print products (DESIGNED/CUSTOM) */}
      {isPrintProduct && fabricData && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-foreground border-b border-border pb-1">
            Fabric Details
          </div>
          
          {/* Fabric Name */}
          <div className="text-xs sm:text-sm pl-2">
            <span className="text-muted-foreground">Name: </span>
            <span className="font-medium text-foreground">{fabricData.name}</span>
          </div>
          
          {/* Fabric Variants */}
          {fabricVariants.length > 0 && (
            <div className="pl-2 space-y-0.5">
              <div className="text-xs text-muted-foreground">Variants:</div>
              {fabricVariants.map(([key, selection]: [string, any]) => (
                <div key={key} className="text-xs sm:text-sm pl-2">
                  <span className="text-muted-foreground">
                    {selection.variantName || 'Variant'}:{' '}
                  </span>
                  <span className="font-medium text-foreground">
                    {selection.optionName || selection.optionValue || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* Fabric Custom Fields */}
          {Object.keys(fabricCustomFields).length > 0 && (
            <div className="pl-2 space-y-0.5">
              <div className="text-xs text-muted-foreground">Custom Details:</div>
              {dedupeByUrl(Object.entries(fabricCustomFields)).map(([fieldKey, value]) => {
                const isUrlValue = isUrl(value);
                // Backend sends labels as keys; fallback to getFieldLabel for legacy ID keys
                const displayLabel = /^\d+$/.test(fieldKey)
                  ? getFieldLabel(fieldKey, isCustom ? [...configFormFields, ...(fabricData?.customFields || [])] : (fabricData?.customFields || []))
                  : fieldKey;
                return (
                  <div key={fieldKey} className="text-xs sm:text-sm pl-2">
                    <span className="text-muted-foreground">
                      {displayLabel}:{' '}
                    </span>
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
                      <span className="font-medium text-foreground">
                        {formatFieldValue(value)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Meters */}
          <div className="text-xs sm:text-sm pl-2">
            <span className="text-muted-foreground">Meters: </span>
            <span className="font-medium text-foreground">{totalMeters} m</span>
          </div>
        </div>
      )}
      
      {/* PRINT SECTION - For print products (DESIGNED) */}
      {isPrintProduct && printProductData && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-foreground border-b border-border pb-1">
            Print Details
          </div>
          
          {/* Print Variants */}
          {printVariants.length > 0 && (
            <div className="pl-2 space-y-0.5">
              <div className="text-xs text-muted-foreground">Variants:</div>
              {printVariants.map(([key, selection]: [string, any]) => (
                <div key={key} className="text-xs sm:text-sm pl-2">
                  <span className="text-muted-foreground">
                    {selection.variantName || 'Variant'}:{' '}
                  </span>
                  <span className="font-medium text-foreground">
                    {selection.optionName || selection.optionValue || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* Print Custom Fields */}
          {Object.keys(printCustomFields).length > 0 && (
            <div className="pl-2 space-y-0.5">
              <div className="text-xs text-muted-foreground">Custom Details:</div>
              {dedupeByUrl(Object.entries(printCustomFields)).map(([fieldKey, value]) => {
                const isUrlValue = isUrl(value);
                // Backend sends labels as keys; fallback to getFieldLabel for legacy ID keys
                const fieldsForLabel = isCustom ? [...configFormFields, ...(fabricData?.customFields || [])] : (printProductData?.customFields || []);
                const displayLabel = /^\d+$/.test(fieldKey) ? getFieldLabel(fieldKey, fieldsForLabel) : fieldKey;
                return (
                  <div key={fieldKey} className="text-xs sm:text-sm pl-2">
                    <span className="text-muted-foreground">
                      {displayLabel}:{' '}
                    </span>
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
                      <span className="font-medium text-foreground">
                        {formatFieldValue(value)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONFIG OPTIONS SECTION - For CUSTOM products (config variants like Size) */}
      {isCustom && configVariants.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-foreground border-b border-border pb-1">
            Selected Options
          </div>
          <div className="pl-2 space-y-0.5">
            {configVariants.map(([key, selection]: [string, any]) => (
              <div key={key} className="text-xs sm:text-sm">
                <span className="text-muted-foreground">
                  {selection.variantName || 'Option'}:{' '}
                </span>
                <span className="font-medium text-foreground">
                  {selection.optionName || selection.optionValue || 'N/A'}
                  {selection.priceModifier != null && selection.priceModifier !== 0 && (
                    <span className="text-muted-foreground ml-1">
                      ({selection.priceModifier > 0 ? '+' : ''}{format(selection.priceModifier)})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUSTOM PRODUCT - Custom Form Data */}
      {isCustom && Object.keys(printCustomFields).length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-foreground border-b border-border pb-1">
            Additional Information
          </div>
          <div className="pl-2 space-y-0.5">
            {dedupeByUrl(Object.entries(printCustomFields)).map(([fieldKey, value]) => {
              const isUrlValue = isUrl(value);
              // Use config form fields for label lookup
              const fieldsForLabel = [...configFormFields, ...(fabricData?.customFields || [])];
              const displayLabel = /^\d+$/.test(fieldKey) ? getFieldLabel(fieldKey, fieldsForLabel) : fieldKey;
              return (
                <div key={fieldKey} className="text-xs sm:text-sm">
                  <span className="text-muted-foreground">
                    {displayLabel}:{' '}
                  </span>
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
                    <span className="font-medium text-foreground">
                      {formatFieldValue(value)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CUSTOM PRODUCT - Uploaded Design */}
      {isCustom && item.uploadedDesignUrl && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-foreground border-b border-border pb-1">
            Design Details
          </div>
          <div className="text-xs sm:text-sm pl-2">
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
        </div>
      )}

      {/* NON-PRINT PRODUCTS (PLAIN, DIGITAL) - Show variants and custom fields */}
      {!isPrintProduct && (
        <>
          {/* Variants */}
          {allVariantEntries.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-foreground border-b border-border pb-1">
                Variants
              </div>
              {allVariantEntries.map(([key, selection]: [string, any]) => (
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

          {/* Custom Form Fields (PLAIN, DIGITAL) */}
          {allCustomFormEntries.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-foreground border-b border-border pb-1">
                Custom Details
              </div>
              {dedupeByUrl(allCustomFormEntries).map(([key, value]) => {
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
        </>
      )}

      {/* Pricing for CUSTOM: design + fabric */}
      {isCustom && (item.designPrice != null || item.fabricPrice != null) && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-foreground border-b border-border pb-1">
            Pricing Breakdown
          </div>
          {item.designPrice != null && (
            <div className="text-xs sm:text-sm pl-2">
              <span className="text-muted-foreground">Design: </span>
              <span className="font-medium text-foreground">{format(Number(item.designPrice))}</span>
            </div>
          )}
          {item.fabricPrice != null && (
            <div className="text-xs sm:text-sm pl-2">
              <span className="text-muted-foreground">Fabric: </span>
              <span className="font-medium text-foreground">{format(Number(item.fabricPrice))}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CartItemDetails;
