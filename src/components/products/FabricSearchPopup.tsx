import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Fabric } from './FabricSelectionPopup';

interface FabricSearchPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFabricSelect: (fabricId: string) => void;
  excludeFabricIds?: string[];
}

// Mock data - in real app, fetch from API: GET /api/fabrics
const mockAllFabrics: Fabric[] = [
  { id: 'f1', name: 'Silk Pink', image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=300&h=300&fit=crop', pricePerMeter: 100, status: 'active' },
  { id: 'f2', name: 'Cotton Blue', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop', pricePerMeter: 80, status: 'active' },
  { id: 'f3', name: 'Linen Cream', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=300&fit=crop', pricePerMeter: 120, status: 'active' },
  { id: 'f4', name: 'Cotton White', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=300&h=300&fit=crop', pricePerMeter: 75, status: 'active' },
  { id: 'f5', name: 'Silk Gold', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=300&h=300&fit=crop', pricePerMeter: 150, status: 'active' },
  { id: 'f6', name: 'Cotton Red', image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=300&h=300&fit=crop', pricePerMeter: 85, status: 'active' },
  { id: 'f7', name: 'Linen Beige', image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&h=300&fit=crop', pricePerMeter: 110, status: 'active' },
  { id: 'f8', name: 'Silk Navy', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&h=300&fit=crop', pricePerMeter: 140, status: 'active' },
  { id: 'f9', name: 'Cotton Green', image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=300&h=300&fit=crop', pricePerMeter: 90, status: 'active' },
  { id: 'f10', name: 'Linen Gray', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=300&fit=crop', pricePerMeter: 95, status: 'active' },
];

const FabricSearchPopup: React.FC<FabricSearchPopupProps> = ({
  open,
  onOpenChange,
  onFabricSelect,
  excludeFabricIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter fabrics - exclude already shown recommended ones and filter by search
  const availableFabrics = useMemo(() => {
    return mockAllFabrics.filter(
      fabric =>
        fabric.status === 'active' &&
        !excludeFabricIds.includes(fabric.id) &&
        (fabric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         searchQuery.trim() === '')
    );
  }, [searchQuery, excludeFabricIds]);

  const handleFabricClick = (fabricId: string) => {
    onFabricSelect(fabricId);
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <DialogTitle className="font-cursive text-3xl flex items-center gap-3">
            <Search className="w-6 h-6 text-primary" />
            Browse All Fabrics
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Search and select from all available plain fabrics
          </p>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search fabrics by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Fabrics Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {availableFabrics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No fabrics found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <AnimatePresence mode="popLayout">
                {availableFabrics.map((fabric) => (
                  <motion.button
                    key={fabric.id}
                    onClick={() => handleFabricClick(fabric.id)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all group"
                  >
                    <img
                      src={fabric.image}
                      alt={fabric.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3">
                      <h4 className="text-white font-semibold text-sm mb-1">{fabric.name}</h4>
                      <div className="flex items-center gap-1 text-white/90 text-xs">
                        <IndianRupee className="w-3 h-3" />
                        <span>{fabric.pricePerMeter}/meter</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {availableFabrics.length} fabric{availableFabrics.length !== 1 ? 's' : ''} available
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FabricSearchPopup;
