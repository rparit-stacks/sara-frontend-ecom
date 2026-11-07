import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';

const sections: Array<[string, string]> = [
  ['What you agree to', 'When you tick the marketing box on Studio Sara (when you sign up, log in, send a form, place an order or join the newsletter), you agree that we may send you offers, announcements, new collections and other promotional messages by email and on WhatsApp. This is separate from the messages we must send about your account and orders, such as login codes and order updates.'],
  ['What we send', 'Promotional messages about our products, collections, sales and events. We do not sell your contact details to anyone.'],
  ['How we use your details', 'We keep your email, your WhatsApp number, your name, where and when you agreed, and the version of these terms you agreed to. We use them only to send you these messages and to show that you agreed. Messages go out through the WhatsApp Business Platform provided by Meta and through our email service.'],
  ['Saying no is fine', 'Ticking the box is your choice and never a condition for buying or using the site. The box is never ticked for you.'],
  ['How to unsubscribe', 'Every email has an Unsubscribe link. Click it and confirm, and we stop emailing and messaging you on WhatsApp. You can also reply STOP to any WhatsApp message. We act on it straight away. We keep a note that you unsubscribed so you are not added again by mistake.'],
  ['Changes', 'If we change these terms in a way that matters, we will ask you to agree again. This page shows the current version.'],
  ['Contact', 'Questions about these terms or your data: noreply@studiosara.in, or use the contact page.'],
];

const MarketingTerms = () => {
  useEffect(() => {
    document.title = 'Marketing Terms - Studio Sara';
  }, []);

  return (
    <Layout>
      <section className="bg-secondary/30 py-16">
        <div className="container-custom text-center">
          <ScrollReveal>
            <h1 className="font-cursive text-4xl md:text-5xl">Marketing Terms</h1>
            <p className="text-muted-foreground mt-4">Offers and updates by email and WhatsApp</p>
          </ScrollReveal>
        </div>
      </section>
      <section className="section-padding">
        <div className="container-custom max-w-3xl">
          <ScrollReveal>
            <p className="text-muted-foreground mb-8">Version 1</p>
            <div className="space-y-8">
              {sections.map(([title, body]) => (
                <div key={title}>
                  <h2 className="font-cursive text-3xl mb-4">{title}</h2>
                  <p className="text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default MarketingTerms;
