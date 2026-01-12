import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const Contact = () => (
  <Layout>
    <section className="bg-secondary/30 py-16 md:py-24">
      <div className="container-custom text-center">
        <ScrollReveal><h1 className="font-serif text-4xl md:text-5xl mb-4">Get in Touch</h1><p className="text-muted-foreground max-w-2xl mx-auto">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p></ScrollReveal>
      </div>
    </section>
    <section className="section-padding">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12">
          <ScrollReveal direction="left">
            <div className="space-y-8">
              <div><h2 className="font-serif text-2xl mb-6">Contact Information</h2><div className="space-y-4">
                {[{ icon: Mail, title: 'Email', text: 'hello@florelia.com' },{ icon: Phone, title: 'Phone', text: '+1 (234) 567-890' },{ icon: MapPin, title: 'Address', text: '123 Floral Street, Garden City, GC 12345' },{ icon: Clock, title: 'Hours', text: 'Mon-Fri: 9AM-6PM' }].map(item => (
                  <div key={item.title} className="flex gap-4"><div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><item.icon className="w-5 h-5 text-primary" /></div><div><h4 className="font-medium">{item.title}</h4><p className="text-muted-foreground">{item.text}</p></div></div>
                ))}
              </div></div>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right">
            <div className="bg-card p-6 md:p-8 rounded-2xl border border-border">
              <h3 className="font-serif text-xl mb-6">Send us a Message</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4"><Input placeholder="First name" /><Input placeholder="Last name" /></div>
                <Input placeholder="Email" type="email" /><Input placeholder="Subject" />
                <Textarea placeholder="Your message" rows={5} />
                <Button className="w-full btn-primary">Send Message</Button>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  </Layout>
);

export default Contact;
