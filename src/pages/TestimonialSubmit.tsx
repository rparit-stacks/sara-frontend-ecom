import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import ScrollReveal from '@/components/animations/ScrollReveal';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

const TestimonialSubmit = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    rating: 5,
    location: '',
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/api/testimonials/submit/${linkId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to submit testimonial');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Thank you! Your testimonial has been submitted successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit testimonial. Please try again.');
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.text) {
      toast.error('Please fill in your name and testimonial text');
      return;
    }
    
    submitMutation.mutate({
      name: formData.name,
      text: formData.text,
      rating: formData.rating,
      location: formData.location || null,
    });
  };
  
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  if (isSubmitted) {
    return (
      <Layout>
        <section className="w-full bg-secondary/30 py-14 lg:py-20">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <div className="max-w-2xl mx-auto text-center">
              <ScrollReveal>
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <h1 className="font-cursive text-4xl lg:text-5xl mb-4">Thank You!</h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Your testimonial has been submitted successfully. Our team will review it and it will be displayed on our homepage once approved.
                </p>
                <Button onClick={() => navigate('/')} className="bg-[#2b9d8f] hover:bg-[#238a7d] text-white">
                  Back to Home
                </Button>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <section className="w-full bg-secondary/30 py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center mb-8">
              <h1 className="font-cursive text-4xl lg:text-5xl mb-3">Share Your Experience</h1>
              <p className="text-muted-foreground text-lg">
                We'd love to hear about your experience with Studio Sara
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="w-full py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mx-auto">
            <ScrollReveal>
              <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-base mb-2 block">
                      Your Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      className="h-12"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-base mb-2 block">
                      Location (Optional)
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g., Mumbai, Delhi"
                      className="h-12"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="text" className="text-base mb-2 block">
                      Your Testimonial *
                    </Label>
                    <Textarea
                      id="text"
                      placeholder="Share your experience with us..."
                      className="min-h-[120px] resize-none"
                      value={formData.text}
                      onChange={(e) => handleInputChange('text', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-base mb-3 block">
                      Rating *
                    </Label>
                    <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleInputChange('rating', rating)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              rating <= formData.rating
                                ? 'fill-primary text-primary'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      {formData.rating} out of 5 stars
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white h-12 sm:h-14 text-base"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Testimonial'
                    )}
                  </Button>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TestimonialSubmit;
