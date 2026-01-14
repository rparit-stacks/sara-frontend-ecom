import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import ScrollReveal from '@/components/animations/ScrollReveal';

const wishlistItems = [
  { id: '1', name: 'Rose Garden Silk Scarf', price: 899, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=500&fit=crop', category: 'Scarves' },
  { id: '3', name: 'Cherry Blossom Dress', price: 1599, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop', category: 'Clothing' },
  { id: '4', name: 'Wildflower Print Tote', price: 350, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop', category: 'Bags' },
  { id: '5', name: 'Peony Paradise Blouse', price: 799, image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=500&fit=crop', category: 'Clothing' },
];

const Wishlist = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="w-full bg-secondary/30 py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <ScrollReveal>
            <h1 className="font-cursive text-3xl xs:text-4xl sm:text-5xl lg:text-6xl">My Wishlist</h1>
            <p className="text-muted-foreground mt-2 xs:mt-3 text-sm xs:text-base sm:text-lg">{wishlistItems.length} saved items</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="w-full py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          {wishlistItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 lg:gap-8">
              {wishlistItems.map((item, index) => (
                <ScrollReveal key={item.id} delay={index * 0.05}>
                  <div className="card-floral group">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <Button variant="secondary" size="icon" className="absolute top-2 xs:top-3 sm:top-4 right-2 xs:right-3 sm:right-4 rounded-full w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10">
                        <Trash2 className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                    <div className="p-3 xs:p-4 sm:p-5">
                      <p className="text-xs xs:text-sm text-muted-foreground truncate">{item.category}</p>
                      <Link to={`/product/${item.id}`} className="font-cursive text-base xs:text-lg sm:text-xl hover:text-[#2b9d8f] block mt-1 xs:mt-2 line-clamp-2">{item.name}</Link>
                      <p className="font-semibold text-[#2b9d8f] text-base xs:text-lg sm:text-xl mt-2 xs:mt-3">₹{item.price.toLocaleString('en-IN')}</p>
                      <Button className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white mt-3 xs:mt-4 gap-2 h-10 xs:h-11 sm:h-12 text-xs xs:text-sm sm:text-base">
                        <ShoppingBag className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
                        <span className="truncate">Add to Cart</span>
                      </Button>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 xs:py-16 sm:py-20">
              <Heart className="w-16 h-16 xs:w-20 xs:h-20 mx-auto text-muted-foreground mb-4 xs:mb-6" />
              <h2 className="font-cursive text-2xl xs:text-3xl mb-2 xs:mb-3">Your wishlist is empty</h2>
              <p className="text-muted-foreground text-sm xs:text-base sm:text-lg mb-6 xs:mb-8">Save items you love for later.</p>
              <Link to="/products"><Button className="bg-[#2b9d8f] hover:bg-[#238a7d] text-white px-4 sm:px-8 py-2 sm:py-4 text-xs sm:text-sm">Browse Products</Button></Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Wishlist;
