import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const Privacy = () => (
  <Layout>
    <section className="bg-secondary/30 py-16"><div className="container-custom text-center"><ScrollReveal><h1 className="font-serif text-4xl md:text-5xl">Privacy Policy</h1></ScrollReveal></div></section>
    <section className="section-padding"><div className="container-custom max-w-3xl prose prose-lg"><ScrollReveal>
      <p className="text-muted-foreground">Last updated: January 2024</p>
      <h2 className="font-serif">Information We Collect</h2><p className="text-muted-foreground">We collect information you provide directly, such as name, email, and shipping address when you make a purchase.</p>
      <h2 className="font-serif">How We Use Your Information</h2><p className="text-muted-foreground">We use your information to process orders, communicate with you, and improve our services.</p>
      <h2 className="font-serif">Information Sharing</h2><p className="text-muted-foreground">We do not sell your personal information. We may share it with service providers who assist in our operations.</p>
      <h2 className="font-serif">Security</h2><p className="text-muted-foreground">We implement security measures to protect your personal information from unauthorized access.</p>
      <h2 className="font-serif">Contact Us</h2><p className="text-muted-foreground">For privacy concerns, contact us at privacy@florelia.com</p>
    </ScrollReveal></div></section>
  </Layout>
);

export default Privacy;
