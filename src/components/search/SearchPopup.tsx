import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Package, FolderTree, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'product' | 'category';
  name: string;
  image?: string;
  price?: number;
  parentCategory?: string;
}

interface ParentCategory {
  id: string;
  name: string;
  count: number;
}

// Mock data - replace with actual API calls
const mockProducts: SearchResult[] = [
  { id: '1', type: 'product', name: 'Rose Garden Silk Saree', price: 8999, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&h=200&fit=crop', parentCategory: 'Sarees' },
  { id: '2', type: 'product', name: 'Lavender Cushion Set', price: 2500, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop', parentCategory: 'Home Decor' },
  { id: '3', type: 'product', name: 'Cherry Blossom Kurti', price: 3499, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&h=200&fit=crop', parentCategory: 'Kurtis' },
  { id: '4', type: 'product', name: 'Wildflower Dupatta', price: 1599, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&h=200&fit=crop', parentCategory: 'Dupattas' },
  { id: '5', type: 'product', name: 'Peony Blouse', price: 2199, image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=200&h=200&fit=crop', parentCategory: 'Blouses' },
  { id: '6', type: 'product', name: 'Tropical Bedsheet', price: 3999, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200&h=200&fit=crop', parentCategory: 'Bedding' },
];

const mockCategories: SearchResult[] = [
  { id: '1', type: 'category', name: 'Floral Prints', parentCategory: 'Clothing' },
  { id: '2', type: 'category', name: 'Botanical', parentCategory: 'Home Decor' },
  { id: '3', type: 'category', name: 'Abstract', parentCategory: 'Accessories' },
  { id: '4', type: 'category', name: 'Geometric', parentCategory: 'Clothing' },
];

const parentCategories: ParentCategory[] = [
  { id: '1', name: 'Clothing', count: 48 },
  { id: '2', name: 'Home Decor', count: 36 },
  { id: '3', name: 'Accessories', count: 24 },
  { id: '4', name: 'Bedding', count: 32 },
  { id: '5', name: 'Scarves', count: 28 },
];

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchPopup = ({ isOpen, onClose }: SearchPopupProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    // Simulate API call
    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const filteredProducts = mockProducts.filter(
        p => p.name.toLowerCase().includes(query) || p.parentCategory?.toLowerCase().includes(query)
      );
      const filteredCategories = mockCategories.filter(
        c => c.name.toLowerCase().includes(query) || c.parentCategory?.toLowerCase().includes(query)
      );
      setResults([...filteredProducts, ...filteredCategories]);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'product') {
      navigate(`/product/${result.id}`);
    } else {
      navigate(`/category/${result.id}`);
    }
    onClose();
    setSearchQuery('');
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/category/${categoryId}`);
    onClose();
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-x-0 top-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-5xl mx-auto bg-white md:rounded-2xl rounded-none shadow-2xl overflow-hidden h-full md:h-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 md:p-6 border-b border-border">
            <div className="flex-1 relative">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search products, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 md:pl-12 pr-4 py-3 md:py-6 text-sm md:text-base"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex flex-col md:flex-row md:max-h-[600px] max-h-[calc(100vh-4rem)] overflow-hidden">
            {/* Left: Search Results */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 md:py-12">
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-primary" />
                </div>
              ) : searchQuery.trim() && results.length === 0 ? (
                <div className="text-center py-10 md:py-12">
                  <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                </div>
              ) : searchQuery.trim() ? (
                <div className="space-y-4">
                  <h3 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 md:mb-4">
                    Search Results ({results.length})
                  </h3>
                  {results.map((result) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/50 cursor-pointer transition-colors group',
                        result.type === 'category' && 'bg-primary/5'
                      )}
                      onClick={() => handleResultClick(result)}
                    >
                      {result.type === 'product' && result.image ? (
                        <img
                          src={result.image}
                          alt={result.name}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          {result.type === 'product' ? (
                            <Package className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                          ) : (
                            <FolderTree className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm md:text-base group-hover:text-primary transition-colors">
                          {result.name}
                        </h4>
                        {result.parentCategory && (
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {result.type === 'product' ? 'In' : 'Parent'}: {result.parentCategory}
                          </p>
                        )}
                        {result.price && (
                          <p className="text-xs md:text-sm font-semibold text-primary mt-1">
                            ₹{result.price.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 md:py-12">
                  <Search className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground/50 mb-3 md:mb-4" />
                  <p className="text-muted-foreground">Start typing to search...</p>
                </div>
              )}
            </div>

            {/* Right: Parent Categories */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-secondary/30 p-4 md:p-6 overflow-y-auto">
              <h3 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 md:mb-4">
                Parent Categories
              </h3>
              <div className="space-y-2">
                {parentCategories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ x: 4 }}
                    onClick={() => handleCategoryClick(category.id)}
                    className="w-full text-left p-4 rounded-xl bg-white border border-border hover:border-primary hover:bg-primary/5 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm md:text-base group-hover:text-primary transition-colors">
                          {category.name}
                        </h4>
                        <p className="text-[11px] md:text-xs text-muted-foreground mt-1">
                          {category.count} items
                        </p>
                      </div>
                      <FolderTree className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
