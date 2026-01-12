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
      <section className="w-full bg-secondary/30 py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <ScrollReveal>
            <h1 className="font-cursive text-5xl lg:text-6xl">Shopping Cart</h1>
            <p className="text-muted-foreground mt-3 text-lg">{items.length} items in your cart</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="w-full py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          {items.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
              <div className="lg:col-span-2 space-y-6">
                {items.map((item) => (
                  <ScrollReveal key={item.id}>
                    <div className="flex gap-6 p-6 bg-card rounded-2xl border border-border">
                      <img src={item.image} alt={item.name} className="w-28 h-36 lg:w-32 lg:h-40 object-cover rounded-xl" />
                      <div className="flex-1">
                        <Link to={`/product/${item.id}`} className="font-cursive text-2xl hover:text-primary">{item.name}</Link>
                        <p className="text-base text-muted-foreground mt-1">{item.color}</p>
                        <p className="font-semibold text-primary text-xl mt-3">₹{item.price}</p>
                        <div className="flex items-center gap-5 mt-4">
                          <div className="flex items-center border border-border rounded-full">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full"><Minus className="w-4 h-4" /></Button>
                            <span className="w-10 text-center text-base">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full"><Plus className="w-4 h-4" /></Button>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive w-10 h-10"><Trash2 className="w-5 h-5" /></Button>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
              
              <div className="bg-card p-8 rounded-2xl border border-border h-fit sticky top-24">
                <h3 className="font-cursive text-2xl mb-6">Order Summary</h3>
                <div className="space-y-4 text-base">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
                  <div className="border-t pt-4 flex justify-between font-semibold text-xl"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
                </div>
                <div className="mt-6 flex gap-3">
                  <Input placeholder="Coupon code" className="flex-1 h-12" />
                  <Button variant="outline" className="h-12">Apply</Button>
                </div>
                <Link to="/checkout" className="block mt-6">
                  <Button className="w-full btn-primary h-14 text-base">Checkout <ArrowRight className="w-5 h-5 ml-2" /></Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <ShoppingBag className="w-20 h-20 mx-auto text-muted-foreground mb-6" />
              <h2 className="font-cursive text-3xl mb-3">Your cart is empty</h2>
              <p className="text-muted-foreground text-lg mb-8">Looks like you haven't added anything yet.</p>
              <Link to="/products"><Button className="btn-primary">Continue Shopping</Button></Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Cart;
