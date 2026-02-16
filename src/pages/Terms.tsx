import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const Terms = () => {
  useEffect(() => {
    document.title = 'Terms & Conditions - Studio Sara | Service Agreement';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Terms of Service Agreement for Studio Sara. Read our comprehensive terms covering fabric selection, design making, sampling, printing, order placement, client conduct, damage/defect, wash instructions, and general policies.');
    }
  }, []);

  return (
    <Layout>
      <section className="bg-secondary/30 py-16">
        <div className="container-custom text-center">
          <ScrollReveal>
            <h1 className="font-cursive text-4xl md:text-5xl">Terms & Conditions</h1>
            <p className="text-muted-foreground mt-4">Terms of Service Agreement</p>
          </ScrollReveal>
        </div>
      </section>
      
      <section className="section-padding">
        <div className="container-custom max-w-4xl prose prose-lg">
          <ScrollReveal>
            <div className="space-y-8">
              <div>
                <h2 className="font-cursive text-3xl mb-4">1. Fabric Selection</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Fabrics provided by us are standardized to ensure consistent quality. However, slight variations in feel or texture may occur between different rolls of the same fabric, as they are woven at different times.</p>
                  <p>Fabric selection for printing is the sole responsibility of the client. Our team may suggest options based on client inputs, but the final decision rests with the client.</p>
                  <p>For new custom prints created specifically for a client, it is strongly recommended to print a sample before placing the main order to ensure satisfaction with fabric quality and print outcome.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">2. Design Making Terms</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Design-making charges depend entirely on the complexity of the design and will be communicated at the time of order placement.</p>
                  <p>All design requirements must be shared at one time to avoid confusion and delays.</p>
                  <p>A maximum of two revisions are allowed after design creation, limited to size or color changes. Any further changes will be chargeable based on the nature of modification.</p>
                  <p>Print-ready files will be shared via downloadable links. The required file format must be specified by the client at the time of order confirmation.</p>
                  <p>Files must be downloaded within 3 days of sharing. Beyond this period, we are not obligated to re-share the files.</p>
                  <p>If clients provide their own files for printing, the files must strictly meet printing requirements.</p>
                  <p>We follow a strict confidentiality policy and do not share any client designs under any circumstances.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">3. Sampling Obligations</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Sampling new designs before the main order is strongly recommended to ensure accuracy in print shades and fabric quality.</p>
                  <p>Sampling is done solely for testing purposes and should not be considered a usable asset, though the client may use it at their discretion.</p>
                  <p>Clients who choose not to sample cannot raise complaints regarding final print shades or outcomes.</p>
                  <p>As every print batch may vary slightly, minor variations between sample and bulk print are normal, negligible, and industry-accepted.</p>
                  <p>Clients who are very particular about shades may opt for sampling before bulk production when the order exceeds 15 meters per design. The original swatch must be provided by the client for matching.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">4. Printing Obligations</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Natural fabrics are prone to shrinkage during printing, typically ranging between 5%–12% in length.</p>
                  <p>If clients wish to account for shrinkage, we add 5% extra fabric to the invoice upon request—mainly applicable when printing a fixed number of pieces.</p>
                  <p>For running fabric orders, clients may choose whether or not to account for shrinkage. Not accounting for shrinkage may result in fewer final meters than ordered.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">5. Order Placement Terms</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Orders are accepted only through the website.</p>
                  <p>For special discounts, clients may contact us, and a coupon code will be shared if applicable.</p>
                  <p>The standard order timeline for print orders is 4–5 working days, calculated after design readiness and approval.</p>
                  <p>Urgent or rush orders are not accepted.</p>
                  <p>50% advance payment confirms the order and initiates processing.</p>
                  <p>Design confirmation will be taken via formal approval video before printing.</p>
                  <p>Post-confirmation, no disputes regarding shades, size, or orientation will be entertained.</p>
                  <p>Full payment before shipping is mandatory.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">6. Client Conduct</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Due to the custom nature of our services, clients are expected to provide clear and consolidated requirements.</p>
                  <p>As the order moves from one stage to another, customers will receive automated updates regarding their order status.</p>
                  <p>If there is any concern or clarification required regarding the order, our team will proactively contact the client.</p>
                  <p>Custom orders require patience and cooperation. While we strive to meet timelines, rare delays due to machine maintenance, power issues, or software failures may occur.</p>
                  <p>Clients are advised to maintain adequate buffer time and plan inventory in advance to ensure smooth operations and stress-free deliveries.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">7. Damage or Defect Terms</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Minor weaving defects such as thread pulls or fabric blobs are common in natural fabrics and are universally accepted in the textile industry.</p>
                  <p>While we take utmost care during printing, a 5% damage allowance is considered acceptable for orders exceeding 10 meters of the same fabric.</p>
                  <p>Damage beyond this limit will be reviewed and may qualify for reprint or refund only for the affected meters.</p>
                  <p>Damage claims must be reported within 24 hours of delivery, supported by clear video evidence. Video verification calls may be requested.</p>
                  <p>Damage claims are unrelated to print design or shade variations.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">8. Wash Instructions</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Digitally printed fabrics are generally machine washable.</p>
                  <p>For premium or hand-wash fabrics, rinse and spin-dry thoroughly before drying to prevent water or soap residue.</p>
                  <p>We are not responsible for damage caused by harsh detergents, bleaching agents, perfumes, or corrosive seawater.</p>
                  <p>Soaking is strictly prohibited.</p>
                  <p>Some fabrics may bleed slightly during initial washes; however, colors will not stain if dried correctly.</p>
                  <p>Garment stitching should account for possible shrinkage, especially for cotton, linen, or modal fabrics.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">9. General Terms</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Factory visits are not permitted due to security restrictions.</p>
                  <p>Clients sending their own fabrics must label them clearly with name, fabric composition, and meterage, and share courier tracking details.</p>
                  <p>Client-provided fabrics are also prone to shrinkage; fabric quantity should be sent accordingly.</p>
                  <p>An account of leftover fabric after printing will be shared with the client.</p>
                </div>
              </div>

              <div className="bg-muted p-6 rounded-lg mt-8">
                <h3 className="font-cursive text-2xl mb-4">Our Promise</h3>
                <p className="text-muted-foreground">
                  We ensure the use of standard AZO-free dyes, consistent fabric quality, and the exact approved print files for every order—leaving zero room for negligence.
                </p>
                <p className="text-muted-foreground mt-4">
                  The signature below confirms complete understanding and acceptance of the above terms by both parties.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Terms;
