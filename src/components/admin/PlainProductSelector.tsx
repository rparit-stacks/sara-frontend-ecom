import React, { useState, useMemo } from 'react';
import { Search, Check, Package, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface PlainProduct {
  id: string;
  name: string;
  image: string;
  pricePerMeter: number;
  status: 'active' | 'inactive';
}

interface PlainProductSelectorProps {
  plainProducts: PlainProduct[];
  selectedProductIds: string[];
  onChange: (ids: string[]) => void;
  maxSelection?: number;
}

const PlainProductSelector: React.FC<PlainProductSelectorProps> = ({ 
  plainProducts, 
  selectedProductIds, 
  onChange,
  maxSelection = 10
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const toggleProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      onChange(selectedProductIds.filter(pid => pid !== id));
    } else {
      if (selectedProductIds.length < maxSelection) {
        onChange([...selectedProductIds, id]);
      }
    }
  };

  const filteredProducts = useMemo(() => {
    return plainProducts.filter(p => 
      p.status === 'active' &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [plainProducts, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search plain products..." 
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {selectedProductIds.length > 0 ? (
          selectedProductIds.map(id => {
            const product = plainProducts.find(p => p.id === id);
            return product ? (
              <Badge key={id} variant="secondary" className="gap-1 py-1 px-2">
                {product.name}
                <button
                  onClick={() => toggleProduct(id)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ) : null;
          })
        ) : (
          <p className="text-xs text-muted-foreground italic">No products selected</p>
        )}
        {selectedProductIds.length >= maxSelection && (
          <Badge variant="outline" className="text-xs">
            Max {maxSelection} selected
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-1">
        {filteredProducts.map((product) => {
          const isSelected = selectedProductIds.includes(product.id);
          const isDisabled = !isSelected && selectedProductIds.length >= maxSelection;
          
          return (
            <motion.button
              key={product.id}
              type="button"
              whileHover={!isDisabled ? { y: -2 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              onClick={() => !isDisabled && toggleProduct(product.id)}
              disabled={isDisabled}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2 transition-all group",
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent",
                isDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"
              )}
            >
              <img 
                src={product.image} 
                alt={product.name}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-300",
                  !isDisabled && "group-hover:scale-110",
                  !isSelected && "opacity-80 group-hover:opacity-100"
                )}
              />
              <div className={cn(
                "absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-2 text-center transition-opacity",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                {isSelected && (
                  <div className="bg-primary text-white rounded-full p-1 mb-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <span className="text-[10px] font-bold text-white leading-tight">
                  {product.name}
                </span>
              </div>
              
              {product.status === 'inactive' && (
                <div className="absolute top-1 right-1">
                  <Badge variant="destructive" className="text-[8px] h-4 px-1">OFF</Badge>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default PlainProductSelector;
