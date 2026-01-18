import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Grid, List, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';
import ListViewProductCard from '@/components/products/ListViewProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { productsApi, categoriesApi } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  subcategories?: Category[];
}

interface PriceRange {
  label: string;
  min: number;
  max: number | null; // null means "over"
}

const priceRanges: PriceRange[] = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹1000', min: 500, max: 1000 },
  { label: '₹1000 - ₹2000', min: 1000, max: 2000 },
  { label: 'Over ₹2000', min: 2000, max: null },
];

const Products = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | null>(null);

  const filter = searchParams.get('filter');
  
  // Fetch products from API
  const { data: apiProducts = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });
  
  // Fetch categories with subcategories
  const { data: apiCategories = [] } = useQuery({
    queryKey: ['categoriesActive'],
    queryFn: () => categoriesApi.getAll(true),
  });

  // Transform categories to include subcategories
  const categories: Category[] = useMemo(() => {
    const cats = apiCategories.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId,
      subcategories: c.subcategories?.map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        parentId: sub.parentId,
      })) || [],
    }));

    // Separate parent and child categories
    const parentCategories = cats.filter(c => !c.parentId);
    const childCategories = cats.filter(c => c.parentId);

    // Attach subcategories to parents
    return parentCategories.map(parent => ({
      ...parent,
      subcategories: childCategories.filter(sub => sub.parentId === parent.id),
    }));
  }, [apiCategories]);
  
  // Transform products
  const allProducts: Product[] = apiProducts.map((p: any) => ({
    id: String(p.id),
    slug: p.slug,
    name: p.name,
    price: p.price || p.basePrice || 0,
    originalPrice: p.originalPrice,
    image: p.images?.[0] || '',
    category: p.categoryName || '',
    categoryId: p.categoryId,
    isNew: p.isNew,
    isSale: p.isSale,
    rating: p.rating || 4,
  }));
  
  const getPageTitle = () => {
    switch (filter) {
      case 'new': return 'New Arrivals';
      case 'best': return 'Best Sellers';
      case 'sale': return 'Sale';
      default: return 'All Products';
    }
  };

  // Get available subcategories based on selected category
  const availableSubCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    const category = categories.find(c => c.id === selectedCategoryId);
    return category?.subcategories || [];
  }, [selectedCategoryId, categories]);

  // Handle category selection
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    // Clear subcategory if it doesn't belong to new category
    if (categoryId && selectedSubCategoryId) {
      const category = categories.find(c => c.id === categoryId);
      const subExists = category?.subcategories?.some(sub => sub.id === selectedSubCategoryId);
      if (!subExists) {
        setSelectedSubCategoryId(null);
      }
    }
  };

  // Handle subcategory selection
  const handleSubCategoryChange = (subCategoryId: number | null) => {
    setSelectedSubCategoryId(subCategoryId);
    // Auto-select parent category
    if (subCategoryId) {
      const subCategory = categories
        .flatMap(c => c.subcategories?.map(sub => ({ ...sub, parentId: c.id })) || [])
        .find(sub => sub.id === subCategoryId);
      if (subCategory?.parentId) {
        setSelectedCategoryId(subCategory.parentId);
      }
    }
  };

  // Filter products by all criteria
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter(product => product.categoryId === selectedCategoryId);
    }

    // Filter by subcategory (if selected, it overrides category filter)
    if (selectedSubCategoryId) {
      filtered = filtered.filter(product => product.categoryId === selectedSubCategoryId);
    }

    // Filter by price range (applied last)
    if (selectedPriceRange) {
      filtered = filtered.filter(product => {
        const price = product.price;
        if (selectedPriceRange.max === null) {
          return price >= selectedPriceRange.min;
        }
        return price >= selectedPriceRange.min && price < selectedPriceRange.max;
      });
    }

    // Sort products
    switch (sortBy) {
      case 'newest':
        filtered = [...filtered].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default: // featured
        // Keep original order
        break;
    }

    return filtered;
  }, [allProducts, searchQuery, selectedCategoryId, selectedSubCategoryId, selectedPriceRange, sortBy]);

  const clearAllFilters = () => {
    setSelectedCategoryId(null);
    setSelectedSubCategoryId(null);
    setSelectedPriceRange(null);
  };

  const hasActiveFilters = selectedCategoryId !== null || selectedSubCategoryId !== null || selectedPriceRange !== null;

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
          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedCategoryId && (
                <Badge key="category" variant="secondary" className="gap-1 text-sm py-1 px-3">
                  {categories.find(c => c.id === selectedCategoryId)?.name}
                  <button onClick={() => handleCategoryChange(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedSubCategoryId && (
                <Badge key="subcategory" variant="secondary" className="gap-1 text-sm py-1 px-3">
                  {availableSubCategories.find(sub => sub.id === selectedSubCategoryId)?.name || 
                   categories.flatMap(c => c.subcategories || []).find(sub => sub.id === selectedSubCategoryId)?.name}
                  <button onClick={() => handleSubCategoryChange(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
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
                    {/* Category Filter */}
                    <div>
                      <h4 className="font-medium mb-3">Category</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox 
                            checked={selectedCategoryId === null}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleCategoryChange(null);
                                setSelectedSubCategoryId(null);
                              }
                            }}
                          />
                          <span className="text-sm">All Categories</span>
                        </label>
                        {categories.map((cat) => (
                          <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox 
                              checked={selectedCategoryId === cat.id}
                              onCheckedChange={(checked) => {
                                handleCategoryChange(checked ? cat.id : null);
                              }}
                            />
                            <span className="text-sm">{cat.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Sub-Category Filter */}
                    {(selectedCategoryId || selectedSubCategoryId) && (
                      <div>
                        <h4 className="font-medium mb-3">Sub-Category</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox 
                              checked={selectedSubCategoryId === null}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleSubCategoryChange(null);
                                }
                              }}
                            />
                            <span className="text-sm">All Sub-Categories</span>
                          </label>
                          {availableSubCategories.map((sub) => (
                            <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox 
                                checked={selectedSubCategoryId === sub.id}
                                onCheckedChange={(checked) => {
                                  handleSubCategoryChange(checked ? sub.id : null);
                                }}
                              />
                              <span className="text-sm">{sub.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price Filter */}
                    <div>
                      <h4 className="font-medium mb-3">Price</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox 
                            checked={selectedPriceRange === null}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedPriceRange(null);
                            }}
                          />
                          <span className="text-sm">All Prices</span>
                        </label>
                        {priceRanges.map((range) => (
                          <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox 
                              checked={selectedPriceRange?.label === range.label}
                              onCheckedChange={(checked) => {
                                setSelectedPriceRange(checked ? range : null);
                              }}
                            />
                            <span className="text-sm">{range.label}</span>
                          </label>
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
                <SelectItem value="rating">Best Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-10 lg:gap-14">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-8">
                {/* Category Filter */}
                <div>
                  <h4 className="font-cursive text-2xl mb-5">Category</h4>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <Checkbox 
                        checked={selectedCategoryId === null}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleCategoryChange(null);
                            setSelectedSubCategoryId(null);
                          }
                        }}
                      />
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors text-base">All Categories</span>
                    </label>
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                        <Checkbox 
                          checked={selectedCategoryId === cat.id}
                          onCheckedChange={(checked) => {
                            handleCategoryChange(checked ? cat.id : null);
                          }}
                        />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors text-base">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sub-Category Filter */}
                {(selectedCategoryId || selectedSubCategoryId) && (
                  <div className="border-t border-border pt-8">
                    <h4 className="font-cursive text-2xl mb-5">Sub-Category</h4>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <Checkbox 
                          checked={selectedSubCategoryId === null}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleSubCategoryChange(null);
                            }
                          }}
                        />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors text-base">All Sub-Categories</span>
                      </label>
                      {availableSubCategories.map((sub) => (
                        <label key={sub.id} className="flex items-center gap-3 cursor-pointer group">
                          <Checkbox 
                            checked={selectedSubCategoryId === sub.id}
                            onCheckedChange={(checked) => {
                              handleSubCategoryChange(checked ? sub.id : null);
                            }}
                          />
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors text-base">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Filter */}
                <div className="border-t border-border pt-8">
                  <h4 className="font-cursive text-2xl mb-5">Price Range</h4>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <Checkbox 
                        checked={selectedPriceRange === null}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedPriceRange(null);
                        }}
                      />
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors text-base">All Prices</span>
                    </label>
                    {priceRanges.map((range) => (
                      <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
                        <Checkbox 
                          checked={selectedPriceRange?.label === range.label}
                          onCheckedChange={(checked) => {
                            setSelectedPriceRange(checked ? range : null);
                          }}
                        />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors text-base">{range.label}</span>
                      </label>
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
                    <div className="col-span-full flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      No products found.
                    </div>
                  ) : (
                    filteredProducts.map((product, index) => (
                      <ScrollReveal key={product.id} delay={Math.min(index * 0.03, 0.3)}>
                        <ProductCard product={product} />
                      </ScrollReveal>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-0 border border-border rounded-lg overflow-hidden bg-background">
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No products found.
                    </div>
                  ) : (
                    filteredProducts.map((product, index) => (
                      <ScrollReveal key={product.id} delay={Math.min(index * 0.01, 0.2)}>
                        <ListViewProductCard product={product} />
                      </ScrollReveal>
                    ))
                  )}
                </div>
              )}

              {/* Pagination */}
              <div className="flex justify-center items-center gap-3 mt-16">
                <Button variant="outline" disabled className="h-11">Previous</Button>
                <Button variant="secondary" className="w-11 h-11">1</Button>
                <Button variant="ghost" className="w-11 h-11">2</Button>
                <Button variant="ghost" className="w-11 h-11">3</Button>
                <span className="px-2">...</span>
                <Button variant="ghost" className="w-11 h-11">10</Button>
                <Button variant="outline" className="h-11">Next</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
