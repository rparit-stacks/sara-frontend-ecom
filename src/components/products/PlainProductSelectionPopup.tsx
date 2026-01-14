import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, IndianRupee, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Product } from './ProductCard';

export interface PlainProduct {
  id: string;
  name: string;
  image: string;
  pricePerMeter: number;
  status: 'active' | 'inactive';
  category?: string;
}

interface PlainProductSelectionPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendedPlainProductIds: string[];
  onPlainProductSelect: (productId: string) => void;
}

// Mock plain products - in real app, fetch from API: GET /api/products?type=PLAIN
const mockAllPlainProducts: PlainProduct[] = [
  { id: 'p1', name: 'Premium Silk Fabric', image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=300&h=300&fit=crop', pricePerMeter: 100, status: 'active', category: 'Fabrics' },
  { id: 'p2', name: 'Cotton Blue Fabric', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop', pricePerMeter: 80, status: 'active', category: 'Fabrics' },
  { id: 'p3', name: 'Linen Cream Fabric', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=300&fit=crop', pricePerMeter: 120, status: 'active', category: 'Fabrics' },
  { id: 'p4', name: 'Cotton White Fabric', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=300&h=300&fit=crop', pricePerMeter: 75, status: 'active', category: 'Fabrics' },
  { id: 'p5', name: 'Silk Gold Fabric', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=300&h=300&fit=crop', pricePerMeter: 150, status: 'active', category: 'Fabrics' },
  { id: 'p6', name: 'Cotton Red Fabric', image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=300&h=300&fit=crop', pricePerMeter: 85, status: 'active', category: 'Fabrics' },
  { id: 'p7', name: 'Linen Beige Fabric', image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&h=300&fit=crop', pricePerMeter: 110, status: 'active', category: 'Fabrics' },
  { id: 'p8', name: 'Silk Navy Fabric', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&h=300&fit=crop', pricePerMeter: 140, status: 'active', category: 'Fabrics' },
];

const PlainProductSelectionPopup: React.FC<PlainProductSelectionPopupProps> = ({
  open,
  onOpenChange,
  recommendedPlainProductIds,
  onPlainProductSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Get recommended plain products
  const recommendedProducts = useMemo(() => {
    return mockAllPlainProducts.filter(p => 
      recommendedPlainProductIds.includes(p.id) && p.status === 'active'
    );
  }, [recommendedPlainProductIds]);

  // Filter all products by search
  const allProducts = useMemo(() => {
    if (!searchQuery.trim() && !showAllProducts) {
      return [];
    }
    return mockAllPlainProducts.filter(
      product =>
        product.status === 'active' &&
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, showAllProducts]);

  const handleProductClick = (productId: string) => {
    onPlainProductSelect(productId);
    onOpenChange(false);
    setSearchQuery('');
    setShowAllProducts(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex-shrink-0">
          <DialogTitle className="font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl flex items-center gap-2 sm:gap-3">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-[#2b9d8f] flex-shrink-0" />
            <span className="break-words">Select Fabric</span>
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Choose a fabric to combine with this design
          </p>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <Input
              placeholder="Search fabrics..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) {
                  setShowAllProducts(true);
                }
              }}
              className="pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-12 text-sm sm:text-base"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowAllProducts(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Recommended Products Section */}
          {!showAllProducts && !searchQuery && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recommended Fabrics</h3>
                <Badge variant="secondary" className="text-xs">
                  {recommendedProducts.length} Options
                </Badge>
              </div>
              
              {recommendedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recommendedProducts.map((product) => (
                    <motion.button
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all group"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3">
                        <h4 className="text-white font-semibold text-sm mb-1">{product.name}</h4>
                        <div className="flex items-center gap-1 text-white/90 text-xs">
                          <IndianRupee className="w-3 h-3" />
                          <span>{product.pricePerMeter}/meter</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recommended fabrics available</p>
                </div>
              )}

              {/* Browse All Button */}
              <div className="pt-4 border-t border-border mt-6">
                <Button
                  onClick={() => setShowAllProducts(true)}
                  variant="outline"
                  className="w-full h-11 sm:h-12 text-sm sm:text-base gap-2"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">Browse All Fabrics</span>
                </Button>
              </div>
            </div>
          )}

          {/* All Products Section */}
          {(showAllProducts || searchQuery) && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {searchQuery ? 'Search Results' : 'All Fabrics'}
              </h3>
              
              {allProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">No products found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <AnimatePresence mode="popLayout">
                    {allProducts.map((product) => (
                      <motion.button
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative aspect-square rounded-xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all group"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3">
                          <h4 className="text-white font-semibold text-sm mb-1">{product.name}</h4>
                          <div className="flex items-center gap-1 text-white/90 text-xs">
                            <IndianRupee className="w-3 h-3" />
                            <span>{product.pricePerMeter}/meter</span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {showAllProducts || searchQuery 
              ? `${allProducts.length} product${allProducts.length !== 1 ? 's' : ''} found`
              : `${recommendedProducts.length} recommended product${recommendedProducts.length !== 1 ? 's' : ''}`
            }
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlainProductSelectionPopup;
