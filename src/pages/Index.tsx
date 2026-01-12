import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Truck, Shield, RotateCcw, Sparkles } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';

// Mock data
const heroImages = [
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=800&fit=crop',
];

const categories = [
  { id: '1', name: 'Floral Prints', image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=500&fit=crop', count: 48 },
  { id: '2', name: 'Botanical', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=500&fit=crop', count: 36 },
  { id: '3', name: 'Abstract', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=500&fit=crop', count: 24 },
  { id: '4', name: 'Geometric', image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=500&fit=crop', count: 32 },
];

const featuredProducts: Product[] = [
  { id: '1', name: 'Rose Garden Silk Scarf', price: 89.99, originalPrice: 120, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=500&fit=crop', category: 'Scarves', isNew: true },
  { id: '2', name: 'Lavender Fields Cushion', price: 45.00, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=500&fit=crop', category: 'Home Decor' },
  { id: '3', name: 'Cherry Blossom Dress', price: 159.99, originalPrice: 199, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop', category: 'Clothing', isSale: true },
  { id: '4', name: 'Wildflower Print Tote', price: 35.00, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop', category: 'Bags', isNew: true },
];

const newArrivals: Product[] = [
  { id: '5', name: 'Peony Paradise Blouse', price: 79.99, image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=500&fit=crop', category: 'Clothing', isNew: true },
  { id: '6', name: 'Tropical Leaf Throw', price: 68.00, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=500&fit=crop', category: 'Home Decor', isNew: true },
  { id: '7', name: 'Daisy Chain Earrings', price: 28.00, image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=500&fit=crop', category: 'Jewelry', isNew: true },
  { id: '8', name: 'Sunflower Print Skirt', price: 65.00, image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0uj?w=400&h=500&fit=crop', category: 'Clothing', isNew: true },
];

const testimonials = [
  { id: 1, name: 'Sarah M.', text: 'Absolutely love the quality and unique designs. The floral prints are stunning!', rating: 5, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { id: 2, name: 'Emily R.', text: 'Fast shipping and the colors are even more beautiful in person. Highly recommend!', rating: 5, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  { id: 3, name: 'Jessica L.', text: 'The customization options are amazing. Created a perfect gift for my mom!', rating: 5, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
];

const features = [
  { icon: Truck, title: 'Free Shipping', description: 'On orders over $50' },
  { icon: RotateCcw, title: 'Easy Returns', description: '30-day return policy' },
  { icon: Shield, title: 'Secure Payment', description: '100% protected checkout' },
  { icon: Sparkles, title: 'Premium Quality', description: 'Handcrafted designs' },
];

const instagramPosts = [
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=300&h=300&fit=crop',
];

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-pattern-floral">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/60 via-background/40 to-accent/30" />
        
        {/* Floating Decorative Elements */}
        <motion.div
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-[10%] w-32 h-32 rounded-full bg-primary/10 blur-3xl"
        />
        <motion.div
          animate={{ y: [20, -20, 20] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-40 left-[5%] w-48 h-48 rounded-full bg-accent/20 blur-3xl"
        />
        
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                  New Collection 2024
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-tight mb-6"
              >
                Discover the Beauty of{' '}
                <span className="text-gradient">Floral Design</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8"
              >
                Explore our curated collection of floral-inspired textiles, prints, and home décor. 
                Each piece tells a story of nature's elegance.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link to="/products">
                  <Button size="lg" className="btn-primary text-lg px-8">
                    Shop Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/customize">
                  <Button size="lg" variant="outline" className="btn-outline text-lg px-8">
                    Customize
                  </Button>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex justify-center lg:justify-start gap-8 mt-12"
              >
                <div>
                  <span className="block font-serif text-3xl font-semibold text-primary">500+</span>
                  <span className="text-sm text-muted-foreground">Unique Designs</span>
                </div>
                <div>
                  <span className="block font-serif text-3xl font-semibold text-primary">10k+</span>
                  <span className="text-sm text-muted-foreground">Happy Customers</span>
                </div>
                <div>
                  <span className="block font-serif text-3xl font-semibold text-primary">4.9</span>
                  <span className="text-sm text-muted-foreground">Rating</span>
                </div>
              </motion.div>
            </div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-medium border-decorative">
                <img
                  src={heroImages[0]}
                  alt="Floral collection"
                  className="w-full h-[600px] object-cover"
                />
              </div>
              {/* Floating Product Card */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-8 -left-8 bg-card rounded-2xl shadow-medium p-4 border border-border max-w-[200px]"
              >
                <img
                  src={featuredProducts[0].image}
                  alt={featuredProducts[0].name}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <p className="text-sm font-medium truncate">{featuredProducts[0].name}</p>
                <p className="text-primary font-semibold">${featuredProducts[0].price}</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-card border-y border-border">
        <div className="container-custom py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 0.1}>
                <div className="flex items-center gap-4 justify-center md:justify-start">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="text-primary font-medium">Explore</span>
              <h2 className="font-serif text-3xl md:text-4xl mt-2 mb-4">Shop by Category</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover our carefully curated collections, each inspired by nature's most beautiful patterns.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <ScrollReveal key={category.id} delay={index * 0.1}>
                <Link to={`/category/${category.id}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden card-floral">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                      <h3 className="font-serif text-lg md:text-xl text-white mb-1">{category.name}</h3>
                      <p className="text-sm text-white/80">{category.count} Products</p>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-padding bg-secondary/30">
        <div className="container-custom">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="text-primary font-medium">Best Sellers</span>
                <h2 className="font-serif text-3xl md:text-4xl mt-2 mb-4">Featured Products</h2>
                <p className="text-muted-foreground max-w-xl">
                  Our most loved pieces, handpicked for their exceptional quality and timeless designs.
                </p>
              </div>
              <Link to="/products" className="mt-4 md:mt-0">
                <Button variant="outline" className="btn-outline">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product, index) => (
              <ScrollReveal key={product.id} delay={index * 0.1}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Banner Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1920&h=600&fit=crop"
            alt="Customization banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/60" />
        </div>
        <div className="container-custom relative z-10 section-padding">
          <div className="max-w-2xl mx-auto text-center text-white">
            <ScrollReveal>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-6">
                Create Your Own Design
              </h2>
              <p className="text-lg text-white/80 mb-8">
                Use our customization tool to bring your vision to life. Choose fabrics, patterns, 
                and create something uniquely yours.
              </p>
              <Link to="/customize">
                <Button size="lg" className="bg-white text-foreground hover:bg-white/90 px-8">
                  Start Customizing
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="text-primary font-medium">Just In</span>
                <h2 className="font-serif text-3xl md:text-4xl mt-2 mb-4">New Arrivals</h2>
                <p className="text-muted-foreground max-w-xl">
                  Fresh from our design studio. Explore the latest additions to our collection.
                </p>
              </div>
              <Link to="/products?filter=new" className="mt-4 md:mt-0">
                <Button variant="outline" className="btn-outline">
                  View All New
                  <ArrowRight className="w-4 h-4 ml-2" />
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

      {/* Testimonials */}
      <section className="section-padding bg-pattern-dots">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="text-primary font-medium">Testimonials</span>
              <h2 className="font-serif text-3xl md:text-4xl mt-2 mb-4">What Our Customers Say</h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={testimonial.id} delay={index * 0.15}>
                <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-warm text-warm" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <span className="font-medium">{testimonial.name}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Section */}
      <section className="section-padding">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="text-primary font-medium">@florelia</span>
              <h2 className="font-serif text-3xl md:text-4xl mt-2 mb-4">Follow Us on Instagram</h2>
              <p className="text-muted-foreground">
                Tag us in your photos for a chance to be featured
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
            {instagramPosts.map((post, index) => (
              <ScrollReveal key={index} delay={index * 0.05}>
                <a
                  href="#"
                  className="group block aspect-square rounded-xl overflow-hidden"
                >
                  <img
                    src={post}
                    alt={`Instagram post ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
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
