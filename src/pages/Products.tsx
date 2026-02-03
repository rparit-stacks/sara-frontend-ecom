import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Grid, List, SlidersHorizontal, X, ChevronRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';
import ListViewProductCard from '@/components/products/ListViewProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { productsApi, categoriesApi, cmsApi } from '@/lib/api';
import { ProductCardSkeleton } from '@/components/skeletons';

interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  displayOrder?: number;
  subcategories?: Category[];
}

interface PriceRange {
  label: string;
  min: number;
  max: number | null;
}

const priceRanges: PriceRange[] = [
  { label: 'Under ₹300', min: 0, max: 300 },
  { label: '₹300 – ₹400', min: 300, max: 400 },
  { label: '₹401 – ₹500', min: 401, max: 500 },
  { label: 'Above ₹500', min: 500, max: null },
];

const Products = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(16);
  
  // Cascading category filter - array of selected category IDs at each level
  // [level0CategoryId, level1CategoryId, level2CategoryId, ...]
  const [categoryPath, setCategoryPath] = useState<number[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | null>(null);

  const getPageSize = () => {
    if (window.innerWidth < 640) return 8;
    if (window.innerWidth < 1024) return 12;
    return 16;
  };

  useEffect(() => {
    const handleResize = () => {
      const newPageSize = getPageSize();
      setPageSize(newPageSize);
      setCurrentPage(1);
    };
    setPageSize(getPageSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filter = searchParams.get('filter');
  
  const { data: apiProducts = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => {
      const userEmail = typeof window !== 'undefined' ? (() => {
        const token = localStorage.getItem('authToken');
        if (!token) return null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.sub || payload.email || null;
        } catch {
          return null;
        }
      })() : null;
      return productsApi.getAll({ userEmail: userEmail || undefined });
    },
  });
  
  const { data: cmsData } = useQuery({
    queryKey: ['cmsHomepage'],
    queryFn: () => cmsApi.getHomepage(),
    refetchOnWindowFocus: false,
    retry: 2,
  });
  
  const { data: apiCategories = [] } = useQuery({
    queryKey: ['categoriesActive'],
    queryFn: () => {
      const userEmail = typeof window !== 'undefined' ? (() => {
        const token = localStorage.getItem('authToken');
        if (!token) return null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.sub || payload.email || null;
        } catch {
          return null;
        }
      })() : null;
      return categoriesApi.getAll(true, userEmail || undefined);
    },
  });

  // Build a flat map of all categories for easy lookup
  const allCategoriesMap = useMemo(() => {
    const map = new Map<number, Category>();
    const buildMap = (cats: any[]) => {
      cats.forEach((c: any) => {
        const cat: Category = {
          id: c.id,
          name: c.name,
          slug: c.slug,
          parentId: c.parentId,
          displayOrder: c.displayOrder,
          subcategories: c.subcategories || [],
        };
        map.set(c.id, cat);
        if (c.subcategories && c.subcategories.length > 0) {
          buildMap(c.subcategories);
        }
      });
    };
    buildMap(apiCategories);
    return map;
  }, [apiCategories]);

  // Get root level categories (no parent)
  const rootCategories = useMemo(() => {
    return apiCategories
      .filter((c: any) => !c.parentId)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentId: c.parentId,
        displayOrder: c.displayOrder,
        subcategories: c.subcategories || [],
      }))
      .sort((a: Category, b: Category) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  }, [apiCategories]);
  
  const allProducts: Product[] = apiProducts.map((p: any) => ({
    id: String(p.id),
    slug: p.slug || String(p.id),
    name: p.name,
    price: p.price || p.basePrice || 0,
    originalPrice: p.originalPrice,
    image: p.images?.[0] || '',
    category: p.categoryName || '',
    categoryId: p.categoryId,
    isNew: p.isNew,
    isSale: p.isSale,
    rating: p.rating || 4,
    createdAt: p.createdAt,
  }));
  
  const bestSellerIds: Array<number | string> = cmsData?.bestSellerIds || cmsData?.bestSellers || [];
  const newArrivalIds: Array<number | string> = cmsData?.newArrivalIds || cmsData?.newArrivals || [];
  
  const getPageTitle = () => {
    switch (filter) {
      case 'new': return 'New Arrivals';
      case 'best': return 'Best Sellers';
      case 'sale': return 'Sale';
      default: return 'All Products';
    }
  };

  // Get all descendant category IDs for a given category
  const getAllDescendantIds = (categoryId: number): number[] => {
    const category = allCategoriesMap.get(categoryId);
    if (!category) return [categoryId];
    
    const descendants = [categoryId];
    const getChildren = (cat: Category) => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.forEach((sub: Category) => {
          descendants.push(sub.id);
          const fullSub = allCategoriesMap.get(sub.id);
          if (fullSub) getChildren(fullSub);
        });
      }
    };
    getChildren(category);
    return descendants;
  };

  // Get categories to show at each level based on current path
  const getCategoriesForLevel = (level: number): Category[] => {
    if (level === 0) {
      // Root level - show all root categories
      return rootCategories;
    }
    
    // Get parent category from previous level
    const parentId = categoryPath[level - 1];
    if (!parentId) return [];
    
    const parent = allCategoriesMap.get(parentId);
    if (!parent || !parent.subcategories) return [];
    
    return parent.subcategories.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  };

  // Handle category selection at a specific level
  const handleCategorySelect = (level: number, categoryId: number | null) => {
    if (categoryId === null) {
      // "All Category" clicked - clear from this level onwards
      setCategoryPath(prev => prev.slice(0, level));
    } else {
      // Category selected - update path up to this level
      setCategoryPath(prev => {
        const newPath = prev.slice(0, level);
        newPath[level] = categoryId;
        return newPath;
      });
    }
  };

  // Get products that match the current category filter
  const getFilteredByCategory = (products: Product[]): Product[] => {
    if (categoryPath.length === 0) {
      // No category selected - show all
      return products;
    }
    
    // Get the deepest selected category
    const selectedCategoryId = categoryPath[categoryPath.length - 1];
    const allowedCategoryIds = getAllDescendantIds(selectedCategoryId);
    
    return products.filter(p => allowedCategoryIds.includes(p.categoryId));
  };

  // Get categories that have products (for filtering empty categories)
  const categoriesWithProducts = useMemo(() => {
    const productCategoryIds = new Set(allProducts.map(p => p.categoryId));
    const hasProducts = new Set<number>();
    
    // Mark all categories that have products or have descendants with products
    allCategoriesMap.forEach((cat, id) => {
      const descendants = getAllDescendantIds(id);
      if (descendants.some(descId => productCategoryIds.has(descId))) {
        hasProducts.add(id);
      }
    });
    
    return hasProducts;
  }, [allProducts, allCategoriesMap]);

  // Filter products by all criteria
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // Filter by URL filter param
    if (filter === 'new') {
      if (newArrivalIds && newArrivalIds.length > 0) {
        const idSet = new Set(newArrivalIds.map((id) => String(id)));
        filtered = filtered.filter((product) => idSet.has(product.id));
      } else {
        filtered = filtered.filter((product) => product.isNew);
      }
    } else if (filter === 'best') {
      if (bestSellerIds && bestSellerIds.length > 0) {
        const idSet = new Set(bestSellerIds.map((id) => String(id)));
        filtered = filtered.filter((product) => idSet.has(product.id));
      } else {
        filtered = filtered.filter((product) => (product.rating || 0) >= 4.5);
      }
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category path
    filtered = getFilteredByCategory(filtered);

    // Filter by price range
    if (selectedPriceRange) {
      filtered = filtered.filter(product => {
        const price = product.price;
        if (selectedPriceRange.max === null) {
          return price >= selectedPriceRange.min;
        }
        if (selectedPriceRange.min === 0 && selectedPriceRange.max === 300) {
          return price < 300;
        }
        return price >= selectedPriceRange.min && price <= selectedPriceRange.max;
      });
    }

    // Sort products
    switch (sortBy) {
      case 'newest':
        filtered = [...filtered].sort((a, b) => {
          const aDate = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
          const bDate = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
          return bDate - aDate;
        });
        break;
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    return filtered;
  }, [allProducts, searchQuery, categoryPath, selectedPriceRange, sortBy, filter, newArrivalIds, bestSellerIds]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryPath, selectedPriceRange, searchQuery, filter]);

  const clearAllFilters = () => {
    setCategoryPath([]);
    setSelectedPriceRange(null);
  };

  const hasActiveFilters = categoryPath.length > 0 || selectedPriceRange !== null;

  // Render cascading category filters
  const renderCategoryFilters = (isMobile: boolean = false) => {
    const levels: JSX.Element[] = [];
    
    // Determine how many levels to show (current path + 1 for next level)
    const maxLevel = categoryPath.length + 1;
    
    for (let level = 0; level < maxLevel; level++) {
      const categories = getCategoriesForLevel(level);
      
      // Only show categories that have products
      const availableCategories = categories.filter(cat => categoriesWithProducts.has(cat.id));
      
      if (availableCategories.length === 0 && level > 0) continue;
      
      const selectedId = categoryPath[level];
      const selectedCategory = selectedId ? allCategoriesMap.get(selectedId) : null;
      
      const levelTitle = level === 0 ? 'Categories' : 
                        level === 1 ? 'Sub-Categories' :
                        `Level ${level + 1}`;
      
      levels.push(
        <div key={level} className={level > 0 ? 'border-t border-border pt-6' : ''}>
          <div className="flex items-center gap-2 mb-4">
            {level > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            <h4 className={isMobile ? 'font-medium text-sm' : 'font-cursive text-2xl'}>
              {levelTitle}
            </h4>
          </div>
          <div className="space-y-3">
            {/* "All Category" option for each level */}
            <button
              onClick={() => handleCategorySelect(level, null)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                !selectedId
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-secondary text-muted-foreground'
              }`}
            >
              All {level === 0 ? 'Categories' : 'Items'}
            </button>
            
            {availableCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(level, cat.id)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm flex items-center justify-between ${
                  selectedId === cat.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-secondary text-muted-foreground'
                }`}
              >
                <span>{cat.name}</span>
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      );
    }
    
    return levels;
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="w-full bg-secondary/30 py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <ScrollReveal>
            <nav className="text-sm text-muted-foreground mb-4">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span className="text-foreground">{getPageTitle()}</span>
            </nav>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h1 className="font-cursive text-5xl lg:text-6xl">{getPageTitle()}</h1>
                <p className="text-muted-foreground mt-3 text-lg">
                  {isLoading ? 'Loading...' : `${filteredProducts.length} Products`}
                </p>
              </div>
              <div className="w-full lg:w-auto lg:min-w-[320px]">
                <Input 
                  type="search" 
                  placeholder="Search products..." 
                  className="rounded-full h-12 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Products Section */}
      <section className="w-full py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          {/* Active Filters Breadcrumb */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {categoryPath.map((catId, index) => {
                const cat = allCategoriesMap.get(catId);
                return (
                  <Badge key={`cat-${index}-${catId}`} variant="secondary" className="gap-1 text-sm py-1 px-3">
                    {cat?.name}
                    <button onClick={() => handleCategorySelect(index, null)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
              {selectedPriceRange && (
                <Badge key="price" variant="secondary" className="gap-1 text-sm py-1 px-3">
                  {selectedPriceRange.label}
                  <button onClick={() => setSelectedPriceRange(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear all
              </Button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div className="flex items-center gap-4">
              {/* Mobile Filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden h-11">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {renderCategoryFilters(true)}

                    {/* Price Filter */}
                    <div className="border-t border-border pt-6">
                      <h4 className="font-medium mb-3 text-sm">Price Range</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedPriceRange(null)}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                            !selectedPriceRange
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'hover:bg-secondary text-muted-foreground'
                          }`}
                        >
                          All Prices
                        </button>
                        {priceRanges.map((range) => (
                          <button
                            key={range.label}
                            onClick={() => setSelectedPriceRange(range)}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                              selectedPriceRange?.label === range.label
                                ? 'bg-primary text-primary-foreground font-medium'
                                : 'hover:bg-secondary text-muted-foreground'
                            }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* View Mode */}
              <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="w-9 h-9"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="w-9 h-9"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] h-11">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-10 lg:gap-14">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-8">
                {renderCategoryFilters(false)}

                {/* Price Filter */}
                <div className="border-t border-border pt-8">
                  <h4 className="font-cursive text-2xl mb-5">Price Range</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => setSelectedPriceRange(null)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors text-base ${
                        !selectedPriceRange
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-secondary text-muted-foreground'
                      }`}
                    >
                      All Prices
                    </button>
                    {priceRanges.map((range) => (
                      <button
                        key={range.label}
                        onClick={() => setSelectedPriceRange(range)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors text-base ${
                          selectedPriceRange?.label === range.label
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'hover:bg-secondary text-muted-foreground'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Grid/List */}
            <div className="flex-1 min-w-0">
              {viewMode === 'grid' ? (
                <div className="grid gap-6 lg:gap-8 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {isLoading ? (
                    Array.from({ length: pageSize }).map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))
                  ) : paginatedProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      No products found.
                    </div>
                  ) : (
                    paginatedProducts.map((product, index) => (
                      <ScrollReveal key={product.id} delay={Math.min(index * 0.03, 0.3)}>
                        <ProductCard product={product} />
                      </ScrollReveal>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-0 border border-border rounded-lg overflow-hidden bg-background">
                  {isLoading ? (
                    <div className="grid gap-6 lg:gap-8 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-6">
                      {Array.from({ length: pageSize }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : paginatedProducts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No products found.
                    </div>
                  ) : (
                    paginatedProducts.map((product, index) => (
                      <ScrollReveal key={product.id} delay={Math.min(index * 0.01, 0.2)}>
                        <ListViewProductCard product={product} />
                      </ScrollReveal>
                    ))
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-16">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
