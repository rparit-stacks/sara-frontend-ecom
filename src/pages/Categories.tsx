import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Loader2 } from 'lucide-react';
import { categoriesApi } from '@/lib/api';

const Categories = () => {
  // Fetch categories from API with user email if logged in
  const { data: apiCategories = [], isLoading } = useQuery({
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
  
  // Transform categories - only show parent categories (no parentId)
  const categories = apiCategories
    .filter((c: any) => !c.parentId) // Only parent categories
    .map((c: any) => ({
      id: String(c.id),
      slug: c.slug || '',
      name: c.name,
      image: c.image || 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=700&fit=crop',
      count: c.subcategories?.length || 0, // Count of subcategories
      description: c.description || '',
    }));

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="w-full bg-secondary/30 py-12 sm:py-16 lg:py-20 xl:py-28">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <ScrollReveal>
            <div className="text-center max-w-4xl mx-auto">
              <span className="text-primary uppercase tracking-[0.15em] xs:tracking-[0.2em] text-xs xs:text-sm font-medium">Browse Collection</span>
              <h1 className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-3 xs:mt-4 mb-4 xs:mb-5 sm:mb-6">
                Shop by Category
              </h1>
              <p className="text-sm xs:text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed px-2">
                Explore our diverse collection of prints and patterns, each category offering unique designs to match your style.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="w-full py-8 sm:py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          {categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No categories available
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 lg:gap-8">
              {categories.map((category, index) => (
                <ScrollReveal key={category.id} delay={index * 0.05}>
                  <Link to={`/category/${category.slug}`} className="group block">
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="card-floral overflow-hidden"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 xs:p-4 sm:p-5 lg:p-6 xl:p-8">
                          <h3 className="font-cursive text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-white mb-1 xs:mb-1.5 sm:mb-2 leading-tight">{category.name}</h3>
                          <p className="text-white/80 text-xs sm:text-sm lg:text-base mb-1 xs:mb-1.5 sm:mb-2 hidden sm:block">{category.description}</p>
                          <span className="text-white/60 text-[10px] xs:text-xs sm:text-sm hidden xs:block">{category.count} {category.count === 1 ? 'Category' : 'Categories'}</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Categories;
