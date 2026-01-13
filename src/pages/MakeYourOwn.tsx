import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Upload, ArrowRight, Palette, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MakeYourOwn = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedMockups, setGeneratedMockups] = useState<any[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (PNG, JPG, GIF, or WEBP)');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    toast.success('Design selected successfully!');
  };

  const handleProceed = () => {
    if (!selectedFile || !previewUrl) {
      toast.error('Please upload your design first.');
      return;
    }
    
    // Navigate directly to product page (same flow as Design Product)
    // The product page will handle fabric selection, variants, and custom form
    navigate('/custom-product', { 
      state: { 
        designUrl: previewUrl,
        designFile: selectedFile,
        isTemporary: true,
        isCustomDesign: true, // Flag to indicate this is a user-uploaded design
      } 
    });
  };

  return (
    <Layout>
      <section className="w-full py-14 lg:py-24 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Make Your Own
              </div>
              <h1 className="font-cursive text-5xl md:text-6xl lg:text-7xl">
                Upload Your <span className="text-primary">Design</span>
              </h1>
              <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
                Upload your unique design and we'll create a temporary product page. 
                Your design will be saved permanently once you add it to your cart or wishlist.
              </p>
            </ScrollReveal>
          </div>

          <div className="mt-16 lg:mt-20 max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Upload Area */}
              <ScrollReveal direction="left">
                <div className="space-y-8">
                  <div className="bg-white rounded-3xl border-2 border-dashed border-border p-10 lg:p-16 text-center space-y-6 transition-all hover:border-primary/50 group bg-gradient-to-b from-white to-secondary/5">
                    <div className="w-20 h-20 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold">Upload Your Design</h3>
                      <p className="text-muted-foreground">
                        Transparent PNG or high-resolution JPG files work best.
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <input
                        id="design-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="design-upload">
                        <Button 
                          type="button" 
                          variant="outline" 
                          disabled={isUploading}
                          className="h-14 px-10 text-lg rounded-2xl cursor-pointer w-full sm:w-auto"
                        >
                          {isUploading ? 'Processing...' : 'Choose Design File'}
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/20">
                      <Palette className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Premium Quality</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/20">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Temporary Preview</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Right: Preview & Proceed */}
              <ScrollReveal direction="right">
                <div className="space-y-8">
                  <div className="aspect-square bg-white rounded-3xl border border-border shadow-2xl relative overflow-hidden flex items-center justify-center p-8 bg-gradient-to-tr from-secondary/10 to-white">
                    <AnimatePresence mode="wait">
                      {previewUrl ? (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="w-full h-full flex flex-col items-center justify-center space-y-4"
                        >
                          <div className="relative group">
                            <img
                              src={previewUrl}
                              alt="Custom design preview"
                              className="max-h-[300px] w-auto object-contain rounded-xl shadow-lg border border-border"
                            />
                            <div className="absolute inset-0 bg-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          <p className="text-sm font-medium text-primary flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Ready to create product page
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center space-y-4"
                        >
                          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                            <Palette className="w-12 h-12" />
                          </div>
                          <p className="text-muted-foreground font-medium">
                            Preview will appear here after upload
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button 
                    size="lg" 
                    onClick={handleProceed}
                    disabled={!previewUrl || isUploading}
                    className="w-full h-16 text-xl rounded-2xl btn-primary gap-3 shadow-xl shadow-primary/20"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Generating Product Page...
                      </>
                    ) : (
                      <>
                        Create Product Page
                        <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    * This will create a temporary product page. Save it to your cart or wishlist to keep it permanently.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default MakeYourOwn;
