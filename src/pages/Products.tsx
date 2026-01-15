import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Grid, List, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { productsApi, categoriesApi } from '@/lib/api';

const priceRanges = ['Under ₹500', '₹500 - ₹1000', '₹1000 - ₹2000', 'Over ₹2000'];
const colors = ['White', 'Pink', 'Green', 'Blue', 'Yellow', 'Multi'];

const Products = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filter = searchParams.get('filter');
  
  // Fetch products from API
  const { data: apiProducts = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });
  
  // Fetch categories
  const { data: apiCategories = [] } = useQuery({
    queryKey: ['categoriesActive'],
    queryFn: () => categoriesApi.getAll(true),
  });
  
  // Transform products
  const allProducts: Product[] = apiProducts.map((p: any) => ({
    id: String(p.id),
    slug: p.slug,
    name: p.name,
    price: p.price || p.basePrice || 0,
    originalPrice: p.originalPrice,
    image: p.images?.[0] || '',
    category: p.categoryName || '',
    isNew: p.isNew,
    isSale: p.isSale,
    rating: p.rating || 4,
  }));
  
  // Get category names
  const categories = ['All', ...apiCategories.map((c: any) => c.name)];
  
  const getPageTitle = () => {
    switch (filter) {
      case 'new': return 'New Arrivals';
      case 'best': return 'Best Sellers';
      case 'sale': return 'Sale';
      default: return 'All Products';
    }
  };

  const removeFilter = (filter: string) => {
    setSelectedFilters(prev => prev.filter(f => f !== filter));
  };
  
  // Filter products by search query and selected filters
  const filteredProducts = allProducts.filter((product) => {
    const matchesSearch = !searchQuery || product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedFilters.length === 0 || selectedFilters.some(f => product.category === f);
    return matchesSearch && matchesCategory;
  });

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
          {selectedFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedFilters.map((filter) => (
                <Badge key={filter} variant="secondary" className="gap-1 text-sm py-1 px-3">
                  {filter}
                  <button onClick={() => removeFilter(filter)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setSelectedFilters([])}>
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
                    <div>
                      <h4 className="font-medium mb-3">Category</h4>
                      <div className="space-y-2">
                        {categories.map((cat) => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox />
                            <span className="text-sm">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Price</h4>
                      <div className="space-y-2">
                        {priceRanges.map((range) => (
                          <label key={range} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox />
                            <span className="text-sm">{range}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Color</h4>
                      <div className="space-y-2">
                        {colors.map((color) => (
                          <label key={color} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox />
                            <span className="text-sm">{color}</span>
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
                <div>
                  <h4 className="font-cursive text-2xl mb-5">Category</h4>
                  <div className="space-y-4">
                    {categories.map((cat) => (
                      <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                        <Checkbox />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors text-base">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border pt-8">
                  <h4 className="font-cursive text-2xl mb-5">Price Range</h4>
                  <div className="space-y-4">
                    {priceRanges.map((range) => (
                      <label key={range} className="flex items-center gap-3 cursor-pointer group">
                        <Checkbox />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors text-base">{range}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border pt-8">
                  <h4 className="font-cursive text-2xl mb-5">Color</h4>
                  <div className="space-y-4">
                    {colors.map((color) => (
                      <label key={color} className="flex items-center gap-3 cursor-pointer group">
                        <Checkbox />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors text-base">{color}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1 min-w-0">
              <div className={`grid gap-6 lg:gap-8 ${
                viewMode === 'grid' 
                  ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
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
