import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Share2, Minus, Plus, Download, Palette, Package, FileJson, IndianRupee, Video, Loader2, Calculator, ZoomIn, X } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { ButtonWithLoading } from '@/components/ui/ButtonWithLoading';
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
import { productsApi, cartApi, wishlistApi, customConfigApi, customProductsApi } from '@/lib/api';
import { guestCart } from '@/lib/guestCart';
import DynamicForm from '@/components/products/DynamicForm';
import { FormField } from '@/components/admin/FormBuilder';
import { usePrice } from '@/lib/currency';

// Product Type
type ProductType = 'PLAIN' | 'DESIGNED' | 'DIGITAL';

// Detail Section
export interface DetailSection {
  id: string;
  title: string;
  content: string;
}

/** Digital product: show extension (ZIP, PDF, etc.) or default ZIP; never raw URL. */
function getDigitalFileFormat(fileUrl: string | undefined): string {
  if (!fileUrl?.trim()) return 'ZIP';
  let url = fileUrl.trim();
  try {
    const parsed = JSON.parse(fileUrl);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') url = parsed[0];
    else if (typeof parsed === 'string') url = parsed;
  } catch {
    /* use url as-is */
  }
  const match = url.match(/\.(zip|pdf|png|jpe?g|gif|psd|ai|svg|eps|dll)(\?|$)/i);
  return match ? match[1].toUpperCase() : 'ZIP';
}

// Removed mock data - now using API for all product data

