import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Grid, List, SlidersHorizontal } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';

// Mock products
const products: Product[] = [
  { id: '1', name: 'Rose Garden Silk Scarf', price: 899, originalPrice: 1200, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=500&fit=crop', category: 'Scarves', isNew: true },
  { id: '2', name: 'Lavender Fields Cushion', price: 450, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=500&fit=crop', category: 'Home Decor' },
  { id: '3', name: 'Cherry Blossom Dress', price: 1599, originalPrice: 1999, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop', category: 'Clothing', isSale: true },
  { id: '4', name: 'Wildflower Print Tote', price: 350, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop', category: 'Bags', isNew: true },
  { id: '5', name: 'Peony Paradise Blouse', price: 799, image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=500&fit=crop', category: 'Clothing' },
  { id: '6', name: 'Tropical Leaf Throw', price: 680, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=500&fit=crop', category: 'Home Decor' },
  { id: '7', name: 'Daisy Chain Earrings', price: 280, image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=500&fit=crop', category: 'Jewelry', isNew: true },
  { id: '8', name: 'Sunflower Print Skirt', price: 650, image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0unk?w=400&h=500&fit=crop', category: 'Clothing' },
];

const categories = ['All', 'Clothing', 'Home Decor', 'Bags', 'Jewelry', 'Scarves'];
const priceRanges = ['Under ₹500', '₹500 - ₹1000', '₹1000 - ₹2000', 'Over ₹2000'];

const CategoryProducts = () => {
  const { id } = useParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');

  return (
    <Layout>
      {/* Hero */}
      <section className="w-full bg-secondary/30 py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <ScrollReveal>
            <nav className="text-sm text-muted-foreground mb-4">
              <span>Home</span>
              <span className="mx-2">/</span>
              <span>Categories</span>
              <span className="mx-2">/</span>
              <span className="text-foreground">Floral Prints</span>
            </nav>
            <h1 className="font-cursive text-5xl lg:text-6xl">Floral Prints</h1>
            <p className="text-muted-foreground mt-3 text-lg">48 Products</p>
          </ScrollReveal>
        </div>
      </section>

      {/* Products Section */}
      <section className="w-full py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
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
                <SheetContent side="left">
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
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1 min-w-0">
              <div className={`grid gap-6 lg:gap-8 ${
                viewMode === 'grid' 
                  ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {products.map((product, index) => (
                  <ScrollReveal key={product.id} delay={index * 0.05}>
                    <ProductCard product={product} />
                  </ScrollReveal>
                ))}
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

export default CategoryProducts;
