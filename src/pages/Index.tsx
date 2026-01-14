import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';

// TODO: Replace mock data with API calls to fetch CMS-managed content
// API endpoints should be:
// - GET /api/cms/best-sellers - Returns array of product IDs
// - GET /api/cms/new-arrivals - Returns array of product IDs  
// - GET /api/cms/testimonials - Returns array of active testimonials (max 10)
// - GET /api/cms/offers - Returns array of active offers
// - GET /api/cms/instagram-posts - Returns array of image URLs
// - GET /api/products - Returns full product data for the IDs above

// Mock data - will be replaced with API calls
const heroSlides = [
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

const categories = [
  { id: '1', name: 'Floral', image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=800&fit=crop', count: 48 },
  { id: '2', name: 'Botanical', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&h=800&fit=crop', count: 36 },
  { id: '3', name: 'Abstract', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&h=800&fit=crop', count: 24 },
  { id: '4', name: 'Traditional', image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&h=800&fit=crop', count: 40 },
];

// All products - in real app, fetch from API
const allProducts: Product[] = [
  { id: '1', name: 'Rose Garden Silk Saree', price: 8999, originalPrice: 12000, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&h=650&fit=crop', category: 'Sarees', isNew: true, rating: 5 },
  { id: '2', name: 'Lavender Cushion Set', price: 2500, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=650&fit=crop', category: 'Home Decor', rating: 4 },
  { id: '3', name: 'Cherry Blossom Kurti', price: 3499, originalPrice: 4999, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=650&fit=crop', category: 'Kurtis', isSale: true, rating: 5 },
  { id: '4', name: 'Wildflower Dupatta', price: 1599, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=650&fit=crop', category: 'Dupattas', isNew: true, rating: 4 },
  { id: '5', name: 'Peony Blouse', price: 2199, image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=500&h=650&fit=crop', category: 'Blouses', rating: 5 },
  { id: '6', name: 'Tropical Bedsheet', price: 3999, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&h=650&fit=crop', category: 'Bedding', rating: 4 },
  { id: '9', name: 'Lotus Embroidered Set', price: 6999, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=650&fit=crop', category: 'Suits', isNew: true, rating: 4 },
  { id: '10', name: 'Sunflower Table Runner', price: 899, image: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=500&h=650&fit=crop', category: 'Home Decor', isNew: true, rating: 5 },
  { id: '11', name: 'Orchid Silk Blouse', price: 3299, image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=500&h=650&fit=crop', category: 'Blouses', isNew: true, rating: 5 },
  { id: '12', name: 'Tulip Print Scarf', price: 1299, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500&h=650&fit=crop', category: 'Scarves', isNew: true, rating: 4 },
];

// CMS-managed data - these should be fetched from API
// Best Sellers product IDs (managed in AdminCMS)
const bestSellerIds = ['1', '2', '3'];
const featuredProducts: Product[] = bestSellerIds
  .map(id => allProducts.find(p => p.id === id))
  .filter((p): p is Product => p !== undefined);

// New Arrivals product IDs (managed in AdminCMS)
const newArrivalIds = ['4', '1'];
const newArrivals: Product[] = newArrivalIds
  .map(id => allProducts.find(p => p.id === id))
  .filter((p): p is Product => p !== undefined);

// Testimonials (managed in AdminCMS, max 10 active)
const testimonials = [
  { id: 1, name: 'Priya Sharma', text: 'Beautiful quality! The prints are stunning and the fabric is so soft. I received so many compliments on my saree at the wedding.', rating: 5, location: 'Mumbai' },
  { id: 2, name: 'Anita Reddy', text: 'Fast delivery and gorgeous packaging. The kurti fits perfectly and the embroidery work is exquisite. Will definitely order again!', rating: 5, location: 'Bangalore' },
  { id: 3, name: 'Meera Patel', text: 'The customization options are amazing. They helped me create the perfect outfit for my engagement. Highly recommend Studio Sara!', rating: 5, location: 'Ahmedabad' },
].slice(0, 10); // Limit to 10 as per requirements

const features = [
  { icon: 'fa-truck-fast', title: 'Free Shipping', desc: 'On orders over ₹999' },
  { icon: 'fa-rotate-left', title: 'Easy Returns', desc: '15-day return policy' },
  { icon: 'fa-shield-halved', title: 'Secure Payment', desc: '100% protected' },
  { icon: 'fa-gem', title: 'Premium Quality', desc: 'Handcrafted with love' },
];

// Instagram Posts (managed in AdminCMS)
const instagramPosts = [
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=400&fit=crop',
];

const Index = () => {
  const [heroRef, heroApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
  const [productsRef] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay({ delay: 4000 })]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const scrollTo = useCallback((index: number) => heroApi?.scrollTo(index), [heroApi]);

  useEffect(() => {
    if (!heroApi) return;
    heroApi.on('select', () => setCurrentSlide(heroApi.selectedScrollSnap()));
  }, [heroApi]);

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
          <div className="flex flex-row sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 lg:gap-8 xl:gap-12 min-w-max sm:min-w-0">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-row items-center gap-2 xs:gap-3 sm:gap-5 justify-start text-left min-w-[140px] xs:min-w-[160px] sm:min-w-0 sm:justify-center lg:justify-start">
                <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-full bg-[#2b9d8f]/10 flex items-center justify-center flex-shrink-0">
                  <i className={`fa-solid ${feature.icon} text-xs xs:text-sm sm:text-base lg:text-lg xl:text-xl text-[#2b9d8f]`}></i>
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-[10px] xs:text-xs sm:text-sm lg:text-base xl:text-lg truncate">{feature.title}</h4>
                  <p className="text-[9px] xs:text-[10px] sm:text-xs lg:text-sm text-muted-foreground hidden xs:block truncate">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories - With Background Vector */}
      <section 
        className="w-full py-12 xs:py-16 sm:py-20 lg:py-28 relative"
        style={{
          backgroundImage: 'url(/bg_vectors/scene-with-birds-flying-by-tree.png)',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
        }}
      >
        <div className="absolute inset-0 bg-background/90" />
        <div className="relative max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-8 xs:mb-10 sm:mb-16">
            <ScrollReveal>
              <span className="text-primary uppercase tracking-[0.1em] xs:tracking-[0.15em] sm:tracking-[0.2em] text-xs xs:text-sm font-medium">Browse Collection</span>
              <h2 className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-2 xs:mt-3 sm:mt-4">Shop by Category</h2>
            </ScrollReveal>
          </div>
          <div className="overflow-x-auto -mx-3 xs:-mx-4 sm:-mx-6 lg:-mx-12 px-3 xs:px-4 sm:px-6 lg:px-12 scrollbar-hide">
            <div className="flex gap-3 xs:gap-4 sm:gap-6 lg:gap-8 min-w-max pb-4">
              {categories.map((category, index) => (
                <ScrollReveal key={category.id} delay={index * 0.1}>
                  <Link to={`/category/${category.id}`} className="group block flex-shrink-0">
                    <div className="relative w-[180px] xs:w-[220px] sm:w-[280px] md:w-[320px] lg:w-[360px] aspect-[3/4] rounded-xl xs:rounded-2xl overflow-hidden shadow-lg">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                      <div className="absolute inset-0 flex flex-col items-center justify-end text-white pb-4 xs:pb-6 sm:pb-8 lg:pb-10">
                        <h3 className="font-cursive text-2xl xs:text-3xl sm:text-4xl lg:text-5xl mb-1 xs:mb-2">{category.name}</h3>
                        <p className="text-xs xs:text-sm lg:text-base text-white/80">{category.count} Products</p>
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

      {/* Full Width Banner with Vector BG */}
      <section 
        className="relative w-full py-16 xs:py-20 sm:py-32 lg:py-44"
        style={{
          backgroundImage: 'url(/bg_vectors/29c6adfd-eab3-4978-86bb-773d20301c4d.jpg)',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="relative max-w-4xl mx-auto text-center text-white px-3 xs:px-4 sm:px-6">
          <ScrollReveal>
            <span className="text-xs xs:text-sm uppercase tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.3em] text-white/80 mb-2 xs:mb-3 sm:mb-4 block">Personalized For You</span>
            <h2 className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-3 xs:mb-4 sm:mb-6">Create Your Own Design</h2>
            <p className="text-sm xs:text-base sm:text-lg lg:text-xl text-white/80 mb-6 xs:mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Choose from 100+ premium fabrics and 500+ exclusive patterns to create something truly unique and personal
            </p>
            <Link to="/customize">
              <Button className="bg-white text-foreground hover:bg-white/90 rounded-full px-6 xs:px-8 sm:px-10 py-2.5 xs:py-3 sm:py-4 text-xs xs:text-sm sm:text-base font-semibold">
                Start Customizing
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

      {/* Stats - Full Width with Vector */}
      <section 
        className="w-full py-10 xs:py-14 sm:py-20 lg:py-24 relative"
        style={{
          backgroundImage: 'url(/bg_vectors/3e8e84f9-9e4b-4d5b-bbbb-4924f4181ded.jpg)',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute inset-0 bg-primary/90" />
        <div className="relative max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xs:gap-6 sm:gap-10 lg:gap-16 text-center text-white">
            <ScrollReveal>
              <span className="font-cursive text-3xl xs:text-4xl sm:text-6xl lg:text-7xl xl:text-8xl block">500+</span>
              <span className="text-[10px] xs:text-xs sm:text-base lg:text-lg uppercase tracking-[0.1em] xs:tracking-[0.15em] text-white/80 mt-1 xs:mt-2 sm:mt-3 block">Unique Designs</span>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <span className="font-cursive text-3xl xs:text-4xl sm:text-6xl lg:text-7xl xl:text-8xl block">50K+</span>
              <span className="text-[10px] xs:text-xs sm:text-base lg:text-lg uppercase tracking-[0.1em] xs:tracking-[0.15em] text-white/80 mt-1 xs:mt-2 sm:mt-3 block">Happy Customers</span>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <span className="font-cursive text-3xl xs:text-4xl sm:text-6xl lg:text-7xl xl:text-8xl block">100+</span>
              <span className="text-[10px] xs:text-xs sm:text-base lg:text-lg uppercase tracking-[0.1em] xs:tracking-[0.15em] text-white/80 mt-1 xs:mt-2 sm:mt-3 block">Skilled Artisans</span>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <span className="font-cursive text-3xl xs:text-4xl sm:text-6xl lg:text-7xl xl:text-8xl block">4.9</span>
              <span className="text-[10px] xs:text-xs sm:text-base lg:text-lg uppercase tracking-[0.1em] xs:tracking-[0.15em] text-white/80 mt-1 xs:mt-2 sm:mt-3 block">Average Rating</span>
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
              { icon: 'fa-hand-holding-heart', title: 'Handcrafted', desc: 'Each piece is carefully handcrafted by our skilled artisans with love and dedication' },
              { icon: 'fa-leaf', title: 'Eco-Friendly', desc: 'We use sustainable materials and eco-conscious production methods' },
              { icon: 'fa-medal', title: 'Premium Quality', desc: 'Only the finest fabrics and materials make it to your wardrobe' },
              { icon: 'fa-truck', title: 'Pan India Delivery', desc: 'Fast and free shipping to every corner of India' },
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
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-6 xs:gap-4 sm:gap-12 lg:gap-16">
            {[
              { step: '01', title: 'Browse & Select', desc: 'Explore our curated collection of floral prints, traditional designs, and contemporary patterns' },
              { step: '02', title: 'Customize', desc: 'Personalize your design with our easy-to-use customization tools - choose fabric, size, and style' },
              { step: '03', title: 'Receive', desc: 'Sit back and relax while we handcraft your piece and deliver it safely to your doorstep' },
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
        // TODO: Fetch active offers from API - GET /api/cms/offers?active=true
        const activeOffers = [
          { id: '1', title: 'Get 20% Off Your First Order', description: 'Join our community and be the first to know about new collections, exclusive offers, and style inspiration' },
        ];
        
        if (activeOffers.length === 0) return null;
        
        const offer = activeOffers[0]; // Display first active offer
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
                  {offer.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 xs:gap-3 sm:gap-4 justify-center max-w-lg mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 xs:px-5 sm:px-6 py-2.5 xs:py-3 sm:py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm xs:text-base"
                  />
                  <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 text-xs xs:text-sm sm:text-base font-semibold whitespace-nowrap">
                    Subscribe Now
                  </Button>
                </div>
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
            {instagramPosts.map((post, index) => (
              <ScrollReveal key={index} delay={index * 0.05}>
                <a href="#" className="group block aspect-square overflow-hidden rounded-lg xs:rounded-xl lg:rounded-2xl">
                  <img
                    src={post}
                    alt={`Instagram post ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </a>
              </ScrollReveal>
            ))}
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
                { id: 5, title: 'Caring for Your Handcrafted Textiles', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=500&fit=crop', date: 'Feb 5, 2024' },
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
