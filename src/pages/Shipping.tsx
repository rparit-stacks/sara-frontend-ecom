import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const Shipping = () => {
  useEffect(() => {
    document.title = 'Shipping Policy - Studio Sara | Delivery Information';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Studio Sara shipping policy. Courier partners (Trackon, PNS, Tirupati, Delhivery, XpressBees). Shipping charges based on meters and quantity. Delivery 2–3 days India, 5–6 days international. Full payment before dispatch.');
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
                  <p>We use reliable courier partners based on the order type:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Print orders:</strong> Trackon and PNS</li>
                    <li><strong>Embroidery orders:</strong> Tirupati, Delhivery, and XpressBees</li>
                  </ul>
                  <p>Courier partner selection depends on serviceability, parcel size, and destination.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Shipping Charges</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Courier charges are included in the bill, calculated based on the number of meters and quantity ordered by the client.</p>
                  <p>As shipping is ultimately based on the actual parcel weight after printing or embroidery, if there is a substantial difference between the initially calculated shipping amount and the final parcel weight:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>The client will be informed of the revised courier charges</li>
                    <li>Any additional amount must be paid before dispatch</li>
                    <li>Shipping will be processed only after payment confirmation</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Delivery Timelines</h2>
                <div className="text-muted-foreground space-y-3">
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Within India:</strong> Estimated delivery time is 2–3 business days after dispatch</li>
                    <li><strong>International orders:</strong> Estimated delivery time is 5–6 business days after dispatch</li>
                  </ul>
                  <p className="text-sm italic">Note: Delivery timelines are indicative and may vary based on destination, customs clearance (for international shipments), and courier service.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Free Shipping Policy</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>We do not offer free shipping. Our pricing is already structured to remain affordable for small businesses opting for custom printing or embroidery.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Payment & Tracking</h2>
                <div className="text-muted-foreground space-y-3">
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Full payment must be completed before shipping</li>
                    <li>Tracking details will be shared after the shipment is dispatched</li>
                    <li>Courier charges are finalized based on actual parcel weight</li>
                  </ul>
                  <p className="text-red-600 font-semibold">Failure to clear revised courier charges (if applicable) may result in shipment delay or cancellation and could impact future orders.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Client Courier Pickups</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Client-arranged courier pickups from the factory are not permitted, as they disrupt pickup records and may lead to misplacement issues.</p>
                </div>
              </div>

              <div className="bg-muted p-6 rounded-lg mt-8">
                <h3 className="font-cursive text-2xl mb-4">Important Notes</h3>
                <ul className="text-muted-foreground space-y-2 list-disc pl-6">
                  <li>Shipping charges are subject to actual parcel weight</li>
                  <li>Any weight-related difference will be communicated prior to dispatch</li>
                  <li>Delivery timelines may vary based on location, courier service, and customs procedures (for international orders)</li>
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
