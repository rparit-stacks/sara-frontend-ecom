import { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { toast } from 'sonner';

const steps = [
  {
    number: '01',
    title: 'Submit Your Request',
    description: 'Fill out our simple form with your design requirements and ideas.',
    icon: 'fa-paper-plane',
  },
  {
    number: '02',
    title: 'We Review & Contact',
    description: 'Our design team reviews your request and reaches out to discuss details.',
    icon: 'fa-comments',
  },
  {
    number: '03',
    title: 'Design & Delivery',
    description: 'We create your custom design and deliver it to you with revisions included.',
    icon: 'fa-gift',
  },
];

const specialties = [
  {
    title: 'Fabric Prints',
    description: 'Beautiful, unique fabric patterns for clothing and home textiles.',
    icon: 'fa-shirt',
  },
  {
    title: 'Custom Illustrations',
    description: 'Hand-crafted digital illustrations tailored to your vision.',
    icon: 'fa-pen-nib',
  },
  {
    title: 'Pattern Design',
    description: 'Seamless patterns perfect for any application or surface.',
    icon: 'fa-border-all',
  },
  {
    title: 'Personalized Artwork',
    description: 'One-of-a-kind art pieces created just for you.',
    icon: 'fa-palette',
  },
];

const whyChooseUs = [
  {
    title: 'Handcrafted Designs',
    description: 'Every design is carefully crafted by our expert artists.',
    icon: 'fa-hand-sparkles',
  },
  {
    title: 'Professional Designers',
    description: 'Work with experienced professionals who understand your needs.',
    icon: 'fa-user-tie',
  },
  {
    title: 'Custom-Made',
    description: 'Every piece is uniquely created as per your requirements.',
    icon: 'fa-wand-magic-sparkles',
  },
  {
    title: 'Quick Support',
    description: 'Fast response times and dedicated customer support.',
    icon: 'fa-headset',
  },
];

const CustomDesign = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    designType: '',
    description: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success('Request submitted successfully!');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout>
      {/* Hero Section with Flower Images */}
      <section className="relative min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-pink-100 via-pink-50 to-white">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a45a' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Left Flower - Desktop */}
        <motion.div 
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute left-0 top-1/2 -translate-y-1/2 hidden lg:block z-10 pointer-events-none"
        >
          <img 
            src="/hero_trans/left.png" 
            alt="Decorative flower left" 
            className="w-[280px] xl:w-[350px] 2xl:w-[400px] h-auto object-contain -ml-10"
          />
        </motion.div>

        {/* Right Flower - Desktop */}
        <motion.div 
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block z-10 pointer-events-none"
        >
          <img 
            src="/hero_trans/right.png" 
            alt="Decorative flower right" 
            className="w-[280px] xl:w-[350px] 2xl:w-[400px] h-auto object-contain -mr-10"
          />
        </motion.div>

        {/* Mobile Flowers */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute top-4 left-0 lg:hidden z-10 pointer-events-none"
        >
          <img 
            src="/hero_trans/left.png" 
            alt="Decorative flower" 
            className="w-[100px] sm:w-[130px] h-auto object-contain -ml-4"
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="absolute bottom-8 right-0 lg:hidden z-10 pointer-events-none"
        >
          <img 
            src="/hero_trans/right.png" 
            alt="Decorative flower" 
            className="w-[100px] sm:w-[130px] h-auto object-contain -mr-4"
          />
        </motion.div>

        {/* Center Content */}
        <div className="relative z-20 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-lg"
          >
            <h1 className="font-cursive text-4xl md:text-5xl lg:text-6xl text-primary mb-4">
              Welcome
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-foreground font-medium mb-2">
              to the World of Exquisite
            </p>
            <p className="text-lg md:text-xl lg:text-2xl text-foreground font-medium mb-6">
              Prints and Illustrations
            </p>
            <Button 
              className="btn-primary px-8 py-6 text-base md:text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
              onClick={() => document.getElementById('design-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <i className="fa-solid fa-palette mr-2"></i>
              Request a Custom Design
            </Button>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="font-cursive text-3xl md:text-4xl text-primary mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Getting your custom design is simple and straightforward
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <div className="relative text-center p-8 rounded-2xl bg-gradient-to-b from-pink-50 to-white border border-pink-100 hover:shadow-lg transition-shadow">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                    {step.number}
                  </div>
                  <div className="mt-4 mb-4">
                    <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                      <i className={`fa-solid ${step.icon} text-2xl text-accent`}></i>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Design Request Form Section */}
      <section id="design-form" className="py-16 md:py-24 bg-gradient-to-b from-pink-50 to-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent/5 rounded-full translate-x-1/2 translate-y-1/2"></div>

        <div className="container-custom relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="font-cursive text-3xl md:text-4xl text-primary mb-4">Request Your Design</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Tell us about your vision and we'll bring it to life
              </p>
            </div>
          </ScrollReveal>

          <div className="max-w-2xl mx-auto">
            {isSubmitted ? (
              <ScrollReveal>
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center p-12 bg-white rounded-2xl shadow-lg border border-pink-100"
                >
                  <div className="w-20 h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-6">
                    <i className="fa-solid fa-check text-3xl text-accent"></i>
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-4">Thanks for Your Request!</h3>
                  <p className="text-muted-foreground mb-6">
                    Our team will personally connect with you shortly to discuss your design requirements.
                  </p>
                  <Button 
                    variant="outline" 
                    className="rounded-full"
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({ fullName: '', email: '', phone: '', designType: '', description: '' });
                    }}
                  >
                    Submit Another Request
                  </Button>
                </motion.div>
              </ScrollReveal>
            ) : (
              <ScrollReveal>
                <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-2xl shadow-lg border border-pink-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <Label htmlFor="fullName" className="text-foreground font-medium mb-2 block">
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        required
                        className="rounded-lg border-pink-200 focus:border-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-foreground font-medium mb-2 block">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="rounded-lg border-pink-200 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <Label htmlFor="phone" className="text-foreground font-medium mb-2 block">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                        className="rounded-lg border-pink-200 focus:border-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="designType" className="text-foreground font-medium mb-2 block">
                        Type of Design *
                      </Label>
                      <Select 
                        value={formData.designType} 
                        onValueChange={(value) => handleInputChange('designType', value)}
                        required
                      >
                        <SelectTrigger className="rounded-lg border-pink-200 focus:border-primary">
                          <SelectValue placeholder="Select design type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fabric-print">Fabric Print</SelectItem>
                          <SelectItem value="illustration">Illustration</SelectItem>
                          <SelectItem value="logo">Logo Design</SelectItem>
                          <SelectItem value="pattern">Pattern Design</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mb-6">
                    <Label htmlFor="description" className="text-foreground font-medium mb-2 block">
                      Describe Your Design *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Tell us about your design requirements, style preferences, colors, and any specific details..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      required
                      rows={5}
                      className="rounded-lg border-pink-200 focus:border-primary resize-none"
                    />
                  </div>

                  <div className="mb-6">
                    <Label className="text-foreground font-medium mb-2 block">
                      Reference Image (Optional)
                    </Label>
                    <div className="border-2 border-dashed border-pink-200 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                      <i className="fa-solid fa-cloud-upload text-3xl text-muted-foreground mb-2"></i>
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 10MB
                      </p>
                      <input type="file" className="hidden" accept="image/*" />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full btn-primary py-6 text-lg rounded-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane mr-2"></i>
                        Submit Request
                      </>
                    )}
                  </Button>
                </form>
              </ScrollReveal>
            )}
          </div>
        </div>
      </section>

      {/* Design Specialties Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="font-cursive text-3xl md:text-4xl text-primary mb-4">Our Design Specialties</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                We specialize in creating beautiful, custom designs across various categories
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialties.map((specialty, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <div className="group p-6 rounded-2xl bg-gradient-to-b from-pink-50 to-white border border-pink-100 hover:shadow-lg hover:border-primary/30 transition-all text-center">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <i className={`fa-solid ${specialty.icon} text-2xl text-primary`}></i>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{specialty.title}</h3>
                  <p className="text-sm text-muted-foreground">{specialty.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-pink-50 to-white">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="font-cursive text-3xl md:text-4xl text-primary mb-4">Why Choose Us</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                We're committed to delivering exceptional design experiences
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((item, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <div className="group p-6 rounded-2xl bg-white border border-pink-100 hover:shadow-lg transition-all text-center">
                  <div className="w-14 h-14 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <i className={`fa-solid ${item.icon} text-xl text-accent`}></i>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/90 to-primary relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute bottom-0 right-10 w-60 h-60 bg-white rounded-full"></div>
        </div>

        <div className="container-custom relative z-10 text-center">
          <ScrollReveal>
            <h2 className="font-cursive text-3xl md:text-4xl lg:text-5xl text-white mb-4">
              Ready to Create Something Beautiful?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
              Let's bring your creative vision to life. Our team is ready to help you create stunning designs.
            </p>
            <Button 
              className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
              onClick={() => document.getElementById('design-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <i className="fa-solid fa-sparkles mr-2"></i>
              Request Your Design Now
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default CustomDesign;
