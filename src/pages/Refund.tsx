import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const Refund = () => (
  <Layout>
    <section className="bg-secondary/30 py-16"><div className="container-custom text-center"><ScrollReveal><h1 className="font-serif text-4xl md:text-5xl">Refund Policy</h1></ScrollReveal></div></section>
    <section className="section-padding"><div className="container-custom max-w-3xl prose prose-lg"><ScrollReveal>
      <p className="text-muted-foreground">Last updated: January 2024</p>
      <h2 className="font-serif">30-Day Return Policy</h2><p className="text-muted-foreground">We offer a 30-day return policy for all unused items in their original packaging.</p>
      <h2 className="font-serif">Eligibility</h2><p className="text-muted-foreground">Items must be unworn, unwashed, and have all original tags attached. Custom orders are non-refundable.</p>
      <h2 className="font-serif">Process</h2><p className="text-muted-foreground">To initiate a return, email us at returns@florelia.com with your order number and reason for return.</p>
      <h2 className="font-serif">Refund Timeline</h2><p className="text-muted-foreground">Once received, refunds are processed within 5-7 business days to your original payment method.</p>
      <h2 className="font-serif">Exchanges</h2><p className="text-muted-foreground">We offer free exchanges for different sizes or colors, subject to availability.</p>
    </ScrollReveal></div></section>
  </Layout>
);

export default Refund;
