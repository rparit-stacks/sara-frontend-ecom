import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Upload, ArrowRight, Palette, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { productsApi, customConfigApi, mediaApi, mockupApi } from '@/lib/api';

const MakeYourOwn = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingMockups, setIsGeneratingMockups] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedMockups, setGeneratedMockups] = useState<Array<{ url: string; template: string; width: number; height: number }>>([]);
  const [originalDesignUrl, setOriginalDesignUrl] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    
    // Upload original design file first, then generate mockups
    setIsGeneratingMockups(true);
    try {
      // Step 1: Upload original design file to save it for admin
      const uploadedFiles = await productsApi.uploadMedia([file], 'products/original-designs');
      const originalUrl = uploadedFiles[0]?.url;
      
      if (!originalUrl) {
        throw new Error('Failed to upload original design file');
      }
      
      setOriginalDesignUrl(originalUrl);
      console.log('[MakeYourOwn] Original design uploaded:', originalUrl);
      
      // Step 2: Generate mockups from the design
      const mockups = await mockupApi.generateAllMockups(file);
      setGeneratedMockups(mockups);
      toast.success(`Design uploaded! Generated ${mockups.length} mockup${mockups.length > 1 ? 's' : ''}.`);
    } catch (error) {
      console.error('Failed to process design:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process design. Please try again.');
      // Clear the file selection if processing fails
      setSelectedFile(null);
      setPreviewUrl(null);
      setOriginalDesignUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsGeneratingMockups(false);
    }
  };

  // Fetch custom config
  const { data: customConfig } = useQuery({
    queryKey: ['customConfig'],
    queryFn: () => customConfigApi.getPublicConfig(),
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      setIsUploading(true);
      try {
        // Use generated mockup images (minimum 1, use all available)
        if (!generatedMockups || generatedMockups.length === 0) {
          throw new Error('No mockup images available. Please upload your design first.');
        }
        
        if (!originalDesignUrl) {
          throw new Error('Original design file not available. Please upload your design again.');
        }
        
        // Create product with generated mockup images + original design
        // Mockup images first (for display), then original design at the end (for admin access)
        const mediaItems = [
          // Mockup images for product display (displayOrder: 0, 1, 2, ...)
          ...generatedMockups.map((mockup, index) => ({
            url: mockup.url,
            type: 'image',
            displayOrder: index
          })),
          // Original design file at the end (displayOrder: 9999)
          // Admin Note: The media item with displayOrder: 9999 is the original user-uploaded design file
          // This allows admin to access and download the original design for future use
          {
            url: originalDesignUrl,
            type: 'image',
            displayOrder: 9999 // High number so it appears last in media list, admin can easily identify it
          }
        ];
        
        return productsApi.createFromUpload({
          ...data,
          media: mediaItems
        });
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (createdProduct) => {
      toast.success('Product created successfully!');
      // Navigate to product detail page using slug
      if (createdProduct.slug) {
        navigate(`/products/${createdProduct.slug}`);
      } else if (createdProduct.id) {
        // Fallback to ID if slug is not available
        navigate(`/products/${createdProduct.id}`);
      } else {
        toast.error('Product created but unable to navigate. Please refresh the page.');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create product');
    },
  });

  const handleProceed = async () => {
    if (!selectedFile || !previewUrl) {
      toast.error('Please upload your design first.');
      return;
    }
    
    if (!customConfig) {
      toast.error('Loading configuration... Please try again.');
      return;
    }
    
    if (generatedMockups.length === 0) {
      toast.error('Please wait for mockups to be generated.');
      return;
    }
    
    if (isGeneratingMockups) {
      toast.error('Please wait for mockups to finish generating.');
      return;
    }
    
    // Create product with custom config using generated mockup images
    createProductMutation.mutate({
      name: customConfig.pageTitle || 'Custom Design',
      description: customConfig.pageDescription || 'Your custom design',
      designPrice: customConfig.designPrice || 0,
      status: 'ACTIVE',
    });
  };

  return (
    <Layout>
      <section className="w-full py-8 sm:py-12 lg:py-20 xl:py-24 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 sm:w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 sm:translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 sm:w-1/4 h-1/4 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 sm:-translate-x-1/2 pointer-events-none" />

        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-4 xs:space-y-5 sm:space-y-6">
            <ScrollReveal>
              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-primary/10 text-primary px-3 xs:px-4 py-1.5 xs:py-2 rounded-full text-xs xs:text-sm font-medium mb-3 xs:mb-4">
                <Sparkles className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                <span className="truncate">Make Your Own</span>
              </div>
              <h1 className="font-cursive text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl px-2">
                Upload Your <span className="text-primary">Design</span>
              </h1>
              <p className="text-muted-foreground text-sm xs:text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed px-2">
                Upload your unique design and we'll create a temporary product page. 
                Your design will be saved permanently once you add it to your cart or wishlist.
              </p>
            </ScrollReveal>
          </div>

          <div className="mt-8 xs:mt-10 sm:mt-12 lg:mt-16 xl:mt-20 max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
              {/* Left: Upload Area */}
              <ScrollReveal direction="left">
                <div className="space-y-5 sm:space-y-6 lg:space-y-8">
                  <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 border-dashed border-border p-5 xs:p-6 sm:p-8 lg:p-10 xl:p-16 text-center space-y-4 xs:space-y-5 sm:space-y-6 transition-all hover:border-primary/50 group bg-gradient-to-b from-white to-secondary/5">
                    <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 bg-primary/5 text-primary rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10" />
                    </div>
                    <div className="space-y-1.5 xs:space-y-2">
                      <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold">Upload Your Design</h3>
                      <p className="text-muted-foreground text-xs xs:text-sm sm:text-base">
                        Transparent PNG or high-resolution JPG files work best.
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-3 xs:gap-4">
                      <input
                        ref={fileInputRef}
                        id="design-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={isUploading || isGeneratingMockups}
                        onClick={() => fileInputRef.current?.click()}
                        className="h-11 xs:h-12 sm:h-14 px-4 xs:px-6 sm:px-8 lg:px-10 text-sm xs:text-base sm:text-lg rounded-xl sm:rounded-2xl cursor-pointer w-full"
                      >
                        <span className="truncate">
                          {isGeneratingMockups ? 'Generating Mockups...' : isUploading ? 'Processing...' : 'Choose Design File'}
                        </span>
                      </Button>
                      <p className="text-[10px] xs:text-xs text-muted-foreground">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 xs:gap-3 p-3 xs:p-4 rounded-xl sm:rounded-2xl bg-secondary/20">
                      <Palette className="w-4 h-4 xs:w-5 xs:h-5 text-primary flex-shrink-0" />
                      <span className="text-xs xs:text-sm font-medium truncate">Premium Quality</span>
                    </div>
                    <div className="flex items-center gap-2 xs:gap-3 p-3 xs:p-4 rounded-xl sm:rounded-2xl bg-secondary/20">
                      <ShieldCheck className="w-4 h-4 xs:w-5 xs:h-5 text-primary flex-shrink-0" />
                      <span className="text-xs xs:text-sm font-medium truncate">Temporary Preview</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Right: Preview & Proceed */}
              <ScrollReveal direction="right">
                <div className="space-y-5 sm:space-y-6 lg:space-y-8">
                  <div className="aspect-square bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl border border-border shadow-lg sm:shadow-2xl relative overflow-hidden flex items-center justify-center p-4 xs:p-6 sm:p-8 bg-gradient-to-tr from-secondary/10 to-white">
                    <AnimatePresence mode="wait">
                      {previewUrl ? (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="w-full h-full flex flex-col items-center justify-center space-y-3 xs:space-y-4"
                        >
                          <div className="relative group max-w-full">
                            <img
                              src={previewUrl}
                              alt="Custom design preview"
                              className="max-h-[200px] xs:max-h-[250px] sm:max-h-[300px] w-auto max-w-full object-contain rounded-lg sm:rounded-xl shadow-lg border border-border"
                            />
                            <div className="absolute inset-0 bg-primary/10 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          <p className="text-xs xs:text-sm font-medium text-primary flex items-center gap-1.5 xs:gap-2 px-2 text-center">
                            <Sparkles className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                            <span className="truncate">
                              {isGeneratingMockups 
                                ? 'Generating mockups...' 
                                : generatedMockups.length > 0 
                                  ? `${generatedMockups.length} mockup${generatedMockups.length > 1 ? 's' : ''} ready` 
                                  : 'Ready to create product page'}
                            </span>
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center space-y-3 xs:space-y-4"
                        >
                          <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                            <Palette className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12" />
                          </div>
                          <p className="text-muted-foreground font-medium text-xs xs:text-sm sm:text-base px-2">
                            Preview will appear here after upload
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button 
                    size="lg" 
                    onClick={handleProceed}
                    disabled={!previewUrl || isUploading || isGeneratingMockups || createProductMutation.isPending || !customConfig || generatedMockups.length === 0}
                    className="w-full h-12 xs:h-14 sm:h-16 text-sm xs:text-base sm:text-lg lg:text-xl rounded-xl sm:rounded-2xl bg-[#2b9d8f] hover:bg-[#238a7d] text-white gap-2 sm:gap-3 shadow-lg sm:shadow-xl shadow-[#2b9d8f]/20"
                  >
                    {(isUploading || createProductMutation.isPending) ? (
                      <>
                        <Loader2 className="w-5 h-5 xs:w-6 xs:h-6 animate-spin flex-shrink-0" />
                        <span className="truncate">Creating Product...</span>
                      </>
                    ) : isGeneratingMockups ? (
                      <>
                        <Loader2 className="w-5 h-5 xs:w-6 xs:h-6 animate-spin flex-shrink-0" />
                        <span className="truncate">Generating Mockups...</span>
                      </>
                    ) : (
                      <>
                        <span className="truncate">Create Product Page</span>
                        <ArrowRight className="w-5 h-5 xs:w-6 xs:h-6 flex-shrink-0" />
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] xs:text-xs text-center text-muted-foreground px-2">
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
