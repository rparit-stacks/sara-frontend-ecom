import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const Terms = () => {
  useEffect(() => {
    document.title = 'Terms & Conditions - Studio Sara | Service Agreement';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Terms of Service Agreement for Studio Sara. Read our comprehensive terms covering fabric selection, design making, sampling, printing, order placement, and client conduct policies.');
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
            <p className="text-muted-foreground mb-8">This Agreement is entered between: <strong>STUDIO SARA AND CLIENT PARTY</strong></p>
            
            <div className="space-y-8">
              <div>
                <h2 className="font-cursive text-3xl mb-4">1. FABRIC SELECTION</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Fabrics provided by us are standardised ensuring same quality each time. However, there can be slight differences in different rolls of the same fabric in terms of feel as they are woven at different times.</p>
                  <p>The fabrics selected for printing, is the sole responsibility of the client. The team can just suggest based on client inputs. To be sure of the fabric quality, the client can order white samples or print 2 meters (MOQ) of the fabric, before the main order to ensure the fabric quality.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">2. TERMS OF DESIGN MAKING</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>The charges of the design making solely depends on the design and will be given at the time of placing the order.</p>
                  <p>All the details required for making to be given at once, to avoid delays in changes and confusion.</p>
                  <p>There are only 2 changes allowed after the design is made, in terms of sizes or colours. The changes after which will be chargeable depending on the change required.</p>
                  <p>The print files will be shared by us through links that are downloadable. The format of print file needed can be mentioned by the client at the time of delivery. The client is supposed to download the file within 3 days, after which we are not obliged to share again.</p>
                  <p>If the files are shared by client for printing, they should meet the requirements of printing.</p>
                  <p>There is a strict rule we follow of non sharing of any of the clients designs, and keeping them confidential.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">3. SAMPLING OBLIGATIONS</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Its always suggested to sample new designs before main print to ensure the shades of print and the fabric quality. MOQ is 2 meters for any fabric quality, and many designs can be tested within that.</p>
                  <p>The sampling done to test design should not be considered as usable asset, but the customer can use it in any possible manner. The company is not obliged to make it usable in any manner for the client.</p>
                  <p>For clients who do not sample, cannot complain about the shade or the print of the final design.</p>
                  <p>As every batch of print differs, slight variations can exist between sample and the main print, which is practically negligible and universally acceptable.</p>
                  <p>For clients who are particular about the shades, in each batch of print can go for sample print before the main order, only when the order is crossing 15 meters in each design. (The original swatch to be proved by client for matching.)</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">4. PRINTING OBLIGATIONS</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>During printing process, fabrics are prone to shrinkage in length (varies between 5-12%) as these are natural fabrics.</p>
                  <p>If the customer wants to add the shrinkage percentage in the order placed, we add 5% extra fabric in the invoice. This can be done when certain fixed number of pieces are to be printed.</p>
                  <p>For printing of running fabrics the client may or may not opt for fabric addition accounting shrinkage. Not taking into account shrinkage can lead to less number of meters in the final outcome than actually ordered.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">5. ORDER PLACEMENT TERMS</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>The order will be placed through an order form. After submission of which, a pdf of order with timelines will be shared. (Any order required before the timeline will not be accepted.)</p>
                  <p>On confirming the order pdf, invoice will be shared.</p>
                  <p>50% of the order payment, is a confirmation to start the processing the order.</p>
                  <p>The design confirmation, in form of video will be taken before print after which no design issues in terms of shades, size or orientation can be raised.</p>
                  <p>Complete payment before shipping is mandatory.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">6. CLIENT CONDUCT</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Due to custom nature of services, we prefer our clients to be very clear with their requirements and provide them in a consolidated manner at one go.</p>
                  <p>Dealings with the clients will be done only in slots of 20 mins to ensure everything is discussed and cleared at the same time. Discussing beyond throughout the day is not encouraged.</p>
                  <p>The updates on the stages of the order will be provided each day to the customer between (7pm-8pm daily), during the course of the order, based on the timeline provided on the order pdf that was created at the time of placing the order. Discussion beyond the update message will require slot booking.</p>
                  <p>Custom orders require patience and compassion from our clients, as we pour our 100 percent to follow deadlines set, but some inevitable circumstances like machine maintenance, electricity issues, software crash can cause delay in rare cases.</p>
                  <p>So, keep a fair amount of buffer time for your deliveries, and stock up your prints before out of stock, ensuring no stress and happy dealings.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">7. DAMAGE OR DEFECT TERMS</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Weaving defects are common in natural fabrics like blob of fabric pile out of the weave or a pull in the thread of the weave, these are common and universally acceptable.</p>
                  <p>We try to control any damage during print, but there can be human errors, for which 5% of damage in total order, for any order above 10 meters of the same fabric is acceptable in textile industry, beyond that its subjected to scrutiny and applicable for reprint/refund only for that meters. (Note: Damages have nothing to do with design or shades.)</p>
                  <p>Damage issue will be considered valid only when its reported within 24 hours of delivery, proper videos of proof attached. We can ask for a video call during validation as well.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">8. WASH INSTRUCTIONS</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>Normally digitally printed fabrics can be machine washed.</p>
                  <p>Incase of expensive fabrics that are hand washed, care should be taken to rinse and spin dry the cloth before putting on the drying stand, ensuring there is no dripping water or soap left.</p>
                  <p>We are not responsible for any harsh detergents / bleaching agents/ harsh perfumes /corrosive seawates.</p>
                  <p>Soaking is strictly prohibited.</p>
                  <p>Certain fabrics can have an inherent property of bleeding for a few washes, but the colour will not stick to the cloth if dried properly.</p>
                  <p>The stitching of these fabrics should follow a general norm of stitching garments keeping in mind when they wash, they can shrink a bit as garment, especially when its cotton, linens, or modal, to avoid awkward garment lengths.</p>
                </div>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">9. GENERAL TERMS</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>We have no factory visits, as we have ID cards issued for people who can only enter the factory for security reasons.</p>
                  <p>People who want to send their fabrics to factory for print, need to label the fabrics correctly with name, amount of meters and the composition, to avoid confusion and misplacement, also share the tracking to help us receive them correctly.</p>
                  <p>Remember even the customer fabrics are prone to shrinkage, so send fabrics accordingly. We will share an account of left over fabric after print to help you track your fabric.</p>
                </div>
              </div>

              <div className="bg-muted p-6 rounded-lg mt-8">
                <h3 className="font-cursive text-2xl mb-4">OUR PROMISE</h3>
                <p className="text-muted-foreground">
                  WE ENSURE USING STANDARD AZO-FREE DYES, STANDARD QUALITY OF FABRICS AND SAME EXACT FILES AS WE SHOW FOR PRINTING THAT WE DO EACH TIME, LEAVING ZERO ROOM FOR NEGLIGENCE.
                </p>
                <p className="text-muted-foreground mt-4">
                  THE SIGNATURE BELOW ENSURES UNDERSTANDING OF WORKING BETWEEN BOTH THE PARTIES
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
