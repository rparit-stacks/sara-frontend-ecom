import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Upload, ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MakeYourOwn = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    toast.success('Design uploaded successfully!');
  };

  const handleCreateProduct = async () => {
    if (!selectedFile) {
      toast.error('Please upload your design first.');
      return;
    }
    
    setIsUploading(true);

    try {
      // Generate mockups if mockup service is available
      let mockups: any[] = [];
      
      try {
        const formData = new FormData();
        formData.append('design', selectedFile);

        const response = await fetch('http://localhost:3001/generate', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          mockups = data.mockups || [];
          toast.success('Mockups generated successfully!');
        }
      } catch (err) {
        // Mockup service not available, continue with just the design
        console.log('Mockup service not available, using design only');
      }
      
      // Navigate to temp product page
      navigate('/make-your-own-product', { 
        state: { 
          designUrl: previewUrl,
          designFile: selectedFile,
          mockups: mockups,
          isTemporary: true
        } 
      });
    } catch (err: any) {
      console.error('Error:', err);
      toast.error('Error creating product. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveDesign = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  return (
    <Layout>
      <section className="w-full py-14 lg:py-24 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
            <ScrollReveal>
              <h1 className="font-cursive text-5xl md:text-6xl lg:text-7xl">
                Make Your <span className="text-primary">Own</span>
              </h1>
              <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
                Upload your design and create a temporary product page. 
                Your design will be saved permanently once you add it to cart or wishlist.
              </p>
            </ScrollReveal>
          </div>

          <div className="max-w-5xl mx-auto">
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
                        Upload your design file (PNG, JPG, etc.)
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

                    {previewUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleRemoveDesign}
                        className="text-sm text-muted-foreground hover:text-destructive"
                      >
                        Remove Design
                      </Button>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="bg-secondary/20 rounded-2xl p-6 space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      How it works
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-2 text-left">
                      <li>• Upload your design file</li>
                      <li>• A temporary product page will be created</li>
                      <li>• Add to cart or wishlist to save permanently</li>
                      <li>• If not saved, the product will be temporary</li>
                    </ul>
                  </div>
                </div>
              </ScrollReveal>

              {/* Right: Preview & Create */}
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
                              alt="Your design preview"
                              className="max-h-[400px] w-auto object-contain rounded-xl shadow-lg border border-border"
                            />
                            <div className="absolute inset-0 bg-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          <p className="text-sm font-medium text-primary flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Ready to create product
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
                            <ImageIcon className="w-12 h-12" />
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
                    onClick={handleCreateProduct}
                    disabled={!previewUrl || isUploading}
                    className="w-full h-16 text-xl rounded-2xl btn-primary gap-3 shadow-xl shadow-primary/20"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Creating Product...
                      </>
                    ) : (
                      <>
                        Create Product Page
                        <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    This will create a temporary product page. Save it to cart or wishlist to keep it permanently.
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
