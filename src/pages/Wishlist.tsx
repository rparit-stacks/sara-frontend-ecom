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
      <section className="w-full bg-secondary/30 py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <ScrollReveal>
            <h1 className="font-cursive text-5xl lg:text-6xl">My Wishlist</h1>
            <p className="text-muted-foreground mt-3 text-lg">{wishlistItems.length} saved items</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="w-full py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          {wishlistItems.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {wishlistItems.map((item, index) => (
                <ScrollReveal key={item.id} delay={index * 0.05}>
                  <div className="card-floral group">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <Button variant="secondary" size="icon" className="absolute top-4 right-4 rounded-full w-10 h-10">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                      <Link to={`/product/${item.id}`} className="font-cursive text-xl hover:text-primary block mt-2">{item.name}</Link>
                      <p className="font-semibold text-primary text-lg mt-3">₹{item.price.toLocaleString('en-IN')}</p>
                      <Button className="w-full btn-primary mt-4 gap-2 h-12">
                        <ShoppingBag className="w-5 h-5" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Heart className="w-20 h-20 mx-auto text-muted-foreground mb-6" />
              <h2 className="font-cursive text-3xl mb-3">Your wishlist is empty</h2>
              <p className="text-muted-foreground text-lg mb-8">Save items you love for later.</p>
              <Link to="/products"><Button className="btn-primary">Browse Products</Button></Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Wishlist;
