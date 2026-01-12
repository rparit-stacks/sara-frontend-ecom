import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Checkout = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-custom">
          <h1 className="font-serif text-3xl md:text-4xl mb-8">Checkout</h1>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="font-serif text-xl mb-4">Shipping Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="First name" /><Input placeholder="Last name" />
                  <Input placeholder="Email" className="col-span-2" type="email" />
                  <Input placeholder="Phone" className="col-span-2" />
                  <Input placeholder="Address" className="col-span-2" />
                  <Input placeholder="City" /><Input placeholder="Postal code" />
                  <Select><SelectTrigger className="col-span-2"><SelectValue placeholder="Country" /></SelectTrigger><SelectContent><SelectItem value="us">United States</SelectItem><SelectItem value="uk">United Kingdom</SelectItem></SelectContent></Select>
                </div>
              </div>
              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="font-serif text-xl mb-4">Payment Method</h3>
                <div className="space-y-4">
                  <Input placeholder="Card number" /><div className="grid grid-cols-2 gap-4"><Input placeholder="MM/YY" /><Input placeholder="CVC" /></div>
                </div>
              </div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border h-fit sticky top-24">
              <h3 className="font-serif text-xl mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm border-b pb-4 mb-4">
                <div className="flex justify-between"><span>Rose Garden Silk Scarf</span><span>$89.99</span></div>
                <div className="flex justify-between"><span>Lavender Fields Cushion x2</span><span>$90.00</span></div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>$179.99</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t"><span>Total</span><span>$179.99</span></div>
              </div>
              <Button className="w-full btn-primary mt-6">Place Order</Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
