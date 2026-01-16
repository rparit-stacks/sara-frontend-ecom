import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { toast } from 'sonner';
import { wishlistApi, cartApi } from '@/lib/api';

const Wishlist = () => {
  const queryClient = useQueryClient();
  
  // Fetch wishlist from API
  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.getWishlist(),
    enabled: !!localStorage.getItem('authToken'),
  });
  
  // Remove from wishlist
  const removeMutation = useMutation({
    mutationFn: wishlistApi.removeItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removed from wishlist');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove from wishlist');
    },
  });
  
  // Add to cart
  const addToCartMutation = useMutation({
    mutationFn: (item: any) => {
      const cartData: any = {
        productType: item.productType,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: 1,
      };
      
      // Extract price from productPrice string (format: "₹123.45")
      const priceMatch = item.productPrice?.match(/₹?([\d.]+)/);
      if (priceMatch) {
        cartData.unitPrice = parseFloat(priceMatch[1]);
      }
      
      return cartApi.addItem(cartData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast.success('Added to cart');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add to cart');
    },
  });
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
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : wishlistItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 lg:gap-8">
              {wishlistItems.map((item: any, index: number) => (
                <ScrollReveal key={item.id} delay={Math.min(index * 0.05, 0.3)}>
                  <div className="card-floral group">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img src={item.productImage || ''} alt={item.productName || 'Product'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="absolute top-2 xs:top-3 sm:top-4 right-2 xs:right-3 sm:right-4 rounded-full w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10"
                        onClick={() => removeMutation.mutate(item.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                    <div className="p-3 xs:p-4 sm:p-5">
                      <p className="text-xs xs:text-sm text-muted-foreground truncate">{item.productType}</p>
                      <Link 
                        to={`/products/${item.productSlug || item.productId}`} 
                        className="font-cursive text-base xs:text-lg sm:text-xl hover:text-[#2b9d8f] block mt-1 xs:mt-2 line-clamp-2"
                      >
                        {item.productName || 'Product'}
                      </Link>
                      <p className="font-semibold text-[#2b9d8f] text-base xs:text-lg sm:text-xl mt-2 xs:mt-3">{item.productPrice || '₹0'}</p>
                      <Button 
                        className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white mt-3 xs:mt-4 gap-2 h-10 xs:h-11 sm:h-12 text-xs xs:text-sm sm:text-base"
                        onClick={() => addToCartMutation.mutate(item)}
                        disabled={addToCartMutation.isPending}
                      >
                        <ShoppingBag className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
                        <span className="truncate">{addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}</span>
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