const ProductDetail = () => {
  const { slug: slugOrId } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { format } = usePrice();
  const navigate = useNavigate();
  
  // Get cartItemId from URL params for pre-loading selections
  const cartItemIdParam = searchParams.get('cartItemId');
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  
  // Fetch cart data if cartItemId is provided
  const { data: cartData } = useQuery({
    queryKey: ['cart-preload', cartItemIdParam],
    queryFn: () => cartApi.getCart(),
    enabled: !!cartItemIdParam && isLoggedIn,
  });
  
  // Find the specific cart item for pre-loading
  const cartItemForPreload = useMemo(() => {
    if (!cartData || !cartItemIdParam) return null;
    return cartData.items?.find((item: any) => item.id === Number(cartItemIdParam));
  }, [cartData, cartItemIdParam]);
  
  // Fetch product by slug or by id (All Products links use slug || id; id used when slug missing)
  const { data: apiProduct, isLoading: productLoading, error: productError } = useQuery({
    queryKey: ['product', slugOrId],
    queryFn: () => {
      const userEmail = typeof window !== 'undefined' ? (() => {
        const token = localStorage.getItem('authToken');
        if (!token) return null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.sub || payload.email || null;
        } catch {
          return null;
        }
      })() : null;
      const param = slugOrId!;
      if (/^\d+$/.test(param)) {
        return productsApi.getById(Number(param), userEmail || undefined);
      }
      return productsApi.getBySlug(param, userEmail || undefined);
    },
    enabled: !!slugOrId,
    retry: 1,
  });
  
  // Check if product is in wishlist
  const productType = apiProduct?.type || 'PLAIN';
  const productId = apiProduct?.id;
  // For PLAIN products, backend expects plainProductId; for DESIGNED/DIGITAL, product id
  const wishlistProductId = (productType === 'PLAIN' && apiProduct?.plainProductId) 
    ? apiProduct.plainProductId 
    : productId;
  const { data: wishlistCheck } = useQuery({
    queryKey: ['wishlist-check', productType, wishlistProductId],
    queryFn: () => wishlistApi.checkItem(productType, wishlistProductId!),
    enabled: !!wishlistProductId && !!localStorage.getItem('authToken'),
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
          slug: p.slug || String(p.id),
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
        unitExtension: apiProduct.plainProduct?.unitExtension || apiProduct.unitExtension,
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
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  // Reset zoom scale when image changes
  useEffect(() => {
    if (zoomImage) {
      setZoomScale(1);
    }
  }, [zoomImage]);
  
  // Custom Fields and Variants States (image fields store Cloudinary URL string after upload)
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | File | null>>({});
  const [uploadingCustomFieldId, setUploadingCustomFieldId] = useState<string | null>(null);
  const MAX_CUSTOM_FILE_MB = 10;
  const MAX_CUSTOM_FILE_BYTES = MAX_CUSTOM_FILE_MB * 1024 * 1024;
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({}); // variantId -> optionId
  
  // Design Product States
  const [showPlainProductSelection, setShowPlainProductSelection] = useState(false);
  const [showFabricVariant, setShowFabricVariant] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(null);
  const [selectedFabric, setSelectedFabric] = useState<any>(null);
  const [selectedFabricVariants, setSelectedFabricVariants] = useState<Record<string, string>>({});
  const [fabricCustomFieldValues, setFabricCustomFieldValues] = useState<Record<string, string>>({});
  const [fabricQuantity, setFabricQuantity] = useState(1);
  const [fabricPricePerMeter, setFabricPricePerMeter] = useState<number>(0);
  const [combinedPrice, setCombinedPrice] = useState<number | null>(null);

  // Custom form fields from config (for user-uploaded products)
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFormFields, setCustomFormFields] = useState<FormField[]>([]);
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({});
  
  // Do NOT fetch Make Your Own config on ProductDetail. This page is for catalog products
  // (slug-based). Custom/Make Your Own products use CustomProductDetail (/custom-product/:id)
  // and have their own config fetch there. Admin-created DESIGNED products (even with
  // designId null, e.g. "pr") must use only product.variants, product.customFields, etc.
  const { data: customConfig } = useQuery({
    queryKey: ['customConfig'],
    queryFn: () => customConfigApi.getPublicConfig(),
    enabled: false,
  });

  // On ProductDetail we only show catalog products (by slug). Custom/Make Your Own products
  // live on CustomProductDetail, so no product here is ever "custom" — use only product data.
  const isCustomProduct = false;
  
  // Use config data ONLY for custom products - strict isolation
  // Regular DESIGNED products use their own product data exclusively
  const effectiveVariants = useMemo(() => {
    // Only use customConfig variants for custom products
    if (isCustomProduct && customConfig?.variants && customConfig.variants.length > 0) {
      // Use variants from config for custom products
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
    // For regular DESIGNED products, use ONLY product variants (never config)
    return product?.variants || [];
  }, [isCustomProduct, customConfig?.variants, product?.variants]);
  
  const effectivePricingSlabs = useMemo(() => {
    // Only use customConfig pricing slabs for custom products
    if (isCustomProduct && customConfig?.pricingSlabs && customConfig.pricingSlabs.length > 0) {
      // Use pricing slabs from config for custom products
      return customConfig.pricingSlabs;
    }
    // For regular DESIGNED products, use ONLY product pricing slabs (never config)
    return product?.pricingSlabs || [];
  }, [isCustomProduct, customConfig?.pricingSlabs, product?.pricingSlabs]);
  
  const effectiveRecommendedFabrics = useMemo(() => {
    // Only use customConfig recommended fabrics for custom products
    if (isCustomProduct && customConfig?.recommendedFabricIds && customConfig.recommendedFabricIds.length > 0) {
      // Use recommended fabrics from config for custom products
      return customConfig.recommendedFabricIds;
    }
    // For regular DESIGNED products, use ONLY product recommended fabrics (never config)
    return product?.recommendedPlainProductIds || [];
  }, [isCustomProduct, customConfig?.recommendedFabricIds, product?.recommendedPlainProductIds]);
  
  // Pre-load selections from cart item if cartItemId is provided
  useEffect(() => {
    if (cartItemForPreload && product) {
      // Pre-load fabric selection for DESIGNED products
      if (cartItemForPreload.fabricId) {
        setSelectedFabricId(String(cartItemForPreload.fabricId));
      }
      
      // Pre-load variant selections
      if (cartItemForPreload.variantSelections) {
        const variantMap: Record<string, string> = {};
        Object.entries(cartItemForPreload.variantSelections).forEach(([key, selection]: [string, any]) => {
          if (selection.optionId) {
            variantMap[selection.variantId || key] = String(selection.optionId);
          }
        });
        setSelectedVariants(variantMap);
      } else if (cartItemForPreload.variants) {
        setSelectedVariants(cartItemForPreload.variants);
      }
      
      // Pre-load custom field values (backend may send label keys; map to id for form)
      if (cartItemForPreload.customFormData) {
        const raw = cartItemForPreload.customFormData as Record<string, any>;
        const fieldValues: Record<string, string | File | null> = {};
        const productFields = product?.customFields || [];
        Object.entries(raw).forEach(([key, value]) => {
          if (key === 'fabricMeters' || key.startsWith('_')) return;
          if (/^\d+$/.test(key)) {
            fieldValues[key] = value as string;
          } else {
            const field = productFields.find((f: any) => f.label === key || f.name === key);
            if (field) fieldValues[String(field.id)] = value as string;
            else fieldValues[key] = value as string;
          }
        });
        setCustomFieldValues(fieldValues);
      }
      
      // Pre-load quantity
      if (cartItemForPreload.quantity) {
        setQuantity(cartItemForPreload.quantity);
        setFabricQuantity(cartItemForPreload.quantity);
      }
      
    }
  }, [cartItemForPreload, product]);

  // Update custom form fields when config loads - ONLY for custom products
  useEffect(() => {
    // Only load customConfig.formFields for custom products (user-uploaded)
    // Regular DESIGNED products should use product.customFields only
    if (isCustomProduct && customConfig && customConfig.formFields && product?.type === 'DESIGNED') {
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
    } else if (!isCustomProduct && product?.type === 'DESIGNED') {
      // For regular DESIGNED products, clear custom form fields from config
      // They should only use product.customFields
      setCustomFormFields([]);
    }
  }, [isCustomProduct, customConfig, product?.type]);

  // Fetch selected fabric product data
  const { data: fabricProduct } = useQuery({
    queryKey: ['fabricProduct', selectedFabricId],
    queryFn: () => productsApi.getById(Number(selectedFabricId!)),
    enabled: !!selectedFabricId && product?.type === 'DESIGNED',
  });

  // Pre-load fabric custom fields when fabric product loads (backend sends label keys)
  useEffect(() => {
    if (!cartItemForPreload?.customFormData || !fabricProduct?.customFields?.length) return;
    const raw = cartItemForPreload.customFormData as Record<string, any>;
    const fabricValues: Record<string, string> = {};
    fabricProduct.customFields.forEach((f: any) => {
      const val = raw[f.label] ?? raw[f.name] ?? raw[String(f.id)];
      if (val != null) fabricValues[String(f.id)] = String(val);
    });
    if (Object.keys(fabricValues).length > 0) setFabricCustomFieldValues(fabricValues);
  }, [cartItemForPreload, fabricProduct]);

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

  // Update combined price for DESIGNED products: per-meter total (fabric/m + print/m)
  // Page quantity = meters; slab discount uses page quantity (meters)
  useEffect(() => {
    if (product && product.type === 'DESIGNED' && selectedFabricId) {
      const baseDesignPrice = product.designPrice || 0;
      const finalFabricPricePerMeter = fabricPricePerMeter;
      const effectivePricePerMeter = effectivePricingSlabs && effectivePricingSlabs.length > 0
        ? calculatePricePerMeter(quantity, finalFabricPricePerMeter, effectivePricingSlabs)
        : finalFabricPricePerMeter;
      let printVariantModifier = 0;
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant: any) => {
          const selectedOptionId = selectedVariants[String(variant.id)];
          if (selectedOptionId && variant.options) {
            const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
            if (selectedOption && selectedOption.priceModifier) {
              printVariantModifier += selectedOption.priceModifier;
            }
          }
        });
      }
      setCombinedPrice(effectivePricePerMeter + baseDesignPrice + printVariantModifier);
    }
  }, [product, selectedFabricId, fabricPricePerMeter, quantity, selectedVariants]);

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
    customFieldValues?: Record<string, string | number>;
  }) => {
    setSelectedFabricId(data.fabricId);
    setSelectedFabricVariants(data.selectedVariants);
    setFabricQuantity(1);
    setFabricCustomFieldValues(
      data.customFieldValues != null
        ? Object.fromEntries(
            Object.entries(data.customFieldValues).map(([k, v]) => [k, String(v)])
          )
        : {}
    );

    if (isCustomProduct && customFormFields.length > 0) {
      setShowCustomForm(true);
    }
    const baseDesignPrice = product.designPrice || 0;
    let printVariantModifier = 0;
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any) => {
        const selectedOptionId = selectedVariants[String(variant.id)];
        if (selectedOptionId && variant.options) {
          const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
          if (selectedOption && selectedOption.priceModifier) {
            printVariantModifier += selectedOption.priceModifier;
          }
        }
      });
    }
    setFabricPricePerMeter(data.totalPrice);
    setCombinedPrice(data.totalPrice + baseDesignPrice + printVariantModifier);
    setShowFabricVariant(false);
  };

  // Validate required custom fields (product customFields, config formFields, and fabric custom fields)
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

    // Validate fabric custom fields (when DESIGNED and fabric has customFields)
    if (product.type === 'DESIGNED' && selectedFabric?.customFields?.length) {
      for (const field of selectedFabric.customFields) {
        if (field.required) {
          const value = fabricCustomFieldValues[String(field.id)];
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            toast.error(`Please fill in the required fabric field: ${field.label}`);
            return false;
          }
        }
      }
    }

    // Validate custom form fields from config (only for custom products)
    if (isCustomProduct && customFormFields.length > 0) {
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

  // Add to cart mutation (for logged-in users) – redirect to Cart page (no popup)
  const addToCartMutation = useMutation({
    mutationFn: (cartData: any) => cartApi.addItem(cartData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast.success('Product added to cart!');
      navigate('/cart');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add product to cart');
    },
  } );

  // Filter images for design products - show only image files, hide other file types
  const displayImages = useMemo(() => {
    if (!product?.images) return [];
    
    // For design products, filter to show only image files from fileUrl
    if (product.type === 'DESIGNED' && product.fileUrl) {
      try {
        // Parse fileUrl to get all files
        const fileUrls = JSON.parse(product.fileUrl);
        if (Array.isArray(fileUrls)) {
          // Filter to show only image files
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
          const imageFiles = fileUrls.filter((url: string) => {
            const lowerUrl = url.toLowerCase();
            return imageExtensions.some(ext => lowerUrl.includes(ext) || lowerUrl.includes('image'));
          });
          // Return filtered images, fallback to product.images if no matches
          return imageFiles.length > 0 ? imageFiles : product.images;
      }
      } catch {
        // Not JSON, use product.images as-is
      }
    }
    
    return product.images;
  }, [product?.images, product?.type, product?.fileUrl]);
  
  // Reset selectedMedia when displayImages change
  useEffect(() => {
    if (selectedMedia >= displayImages.length && displayImages.length > 0) {
      setSelectedMedia(0);
    }
  }, [displayImages.length]);
  
  // Wishlist mutations
  const addToWishlistMutation = useMutation({
    mutationFn: () => {
      if (!product || !wishlistProductId) {
        throw new Error('Product not loaded');
      }
      return wishlistApi.addItem({
        productType,
        productId: wishlistProductId,
        productName: product.name,
        productImage: product.images?.[0],
        // Store only product-level reference in wishlist; pricing comes from product itself
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', productType, wishlistProductId] });
      toast.success('Added to wishlist!');
    },
    onError: (error: Error) => {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('already') && msg.toLowerCase().includes('wishlist')) {
        toast.info('This product is already in your wishlist');
      } else {
        toast.error(msg || 'Failed to add to wishlist');
      }
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: () => wishlistApi.removeByProduct(productType, wishlistProductId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-check', productType, wishlistProductId] });
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

  const handleShare = async () => {
    const url = window.location.href;
    const title = product?.name || 'Product';
    const text = `Check out ${title}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        toast.success('Link shared!');
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard!');
        } catch {
          toast.error('Failed to share');
        }
      }
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
    
    // PRICING LOGIC (1-meter base, page quantity = meters):
    // Per-meter total = fabric/m + print/m. Total = per-meter total × quantity (meters).
    const baseDesignPrice = product.designPrice || 0;
    const effectivePricePerMeter = effectivePricingSlabs && effectivePricingSlabs.length > 0
      ? calculatePricePerMeter(quantity, fabricPricePerMeter, effectivePricingSlabs)
      : fabricPricePerMeter;
    let printVariantModifier = 0;
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any) => {
        const selectedOptionId = selectedVariants[String(variant.id)];
        if (selectedOptionId && variant.options) {
          const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
          if (selectedOption && selectedOption.priceModifier) {
            printVariantModifier += selectedOption.priceModifier;
          }
        }
      });
    }
    const unitPrice = effectivePricePerMeter + baseDesignPrice + printVariantModifier;
    const totalPrice = unitPrice * quantity;
    const fabricTotalPrice = effectivePricePerMeter * quantity;

    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/c85bf050-6243-4194-976e-3e54a6a21ac3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'post-fix-v2',
          hypothesisId: 'H2',
          location: 'ProductDetail.tsx:handleAddToCart',
          message: 'DESIGNED pricing - print variant NOT multiplied by meters',
          data: {
            productType: product.type,
            fabricMeters: quantity,
            fabricPricePerMeter: effectivePricePerMeter,
            fabricTotalPrice,
            baseDesignPrice,
            printVariantModifier,
            unitPrice,
            quantity,
            totalPrice,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
    // #endregion

    // Prepare structured variant selections (new format with both IDs and frontendIds)
    const variantSelections: Record<string, any> = {};
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any) => {
        const selectedOptionId = selectedVariants[String(variant.id)];
        if (selectedOptionId && variant.options) {
          const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
          if (selectedOption) {
            // Use frontendId as key if available, otherwise use variant.id
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
    }
    
    // Add fabric variants (legacy format for backward compatibility)
    const variantsMap: Record<string, string> = {};
    Object.assign(variantsMap, selectedFabricVariants);
    
    // Cart: quantity = meters, unitPrice = per-meter total, totalPrice = unitPrice × quantity
    const cartData: any = {
      productType: 'DESIGNED',
      productId: Number(product.id),
      productName: product.name,
      productImage: product.images?.[0] || '',
      designId: Number(product.id),
      designPrice: baseDesignPrice,
      fabricId: Number(selectedFabricId),
      fabricPrice: fabricTotalPrice,
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      variantSelections: Object.keys(variantSelections).length > 0 ? variantSelections : undefined,
      variants: Object.keys(variantsMap).length > 0 ? variantsMap : undefined,
      customFormData: { ...customFieldValues, ...customFormData, ...fabricCustomFieldValues, fabricMeters: quantity },
    };

    // Use guest cart if not logged in, otherwise use API
    if (!isLoggedIn) {
      guestCart.addItem(cartData);
      toast.success('Product added to cart!');
      window.dispatchEvent(new Event('guestCartUpdated'));
      navigate('/cart');
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
    
    // Prepare structured variant selections (new format with both IDs and frontendIds)
    const variantSelections: Record<string, any> = {};
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any) => {
        const selectedOptionId = selectedVariants[String(variant.id)];
        if (selectedOptionId && variant.options) {
          const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
          if (selectedOption) {
            // Use frontendId as key if available, otherwise use variant.id
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
    }
    
    // Prepare cart data
    const totalPrice = unitPrice * quantity;
    const cartData: any = {
      productType: 'PLAIN',
      productId: Number(product.id),
      productName: product.name,
      productImage: product.images?.[0] || '',
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      variantSelections: Object.keys(variantSelections).length > 0 ? variantSelections : undefined,
      variants: undefined, // No legacy format needed for plain products
      customFormData: { ...customFieldValues, ...customFormData },
    };
    
    // Use guest cart if not logged in, otherwise use API
    if (!isLoggedIn) {
      guestCart.addItem(cartData);
      toast.success('Product added to cart!');
      window.dispatchEvent(new Event('guestCartUpdated'));
      navigate('/cart');
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
      navigate('/cart');
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
    
    // Check if fileUrl is a JSON array (multiple files)
    try {
      const fileUrls = JSON.parse(product.fileUrl);
      if (Array.isArray(fileUrls) && fileUrls.length > 0) {
        // Multiple files - open all in new tabs
        fileUrls.forEach((url: string, index: number) => {
          setTimeout(() => {
            window.open(url, '_blank');
          }, index * 200); // Stagger opens to avoid popup blocker
        });
        toast.success(`Opening ${fileUrls.length} design file(s)...`);
      } else {
        // Single file
    window.open(product.fileUrl, '_blank');
    toast.success('Opening download...');
      }
    } catch {
      // Not JSON, treat as single URL or comma-separated
      if (product.fileUrl.includes(',') && !product.fileUrl.startsWith('http')) {
        // Comma-separated URLs
        const urls = product.fileUrl.split(',').map((u: string) => u.trim()).filter((u: string) => u);
        urls.forEach((url: string, index: number) => {
          setTimeout(() => {
            window.open(url, '_blank');
          }, index * 200);
        });
        toast.success(`Opening ${urls.length} design file(s)...`);
      } else {
        // Single URL
        window.open(product.fileUrl, '_blank');
        toast.success('Opening download...');
      }
    }
  };

  const getTypeBadge = () => {
    // Only show Digital Product tag, remove all other tags
    if (product.type === 'DIGITAL') {
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1"><FileJson className="w-3 h-3" /> Digital Product</Badge>;
    }
    return null;
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
      {/* Breadcrumb: Home > Categories > Category > Product */}
      <section className="w-full bg-secondary/30 py-3 sm:py-4">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/categories">Categories</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {product?.category && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/categories">{product.category}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate max-w-[180px] sm:max-w-none">{product?.name || 'Product'}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
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
                        className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-secondary/30 border border-border shadow-sm mx-auto w-full max-w-full sm:max-w-lg relative group cursor-zoom-in"
                        onClick={() => {
                          if (product.media[selectedMedia]?.type !== 'video') {
                            setZoomImage(product.media[selectedMedia].url);
                          }
                        }}
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
                          <>
                            <img
                              src={product.media[selectedMedia].url}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </>
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
                  ) : displayImages && displayImages.length > 0 ? (
                    <>
                      <motion.div
                        key={selectedMedia}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-secondary/30 border border-border shadow-sm mx-auto w-full max-w-full sm:max-w-lg relative group cursor-zoom-in"
                        onClick={() => setZoomImage(displayImages[selectedMedia])}
                      >
                        <img
                          src={displayImages[selectedMedia]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </motion.div>
                      
                      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-full sm:max-w-lg mx-auto">
                        {displayImages.map((image: string, index: number) => (
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

                    {/* DESIGNED: no price at top; breakdown and grand total shown at bottom after options */}
                    {product.type === 'PLAIN' && (
                      <div>
                        {(() => {
                          // Get unit extension from product data
                          const unitExtension = product.plainProduct?.unitExtension || product.unitExtension || 'per meter';
                          // Extract unit name (e.g., "per meter" -> "meter", "per piece" -> "piece")
                          const unitName = unitExtension.replace(/^per\s+/i, '').trim() || 'meter';
                          const unitDisplay = unitExtension;
                          
                          return (
                            <div className="flex items-baseline gap-3">
                              <span className="font-bold font-normal text-xl sm:text-2xl text-primary not-italic">
                                {format((() => {
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
                                })())}
                              </span>
                              <span className="text-sm text-muted-foreground">{unitDisplay}</span>
                            </div>
                          );
                        })()}
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
                      <h4 className="font-bold mb-4 text-lg">
                        Quantity {product.type === 'PLAIN' ? (() => {
                          const unitExtension = product.plainProduct?.unitExtension || product.unitExtension || 'per meter';
                          const unitName = unitExtension.replace(/^per\s+/i, '').trim() || 'meter';
                          return `(${unitName.charAt(0).toUpperCase() + unitName.slice(1)}s)`;
                        })() : product.type === 'DESIGNED' && selectedFabricId ? '(Meters)' : ''}
                      </h4>
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
                                    if (isSelected) {
                                      const next = { ...selectedVariants };
                                      delete next[String(variant.id)];
                                      setSelectedVariants(next);
                                    } else {
                                      setSelectedVariants({
                                        ...selectedVariants,
                                        [String(variant.id)]: String(option.id)
                                      });
                                    }
                                  }}
                                  className={cn(
                                    "px-4 py-2 rounded-lg border-2 transition-all text-sm",
                                    isSelected
                                      ? "border-primary bg-primary/10 text-primary font-medium"
                                      : "border-border hover:border-primary/50"
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

                  {/* Custom Fields - Only show for regular DESIGNED products (not custom products) */}
                  {!isCustomProduct && product.customFields && product.customFields.length > 0 && (
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
                                disabled={uploadingCustomFieldId === String(field.id)}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0] || null;
                                  if (!file) return;
                                  if (file.size > MAX_CUSTOM_FILE_BYTES) {
                                    toast.error(`File must be ${MAX_CUSTOM_FILE_MB} MB or less.`);
                                    e.target.value = '';
                                    return;
                                  }
                                  if (!localStorage.getItem('authToken')) {
                                    toast.error('Please sign in to upload files.');
                                    e.target.value = '';
                                    return;
                                  }
                                  setUploadingCustomFieldId(String(field.id));
                                  try {
                                    const uploaded = await customProductsApi.uploadMedia([file], 'products/custom-fields');
                                    const url = uploaded?.[0]?.url ?? '';
                                    setCustomFieldValues((prev) => ({ ...prev, [String(field.id)]: url }));
                                    if (url) toast.success('File uploaded.');
                                  } catch (err: any) {
                                    toast.error(err?.message || 'Upload failed.');
                                    setCustomFieldValues((prev) => ({ ...prev, [String(field.id)]: null }));
                                  } finally {
                                    setUploadingCustomFieldId(null);
                                    e.target.value = '';
                                  }
                                }}
                                className="h-11"
                                required={field.isRequired}
                              />
                              {uploadingCustomFieldId === String(field.id) && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                                </p>
                              )}
                              {customFieldValues[String(field.id)] && typeof customFieldValues[String(field.id)] === 'string' && (
                                <a
                                  href={customFieldValues[String(field.id)] as string}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-primary underline break-all"
                                >
                                  View uploaded file
                                </a>
                              )}
                              {field.placeholder && (
                                <p className="text-xs text-muted-foreground">{field.placeholder}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Price Display - Show calculated total only, no breakdown */}
                  {effectiveVariants && effectiveVariants.length > 0 && (
                    <div className="p-4 bg-muted/30 border border-border rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Price</span>
                        <span className="font-bold text-lg text-primary">
                          {format(finalPrice)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* DIGITAL PRODUCT: compact format + delivery */}
                  {product.type === 'DIGITAL' && (
                    <div className="space-y-4">
                      <div className="px-3 py-2 bg-muted/40 border border-border rounded-lg flex items-center gap-2 text-sm">
                        <FileJson className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{getDigitalFileFormat(product.fileUrl)} · Instant</span>
                      </div>
                      
                      {/* Digital Product Price */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
                        <div>
                          <h4 className="font-semibold">Price</h4>
                          <p className="text-sm text-muted-foreground">One-time purchase</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg text-primary">
                            {format(finalPrice)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <div className="text-sm text-muted-foreground line-through">
                              {format(product.originalPrice)}
                            </div>
                          )}
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
                    {/* View Price Breakdown button for PLAIN products - appears before Add to Cart */}
                    {/* View Price Breakdown - PLAIN and DIGITAL (above Add to Cart) */}
                    {(product.type === 'PLAIN' || product.type === 'DIGITAL') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto gap-2"
                        onClick={() => setShowPriceBreakdown(true)}
                      >
                        <Calculator className="w-4 h-4" />
                        View Price Breakdown
                      </Button>
                    )}
                    
                    {product.type === 'DESIGNED' && (
                      <>
                        {selectedFabricId && combinedPrice != null ? (
                          <div className="flex flex-col gap-4">
                            {/* Price breakdown: always visible after fabric, quantity, options */}
                            <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3 text-sm">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1 border-b border-border">
                                Price breakdown
                              </div>
                              {(() => {
                                const effectiveFabricPerMeter = effectivePricingSlabs && effectivePricingSlabs.length > 0
                                  ? calculatePricePerMeter(quantity, fabricPricePerMeter, effectivePricingSlabs)
                                  : fabricPricePerMeter;
                                const fabricSubtotal = effectiveFabricPerMeter * quantity;
                                const basePrint = product.designPrice || 0;
                                let printVariant = 0;
                                if (product.variants && product.variants.length > 0) {
                                  product.variants.forEach((variant: any) => {
                                    const selectedOptionId = selectedVariants[String(variant.id)];
                                    if (selectedOptionId && variant.options) {
                                      const selectedOption = variant.options.find((opt: any) => String(opt.id) === selectedOptionId);
                                      if (selectedOption && selectedOption.priceModifier) {
                                        printVariant += selectedOption.priceModifier;
                                      }
                                    }
                                  });
                                }
                                const printPerMeter = basePrint + printVariant;
                                const printSubtotal = printPerMeter * quantity;
                                return (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Fabric per meter</span>
                                      <span>{format(effectiveFabricPerMeter)}/m</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Print per meter</span>
                                      <span>{format(printPerMeter)}/m</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Meters</span>
                                      <span>× {quantity}</span>
                                    </div>
                                    <div className="flex justify-between font-medium pt-1 border-t border-border/50">
                                      <span>Fabric subtotal</span>
                                      <span>{format(fabricSubtotal)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                      <span>Print subtotal</span>
                                      <span>{format(printSubtotal)}</span>
                                    </div>
                                    <div className="flex justify-between pt-3 mt-2 border-t-2 border-primary/30 font-bold text-base">
                                      <span>Grand total</span>
                                      <span className="text-primary">{format(combinedPrice * quantity)}</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto gap-2"
                              onClick={() => setShowPriceBreakdown(true)}
                            >
                              <Calculator className="w-4 h-4" />
                              View Price Breakdown
                            </Button>
                            <Button
                              size="lg"
                              onClick={handleAddToCart}
                              disabled={addToCartMutation.isPending}
                              className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white gap-2 h-14 text-base px-4 sm:px-6 font-semibold whitespace-normal"
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
                          </div>
                        ) : (
                          <Button
                            size="lg"
                            onClick={() => setShowPlainProductSelection(true)}
                            className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white gap-2 h-14 text-base px-4 sm:px-6 font-semibold whitespace-normal"
                          >
                            <Palette className="w-5 h-5 flex-shrink-0" />
                            <span className="text-center">Select Fabric First</span>
                          </Button>
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
                        disabled={addToWishlistMutation.isPending || removeFromWishlistMutation.isPending || !wishlistProductId}
                      >
                        <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5", isInWishlist && "fill-current")} />
                      </Button>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="rounded-full w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 border-border hover:border-primary hover:bg-primary/5"
                        onClick={handleShare}
                      >
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
      {product.type === 'DESIGNED' && (
        <>
          <PlainProductSelectionPopup
            open={showPlainProductSelection}
            onOpenChange={setShowPlainProductSelection}
            recommendedPlainProductIds={effectiveRecommendedFabrics || []}
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
              customFields={selectedFabric.customFields ?? []}
              onComplete={handleFabricVariantComplete}
            />
          )}
        </>
      )}
      
      {/* Custom Form Dialog (from config) - Only for custom products */}
      {product && product.type === 'DESIGNED' && isCustomProduct && customFormFields.length > 0 && (
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
            productId: Number(product.id),
            fabricId: selectedFabricId ? Number(selectedFabricId) : undefined,
            designPrice: product.designPrice,
            fabricPrice: selectedFabricId ? (() => {
              const effectivePrice = effectivePricingSlabs && effectivePricingSlabs.length > 0
                ? calculatePricePerMeter(quantity, fabricPricePerMeter, effectivePricingSlabs)
                : fabricPricePerMeter;
              return effectivePrice * quantity;
            })() : undefined,
            unitPrice: product.type === 'DESIGNED' ? (combinedPrice ?? undefined) : (product.pricePerMeter || product.price),
            totalPrice: product.type === 'DESIGNED' ? (combinedPrice != null ? combinedPrice * quantity : undefined) : finalPrice,
            quantity: quantity,
            pricePerMeter: product.pricePerMeter || product.price,
            basePrice: product.pricePerMeter || product.price || product.designPrice,
          }}
          productData={product}
          selectedVariants={selectedVariants}
          fabricQuantity={quantity}
          fabricPricePerMeter={fabricPricePerMeter}
          selectedFabricVariants={selectedFabricVariants}
          discountAmount={selectedFabricId && effectivePricingSlabs && effectivePricingSlabs.length > 0 ? (() => {
            const effectivePrice = calculatePricePerMeter(quantity, fabricPricePerMeter, effectivePricingSlabs);
            const discount = fabricPricePerMeter - effectivePrice;
            return discount > 0 ? discount * quantity : 0;
          })() : undefined}
          finalFabricPricePerMeter={selectedFabricId && effectivePricingSlabs && effectivePricingSlabs.length > 0
            ? calculatePricePerMeter(quantity, fabricPricePerMeter, effectivePricingSlabs)
            : fabricPricePerMeter}
        />
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
                  alt={product?.name || 'Product image'}
                  className="max-w-full max-h-[90vh] object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoomScale})` }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ProductDetail;
