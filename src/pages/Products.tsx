import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, List, SlidersHorizontal, X } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Mock all products
const allProducts: Product[] = [
  { id: '1', name: 'Rose Garden Silk Scarf', price: 89.99, originalPrice: 120, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=500&fit=crop', category: 'Scarves', isNew: true },
  { id: '2', name: 'Lavender Fields Cushion', price: 45.00, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=500&fit=crop', category: 'Home Decor' },
  { id: '3', name: 'Cherry Blossom Dress', price: 159.99, originalPrice: 199, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop', category: 'Clothing', isSale: true },
  { id: '4', name: 'Wildflower Print Tote', price: 35.00, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop', category: 'Bags', isNew: true },
  { id: '5', name: 'Peony Paradise Blouse', price: 79.99, image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=500&fit=crop', category: 'Clothing' },
  { id: '6', name: 'Tropical Leaf Throw', price: 68.00, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=500&fit=crop', category: 'Home Decor' },
  { id: '7', name: 'Daisy Chain Earrings', price: 28.00, image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=500&fit=crop', category: 'Jewelry', isNew: true },
  { id: '8', name: 'Sunflower Print Skirt', price: 65.00, image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0unk?w=400&h=500&fit=crop', category: 'Clothing' },
  { id: '9', name: 'Orchid Silk Blouse', price: 125.00, image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=400&h=500&fit=crop', category: 'Clothing' },
  { id: '10', name: 'Botanical Print Cushion Set', price: 89.00, originalPrice: 110, image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400&h=500&fit=crop', category: 'Home Decor', isSale: true },
  { id: '11', name: 'Floral Pendant Necklace', price: 48.00, image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&h=500&fit=crop', category: 'Jewelry', isNew: true },
  { id: '12', name: 'Garden Party Maxi Dress', price: 189.00, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop', category: 'Clothing' },
];

const categories = ['All', 'Clothing', 'Home Decor', 'Bags', 'Jewelry', 'Scarves'];
const priceRanges = ['Under $50', '$50 - $100', '$100 - $200', 'Over $200'];
const colors = ['White', 'Pink', 'Green', 'Blue', 'Yellow', 'Multi'];

const Products = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filter = searchParams.get('filter');
  
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

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-secondary/30 py-12 md:py-16 overflow-x-hidden">
        <div className="container-custom max-w-full overflow-x-hidden">
          <ScrollReveal>
            <nav className="text-sm text-muted-foreground mb-4">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span className="text-foreground">{getPageTitle()}</span>
            </nav>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl">{getPageTitle()}</h1>
                <p className="text-muted-foreground mt-2">{allProducts.length} Products</p>
              </div>
              <div className="flex-1 max-w-md">
                <Input 
                  type="search" 
                  placeholder="Search products..." 
                  className="rounded-full"
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Products Section */}
      <section className="section-padding overflow-x-hidden">
        <div className="container-custom max-w-full overflow-x-hidden">
          {/* Active Filters */}
          {selectedFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedFilters.map((filter) => (
                <Badge key={filter} variant="secondary" className="gap-1">
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              {/* Mobile Filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
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
                  className="w-8 h-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
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

          <div className="flex gap-8 max-w-full w-full">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                <div>
                  <h4 className="font-serif text-lg mb-4">Category</h4>
                  <div className="space-y-3">
                    {categories.map((cat) => (
                      <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                        <Checkbox />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border pt-6">
                  <h4 className="font-serif text-lg mb-4">Price Range</h4>
                  <div className="space-y-3">
                    {priceRanges.map((range) => (
                      <label key={range} className="flex items-center gap-3 cursor-pointer group">
                        <Checkbox />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{range}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border pt-6">
                  <h4 className="font-serif text-lg mb-4">Color</h4>
                  <div className="space-y-3">
                    {colors.map((color) => (
                      <label key={color} className="flex items-center gap-3 cursor-pointer group">
                        <Checkbox />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{color}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1 min-w-0 max-w-full">
              <div className={`grid gap-4 md:gap-6 w-full max-w-full ${
                viewMode === 'grid' 
                  ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {allProducts.map((product, index) => (
                  <ScrollReveal key={product.id} delay={index * 0.03}>
                    <ProductCard product={product} />
                  </ScrollReveal>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button variant="outline" disabled>Previous</Button>
                <Button variant="secondary" className="w-10 h-10">1</Button>
                <Button variant="ghost" className="w-10 h-10">2</Button>
                <Button variant="ghost" className="w-10 h-10">3</Button>
                <span className="px-2">...</span>
                <Button variant="ghost" className="w-10 h-10">10</Button>
                <Button variant="outline">Next</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Products;
