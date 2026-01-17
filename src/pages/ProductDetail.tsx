import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Share2, Minus, Plus, ChevronRight, Download, Palette, Package, FileJson, IndianRupee, Video, Loader2, Calculator } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PlainProductSelectionPopup from '@/components/products/PlainProductSelectionPopup';
import FabricVariantPopup, { FabricVariant } from '@/components/products/FabricVariantPopup';
import PriceBreakdownPopup from '@/components/products/PriceBreakdownPopup';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { productsApi, cartApi, wishlistApi, customConfigApi } from '@/lib/api';
import { guestCart } from '@/lib/guestCart';
import DynamicForm from '@/components/products/DynamicForm';
import { FormField } from '@/components/admin/FormBuilder';

// Product Type
type ProductType = 'PLAIN' | 'DESIGNED' | 'DIGITAL';

// Detail Section
export interface DetailSection {
  id: string;
  title: string;
  content: string;
}

// Removed mock data - now using API for all product data

const ProductDetail = () => {
  const { id, slug } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Get identifier from either id or slug param
  const identifier = id || slug;
  
  // Check if identifier is a number (ID) or string (slug)
  const isNumeric = identifier && /^\d+$/.test(identifier);
  
  // Fetch product from API - support both ID and slug
  const { data: apiProduct, isLoading: productLoading, error: productError } = useQuery({
    queryKey: ['product', identifier],
    queryFn: () => {
      if (isNumeric) {
        return productsApi.getById(Number(identifier!));
      } else {
        return productsApi.getBySlug(identifier!);
      }
    },
    enabled: !!identifier,
    retry: 1,
  });
  
  // Check if product is in wishlist
  const productType = apiProduct?.type || 'PLAIN';
  const productId = apiProduct?.id;
  const { data: wishlistCheck } = useQuery({
    queryKey: ['wishlist-check', productType, productId],
    queryFn: () => wishlistApi.checkItem(productType, productId!),
    enabled: !!productId && !!localStorage.getItem('authToken'),
  });
  
  const isInWishlist = wishlistCheck?.inWishlist || false;
  
  // Fetch related products from same category (excluding current product)
  const { data: relatedProductsData } = useQuery({
    queryKey: ['related-products', apiProduct?.categoryId, apiProduct?.id],
    queryFn: () => {
      if (!apiProduct?.categoryId) return [];
      return productsApi.getAll({ 
        status: 'ACTIVE', 
        categoryId: apiProduct.categoryId 
      });
    },
    enabled: !!apiProduct?.categoryId,
    select: (data) => {
      // Filter out current product and limit to 4 products
      return data
        .filter((p: any) => p.id !== apiProduct?.id)
        .slice(0, 4)
        .map((p: any) => ({
          id: String(p.id),
          name: p.name || 'Untitled Product',
          price: Number(p.price || 0),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
          image: p.images?.[0] || '',
          category: p.categoryName || '',
          isNew: p.isNew,
          isSale: p.isSale,
        }));
    },
  });
  
  const relatedProducts = relatedProductsData || [];
  
  // Transform API product to component format
  const product = useMemo(() => {
    if (!apiProduct) return null;
    
    try {
      return {
        id: String(apiProduct.id || ''),
        type: (apiProduct.type || 'PLAIN') as ProductType,
        name: apiProduct.name || 'Untitled Product',
        designPrice: apiProduct.designPrice,
        price: apiProduct.price,
        basePrice: apiProduct.price,
        pricePerMeter: apiProduct.pricePerMeter,
        images: apiProduct.images || [],
        media: apiProduct.media || (apiProduct.images ? apiProduct.images.map((url: string, idx: number) => ({ url, type: 'image' as const, displayOrder: idx })) : []),
        category: apiProduct.categoryName || '',
        categoryId: apiProduct.categoryId,
        description: apiProduct.description || '',
        detailSections: apiProduct.detailSections || [],
        customFields: apiProduct.customFields || [],
        variants: apiProduct.variants || [],
        recommendedPlainProductIds: apiProduct.recommendedFabricIds || [],
        recommendedFabrics: apiProduct.recommendedFabrics || [],
        pricingSlabs: apiProduct.pricingSlabs || [],
        plainProduct: apiProduct.plainProduct,
        fileUrl: apiProduct.fileUrl,
        isNew: apiProduct.isNew,
        isSale: apiProduct.isSale,
        inStock: apiProduct.status === 'ACTIVE',
        originalPrice: apiProduct.originalPrice,
      };
    } catch (error) {
      console.error('Error transforming product:', error, apiProduct);
      return null;
    }
  }, [apiProduct]);

  // Debug logging
  useEffect(() => {
    if (apiProduct) {
      console.log('Product loaded:', { 
        id: apiProduct.id, 
        name: apiProduct.name, 
        slug: apiProduct.slug,
        type: apiProduct.type,
        status: apiProduct.status,
        hasImages: !!apiProduct.images?.length,
        hasMedia: !!apiProduct.media?.length
      });
    }
    if (product) {
      console.log('Product transformed successfully:', product.name);
    }
  }, [apiProduct, product]);

  const [selectedMedia, setSelectedMedia] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  // Custom Fields and Variants States
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | File | null>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({}); // variantId -> optionId
  
  // Design Product States
  const [showPlainProductSelection, setShowPlainProductSelection] = useState(false);
  const [showFabricVariant, setShowFabricVariant] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null);
  const [selectedFabric, setSelectedFabric] = useState<any>(null);
  const [selectedFabricVariants, setSelectedFabricVariants] = useState<Record<string, string>>({});
  const [fabricQuantity, setFabricQuantity] = useState(1);
  const [fabricPricePerMeter, setFabricPricePerMeter] = useState<number>(0);
  const [combinedPrice, setCombinedPrice] = useState<number | null>(null);
  
  // Custom form fields from config (for user-uploaded products)
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFormFields, setCustomFormFields] = useState<FormField[]>([]);
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({});
  
  // Fetch custom config for designed products
  const { data: customConfig } = useQuery({
    queryKey: ['customConfig'],
    queryFn: () => customConfigApi.getPublicConfig(),
    enabled: product?.type === 'DESIGNED',
  });
  
  // Determine if this is a custom product (created from user upload)
  // Custom products inherit everything from config
  // Custom products typically don't have a designId (they're created from user uploads)
  const isCustomProduct = useMemo(() => {
    if (!product || product.type !== 'DESIGNED') return false;
    
    // Check if product doesn't have designId - user-uploaded products don't link to a design
    const hasDesignId = apiProduct?.designId != null;
    
    // If product has designId, it's a regular DESIGNED product (not custom)
    if (hasDesignId) return false;
    
    // If no designId, it's likely a custom product (user upload)
    // Additional checks: slug pattern or name matching config
    const slug = apiProduct?.slug || '';
    const hasTimestampSlug = slug.match(/-\d{13}$/); // Pattern from createDesignedProductFromUpload
    
    const matchesConfigTitle = customConfig?.pageTitle && 
      product.name && 
      product.name.toLowerCase().includes(customConfig.pageTitle.toLowerCase());
    
    // No designId means it's a custom product
    return !hasDesignId || hasTimestampSlug || matchesConfigTitle;
  }, [product, apiProduct, customConfig]);
  
  // Use config data for custom products - Single Source of Truth
  const effectiveVariants = useMemo(() => {
    if (isCustomProduct && customConfig?.variants && customConfig.variants.length > 0) {
      // Use variants from config
      return customConfig.variants.map((v: any) => ({
        id: String(v.id || `variant-${v.displayOrder || 0}`),
        type: v.type || '',
        name: v.name || '',
        unit: v.unit || '',
        frontendId: v.frontendId || '',
        options: (v.options || []).map((opt: any) => ({
          id: String(opt.id || `opt-${opt.displayOrder || 0}`),
          value: opt.value || '',
          frontendId: opt.frontendId || '',
          priceModifier: opt.priceModifier || 0,
        })),
      }));
    }
    // Fallback to product variants
    return product?.variants || [];
  }, [isCustomProduct, customConfig?.variants, product?.variants]);
  
  const effectivePricingSlabs = useMemo(() => {
    if (isCustomProduct && customConfig?.pricingSlabs && customConfig.pricingSlabs.length > 0) {
      // Use pricing slabs from config
      return customConfig.pricingSlabs;
    }
    // Fallback to product pricing slabs
    return product?.pricingSlabs || [];
  }, [isCustomProduct, customConfig?.pricingSlabs, product?.pricingSlabs]);
  
  const effectiveRecommendedFabrics = useMemo(() => {
    if (isCustomProduct && customConfig?.recommendedFabricIds && customConfig.recommendedFabricIds.length > 0) {
      // Use recommended fabrics from config
      return customConfig.recommendedFabricIds;
    }
    // Fallback to product recommended fabrics
    return product?.recommendedPlainProductIds || [];
  }, [isCustomProduct, customConfig?.recommendedFabricIds, product?.recommendedPlainProductIds]);
  
  // Update custom form fields when config loads
  useEffect(() => {
    if (customConfig && customConfig.formFields && product?.type === 'DESIGNED') {
      const fields: FormField[] = customConfig.formFields.map((field: any) => ({
        id: String(field.id || `field-${field.displayOrder || 0}`),
        type: field.type || 'text',
        label: field.label || '',
        placeholder: field.placeholder || '',
        required: field.required || false,
        min: field.minValue,
        max: field.maxValue,
        options: field.options || [],
      }));
      setCustomFormFields(fields);
    }
  }, [customConfig, product?.type]);

  // Fetch selected fabric product data
  const { data: fabricProduct } = useQuery({
    queryKey: ['fabricProduct', selectedFabricId],
    queryFn: () => productsApi.getById(Number(selectedFabricId!)),
    enabled: !!selectedFabricId && product?.type === 'DESIGNED',
  });

  // Calculate price per meter based on quantity and pricing slabs
  // Discount-based slab system: Slabs define discount rules, not absolute prices
  // Works for ANY fabric selected - discount applies to final fabric price (base + variants)
  // 
  // Slab Types:
  // - FIXED_AMOUNT: Fixed discount per meter (e.g., ₹10 less per meter)
  // - PERCENTAGE: Percentage discount (e.g., 10% off)
  //
  // Formula:
  // Final Price = Final Fabric Price (base + variants) - Slab Discount
  //
  // Example:
  // - Fabric base: ₹100/m, Variant: +₹50/m → Final fabric price: ₹150/m
  // - Slab: 11-50m → ₹10 discount (FIXED_AMOUNT)
  // - Quantity: 15m
  // - Result: ₹150 - ₹10 = ₹140/m
  const calculatePricePerMeter = (quantity: number, finalFabricPrice: number, slabs?: any[]) => {
    if (!slabs || slabs.length === 0) {
      return finalFabricPrice; // No slabs, use final fabric price
    }
    
    // Sort slabs by minQuantity to ensure correct order
    const sortedSlabs = [...slabs].sort((a, b) => (a.minQuantity || 1) - (b.minQuantity || 1));
    
    // Find the matching slab for this quantity
    for (const slab of sortedSlabs) {
      const minQty = slab.minQuantity || 1;
      const maxQty = slab.maxQuantity;
      
      if (quantity >= minQty && (maxQty === null || maxQty === undefined || quantity <= maxQty)) {
        // Apply discount based on slab type
        const discountType = slab.discountType || 'FIXED_AMOUNT'; // Default to FIXED_AMOUNT for backward compatibility
        const discountValue = Number(slab.discountValue || slab.pricePerMeter || 0); // Support legacy pricePerMeter
        
        if (discountType === 'PERCENTAGE') {
          // Percentage discount: reduce by X% from final fabric price
          const discountAmount = (finalFabricPrice * discountValue) / 100;
          return finalFabricPrice - discountAmount;
        } else {
          // FIXED_AMOUNT: reduce by fixed amount per meter
          // For legacy support: if pricePerMeter is set and discountValue is 0, calculate discount
          if (discountValue === 0 && slab.pricePerMeter) {
            // Legacy: pricePerMeter is the final price, calculate discount
            const legacyFinalPrice = Number(slab.pricePerMeter);
            return legacyFinalPrice; // Use legacy absolute price
          } else {
            // New system: discountValue is the discount amount
            return finalFabricPrice - discountValue;
          }
        }
      }
    }
    
    // If no slab matches, use final fabric price
    return finalFabricPrice;
  };

  // Update combined price for DESIGNED products when variants change
  // IMPORTANT: fabricPricePerMeter already includes fabric variants (set in handleFabricVariantComplete)
  // Slab discount applies to this final fabric price (base + variants)
  useEffect(() => {
    if (product && product.type === 'DESIGNED' && selectedFabricId) {
      const baseDesignPrice = product.designPrice || 0;
      
      // fabricPricePerMeter is already the final fabric price per meter (base + fabric variants)
      // Apply slab discount to this final price
      const finalFabricPricePerMeter = fabricPricePerMeter; // Already includes variants
      const effectivePricePerMeter = effectivePricingSlabs && effectivePricingSlabs.length > 0
        ? calculatePricePerMeter(fabricQuantity, finalFabricPricePerMeter, effectivePricingSlabs)
        : finalFabricPricePerMeter;
      
      const fabricTotalPrice = effectivePricePerMeter * fabricQuantity;
      
      // Add product variant price modifiers (these are for the design product, not fabric)
      let variantModifier = 0;
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant: any) => {
          const selectedOptionId = selectedVariants[String(variant.id)];
          if (selectedOptionId && variant.options) {
            const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
            if (selectedOption && selectedOption.priceModifier) {
              variantModifier += selectedOption.priceModifier * fabricQuantity;
            }
          }
        });
      }
      
      setCombinedPrice(baseDesignPrice + fabricTotalPrice + variantModifier);
    }
  }, [product, selectedFabricId, fabricPricePerMeter, fabricQuantity, selectedVariants]);

  // Calculate price for plain products (shown directly on page, no popup)
  const plainProductPrice = useMemo(() => {
    if (!product || product.type !== 'PLAIN') return 0;
    const basePrice = product.pricePerMeter || product.plainProduct?.pricePerMeter || product.price || 0;
    return basePrice * quantity;
  }, [product, quantity]);

  // Calculate final price with variants
  const finalPrice = useMemo(() => {
    if (!product) return 0;
    
    let basePrice = 0;
    if (product.type === 'DESIGNED') {
      basePrice = product.designPrice || 0;
    } else if (product.type === 'PLAIN') {
      basePrice = product.pricePerMeter || product.price || 0;
    } else if (product.type === 'DIGITAL') {
      basePrice = product.price || 0;
    }
    
    // Add variant price modifiers
    let variantModifier = 0;
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any) => {
        const selectedOptionId = selectedVariants[String(variant.id)];
        if (selectedOptionId && variant.options) {
          const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
          if (selectedOption && selectedOption.priceModifier) {
            variantModifier += selectedOption.priceModifier;
          }
        }
      });
    }
    
    const unitPrice = basePrice + variantModifier;
    return unitPrice * quantity;
  }, [product, selectedVariants, quantity]);

  const handleFabricSelect = (fabricId: string) => {
    setSelectedFabricId(fabricId);
    setSelectedFabricVariants({});
    setFabricQuantity(1);
    // Fabric data will be loaded via useQuery above
    // Show popup after a brief delay to allow data to load
    setTimeout(() => {
      setShowFabricVariant(true);
    }, 100);
  };

  // Update fabric data when fetched
  useEffect(() => {
    if (fabricProduct) {
      setSelectedFabric(fabricProduct);
      const price = fabricProduct.pricePerMeter || fabricProduct.price || 0;
      setFabricPricePerMeter(Number(price));
    }
  }, [fabricProduct]);

  const handleFabricVariantComplete = (data: {
    fabricId: string;
    selectedVariants: Record<string, string>;
    quantity: number;
    totalPrice: number;
  }) => {
    setSelectedFabricId(data.fabricId);
    setSelectedFabricVariants(data.selectedVariants);
    setFabricQuantity(data.quantity);
    
    // If custom form fields exist from config, show the form
    if (customFormFields.length > 0) {
      setShowCustomForm(true);
    }
    
    // Calculate combined price: Design Price + Fabric Price + Product Variant Modifiers
    const baseDesignPrice = product.designPrice || 0;
    
    // Add product variant price modifiers
    let variantModifier = 0;
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any) => {
        const selectedOptionId = selectedVariants[String(variant.id)];
        if (selectedOptionId && variant.options) {
          const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
          if (selectedOption && selectedOption.priceModifier) {
            variantModifier += selectedOption.priceModifier * data.quantity;
          }
        }
      });
    }
    
    const totalPrice = baseDesignPrice + data.totalPrice + variantModifier;
    setCombinedPrice(totalPrice);
    setFabricPricePerMeter(data.totalPrice / data.quantity);
    setShowFabricVariant(false);
  };

  // Validate required custom fields (both product customFields and config formFields)
  const validateCustomFields = (): boolean => {
    if (!product) return true;

    // Validate product customFields
    if (product.customFields) {
      for (const field of product.customFields) {
        if (field.isRequired) {
          const value = customFieldValues[String(field.id)];
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            toast.error(`Please fill in the required field: ${field.label}`);
            return false;
          }
        }
      }
    }
    
    // Validate custom form fields from config
    if (customFormFields.length > 0) {
      for (const field of customFormFields) {
        if (field.required) {
          const value = customFormData[field.id];
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            toast.error(`Please fill in the required field: ${field.label}`);
            return false;
          }
        }
      }
    }
    
    return true;
  };

  // Add to cart mutation (for logged-in users)
  const addToCartMutation = useMutation({
    mutationFn: (cartData: any) => cartApi.addItem(cartData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast.success('Product added to cart!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add product to cart');
    },
  } );

  // Fetch or create Digital Product from Design Product
  // Only for regular DESIGNED products, not custom products (user uploads)
  const { data: digitalProduct, isLoading: isLoadingDigital } = useQuery({
    queryKey: ['digitalProduct', productId],
    queryFn: () => productsApi.getDigitalFromDesign(Number(productId!)),
    enabled: product?.type === 'DESIGNED' && !!productId && !isCustomProduct,
    retry: false,
  });

  // Create Digital Product mutation (not used directly, but kept for reference)
  const createDigitalMutation = useMutation({
    mutationFn: (price?: number) => productsApi.createDigitalFromDesign(Number(productId!), price),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['digitalProduct', productId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create digital product');
    },
  });

  // Handle purchase design only
  const handlePurchaseDesignOnly = async () => {
    if (!productId || !product) return;
    
    try {
      let digitalProd = digitalProduct;
      
      // If digital product doesn't exist, create it
      if (!digitalProd) {
        try {
          digitalProd = await productsApi.createDigitalFromDesign(Number(productId), product.designPrice);
          queryClient.invalidateQueries({ queryKey: ['digitalProduct', productId] });
        } catch (error: any) {
          toast.error(error.message || 'Failed to create digital product');
          return;
        }
      }
      
      if (!digitalProd?.id) {
        toast.error('Digital product not available');
        return;
      }
      
      // Add digital product to cart
      const cartData = {
        productType: 'DIGITAL',
        productId: digitalProd.id,
        productName: digitalProd.name || `${product.name} (Digital Design)`,
        productImage: digitalProd.images?.[0] || product.images?.[0] || '',
        quantity: 1,
        unitPrice: digitalProd.price || product.designPrice || 0,
        totalPrice: digitalProd.price || product.designPrice || 0,
      };
      
      if (!isLoggedIn) {
        guestCart.addItem(cartData);
        toast.success('Digital design added to cart!');
        window.dispatchEvent(new Event('guestCartUpdated'));
      } else {
        addToCartMutation.mutate(cartData);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add digital design to cart');
    }
  };
  
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('authToken');

  // Wishlist mutations
  const addToWishlistMutation = useMutation({
    mutationFn: () => wishlistApi.addItem(productType, productId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', productType, productId] });
      toast.success('Added to wishlist!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add to wishlist');
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: () => wishlistApi.removeByProduct(productType, productId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', productType, productId] });
      toast.success('Removed from wishlist!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove from wishlist');
    },
  });

  const handleWishlistToggle = () => {
    if (!localStorage.getItem('authToken')) {
      toast.error('Please login to add items to wishlist');
      return;
    }
    
    if (isInWishlist) {
      removeFromWishlistMutation.mutate();
    } else {
      addToWishlistMutation.mutate();
    }
  };

  const handleAddToCart = () => {
    if (!selectedFabricId) {
      setShowPlainProductSelection(true);
      return;
    }
    
    // Validate required custom fields
    if (!validateCustomFields()) {
      return;
    }
    
    // Calculate combined price: Design Price + Fabric Price + Variant Modifiers
    const baseDesignPrice = product.designPrice || 0;
    // Calculate price per meter using slabs if available
    const effectivePricePerMeter = effectivePricingSlabs && effectivePricingSlabs.length > 0
      ? calculatePricePerMeter(fabricQuantity, fabricPricePerMeter, effectivePricingSlabs)
      : fabricPricePerMeter;
    
    const fabricTotalPrice = effectivePricePerMeter * fabricQuantity;
    
    // Add variant price modifiers
    let variantModifier = 0;
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any) => {
        const selectedOptionId = selectedVariants[String(variant.id)];
        if (selectedOptionId && variant.options) {
          const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
          if (selectedOption && selectedOption.priceModifier) {
            variantModifier += selectedOption.priceModifier * fabricQuantity;
          }
        }
      });
    }
    
    const unitPrice = (baseDesignPrice + fabricTotalPrice + variantModifier) / fabricQuantity;
    const totalPrice = baseDesignPrice + fabricTotalPrice + variantModifier;
    
    // Prepare variants map (variantId -> optionValue)
    const variantsMap: Record<string, string> = {};
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any) => {
        const selectedOptionId = selectedVariants[String(variant.id)];
        if (selectedOptionId && variant.options) {
          const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
          if (selectedOption) {
            variantsMap[String(variant.id)] = selectedOption.value || String(selectedOption.id);
          }
        }
      });
    }
    
    // Add fabric variants
    Object.assign(variantsMap, selectedFabricVariants);
    
    // Prepare cart data
    const cartData = {
      productType: 'DESIGNED',
      productId: Number(product.id),
      productName: product.name,
      productImage: product.images?.[0] || '',
      designId: Number(product.id),
      designPrice: baseDesignPrice,
      fabricId: Number(selectedFabricId),
      fabricPrice: fabricTotalPrice,
      quantity: fabricQuantity,
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      variants: variantsMap,
      customFormData: { ...customFieldValues, ...customFormData },
    };
    
    // Use guest cart if not logged in, otherwise use API
    if (!isLoggedIn) {
      guestCart.addItem(cartData);
      toast.success('Product added to cart!');
      // Trigger a custom event to update cart count in navbar
      window.dispatchEvent(new Event('guestCartUpdated'));
    } else {
      addToCartMutation.mutate(cartData);
    }
  };

  const handlePlainProductAddToCart = () => {
    // Validate required custom fields
    if (!validateCustomFields()) {
      return;
    }
    
    // Calculate price with variants
    const basePrice = product.pricePerMeter || product.plainProduct?.pricePerMeter || product.price || 0;
    let variantModifier = 0;
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any) => {
        const selectedOptionId = selectedVariants[String(variant.id)];
        if (selectedOptionId && variant.options) {
          const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
          if (selectedOption && selectedOption.priceModifier) {
            variantModifier += selectedOption.priceModifier;
          }
        }
      });
    }
    
    const unitPrice = basePrice + variantModifier;
    
    // Prepare variants map
    const variantsMap: Record<string, string> = {};
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any) => {
        const selectedOptionId = selectedVariants[String(variant.id)];
        if (selectedOptionId && variant.options) {
          const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
          if (selectedOption) {
            variantsMap[String(variant.id)] = selectedOption.value || String(selectedOption.id);
          }
        }
      });
    }
    
    // Prepare cart data
    const totalPrice = unitPrice * quantity;
    const cartData = {
      productType: 'PLAIN',
      productId: Number(product.id),
      productName: product.name,
      productImage: product.images?.[0] || '',
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      variants: variantsMap,
      customFormData: { ...customFieldValues, ...customFormData },
    };
    
    // Use guest cart if not logged in, otherwise use API
    if (!isLoggedIn) {
      guestCart.addItem(cartData);
      toast.success('Product added to cart!');
      // Trigger a custom event to update cart count in navbar
      window.dispatchEvent(new Event('guestCartUpdated'));
    } else {
      addToCartMutation.mutate(cartData);
    }
  };

  // Handle digital product add to cart
  const handleDigitalAddToCart = () => {
    if (!product || product.type !== 'DIGITAL') return;
    
    // Validate required custom fields
    if (!validateCustomFields()) {
      return;
    }
    
    const cartData: Omit<import('@/lib/guestCart').GuestCartItem, 'id'> = {
      productType: 'DIGITAL',
      productId: Number(product.id),
      productName: product.name,
      productImage: product.images?.[0] || '',
      quantity: quantity,
      unitPrice: finalPrice / quantity,
      totalPrice: finalPrice,
      variants: selectedVariants,
      customFormData: { ...customFieldValues, ...customFormData },
    };
    
    // Use guest cart if not logged in, otherwise use API
    if (!isLoggedIn) {
      guestCart.addItem(cartData);
      toast.success('Digital product added to cart!');
      window.dispatchEvent(new Event('guestCartUpdated'));
    } else {
      addToCartMutation.mutate(cartData);
    }
  };

  // Handle digital download (for purchased products)
  const handleDigitalDownload = () => {
    if (!product || !product.fileUrl) {
      toast.error('Download file not available');
      return;
    }
    
    // Open download link in new tab
    window.open(product.fileUrl, '_blank');
    toast.success('Opening download...');
  };

  const getTypeBadge = () => {
    switch (product.type) {
      case 'DESIGNED':
        return <Badge className="bg-pink-100 text-pink-700 border-pink-200 gap-1"><Palette className="w-3 h-3" /> Design Product</Badge>;
      case 'PLAIN':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1"><Package className="w-3 h-3" /> Fabric</Badge>;
      case 'DIGITAL':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1"><FileJson className="w-3 h-3" /> Digital Product</Badge>;
    }
  };

  if (productLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (productError) {
    console.error('Product fetch error:', productError);
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-destructive text-lg font-semibold mb-2">Error loading product</p>
          <p className="text-muted-foreground mb-4">{productError instanceof Error ? productError.message : 'Unknown error'}</p>
          <Link to="/products">
            <Button variant="outline" className="mt-4">Back to Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (!product) {
    console.warn('Product is null, apiProduct:', apiProduct);
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-destructive text-lg font-semibold mb-2">Product not found</p>
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/products">
            <Button variant="outline" className="mt-4">Back to Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <section className="w-full bg-secondary/30 py-3 sm:py-5">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <nav className="flex items-center text-xs sm:text-sm text-muted-foreground flex-wrap gap-1 sm:gap-0">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0" />
            <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
            <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0" />
            <Link to={`/category/${product.category.toLowerCase()}`} className="hover:text-primary transition-colors">{product.category}</Link>
            <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0" />
            <span className="text-foreground truncate">{product.name}</span>
          </nav>
        </div>
      </section>

      {/* Product Section */}
      <section className="w-full py-8 sm:py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-16">
            {/* Images */}
            <div className="lg:col-span-5">
              <ScrollReveal direction="left">
                <div className="space-y-3 sm:space-y-5">
                  {product && product.media && product.media.length > 0 ? (
                    <>
                      <motion.div
                        key={selectedMedia}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-secondary/30 border border-border shadow-sm mx-auto w-full max-w-full sm:max-w-lg"
                      >
                        {product.media[selectedMedia]?.type === 'video' ? (
                          <video
                            src={product.media[selectedMedia].url}
                            className="w-full h-full object-cover"
                            controls
                            autoPlay
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={product.media[selectedMedia].url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </motion.div>
                      
                      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-full sm:max-w-lg mx-auto">
                        {product.media.map((item: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => setSelectedMedia(index)}
                            className={cn(
                              "aspect-square rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all relative",
                              selectedMedia === index 
                                ? 'border-primary' 
                                : 'border-transparent hover:border-primary/50'
                            )}
                          >
                            {item.type === 'video' ? (
                              <>
                                <video
                                  src={item.url}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <Video className="w-6 h-6 text-white" />
                                </div>
                              </>
                            ) : (
                              <img
                                src={item.url}
                                alt={`${product.name} ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : product && product.images && product.images.length > 0 ? (
                    <>
                      <motion.div
                        key={selectedMedia}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-secondary/30 border border-border shadow-sm mx-auto w-full max-w-full sm:max-w-lg"
                      >
                        <img
                          src={product.images[selectedMedia]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                      
                      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-full sm:max-w-lg mx-auto">
                        {product.images.map((image: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => setSelectedMedia(index)}
                            className={cn(
                              "aspect-square rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all",
                              selectedMedia === index 
                                ? 'border-primary' 
                                : 'border-transparent hover:border-primary/50'
                            )}
                          >
                            <img
                              src={image}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="aspect-square rounded-xl sm:rounded-2xl bg-secondary/30 border border-border flex items-center justify-center">
                      <p className="text-muted-foreground">No media available</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>

            {/* Product Info */}
            <div className="lg:col-span-7">
              <ScrollReveal direction="right">
                <div className="lg:sticky lg:top-24 space-y-5 sm:space-y-6 lg:space-y-8 max-w-2xl">
                  {/* Badges */}
                  <div className="flex gap-3 flex-wrap">
                    {getTypeBadge()}
                    {product.isNew && <Badge className="bg-accent text-accent-foreground text-sm px-4 py-1">New Arrival</Badge>}
                  </div>

                  {/* Title & Price */}
                  <div className="space-y-2 sm:space-y-3">
                    <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">{product.category}</p>
                    <h1 className="font-sans font-semibold text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-3xl break-words not-italic" style={{ fontFamily: "'Poppins', sans-serif" }}>{product.name}</h1>

                    {/* Price Display */}
                    {product.type === 'DESIGNED' && (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-2">
                          {/* Horizontal Price Breakdown */}
                          <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap">
                            {/* Design Price */}
                            <div className="flex flex-col">
                              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Design Price</p>
                              <span className="font-bold font-normal text-lg sm:text-xl text-primary not-italic">₹{product.designPrice}</span>
                            </div>
                            
                            {/* Plus Sign */}
                            {selectedFabricId && (
                              <>
                                <span className="text-2xl sm:text-3xl text-muted-foreground font-light mt-5">+</span>
                                
                                {/* Fabric Price */}
                                <div className="flex flex-col">
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Fabric Price</p>
                                  <div className="flex flex-col">
                                    <span className="font-bold font-normal text-lg sm:text-xl text-primary not-italic">
                                      ₹{(() => {
                                        const effectivePrice = effectivePricingSlabs && effectivePricingSlabs.length > 0
                                          ? calculatePricePerMeter(fabricQuantity, fabricPricePerMeter, effectivePricingSlabs)
                                          : fabricPricePerMeter;
                                        return effectivePrice * fabricQuantity;
                                      })()}
                                    </span>
                                    {effectivePricingSlabs && effectivePricingSlabs.length > 0 && (
                                      <span className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 leading-tight">
                                        @ ₹{(() => {
                                          return calculatePricePerMeter(fabricQuantity, fabricPricePerMeter, effectivePricingSlabs);
                                        })()}/meter (slab pricing)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {/* Variant Modifiers with Plus */}
                            {product.variants && product.variants.length > 0 && Object.keys(selectedVariants).length > 0 && (() => {
                              let modifier = 0;
                              product.variants.forEach((variant: any) => {
                                const selectedOptionId = selectedVariants[String(variant.id)];
                                if (selectedOptionId && variant.options) {
                                  const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
                                  if (selectedOption && selectedOption.priceModifier) {
                                    modifier += selectedOption.priceModifier * fabricQuantity;
                                  }
                                }
                              });
                              return modifier > 0 ? (
                                <>
                                  <span className="text-2xl sm:text-3xl text-muted-foreground font-light mt-5">+</span>
                                  <div className="flex flex-col">
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Variant Modifiers</p>
                                    <span className="font-bold font-normal text-lg sm:text-xl text-primary not-italic">₹{modifier}</span>
                                  </div>
                                </>
                              ) : null;
                            })()}
                            
                            {/* Equals Sign and Total */}
                            {combinedPrice && (
                              <>
                                <span className="text-2xl sm:text-3xl text-muted-foreground font-light mt-5">=</span>
                                <div className="flex flex-col">
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total</p>
                                  <span className="font-bold font-normal text-xl sm:text-2xl text-primary not-italic">₹{combinedPrice}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        {selectedFabricId && (
                          <div className="text-xs sm:text-sm text-muted-foreground pt-2 border-t border-border/50">
                            <p className="font-medium">Fabric Details:</p>
                            <p className="mt-1">
                              {(() => {
                                const effectivePrice = effectivePricingSlabs && effectivePricingSlabs.length > 0
                                  ? calculatePricePerMeter(fabricQuantity, fabricPricePerMeter, effectivePricingSlabs)
                                  : fabricPricePerMeter;
                                return `₹${effectivePrice}/meter × ${fabricQuantity} meter${fabricQuantity !== 1 ? 's' : ''} = ₹${effectivePrice * fabricQuantity}`;
                              })()}
                            </p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 gap-2"
                          onClick={() => setShowPriceBreakdown(true)}
                        >
                          <Calculator className="w-4 h-4" />
                          View Price Breakdown
                        </Button>
                      </div>
                    )}
                    
                    {product.type === 'PLAIN' && (
                      <div>
                        <div className="flex items-baseline gap-3">
                          <span className="font-bold font-normal text-xl sm:text-2xl text-primary not-italic">
                            ₹{(() => {
                              const basePrice = product.pricePerMeter || product.price || 0;
                              let variantModifier = 0;
                              if (product.variants && product.variants.length > 0) {
                                product.variants.forEach((variant: any) => {
                                  const selectedOptionId = selectedVariants[String(variant.id)];
                                  if (selectedOptionId && variant.options) {
                                    const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
                                    if (selectedOption && selectedOption.priceModifier) {
                                      variantModifier += selectedOption.priceModifier;
                                    }
                                  }
                                });
                              }
                              return basePrice + variantModifier;
                            })()}
                          </span>
                          <span className="text-sm text-muted-foreground">per meter</span>
                        </div>
                        {finalPrice > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-1">Total for {quantity} meter{quantity !== 1 ? 's' : ''}</p>
                            <span className="font-bold font-normal text-lg text-primary not-italic">₹{finalPrice}</span>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 gap-2"
                          onClick={() => setShowPriceBreakdown(true)}
                        >
                          <Calculator className="w-4 h-4" />
                          View Price Breakdown
                        </Button>
                      </div>
                    )}
                    
                  </div>

                  {/* Description */}
                  <div className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed mt-2 sm:mt-3 font-normal not-italic">
                    {product.description ? (
                      <p className="whitespace-pre-wrap font-normal not-italic">{product.description.replace(/<[^>]*>/g, '')}</p>
                    ) : (
                      <p className="text-muted-foreground/70 font-normal not-italic">No description available.</p>
                    )}
                  </div>


                  {/* DESIGN PRODUCT: Select Fabric Button & Recommended Fabrics */}
                  {product.type === 'DESIGNED' && (
                    <div className="space-y-4">
                      {/* Select Fabric Button - First */}
                      <div>
                        <Button
                          onClick={() => setShowPlainProductSelection(true)}
                          variant="outline"
                          className="w-full h-11 sm:h-12 text-sm sm:text-base gap-2"
                        >
                          <Palette className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          <span className="truncate">
                            {selectedFabricId 
                              ? (customConfig?.selectFabricLabel ? `Change ${customConfig.selectFabricLabel}` : 'Change Fabric')
                              : (customConfig?.selectFabricLabel || 'Select Fabric')
                            }
                          </span>
                        </Button>
                      </div>

                      {/* Recommended Fabrics - Grid Layout */}
                      {((product.recommendedFabrics && product.recommendedFabrics.length > 0) || 
                        (isCustomProduct && effectiveRecommendedFabrics.length > 0)) && (
                        <div>
                          <h4 className="font-medium mb-3 sm:mb-4 text-base sm:text-lg flex items-center gap-2">
                            <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            Recommended Fabrics
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                            {(product.recommendedFabrics || []).slice(0, 3).map((fabric: any, index: number) => {
                              const fabricId = String(fabric.id);
                              const fabricName = fabric.name || `Fabric ${index + 1}`;
                              const isSelected = selectedFabricId === fabricId;
                              
                              return (
                                <button
                                  key={fabricId}
                                  onClick={() => handleFabricSelect(fabricId)}
                                  className={cn(
                                    "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-full border-2 transition-all text-xs sm:text-sm h-full min-h-[44px] sm:min-h-[48px]",
                                    isSelected
                                      ? "border-[#2b9d8f] bg-[#2b9d8f]/10 text-[#2b9d8f]"
                                      : "border-border hover:border-[#2b9d8f]/50 text-foreground"
                                  )}
                                >
                                  <div className={cn(
                                    "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                                    isSelected
                                      ? "border-[#2b9d8f] bg-[#2b9d8f]"
                                      : "border-border"
                                  )}>
                                    {isSelected && (
                                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                  <span className="font-medium truncate text-left">{fabricName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quantity */}
                  {product.type !== 'DIGITAL' && (
                    <div>
                      <h4 className="font-bold mb-4 text-lg">Quantity {product.type === 'PLAIN' ? '(Meters)' : ''}</h4>
                      <div className="flex items-center gap-5">
                        <div className="flex items-center border border-border rounded-full">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full w-12 h-12"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          >
                            <Minus className="w-5 h-5" />
                          </Button>
                          <span className="w-14 text-center font-medium text-lg">{quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full w-12 h-12"
                            onClick={() => setQuantity(quantity + 1)}
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Digital Product Quantity (if multiple licenses needed) */}
                  {product.type === 'DIGITAL' && (
                    <div>
                      <h4 className="font-bold mb-4 text-lg">Quantity (Licenses)</h4>
                      <div className="flex items-center gap-5">
                        <div className="flex items-center border border-border rounded-full">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full w-12 h-12"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          >
                            <Minus className="w-5 h-5" />
                          </Button>
                          <span className="w-14 text-center font-medium text-lg">{quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full w-12 h-12"
                            onClick={() => setQuantity(quantity + 1)}
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {quantity === 1 ? 'Single license' : `${quantity} licenses`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Variants */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-bold mb-4 text-lg">Select Options</h4>
                      {product.variants.map((variant: any) => (
                        <div key={variant.id} className="space-y-2">
                          <Label className="text-sm font-medium">
                            {variant.name}
                            {variant.unit && <span className="text-muted-foreground ml-1">({variant.unit})</span>}
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {variant.options && variant.options.map((option: any) => {
                              const isSelected = selectedVariants[String(variant.id)] === String(option.id);
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => {
                                    setSelectedVariants({
                                      ...selectedVariants,
                                      [String(variant.id)]: String(option.id)
                                    });
                                  }}
                                  className={cn(
                                    "px-4 py-2 rounded-lg border-2 transition-all text-sm",
                                    isSelected
                                      ? "border-primary bg-primary/10 text-primary font-medium"
                                      : "border-border hover:border-primary/50"
                                  )}
                                >
                                  {option.value}
                                  {option.priceModifier && option.priceModifier !== 0 && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {option.priceModifier > 0 ? '+' : ''}₹{option.priceModifier}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Custom Fields */}
                  {product.customFields && product.customFields.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-bold mb-4 text-lg">Additional Information</h4>
                      {product.customFields.map((field: any) => (
                        <div key={field.id} className="space-y-2">
                          <Label className="text-sm font-medium">
                            {field.label}
                            {field.isRequired && <span className="text-destructive ml-1">*</span>}
                          </Label>
                          {field.fieldType === 'text' && (
                            <Input
                              value={customFieldValues[String(field.id)] as string || ''}
                              onChange={(e) => setCustomFieldValues({
                                ...customFieldValues,
                                [String(field.id)]: e.target.value
                              })}
                              placeholder={field.placeholder || ''}
                              className="h-11"
                              required={field.isRequired}
                            />
                          )}
                          {field.fieldType === 'number' && (
                            <Input
                              type="number"
                              value={customFieldValues[String(field.id)] as string || ''}
                              onChange={(e) => setCustomFieldValues({
                                ...customFieldValues,
                                [String(field.id)]: e.target.value
                              })}
                              placeholder={field.placeholder || ''}
                              className="h-11"
                              required={field.isRequired}
                            />
                          )}
                          {field.fieldType === 'url' && (
                            <Input
                              type="url"
                              value={customFieldValues[String(field.id)] as string || ''}
                              onChange={(e) => setCustomFieldValues({
                                ...customFieldValues,
                                [String(field.id)]: e.target.value
                              })}
                              placeholder={field.placeholder || ''}
                              className="h-11"
                              required={field.isRequired}
                            />
                          )}
                          {field.fieldType === 'image' && (
                            <div className="space-y-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  setCustomFieldValues({
                                    ...customFieldValues,
                                    [String(field.id)]: file
                                  });
                                }}
                                className="h-11"
                                required={field.isRequired}
                              />
                              {field.placeholder && (
                                <p className="text-xs text-muted-foreground">{field.placeholder}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Price Display with Variants */}
                  {effectiveVariants && effectiveVariants.length > 0 && (
                    <div className="p-4 bg-muted/30 border border-border rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Base Price</span>
                        <span className="font-medium">
                          ₹{product.type === 'DESIGNED' ? (product.designPrice || 0) : (product.price || 0)}
                        </span>
                      </div>
                      {Object.keys(selectedVariants).length > 0 && (
                        <>
                          {effectiveVariants.map((variant: any) => {
                            const selectedOptionId = selectedVariants[String(variant.id)];
                            if (!selectedOptionId) return null;
                            const selectedOption = variant.options?.find((opt: any) => String(opt.id) === selectedOptionId);
                            if (!selectedOption || !selectedOption.priceModifier || selectedOption.priceModifier === 0) return null;
                            return (
                              <div key={variant.id} className="flex items-center justify-between mt-2">
                                <span className="text-sm text-muted-foreground">{variant.name}: {selectedOption.value}</span>
                                <span className="font-medium">
                                  {selectedOption.priceModifier > 0 ? '+' : ''}₹{selectedOption.priceModifier}
                                </span>
                              </div>
                            );
                          })}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                            <span className="font-semibold">Total (×{quantity})</span>
                            <span className="font-bold text-lg text-primary">₹{finalPrice}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* DIGITAL PRODUCT: Download Info */}
                  {product.type === 'DIGITAL' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <FileJson className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-purple-900 mb-1">Digital Download Product</h4>
                            <p className="text-sm text-purple-700">
                              Instant access after purchase. High-resolution files ready for printing or personal use.
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-purple-200">
                          <div>
                            <p className="text-xs text-purple-600 font-medium">File Format</p>
                            <p className="text-sm text-purple-900 font-semibold">
                              {product.fileUrl?.split('.').pop()?.toUpperCase() || 'PDF/PNG/JPG'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-purple-600 font-medium">Delivery</p>
                            <p className="text-sm text-purple-900 font-semibold">Instant</p>
                          </div>
                        </div>
                      </div>
                      
                      {product.description && (
                        <div className="p-4 bg-muted/30 border border-border rounded-xl">
                          <h4 className="font-semibold mb-2">What's Included</h4>
                          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>High-resolution digital file</li>
                            <li>Multiple format options (if available)</li>
                            <li>Commercial use license (if applicable)</li>
                            <li>Lifetime access to downloads</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-border/50">
                    {product.type === 'DESIGNED' && (
                      <>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                          {selectedFabricId ? (
                            <Button
                              size="lg"
                              onClick={handleAddToCart}
                              disabled={addToCartMutation.isPending}
                              className="flex-1 w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white gap-2 h-14 text-base px-4 sm:px-6 font-semibold whitespace-normal"
                            >
                              {addToCartMutation.isPending ? (
                                <>
                                  <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
                                  <span className="text-center">Adding...</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-5 h-5 flex-shrink-0" />
                                  <span className="text-center">
                                    {customConfig?.addToCartButtonText || 'Add to Cart'}
                                  </span>
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="lg"
                              onClick={() => setShowPlainProductSelection(true)}
                              className="flex-1 w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white gap-2 h-14 text-base px-4 sm:px-6 font-semibold whitespace-normal"
                            >
                              <Palette className="w-5 h-5 flex-shrink-0" />
                              <span className="text-center">Select Fabric First</span>
                            </Button>
                          )}
                          
                          {/* Purchase Design Only Option - Only show for regular DESIGNED products, not custom products */}
                          {!isCustomProduct && (
                            <Button
                              size="lg"
                              variant="outline"
                              onClick={handlePurchaseDesignOnly}
                              disabled={createDigitalMutation.isPending || isLoadingDigital}
                              className="flex-1 w-full border-2 border-primary text-primary hover:bg-primary hover:text-white gap-2 h-14 text-base px-4 sm:px-6 font-semibold whitespace-normal"
                            >
                              {createDigitalMutation.isPending || isLoadingDigital ? (
                                <>
                                  <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
                                  <span className="text-center">Loading...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-5 h-5 flex-shrink-0" />
                                  <span className="text-center">Purchase Digital Design</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        {!isCustomProduct && (
                          <p className="text-xs sm:text-sm text-muted-foreground text-center px-2">
                            Choose to purchase the physical product with fabric or just the digital design file
                          </p>
                        )}
                      </>
                    )}
                    
                    {product.type === 'PLAIN' && (
                      <Button
                        size="lg"
                        onClick={handlePlainProductAddToCart}
                        disabled={addToCartMutation.isPending}
                        className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white gap-2 h-14 text-base px-4 sm:px-6 font-semibold whitespace-normal"
                      >
                        {addToCartMutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
                            <span>Adding to Cart...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-5 h-5 flex-shrink-0" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </Button>
                    )}
                    
                    {product.type === 'DIGITAL' && (
                      <Button
                        size="lg"
                        onClick={handleDigitalAddToCart}
                        disabled={addToCartMutation.isPending}
                        className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white gap-2 h-14 text-base px-4 sm:px-6 font-semibold whitespace-normal"
                      >
                        {addToCartMutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
                            <span>Adding to Cart...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-5 h-5 flex-shrink-0" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </Button>
                    )}
                    
                    <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className={cn(
                          "rounded-full w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 border-border hover:border-primary hover:bg-primary/5",
                          isInWishlist && "bg-primary/10 border-primary text-primary"
                        )}
                        onClick={handleWishlistToggle}
                        disabled={addToWishlistMutation.isPending || removeFromWishlistMutation.isPending || !productId}
                      >
                        <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5", isInWishlist && "fill-current")} />
                      </Button>
                      <Button size="lg" variant="outline" className="rounded-full w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 border-border hover:border-primary hover:bg-primary/5">
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Digital Product Features Section */}
                  {product.type === 'DIGITAL' && (
                    <div className="border-t border-border pt-6 space-y-4">
                      <h3 className="font-bold text-lg mb-4">Digital Product Features</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                            <Download className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Instant Download</p>
                            <p className="text-xs text-muted-foreground">Get immediate access after purchase</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                            <FileJson className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">High Resolution</p>
                            <p className="text-xs text-muted-foreground">Print-ready quality files</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                            <Package className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Multiple Formats</p>
                            <p className="text-xs text-muted-foreground">Available in various file types</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                            <Share2 className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Lifetime Access</p>
                            <p className="text-xs text-muted-foreground">Download anytime from your account</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Detail Sections */}
                  {product.detailSections && product.detailSections.length > 0 && (
                    <Accordion type="single" collapsible className="border-t border-border pt-6">
                      {product.detailSections.map((section: DetailSection) => (
                        <AccordionItem key={section.id} value={section.id}>
                          <AccordionTrigger className="text-sm sm:text-lg font-sans not-italic" style={{ fontFamily: "'Poppins', sans-serif" }}>{section.title}</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-normal not-italic font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
                              {section.content}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}

                  {/* Terms & Conditions from Custom Config (for custom products) */}
                  {isCustomProduct && customConfig?.termsAndConditions && customConfig.termsAndConditions.trim() && (
                    <div className="border-t border-border pt-6">
                      <Accordion type="single" collapsible>
                        <AccordionItem value="terms">
                          <AccordionTrigger className="text-sm sm:text-lg font-sans not-italic" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            Terms & Conditions
                          </AccordionTrigger>
                          <AccordionContent>
                            <div 
                              className="text-muted-foreground text-sm sm:text-base leading-relaxed font-normal not-italic font-sans whitespace-pre-line"
                              style={{ fontFamily: "'Poppins', sans-serif" }}
                            >
                              {customConfig.termsAndConditions}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="w-full py-14 lg:py-20 bg-secondary/30">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <ScrollReveal>
              <h2 className="font-cursive font-semibold text-4xl lg:text-5xl mb-12">You May Also Like</h2>
            </ScrollReveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {relatedProducts.map((product, index) => (
                <ScrollReveal key={product.id} delay={index * 0.1}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popups */}
      {product.type === 'DESIGNED' && product.recommendedPlainProductIds && (
        <>
          <PlainProductSelectionPopup
            open={showPlainProductSelection}
            onOpenChange={setShowPlainProductSelection}
            recommendedPlainProductIds={product.recommendedPlainProductIds}
            onPlainProductSelect={handleFabricSelect}
          />
          
          {selectedFabricId && selectedFabric && (
            <FabricVariantPopup
              open={showFabricVariant}
              onOpenChange={setShowFabricVariant}
              fabric={{
                id: String(selectedFabric.id),
                name: selectedFabric.name || 'Selected Fabric',
                image: selectedFabric.images?.[0] || selectedFabric.media?.[0]?.url || '',
                pricePerMeter: Number(selectedFabric.pricePerMeter || selectedFabric.price || 0),
                status: (selectedFabric.status?.toLowerCase() === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
              }}
              variants={selectedFabric.variants?.map((v: any) => ({
                id: String(v.id),
                type: v.type || '',
                name: v.name || '',
                options: v.options?.map((opt: any) => ({
                  id: String(opt.id),
                  value: opt.value || '',
                  priceModifier: Number(opt.priceModifier || 0),
                })) || [],
              })) || []}
              onComplete={handleFabricVariantComplete}
            />
          )}
        </>
      )}
      
      {/* Custom Form Dialog (from config) */}
      {product && product.type === 'DESIGNED' && customFormFields.length > 0 && (
        <Dialog open={showCustomForm} onOpenChange={setShowCustomForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Additional Information</DialogTitle>
              <DialogDescription>
                Please provide the following details to complete your custom product order.
              </DialogDescription>
            </DialogHeader>
            <DynamicForm
              fields={customFormFields}
              onSubmit={(data) => {
                setCustomFormData(data);
                setShowCustomForm(false);
                toast.success('Custom information saved!');
              }}
              initialData={customFormData}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Price Breakdown Popup */}
      {product && (
        <PriceBreakdownPopup
          open={showPriceBreakdown}
          onOpenChange={setShowPriceBreakdown}
          item={{
            productType: product.type,
            productName: product.name,
            designPrice: product.designPrice,
            fabricPrice: selectedFabricId ? (() => {
              const effectivePrice = effectivePricingSlabs && effectivePricingSlabs.length > 0
                ? calculatePricePerMeter(fabricQuantity, fabricPricePerMeter, effectivePricingSlabs)
                : fabricPricePerMeter;
              return effectivePrice * fabricQuantity;
            })() : undefined,
            unitPrice: product.type === 'DESIGNED' ? (combinedPrice ? combinedPrice / fabricQuantity : undefined) : (product.pricePerMeter || product.price),
            totalPrice: product.type === 'DESIGNED' ? combinedPrice : finalPrice,
            quantity: product.type === 'DESIGNED' ? fabricQuantity : quantity,
            pricePerMeter: product.pricePerMeter || product.price,
            basePrice: product.pricePerMeter || product.price || product.designPrice,
          }}
          productData={product}
          selectedVariants={selectedVariants}
          fabricQuantity={fabricQuantity}
          fabricPricePerMeter={fabricPricePerMeter}
          selectedFabricVariants={selectedFabricVariants}
          discountAmount={selectedFabricId && effectivePricingSlabs && effectivePricingSlabs.length > 0 ? (() => {
            const effectivePrice = calculatePricePerMeter(fabricQuantity, fabricPricePerMeter, effectivePricingSlabs);
            const discount = fabricPricePerMeter - effectivePrice;
            return discount > 0 ? discount * fabricQuantity : 0;
          })() : undefined}
          finalFabricPricePerMeter={selectedFabricId && effectivePricingSlabs && effectivePricingSlabs.length > 0
            ? calculatePricePerMeter(fabricQuantity, fabricPricePerMeter, effectivePricingSlabs)
            : fabricPricePerMeter}
        />
      )}
    </Layout>
  );
};

export default ProductDetail;
