import React, { useState, useEffect } from 'react';
import { Plus, X, Settings2, Trash2, Layers, IndianRupee, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface VariantType {
  id: string;
  name: string;
  unit?: string;
  values: VariantValue[];
}

export interface VariantValue {
  id: string;
  value: string;
}

export interface VariantCombination {
  id: string;
  variantValues: { [variantTypeId: string]: string }; // variantTypeId -> variantValueId
  price: number;
  stock: number;
  sku?: string;
}

interface VariantBuilderProps {
  onChange: (variants: VariantType[], combinations: VariantCombination[]) => void;
  initialVariants?: VariantType[];
  initialCombinations?: VariantCombination[];
}

const VariantBuilder: React.FC<VariantBuilderProps> = ({ 
  onChange, 
  initialVariants = [], 
  initialCombinations = [] 
}) => {
  const [variants, setVariants] = useState<VariantType[]>(initialVariants);
  const [combinations, setCombinations] = useState<VariantCombination[]>(initialCombinations);

  const addVariantType = () => {
    const newVariant: VariantType = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      values: []
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariantType = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const updateVariantName = (id: string, name: string) => {
    setVariants(variants.map(v => v.id === id ? { ...v, name } : v));
  };

  const updateVariantUnit = (id: string, unit: string) => {
    setVariants(variants.map(v => v.id === id ? { ...v, unit } : v));
  };

  const addVariantValue = (variantId: string, value: string) => {
    if (!value.trim()) return;
    setVariants(variants.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          values: [...v.values, { id: Math.random().toString(36).substr(2, 9), value }]
        };
      }
      return v;
    }));
  };

  const removeVariantValue = (variantId: string, valueId: string) => {
    setVariants(variants.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          values: v.values.filter(val => val.id !== valueId)
        };
      }
      return v;
    }));
  };

  // Generate combinations whenever variants change
  useEffect(() => {
    const generateCombinations = () => {
      if (variants.length === 0) {
        setCombinations([]);
        return;
      }

      // Check if all variant types have at least one value
      if (variants.some(v => v.values.length === 0)) {
        return;
      }

      const generate = (index: number, current: { [key: string]: string }): any[] => {
        if (index === variants.length) {
          return [current];
        }

        const variant = variants[index];
        const results: any[] = [];

        variant.values.forEach(val => {
          results.push(...generate(index + 1, { ...current, [variant.id]: val.id }));
        });

        return results;
      };

      const newCombos = generate(0, {});
      
      const updatedCombinations = newCombos.map(combo => {
        const comboId = Object.values(combo).join('-');
        const existing = combinations.find(c => {
          const existingId = Object.values(c.variantValues).join('-');
          return existingId === comboId;
        });

        return existing || {
          id: comboId,
          variantValues: combo,
          price: 0,
          stock: 0,
          sku: ''
        };
      });

      setCombinations(updatedCombinations);
    };

    generateCombinations();
  }, [variants]);

  useEffect(() => {
    onChange(variants, combinations);
  }, [variants, combinations]);

  const updateCombination = (id: string, field: keyof VariantCombination, value: any) => {
    setCombinations(combinations.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Variant Options
          </h3>
          <Button type="button" onClick={addVariantType} variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Variant Type
          </Button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {variants.map((variant) => (
              <motion.div
                key={variant.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-muted/30 p-4 rounded-xl border border-border space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Variant Name</Label>
                      <Input 
                        placeholder="e.g. Size, Color, Material" 
                        value={variant.name}
                        onChange={(e) => updateVariantName(variant.id, e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit (Optional)</Label>
                      <Input 
                        placeholder="e.g. cm, kg, inches" 
                        value={variant.unit}
                        onChange={(e) => updateVariantUnit(variant.id, e.target.value)}
                      />
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive mt-8"
                    onClick={() => removeVariantType(variant.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Values</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {variant.values.map((val) => (
                      <Badge key={val.id} variant="secondary" className="gap-1 py-1.5 px-3">
                        {val.value}
                        <button 
                          type="button" 
                          onClick={() => removeVariantValue(variant.id, val.id)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add value and press Enter" 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addVariantValue(variant.id, e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addVariantValue(variant.id, input.value);
                        input.value = '';
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {combinations.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Price & Stock per Combination
          </h3>
          
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">Combination</th>
                    <th className="text-left p-4 text-sm font-medium w-32">Price (₹)</th>
                    <th className="text-left p-4 text-sm font-medium w-32">Stock</th>
                    <th className="text-left p-4 text-sm font-medium">SKU</th>
                  </tr>
                </thead>
                <tbody>
                  {combinations.map((combo) => (
                    <tr key={combo.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(combo.variantValues).map(([typeId, valId]) => {
                            const type = variants.find(v => v.id === typeId);
                            const val = type?.values.find(v => v.id === valId);
                            return (
                              <Badge key={typeId} variant="outline" className="text-[10px] uppercase">
                                {type?.name}: {val?.value}
                              </Badge>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input 
                            type="number" 
                            className="h-9 pl-6" 
                            value={combo.price}
                            onChange={(e) => updateCombination(combo.id, 'price', parseFloat(e.target.value))}
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          <Database className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input 
                            type="number" 
                            className="h-9 pl-6" 
                            value={combo.stock}
                            onChange={(e) => updateCombination(combo.id, 'stock', parseInt(e.target.value))}
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <Input 
                          placeholder="SKU-001" 
                          className="h-9" 
                          value={combo.sku}
                          onChange={(e) => updateCombination(combo.id, 'sku', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantBuilder;
