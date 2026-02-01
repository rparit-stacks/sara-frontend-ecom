import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Grid, List, Search, ArrowLeft } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { categoriesApi, productsApi } from '@/lib/api';
import { ProductCardSkeleton } from '@/components/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

const CategoryProducts = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [subcategorySearchQuery, setSubcategorySearchQuery] = useState('');
  
  // Fetch category details
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesApi.getById(Number(id!)),
    enabled: !!id,
  });
  
  // Get user email if logged in
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

  // Fetch products for this category
  const { data: apiProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['categoryProducts', id, userEmail],
    queryFn: () => productsApi.getAll({ categoryId: Number(id!), status: 'ACTIVE', userEmail: userEmail || undefined }),
    enabled: !!id,
  });
  
  // Transform products (slug || id for /product links; ProductDetail supports both)
  const products: Product[] = apiProducts.map((p: any) => ({
    id: String(p.id),
    slug: p.slug || String(p.id),
    name: p.name,
    price: p.price || p.basePrice || 0,
    originalPrice: p.originalPrice,
    image: p.images?.[0] || '',
    category: p.categoryName || '',
    isNew: p.isNew,
    isSale: p.isSale,
    rating: p.rating || 4,
    createdAt: p.createdAt,
  }));
  
  // Filter products by search query
  let filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply sorting
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        const aDate = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
        const bDate = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
        return bDate - aDate;
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      default:
        return 0;
    }
  });
  
  // Check if category has subcategories
  const hasSubcategories = category?.subcategories && category.subcategories.length > 0;
  const subcategories = category?.subcategories || [];
  
  // Filter subcategories by search query
  const filteredSubcategories = subcategories.filter((sub: any) =>
    sub.name?.toLowerCase().includes(subcategorySearchQuery.toLowerCase()) ||
    sub.description?.toLowerCase().includes(subcategorySearchQuery.toLowerCase())
  );

  if (categoryLoading) {
    return (
      <Layout>
        <section className="w-full bg-secondary/30 py-8 sm:py-12 lg:py-16 xl:py-20">
          <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 lg:py-16 xl:py-20">
          <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-destructive">Category not found</p>
          <Link to="/categories">
            <Button className="mt-4">Back to Categories</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="w-full bg-secondary/30 py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <ScrollReveal>
            <Breadcrumb className="mb-3 xs:mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/categories">Categories</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{category.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-4 mb-4">
              {category.image && (
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="font-cursive text-3xl xs:text-4xl sm:text-5xl lg:text-6xl">{category.name}</h1>
                {category.description && (
                  <p className="text-muted-foreground mt-2 xs:mt-3 text-sm xs:text-base sm:text-lg">{category.description}</p>
                )}
              </div>
            </div>
            {hasSubcategories ? (
              <p className="text-muted-foreground text-sm xs:text-base sm:text-lg">
                {subcategories.length} {subcategories.length === 1 ? 'Subcategory' : 'Subcategories'}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm xs:text-base sm:text-lg">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
              </p>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* Content */}
      <section className="w-full py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          {hasSubcategories ? (
            // Show subcategories
            <div>
              <div className="mb-6">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
              
              {/* Subcategory Search */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search subcategories..."
                    value={subcategorySearchQuery}
                    onChange={(e) => setSubcategorySearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredSubcategories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No subcategories found matching "{subcategorySearchQuery}"</p>
                  <Button 
                    variant="link" 
                    onClick={() => setSubcategorySearchQuery('')}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {filteredSubcategories.map((sub: any, index: number) => (
                  <ScrollReveal key={sub.id} delay={index * 0.05}>
                    <Link to={`/category/${id}/subcategory/${sub.id}`} className="group block">
                      <div className="card-floral overflow-hidden">
                        <div className="relative aspect-[3/4] overflow-hidden">
                          <img
                            src={sub.image || 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=700&fit=crop'}
                            alt={sub.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                            <h3 className="font-cursive text-xl sm:text-2xl lg:text-3xl text-white mb-2">{sub.name}</h3>
                            {sub.subcategories && sub.subcategories.length > 0 && (
                              <span className="text-white/80 text-sm">{sub.subcategories.length} Subcategories</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </ScrollReveal>
                ))}
                </div>
              )}
            </div>
          ) : filteredProducts.length === 0 && !hasSubcategories ? (
            // Empty category - no products and no subcategories
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <p className="text-lg font-semibold text-foreground mb-2">No products available in this category.</p>
                <p className="text-muted-foreground mb-4">This category currently has no products or subcategories.</p>
                <Link to="/categories">
                  <Button variant="outline">Browse Other Categories</Button>
                </Link>
              </div>
            </div>
          ) : (
            // Show products
            <>
              {/* Search Bar */}
              <div className="mb-4 sm:mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 sm:pl-10 pr-4 h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
              </div>
              
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 lg:mb-10">
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="w-full sm:w-auto">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Products Grid/List */}
              {productsLoading ? (
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6'
                  : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6'
                }>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <p className="text-lg font-semibold text-foreground mb-2">
                      {searchQuery.trim() ? 'No products found' : 'No products available in this category.'}
                    </p>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery.trim()
                        ? 'Try a different search term or clear the search to see all products.'
                        : 'This category currently has no products.'}
                    </p>
                    {searchQuery.trim() ? (
                      <Button variant="outline" onClick={() => setSearchQuery('')}>
                        Clear search
                      </Button>
                    ) : (
                      <Link to="/categories">
                        <Button variant="outline">Browse Other Categories</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6'
                  : 'space-y-4'
                }>
                  {filteredProducts.map((product, index) => (
                    <ScrollReveal key={product.id} delay={Math.min(index * 0.03, 0.3)}>
                      <ProductCard product={product} />
                    </ScrollReveal>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default CategoryProducts;
