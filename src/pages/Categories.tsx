import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const categories = [
  {
    id: '1',
    name: 'Floral Prints',
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=700&fit=crop',
    count: 48,
    description: 'Hand-drawn floral prints and embroideries for every occasion',
  },
  {
    id: '2',
    name: 'Botanical',
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&h=700&fit=crop',
    count: 36,
    description: 'Nature-inspired botanical prints and thread embroideries',
  },
  {
    id: '3',
    name: 'Abstract',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&h=700&fit=crop',
    count: 24,
    description: 'Modern abstract prints and experimental embroideries',
  },
  {
    id: '4',
    name: 'Geometric',
    image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=700&fit=crop',
    count: 32,
    description: 'Clean geometric prints and structured embroideries',
  },
  {
    id: '5',
    name: 'Tropical',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=700&fit=crop',
    count: 28,
    description: 'Exotic tropical prints and lush embroideries',
  },
  {
    id: '6',
    name: 'Vintage',
    image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&h=700&fit=crop',
    count: 42,
    description: 'Classic vintage-inspired prints and heirloom embroideries',
  },
  {
    id: '7',
    name: 'Minimalist',
    image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=600&h=700&fit=crop',
    count: 20,
    description: 'Simple, modern prints and subtle stitch details',
  },
  {
    id: '8',
    name: 'Watercolor',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=700&fit=crop',
    count: 18,
    description: 'Soft watercolor-style prints and painterly embroideries',
  },
];

const Categories = () => {
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 lg:gap-8">
            {categories.map((category, index) => (
              <ScrollReveal key={category.id} delay={index * 0.05}>
                <Link to={`/category/${category.id}`} className="group block">
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
                        <span className="text-white/60 text-[10px] xs:text-xs sm:text-sm hidden xs:block">{category.count} Products</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Categories;
