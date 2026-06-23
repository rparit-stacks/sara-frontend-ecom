import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Upload, ArrowRight, Palette, Sparkles, ShieldCheck, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { customProductsApi, customConfigApi } from '@/lib/api';
import { MockupGeneratorPopup, type MockupAttachPayload } from '@/components/mockup/MockupGeneratorPopup';
import { dataUrlToFile } from '@/lib/mockupUtils';

const MakeYourOwn = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAttachingMockup, setIsAttachingMockup] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [attachedMockupUrl, setAttachedMockupUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedMockups, setGeneratedMockups] = useState<Array<{ url: string; template: string; width: number; height: number }>>([]);
  const [originalDesignUrl, setOriginalDesignUrl] = useState<string | null>(null);
  const [mockupPopupOpen, setMockupPopupOpen] = useState(false);

  const isLoggedIn = !!localStorage.getItem('authToken');

  const getGuestIdentifier = () => {
    if (localStorage.getItem('authToken')) return null;
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem('guestId', guestId);
    }
    return guestId;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isLoggedIn) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (PNG, JPG, GIF, or WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAttachedMockupUrl(null);
    setGeneratedMockups([]);

    setIsUploading(true);
    try {
      const uploadedFiles = await customProductsApi.uploadMedia([file], 'products/original-designs');
      const originalUrl = uploadedFiles[0]?.url;
      if (!originalUrl) throw new Error('Failed to upload original design file');
      setOriginalDesignUrl(originalUrl);
      toast.success('Design uploaded. Now generate AI mockup to attach it.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload design.');
      setSelectedFile(null);
      setPreviewUrl(null);
      setOriginalDesignUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleMockupAttach = async (payload: MockupAttachPayload) => {
    setIsAttachingMockup(true);
    try {
      let designUrl = originalDesignUrl;

      if (!designUrl || selectedFile?.name !== payload.designFile.name) {
        const designUpload = await customProductsApi.uploadMedia(
          [payload.designFile],
          'products/original-designs',
        );
        designUrl = designUpload[0]?.url;
        if (!designUrl) throw new Error('Failed to upload design');
        setOriginalDesignUrl(designUrl);
        setSelectedFile(payload.designFile);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(payload.designFile));
      }

      const mockupFile = dataUrlToFile(payload.mockupDataUrl, `mockup-${Date.now()}.png`);
      const mockupUpload = await customProductsApi.uploadMedia([mockupFile], 'products/mockups');
      const mockupUrl = mockupUpload[0]?.url;
      if (!mockupUrl) throw new Error('Failed to upload mockup image');

      const entry = {
        url: mockupUrl,
        template: payload.templateName,
        width: payload.width,
        height: payload.height,
      };

      setGeneratedMockups((prev) => [...prev, entry]);
      setAttachedMockupUrl(mockupUrl);
    } finally {
      setIsAttachingMockup(false);
    }
  };

  const { data: customConfig } = useQuery({
    queryKey: ['customConfig'],
    queryFn: () => customConfigApi.getPublicConfig(),
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      setIsUploading(true);
      try {
        if (!originalDesignUrl) {
          throw new Error('Design not available. Please upload your design again.');
        }
        if (generatedMockups.length === 0) {
          throw new Error('No mockup attached. Generate AI mockup first.');
        }

        const isLoggedIn = !!localStorage.getItem('authToken');
        let userEmail: string | null = null;

        if (isLoggedIn) {
          try {
            const token = localStorage.getItem('authToken');
            if (token) {
              const payload = JSON.parse(atob(token.split('.')[1]));
              userEmail = payload.sub || payload.email || null;
            }
          } catch (e) {
            console.error('Failed to parse auth token:', e);
          }
        }

        if (!userEmail) {
          userEmail = getGuestIdentifier();
        }

        return customProductsApi.create({
          name: data.name || 'Custom Design',
          description: data.description || 'Your custom design',
          designPrice: data.designPrice || 0,
          images: [originalDesignUrl],
          mockupUrls: generatedMockups.map((m) => m.url),
          userEmail,
        });
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (createdProduct) => {
      toast.success('Custom product created! Now select your fabric.');
      if (createdProduct.id) {
        navigate(`/custom-product/${createdProduct.id}`);
      } else {
        toast.error('Product created but unable to navigate. Please refresh the page.');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create custom product');
    },
  });

  const handleProceed = () => {
    if (!originalDesignUrl) {
      toast.error('Please upload your design first.');
      return;
    }
    if (!customConfig) {
      toast.error('Loading configuration... Please try again.');
      return;
    }
    if (generatedMockups.length === 0) {
      toast.error('Generate & attach AI mockup first.');
      return;
    }
    createProductMutation.mutate({
      name: customConfig.pageTitle || 'Custom Design',
      description: customConfig.pageDescription || 'Your custom design',
      designPrice: customConfig.designPrice || 0,
      status: 'ACTIVE',
    });
  };

  const displayImageUrl = attachedMockupUrl || previewUrl;
  const isGlobalLoading = isUploading || isAttachingMockup || createProductMutation.isPending;

  return (
    <Layout>
      <AnimatePresence>
        {isGlobalLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div className="flex flex-col items-center gap-4 px-8 py-6 rounded-2xl bg-background/95 shadow-2xl border max-w-sm text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-semibold">
                {isAttachingMockup ? 'Attaching mockup to product…' : isUploading ? 'Uploading design…' : 'Creating product…'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="w-full py-8 sm:py-12 lg:py-20 xl:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Upload Your Design
              </div>
              <h1 className="font-cursive text-4xl sm:text-6xl lg:text-7xl">
                Upload Your <span className="text-primary">Design</span>
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                Upload design, generate AI mockup — seedha product page pe attach ho jayega.
              </p>
            </ScrollReveal>
          </div>

          <div className="mt-12 max-w-5xl mx-auto">
            {!isLoggedIn && (
              <div className="mb-8 p-6 bg-primary/10 border border-primary/20 rounded-xl text-center space-y-4">
                <p className="font-medium">Log in to upload your design.</p>
                <Button onClick={() => navigate('/login', { state: { returnTo: '/make-your-own' } })}>Log in</Button>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <ScrollReveal direction="left">
                <div className="bg-white rounded-2xl border-2 border-dashed border-border p-8 text-center space-y-6">
                  <Upload className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="text-xl font-semibold">Upload Your Design</h3>
                  <div className="flex flex-col gap-3">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <Button
                      variant="outline"
                      disabled={!isLoggedIn || isUploading || isAttachingMockup}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-12 rounded-xl w-full"
                    >
                      {isUploading ? 'Uploading…' : 'Choose Design File'}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={!isLoggedIn || isAttachingMockup}
                      onClick={() => setMockupPopupOpen(true)}
                      className="h-12 rounded-xl w-full gap-2 border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                    >
                      <Wand2 className="w-4 h-4" />
                      Generate & Attach AI Mockup (3 free)
                    </Button>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="right">
                <div className="space-y-6">
                  <div className="aspect-square bg-white rounded-2xl border shadow-lg flex items-center justify-center p-6">
                    {displayImageUrl ? (
                      <div className="text-center space-y-3 w-full">
                        <img
                          src={displayImageUrl}
                          alt={attachedMockupUrl ? 'Attached mockup' : 'Design'}
                          className="max-h-[280px] mx-auto object-contain rounded-xl shadow border"
                        />
                        <p className="text-sm font-medium text-primary flex items-center justify-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          {attachedMockupUrl
                            ? `${generatedMockups.length} mockup attached — ready for product page`
                            : 'Design uploaded — generate AI mockup to attach'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Image will appear here after upload</p>
                    )}
                  </div>

                  <Button
                    size="lg"
                    onClick={handleProceed}
                    disabled={!isLoggedIn || !originalDesignUrl || generatedMockups.length === 0 || isGlobalLoading || !customConfig}
                    className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white gap-2"
                  >
                    {createProductMutation.isPending ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />Creating Product…</>
                    ) : (
                      <><span>Create Product Page</span><ArrowRight className="w-5 h-5" /></>
                    )}
                  </Button>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <MockupGeneratorPopup
        open={mockupPopupOpen}
        onOpenChange={setMockupPopupOpen}
        onAttach={handleMockupAttach}
        premiumMaintenancePath="/contact"
      />
    </Layout>
  );
};

export default MakeYourOwn;
