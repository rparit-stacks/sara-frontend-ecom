import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

const wishlistItems = [
  { id: '1', name: 'Rose Garden Silk Scarf', price: 89.99, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=500&fit=crop', category: 'Scarves' },
  { id: '3', name: 'Cherry Blossom Dress', price: 159.99, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop', category: 'Clothing' },
];

const Wishlist = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-custom">
          <h1 className="font-serif text-3xl md:text-4xl mb-8">My Wishlist</h1>
          
          {wishlistItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {wishlistItems.map((item) => (
                <div key={item.id} className="card-floral group">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <Button variant="secondary" size="icon" className="absolute top-3 right-3 rounded-full"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                    <Link to={`/product/${item.id}`} className="font-serif text-lg hover:text-primary block mt-1">{item.name}</Link>
                    <p className="font-semibold text-primary mt-2">${item.price}</p>
                    <Button className="w-full btn-primary mt-3 gap-2"><ShoppingBag className="w-4 h-4" />Add to Cart</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-serif text-2xl mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">Save items you love for later.</p>
              <Link to="/products"><Button className="btn-primary">Browse Products</Button></Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Wishlist;
