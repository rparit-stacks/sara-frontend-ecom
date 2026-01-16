import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';
import { cmsApi, productsApi, categoriesApi, subscribeEmail } from '@/lib/api';
import { toast } from 'sonner';

// Default hero slides
const defaultHeroSlides = [
  {
    id: 1,
    title: 'New Collection 2024',
    subtitle: 'Embrace the Art of Floral',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1920&h=1080&fit=crop',
    cta: 'Shop Now',
    link: '/products',
  },
  {
    id: 2,
    title: 'Artisan Series',
    subtitle: 'Traditional Meets Modern',
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1920&h=1080&fit=crop',
    cta: 'Explore',
    link: '/categories',
  },
  {
    id: 3,
    title: 'Custom Designs',
    subtitle: 'Create Your Own',
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1920&h=1080&fit=crop',
    cta: 'Customize',
    link: '/customize',
  },
];

const features = [
  {
    icon: 'fa-pen-fancy',
    title: 'Artisanal prints & embroideries',
    desc: 'Hand-drawn motifs carefully developed by expert designers',
  },
  {
    icon: 'fa-scissors',
    title: 'Made to order',
    desc: 'Each piece is produced on demand for you',
  },
  {
    icon: 'fa-feather-pointed',
    title: 'Premium pure fabrics',
    desc: 'A curated selection of premium silks, cottons and blends',
  },
  {
    icon: 'fa-layer-group',
    title: 'Low minimum order quantity',
    desc: 'Start small without compromising on craftsmanship',
  },
];

