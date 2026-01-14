import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, IndianRupee, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Fabric } from './FabricSelectionPopup';

export interface FabricVariant {
  id: string;
  type: string; // 'width', 'gsm', 'color', etc.
  name: string;
  options: {
    id: string;
    value: string;
    priceModifier?: number; // Additional price per meter
  }[];
}

interface FabricVariantPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fabric: Fabric | null;
  variants: FabricVariant[];
  onComplete: (data: {
    fabricId: string;
    selectedVariants: Record<string, string>;
    quantity: number;
    totalPrice: number;
  }) => void;
}

// Mock variants - in real app, fetch from API: GET /api/fabrics/{id}/variants
const getMockVariants = (): FabricVariant[] => [
  {
    id: 'v1',
    type: 'width',
    name: 'Width',
    options: [
      { id: 'w1', value: '45 inches', priceModifier: 0 },
      { id: 'w2', value: '54 inches', priceModifier: 20 },
      { id: 'w3', value: '60 inches', priceModifier: 40 },
    ],
  },
  {
    id: 'v2',
    type: 'gsm',
    name: 'GSM (Weight)',
    options: [
      { id: 'g1', value: '120 GSM', priceModifier: 0 },
      { id: 'g2', value: '150 GSM', priceModifier: 15 },
      { id: 'g3', value: '180 GSM', priceModifier: 30 },
    ],
  },
  {
    id: 'v3',
    type: 'color',
    name: 'Color',
    options: [
      { id: 'c1', value: 'Natural', priceModifier: 0 },
      { id: 'c2', value: 'Dyed', priceModifier: 10 },
    ],
  },
];

const FabricVariantPopup: React.FC<FabricVariantPopupProps> = ({
  open,
  onOpenChange,
  fabric,
  variants: propVariants,
  onComplete,
}) => {
  const variants = propVariants.length > 0 ? propVariants : getMockVariants();
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    variants.forEach((variant) => {
      if (variant.options.length > 0) {
        initial[variant.id] = variant.options[0].id;
      }
    });
    return initial;
  });
  const [quantity, setQuantity] = useState(1);

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

  // Calculate total price
  const totalPrice = useMemo(() => {
    return pricePerMeter * quantity;
  }, [pricePerMeter, quantity]);

  const handleVariantChange = (variantId: string, optionId: string) => {
    setSelectedVariants({
      ...selectedVariants,
      [variantId]: optionId,
    });
  };

  const handleAddToCart = () => {
    if (!fabric) return;
    
    onComplete({
      fabricId: fabric.id,
      selectedVariants,
      quantity,
      totalPrice,
    });
    
    onOpenChange(false);
  };

  if (!fabric) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex-shrink-0">
          <DialogTitle className="font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex-shrink-0">
              <img src={fabric.image} alt={fabric.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="break-words">{fabric.name}</div>
              <p className="text-xs sm:text-sm font-normal text-muted-foreground mt-1">
                Select variants and quantity
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Fabric Preview */}
          <div className="flex gap-3 sm:gap-4 items-center p-3 sm:p-4 bg-secondary/30 rounded-lg sm:rounded-xl border border-border">
            <img
              src={fabric.image}
              alt={fabric.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base lg:text-lg truncate">{fabric.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Base Price: ₹{fabric.pricePerMeter}/meter</p>
            </div>
          </div>

          {/* Variant Selection */}
          {variants.map((variant) => {
            const selectedOptionId = selectedVariants[variant.id];
            const selectedOption = variant.options.find(opt => opt.id === selectedOptionId);
            
            return (
              <div key={variant.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-base">
                    {variant.name}
                    {selectedOption && (
                      <span className="text-muted-foreground ml-2">
                        : {selectedOption.value}
                      </span>
                    )}
                  </h4>
                  {selectedOption?.priceModifier && selectedOption.priceModifier > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      +₹{selectedOption.priceModifier}/meter
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {variant.options.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleVariantChange(variant.id, option.id)}
                        className={cn(
                          "px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border-2 transition-all text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2",
                          isSelected
                            ? "border-[#2b9d8f] bg-[#2b9d8f]/10 text-[#2b9d8f]"
                            : "border-border hover:border-[#2b9d8f]/50"
                        )}
                      >
                        <span className="truncate">{option.value}</span>
                        {option.priceModifier && option.priceModifier > 0 && (
                          <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                            (+₹{option.priceModifier})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Quantity Selection */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="font-medium text-base">Quantity (Meters)</h4>
            <div className="flex items-center gap-5">
              <div className="flex items-center border border-border rounded-full">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-12 h-12"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="w-16 text-center font-medium text-lg">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-12 h-12"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                Price per meter: ₹{pricePerMeter}
              </span>
            </div>
          </div>

          {/* Price Summary */}
          <div className="p-3 sm:p-4 bg-[#2b9d8f]/5 rounded-lg sm:rounded-xl border border-[#2b9d8f]/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Price</p>
                <p className="text-xl sm:text-2xl font-semibold text-[#2b9d8f] mt-1">
                  <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 inline" />
                  {totalPrice.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {quantity} meter{quantity !== 1 ? 's' : ''} × ₹{pricePerMeter}/meter
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base">
            Cancel
          </Button>
          <Button onClick={handleAddToCart} className="bg-[#2b9d8f] hover:bg-[#238a7d] text-white gap-2 flex-1 sm:max-w-xs h-10 sm:h-11 text-sm sm:text-base">
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Add to Cart</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FabricVariantPopup;
