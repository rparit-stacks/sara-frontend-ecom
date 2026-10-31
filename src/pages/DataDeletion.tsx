import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const DataDeletion = () => {
  useEffect(() => {
    document.title = 'Delete Your Data - Studio Sara';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'How to ask Studio Sara to delete your personal data, including your WhatsApp number and messages.');
    }
  }, []);

  return (
    <Layout>
      <section className="bg-secondary/30 py-16">
        <div className="container-custom text-center">
          <ScrollReveal>
            <h1 className="font-cursive text-4xl md:text-5xl">Delete Your Data</h1>
            <p className="text-muted-foreground mt-4">How to ask us to remove your information</p>
          </ScrollReveal>
        </div>
      </section>
      <section className="section-padding">
        <div className="container-custom max-w-3xl prose prose-lg">
          <ScrollReveal>
            <div className="space-y-8">
              <div>
                <h2 className="font-cursive text-3xl mb-4">How to request deletion</h2>
                <p className="text-muted-foreground">
                  Send an email to <a href="mailto:noreply@studiosara.in" className="text-primary hover:underline">noreply@studiosara.in</a> with the subject "Delete my data". Write from the email address on your Studio Sara account, and include the phone number you use on WhatsApp so that we can find your records.
                </p>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">What we delete</h2>
                <p className="text-muted-foreground">
                  We delete your account details, your saved addresses, your WhatsApp number, and the WhatsApp messages and replies we hold for you. We may keep information that the law requires us to keep, such as invoices and records of paid orders, and we will tell you what we kept and why.
                </p>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">How long it takes</h2>
                <p className="text-muted-foreground">
                  We confirm your request by email and complete the deletion within 30 days.
                </p>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">Stop WhatsApp messages only</h2>
                <p className="text-muted-foreground">
                  If you only want to stop receiving WhatsApp messages from us, reply STOP to any message. We stop messaging you straight away.
                </p>
              </div>

              <div>
                <h2 className="font-cursive text-3xl mb-4">More information</h2>
                <p className="text-muted-foreground">
                  Read how we handle your information in our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default DataDeletion;
