import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const Contact = () => (
  <Layout>
    {/* Hero */}
    <section className="w-full bg-secondary/30 py-20 lg:py-28">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 text-center">
        <ScrollReveal>
          <span className="text-primary uppercase tracking-[0.2em] text-sm font-medium">Get In Touch</span>
          <h1 className="font-cursive text-5xl md:text-6xl lg:text-7xl mt-4 mb-6">Contact Us</h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </ScrollReveal>
      </div>
    </section>

    {/* Contact Section */}
    <section className="w-full py-14 lg:py-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          <ScrollReveal direction="left">
            <div className="space-y-10">
              <div>
                <h2 className="font-cursive text-3xl lg:text-4xl mb-8">Contact Information</h2>
                <div className="space-y-6">
                  {[
                    { icon: Mail, title: 'Email', text: 'hello@studiosara.in' },
                    { icon: Phone, title: 'Phone', text: '+91 98765 43210' },
                    { icon: MapPin, title: 'Address', text: '123 Fashion Street, Mumbai, MH 400001' },
                    { icon: Clock, title: 'Hours', text: 'Mon-Sat: 10AM-7PM' },
                  ].map(item => (
                    <div key={item.title} className="flex gap-5">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-lg">{item.title}</h4>
                        <p className="text-muted-foreground text-base">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="bg-card p-8 lg:p-10 rounded-2xl border border-border">
              <h3 className="font-cursive text-2xl lg:text-3xl mb-8">Send us a Message</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <Input placeholder="First name" className="h-12" />
                  <Input placeholder="Last name" className="h-12" />
                </div>
                <Input placeholder="Email" type="email" className="h-12" />
                <Input placeholder="Subject" className="h-12" />
                <Textarea placeholder="Your message" rows={6} className="resize-none" />
                <Button className="w-full btn-primary h-14 text-base">Send Message</Button>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  </Layout>
);

export default Contact;
