import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const About = () => (
  <Layout>
    {/* Hero */}
    <section className="w-full bg-secondary/30 py-20 lg:py-28">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 text-center">
        <ScrollReveal>
          <span className="text-primary uppercase tracking-[0.2em] text-sm font-medium">Our Story</span>
          <h1 className="font-cursive text-5xl md:text-6xl lg:text-7xl mt-4 mb-6">About Studio Sara</h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Crafting beautiful floral-inspired designs since 2018. We bring traditional artistry together with modern aesthetics.
          </p>
        </ScrollReveal>
      </div>
    </section>

    {/* Story Section */}
    <section className="w-full py-14 lg:py-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <ScrollReveal direction="left">
            <img 
              src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=1000&fit=crop" 
              alt="Our studio" 
              className="rounded-2xl shadow-medium w-full" 
            />
          </ScrollReveal>
          <ScrollReveal direction="right">
            <div className="space-y-8">
              <h2 className="font-cursive text-4xl lg:text-5xl">Our Journey</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Founded with a passion for nature's beauty, Studio Sara brings the elegance of botanical designs into everyday life. Each piece is thoughtfully crafted to celebrate the timeless appeal of floral patterns.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our artisans combine traditional techniques with modern aesthetics to create unique textiles and prints that transform any space. We believe in sustainable practices and quality craftsmanship that stands the test of time.
              </p>
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
                <div className="text-center">
                  <span className="block font-cursive text-4xl lg:text-5xl text-primary">500+</span>
                  <span className="text-base text-muted-foreground mt-2 block">Designs</span>
                </div>
                <div className="text-center">
                  <span className="block font-cursive text-4xl lg:text-5xl text-primary">50k+</span>
                  <span className="text-base text-muted-foreground mt-2 block">Customers</span>
                </div>
                <div className="text-center">
                  <span className="block font-cursive text-4xl lg:text-5xl text-primary">6+</span>
                  <span className="text-base text-muted-foreground mt-2 block">Years</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>

    {/* Values Section */}
    <section className="w-full py-14 lg:py-24 bg-muted">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="text-center mb-14">
          <ScrollReveal>
            <span className="text-primary uppercase tracking-[0.2em] text-sm font-medium">What We Stand For</span>
            <h2 className="font-cursive text-4xl lg:text-5xl mt-4">Our Values</h2>
          </ScrollReveal>
        </div>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {[
            { title: 'Quality Craftsmanship', desc: 'Every piece is handcrafted with attention to detail using premium materials.' },
            { title: 'Sustainable Practices', desc: 'We are committed to eco-friendly production and sustainable sourcing.' },
            { title: 'Customer First', desc: 'Your satisfaction is our priority. We ensure a delightful experience.' },
          ].map((value, i) => (
            <ScrollReveal key={value.title} delay={i * 0.1}>
              <div className="text-center p-8 lg:p-10 bg-white rounded-2xl border border-border">
                <h3 className="font-cursive text-2xl lg:text-3xl mb-4">{value.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed">{value.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export default About;
