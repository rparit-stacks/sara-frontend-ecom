import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const Shipping = () => {
  useEffect(() => {
    document.title = 'Shipping Policy - Studio Sara | Delivery Information';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Studio Sara shipping policy. We use reliable courier services for shipping all over India. Air shipping with 2-3 days delivery time. Learn about our shipping charges and delivery options.');
    }
  }, []);

  return (
    <Layout>
      <section className="bg-secondary/30 py-16">
        <div className="container-custom text-center">
          <ScrollReveal>
            <h1 className="font-cursive text-4xl md:text-5xl">Shipping Policy</h1>
            <p className="text-muted-foreground mt-4">Delivery Information & Courier Services</p>
          </ScrollReveal>
        </div>
      </section>
      
      <section className="section-padding">
        <div className="container-custom max-w-4xl prose prose-lg">
          <ScrollReveal>
            <div className="space-y-8">
              <div>
                <h2 className="font-cursive text-3xl mb-4">Courier Services</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>We use reliable courier services (Trackon and PNS) for shipping all over India.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Shipping Charges</h2>
                <div className="text-muted-foreground space-y-3">
                  <p><strong>Air Shipping (2-3 days delivery time):</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>First 500g: <strong>80 INR</strong></li>
                    <li>Every additional kg: <strong>100 INR</strong></li>
                  </ul>
                  <p className="mt-4">The client can ask for one day shipping for which the rates differ substantially.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Free Shipping Policy</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>We do not provide free shipping, as our costings are low enough for any small business that wants custom printing.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Payment & Tracking</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>The courier charges are shared after the parcel moves from factory to courier hub, depending on the weight of the parcel, so they are not included in the invoice. They will be shared at the time of shipping after payment of which the tracking will be shared.</p>
                  <p className="text-red-600 font-semibold">Failure of payment of courier charges will cancel the shipment and withhold any future orders.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Client Courier Pickups</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>We don't entertain client courier pickups from factory as it disturbs our pickup records and cause misplacement issues.</p>
                </div>
              </div>

              <div className="bg-muted p-6 rounded-lg mt-8">
                <h3 className="font-cursive text-2xl mb-4">Important Notes</h3>
                <ul className="text-muted-foreground space-y-2 list-disc pl-6">
                  <li>Complete payment before shipping is mandatory</li>
                  <li>Shipping charges are calculated based on actual parcel weight</li>
                  <li>Tracking information will be provided after courier charges payment</li>
                  <li>Delivery time may vary based on location and courier service</li>
                </ul>
              </div>

              <div className="bg-primary/10 p-6 rounded-lg mt-8">
                <h3 className="font-cursive text-2xl mb-4">Need Help?</h3>
                <p className="text-muted-foreground">
                  If you have any questions about shipping or delivery, please contact us through our <a href="/contact" className="text-primary hover:underline">contact page</a>.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Shipping;