// Default Instagram Posts
const defaultInstagramPosts: Array<{ imageUrl: string; linkUrl?: string }> = [
  { imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop' },
  { imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=400&fit=crop' },
  { imageUrl: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=400&fit=crop' },
  { imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=400&fit=crop' },
];

// Default testimonials
const defaultTestimonials = [
  { id: 1, name: 'Priya Sharma', text: 'Beautiful quality! The prints are stunning and the fabric is so soft.', rating: 5, location: 'Mumbai' },
  { id: 2, name: 'Anita Reddy', text: 'Fast delivery and gorgeous packaging. The kurti fits perfectly.', rating: 5, location: 'Bangalore' },
  { id: 3, name: 'Meera Patel', text: 'The customization options are amazing. Highly recommend!', rating: 5, location: 'Ahmedabad' },
];

const Index = () => {
  const [heroRef, heroApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
  const [productsRef] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay({ delay: 4000 })]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');

  const scrollTo = useCallback((index: number) => heroApi?.scrollTo(index), [heroApi]);

  useEffect(() => {
    if (!heroApi) return;
    heroApi.on('select', () => setCurrentSlide(heroApi.selectedScrollSnap()));
  }, [heroApi]);
  
  // Fetch CMS homepage data
  const { data: cmsData } = useQuery({
    queryKey: ['cmsHomepage'],
    queryFn: () => cmsApi.getHomepage(),
  });
  
  // Fetch products for best sellers and new arrivals
  const { data: apiProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });
  
  // Fetch categories
  const { data: apiCategories = [] } = useQuery({
    queryKey: ['categoriesActive'],
    queryFn: () => categoriesApi.getAll(true),
  });
  
  // Email subscription mutation
  const subscribeMutation = useMutation({
    mutationFn: (email: string) => subscribeEmail(email),
    onSuccess: () => {
      toast.success('Successfully subscribed!');
      setEmail('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to subscribe. Please try again.');
    },
  });
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    subscribeMutation.mutate(email);
  };
  
  // Transform products for display
  const transformProduct = (p: any): Product => ({
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
  });
  
  // Get featured products (best sellers) - use DB data if available, otherwise use mock
  const bestSellerIds = cmsData?.bestSellerIds || cmsData?.bestSellers || [];
  let featuredProducts: Product[] = [];
  
  // Always prioritize DB data if it exists
  if (bestSellerIds && bestSellerIds.length > 0) {
    // Use DB data - map product IDs to actual products
    // Handle both number and string IDs
    featuredProducts = bestSellerIds
      .map((id: number | string) => {
        const productId = typeof id === 'string' ? Number(id) : id;
        return apiProducts.find((p: any) => p.id === productId || String(p.id) === String(id));
      })
      .filter(Boolean)
      .map(transformProduct);
  }
  
  // Only fallback to mock data if DB is truly empty (no IDs set in admin panel)
  if (featuredProducts.length === 0 && apiProducts.length > 0) {
    // Show first 8 products as fallback
    featuredProducts = apiProducts
      .slice(0, 8)
      .map(transformProduct);
  }
  
  // Get new arrivals - use DB data if available, otherwise use mock
  const newArrivalIds = cmsData?.newArrivalIds || cmsData?.newArrivals || [];
  let newArrivals: Product[] = [];
  
  // Always prioritize DB data if it exists
  if (newArrivalIds && newArrivalIds.length > 0) {
    // Use DB data - map product IDs to actual products
    // Handle both number and string IDs
    newArrivals = newArrivalIds
      .map((id: number | string) => {
        const productId = typeof id === 'string' ? Number(id) : id;
        return apiProducts.find((p: any) => p.id === productId || String(p.id) === String(id));
      })
      .filter(Boolean)
      .map(transformProduct);
  }
  
  // Only fallback to mock data if DB is truly empty (no IDs set in admin panel)
  if (newArrivals.length === 0 && apiProducts.length > 0) {
    // Show first 8 products as fallback
    newArrivals = apiProducts
      .slice(0, 8)
      .map(transformProduct);
  }
  
  // Get testimonials from CMS or use defaults
  const testimonials = (cmsData?.testimonials || defaultTestimonials)
    .filter((t: any) => t.isActive !== false)
    .slice(0, 10);
  
  // Get Instagram posts from CMS or use defaults
  // Handle both old format (string[]) and new format (Array<{imageUrl, linkUrl}>)
  const instagramPosts = (() => {
    if (cmsData?.instagramPosts?.length) {
      const posts = cmsData.instagramPosts;
      if (typeof posts[0] === 'string') {
        // Old format - convert to new format
        return posts.map((url: string) => ({ imageUrl: url }));
      }
      return posts;
    }
    return defaultInstagramPosts;
  })();
  
  // Get categories from API - only parent categories (no parentId)
  const categories = apiCategories.length 
    ? apiCategories
        .filter((c: any) => !c.parentId) // Only parent categories
        .map((c: any) => ({
          id: String(c.id),
          slug: c.slug || '',
          name: c.name,
          image: c.image || 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=800&fit=crop',
          count: c.subcategories?.length || 0, // Count of subcategories
        }))
    : [
        { id: '1', name: 'Floral', image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=800&fit=crop', count: 48 },
        { id: '2', name: 'Botanical', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&h=800&fit=crop', count: 36 },
      ];
  
  // Hero slides - use banners from CMS if available, otherwise use defaults
  const banners = cmsData?.banners || [];
  const heroSlides = banners.length > 0 
    ? banners.map((banner: any, index: number) => ({
        id: banner.id || index + 1,
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        image: banner.image || '',
        cta: banner.buttonText || 'Shop Now',
        link: banner.link || '/products',
      }))
    : defaultHeroSlides;

  return (
    <Layout>
      {/* Hero Slider - Full Width */}
      <section className="relative w-full">
        <div ref={heroRef} className="overflow-hidden">
          <div className="flex">
            {heroSlides.map((slide) => (
              <div key={slide.id} className="flex-[0_0_100%] min-w-0 relative h-[65vh] sm:h-[75vh] lg:h-[85vh]">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-foreground/40" />
                <div className="absolute inset-0 flex items-center justify-center text-center text-white px-3 xs:px-4 sm:px-6">
                  <div className="max-w-4xl w-full">
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs xs:text-sm sm:text-lg md:text-xl uppercase tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.3em] mb-2 xs:mb-3 sm:mb-4"
                    >
                      {slide.title}
                    </motion.p>
                    <motion.h1 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="font-cursive text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl mb-4 xs:mb-6 sm:mb-8 leading-tight"
                    >
                      {slide.subtitle}
                    </motion.h1>
                    <Link to={slide.link}>
                      <Button className="btn-primary px-5 xs:px-6 sm:px-10 py-2.5 xs:py-3 sm:py-4 text-xs xs:text-sm sm:text-base">{slide.cta}</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 xs:bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 xs:gap-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-2 xs:h-2.5 rounded-full transition-all ${
                currentSlide === index ? 'w-6 xs:w-8 sm:w-10 bg-primary' : 'w-2 xs:w-2.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features Bar - Full Width */}
      <section className="w-full bg-muted py-4 xs:py-6 sm:py-8 lg:py-10 xl:py-12 border-y border-border overflow-x-auto">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="flex flex-row sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 lg:gap-8 xl:gap-12 min-w-max sm:min-w-0">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center justify-center text-center gap-2 xs:gap-3 sm:gap-4 min-w-[150px] xs:min-w-[170px] sm:min-w-0"
              >
                <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-full bg-[#2b9d8f]/10 flex items-center justify-center flex-shrink-0">
                  <i className={`fa-solid ${feature.icon} text-xs xs:text-sm sm:text-base lg:text-lg xl:text-xl text-[#2b9d8f]`}></i>
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-[10px] xs:text-xs sm:text-sm lg:text-base xl:text-lg truncate">{feature.title}</h4>
                  <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm text-muted-foreground hidden xs:block truncate">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories - Signature Prints & Embroideries */}
      <section 
        className="w-full py-12 xs:py-16 sm:py-20 lg:py-28 relative"
        style={{
          backgroundImage: 'url(/bg_images/thumbnail.png)',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute inset-0 bg-background/90" />
        <div className="relative max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-8 xs:mb-10 sm:mb-16">
            <ScrollReveal>
              <span className="text-primary uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] text-xs xs:text-sm font-medium">
                Signature Collections
              </span>
              <h2 className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-2 xs:mt-3 sm:mt-4">
                Prints &amp; Embroideries
              </h2>
            </ScrollReveal>
          </div>
          <div className="overflow-x-auto -mx-3 xs:-mx-4 sm:-mx-6 lg:-mx-12 px-3 xs:px-4 sm:px-6 lg:px-12 scrollbar-hide">
            <div className="flex gap-3 xs:gap-4 sm:gap-6 lg:gap-8 min-w-max pb-4">
              {categories.map((category, index) => (
                <ScrollReveal key={category.id} delay={index * 0.1}>
                  <Link to={`/category/${category.slug}`} className="group block flex-shrink-0">
                    <div className="relative w-[180px] xs:w-[220px] sm:w-[280px] md:w-[320px] lg:w-[360px] aspect-[3/4] rounded-xl xs:rounded-2xl overflow-hidden shadow-lg">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                      <div className="absolute inset-0 flex flex-col items-center justify-end text-white pb-4 xs:pb-6 sm:pb-8 lg:pb-10">
                        <h3 className="font-cursive text-2xl xs:text-3xl sm:text-4xl lg:text-5xl mb-1 xs:mb-2">{category.name}</h3>
                        <p className="text-xs xs:text-sm lg:text-base text-white/80">{category.count} {category.count === 1 ? 'Category' : 'Categories'}</p>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Slider - Full Width */}
      <section className="w-full py-12 xs:py-16 sm:py-20 lg:py-28 bg-muted overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 xs:gap-6 mb-8 xs:mb-10 sm:mb-14">
            <div>
              <ScrollReveal>
                <span className="text-primary uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] text-xs xs:text-sm font-medium">Trending Now</span>
                <h2 className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-2 xs:mt-3 sm:mt-4">Best Sellers</h2>
              </ScrollReveal>
            </div>
            <Link to="/products">
              <Button variant="outline" className="btn-outline text-xs xs:text-sm">View All Products</Button>
            </Link>
          </div>
          <div ref={productsRef} className="overflow-hidden -mx-2 xs:-mx-3">
            <div className="flex gap-3 xs:gap-4 sm:gap-6 lg:gap-8 px-2 xs:px-3">
              {featuredProducts.map((product) => (
                <div key={product.id} className="flex-[0_0_160px] xs:flex-[0_0_200px] sm:flex-[0_0_260px] md:flex-[0_0_300px] lg:flex-[0_0_340px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Full Width Banner - Create Your Own Design */}
      <section 
        className="relative w-full py-16 xs:py-20 sm:py-32 lg:py-44"
        style={{
          backgroundImage: 'url(/bg_images/661653d7e241afba33eeb02dc6a09f9e%20copy.png)',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute inset-0 bg-foreground/75" />
        <div className="relative max-w-4xl mx-auto text-center text-white px-3 xs:px-4 sm:px-6">
          <ScrollReveal>
            <span className="text-xs xs:text-sm uppercase tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.3em] text-white/80 mb-2 xs:mb-3 sm:mb-4 block">
              Personalized for you
            </span>
            <h2 className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-3 xs:mb-4 sm:mb-6">
              <span className="block">Create your own design</span>
            </h2>
            <p className="text-sm xs:text-base sm:text-lg lg:text-xl text-white/80 mb-6 xs:mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Get personalized print and embroidery design services from a team of professionals with motifs and colour palette of your choice.
            </p>
            <Link to="/customize">
              <Button className="bg-white text-foreground hover:bg-white/90 rounded-full px-6 xs:px-8 sm:px-10 py-2.5 xs:py-3 sm:py-4 text-xs xs:text-sm sm:text-base font-semibold">
                Custom Design
              </Button>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* New Arrivals - Full Width Grid */}
      <section className="w-full py-12 xs:py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 xs:gap-6 mb-8 xs:mb-10 sm:mb-14">
            <div>
              <ScrollReveal>
                <span className="text-primary uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] text-xs xs:text-sm font-medium">Just Arrived</span>
                <h2 className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-2 xs:mt-3 sm:mt-4">New Arrivals</h2>
              </ScrollReveal>
            </div>
            <Link to="/products?filter=new">
              <Button variant="outline" className="btn-outline text-xs xs:text-sm">Shop All New</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-6 lg:gap-8">
            {newArrivals.map((product, index) => (
              <ScrollReveal key={product.id} delay={index * 0.1}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Highlights - Stats Block */}
      <section className="w-full py-10 xs:py-12 sm:py-16 lg:py-20 bg-secondary/40">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xs:gap-6 sm:gap-8 text-center">
            <ScrollReveal>
              <div className="bg-white rounded-xl border border-border py-4 xs:py-5 sm:py-6 px-2">
                <div className="font-cursive text-2xl xs:text-3xl sm:text-4xl text-primary mb-1">50+</div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground uppercase tracking-[0.12em]">
                  Brands served
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.05}>
              <div className="bg-white rounded-xl border border-border py-4 xs:py-5 sm:py-6 px-2">
                <div className="font-cursive text-2xl xs:text-3xl sm:text-4xl text-primary mb-1">1000+</div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground uppercase tracking-[0.12em]">
                  Orders delivered
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <div className="bg-white rounded-xl border border-border py-4 xs:py-5 sm:py-6 px-2">
                <div className="font-cursive text-2xl xs:text-3xl sm:text-4xl text-primary mb-1">150+</div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground uppercase tracking-[0.12em]">
                  Fabrics
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <div className="bg-white rounded-xl border border-border py-4 xs:py-5 sm:py-6 px-2">
                <div className="font-cursive text-2xl xs:text-3xl sm:text-4xl text-primary mb-1">100%</div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground uppercase tracking-[0.12em]">
                  Transparency
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Testimonials - Full Width */}
      <section className="w-full py-12 xs:py-16 sm:py-20 lg:py-28 bg-muted">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-8 xs:mb-10 sm:mb-16">
            <ScrollReveal>
              <span className="text-primary uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] text-xs xs:text-sm font-medium">Customer Love</span>
              <h2 className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-2 xs:mt-3 sm:mt-4">What They Say</h2>
            </ScrollReveal>
          </div>
          <div className="overflow-x-auto -mx-3 xs:-mx-4 sm:-mx-6 lg:-mx-12 px-3 xs:px-4 sm:px-6 lg:px-12 scrollbar-hide">
            <div className="flex gap-3 xs:gap-4 sm:gap-6 lg:gap-8 min-w-max pb-4">
              {testimonials.map((testimonial, index) => (
                <ScrollReveal key={testimonial.id} delay={index * 0.1}>
                  <div className="bg-white p-4 xs:p-6 sm:p-8 lg:p-10 rounded-xl xs:rounded-2xl border border-border h-full flex flex-col w-[240px] xs:w-[280px] sm:w-[320px] md:w-[380px] lg:w-[420px] flex-shrink-0">
                    <div className="flex gap-0.5 xs:gap-1 mb-3 xs:mb-4 sm:mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <i key={i} className="fa-solid fa-star text-sm xs:text-base sm:text-lg text-primary"></i>
                      ))}
                    </div>
                    <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 xs:mb-6 sm:mb-8 leading-relaxed flex-1">"{testimonial.text}"</p>
                    <div>
                      <p className="font-semibold text-sm xs:text-base sm:text-lg">{testimonial.name}</p>
                      <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="w-full py-12 xs:py-16 sm:py-20 lg:py-28 relative">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-8 xs:mb-10 sm:mb-16">
            <ScrollReveal>
              <span className="text-primary uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] text-xs xs:text-sm font-medium">Our Promise</span>
              <h2 className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-2 xs:mt-3 sm:mt-4">Why Choose Us</h2>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-6 lg:gap-10">
            {[
              {
                icon: 'fa-hand-holding-heart',
                title: 'Crafted with love',
                desc: 'Each piece is carefully crafted by our skilled artisans with care and attention to detail.',
              },
              {
                icon: 'fa-leaf',
                title: 'Eco-Friendly',
                desc: 'We use sustainable materials, eco-conscious processes and azo-free dyes for printing.',
              },
              { icon: 'fa-medal', title: 'Premium Quality', desc: 'Only the finest fabrics and materials make it to your wardrobe' },
              { icon: 'fa-truck', title: 'Pan India Delivery', desc: 'Reliable delivery to every corner of India' },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 0.1}>
                <div className="text-center p-3 xs:p-4 sm:p-6 lg:p-10 bg-white/90 backdrop-blur-sm rounded-xl xs:rounded-2xl border border-border h-full">
                  <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 xs:mb-4 sm:mb-6">
                    <i className={`fa-solid ${item.icon} text-base xs:text-lg sm:text-2xl lg:text-3xl text-primary`}></i>
                  </div>
                  <h4 className="font-semibold text-xs xs:text-sm sm:text-lg lg:text-xl mb-1 xs:mb-2 sm:mb-3">{item.title}</h4>
                  <p className="text-[10px] xs:text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed hidden xs:block">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-12 xs:py-16 sm:py-20 lg:py-28 bg-secondary">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-8 xs:mb-10 sm:mb-16">
            <ScrollReveal>
              <span className="text-primary uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] text-xs xs:text-sm font-medium">Simple Process</span>
              <h2 className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-2 xs:mt-3 sm:mt-4">How It Works</h2>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-6 xs:gap-4 sm:gap-12 lg:gap-16">
            {[
              {
                step: '01',
                title: 'Choose a ready design or make your own',
                desc: 'Start with our curated collections or upload your own artwork for a fully custom journey.',
              },
              {
                step: '02',
                title: 'Select fabric quality',
                desc: 'Pick from a range of premium base fabrics tailored to your product and budget.',
              },
              {
                step: '03',
                title: 'Choose quantity',
                desc: 'Order with low minimums and full transparency at every stage of production.',
              },
              {
                step: '04',
                title: 'Get your order at your doorstep',
                desc: 'Receive your beautifully crafted order delivered safely to your doorstep.',
              },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 0.15}>
                <div className="text-center">
                  <span className="font-cursive text-5xl xs:text-6xl sm:text-8xl lg:text-9xl text-primary/20">{item.step}</span>
                  <h4 className="font-semibold text-lg xs:text-xl sm:text-2xl lg:text-3xl -mt-3 xs:-mt-4 sm:-mt-6 mb-2 xs:mb-3 sm:mb-4">{item.title}</h4>
                  <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>


      {/* Offer Section - CMS Managed */}
      {(() => {
        // Fetch active offers from CMS API
        const activeOffers = cmsData?.offers || [];
        
        // Fallback to mock data if DB is empty
        const mockOffer = { id: '1', title: 'Get 20% Off Your First Order', description: 'Join our community and be the first to know about new collections, exclusive offers, and style inspiration' };
        const offersToDisplay = activeOffers.length > 0 ? activeOffers : [mockOffer];
        
        if (offersToDisplay.length === 0) return null;
        
        const offer = offersToDisplay[0]; // Display first active offer
        
        return (
          <section className="w-full py-12 xs:py-16 sm:py-20 lg:py-28 bg-foreground text-white">
            <div className="max-w-3xl mx-auto text-center px-3 xs:px-4 sm:px-6">
              <ScrollReveal>
                <span className="inline-block px-3 xs:px-4 sm:px-5 py-1.5 xs:py-2 bg-primary text-white rounded-full text-[10px] xs:text-xs sm:text-sm uppercase tracking-wider mb-3 xs:mb-4 sm:mb-6">
                  Limited Time Offer
                </span>
                <h2 className="font-cursive text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl mb-3 xs:mb-4 sm:mb-6">
                  {offer.title}
                </h2>
                <p className="text-xs xs:text-sm sm:text-lg lg:text-xl text-white/70 mb-6 xs:mb-8 sm:mb-10 leading-relaxed">
                  {offer.description?.replace(/<[^>]*>/g, '') || offer.description}
                </p>
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 xs:gap-3 sm:gap-4 justify-center max-w-lg mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={subscribeMutation.isPending}
                    className="flex-1 px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm xs:text-base disabled:opacity-50"
                    required
                  />
                  <Button 
                    type="submit"
                    disabled={subscribeMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 text-xs xs:text-sm sm:text-base font-semibold whitespace-nowrap disabled:opacity-50"
                  >
                    {subscribeMutation.isPending ? 'Subscribing...' : 'Subscribe Now'}
                  </Button>
                </form>
              </ScrollReveal>
            </div>
          </section>
        );
      })()}

      {/* Instagram - Full Width Grid */}
      <section className="w-full py-12 xs:py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-8 xs:mb-10 sm:mb-14">
            <ScrollReveal>
              <span className="text-primary uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] text-xs xs:text-sm font-medium">Join Our Community</span>
              <h2 className="font-cursive text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl mt-2 xs:mt-3 sm:mt-4">Follow @studiosara</h2>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-1.5 xs:gap-2 sm:gap-3 lg:gap-5">
            {instagramPosts.map((post, index) => {
              const imageUrl = typeof post === 'string' ? post : post.imageUrl;
              const linkUrl = typeof post === 'string' ? '#' : (post.linkUrl || '#');
              return (
                <ScrollReveal key={index} delay={index * 0.05}>
                  <a 
                    href={linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group block aspect-square overflow-hidden rounded-lg xs:rounded-xl lg:rounded-2xl"
                  >
                    <img
                      src={imageUrl}
                      alt={`Instagram post ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      }}
                    />
                  </a>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Blog Section - Horizontal Scroll */}
      <section className="w-full py-12 xs:py-16 sm:py-20 lg:py-28 bg-muted">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 xs:gap-6 mb-8 xs:mb-10 sm:mb-14">
            <div>
              <ScrollReveal>
                <span className="text-primary uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] text-xs xs:text-sm font-medium">Latest Stories</span>
                <h2 className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-2 xs:mt-3 sm:mt-4">From Our Blog</h2>
              </ScrollReveal>
            </div>
            <Link to="/blog">
              <Button variant="outline" className="btn-outline text-xs xs:text-sm">
                View All Posts
              </Button>
            </Link>
          </div>
          
          {/* Horizontal Scroll Blog Cards */}
          <div className="overflow-x-auto -mx-3 xs:-mx-4 sm:-mx-6 lg:-mx-12 px-3 xs:px-4 sm:px-6 lg:px-12 scrollbar-hide">
            <div className="flex gap-3 xs:gap-4 sm:gap-6 lg:gap-8 min-w-max pb-4">
              {[
                { id: 1, title: 'The Art of Floral Design in Indian Textiles', image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=500&fit=crop', date: 'Jan 15, 2024' },
                { id: 2, title: 'Sustainable Fabric Choices for Modern Living', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=500&fit=crop', date: 'Jan 20, 2024' },
                { id: 3, title: 'Custom Design Tips for Your Home', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop', date: 'Jan 25, 2024' },
                { id: 4, title: 'Traditional Patterns Meet Modern Aesthetics', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=500&fit=crop', date: 'Feb 1, 2024' },
                { id: 5, title: 'Caring for Your Crafted Textiles', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=500&fit=crop', date: 'Feb 5, 2024' },
              ].map((blog, index) => (
                <ScrollReveal key={blog.id} delay={index * 0.1}>
                  <Link to={`/blog/${blog.id}`} className="group block flex-shrink-0">
                    <div className="relative w-[180px] xs:w-[220px] sm:w-[280px] md:w-[320px] lg:w-[360px] aspect-[3/4] rounded-xl xs:rounded-2xl overflow-hidden shadow-lg">
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
                      <div className="absolute inset-0 flex flex-col items-start justify-end text-white p-3 xs:p-4 sm:p-6 lg:p-8">
                        <span className="text-[10px] xs:text-xs text-white/80 mb-1 xs:mb-2">{blog.date}</span>
                        <h3 className="font-semibold text-xs xs:text-sm sm:text-lg lg:text-xl mb-1.5 xs:mb-2 sm:mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                          {blog.title}
                        </h3>
                        <span className="text-[10px] xs:text-xs sm:text-sm text-white/80 flex items-center gap-1 xs:gap-2 group-hover:text-primary transition-colors">
                          Read More
                          <i className="fa-solid fa-arrow-right text-[8px] xs:text-xs"></i>
                        </span>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
