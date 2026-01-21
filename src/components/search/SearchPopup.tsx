import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productsApi, categoriesApi } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  categoryType?: string; // e.g., "Plain Fabric", "Design", "Digital"
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent?: string;
}

interface SearchPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchPopup = ({ open, onOpenChange }: SearchPopupProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch live products and categories from API
  const { data: productsData = [] } = useQuery({
    queryKey: ['search-products'],
    queryFn: () => productsApi.getAll({ status: 'ACTIVE' } as any),
  });

  const { data: categoriesData = [] } = useQuery({
    queryKey: ['search-categories'],
    queryFn: () => categoriesApi.getAll(true),
  });

  // Normalize products into a unified shape for searching
  const allProducts: Product[] = useMemo(() => {
    return (productsData as any[]).map((p: any) => {
      const id = p.id ?? p.productId ?? p.slug ?? Math.random().toString(36).slice(2);
      const name = p.name ?? p.title ?? 'Product';
      const price =
        Number(
          p.price ??
            p.sellingPrice ??
            p.offerPrice ??
            p.basePrice ??
            0
        ) || 0;
      const image =
        p.thumbnailImage ||
        p.image ||
        (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '') ||
        '/placeholder.svg';
      const category =
        p.categoryName ||
        p.category ||
        p.categoryLabel ||
        'Products';
      const categoryType =
        p.productType ||
        p.type ||
        undefined;
      const slug = p.slug || String(id);

      return {
        id: String(id),
        name,
        price,
        image,
        category,
        categoryType,
        slug,
      };
    });
  }, [productsData]);

  // Normalize categories
  const allCategories: Category[] = useMemo(() => {
    return (categoriesData as any[]).map((c: any) => ({
      id: String(c.id),
      name: c.name || 'Category',
      slug: c.slugPath || c.slug || String(c.id),
      parent: c.parentName || undefined,
    }));
  }, [categoriesData]);

  // Real-time filtering with useMemo for performance
  const { filteredProducts, filteredCategories } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { filteredProducts: [], filteredCategories: [] };
    }

    const query = searchQuery.toLowerCase();
    
    // Filter products - fast real-time search
    const products = allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.categoryType && product.categoryType.toLowerCase().includes(query))
    );

    // Filter categories
    const categories = allCategories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        (category.parent && category.parent.toLowerCase().includes(query))
    );

    return { filteredProducts: products, filteredCategories: categories };
  }, [searchQuery, allProducts, allCategories]);

  // Group all categories by parent (for right sidebar)
  const allCategoriesByParent = allCategories.reduce((acc, category) => {
    const parent = category.parent || 'Other';
    if (!acc[parent]) {
      acc[parent] = [];
    }
    acc[parent].push(category);
    return acc;
  }, {} as Record<string, Category[]>);

  // Group filtered categories by parent (for search results)
  const categoriesByParent = filteredCategories.reduce((acc, category) => {
    const parent = category.parent || 'Other';
    if (!acc[parent]) {
      acc[parent] = [];
    }
    acc[parent].push(category);
    return acc;
  }, {} as Record<string, Category[]>);

  // Reset search when popup closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] sm:w-full h-[90vh] sm:h-[85vh] md:h-[80vh] p-0 gap-0 overflow-hidden flex flex-col !translate-y-[-50%] sm:!translate-y-[-50%]">
        {/* Search Input - Fixed at top */}
        <div className="p-4 md:p-6 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 md:pl-12 pr-10 md:pr-12 py-4 md:py-6 text-base md:text-lg w-full"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 touch-manipulation"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Search Results - Full width on mobile, flex-1 on desktop */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 md:border-r md:border-border min-h-0">
            {!searchQuery ? (
              <div className="flex items-center justify-center h-full min-h-[200px] text-center px-4">
                <div>
                  <Search className="w-12 h-12 md:w-16 md:h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-base md:text-lg text-muted-foreground">Start typing to search...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 && filteredCategories.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px] text-center px-4">
                <div>
                  <p className="text-base md:text-lg text-muted-foreground mb-2">No results found</p>
                  <p className="text-sm md:text-base text-muted-foreground">Try a different search term</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-full">
                {/* Products */}
                {filteredProducts.length > 0 && (
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-4">Products</h3>
                    <div className="space-y-3 md:space-y-4">
                      <AnimatePresence mode="popLayout">
                        {filteredProducts.map((product) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Link
                              to={`/product/${product.slug || product.id}`}
                              onClick={() => onOpenChange(false)}
                              className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-lg border border-border hover:bg-secondary/50 active:bg-secondary/70 transition-colors group touch-manipulation"
                            >
                              {/* Product Image */}
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg flex-shrink-0"
                              />
                              
                              {/* Product Info - Flex layout for name and category */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div className="flex items-start justify-between gap-2 md:gap-4">
                                  {/* Product Name - Left aligned */}
                                  <h4 className="font-medium text-sm md:text-base group-hover:text-primary transition-colors flex-1 min-w-0 break-words">
                                    {product.name}
                                  </h4>
                                  
                                  {/* Category Type - Right aligned */}
                                  <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap flex-shrink-0 text-right">
                                    {product.categoryType || 'Design'} / {product.category}
                                  </span>
                                </div>
                                
                                {/* Price */}
                                <p className="text-primary font-semibold text-sm md:text-base mt-2">
                                  ₹{product.price.toLocaleString('en-IN')}
                                </p>
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Categories */}
                {filteredCategories.length > 0 && (
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-4">Categories</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                      <AnimatePresence mode="popLayout">
                        {filteredCategories.map((category) => (
                          <motion.div
                            key={category.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Link
                              to={`/category/${category.slug}`}
                              onClick={() => onOpenChange(false)}
                              className="block p-3 md:p-4 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground active:bg-primary/90 transition-colors text-center touch-manipulation"
                            >
                              <p className="font-medium text-sm md:text-base">{category.name}</p>
                            </Link>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: All Categories by Parent - Hidden on mobile, visible on desktop */}
          <div className="hidden md:block w-64 lg:w-80 overflow-y-auto p-6 bg-secondary/30 flex-shrink-0 border-l border-border">
            <h3 className="text-base lg:text-lg font-semibold mb-4">Categories</h3>
            <div className="space-y-6">
              {Object.entries(allCategoriesByParent).map(([parent, categories]) => (
                <div key={parent}>
                  <h4 className="text-xs lg:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {parent}
                  </h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        to={`/category/${category.slug}`}
                        onClick={() => onOpenChange(false)}
                        className="block p-2.5 lg:p-3 rounded-lg hover:bg-white transition-colors text-sm font-medium"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchPopup;
