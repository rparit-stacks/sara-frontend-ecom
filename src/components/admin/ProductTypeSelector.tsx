import React from 'react';
import { Package, Palette, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductType = 'PLAIN' | 'DESIGNED' | 'DIGITAL';

interface ProductTypeSelectorProps {
  selected: ProductType;
  onChange: (type: ProductType) => void;
}

const ProductTypeSelector: React.FC<ProductTypeSelectorProps> = ({ selected, onChange }) => {
  const types = [
    {
      id: 'PLAIN' as ProductType,
      title: 'Plain Product',
      description: 'Physical product without custom design or mockup.',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'DESIGNED' as ProductType,
      title: 'Designed Product',
      description: 'Custom designed product with mockup and fabric options.',
      icon: Palette,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      id: 'DIGITAL' as ProductType,
      title: 'Digital Product',
      description: 'Downloadable assets, templates, or digital content.',
      icon: FileJson,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {types.map((type) => {
        const Icon = type.icon;
        const isActive = selected === type.id;

        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={cn(
              "flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left group",
              isActive 
                ? cn("ring-2 ring-primary/20", type.borderColor, type.bgColor) 
                : "border-border hover:border-muted-foreground/20 hover:bg-muted/30"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
              isActive ? type.bgColor : "bg-muted group-hover:bg-muted-foreground/10"
            )}>
              <Icon className={cn("w-5 h-5", isActive ? type.color : "text-muted-foreground")} />
            </div>
            <h3 className={cn(
              "font-semibold mb-1",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}>
              {type.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {type.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default ProductTypeSelector;
