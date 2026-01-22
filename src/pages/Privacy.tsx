import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const Privacy = () => {
  useEffect(() => {
    document.title = 'Privacy Policy - Studio Sara | Data Protection & Privacy';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Studio Sara Privacy Policy. Learn how we collect, use, and protect your personal information. We are committed to protecting your privacy and data security.');
    }
  }, []);

  return (
    <Layout>
      <section className="bg-secondary/30 py-16">
        <div className="container-custom text-center">
          <ScrollReveal>
            <h1 className="font-cursive text-4xl md:text-5xl">Privacy Policy</h1>
            <p className="text-muted-foreground mt-4">How We Protect Your Information</p>
          </ScrollReveal>
        </div>
      </section>
      <section className="section-padding">
        <div className="container-custom max-w-3xl prose prose-lg">
          <ScrollReveal>
            <p className="text-muted-foreground mb-8">Last updated: {new Date().getFullYear()}</p>
            
            <div className="space-y-8">
              <div>
                <h2 className="font-cursive text-3xl mb-4">Information We Collect</h2>
                <p className="text-muted-foreground">
                  We collect information you provide directly, such as name, email, shipping address, phone number, and payment information when you make a purchase or contact us. We also collect information about your device and browsing behavior when you visit our website.
                </p>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">How We Use Your Information</h2>
                <p className="text-muted-foreground">
                  We use your information to process orders, communicate with you about your orders, send you updates about our products and services, improve our website and services, and comply with legal obligations.
                </p>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Information Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell your personal information. We may share it with trusted service providers who assist in our operations (such as payment processors, shipping companies, and email service providers) under strict confidentiality agreements. We may also share information if required by law or to protect our rights.
                </p>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Data Security</h2>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Your Rights</h2>
                <p className="text-muted-foreground">
                  You have the right to access, update, or delete your personal information at any time. You can also opt-out of marketing communications by clicking the unsubscribe link in our emails or contacting us directly.
                </p>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Cookies</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to enhance your browsing experience, analyze website traffic, and personalize content. You can control cookies through your browser settings.
                </p>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Contact Us</h2>
                <p className="text-muted-foreground">
                  For privacy concerns or questions about this policy, please contact us through our <a href="/contact" className="text-primary hover:underline">contact page</a>.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
