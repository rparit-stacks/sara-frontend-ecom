import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import ScrollReveal from '@/components/animations/ScrollReveal';
import AnimatedWaveBackground from '@/components/animations/AnimatedWaveBackground';
import { toast } from 'sonner';
import { customConfigApi } from '@/lib/api';

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
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submit design request mutation
  const submitMutation = useMutation({
    mutationFn: customConfigApi.submitDesignRequest,
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Request submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit request');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let payload: Record<string, unknown> = { ...formData };
    if (referenceFile) {
      try {
        const { url } = await customConfigApi.uploadReferenceImage(referenceFile);
        payload = { ...payload, referenceImage: url };
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to upload reference file');
        return;
      }
    }
    submitMutation.mutate(payload);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const isSubmitting = submitMutation.isPending;

  return (
    <Layout>
      {/* Animated Wave Background */}
      <AnimatedWaveBackground />
      
      {/* Hero Section - Banner Style with Background Image & Flowers */}
      <section className="relative bg-white/80 backdrop-blur-sm py-6 sm:py-8 lg:py-12 z-20 overflow-hidden">
        {/* Section Background Image */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{
            backgroundImage: 'url(/bg_images/watercolor-wallpaper-with-hand-drawn-elements.png)',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-3 xs:px-4 sm:px-6 lg:px-12">
          {/* Banner with custom background image */}
          <div 
            className="relative w-full py-10 xs:py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 overflow-hidden"
            style={{
              backgroundImage: 'url(/bg_images/hand_painted_watercolour_winter_floral_background_1111.jpg)',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          >
            {/* subtle overlay to reduce background image opacity */}
            <div className="absolute inset-0 bg-white/40 pointer-events-none" />
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
                <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-foreground font-medium mb-1">
                  Welcome to the world of exquisite
                </p>
                <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-foreground font-medium mb-3 xs:mb-4 md:mb-6">
                  prints and embroideries.
                </p>
                <Button 
                  variant="outline"
                  className="px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-2.5 sm:py-3 md:py-4 lg:py-5 text-sm xs:text-base sm:text-lg md:text-xl border-2 border-[#d4a84b] text-[#d4a84b] hover:bg-[#d4a84b] hover:text-white rounded-none uppercase tracking-wider font-medium transition-all w-full sm:w-auto"
                  onClick={() => document.getElementById('design-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <span className="truncate">Begin your custom design</span>
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Left Background Image - Desktop (HIDDEN) */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden absolute lg:hidden z-30 pointer-events-none"
            style={{ left: '-120px', bottom: '-180px' }}
          >
            <img 
              src="/bg_images/6be0f0ce2c11383d352bd0828a354dba%20copy.png" 
              alt="Decorative background left" 
              className="w-[260px] xl:w-[300px] 2xl:w-[340px] h-auto object-contain max-w-none"
            />
          </motion.div>

          {/* Right Background Image - Desktop (HIDDEN) */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden absolute lg:hidden z-30 pointer-events-none"
            style={{ right: '-120px', bottom: '-180px' }}
          >
            <img 
              src="/bg_images/c71febdd919ac8f0010cd96003e2ff7d%20copy.png" 
              alt="Decorative background right" 
              className="w-[260px] xl:w-[300px] 2xl:w-[340px] h-auto object-contain max-w-none"
            />
          </motion.div>

          {/* Left Background Image - Mobile/Tablet (HIDDEN) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="hidden absolute z-30 pointer-events-none"
            style={{ left: '-30px', bottom: '-60px' }}
          >
            <img 
              src="/bg_images/6be0f0ce2c11383d352bd0828a354dba%20copy.png" 
              alt="Decorative background left" 
              className="w-[100px] xs:w-[120px] sm:w-[150px] md:w-[180px] h-auto object-contain"
            />
          </motion.div>

          {/* Right Background Image - Mobile/Tablet (HIDDEN) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden absolute z-30 pointer-events-none"
            style={{ right: '-30px', bottom: '-60px' }}
          >
            <img 
              src="/bg_images/c71febdd919ac8f0010cd96003e2ff7d%20copy.png" 
              alt="Decorative background right" 
              className="w-[100px] xs:w-[120px] sm:w-[150px] md:w-[180px] h-auto object-contain"
            />
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-white/90 backdrop-blur-sm relative z-0 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.15]"
          style={{
            backgroundImage: 'url(/bg_images/powder-pastel-with-hand-drawn-elements-background.png)',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />
        <div className="container-custom relative z-10">
          <ScrollReveal>
            <div className="text-center mb-8 xs:mb-10 sm:mb-12">
              <motion.h2 
                className="font-cursive text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-primary mb-3 xs:mb-4 px-2"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                How It Works
              </motion.h2>
              <p className="text-muted-foreground text-base xs:text-lg sm:text-xl max-w-xl mx-auto px-2">
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
                    <h3 className="text-lg xs:text-xl font-semibold text-foreground mb-1.5 xs:mb-2 px-2">{step.title}</h3>
                    <p className="text-sm xs:text-base text-muted-foreground px-2">{step.description}</p>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Design Request Form Section */}
      <section id="design-form" className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-warm to-white/90 backdrop-blur-sm relative overflow-hidden z-10">
        {/* Background Image */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{
            backgroundImage: 'url(/bg_images/4014404.jpg)',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />
        <div className="container-custom relative z-10">
          <ScrollReveal>
            <div className="text-center mb-8 xs:mb-10 sm:mb-12">
              <motion.h2 
                className="font-cursive text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-primary mb-3 xs:mb-4 px-2"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Request Your Design
              </motion.h2>
              <p className="text-muted-foreground text-base xs:text-lg sm:text-xl max-w-xl mx-auto px-2">
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
                  <h3 className="text-2xl xs:text-3xl font-semibold text-foreground mb-3 xs:mb-4 px-2">Thanks for Your Request!</h3>
                  <p className="text-muted-foreground text-base xs:text-lg mb-4 xs:mb-5 sm:mb-6 px-2">
                    Our team will personally connect with you shortly to discuss your design requirements.
                  </p>
                  <Button 
                    variant="outline" 
                    className="rounded-full h-10 xs:h-11 sm:h-12 text-sm xs:text-base sm:text-lg px-4 xs:px-6 sm:px-8"
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({ fullName: '', email: '', phone: '', designType: '', description: '' });
                      setReferenceFile(null);
                      fileInputRef.current && (fileInputRef.current.value = '');
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
                      <Label htmlFor="fullName" className="text-foreground font-medium mb-1.5 xs:mb-2 block text-sm xs:text-base">
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        required
                        className="rounded-lg border-primary/20 focus:border-primary transition-colors h-10 xs:h-11 sm:h-12 text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-foreground font-medium mb-1.5 xs:mb-2 block text-sm xs:text-base">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="rounded-lg border-primary/20 focus:border-primary transition-colors h-10 xs:h-11 sm:h-12 text-base"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-5 sm:gap-6 mb-4 xs:mb-5 sm:mb-6">
                    <div>
                      <Label htmlFor="phone" className="text-foreground font-medium mb-1.5 xs:mb-2 block text-sm xs:text-base">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                        className="rounded-lg border-primary/20 focus:border-primary transition-colors h-10 xs:h-11 sm:h-12 text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="designType" className="text-foreground font-medium mb-1.5 xs:mb-2 block text-sm xs:text-base">
                        Type of Design *
                      </Label>
                      <Select 
                        value={formData.designType} 
                        onValueChange={(value) => handleInputChange('designType', value)}
                        required
                      >
                        <SelectTrigger className="rounded-lg border-primary/20 focus:border-primary transition-colors h-10 xs:h-11 sm:h-12 text-base">
                          <SelectValue placeholder="Select design type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="print-design">Print design</SelectItem>
                          <SelectItem value="embroidery-design">Embroidery design</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mb-4 xs:mb-5 sm:mb-6">
                    <Label htmlFor="description" className="text-foreground font-medium mb-1.5 xs:mb-2 block text-sm xs:text-base">
                      Describe Your Design *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Tell us about your design requirements, style preferences, colors, and any specific details..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      required
                      rows={5}
                      className="rounded-lg border-primary/20 focus:border-primary resize-none transition-colors text-base"
                    />
                  </div>

                  <div className="mb-4 xs:mb-5 sm:mb-6">
                    <Label className="text-foreground font-medium mb-1.5 xs:mb-2 block text-sm xs:text-base">
                      Reference Image (Optional)
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('File must be under 10MB');
                            e.target.value = '';
                            return;
                          }
                          setReferenceFile(file);
                        }
                      }}
                    />
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                      className="border-2 border-dashed border-primary/20 rounded-lg p-4 xs:p-5 sm:p-6 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <i className="fa-solid fa-cloud-upload text-3xl xs:text-4xl text-muted-foreground mb-2"></i>
                      <p className="text-sm xs:text-base text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm xs:text-base text-muted-foreground mt-1">
                        PNG, JPG up to 10MB
                      </p>
                      {referenceFile && (
                        <p className="text-sm text-primary font-medium mt-2 truncate max-w-full" title={referenceFile.name}>
                          {referenceFile.name}
                        </p>
                      )}
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
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-white/90 backdrop-blur-sm relative z-10 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.15]"
          style={{
            backgroundImage: 'url(/bg_images/9598237.jpg)',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />
        <div className="container-custom relative z-10">
          <ScrollReveal>
            <div className="text-center mb-8 xs:mb-10 sm:mb-12">
              <motion.h2 
                className="font-cursive text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-primary mb-3 xs:mb-4 px-2"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Our Design Specialties
              </motion.h2>
              <p className="text-muted-foreground text-base xs:text-lg sm:text-xl max-w-xl mx-auto px-2">
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
                  <h3 className="text-lg xs:text-xl font-semibold text-foreground mb-1.5 xs:mb-2 px-2">{specialty.title}</h3>
                  <p className="text-sm xs:text-base text-muted-foreground px-2">{specialty.description}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-warm to-white/90 backdrop-blur-sm relative z-10 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.15]"
          style={{
            backgroundImage: 'url(/bg_images/9595043.jpg)',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />
        <div className="container-custom relative z-10">
          <ScrollReveal>
            <div className="text-center mb-8 xs:mb-10 sm:mb-12">
              <motion.h2 
                className="font-cursive text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-primary mb-3 xs:mb-4 px-2"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Why Choose Us
              </motion.h2>
              <p className="text-muted-foreground text-base xs:text-lg sm:text-xl max-w-xl mx-auto px-2">
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
                  <h3 className="text-lg xs:text-xl font-semibold text-foreground mb-1.5 xs:mb-2 px-2">{item.title}</h3>
                  <p className="text-sm xs:text-base text-muted-foreground px-2">{item.description}</p>
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
              className="font-cursive text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white mb-3 xs:mb-4 px-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Ready to Create Something Beautiful?
            </motion.h2>
            <motion.p 
              className="text-white/90 text-base xs:text-lg sm:text-xl mb-6 xs:mb-7 sm:mb-8 max-w-xl mx-auto px-2"
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
