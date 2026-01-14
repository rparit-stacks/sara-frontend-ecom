import { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import ScrollReveal from '@/components/animations/ScrollReveal';
import AnimatedWaveBackground from '@/components/animations/AnimatedWaveBackground';
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
      {/* Animated Wave Background */}
      <AnimatedWaveBackground />
      
      {/* Hero Section - Banner Style with Background Image & Flowers */}
      <section className="relative bg-white/80 backdrop-blur-sm py-6 sm:py-8 lg:py-12 overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-3 xs:px-4 sm:px-6 lg:px-12">
          {/* Banner with custom background image */}
          <div 
            className="relative w-full py-10 xs:py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 bg-[#f5b5b5] overflow-hidden"
            style={{
              backgroundImage: 'url(/bg_images/68fccd394db41a54b986a269033bf872%20copy.png)',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          >
            <div className="relative z-20 flex items-center justify-center px-2 xs:px-3 sm:px-4">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-white/95 backdrop-blur-sm p-4 xs:p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12 shadow-xl max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto text-center"
              >
                <motion.h1 
                  className="font-cursive text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-primary mb-2 xs:mb-3 md:mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  Welcome
                </motion.h1>
                <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-foreground font-medium mb-1">
                  to the World of Exquisite
                </p>
                <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-foreground font-medium mb-3 xs:mb-4 md:mb-6">
                  Prints and Illustrations
                </p>
                <Button 
                  variant="outline"
                  className="px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-2.5 sm:py-3 md:py-4 lg:py-5 text-[10px] xs:text-xs sm:text-sm md:text-base border-2 border-[#d4a84b] text-[#d4a84b] hover:bg-[#d4a84b] hover:text-white rounded-none uppercase tracking-wider font-medium transition-all w-full sm:w-auto"
                  onClick={() => document.getElementById('design-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <span className="truncate">Print & Illustration Library</span>
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Left Flower - Desktop - Extending outside pattern */}
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute left-0 top-1/2 -translate-y-1/2 hidden lg:block z-20 pointer-events-none"
            style={{ left: '-120px' }}
          >
            <img 
              src="/hero_trans/left.png" 
              alt="Decorative flower left" 
              className="w-[350px] xl:w-[420px] 2xl:w-[480px] h-auto object-contain max-w-none"
            />
          </motion.div>

          {/* Right Flower - Desktop - Extending outside pattern */}
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block z-20 pointer-events-none"
            style={{ right: '-120px' }}
          >
            <img 
              src="/hero_trans/right.png" 
              alt="Decorative flower right" 
              className="w-[350px] xl:w-[420px] 2xl:w-[480px] h-auto object-contain max-w-none"
            />
          </motion.div>

          {/* Mobile Flowers - Right on top, Left on bottom */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute -top-4 xs:-top-6 -right-2 xs:-right-4 lg:hidden z-20 pointer-events-none"
          >
            <img 
              src="/hero_trans/right.png" 
              alt="Decorative flower" 
              className="w-[80px] xs:w-[100px] sm:w-[120px] md:w-[160px] h-auto object-contain"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="absolute -bottom-4 xs:-bottom-6 -left-2 xs:-left-4 lg:hidden z-5 pointer-events-none"
          >
            <img 
              src="/hero_trans/left.png" 
              alt="Decorative flower" 
              className="w-[80px] xs:w-[100px] sm:w-[120px] md:w-[160px] h-auto object-contain"
            />
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-white/90 backdrop-blur-sm relative z-10">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-8 xs:mb-10 sm:mb-12">
              <motion.h2 
                className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-primary mb-3 xs:mb-4 px-2"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                How It Works
              </motion.h2>
              <p className="text-muted-foreground text-sm xs:text-base sm:text-lg max-w-xl mx-auto px-2">
                Getting your custom design is simple and straightforward
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xs:gap-6 sm:gap-8">
            {steps.map((step, index) => (
              <ScrollReveal key={index} delay={index * 0.15}>
                <motion.div 
                  className="relative text-center p-5 xs:p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-b from-warm to-white border border-primary/10 hover:shadow-xl transition-all duration-300"
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute -top-3 xs:-top-4 left-1/2 -translate-x-1/2 w-10 h-10 xs:w-12 xs:h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm xs:text-base lg:text-lg">
                    {step.number}
                  </div>
                  <div className="mt-3 xs:mt-4 mb-3 xs:mb-4">
                    <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-3 xs:mb-4">
                      <i className={`fa-solid ${step.icon} text-lg xs:text-xl sm:text-2xl text-accent`}></i>
                    </div>
                    <h3 className="text-base xs:text-lg font-semibold text-foreground mb-1.5 xs:mb-2 px-2">{step.title}</h3>
                    <p className="text-xs xs:text-sm text-muted-foreground px-2">{step.description}</p>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Design Request Form Section */}
      <section id="design-form" className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-warm to-white/90 backdrop-blur-sm relative overflow-hidden z-10">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-24 h-24 xs:w-32 xs:h-32 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 xs:w-48 xs:h-48 bg-accent/5 rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

        <div className="container-custom relative z-10">
          <ScrollReveal>
            <div className="text-center mb-8 xs:mb-10 sm:mb-12">
              <motion.h2 
                className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-primary mb-3 xs:mb-4 px-2"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Request Your Design
              </motion.h2>
              <p className="text-muted-foreground text-sm xs:text-base sm:text-lg max-w-xl mx-auto px-2">
                Tell us about your vision and we'll bring it to life
              </p>
            </div>
          </ScrollReveal>

          <div className="max-w-2xl mx-auto px-2 xs:px-3 sm:px-4">
            {isSubmitted ? (
              <ScrollReveal>
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center p-6 xs:p-8 sm:p-10 lg:p-12 bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-primary/10"
                >
                  <div className="w-16 h-16 xs:w-18 xs:h-18 sm:w-20 sm:h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4 xs:mb-5 sm:mb-6">
                    <i className="fa-solid fa-check text-2xl xs:text-2.5xl sm:text-3xl text-accent"></i>
                  </div>
                  <h3 className="text-xl xs:text-2xl font-semibold text-foreground mb-3 xs:mb-4 px-2">Thanks for Your Request!</h3>
                  <p className="text-muted-foreground text-sm xs:text-base mb-4 xs:mb-5 sm:mb-6 px-2">
                    Our team will personally connect with you shortly to discuss your design requirements.
                  </p>
                  <Button 
                    variant="outline" 
                    className="rounded-full h-10 xs:h-11 sm:h-12 text-xs xs:text-sm sm:text-base px-4 xs:px-6 sm:px-8"
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({ fullName: '', email: '', phone: '', designType: '', description: '' });
                    }}
                  >
                    <span className="truncate">Submit Another Request</span>
                  </Button>
                </motion.div>
              </ScrollReveal>
            ) : (
              <ScrollReveal>
                <motion.form 
                  onSubmit={handleSubmit} 
                  className="bg-white/95 backdrop-blur-sm p-4 xs:p-5 sm:p-6 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl shadow-xl border border-primary/10"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-5 sm:gap-6 mb-4 xs:mb-5 sm:mb-6">
                    <div>
                      <Label htmlFor="fullName" className="text-foreground font-medium mb-1.5 xs:mb-2 block text-xs xs:text-sm">
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        required
                        className="rounded-lg border-primary/20 focus:border-primary transition-colors h-10 xs:h-11 sm:h-12 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-foreground font-medium mb-1.5 xs:mb-2 block text-xs xs:text-sm">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="rounded-lg border-primary/20 focus:border-primary transition-colors h-10 xs:h-11 sm:h-12 text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-5 sm:gap-6 mb-4 xs:mb-5 sm:mb-6">
                    <div>
                      <Label htmlFor="phone" className="text-foreground font-medium mb-1.5 xs:mb-2 block text-xs xs:text-sm">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                        className="rounded-lg border-primary/20 focus:border-primary transition-colors h-10 xs:h-11 sm:h-12 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="designType" className="text-foreground font-medium mb-1.5 xs:mb-2 block text-xs xs:text-sm">
                        Type of Design *
                      </Label>
                      <Select 
                        value={formData.designType} 
                        onValueChange={(value) => handleInputChange('designType', value)}
                        required
                      >
                        <SelectTrigger className="rounded-lg border-primary/20 focus:border-primary transition-colors h-10 xs:h-11 sm:h-12 text-sm sm:text-base">
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

                  <div className="mb-4 xs:mb-5 sm:mb-6">
                    <Label htmlFor="description" className="text-foreground font-medium mb-1.5 xs:mb-2 block text-xs xs:text-sm">
                      Describe Your Design *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Tell us about your design requirements, style preferences, colors, and any specific details..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      required
                      rows={5}
                      className="rounded-lg border-primary/20 focus:border-primary resize-none transition-colors text-sm sm:text-base"
                    />
                  </div>

                  <div className="mb-4 xs:mb-5 sm:mb-6">
                    <Label className="text-foreground font-medium mb-1.5 xs:mb-2 block text-xs xs:text-sm">
                      Reference Image (Optional)
                    </Label>
                    <div className="border-2 border-dashed border-primary/20 rounded-lg p-4 xs:p-5 sm:p-6 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                      <i className="fa-solid fa-cloud-upload text-2xl xs:text-3xl text-muted-foreground mb-2"></i>
                      <p className="text-xs xs:text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 10MB
                      </p>
                      <input type="file" className="hidden" accept="image/*" />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white py-4 xs:py-5 sm:py-6 text-sm xs:text-base sm:text-lg rounded-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        <span className="truncate">Submitting...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane mr-2"></i>
                        <span className="truncate">Submit Request</span>
                      </>
                    )}
                  </Button>
                </motion.form>
              </ScrollReveal>
            )}
          </div>
        </div>
      </section>

      {/* Design Specialties Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-white/90 backdrop-blur-sm relative z-10">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-8 xs:mb-10 sm:mb-12">
              <motion.h2 
                className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-primary mb-3 xs:mb-4 px-2"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Our Design Specialties
              </motion.h2>
              <p className="text-muted-foreground text-sm xs:text-base sm:text-lg max-w-xl mx-auto px-2">
                We specialize in creating beautiful, custom designs across various categories
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xs:gap-5 sm:gap-6">
            {specialties.map((specialty, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <motion.div 
                  className="group p-4 xs:p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-b from-warm to-white border border-primary/10 hover:shadow-xl hover:border-primary/30 transition-all text-center"
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3 xs:mb-4 group-hover:bg-primary/20 transition-colors">
                    <i className={`fa-solid ${specialty.icon} text-lg xs:text-xl sm:text-2xl text-primary`}></i>
                  </div>
                  <h3 className="text-base xs:text-lg font-semibold text-foreground mb-1.5 xs:mb-2 px-2">{specialty.title}</h3>
                  <p className="text-xs xs:text-sm text-muted-foreground px-2">{specialty.description}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-warm to-white/90 backdrop-blur-sm relative z-10">
        <div className="container-custom">
          <ScrollReveal>
            <div className="text-center mb-8 xs:mb-10 sm:mb-12">
              <motion.h2 
                className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-primary mb-3 xs:mb-4 px-2"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Why Choose Us
              </motion.h2>
              <p className="text-muted-foreground text-sm xs:text-base sm:text-lg max-w-xl mx-auto px-2">
                We're committed to delivering exceptional design experiences
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xs:gap-5 sm:gap-6">
            {whyChooseUs.map((item, index) => (
              <ScrollReveal key={index} delay={index * 0.1}>
                <motion.div 
                  className="group p-4 xs:p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-sm border border-primary/10 hover:shadow-xl transition-all text-center"
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-12 h-12 xs:w-14 xs:h-14 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-3 xs:mb-4 group-hover:bg-accent/20 transition-colors">
                    <i className={`fa-solid ${item.icon} text-lg xs:text-xl text-accent`}></i>
                  </div>
                  <h3 className="text-base xs:text-lg font-semibold text-foreground mb-1.5 xs:mb-2 px-2">{item.title}</h3>
                  <p className="text-xs xs:text-sm text-muted-foreground px-2">{item.description}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-r from-primary/90 to-primary relative overflow-hidden z-10">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <motion.div 
            className="absolute top-0 left-4 xs:left-6 sm:left-10 w-24 h-24 xs:w-32 xs:h-32 sm:w-40 sm:h-40 bg-white rounded-full"
            animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 right-4 xs:right-6 sm:right-10 w-32 h-32 xs:w-40 xs:h-40 sm:w-60 sm:h-60 bg-white rounded-full"
            animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/4 w-20 h-20 xs:w-24 xs:h-24 sm:w-32 sm:h-32 bg-white rounded-full"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="container-custom relative z-10 text-center">
          <ScrollReveal>
            <motion.h2 
              className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-white mb-3 xs:mb-4 px-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Ready to Create Something Beautiful?
            </motion.h2>
            <motion.p 
              className="text-white/90 text-sm xs:text-base sm:text-lg mb-6 xs:mb-7 sm:mb-8 max-w-xl mx-auto px-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Let's bring your creative vision to life. Our team is ready to help you create stunning designs.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Button 
                className="bg-white text-primary hover:bg-white/90 px-4 xs:px-6 sm:px-8 py-4 xs:py-5 sm:py-6 text-sm xs:text-base sm:text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                onClick={() => document.getElementById('design-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <i className="fa-solid fa-sparkles mr-1.5 xs:mr-2"></i>
                <span className="truncate">Request Your Design Now</span>
              </Button>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default CustomDesign;
