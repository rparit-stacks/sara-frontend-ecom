import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const cartItems = [
  { id: '1', name: 'Rose Garden Silk Scarf', price: 89.99, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=200&h=250&fit=crop', color: 'Blush Pink', quantity: 1 },
  { id: '2', name: 'Lavender Fields Cushion', price: 45.00, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=250&fit=crop', color: 'Lavender', quantity: 2 },
];

const Cart = () => {
  const [items, setItems] = useState(cartItems);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + shipping;

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-custom">
          <h1 className="font-serif text-3xl md:text-4xl mb-8">Shopping Cart</h1>
          
          {items.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
                    <img src={item.image} alt={item.name} className="w-24 h-32 object-cover rounded-lg" />
                    <div className="flex-1">
                      <Link to={`/product/${item.id}`} className="font-serif text-lg hover:text-primary">{item.name}</Link>
                      <p className="text-sm text-muted-foreground">{item.color}</p>
                      <p className="font-semibold text-primary mt-2">${item.price}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center border border-border rounded-full">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Minus className="w-3 h-3" /></Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Plus className="w-3 h-3" /></Button>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-card p-6 rounded-xl border border-border h-fit sticky top-24">
                <h3 className="font-serif text-xl mb-4">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `$${shipping}`}</span></div>
                  <div className="border-t pt-3 flex justify-between font-semibold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Input placeholder="Coupon code" className="flex-1" />
                  <Button variant="outline">Apply</Button>
                </div>
                <Link to="/checkout" className="block mt-4">
                  <Button className="w-full btn-primary">Checkout <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-serif text-2xl mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
              <Link to="/products"><Button className="btn-primary">Continue Shopping</Button></Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Cart;
