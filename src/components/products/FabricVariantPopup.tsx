import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Fabric } from './FabricSelectionPopup';
import { usePrice } from '@/lib/currency';
import { toast } from 'sonner';
import { customProductsApi } from '@/lib/api';

export interface FabricVariant {
  id: string;
  type: string;
  name: string;
  options: {
    id: string;
    value: string;
    priceModifier?: number;
  }[];
}

export interface FabricCustomField {
  id: number | string;
  label: string;
  fieldType?: string;
  placeholder?: string;
  required?: boolean;
}

interface FabricVariantPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fabric: Fabric | null;
  variants: FabricVariant[];
  customFields?: FabricCustomField[];
  onComplete: (data: {
    fabricId: string;
    selectedVariants: Record<string, string>;
    quantity: number;
    totalPrice: number;
    customFieldValues?: Record<string, string | number>;
  }) => void;
}

const FabricVariantPopup: React.FC<FabricVariantPopupProps> = ({
  open,
  onOpenChange,
  fabric,
  variants: propVariants,
  customFields = [],
  onComplete,
}) => {
  const { format } = usePrice();
  const variants = propVariants;
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    variants.forEach((variant) => {
      if (variant.options.length > 0) {
        initial[variant.id] = variant.options[0].id;
      }
    });
    return initial;
  });
  const [fabricCustomValues, setFabricCustomValues] = useState<Record<string, string>>({});
  const [uploadingCustomFieldId, setUploadingCustomFieldId] = useState<string | null>(null);
  const MAX_CUSTOM_FILE_MB = 10;
  const MAX_CUSTOM_FILE_BYTES = MAX_CUSTOM_FILE_MB * 1024 * 1024;

  useEffect(() => {
    if (open && customFields.length > 0) {
      setFabricCustomValues({});
    }
  }, [open, customFields.length]);

  // Calculate base price per meter with variant modifiers
  const pricePerMeter = useMemo(() => {
    if (!fabric) return 0;
    let basePrice = fabric.pricePerMeter;
    
    variants.forEach((variant) => {
      const selectedOptionId = selectedVariants[variant.id];
      const selectedOption = variant.options.find(opt => opt.id === selectedOptionId);
      if (selectedOption?.priceModifier) {
        basePrice += selectedOption.priceModifier;
      }
    });
    
    return basePrice;
  }, [fabric, selectedVariants, variants]);

  // 1-meter base: totalPrice is fabric price per meter (quantity always 1)
  const totalPrice = pricePerMeter;

  const handleVariantChange = (variantId: string, optionId: string) => {
    const isSelected = selectedVariants[variantId] === optionId;
    if (isSelected) {
      const next = { ...selectedVariants };
      delete next[variantId];
      setSelectedVariants(next);
    } else {
      setSelectedVariants({
        ...selectedVariants,
        [variantId]: optionId,
      });
    }
  };

  const fabricRequiredFilled = useMemo(() => {
    if (!customFields.length) return true;
    return customFields
      .filter((f) => f.required)
      .every((f) => {
        const id = String(f.id);
        const v = fabricCustomValues[id];
        return v != null && (typeof v !== 'string' || v.trim() !== '');
      });
  }, [customFields, fabricCustomValues]);

  const handleAddToCart = () => {
    if (!fabric) return;
    if (!fabricRequiredFilled) {
      toast.error('Please fill all required fields');
      return;
    }
    onComplete({
      fabricId: fabric.id,
      selectedVariants,
      quantity: 1,
      totalPrice,
      customFieldValues: customFields.length > 0 ? { ...fabricCustomValues } : undefined,
    });
    onOpenChange(false);
  };

  if (!fabric) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-b border-border flex-shrink-0">
          <DialogTitle className="font-medium text-base sm:text-lg md:text-xl flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg overflow-hidden flex-shrink-0">
              <img src={fabric.image} alt={fabric.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="break-words text-sm sm:text-base md:text-lg">{fabric.name}</div>
              <p className="text-[10px] sm:text-xs font-normal text-muted-foreground mt-0.5 sm:mt-1">
                Select variants (1 meter base)
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5">
          {/* Fabric Preview */}
          <div className="flex gap-2 sm:gap-3 items-center p-2.5 sm:p-3 bg-secondary/30 rounded-lg border border-border">
            <img
              src={fabric.image}
              alt={fabric.name}
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-xs sm:text-sm md:text-base truncate">{fabric.name}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Base Price: {format(fabric.pricePerMeter)}/meter</p>
            </div>
          </div>

          {/* Variant Selection */}
          {variants.length > 0 ? (
            variants.map((variant) => {
              const selectedOptionId = selectedVariants[variant.id];
              const selectedOption = variant.options.find(opt => opt.id === selectedOptionId);
              
              return (
                <div key={variant.id} className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm sm:text-base">
                      {variant.name}
                      {selectedOption && (
                        <span className="text-muted-foreground ml-1.5 sm:ml-2 text-xs sm:text-sm">
                          : {selectedOption.value}
                        </span>
                      )}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {variant.options.map((option) => {
                      const isSelected = selectedOptionId === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleVariantChange(variant.id, option.id)}
                          className={cn(
                            "px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-full border-2 transition-all text-[11px] sm:text-xs md:text-sm flex items-center gap-1 sm:gap-1.5",
                            isSelected
                              ? "border-[#2b9d8f] bg-[#2b9d8f]/10 text-[#2b9d8f]"
                              : "border-border hover:border-[#2b9d8f]/50"
                          )}
                        >
                          <span className="truncate">{option.value}</span>
                          {option.priceModifier && option.priceModifier > 0 && (
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap">
                              (+{format(option.priceModifier)})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 sm:p-5 md:p-6 bg-secondary/30 rounded-lg border border-border text-center">
              <p className="text-sm sm:text-base text-muted-foreground">
                This fabric has no variant options. You can proceed with the base fabric.
              </p>
            </div>
          )}

          {/* Fabric additional information (custom fields) */}
          {customFields.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border">
              <h4 className="font-medium text-sm sm:text-base">Additional information</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Please provide the following details for this fabric.
              </p>
              <div className="space-y-3">
                {customFields.map((field) => {
                  const id = String(field.id);
                  const value = fabricCustomValues[id] ?? '';
                  const isRequired = !!field.required;
                  return (
                    <div key={id} className="space-y-1.5">
                      <Label className="text-sm">
                        {field.label}
                        {isRequired && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {field.fieldType === 'image' ? (
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            disabled={uploadingCustomFieldId === id}
                            onChange={async (e) => {
                              const file = e.target.files?.[0] || null;
                              if (!file) return;
                              if (file.size > MAX_CUSTOM_FILE_BYTES) {
                                toast.error(`File must be ${MAX_CUSTOM_FILE_MB} MB or less.`);
                                e.target.value = '';
                                return;
                              }
                              if (!localStorage.getItem('authToken')) {
                                toast.error('Please sign in to upload files.');
                                e.target.value = '';
                                return;
                              }
                              setUploadingCustomFieldId(id);
                              try {
                                const uploaded = await customProductsApi.uploadMedia([file], 'products/custom-fields');
                                const url = uploaded?.[0]?.url ?? '';
                                setFabricCustomValues((prev) => ({ ...prev, [id]: url }));
                                if (url) toast.success('File uploaded.');
                              } catch (err: any) {
                                toast.error(err?.message || 'Upload failed.');
                                setFabricCustomValues((prev) => ({ ...prev, [id]: '' }));
                              } finally {
                                setUploadingCustomFieldId(null);
                              }
                            }}
                            className="h-10"
                          />
                          {value && (
                            <a
                              href={value}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary hover:underline inline-block"
                            >
                              View uploaded file
                            </a>
                          )}
                        </div>
                      ) : field.fieldType === 'number' ? (
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) => setFabricCustomValues((prev) => ({ ...prev, [id]: e.target.value }))}
                          placeholder={field.placeholder || ''}
                          required={isRequired}
                          className="h-10"
                        />
                      ) : (
                        <Input
                          type={field.fieldType === 'url' ? 'url' : 'text'}
                          value={value}
                          onChange={(e) => setFabricCustomValues((prev) => ({ ...prev, [id]: e.target.value }))}
                          placeholder={field.placeholder || ''}
                          required={isRequired}
                          className="h-10"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price summary: per meter only (1-meter base) */}
          <div className="p-2.5 sm:p-3 md:p-4 bg-[#2b9d8f]/5 rounded-lg border border-[#2b9d8f]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Fabric price per meter</p>
                <p className="text-lg sm:text-xl md:text-2xl font-semibold text-[#2b9d8f] mt-0.5 sm:mt-1">
                  {format(pricePerMeter)}/meter
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-t border-border flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 md:gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base">
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={customFields.length > 0 && !fabricRequiredFilled}
            className="bg-[#2b9d8f] hover:bg-[#238a7d] text-white gap-1.5 sm:gap-2 flex-1 sm:max-w-xs h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">Add to Cart</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FabricVariantPopup;
