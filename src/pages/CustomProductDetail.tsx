import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Share2, Truck, RotateCcw, Shield, Minus, Plus, ChevronRight, Palette, CheckCircle2, Info } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PlainProductSelectionPopup from '@/components/products/PlainProductSelectionPopup';
import FabricVariantPopup from '@/components/products/FabricVariantPopup';
import DynamicForm from '@/components/products/DynamicForm';
import { FormField } from '@/components/admin/FormBuilder';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { IndianRupee } from 'lucide-react';
import { customProductsApi, cartApi, wishlistApi, customConfigApi } from '@/lib/api';
import { usePrice } from '@/lib/currency';

const CustomProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { format } = usePrice();
  
  // This is always a custom design page
  const isCustomDesign = true;
  
  // Get custom config from backend
  const { data: customConfig } = useQuery({
    queryKey: ['customConfig'],
    queryFn: () => customConfigApi.getPublicConfig(),
  });

  // Get or create guest identifier for non-logged-in users
  const getGuestIdentifier = () => {
    const isLoggedIn = !!localStorage.getItem('authToken');
    if (isLoggedIn) return null;
    
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem('guestId', guestId);
    }
    return guestId;
  };

  // Get custom product from API if ID is in URL
  const guestId = getGuestIdentifier();
  const { data: customProduct, isLoading: loadingProduct } = useQuery({
    queryKey: ['customProduct', id, guestId],
    queryFn: () => customProductsApi.getById(Number(id!), guestId || undefined),
    enabled: !!id,
  });
  
  // Fallback to location.state for backward compatibility
  const designUrl = customProduct?.designUrl || (location.state as any)?.designUrl;
  const customProductId = customProduct?.id || (id ? Number(id) : null);
  const isTemporary = !customProduct?.isSaved ?? true;
  
  // Parse mockup URLs from customProduct (stored as JSON string)
  const mockupUrls = useMemo(() => {
    if (!customProduct?.mockupUrls) return [];
    try {
      const parsed = JSON.parse(customProduct.mockupUrls);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }, [customProduct?.mockupUrls]);
  
  // Combine original design with all mockup images (must be before early return)
  const displayImages = useMemo(() => {
    if (!designUrl) return [];
    const images = [designUrl]; // Original design first
    if (mockupUrls && mockupUrls.length > 0) {
      images.push(...mockupUrls); // Add all mockup URLs
    }
    return images;
  }, [designUrl, mockupUrls]);
  
  // Get design price from custom config (backend provides this)
  const DESIGN_PRICE = useMemo(() => {
    return customConfig?.designPrice || customProduct?.designPrice || 1000;
  }, [customConfig?.designPrice, customProduct?.designPrice]);
  
  // Get custom form fields from config (backend provides this)
  const customFormFields = useMemo(() => {
    return customConfig?.formFields || [];
  }, [customConfig?.formFields]);
  
  // Auto-delete unsaved product when user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (customProductId && isTemporary) {
        // Delete unsaved product when user leaves
        customProductsApi.deleteUnsaved(customProductId).catch(() => {
          // Ignore errors on page unload
        });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also delete when component unmounts (user navigates away)
      if (customProductId && isTemporary) {
        const guestId = getGuestIdentifier();
        customProductsApi.deleteUnsaved(customProductId, guestId || undefined).catch(() => {});
      }
    };
  }, [customProductId, isTemporary]);
  
  useEffect(() => {
    if (!designUrl && !loadingProduct) {
      toast.error('Please upload a design first.');
      navigate('/make-your-own');
    }
  }, [designUrl, loadingProduct, navigate]);

  const [selectedImage, setSelectedImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  
  // Design Product States (same as normal Design Product)
  const [showPlainProductSelection, setShowPlainProductSelection] = useState(false);
  const [showFabricVariant, setShowFabricVariant] = useState(false);
  const [selectedPlainProductId, setSelectedPlainProductId] = useState<string | null>(null);
  const [fabricSelectionData, setFabricSelectionData] = useState<any>(null);
  
  // Custom Form State
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({});

  // Calculate combined price (Design Price + Fabric Price)
  const combinedPrice = useMemo(() => {
    if (!fabricSelectionData) return DESIGN_PRICE;
    return DESIGN_PRICE + fabricSelectionData.totalPrice;
  }, [fabricSelectionData, DESIGN_PRICE]);

  const handlePlainProductSelect = (productId: string) => {
    setSelectedPlainProductId(productId);
    setShowPlainProductSelection(false);
    setShowFabricVariant(true);
  };

  const handleFabricVariantComplete = (data: any) => {
    setFabricSelectionData(data);
    setShowFabricVariant(false);
    // After fabric selection, show custom form
    setShowCustomForm(true);
  };

  const handleCustomFormSubmit = (formData: Record<string, any>) => {
    setCustomFormData(formData);
    setShowCustomForm(false);
    toast.success('Custom information saved!');
  };

  // Save custom product mutation
  const saveCustomProductMutation = useMutation({
    mutationFn: () => customProductId ? customProductsApi.save(customProductId) : Promise.resolve(null),
    onSuccess: () => {
      setIsSaved(true);
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (cartData: any) => cartApi.addItem(cartData),
    onSuccess: () => {
      if (customProductId) {
        // Save custom product when added to cart
        saveCustomProductMutation.mutate();
      }
      toast.success('Custom product added to cart and saved!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add to cart');
    },
  });

  const handleAddToCart = () => {
    if (!fabricSelectionData) {
      toast.error('Please select a fabric first');
      return;
    }
    if (customFormFields.length > 0 && Object.keys(customFormData).length === 0) {
      toast.error('Please fill the custom form first');
      setShowCustomForm(true);
      return;
    }

    const cartData = {
      productType: 'CUSTOM',
      productId: customProductId || 0, // Custom products don't have regular product ID
      productName: customFormData['field-1'] || 'Custom Studio Sara Piece',
      productImage: designUrl,
      designPrice: DESIGN_PRICE,
      fabricId: Number(fabricSelectionData.fabricId),
      fabricPrice: fabricSelectionData.totalPrice,
      quantity: fabricSelectionData.quantity,
      unitPrice: combinedPrice,
      variants: fabricSelectionData.selectedVariants,
      customFormData: customFormData,
      uploadedDesignUrl: designUrl,
      customProductId: customProductId, // Include custom product ID
    };
    
    addToCartMutation.mutate(cartData);
  };

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: (wishlistData: any) => wishlistApi.addItem(wishlistData),
    onSuccess: () => {
      if (customProductId) {
        // Save custom product when added to wishlist
        saveCustomProductMutation.mutate();
      }
      toast.success('Custom product added to wishlist and saved!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add to wishlist');
    },
  });

  const handleAddToWishlist = () => {
    if (!fabricSelectionData) {
      toast.error('Please select a fabric first');
      return;
    }

    const wishlistData = {
      productType: 'CUSTOM',
      productId: customProductId || 0,
      productName: customFormData['field-1'] || 'Custom Studio Sara Piece',
      productImage: designUrl,
      designPrice: DESIGN_PRICE,
      fabricId: Number(fabricSelectionData.fabricId),
      fabricPrice: fabricSelectionData.totalPrice,
      variants: fabricSelectionData.selectedVariants,
      customFormData: customFormData,
      uploadedDesignUrl: designUrl,
      customProductId: customProductId,
    };
    
    addToWishlistMutation.mutate(wishlistData);
  };

  if (!designUrl || displayImages.length === 0) return null;

  return (
    <Layout>
      {/* Session Header */}
      {isTemporary && !isSaved && (
        <section className="w-full bg-primary/5 py-4 border-b border-primary/10">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Temporary Product: Add to cart or wishlist to save permanently
            </div>
          </div>
        </section>
      )}
      {isSaved && (
        <section className="w-full bg-green-50 py-4 border-b border-green-200">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex items-center justify-center">
            <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Product saved! It has been added to your cart or wishlist.
            </div>
          </div>
        </section>
      )}

      {/* Breadcrumb */}
      <section className="w-full bg-secondary/30 py-5">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <nav className="flex items-center text-sm text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0" />
            <Link to="/make-your-own" className="hover:text-primary transition-colors">Upload Your Design</Link>
            <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0" />
            <span className="text-foreground truncate">Custom Product</span>
          </nav>
        </div>
      </section>

      {/* Product Section - Same as Design Product */}
      <section className="w-full py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Images */}
            <div className="lg:col-span-5">
              <ScrollReveal direction="left">
                <div className="space-y-5">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="aspect-square rounded-2xl overflow-hidden bg-secondary/30 border border-border shadow-md"
                  >
                    <img
                      src={displayImages[selectedImage]}
                      alt={selectedImage === 0 ? "Your custom design" : `Mockup ${selectedImage}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  
                  {/* Thumbnail navigation if multiple images */}
                  {displayImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {displayImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={cn(
                            "flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all",
                            selectedImage === idx
                              ? "border-primary shadow-md"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <img
                            src={img}
                            alt={idx === 0 ? "Original design" : `Mockup ${idx}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <button 
                      onClick={() => navigate('/make-your-own')}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <Info className="w-3 h-3" />
                      Want to upload a different design?
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Product Info */}
            <div className="lg:col-span-7">
              <ScrollReveal direction="right">
                <div className="lg:sticky lg:top-24 space-y-8 max-w-2xl">
                  <div className="flex gap-3">
                    <Badge className="bg-primary text-white">Custom Design</Badge>
                    <Badge variant="outline">Your Upload</Badge>
                  </div>

                  <div>
                    <h1 className="font-cursive text-5xl lg:text-6xl mb-5">
                      {customConfig?.pageTitle || 'Your Custom Design'}
                    </h1>
                    
                    {/* Price Display */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-4">
                        <span className="font-cursive text-4xl text-primary">{format(combinedPrice)}</span>
                      </div>
                      {fabricSelectionData && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Design Price: {format(DESIGN_PRICE)}</p>
                          <p>Fabric Price: {format(fabricSelectionData.totalPrice)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {customConfig?.pageDescription && (
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {customConfig.pageDescription}
                    </p>
                  )}
                  
                  {customConfig?.instructions && (
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {customConfig.instructions}
                      </p>
                    </div>
                  )}

                  {/* Fabric Selection - Same as Design Product */}
                  {!fabricSelectionData ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-4 text-lg flex items-center gap-2">
                          <Palette className="w-5 h-5 text-primary" />
                          {customConfig?.selectFabricLabel || 'Select Fabric'}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Choose a fabric for your custom design. You can browse all available options.
                        </p>
                        <Button
                          onClick={() => setShowPlainProductSelection(true)}
                          variant="outline"
                          className="w-full h-12 text-base gap-2"
                        >
                          <Palette className="w-5 h-5" />
                          {customConfig?.selectFabricLabel || 'Browse All Plain Products'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-lg">Selected Fabric</h4>
                          <p className="text-sm text-muted-foreground">
                            {customConfig?.quantityLabel || 'Quantity'}: {fabricSelectionData.quantity} meters
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFabricSelectionData(null);
                            setSelectedPlainProductId(null);
                            setCustomFormData({});
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Custom Form Section */}
                  {fabricSelectionData && customFormFields.length > 0 && !showCustomForm && Object.keys(customFormData).length === 0 && (
                    <div className="space-y-4 p-4 border border-border rounded-lg">
                      <h4 className="font-medium text-lg">Additional Information</h4>
                      <p className="text-sm text-muted-foreground">
                        Please provide some additional details about your custom product.
                      </p>
                      <Button
                        onClick={() => setShowCustomForm(true)}
                        variant="outline"
                        className="w-full"
                      >
                        Fill Custom Form
                      </Button>
                    </div>
                  )}

                  {showCustomForm && (
                    <div className="space-y-4 p-6 border border-border rounded-lg bg-white">
                      <h4 className="font-medium text-lg">Custom Product Information</h4>
                      <DynamicForm
                        fields={customFormFields}
                        onSubmit={handleCustomFormSubmit}
                        initialData={customFormData}
                      />
                    </div>
                  )}

                  {customFormData && Object.keys(customFormData).length > 0 && (
                    <div className="space-y-2 p-4 border border-border rounded-lg bg-green-50">
                      <p className="text-sm font-medium text-green-700">Custom information saved ✓</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4 flex-wrap pt-4">
                    <Button 
                      size="lg" 
                      onClick={handleAddToCart}
                      disabled={!fabricSelectionData || (customFormFields.length > 0 && Object.keys(customFormData).length === 0)}
                      className="flex-1 min-w-[220px] btn-primary gap-3 h-14 text-base"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      {customConfig?.addToCartButtonText || 'Add to Cart'}
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="rounded-full w-14 h-14"
                      onClick={handleAddToWishlist}
                      disabled={isSaved || !fabricSelectionData}
                    >
                      <Heart className={`w-5 h-5 ${isSaved ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-full w-14 h-14">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Terms and Conditions */}
                  {customConfig?.termsAndConditions && customConfig.termsAndConditions.trim() && (
                    <div className="pt-8 border-t border-border">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="terms">
                          <AccordionTrigger className="text-left">
                            Terms and Conditions
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="text-sm text-muted-foreground whitespace-pre-line">
                              {customConfig.termsAndConditions}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}

                  {/* Trust Features */}
                  <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
                    <div className="text-center">
                      <Truck className="w-7 h-7 mx-auto text-primary mb-3" />
                      <span className="text-base text-muted-foreground font-cursive">Free Shipping</span>
                    </div>
                    <div className="text-center">
                      <RotateCcw className="w-7 h-7 mx-auto text-primary mb-3" />
                      <span className="text-base text-muted-foreground font-cursive">Easy Returns</span>
                    </div>
                    <div className="text-center">
                      <Shield className="w-7 h-7 mx-auto text-primary mb-3" />
                      <span className="text-base text-muted-foreground font-cursive">Secure Payment</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Popups - Same as Design Product */}
      {isCustomDesign && (
        <>
          <PlainProductSelectionPopup
            open={showPlainProductSelection}
            onOpenChange={setShowPlainProductSelection}
            recommendedPlainProductIds={customConfig?.recommendedFabricIds || []} // Use recommendations from config
            onPlainProductSelect={handlePlainProductSelect}
          />
          
          {selectedPlainProductId && (
            <FabricVariantPopup
              open={showFabricVariant}
              onOpenChange={setShowFabricVariant}
              fabric={{
                id: selectedPlainProductId,
                name: 'Selected Plain Product',
                image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=300&h=300&fit=crop',
                pricePerMeter: 100,
                status: 'active',
              }}
              variants={[]}
              onComplete={handleFabricVariantComplete}
            />
          )}
        </>
      )}
    </Layout>
  );
};

export default CustomProductDetail;
