import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { faqApi } from '@/lib/api';

// Fallback FAQs for when API is not available
const fallbackFaqs = [
  { question: 'How long does shipping take?', answer: 'Standard shipping takes 5-7 business days. Express shipping is available for 2-3 day delivery.', category: 'Shipping' },
  { question: 'What is your shipping policy?', answer: 'We use reliable courier services (Trackon and PNS) for shipping all over India. Air shipping with 2-3 days delivery time. See our Shipping Policy for details.', category: 'Shipping' },
  { question: 'Do you ship internationally?', answer: 'Yes! We ship to over 50 countries worldwide. Shipping costs vary by location.', category: 'Shipping' },
  { question: 'How do I track my order?', answer: 'Once shipped, you\'ll receive a tracking number via email to monitor your delivery.', category: 'Shipping' },
  { question: 'Can I customize products?', answer: 'Yes! Visit our Customize page to create personalized designs with your choice of fabrics and patterns.', category: 'Customization' },
  { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, PayPal, Apple Pay, and Google Pay.', category: 'Payment' },
];

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: faqs = fallbackFaqs, isLoading } = useQuery({
    queryKey: ['faqs', selectedCategory],
    queryFn: () => faqApi.getAll(selectedCategory || undefined),
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['faq-categories'],
    queryFn: () => faqApi.getCategories(),
  });

  // Filter FAQs by search query
  const filteredFaqs = faqs.filter((faq: any) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Group FAQs by category for better display
  const faqsByCategory = filteredFaqs.reduce((acc: any, faq: any) => {
    const category = faq.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {});

  const allCategories = ['All', ...categories];
  if (categories.length === 0) {
    allCategories.push(...['Shipping', 'Returns', 'Payment', 'Customization', 'Products', 'General']);
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <section className="w-full bg-secondary/30 py-5">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <nav className="flex items-center text-sm text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0" />
            <span className="text-foreground">FAQ</span>
          </nav>
        </div>
      </section>

      <section className="bg-secondary/30 py-16 md:py-24">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 text-center">
          <ScrollReveal>
            <h1 className="font-semibold text-4xl md:text-5xl lg:text-6xl mb-4 font-sans">Frequently Asked Questions</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find answers to common questions about our products and services.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          {/* Search & Categories */}
          <div className="max-w-4xl mx-auto space-y-6 mb-12">
            <div className="relative">
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 text-base pl-12"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {allCategories.map((cat) => (
                <Button
                  key={cat}
                  variant={(!selectedCategory && cat === 'All') || selectedCategory === cat ? 'default' : 'outline'}
                  className="rounded-full"
                  onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">No FAQs found matching your search.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.keys(faqsByCategory).map((category, categoryIndex) => (
                  <div key={category}>
                    {Object.keys(faqsByCategory).length > 1 && (
                      <h2 className="font-semibold text-2xl md:text-3xl mb-6 text-center font-sans">
                        {category}
                      </h2>
                    )}
                    <Accordion type="single" collapsible className="space-y-4">
                      {faqsByCategory[category].map((faq: any, i: number) => (
                        <ScrollReveal key={faq.id || i} delay={(categoryIndex * 0.1) + (i * 0.05)}>
                          <AccordionItem value={`item-${faq.id || i}`} className="bg-card border border-border rounded-xl px-6">
                            <AccordionTrigger className="text-left font-semibold text-base md:text-lg font-sans not-italic">
                              {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed font-sans not-italic">
                              <div 
                                dangerouslySetInnerHTML={{ 
                                  __html: (faq.answer || '')
                                    .replace(/&lt;p&gt;/g, '')
                                    .replace(/&lt;\/p&gt;/g, '')
                                    .replace(/<p>/g, '')
                                    .replace(/<\/p>/g, '<br />')
                                }}
                                style={{ fontFamily: 'inherit' }}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </ScrollReveal>
                      ))}
                    </Accordion>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FAQ;
