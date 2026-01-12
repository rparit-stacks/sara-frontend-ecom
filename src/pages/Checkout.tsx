import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ScrollReveal from '@/components/animations/ScrollReveal';

const Checkout = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="w-full bg-secondary/30 py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <ScrollReveal>
            <h1 className="font-cursive text-5xl lg:text-6xl">Checkout</h1>
            <p className="text-muted-foreground mt-3 text-lg">Complete your order</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="w-full py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
            <div className="lg:col-span-2 space-y-8">
              <ScrollReveal>
                <div className="bg-card p-8 rounded-2xl border border-border">
                  <h3 className="font-cursive text-2xl mb-6">Shipping Information</h3>
                  <div className="grid grid-cols-2 gap-5">
                    <Input placeholder="First name" className="h-12" />
                    <Input placeholder="Last name" className="h-12" />
                    <Input placeholder="Email" className="col-span-2 h-12" type="email" />
                    <Input placeholder="Phone" className="col-span-2 h-12" />
                    <Input placeholder="Address" className="col-span-2 h-12" />
                    <Input placeholder="City" className="h-12" />
                    <Input placeholder="Postal code" className="h-12" />
                    <Select>
                      <SelectTrigger className="col-span-2 h-12">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mh">Maharashtra</SelectItem>
                        <SelectItem value="dl">Delhi</SelectItem>
                        <SelectItem value="ka">Karnataka</SelectItem>
                        <SelectItem value="tn">Tamil Nadu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal>
                <div className="bg-card p-8 rounded-2xl border border-border">
                  <h3 className="font-cursive text-2xl mb-6">Payment Method</h3>
                  <div className="space-y-5">
                    <Input placeholder="Card number" className="h-12" />
                    <div className="grid grid-cols-2 gap-5">
                      <Input placeholder="MM/YY" className="h-12" />
                      <Input placeholder="CVC" className="h-12" />
                    </div>
                    <Input placeholder="Name on card" className="h-12" />
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border h-fit sticky top-24">
              <h3 className="font-cursive text-2xl mb-6">Order Summary</h3>
              <div className="space-y-4 text-base border-b pb-6 mb-6">
                <div className="flex justify-between">
                  <span>Rose Garden Silk Scarf</span>
                  <span>₹899</span>
                </div>
                <div className="flex justify-between">
                  <span>Lavender Fields Cushion x2</span>
                  <span>₹900</span>
                </div>
              </div>
              <div className="space-y-3 text-base">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹1,799</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-semibold text-xl pt-4 border-t">
                  <span>Total</span>
                  <span>₹1,799</span>
                </div>
              </div>
              <Button className="w-full btn-primary mt-8 h-14 text-base">Place Order</Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
