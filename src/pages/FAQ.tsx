import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: 'How long does shipping take?', a: 'Standard shipping takes 5-7 business days. Express shipping is available for 2-3 day delivery.' },
  { q: 'What is your return policy?', a: 'We offer 30-day returns for unused items in original packaging. See our Refund Policy for details.' },
  { q: 'Do you ship internationally?', a: 'Yes! We ship to over 50 countries worldwide. Shipping costs vary by location.' },
  { q: 'How do I track my order?', a: 'Once shipped, you\'ll receive a tracking number via email to monitor your delivery.' },
  { q: 'Can I customize products?', a: 'Yes! Visit our Customize page to create personalized designs with your choice of fabrics and patterns.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, Apple Pay, and Google Pay.' },
];

const FAQ = () => (
  <Layout>
    <section className="bg-secondary/30 py-16 md:py-24">
      <div className="container-custom text-center"><ScrollReveal><h1 className="font-serif text-4xl md:text-5xl mb-4">Frequently Asked Questions</h1><p className="text-muted-foreground">Find answers to common questions about our products and services.</p></ScrollReveal></div>
    </section>
    <section className="section-padding">
      <div className="container-custom max-w-3xl">
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <AccordionItem value={`item-${i}`} className="bg-card border border-border rounded-xl px-6">
                <AccordionTrigger className="text-left font-serif">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            </ScrollReveal>
          ))}
        </Accordion>
      </div>
    </section>
  </Layout>
);

export default FAQ;
