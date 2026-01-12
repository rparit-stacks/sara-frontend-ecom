import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';

// Mock data
const heroSlides = [
  {
    id: 1,
    title: 'Embrace the Art of Floral',
    subtitle: 'New Collection 2024',
    description: 'Discover handcrafted textiles that bring nature\'s beauty into your home',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1400&h=900&fit=crop',
    cta: 'Shop Collection',
    link: '/products',
  },
  {
    id: 2,
    title: 'Traditional Meets Modern',
    subtitle: 'Artisan Series',
    description: 'Premium fabrics woven with centuries-old techniques and contemporary designs',
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1400&h=900&fit=crop',
    cta: 'Explore Now',
    link: '/categories',
  },
  {
    id: 3,
    title: 'Custom Designs for You',
    subtitle: 'Personalized Prints',
    description: 'Create unique pieces with our customization studio',
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1400&h=900&fit=crop',
    cta: 'Start Customizing',
    link: '/customize',
  },
];

const categories = [
  { id: '1', name: 'Floral Prints', image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=500&h=600&fit=crop', count: 48, icon: 'fa-seedling' },
  { id: '2', name: 'Botanical', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=500&h=600&fit=crop', count: 36, icon: 'fa-leaf' },
  { id: '3', name: 'Abstract', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500&h=600&fit=crop', count: 24, icon: 'fa-palette' },
  { id: '4', name: 'Geometric', image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=500&h=600&fit=crop', count: 32, icon: 'fa-shapes' },
  { id: '5', name: 'Traditional', image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=500&h=600&fit=crop', count: 40, icon: 'fa-sun' },
  { id: '6', name: 'Minimalist', image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=500&h=600&fit=crop', count: 20, icon: 'fa-circle' },
];

const featuredProducts: Product[] = [
  { id: '1', name: 'Rose Garden Silk Saree', price: 8999, originalPrice: 12000, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=500&fit=crop', category: 'Sarees', isNew: true, rating: 5 },
  { id: '2', name: 'Lavender Fields Cushion Set', price: 2500, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=500&fit=crop', category: 'Home Decor', rating: 4 },
  { id: '3', name: 'Cherry Blossom Kurti', price: 3499, originalPrice: 4999, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop', category: 'Kurtis', isSale: true, rating: 5 },
  { id: '4', name: 'Wildflower Print Dupatta', price: 1599, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop', category: 'Dupattas', isNew: true, rating: 4 },
  { id: '5', name: 'Peony Paradise Blouse', price: 2199, image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=500&fit=crop', category: 'Blouses', rating: 5 },
  { id: '6', name: 'Tropical Leaf Bedsheet', price: 3999, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=500&fit=crop', category: 'Bedding', rating: 4 },
];

const newArrivals: Product[] = [
  { id: '7', name: 'Marigold Cotton Saree', price: 4599, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=500&fit=crop', category: 'Sarees', isNew: true, rating: 5 },
  { id: '8', name: 'Jasmine Print Lehenga', price: 15999, image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&h=500&fit=crop', category: 'Lehengas', isNew: true, rating: 5 },
  { id: '9', name: 'Lotus Embroidered Set', price: 6999, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop', category: 'Suits', isNew: true, rating: 4 },
  { id: '10', name: 'Sunflower Table Runner', price: 899, image: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400&h=500&fit=crop', category: 'Home Decor', isNew: true, rating: 5 },
];

const testimonials = [
  { id: 1, name: 'Priya Sharma', location: 'Mumbai', text: 'The sarees are absolutely stunning! The fabric quality is amazing and the prints are so vibrant. Will definitely order again.', rating: 5, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { id: 2, name: 'Anita Reddy', location: 'Hyderabad', text: 'Fast delivery and beautiful packaging. The kurti I ordered fits perfectly and the color is even more beautiful in person!', rating: 5, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  { id: 3, name: 'Meera Patel', location: 'Ahmedabad', text: 'Love the customization options! Created a unique wedding outfit that everyone complimented. Highly recommend Studio Sara!', rating: 5, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
];

const features = [
  { icon: 'fa-truck-fast', title: 'Free Shipping', description: 'On orders over ₹999', color: 'bg-primary' },
  { icon: 'fa-rotate-left', title: 'Easy Returns', description: '15-day return policy', color: 'bg-secondary' },
  { icon: 'fa-shield-halved', title: 'Secure Payment', description: '100% protected', color: 'bg-accent' },
  { icon: 'fa-gem', title: 'Premium Quality', description: 'Handcrafted designs', color: 'bg-tertiary' },
];

const instagramPosts = [
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=300&h=300&fit=crop',
];

const brands = [
  'Handloom Heritage',
  'Artisan Collective',
  'Weave & Wonder',
  'Bloom Textiles',
  'Flora Fabrics',
  'Nature\'s Canvas',
];

const stats = [
  { number: '500+', label: 'Unique Designs', icon: 'fa-palette' },
  { number: '50K+', label: 'Happy Customers', icon: 'fa-users' },
  { number: '100+', label: 'Artisans', icon: 'fa-hands' },
  { number: '4.9', label: 'Rating', icon: 'fa-star' },
];

const Index = () => {
  const [heroRef, heroApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
  const [productsRef, productsApi] = useEmblaCarousel({ loop: true, align: 'start', slidesToScroll: 1 }, [Autoplay({ delay: 3000 })]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const scrollTo = useCallback((index: number) => heroApi?.scrollTo(index), [heroApi]);

  useEffect(() => {
    if (!heroApi) return;
    heroApi.on('select', () => setCurrentSlide(heroApi.selectedScrollSnap()));
  }, [heroApi]);

  return (
    <Layout>
      {/* Hero Slider */}
      <section className="relative min-h-[100vh] overflow-hidden">
        <div ref={heroRef} className="overflow-hidden h-full">
          <div className="flex h-full">
            {heroSlides.map((slide, index) => (
              <div key={slide.id} className="flex-[0_0_100%] min-w-0 relative min-h-[100vh]">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
                </div>

                {/* Decorative SVG Elements */}
                <svg className="absolute top-20 right-10 w-40 h-40 text-primary/20 animate-spin-slow" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </svg>
                
                <svg className="absolute bottom-40 right-1/4 w-60 h-60 text-secondary/10 animate-float" viewBox="0 0 100 100">
                  <path d="M50 10 Q70 30 70 50 Q70 70 50 90 Q30 70 30 50 Q30 30 50 10" fill="currentColor" />
                </svg>
                
                {/* Content */}
                <div className="container-custom relative z-10 h-full flex items-center pt-20">
                  <div className="max-w-2xl text-white">
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-block px-5 py-2 bg-primary rounded-full text-sm font-bold uppercase tracking-wider mb-6"
                    >
                      <i className="fa-solid fa-sparkles mr-2"></i>
                      {slide.subtitle}
                    </motion.span>
                    
                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="font-cursive text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-tight mb-6"
                    >
                      {slide.title}
                    </motion.h1>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl text-white/80 max-w-lg mb-10"
                    >
                      {slide.description}
                    </motion.p>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex flex-wrap gap-4"
                    >
                      <Link to={slide.link}>
                        <Button size="lg" className="btn-primary text-lg px-10 py-6 gap-3">
                          {slide.cta}
                          <i className="fa-solid fa-arrow-right"></i>
                        </Button>
                      </Link>
                      <Link to="/about">
                        <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-foreground text-lg px-10 py-6 rounded-full">
                          <i className="fa-solid fa-play mr-2"></i>
                          Watch Story
                        </Button>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slider Dots */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-3 rounded-full transition-all duration-300 ${
                currentSlide === index ? 'w-10 bg-primary' : 'w-3 bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 right-10 text-white/50 animate-bounce-soft hidden lg:block">
          <i className="fa-solid fa-chevron-down text-2xl"></i>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-foreground text-background py-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-waves opacity-20" />
        <div className="container-custom relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 justify-center md:justify-start"
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center shadow-lg`}>
                  <i className={`fa-solid ${feature.icon} text-xl text-white`}></i>
                </div>
                <div>
                  <h4 className="font-bold text-white">{feature.title}</h4>
                  <p className="text-sm text-white/60">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section-padding bg-pattern-floral">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-accent/20 text-accent rounded-full text-sm font-bold uppercase tracking-wider mb-4">
                <i className="fa-solid fa-layer-group mr-2"></i>
                Explore
              </span>
              <h2 className="font-cursive text-5xl md:text-6xl mb-4">Shop by Category</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Discover our carefully curated collections, each inspired by nature's most beautiful patterns.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <ScrollReveal key={category.id} delay={index * 0.08}>
                <Link to={`/category/${category.id}`} className="group block">
                  <motion.div
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-medium"
                  >
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-white">
                      <div className="w-14 h-14 rounded-full bg-primary/80 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <i className={`fa-solid ${category.icon} text-xl`}></i>
                      </div>
                      <h3 className="font-cursive text-2xl text-center">{category.name}</h3>
                      <p className="text-sm text-white/70">{category.count} Products</p>
                    </div>
                  </motion.div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Slider */}
      <section className="section-padding bg-secondary/20 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blob-1 opacity-50" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blob-2 opacity-40" />
        
        <div className="container-custom relative z-10">
          <ScrollReveal>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
              <div>
                <span className="inline-block px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-bold uppercase tracking-wider mb-4">
                  <i className="fa-solid fa-fire mr-2"></i>
                  Best Sellers
                </span>
                <h2 className="font-cursive text-5xl md:text-6xl mb-4">Featured Products</h2>
                <p className="text-muted-foreground max-w-xl text-lg">
                  Our most loved pieces, handpicked for their exceptional quality and timeless designs.
                </p>
              </div>
              <Link to="/products">
                <Button className="btn-outline gap-2">
                  View All Products
                  <i className="fa-solid fa-arrow-right"></i>
                </Button>
              </Link>
            </div>
          </ScrollReveal>

          {/* Products Slider */}
          <div ref={productsRef} className="overflow-hidden">
            <div className="flex gap-6">
              {featuredProducts.map((product) => (
                <div key={product.id} className="flex-[0_0_280px] md:flex-[0_0_320px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bold Banner Section */}
      <section className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2">
          {/* Left - Image */}
          <div className="relative h-[500px] lg:h-[700px]">
            <img
              src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1000&h=1200&fit=crop"
              alt="Customization"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-secondary/20" />
            
            {/* Floating elements */}
            <motion.div
              animate={{ y: [-15, 15, -15], rotate: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute top-20 right-10 bg-white p-4 rounded-2xl shadow-medium"
            >
              <i className="fa-solid fa-palette text-3xl text-primary"></i>
            </motion.div>
            <motion.div
              animate={{ y: [15, -15, 15], rotate: [0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute bottom-20 left-10 bg-white p-4 rounded-2xl shadow-medium"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-3xl text-secondary"></i>
            </motion.div>
          </div>
          
          {/* Right - Content */}
          <div className="bg-secondary flex items-center p-10 lg:p-20">
            <div className="text-white max-w-lg">
              <ScrollReveal direction="right">
                <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-bold uppercase tracking-wider mb-6">
                  <i className="fa-solid fa-star mr-2"></i>
                  Custom Designs
                </span>
                <h2 className="font-cursive text-5xl lg:text-6xl mb-6">
                  Create Your Dream Design
                </h2>
                <p className="text-white/80 text-lg mb-8 leading-relaxed">
                  Use our customization studio to bring your vision to life. Choose from hundreds of fabrics, 
                  patterns, and colors to create something uniquely yours.
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                    <i className="fa-solid fa-check text-primary"></i>
                    <span>100+ Fabrics</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                    <i className="fa-solid fa-check text-primary"></i>
                    <span>500+ Patterns</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                    <i className="fa-solid fa-check text-primary"></i>
                    <span>Live Preview</span>
                  </div>
                </div>
                <Link to="/customize">
                  <Button size="lg" className="bg-white text-secondary hover:bg-white/90 px-10 py-6 rounded-full font-bold text-lg gap-3">
                    <i className="fa-solid fa-magic-wand-sparkles"></i>
                    Start Customizing
                  </Button>
                </Link>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="section-padding relative">
        <div className="container-custom">
          <ScrollReveal>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
              <div>
                <span className="inline-block px-4 py-2 bg-warm/20 text-warm rounded-full text-sm font-bold uppercase tracking-wider mb-4">
                  <i className="fa-solid fa-sparkles mr-2"></i>
                  Just In
                </span>
                <h2 className="font-cursive text-5xl md:text-6xl mb-4">New Arrivals</h2>
                <p className="text-muted-foreground max-w-xl text-lg">
                  Fresh from our design studio. Explore the latest additions to our collection.
                </p>
              </div>
              <Link to="/products?filter=new">
                <Button className="btn-warm gap-2">
                  View All New
                  <i className="fa-solid fa-arrow-right"></i>
                </Button>
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((product, index) => (
              <ScrollReveal key={product.id} delay={index * 0.1}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-primary via-secondary to-tertiary py-20">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <ScrollReveal key={stat.label} delay={index * 0.1}>
                <div className="text-center text-white">
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                    <i className={`fa-solid ${stat.icon} text-3xl`}></i>
                  </div>
                  <span className="block font-cursive text-5xl md:text-6xl font-bold">{stat.number}</span>
                  <span className="text-white/80 uppercase tracking-wider text-sm">{stat.label}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-pattern-dots">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 bg-tertiary/20 text-tertiary rounded-full text-sm font-bold uppercase tracking-wider mb-4">
                <i className="fa-solid fa-heart mr-2"></i>
                Testimonials
              </span>
              <h2 className="font-cursive text-5xl md:text-6xl mb-4">What Our Customers Say</h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={testimonial.id} delay={index * 0.15}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-card rounded-3xl p-8 shadow-medium border border-border relative overflow-hidden"
                >
                  {/* Quote icon */}
                  <div className="absolute top-6 right-6 text-primary/10">
                    <i className="fa-solid fa-quote-right text-6xl"></i>
                  </div>
                  
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <i key={i} className="fa-solid fa-star text-warm"></i>
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 relative z-10 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover ring-4 ring-primary/20"
                    />
                    <div>
                      <span className="font-bold block">{testimonial.name}</span>
                      <span className="text-sm text-muted-foreground">
                        <i className="fa-solid fa-location-dot mr-1"></i>
                        {testimonial.location}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Brands/Partners */}
      <section className="py-16 bg-muted/50">
        <div className="container-custom">
          <p className="text-center text-muted-foreground mb-8 uppercase tracking-widest text-sm">
            Our Partner Brands
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {brands.map((brand, index) => (
              <motion.span
                key={brand}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="font-cursive text-2xl md:text-3xl text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer"
              >
                {brand}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Section */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-full text-sm font-bold uppercase tracking-wider mb-4">
                <i className="fa-brands fa-instagram mr-2"></i>
                @studiosara
              </span>
              <h2 className="font-cursive text-5xl md:text-6xl mb-4">Follow Us on Instagram</h2>
              <p className="text-muted-foreground text-lg">
                Tag us in your photos for a chance to be featured
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {instagramPosts.map((post, index) => (
              <ScrollReveal key={index} delay={index * 0.05}>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.05 }}
                  className="group block aspect-square rounded-2xl overflow-hidden relative"
                >
                  <img
                    src={post}
                    alt={`Instagram post ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/50 transition-colors flex items-center justify-center">
                    <i className="fa-brands fa-instagram text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </div>
                </motion.a>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* App Download CTA */}
      <section className="bg-accent text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-leaves opacity-20" />
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-bold uppercase tracking-wider mb-6">
                <i className="fa-solid fa-mobile-screen mr-2"></i>
                Coming Soon
              </span>
              <h2 className="font-cursive text-5xl md:text-6xl mb-6">Download Our App</h2>
              <p className="text-white/80 text-lg mb-8">
                Get exclusive offers, early access to new collections, and a seamless shopping experience on the go.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-foreground text-white hover:bg-foreground/90 px-6 py-4 rounded-xl gap-3">
                  <i className="fa-brands fa-apple text-2xl"></i>
                  <div className="text-left">
                    <span className="text-xs block opacity-70">Download on</span>
                    <span className="font-bold">App Store</span>
                  </div>
                </Button>
                <Button className="bg-foreground text-white hover:bg-foreground/90 px-6 py-4 rounded-xl gap-3">
                  <i className="fa-brands fa-google-play text-2xl"></i>
                  <div className="text-left">
                    <span className="text-xs block opacity-70">Get it on</span>
                    <span className="font-bold">Google Play</span>
                  </div>
                </Button>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="relative flex justify-center">
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-64 h-auto"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-[40px] p-4 border border-white/20">
                    <div className="bg-foreground rounded-[32px] aspect-[9/19] flex items-center justify-center">
                      <div className="text-center text-white/50">
                        <i className="fa-solid fa-mobile-screen text-6xl mb-4"></i>
                        <p className="font-cursive text-2xl">Studio Sara</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
