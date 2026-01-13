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

const featuredProducts: Product[] = [
  { id: '1', name: 'Rose Garden Silk Saree', price: 8999, originalPrice: 12000, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&h=650&fit=crop', category: 'Sarees', isNew: true, rating: 5 },
  { id: '2', name: 'Lavender Cushion Set', price: 2500, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=650&fit=crop', category: 'Home Decor', rating: 4 },
  { id: '3', name: 'Cherry Blossom Kurti', price: 3499, originalPrice: 4999, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=650&fit=crop', category: 'Kurtis', isSale: true, rating: 5 },
  { id: '4', name: 'Wildflower Dupatta', price: 1599, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=650&fit=crop', category: 'Dupattas', isNew: true, rating: 4 },
  { id: '5', name: 'Peony Blouse', price: 2199, image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=500&h=650&fit=crop', category: 'Blouses', rating: 5 },
  { id: '6', name: 'Tropical Bedsheet', price: 3999, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&h=650&fit=crop', category: 'Bedding', rating: 4 },
];

const newArrivals: Product[] = [
  { id: '9', name: 'Lotus Embroidered Set', price: 6999, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=650&fit=crop', category: 'Suits', isNew: true, rating: 4 },
  { id: '10', name: 'Sunflower Table Runner', price: 899, image: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=500&h=650&fit=crop', category: 'Home Decor', isNew: true, rating: 5 },
  { id: '11', name: 'Orchid Silk Blouse', price: 3299, image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=500&h=650&fit=crop', category: 'Blouses', isNew: true, rating: 5 },
  { id: '12', name: 'Tulip Print Scarf', price: 1299, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500&h=650&fit=crop', category: 'Scarves', isNew: true, rating: 4 },
];

const testimonials = [
  { id: 1, name: 'Priya Sharma', text: 'Beautiful quality! The prints are stunning and the fabric is so soft. I received so many compliments on my saree at the wedding.', rating: 5, location: 'Mumbai' },
  { id: 2, name: 'Anita Reddy', text: 'Fast delivery and gorgeous packaging. The kurti fits perfectly and the embroidery work is exquisite. Will definitely order again!', rating: 5, location: 'Bangalore' },
  { id: 3, name: 'Meera Patel', text: 'The customization options are amazing. They helped me create the perfect outfit for my engagement. Highly recommend Studio Sara!', rating: 5, location: 'Ahmedabad' },
];

const features = [
  { icon: 'fa-truck-fast', title: 'Free Shipping', desc: 'On orders over ₹999' },
  { icon: 'fa-rotate-left', title: 'Easy Returns', desc: '15-day return policy' },
  { icon: 'fa-shield-halved', title: 'Secure Payment', desc: '100% protected' },
  { icon: 'fa-gem', title: 'Premium Quality', desc: 'Handcrafted with love' },
];

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
              <div key={slide.id} className="flex-[0_0_100%] min-w-0 relative h-[75vh] lg:h-[85vh]">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-foreground/40" />
                <div className="absolute inset-0 flex items-center justify-center text-center text-white px-6">
                  <div className="max-w-4xl">
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-lg md:text-xl uppercase tracking-[0.3em] mb-4"
                    >
                      {slide.title}
                    </motion.p>
                    <motion.h1 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="font-cursive text-6xl md:text-7xl lg:text-8xl xl:text-9xl mb-8"
                    >
                      {slide.subtitle}
                    </motion.h1>
                    <Link to={slide.link}>
                      <Button className="btn-primary px-10 py-4 text-base">{slide.cta}</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-2.5 rounded-full transition-all ${
                currentSlide === index ? 'w-10 bg-primary' : 'w-2.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features Bar - Full Width */}
      <section className="w-full bg-muted py-10 lg:py-12 border-y border-border">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-5 justify-center lg:justify-start">
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <i className={`fa-solid ${feature.icon} text-lg lg:text-xl text-primary`}></i>
                </div>
                <div>
                  <h4 className="font-semibold text-base lg:text-lg">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories - With Background Vector */}
      <section 
        className="w-full py-20 lg:py-28 relative"
        style={{
          backgroundImage: 'url(/bg_vectors/scene-with-birds-flying-by-tree.png)',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
        }}
      >
        <div className="absolute inset-0 bg-background/90" />
        <div className="relative max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <ScrollReveal>
              <span className="text-primary uppercase tracking-[0.2em] text-sm font-medium">Browse Collection</span>
              <h2 className="font-cursive text-5xl md:text-6xl lg:text-7xl mt-4">Shop by Category</h2>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {categories.map((category, index) => (
              <ScrollReveal key={category.id} delay={index * 0.1}>
                <Link to={`/category/${category.id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-end text-white pb-8 lg:pb-10">
                      <h3 className="font-cursive text-4xl lg:text-5xl mb-2">{category.name}</h3>
                      <p className="text-sm lg:text-base text-white/80">{category.count} Products</p>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Slider - Full Width */}
      <section className="w-full py-20 lg:py-28 bg-muted overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
            <div>
              <ScrollReveal>
                <span className="text-primary uppercase tracking-[0.2em] text-sm font-medium">Trending Now</span>
                <h2 className="font-cursive text-5xl md:text-6xl lg:text-7xl mt-4">Best Sellers</h2>
              </ScrollReveal>
            </div>
            <Link to="/products">
              <Button variant="outline" className="btn-outline text-sm">View All Products</Button>
            </Link>
          </div>
          <div ref={productsRef} className="overflow-hidden -mx-3">
            <div className="flex gap-6 lg:gap-8 px-3">
              {featuredProducts.map((product) => (
                <div key={product.id} className="flex-[0_0_260px] md:flex-[0_0_300px] lg:flex-[0_0_340px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Full Width Banner with Vector BG */}
      <section 
        className="relative w-full py-32 lg:py-44"
        style={{
          backgroundImage: 'url(/bg_vectors/29c6adfd-eab3-4978-86bb-773d20301c4d.jpg)',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="relative max-w-4xl mx-auto text-center text-white px-6">
          <ScrollReveal>
            <span className="text-sm uppercase tracking-[0.3em] text-white/80 mb-4 block">Personalized For You</span>
            <h2 className="font-cursive text-5xl md:text-6xl lg:text-7xl mb-6">Create Your Own Design</h2>
            <p className="text-lg lg:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Choose from 100+ premium fabrics and 500+ exclusive patterns to create something truly unique and personal
            </p>
            <Link to="/customize">
              <Button className="bg-white text-foreground hover:bg-white/90 rounded-full px-10 py-4 text-base font-semibold">
                Start Customizing
              </Button>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* New Arrivals - Full Width Grid */}
      <section className="w-full py-20 lg:py-28">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
            <div>
              <ScrollReveal>
                <span className="text-primary uppercase tracking-[0.2em] text-sm font-medium">Just Arrived</span>
                <h2 className="font-cursive text-5xl md:text-6xl lg:text-7xl mt-4">New Arrivals</h2>
              </ScrollReveal>
            </div>
            <Link to="/products?filter=new">
              <Button variant="outline" className="btn-outline text-sm">Shop All New</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
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
        className="w-full py-20 lg:py-24 relative"
        style={{
          backgroundImage: 'url(/bg_vectors/3e8e84f9-9e4b-4d5b-bbbb-4924f4181ded.jpg)',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute inset-0 bg-primary/90" />
        <div className="relative max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16 text-center text-white">
            <ScrollReveal>
              <span className="font-cursive text-6xl lg:text-7xl xl:text-8xl block">500+</span>
              <span className="text-base lg:text-lg uppercase tracking-[0.15em] text-white/80 mt-3 block">Unique Designs</span>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <span className="font-cursive text-6xl lg:text-7xl xl:text-8xl block">50K+</span>
              <span className="text-base lg:text-lg uppercase tracking-[0.15em] text-white/80 mt-3 block">Happy Customers</span>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <span className="font-cursive text-6xl lg:text-7xl xl:text-8xl block">100+</span>
              <span className="text-base lg:text-lg uppercase tracking-[0.15em] text-white/80 mt-3 block">Skilled Artisans</span>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <span className="font-cursive text-6xl lg:text-7xl xl:text-8xl block">4.9</span>
              <span className="text-base lg:text-lg uppercase tracking-[0.15em] text-white/80 mt-3 block">Average Rating</span>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Testimonials - Full Width */}
      <section className="w-full py-20 lg:py-28 bg-muted">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <ScrollReveal>
              <span className="text-primary uppercase tracking-[0.2em] text-sm font-medium">Customer Love</span>
              <h2 className="font-cursive text-5xl md:text-6xl lg:text-7xl mt-4">What They Say</h2>
            </ScrollReveal>
          </div>
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={testimonial.id} delay={index * 0.1}>
                <div className="bg-white p-8 lg:p-10 rounded-2xl border border-border h-full flex flex-col">
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <i key={i} className="fa-solid fa-star text-lg text-primary"></i>
                    ))}
                  </div>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed flex-1">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold text-lg">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us - With Wave Background */}
      <section className="w-full py-20 lg:py-28 relative overflow-hidden">
        {/* Wave Background SVG */}
        <div className="absolute inset-0 w-full h-full opacity-20">
          <svg
            className="absolute bottom-0 left-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              className="text-primary"
              fillOpacity="0.3"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
          <svg
            className="absolute top-0 left-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ transform: 'rotate(180deg)' }}
          >
            <path
              fill="currentColor"
              className="text-primary"
              fillOpacity="0.2"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
          {/* Additional decorative waves */}
          <svg
            className="absolute bottom-0 left-0 w-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
            style={{ height: '60%' }}
          >
            <path
              fill="currentColor"
              className="text-accent"
              fillOpacity="0.15"
              d="M0,160L60,150C120,140,240,120,360,110C480,100,600,100,720,110C840,120,960,140,1080,150C1200,160,1320,160,1380,160L1440,160L1440,200L1380,200C1320,200,1200,200,1080,200C960,200,840,200,720,200C600,200,480,200,360,200C240,200,120,200,60,200L0,200Z"
            />
          </svg>
        </div>
        
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <ScrollReveal>
              <span className="text-primary uppercase tracking-[0.2em] text-sm font-medium">Our Promise</span>
              <h2 className="font-cursive text-5xl md:text-6xl lg:text-7xl mt-4">Why Choose Us</h2>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {[
              { icon: 'fa-hand-holding-heart', title: 'Handcrafted', desc: 'Each piece is carefully handcrafted by our skilled artisans with love and dedication' },
              { icon: 'fa-leaf', title: 'Eco-Friendly', desc: 'We use sustainable materials and eco-conscious production methods' },
              { icon: 'fa-medal', title: 'Premium Quality', desc: 'Only the finest fabrics and materials make it to your wardrobe' },
              { icon: 'fa-truck', title: 'Pan India Delivery', desc: 'Fast and free shipping to every corner of India' },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 0.1}>
                <div className="text-center p-6 lg:p-10 bg-white/90 backdrop-blur-sm rounded-2xl border border-border h-full shadow-sm">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <i className={`fa-solid ${item.icon} text-2xl lg:text-3xl text-primary`}></i>
                  </div>
                  <h4 className="font-semibold text-lg lg:text-xl mb-3">{item.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-20 lg:py-28 bg-secondary">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <ScrollReveal>
              <span className="text-primary uppercase tracking-[0.2em] text-sm font-medium">Simple Process</span>
              <h2 className="font-cursive text-5xl md:text-6xl lg:text-7xl mt-4">How It Works</h2>
            </ScrollReveal>
          </div>
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            {[
              { step: '01', title: 'Browse & Select', desc: 'Explore our curated collection of floral prints, traditional designs, and contemporary patterns' },
              { step: '02', title: 'Customize', desc: 'Personalize your design with our easy-to-use customization tools - choose fabric, size, and style' },
              { step: '03', title: 'Receive', desc: 'Sit back and relax while we handcraft your piece and deliver it safely to your doorstep' },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 0.15}>
                <div className="text-center">
                  <span className="font-cursive text-8xl lg:text-9xl text-primary/20">{item.step}</span>
                  <h4 className="font-semibold text-2xl lg:text-3xl -mt-6 mb-4">{item.title}</h4>
                  <p className="text-lg text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter - Full Width */}
      <section className="w-full py-20 lg:py-28 bg-foreground text-white">
        <div className="max-w-3xl mx-auto text-center px-6">
          <ScrollReveal>
            <span className="inline-block px-5 py-2 bg-primary text-white rounded-full text-sm uppercase tracking-wider mb-6">
              Limited Time Offer
            </span>
            <h2 className="font-cursive text-5xl md:text-6xl lg:text-7xl mb-6">
              Get 20% Off Your First Order
            </h2>
            <p className="text-lg lg:text-xl text-white/70 mb-10 leading-relaxed">
              Join our community and be the first to know about new collections, exclusive offers, and style inspiration
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary text-base"
              />
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-4 text-base font-semibold whitespace-nowrap">
                Subscribe Now
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Instagram - Full Width Grid */}
      <section className="w-full py-20 lg:py-28">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <ScrollReveal>
              <span className="text-primary uppercase tracking-[0.2em] text-sm font-medium">Join Our Community</span>
              <h2 className="font-cursive text-5xl md:text-6xl lg:text-7xl mt-4">Follow @studiosara</h2>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-5">
            {instagramPosts.map((post, index) => (
              <ScrollReveal key={index} delay={index * 0.05}>
                <a href="#" className="group block aspect-square overflow-hidden rounded-xl lg:rounded-2xl">
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
    </Layout>
  );
};

export default Index;
