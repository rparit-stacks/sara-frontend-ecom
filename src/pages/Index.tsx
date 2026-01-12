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
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1400&h=700&fit=crop',
    cta: 'Shop Now',
    link: '/products',
  },
  {
    id: 2,
    title: 'Artisan Series',
    subtitle: 'Traditional Meets Modern',
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1400&h=700&fit=crop',
    cta: 'Explore',
    link: '/categories',
  },
  {
    id: 3,
    title: 'Custom Designs',
    subtitle: 'Create Your Own',
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1400&h=700&fit=crop',
    cta: 'Customize',
    link: '/customize',
  },
];

const categories = [
  { id: '1', name: 'Floral', image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=500&fit=crop', count: 48 },
  { id: '2', name: 'Botanical', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=500&fit=crop', count: 36 },
  { id: '3', name: 'Abstract', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=500&fit=crop', count: 24 },
  { id: '4', name: 'Traditional', image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=400&h=500&fit=crop', count: 40 },
];

const featuredProducts: Product[] = [
  { id: '1', name: 'Rose Garden Silk Saree', price: 8999, originalPrice: 12000, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=500&fit=crop', category: 'Sarees', isNew: true, rating: 5 },
  { id: '2', name: 'Lavender Cushion Set', price: 2500, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=500&fit=crop', category: 'Home Decor', rating: 4 },
  { id: '3', name: 'Cherry Blossom Kurti', price: 3499, originalPrice: 4999, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop', category: 'Kurtis', isSale: true, rating: 5 },
  { id: '4', name: 'Wildflower Dupatta', price: 1599, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop', category: 'Dupattas', isNew: true, rating: 4 },
  { id: '5', name: 'Peony Blouse', price: 2199, image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=500&fit=crop', category: 'Blouses', rating: 5 },
  { id: '6', name: 'Tropical Bedsheet', price: 3999, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=500&fit=crop', category: 'Bedding', rating: 4 },
  { id: '7', name: 'Marigold Saree', price: 4599, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=500&fit=crop', category: 'Sarees', isNew: true, rating: 5 },
  { id: '8', name: 'Jasmine Lehenga', price: 15999, image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&h=500&fit=crop', category: 'Lehengas', rating: 5 },
];

const newArrivals: Product[] = [
  { id: '9', name: 'Lotus Embroidered Set', price: 6999, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop', category: 'Suits', isNew: true, rating: 4 },
  { id: '10', name: 'Sunflower Table Runner', price: 899, image: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400&h=500&fit=crop', category: 'Home Decor', isNew: true, rating: 5 },
  { id: '11', name: 'Orchid Silk Blouse', price: 3299, image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=400&h=500&fit=crop', category: 'Blouses', isNew: true, rating: 5 },
  { id: '12', name: 'Tulip Print Scarf', price: 1299, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=500&fit=crop', category: 'Scarves', isNew: true, rating: 4 },
];

const testimonials = [
  { id: 1, name: 'Priya S.', text: 'Beautiful quality! The prints are stunning and fabric is so soft.', rating: 5 },
  { id: 2, name: 'Anita R.', text: 'Fast delivery and gorgeous packaging. Love my new kurti!', rating: 5 },
  { id: 3, name: 'Meera P.', text: 'The customization options are amazing. Highly recommend!', rating: 5 },
];

const features = [
  { icon: 'fa-truck-fast', title: 'Free Shipping', desc: 'On orders over ₹999' },
  { icon: 'fa-rotate-left', title: 'Easy Returns', desc: '15-day policy' },
  { icon: 'fa-shield-halved', title: 'Secure Payment', desc: '100% protected' },
  { icon: 'fa-gem', title: 'Premium Quality', desc: 'Handcrafted' },
];

const instagramPosts = [
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=250&h=250&fit=crop',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=250&h=250&fit=crop',
  'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=250&h=250&fit=crop',
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=250&h=250&fit=crop',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=250&h=250&fit=crop',
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=250&h=250&fit=crop',
];

const Index = () => {
  const [heroRef, heroApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })]);
  const [productsRef] = useEmblaCarousel({ loop: true, align: 'start' }, [Autoplay({ delay: 3000 })]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const scrollTo = useCallback((index: number) => heroApi?.scrollTo(index), [heroApi]);

  useEffect(() => {
    if (!heroApi) return;
    heroApi.on('select', () => setCurrentSlide(heroApi.selectedScrollSnap()));
  }, [heroApi]);

  return (
    <Layout>
      {/* Hero Slider */}
      <section className="relative">
        <div ref={heroRef} className="overflow-hidden">
          <div className="flex">
            {heroSlides.map((slide) => (
              <div key={slide.id} className="flex-[0_0_100%] min-w-0 relative h-[60vh] md:h-[70vh]">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-foreground/40" />
                <div className="absolute inset-0 flex items-center justify-center text-center text-white px-4">
                  <div>
                    <p className="text-sm uppercase tracking-widest mb-2">{slide.title}</p>
                    <h1 className="font-cursive text-4xl md:text-6xl lg:text-7xl mb-6">{slide.subtitle}</h1>
                    <Link to={slide.link}>
                      <Button className="btn-primary px-8">{slide.cta}</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === index ? 'w-6 bg-primary' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-muted py-6 border-y border-border">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3 justify-center md:justify-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <i className={`fa-solid ${feature.icon} text-sm text-primary`}></i>
                </div>
                <div>
                  <h4 className="font-semibold text-xs">{feature.title}</h4>
                  <p className="text-[10px] text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h2 className="font-cursive text-3xl md:text-4xl">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <ScrollReveal key={category.id} delay={index * 0.05}>
                <Link to={`/category/${category.id}`} className="group block">
                  <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-foreground/30 group-hover:bg-foreground/40 transition-colors" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <h3 className="font-cursive text-2xl md:text-3xl">{category.name}</h3>
                      <p className="text-xs mt-1">{category.count} Products</p>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Slider */}
      <section className="section-padding bg-muted">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-cursive text-3xl md:text-4xl">Best Sellers</h2>
            <Link to="/products">
              <Button variant="outline" className="btn-outline text-xs">View All</Button>
            </Link>
          </div>
          <div ref={productsRef} className="overflow-hidden">
            <div className="flex gap-4">
              {featuredProducts.map((product) => (
                <div key={product.id} className="flex-[0_0_200px] md:flex-[0_0_240px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="relative h-[300px] md:h-[400px]">
        <img
          src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1400&h=500&fit=crop"
          alt="Customize"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white px-4">
          <div>
            <h2 className="font-cursive text-3xl md:text-5xl mb-4">Create Your Own Design</h2>
            <p className="text-sm text-white/80 mb-6 max-w-md mx-auto">
              Choose from 100+ fabrics and 500+ patterns to create something unique
            </p>
            <Link to="/customize">
              <Button className="bg-white text-foreground hover:bg-white/90 rounded-full px-8">
                Start Customizing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-cursive text-3xl md:text-4xl">New Arrivals</h2>
            <Link to="/products?filter=new">
              <Button variant="outline" className="btn-outline text-xs">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {newArrivals.map((product, index) => (
              <ScrollReveal key={product.id} delay={index * 0.05}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-10">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            <div>
              <span className="font-cursive text-4xl md:text-5xl block">500+</span>
              <span className="text-xs uppercase tracking-wider text-white/70">Designs</span>
            </div>
            <div>
              <span className="font-cursive text-4xl md:text-5xl block">50K+</span>
              <span className="text-xs uppercase tracking-wider text-white/70">Customers</span>
            </div>
            <div>
              <span className="font-cursive text-4xl md:text-5xl block">100+</span>
              <span className="text-xs uppercase tracking-wider text-white/70">Artisans</span>
            </div>
            <div>
              <span className="font-cursive text-4xl md:text-5xl block">4.9</span>
              <span className="text-xs uppercase tracking-wider text-white/70">Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-muted">
        <div className="container-custom">
          <h2 className="font-cursive text-3xl md:text-4xl text-center mb-8">What Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white p-6 rounded-lg border border-border">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <i key={i} className="fa-solid fa-star text-xs text-primary"></i>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4">"{testimonial.text}"</p>
                <p className="font-semibold text-sm">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us - with floral vector bg */}
      <section className="section-padding bg-vector-floral">
        <div className="container-custom">
          <h2 className="font-cursive text-3xl md:text-4xl text-center mb-10">Why Choose Us</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: 'fa-hand-holding-heart', title: 'Handcrafted', desc: 'Each piece is carefully handcrafted by skilled artisans' },
              { icon: 'fa-leaf', title: 'Eco-Friendly', desc: 'Sustainable materials and eco-conscious production' },
              { icon: 'fa-medal', title: 'Premium Quality', desc: 'Only the finest fabrics and materials used' },
              { icon: 'fa-truck', title: 'Pan India Delivery', desc: 'Fast & free shipping across India' },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 0.1}>
                <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-border">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <i className={`fa-solid ${item.icon} text-xl text-primary`}></i>
                  </div>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - with waves vector bg */}
      <section className="section-padding bg-muted bg-vector-waves">
        <div className="container-custom">
          <h2 className="font-cursive text-3xl md:text-4xl text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Browse & Select', desc: 'Explore our curated collection of floral prints and textiles' },
              { step: '02', title: 'Customize', desc: 'Personalize your design with our easy customization tools' },
              { step: '03', title: 'Receive', desc: 'Get your handcrafted piece delivered to your doorstep' },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 0.15}>
                <div className="text-center">
                  <span className="font-cursive text-5xl text-primary/30">{item.step}</span>
                  <h4 className="font-semibold text-lg mt-2 mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offer - with geometric vector bg */}
      <section className="section-padding bg-secondary bg-vector-geometric">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <ScrollReveal>
              <span className="inline-block px-4 py-1.5 bg-primary text-white rounded-full text-xs uppercase tracking-wider mb-4">
                Limited Time Offer
              </span>
              <h2 className="font-cursive text-3xl md:text-5xl text-secondary-foreground mb-4">
                Get 20% Off Your First Order
              </h2>
              <p className="text-secondary-foreground/70 mb-6">
                Sign up for our newsletter and receive an exclusive discount code for your first purchase.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-5 py-3 rounded-full border border-border bg-white text-foreground text-sm"
                />
                <Button className="btn-primary">Get Code</Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Instagram */}
      <section className="section-padding bg-vector-circles">
        <div className="container-custom">
          <div className="text-center mb-8">
            <p className="text-primary font-semibold text-sm mb-1">@studiosara</p>
            <h2 className="font-cursive text-3xl md:text-4xl">Follow Us</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {instagramPosts.map((post, index) => (
              <a key={index} href="#" className="group block aspect-square rounded-lg overflow-hidden">
                <img
                  src={post}
                  alt={`Instagram ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
