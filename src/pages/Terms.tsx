import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const Terms = () => (
  <Layout>
    <section className="bg-secondary/30 py-16"><div className="container-custom text-center"><ScrollReveal><h1 className="font-serif text-4xl md:text-5xl">Terms & Conditions</h1></ScrollReveal></div></section>
    <section className="section-padding"><div className="container-custom max-w-3xl prose prose-lg"><ScrollReveal>
      <p className="text-muted-foreground">Last updated: January 2024</p>
      <h2 className="font-serif">1. Agreement to Terms</h2><p className="text-muted-foreground">By accessing our website, you agree to be bound by these terms of service and all applicable laws and regulations.</p>
      <h2 className="font-serif">2. Use License</h2><p className="text-muted-foreground">Permission is granted to temporarily download materials for personal, non-commercial transitory viewing only.</p>
      <h2 className="font-serif">3. Product Information</h2><p className="text-muted-foreground">We strive to display accurate product colors and information. However, we cannot guarantee that your monitor's display will be accurate.</p>
      <h2 className="font-serif">4. Pricing</h2><p className="text-muted-foreground">All prices are subject to change without notice. We reserve the right to modify or discontinue products without liability.</p>
      <h2 className="font-serif">5. Limitation of Liability</h2><p className="text-muted-foreground">Florelia shall not be liable for any damages arising from the use or inability to use our products or services.</p>
    </ScrollReveal></div></section>
  </Layout>
);

export default Terms;
