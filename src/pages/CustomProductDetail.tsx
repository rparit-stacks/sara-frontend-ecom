import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Share2, Truck, RotateCcw, Shield, Minus, Plus, ChevronRight, Palette, CheckCircle2, Info, ZoomIn, X } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PlainProductSelectionPopup from '@/components/products/PlainProductSelectionPopup';
import FabricVariantPopup from '@/components/products/FabricVariantPopup';
import DynamicForm from '@/components/products/DynamicForm';
import { FormField } from '@/components/admin/FormBuilder';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { IndianRupee } from 'lucide-react';
import { customProductsApi, cartApi, wishlistApi, customConfigApi, productsApi } from '@/lib/api';
import { guestCart } from '@/lib/guestCart';
import { usePrice } from '@/lib/currency';

const CustomProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { format } = usePrice();

  const cartItemId = searchParams.get('cartItemId') || (location.state as any)?.cartItemId;
  
  // This is always a custom design page
  const isCustomDesign = true;
  
  // Get custom config from backend
  const { data: customConfig } = useQuery({
    queryKey: ['customConfig'],
    queryFn: () => customConfigApi.getPublicConfig(),
  });

  const isLoggedIn = !!localStorage.getItem('authToken');
  const getGuestIdentifier = () => {
    if (isLoggedIn) return null;
    let g = localStorage.getItem('guestId');
    if (!g) {
      g = `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem('guestId', g);
    }
    return g;
  };
  const guestId = getGuestIdentifier();

  // Resolve cart item when editing from cart
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.getCart(),
    enabled: !!cartItemId && isLoggedIn,
  });
  const resolvedCartItem = (() => {
    if (!cartItemId) return null;
    if (isLoggedIn && cartData?.items) {
      const found = cartData.items.find((i: any) => String(i.id) === String(cartItemId));
      return found || null;
    }
    if (!isLoggedIn) {
      const items = guestCart.getItems();
      return items.find((i) => i.id === cartItemId) || null;
    }
    return null;
  })();
  const isEditFromCart = !!cartItemId && !!resolvedCartItem;

  // Get custom product from API if ID is in URL
  
  // Get user email from token if logged in
  const getUserEmailFromToken = () => {
    if (!isLoggedIn) return null;
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.email || null;
    } catch {
      return null;
    }
  };
  
  // Determine which userEmail to use for fetching
  // If logged in, use email from token (products created by logged-in users use their email)
  // If not logged in, use guestId (products created by guests use guestId)
  const userEmailForFetch = isLoggedIn ? getUserEmailFromToken() : guestId;
  
  const { data: customProduct, isLoading: loadingProduct, error: productError } = useQuery({
    queryKey: ['customProduct', id, userEmailForFetch, isLoggedIn],
    queryFn: () => {
      // Pass userEmail: email from token if logged in, guestId if not logged in
      // Backend will use auth token if available, otherwise use the userEmail parameter
      return customProductsApi.getById(Number(id!), userEmailForFetch || undefined);
    },
    enabled: !!id,
    retry: 1, // Retry once
  });
  
  // Fallback to location.state; when editing from cart, prefer cart's design URL
  const designUrl = (isEditFromCart && (resolvedCartItem as any)?.uploadedDesignUrl)
    ? (resolvedCartItem as any).uploadedDesignUrl
    : (customProduct?.designUrl || (location.state as any)?.designUrl);
  const customProductId = customProduct?.id || (id ? Number(id) : null);
  const isTemporary = customProduct?.isSaved !== true;
  
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

  // Config variants from Make Your Own config (same shape as ProductDetail effectiveVariants)
  const effectiveConfigVariants = useMemo(() => {
    if (!customConfig?.variants || customConfig.variants.length === 0) return [];
    return customConfig.variants.map((v: any) => ({
      id: String(v.id ?? `variant-${v.displayOrder ?? 0}`),
      type: v.type || '',
      name: v.name || '',
      unit: v.unit || '',
      frontendId: v.frontendId || '',
      options: (v.options || []).map((opt: any) => ({
        id: String(opt.id ?? `opt-${opt.displayOrder ?? 0}`),
        value: opt.value || '',
        frontendId: opt.frontendId || '',
        priceModifier: Number(opt.priceModifier || 0),
      })),
    }));
  }, [customConfig?.variants]);

  // Track if component is mounted and product is loaded
  const isMountedRef = useRef(true);
  const productLoadedRef = useRef(false);
  const unsavedCleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Track when product is actually loaded
  useEffect(() => {
    if (customProduct && customProduct.id) {
      productLoadedRef.current = true;
    }
  }, [customProduct]);
  
  // Auto-delete unsaved product when user leaves (only on actual page unload or navigation away)
  useEffect(() => {
    // Only set up cleanup if we have a valid product ID, it's temporary, and product is loaded
    if (!customProductId || !isTemporary || !productLoadedRef.current) {
      return;
    }
    
    const handleBeforeUnload = () => {
      const guestId = getGuestIdentifier();
      // Delete unsaved product when user leaves the page
      if (guestId || localStorage.getItem('authToken')) {
        customProductsApi.deleteUnsaved(customProductId, guestId || undefined).catch(() => {
          // Ignore errors on page unload
        });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (unsavedCleanupTimeoutRef.current) {
        clearTimeout(unsavedCleanupTimeoutRef.current);
        unsavedCleanupTimeoutRef.current = null;
      }
      // Only delete on actual unmount (user navigates away), after a short delay
      unsavedCleanupTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current && productLoadedRef.current) {
          const guestId = getGuestIdentifier();
          if (guestId || localStorage.getItem('authToken')) {
            customProductsApi.deleteUnsaved(customProductId, guestId || undefined).catch(() => {});
          }
        }
      }, 1000);
    };
  }, [customProductId, isTemporary, customProduct]);
  
  // Check if product loaded successfully (skip when editing from cart – design comes from cart)
  useEffect(() => {
    if (cartItemId) return; // editing from cart: design may come from cart item
    if (!loadingProduct && !designUrl && id) {
      const timeoutId = setTimeout(() => {
        if (!designUrl) {
          toast.error('Product not found. Please upload your design again.');
          navigate('/make-your-own');
        }
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [designUrl, loadingProduct, id, navigate, cartItemId]);

  const [selectedImage, setSelectedImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  // Reset zoom scale when image changes
  useEffect(() => {
    if (zoomImage) {
      setZoomScale(1);
    }
  }, [zoomImage]);
  
  // Design Product States (same as normal Design Product)
  const [showPlainProductSelection, setShowPlainProductSelection] = useState(false);
  const [showFabricVariant, setShowFabricVariant] = useState(false);
  const [selectedPlainProductId, setSelectedPlainProductId] = useState<string | null>(null);
  const [fabricSelectionData, setFabricSelectionData] = useState<any>(null);
  const [metersQuantity, setMetersQuantity] = useState(1);

  // Config variant selections (variantId -> optionId) from customConfig.variants
  const [selectedConfigVariants, setSelectedConfigVariants] = useState<Record<string, string>>({});

  // Fetch selected plain product (fabric) for Make Your Own fabric popup
  const { data: selectedFabricProduct } = useQuery({
    queryKey: ['plainProduct', selectedPlainProductId],
    queryFn: () => productsApi.getById(Number(selectedPlainProductId!)),
    enabled: !!selectedPlainProductId,
  });

  // Custom Form State (only used when customConfig.formFields has items)
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({});

  // Normalized field id for form data keys (align with DynamicForm / ProductDetail)
  const getFieldId = (f: { id?: string | number; displayOrder?: number }, index: number) =>
    String(f.id ?? f.displayOrder ?? index);

  // True when all required custom form fields are filled (align with DynamicForm.validateField)
  const requiredFieldsFilled = useMemo(() => {
    const required = customFormFields.filter((f: any) => f.required);
    if (required.length === 0) return true;
    return required.every((f: any, i: number) => {
      const id = getFieldId(f, i);
      const v = customFormData[id];
      if (v == null || v === '') return false;
      if (typeof v === 'string' && v.trim() === '') return false;
      return true;
    });
  }, [customFormFields, customFormData]);

  // Combined price per meter (design + fabric per m + config variant per m); total = combinedPrice * metersQuantity
  const combinedPrice = useMemo(() => {
    const fabricPerMeter = fabricSelectionData?.totalPrice ?? 0;
    let configVariantPerMeter = 0;
    if (effectiveConfigVariants.length > 0) {
      effectiveConfigVariants.forEach((variant: any) => {
        const optionId = selectedConfigVariants[String(variant.id)];
        if (optionId && variant.options) {
          const opt = variant.options.find((o: any) => String(o.id) === optionId);
          if (opt && opt.priceModifier) configVariantPerMeter += Number(opt.priceModifier);
        }
      });
    }
    return DESIGN_PRICE + fabricPerMeter + configVariantPerMeter;
  }, [DESIGN_PRICE, fabricSelectionData, effectiveConfigVariants, selectedConfigVariants]);

  const handlePlainProductSelect = (productId: string) => {
    didPreloadFromCartRef.current = false; // user chose fabric; allow popup to open
    setSelectedPlainProductId(productId);
    setShowPlainProductSelection(false);
  };

  const skipFabricPopupOpenRef = useRef(false);
  const preloadFabricDoneRef = useRef(false);
  const didPreloadFromCartRef = useRef(false);

  // Open fabric variant popup once the selected plain product (fabric) has been fetched (unless preloading from cart)
  useEffect(() => {
    if (didPreloadFromCartRef.current) return;
    if (skipFabricPopupOpenRef.current) {
      skipFabricPopupOpenRef.current = false;
      return;
    }
    if (selectedPlainProductId && selectedFabricProduct) {
      setShowFabricVariant(true);
    }
  }, [selectedPlainProductId, selectedFabricProduct]);

  // Preload from cart item when editing from cart
  useEffect(() => {
    if (!isEditFromCart || !resolvedCartItem) return;
    const item = resolvedCartItem as any;

    if (item.fabricId) {
      didPreloadFromCartRef.current = true;
      skipFabricPopupOpenRef.current = true;
      setSelectedPlainProductId(String(item.fabricId));
    }

    const vs = item.variantSelections || {};
    const configVar: Record<string, string> = {};
    effectiveConfigVariants.forEach((v: any) => {
      const key = v.frontendId || String(v.id);
      const sel = vs[key];
      const optId = sel?.optionId ?? sel?.optionValue;
      if (optId != null) configVar[String(v.id)] = String(optId);
    });
    if (Object.keys(configVar).length) setSelectedConfigVariants(configVar);

    if (item.customFormData && typeof item.customFormData === 'object' && Object.keys(item.customFormData).length) {
      setCustomFormData(item.customFormData);
    }
  }, [isEditFromCart, resolvedCartItem, effectiveConfigVariants]);

  // Preload fabricSelectionData once fabric is loaded (edit-from-cart); quantity = meters
  useEffect(() => {
    if (preloadFabricDoneRef.current) return;
    if (!isEditFromCart || !resolvedCartItem || !selectedFabricProduct || !selectedPlainProductId) return;
    const item = resolvedCartItem as any;
    const meters = item.quantity ?? 1;
    const fabricTotal = item.fabricPrice != null ? Number(item.fabricPrice) : 0;
    const fabricPerMeter = meters > 0 ? fabricTotal / meters : 0;

    const fabricVar: Record<string, string> = {};
    const vs = item.variantSelections || {};
    const variants = (selectedFabricProduct as any)?.variants || [];
    variants.forEach((v: any) => {
      const key = v.frontendId || String(v.id);
      const sel = vs[key];
      const optId = sel?.optionId ?? (item.variants && item.variants[key]);
      if (optId != null) fabricVar[String(v.id)] = String(optId);
    });

    setFabricSelectionData({
      fabricId: selectedPlainProductId,
      quantity: 1,
      totalPrice: fabricPerMeter,
      selectedVariants: fabricVar,
    });
    setMetersQuantity(meters);
    preloadFabricDoneRef.current = true;
  }, [isEditFromCart, resolvedCartItem, selectedFabricProduct, selectedPlainProductId]);

  const handleFabricVariantComplete = (data: any) => {
    setFabricSelectionData({ ...data, quantity: 1, totalPrice: data.totalPrice });
    setShowFabricVariant(false);
  };

  const handleCustomFormSubmit = (formData: Record<string, any>) => {
    setCustomFormData(formData);
    toast.success('Details saved.');
  };

  const buildCartPayload = () => {
    const variantSelections: Record<string, any> = {};
    effectiveConfigVariants.forEach((variant: any) => {
      const selectedOptionId = selectedConfigVariants[String(variant.id)];
      if (selectedOptionId && variant.options) {
        const selectedOption = variant.options.find((o: any) => String(o.id) === selectedOptionId);
        if (selectedOption) {
          const variantKey = variant.frontendId || String(variant.id);
          variantSelections[variantKey] = {
            variantId: variant.id,
            variantFrontendId: variant.frontendId || null,
            variantName: variant.name,
            variantType: variant.type,
            variantUnit: variant.unit || null,
            optionId: selectedOption.id,
            optionFrontendId: selectedOption.frontendId || null,
            optionValue: selectedOption.value,
            priceModifier: selectedOption.priceModifier || 0,
          };
        }
      }
    });
    const fabricPerMeter = fabricSelectionData!.totalPrice;
    const fabricTotal = fabricPerMeter * metersQuantity;
    return {
      productType: 'CUSTOM' as const,
      productId: customProductId || 0,
      productName: (customFormData && (customFormData['field-1'] ?? customFormData['field-0'])) || 'Custom Studio Sara Piece',
      productImage: designUrl,
      designPrice: DESIGN_PRICE,
      fabricId: Number(fabricSelectionData!.fabricId),
      fabricPrice: fabricTotal,
      quantity: metersQuantity,
      unitPrice: combinedPrice,
      totalPrice: combinedPrice * metersQuantity,
      variants: fabricSelectionData!.selectedVariants,
      variantSelections: Object.keys(variantSelections).length > 0 ? variantSelections : undefined,
      customFormData: { ...customFormData, fabricMeters: metersQuantity },
      uploadedDesignUrl: designUrl,
      customProductId: customProductId ?? undefined,
    };
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
        saveCustomProductMutation.mutate();
      }
      toast.success('Custom product added to cart and saved!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add to cart');
    },
  });

  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: any }) =>
      cartApi.updateItemFull(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart updated');
      navigate('/cart');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update cart');
    },
  });

  const [showAddAsNewConfirm, setShowAddAsNewConfirm] = useState(false);

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      toast.error('Please login to add items to cart');
      navigate('/login', { state: { returnTo: `/custom-product/${id || customProductId}` } });
      return;
    }
    if (!fabricSelectionData) {
      toast.error('Please select a fabric first');
      return;
    }
    if (!requiredFieldsFilled) {
      toast.error('Please fill all required fields');
      return;
    }
    addToCartMutation.mutate(buildCartPayload());
  };

  const handleUpdateCartItem = () => {
    if (!cartItemId || !fabricSelectionData || !requiredFieldsFilled) return;
    const payload = buildCartPayload();
    if (isLoggedIn) {
      updateCartItemMutation.mutate({ itemId: Number(cartItemId), payload });
    } else {
      guestCart.updateItemFull(String(cartItemId), payload);
      toast.success('Cart updated');
      navigate('/cart');
      window.dispatchEvent(new Event('guestCartUpdated'));
    }
  };

  const handleAddAsNew = async (removeOriginal: boolean) => {
    setShowAddAsNewConfirm(false);
    if (!fabricSelectionData || !requiredFieldsFilled) return;
    const payload = buildCartPayload();
    try {
      if (isLoggedIn) {
        await cartApi.addItem(payload);
        if (customProductId) saveCustomProductMutation.mutate();
        if (removeOriginal && cartItemId) {
          await cartApi.removeItem(Number(cartItemId));
        }
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        toast.success(removeOriginal ? 'Added as new; original removed from cart.' : 'Added as new.');
      } else {
        guestCart.addItem(payload);
        if (removeOriginal && cartItemId) guestCart.removeItem(cartItemId);
        toast.success(removeOriginal ? 'Added as new; original removed from cart.' : 'Added as new.');
        window.dispatchEvent(new Event('guestCartUpdated'));
      }
      navigate('/cart');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add to cart');
    }
  };

  // Add to wishlist mutation (wishlist API takes productType + productId)
  const addToWishlistMutation = useMutation({
    mutationFn: () => wishlistApi.addItem('CUSTOM', Number(customProductId!)),
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
    if (!isLoggedIn) {
      toast.error('Please log in to add items to your wishlist');
      navigate('/login', { state: { returnTo: `/custom-product/${id || customProductId}` } });
      return;
    }
    if (!fabricSelectionData) {
      toast.error('Please select a fabric first');
      return;
    }
    if (!requiredFieldsFilled) {
      toast.error('Please fill all required fields');
      return;
    }

    addToWishlistMutation.mutate();
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
      {isEditFromCart && (
        <section className="w-full bg-primary/5 py-4 border-b border-primary/10">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              Editing item from cart. Update the cart item or add as new.
            </div>
            <Link to="/cart" className="text-sm text-primary hover:underline">
              Back to cart
            </Link>
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
                    className="aspect-square rounded-2xl overflow-hidden bg-secondary/30 border border-border shadow-md relative group cursor-zoom-in"
                    onClick={() => setZoomImage(displayImages[selectedImage])}
                  >
                    <img
                      src={displayImages[selectedImage]}
                      alt={selectedImage === 0 ? "Your custom design" : `Mockup ${selectedImage}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
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
                    
                    {/* Price Display: per meter + total */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-4">
                        <span className="font-cursive text-4xl text-primary">{format(combinedPrice * metersQuantity)}</span>
                      </div>
                      {fabricSelectionData && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Per meter: {format(combinedPrice)}/m</p>
                          <p>Design: {format(DESIGN_PRICE)}/m · Fabric: {format(fabricSelectionData.totalPrice)}/m</p>
                          {(() => {
                            let modPerMeter = 0;
                            effectiveConfigVariants.forEach((v: any) => {
                              const oid = selectedConfigVariants[String(v.id)];
                              const opt = oid && v.options ? v.options.find((o: any) => String(o.id) === oid) : null;
                              if (opt && opt.priceModifier) modPerMeter += Number(opt.priceModifier);
                            });
                            return modPerMeter > 0 ? <p>Options: {format(modPerMeter)}/m</p> : null;
                          })()}
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
                            {format(fabricSelectionData.totalPrice)}/meter (1-meter base)
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
                      {/* Quantity (Meters) */}
                      <div className="pt-3 border-t border-border/50">
                        <h4 className="font-medium text-sm mb-2">Quantity (Meters)</h4>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-border rounded-full">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full w-10 h-10"
                              onClick={() => setMetersQuantity((q) => Math.max(1, q - 1))}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-12 text-center font-medium text-sm">{metersQuantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full w-10 h-10"
                              onClick={() => setMetersQuantity((q) => q + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Total: {format(combinedPrice * metersQuantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Config variants (from Make Your Own config) */}
                  {effectiveConfigVariants.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-bold mb-4 text-lg">Select Options</h4>
                      {effectiveConfigVariants.map((variant: any) => (
                        <div key={variant.id} className="space-y-2">
                          <Label className="text-sm font-medium">
                            {variant.name}
                            {variant.unit && <span className="text-muted-foreground ml-1">({variant.unit})</span>}
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {variant.options && variant.options.map((option: any) => {
                              const isSelected = selectedConfigVariants[String(variant.id)] === String(option.id);
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedConfigVariants((prev) => ({
                                      ...prev,
                                      [String(variant.id)]: String(option.id),
                                    }));
                                  }}
                                  className={cn(
                                    'px-4 py-2 rounded-lg border-2 transition-all text-sm',
                                    isSelected
                                      ? 'border-primary bg-primary/10 text-primary font-medium'
                                      : 'border-border hover:border-primary/50'
                                  )}
                                >
                                  {option.value}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Custom Form: only when config has form fields */}
                  {fabricSelectionData && customFormFields.length > 0 && (
                    <div className="space-y-4 p-6 border border-border rounded-lg bg-white">
                      <h4 className="font-medium text-lg">Additional information</h4>
                      <p className="text-sm text-muted-foreground">
                        Fill the details below, then click Add to Cart.
                      </p>
                      <DynamicForm
                        fields={customFormFields}
                        onSubmit={handleCustomFormSubmit}
                        initialData={customFormData}
                      />
                      {Object.keys(customFormData).length > 0 && (
                        <p className="text-sm font-medium text-green-700">Details saved ✓</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4 flex-wrap pt-4">
                    {isEditFromCart ? (
                      <>
                        <Button
                          size="lg"
                          onClick={handleUpdateCartItem}
                          disabled={!fabricSelectionData || !requiredFieldsFilled || updateCartItemMutation.isPending}
                          className="flex-1 min-w-[180px] btn-primary gap-3 h-14 text-base"
                        >
                          {updateCartItemMutation.isPending ? 'Updating…' : 'Update cart item'}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => setShowAddAsNewConfirm(true)}
                          disabled={!fabricSelectionData || !requiredFieldsFilled}
                          className="flex-1 min-w-[180px] gap-3 h-14 text-base"
                        >
                          <ShoppingBag className="w-5 h-5" />
                          Add as new
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="lg"
                        onClick={handleAddToCart}
                        disabled={!fabricSelectionData || !requiredFieldsFilled}
                        className="flex-1 min-w-[220px] btn-primary gap-3 h-14 text-base"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        {customConfig?.addToCartButtonText || 'Add to Cart'}
                      </Button>
                    )}
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full w-14 h-14"
                      onClick={handleAddToWishlist}
                      disabled={!isLoggedIn || isSaved || !fabricSelectionData || !requiredFieldsFilled}
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
              fabric={
                selectedFabricProduct
                  ? {
                      id: String(selectedFabricProduct.id),
                      name: selectedFabricProduct.name || 'Selected Fabric',
                      image: selectedFabricProduct.images?.[0] || selectedFabricProduct.media?.[0]?.url || '',
                      pricePerMeter: Number(selectedFabricProduct.pricePerMeter || selectedFabricProduct.price || 0),
                      status: (selectedFabricProduct.status?.toLowerCase() === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
                    }
                  : null
              }
              variants={
                selectedFabricProduct?.variants?.map((v: any) => ({
                  id: String(v.id),
                  type: v.type || '',
                  name: v.name || '',
                  options: (v.options?.map((opt: any) => ({
                    id: String(opt.id),
                    value: opt.value || '',
                    priceModifier: Number(opt.priceModifier || 0),
                  })) ?? []),
                })) ?? []
              }
              customFields={selectedFabricProduct?.customFields ?? []}
              onComplete={handleFabricVariantComplete}
            />
          )}
        </>
      )}

      {/* Image Zoom Modal */}
      <Dialog open={!!zoomImage} onOpenChange={(open) => !open && setZoomImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            {zoomImage && (
              <div 
                className="relative w-full h-full overflow-auto flex items-center justify-center p-4"
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY > 0 ? -0.1 : 0.1;
                  setZoomScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
                }}
                onTouchStart={(e) => {
                  if (e.touches.length === 2) {
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    const distance = Math.sqrt(
                      Math.pow(touch2.clientX - touch1.clientX, 2) +
                      Math.pow(touch2.clientY - touch1.clientY, 2)
                    );
                    (e.target as HTMLElement).setAttribute('data-initial-distance', distance.toString());
                  }
                }}
                onTouchMove={(e) => {
                  if (e.touches.length === 2) {
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    const currentDistance = Math.sqrt(
                      Math.pow(touch2.clientX - touch1.clientX, 2) +
                      Math.pow(touch2.clientY - touch1.clientY, 2)
                    );
                    const initialDistance = parseFloat(
                      (e.target as HTMLElement).getAttribute('data-initial-distance') || '0'
                    );
                    if (initialDistance > 0) {
                      const scaleChange = currentDistance / initialDistance;
                      setZoomScale(prev => Math.max(0.5, Math.min(3, prev * scaleChange)));
                      (e.target as HTMLElement).setAttribute('data-initial-distance', currentDistance.toString());
                    }
                  }
                }}
              >
                <img
                  src={zoomImage}
                  alt="Zoomed product image"
                  className="max-w-full max-h-[90vh] object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoomScale})` }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add as new – remove original? */}
      <Dialog open={showAddAsNewConfirm} onOpenChange={setShowAddAsNewConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add as new</DialogTitle>
            <DialogDescription>
              Add this configuration as a new cart item. Do you want to remove the original item from your cart?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => handleAddAsNew(false)}>
              No, add only
            </Button>
            <Button onClick={() => handleAddAsNew(true)}>
              Yes, remove original
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CustomProductDetail;
