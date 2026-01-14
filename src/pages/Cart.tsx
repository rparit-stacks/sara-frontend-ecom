import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ScrollReveal from '@/components/animations/ScrollReveal';

const cartItems = [
  { id: '1', name: 'Rose Garden Silk Scarf', price: 899, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=200&h=250&fit=crop', color: 'Blush Pink', quantity: 1 },
  { id: '2', name: 'Lavender Fields Cushion', price: 450, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=250&fit=crop', color: 'Lavender', quantity: 2 },
];

const Cart = () => {
  const [items, setItems] = useState(cartItems);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 500 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <Layout>
      {/* Hero */}
      <section className="w-full bg-secondary/30 py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <ScrollReveal>
            <h1 className="font-cursive text-3xl xs:text-4xl sm:text-5xl lg:text-6xl">Shopping Cart</h1>
            <p className="text-muted-foreground mt-2 xs:mt-3 text-sm xs:text-base sm:text-lg">{items.length} items in your cart</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="w-full py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          {items.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 xl:gap-14">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {items.map((item) => (
                  <ScrollReveal key={item.id}>
                    <div className="flex gap-3 xs:gap-4 sm:gap-6 p-3 xs:p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl border border-border">
                      <img src={item.image} alt={item.name} className="w-20 h-24 xs:w-24 xs:h-32 sm:w-28 sm:h-36 lg:w-32 lg:h-40 object-cover rounded-lg sm:rounded-xl flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.id}`} className="font-cursive text-lg xs:text-xl sm:text-2xl hover:text-[#2b9d8f] line-clamp-2">{item.name}</Link>
                        <p className="text-xs xs:text-sm sm:text-base text-muted-foreground mt-1">{item.color}</p>
                        <p className="font-semibold text-[#2b9d8f] text-base xs:text-lg sm:text-xl mt-2 xs:mt-3">₹{item.price}</p>
                        <div className="flex items-center gap-3 xs:gap-4 sm:gap-5 mt-3 xs:mt-4">
                          <div className="flex items-center border border-border rounded-full">
                            <Button variant="ghost" size="icon" className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 rounded-full"><Minus className="w-3 h-3 xs:w-4 xs:h-4" /></Button>
                            <span className="w-8 xs:w-9 sm:w-10 text-center text-xs xs:text-sm sm:text-base">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 rounded-full"><Plus className="w-3 h-3 xs:w-4 xs:h-4" /></Button>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10"><Trash2 className="w-4 h-4 xs:w-5 xs:h-5" /></Button>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
              
              <div className="bg-card p-4 xs:p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-border h-fit lg:sticky lg:top-24">
                <h3 className="font-cursive text-xl xs:text-2xl mb-4 xs:mb-6">Order Summary</h3>
                <div className="space-y-3 xs:space-y-4 text-sm xs:text-base">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
                  <div className="border-t pt-3 xs:pt-4 flex justify-between font-semibold text-lg xs:text-xl"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
                </div>
                <div className="mt-4 xs:mt-6 flex gap-2 xs:gap-3">
                  <Input placeholder="Coupon code" className="flex-1 h-10 xs:h-11 sm:h-12 text-sm sm:text-base" />
                  <Button variant="outline" className="h-10 xs:h-11 sm:h-12 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">Apply</Button>
                </div>
                <Link to="/checkout" className="block mt-4 xs:mt-6">
                  <Button className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white h-12 xs:h-14 text-sm sm:text-base">
                    <span className="truncate">Checkout</span>
                    <ArrowRight className="w-4 h-4 xs:w-5 xs:h-5 ml-1.5 xs:ml-2 flex-shrink-0" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 xs:py-16 sm:py-20">
              <ShoppingBag className="w-16 h-16 xs:w-20 xs:h-20 mx-auto text-muted-foreground mb-4 xs:mb-6" />
              <h2 className="font-cursive text-2xl xs:text-3xl mb-2 xs:mb-3">Your cart is empty</h2>
              <p className="text-muted-foreground text-sm xs:text-base sm:text-lg mb-6 xs:mb-8">Looks like you haven't added anything yet.</p>
              <Link to="/products"><Button className="bg-[#2b9d8f] hover:bg-[#238a7d] text-white px-4 sm:px-8 py-2 sm:py-4 text-xs sm:text-sm">Continue Shopping</Button></Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Cart;
