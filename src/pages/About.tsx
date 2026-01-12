import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const About = () => (
  <Layout>
    <section className="bg-secondary/30 py-16 md:py-24">
      <div className="container-custom text-center"><ScrollReveal><h1 className="font-serif text-4xl md:text-5xl mb-4">About Florelia</h1><p className="text-muted-foreground max-w-2xl mx-auto">Crafting beautiful floral-inspired designs since 2018</p></ScrollReveal></div>
    </section>
    <section className="section-padding">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal direction="left">
            <img src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=700&fit=crop" alt="Our studio" className="rounded-2xl shadow-medium" />
          </ScrollReveal>
          <ScrollReveal direction="right">
            <div className="space-y-6">
              <h2 className="font-serif text-3xl">Our Story</h2>
              <p className="text-muted-foreground">Founded with a passion for nature's beauty, Florelia brings the elegance of botanical designs into everyday life. Each piece is thoughtfully crafted to celebrate the timeless appeal of floral patterns.</p>
              <p className="text-muted-foreground">Our artisans combine traditional techniques with modern aesthetics to create unique textiles and prints that transform any space. We believe in sustainable practices and quality craftsmanship that stands the test of time.</p>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center"><span className="block font-serif text-3xl text-primary">500+</span><span className="text-sm text-muted-foreground">Designs</span></div>
                <div className="text-center"><span className="block font-serif text-3xl text-primary">10k+</span><span className="text-sm text-muted-foreground">Customers</span></div>
                <div className="text-center"><span className="block font-serif text-3xl text-primary">6+</span><span className="text-sm text-muted-foreground">Years</span></div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  </Layout>
);

export default About;
