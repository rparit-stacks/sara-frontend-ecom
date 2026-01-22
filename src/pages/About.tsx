import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const About = () => {
  useEffect(() => {
    document.title = 'About Us - Studio Sara | Custom Prints & Embroidery Design Studio';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Studio Sara is a print and embroidery design studio built on passion, precision, and purpose. Inspired by Indian crafts, we create contemporary prints and embroideries with custom development starting at just 2 MOQs.');
    }
  }, []);

  return (
  <Layout>

    {/* Hero */}
    <section className="w-full bg-secondary/30 py-20 lg:py-28">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 text-center">
        <ScrollReveal>
          <span className="text-primary uppercase tracking-[0.2em] text-sm font-medium">Our Story</span>
          <h1 className="font-cursive text-5xl md:text-6xl lg:text-7xl mt-4 mb-6">About Studio Sara</h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Custom prints and embroidery, crafted with intention.
          </p>
        </ScrollReveal>
      </div>
    </section>

    {/* Main Content */}
    <section className="w-full py-14 lg:py-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <ScrollReveal>
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Studio Sara is a print and embroidery design studio built on passion, precision, and purpose. Inspired by Indian crafts, artisanal techniques, and cultural narratives, we create contemporary prints and embroideries that feel timeless yet relevant. Every motif is thoughtfully developed—guided by mood, fabric, and the story a brand wants to tell.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              At Studio Sara, surface design is not an afterthought. It is the foundation of a brand's identity.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>

    {/* Our Beginning */}
    <section className="w-full py-14 lg:py-24 bg-muted">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <ScrollReveal>
          <h2 className="font-cursive text-4xl lg:text-5xl mb-6">Our Beginning</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Studio Sara was shaped by lived experience. As a fashion designer, sourcing the right prints and embroideries was always a challenge. Ready-made designs lacked originality, while custom development demanded high minimums. Testing a new idea often meant producing in bulk—leading to financial risk, unsold stock, and creative compromise.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              That challenge became our purpose. Studio Sara was created to make custom prints and embroidery accessible, flexible, and brand-friendly—especially for emerging fashion labels.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>

    {/* What We Do Differently */}
    <section className="w-full py-14 lg:py-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <ScrollReveal>
          <h2 className="font-cursive text-4xl lg:text-5xl mb-6">What We Do Differently</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              We enable brands to create intentionally and scale confidently.
            </p>
            <ul className="space-y-4 text-lg text-muted-foreground">
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span>Custom print development starting at just <strong>2 MOQs</strong>, allowing brands to test the market before scaling</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span>Custom embroidery development with a minimum of <strong>10 meters</strong>, ideal for refined detailing and premium finishes</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span>Design inspiration rooted in Indian craftsmanship with a modern, wearable sensibility</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span>Use of pure, high-quality fabrics, chosen for feel, durability, and finish</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span>Cost-effective design solutions without compromising on aesthetics or quality</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">•</span>
                <span>Seamless customer service with clear communication and dedicated support</span>
              </li>
            </ul>
            <p className="text-lg text-muted-foreground leading-relaxed mt-6">
              From concept to production, every project is handled with care, clarity, and attention to detail—ensuring a smooth and reliable experience for our clients.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>

    {/* Our Philosophy */}
    <section className="w-full py-14 lg:py-24 bg-muted">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <ScrollReveal>
          <h2 className="font-cursive text-4xl lg:text-5xl mb-6">Our Philosophy</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              We believe strong brands are built thoughtfully, not hurriedly. By reducing risk, encouraging experimentation, and prioritising originality, we help designers create collections that are both distinctive and commercially viable.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Studio Sara exists to support brands that value craftsmanship, design depth, and smart production decisions. Whether you are launching your first collection or refining an established identity, Studio Sara partners with you to bring your vision to life—beautifully and responsibly.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>

    {/* Tagline */}
    <section className="w-full py-14 lg:py-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <ScrollReveal>
          <p className="font-cursive text-3xl lg:text-4xl text-primary">
            Studio Sara
          </p>
          <p className="text-xl text-muted-foreground mt-4">
            Custom prints and embroidery, crafted with intention.
          </p>
        </ScrollReveal>
      </div>
    </section>
  </Layout>
  );
};

export default About;
