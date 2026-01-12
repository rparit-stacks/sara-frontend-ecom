import React, { useState } from 'react';
import { Search, Check, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface Fabric {
  id: string;
  name: string;
  image: string;
  status: 'active' | 'inactive';
}

interface FabricSelectorProps {
  fabrics: Fabric[];
  selectedFabricIds: string[];
  onChange: (ids: string[]) => void;
}

const FabricSelector: React.FC<FabricSelectorProps> = ({ 
  fabrics, 
  selectedFabricIds, 
  onChange 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFabric = (id: string) => {
    if (selectedFabricIds.includes(id)) {
      onChange(selectedFabricIds.filter(fid => fid !== id));
    } else {
      onChange([...selectedFabricIds, id]);
    }
  };

  const filteredFabrics = fabrics.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search fabrics..." 
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {selectedFabricIds.length > 0 ? (
          selectedFabricIds.map(id => {
            const fabric = fabrics.find(f => f.id === id);
            return fabric ? (
              <Badge key={id} variant="secondary" className="gap-1 py-1 px-2">
                {fabric.name}
                <Check className="w-3 h-3 text-primary" />
              </Badge>
            ) : null;
          })
        ) : (
          <p className="text-xs text-muted-foreground italic">No fabrics selected</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-1">
        {filteredFabrics.map((fabric) => {
          const isSelected = selectedFabricIds.includes(fabric.id);
          
          return (
            <motion.button
              key={fabric.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleFabric(fabric.id)}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2 transition-all group",
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent"
              )}
            >
              <img 
                src={fabric.image} 
                alt={fabric.name}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-300 group-hover:scale-110",
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
                  {fabric.name}
                </span>
              </div>
              
              {fabric.status === 'inactive' && (
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

export default FabricSelector;
