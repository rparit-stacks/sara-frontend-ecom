import { useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Share2, Truck, RotateCcw, Shield, Minus, Plus, ChevronRight, Download, Palette, Package, FileJson, IndianRupee } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PlainProductSelectionPopup from '@/components/products/PlainProductSelectionPopup';
import FabricVariantPopup, { FabricVariant } from '@/components/products/FabricVariantPopup';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Product Type
type ProductType = 'PLAIN' | 'DESIGNED' | 'DIGITAL';

// Custom Field Types
export interface CustomField {
  id: string;
  type: 'text' | 'image' | 'input' | 'dropdown';
  label: string;
  value?: string;
  options?: string[];
}

// Detail Section
export interface DetailSection {
  id: string;
  title: string;
  content: string;
}

// Mock product data - in real app, fetch from API: GET /api/products/{id}
const getProductData = (id: string, type?: string): any => {
  const productType = (type as ProductType) || 'DESIGNED';
  
  if (productType === 'DESIGNED') {
    return {
      id: '1',
      type: 'DESIGNED' as ProductType,
      name: 'Floral Garden Design',
      designPrice: 1000,
      images: [
        'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=1000&fit=crop',
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1000&fit=crop',
      ],
      category: 'Designs',
      description: 'Beautiful floral garden design that can be applied to any fabric. Perfect for creating custom products.',
      recommendedPlainProductIds: ['p1', 'p2', 'p3', 'p4'], // Just IDs, not full objects
      customFields: [
        { id: 'cf1', type: 'text', label: 'Design Style', value: 'Floral' },
        { id: 'cf2', type: 'text', label: 'Color Palette', value: 'Pink, Green, White' },
      ],
      detailSections: [
        { id: 'ds1', title: 'Product Details', content: 'This design features intricate floral patterns inspired by traditional Indian art. Perfect for sarees, dupattas, and home decor items.' },
        { id: 'ds2', title: 'Shipping & Returns', content: 'Free standard shipping on orders over ₹500. Express shipping available. 30-day return policy for unused items in original packaging.' },
        { id: 'ds3', title: 'Care Instructions', content: 'Design can be applied to any fabric. Follow fabric-specific care instructions. Avoid direct sunlight to preserve colors.' },
      ],
      inStock: true,
      isNew: true,
    };
  } else if (productType === 'PLAIN') {
    return {
      id: '2',
      type: 'PLAIN' as ProductType,
      name: 'Premium Silk Fabric',
      pricePerMeter: 100,
      images: [
        'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=1000&fit=crop',
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1000&fit=crop',
      ],
      category: 'Fabrics',
      description: 'Premium quality silk fabric. Perfect for creating custom garments and home decor items.',
      variants: [
        {
          id: 'v1',
          type: 'width',
          name: 'Width',
          options: [
            { id: 'w1', value: '45 inches', priceModifier: 0 },
            { id: 'w2', value: '54 inches', priceModifier: 20 },
          ],
        },
        {
          id: 'v2',
          type: 'gsm',
          name: 'GSM',
          options: [
            { id: 'g1', value: '120 GSM', priceModifier: 0 },
            { id: 'g2', value: '150 GSM', priceModifier: 15 },
          ],
        },
      ],
      customFields: [
        { id: 'cf1', type: 'text', label: 'Material', value: '100% Mulberry Silk' },
        { id: 'cf2', type: 'text', label: 'Origin', value: 'India' },
      ],
      detailSections: [
        { id: 'ds1', title: 'Product Details', content: 'Premium quality silk fabric sourced from the finest mulberry silk. Soft, luxurious, and perfect for elegant garments.' },
        { id: 'ds2', title: 'Shipping & Returns', content: 'Free standard shipping on orders over ₹500. Express shipping available. 30-day return policy for unused items in original packaging.' },
        { id: 'ds3', title: 'Care Instructions', content: 'Dry clean only. Store in a cool, dry place. Avoid direct sunlight to prevent fading.' },
      ],
      inStock: true,
      isNew: false,
    };
  } else {
    return {
      id: '3',
      type: 'DIGITAL' as ProductType,
      name: 'Digital Pattern Pack',
      price: 500,
      images: [
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1000&fit=crop',
      ],
      category: 'Digital Products',
      description: 'Downloadable pattern pack with 10 exclusive designs. High-resolution files ready for printing.',
      fileUrl: '/downloads/pattern-pack.zip',
      customFields: [
        { id: 'cf1', type: 'text', label: 'File Format', value: 'PDF, PNG, SVG' },
        { id: 'cf2', type: 'text', label: 'Resolution', value: '300 DPI' },
      ],
      detailSections: [
        { id: 'ds1', title: 'Product Details', content: 'This digital pack includes 10 high-resolution patterns in multiple formats. Perfect for printing and digital use.' },
        { id: 'ds2', title: 'Download Instructions', content: 'After purchase, you will receive a download link via email. Files are available for 30 days. Download can be done multiple times.' },
        { id: 'ds3', title: 'Usage Rights', content: 'Personal and commercial use allowed. Patterns can be used for printing, digital design, and resale of finished products.' },
      ],
      inStock: true,
      isNew: true,
    };
  }
};

const relatedProducts: Product[] = [
  { id: '2', name: 'Lavender Fields Cushion', price: 450, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=500&fit=crop', category: 'Home Decor' },
  { id: '3', name: 'Cherry Blossom Dress', price: 1599, originalPrice: 1999, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop', category: 'Clothing', isSale: true },
  { id: '4', name: 'Wildflower Print Tote', price: 350, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop', category: 'Bags', isNew: true },
  { id: '5', name: 'Peony Paradise Blouse', price: 799, image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=500&fit=crop', category: 'Clothing' },
];

const ProductDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const productType = (searchParams.get('type') as ProductType) || 'DESIGNED';
  const product = getProductData(id || '1', productType);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  // Design Product States
  const [showPlainProductSelection, setShowPlainProductSelection] = useState(false);
  const [showFabricVariant, setShowFabricVariant] = useState(false);
  const [selectedPlainProductId, setSelectedPlainProductId] = useState<string | null>(null);
  const [combinedPrice, setCombinedPrice] = useState<number | null>(null);

  // Plain Product States
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    if (product.type === 'PLAIN' && product.variants) {
      const initial: Record<string, string> = {};
      product.variants.forEach((variant: FabricVariant) => {
        if (variant.options.length > 0) {
          initial[variant.id] = variant.options[0].id;
        }
      });
      return initial;
    }
    return {};
  });

  // Calculate price for plain products (shown directly on page, no popup)
  const plainProductPrice = useMemo(() => {
    if (product.type !== 'PLAIN') return 0;
    let basePrice = product.pricePerMeter || 0;
    
    if (product.variants) {
      product.variants.forEach((variant: FabricVariant) => {
        const selectedOptionId = selectedVariants[variant.id];
        const selectedOption = variant.options.find(opt => opt.id === selectedOptionId);
        if (selectedOption?.priceModifier) {
          basePrice += selectedOption.priceModifier;
        }
      });
    }
    
    return basePrice * quantity;
  }, [product, selectedVariants, quantity]);

  const handlePlainProductSelect = (productId: string) => {
    setSelectedPlainProductId(productId);
    // Open variant popup for the selected plain product
    setShowFabricVariant(true);
  };

  const handleFabricVariantComplete = (data: {
    fabricId: string;
    selectedVariants: Record<string, string>;
    quantity: number;
    totalPrice: number;
  }) => {
    // Calculate combined price: Design Price + Plain Product Price
    const totalPrice = (product.designPrice || 0) + data.totalPrice;
    setCombinedPrice(totalPrice);
    setSelectedPlainProductId(data.fabricId);
    
    // Add to cart
    const cartItem = {
      id: `design-${product.id}-plain-${data.fabricId}-${Date.now()}`,
      type: 'DESIGNED',
      designId: product.id,
      designPrice: product.designPrice,
      plainProductId: data.fabricId,
      plainProductPrice: data.totalPrice,
      variants: data.selectedVariants,
      quantity: data.quantity,
      totalPrice: totalPrice,
    };
    
    // Save to localStorage (in real app, call API)
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    existingCart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(existingCart));
    
    toast.success('Product added to cart!');
  };

  const handlePlainProductAddToCart = () => {
    const cartItem = {
      id: `plain-${product.id}-${Date.now()}`,
      type: 'PLAIN',
      plainProductId: product.id,
      plainProductPrice: plainProductPrice / quantity,
      variants: selectedVariants,
      quantity: quantity,
      totalPrice: plainProductPrice,
    };
    
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    existingCart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(existingCart));
    
    toast.success('Product added to cart!');
  };

  const handleDigitalDownload = () => {
    // In real app, trigger download from API
    toast.success('Download started!');
    // window.open(product.fileUrl, '_blank');
  };

  const getTypeBadge = () => {
    switch (product.type) {
      case 'DESIGNED':
        return <Badge className="bg-pink-100 text-pink-700 border-pink-200 gap-1"><Palette className="w-3 h-3" /> Design Product</Badge>;
      case 'PLAIN':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1"><Package className="w-3 h-3" /> Plain Fabric</Badge>;
      case 'DIGITAL':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1"><FileJson className="w-3 h-3" /> Digital Product</Badge>;
    }
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <section className="w-full bg-secondary/30 py-5">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <nav className="flex items-center text-sm text-muted-foreground flex-wrap">
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
                    className="aspect-square rounded-2xl overflow-hidden bg-secondary/30 border border-border shadow-sm mx-auto max-w-lg"
                  >
                    <img
                      src={product.images[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  
                  <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
                    {product.images.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={cn(
                          "aspect-square rounded-xl overflow-hidden border-2 transition-all",
                          selectedImage === index 
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
                </div>
              </ScrollReveal>
            </div>

            {/* Product Info */}
            <div className="lg:col-span-7">
              <ScrollReveal direction="right">
                <div className="lg:sticky lg:top-24 space-y-8 max-w-2xl">
                  {/* Badges */}
                  <div className="flex gap-3 flex-wrap">
                    {getTypeBadge()}
                    {product.isNew && <Badge className="bg-accent text-accent-foreground text-sm px-4 py-1">New Arrival</Badge>}
                  </div>

                  {/* Title & Price */}
                  <div>
                    <p className="text-muted-foreground mb-3 text-lg">{product.category}</p>
                    <h1 className="font-cursive text-5xl lg:text-6xl mb-5">{product.name}</h1>

                    {/* Price Display */}
                    {product.type === 'DESIGNED' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Design Price</p>
                            <span className="font-cursive text-4xl text-primary">₹{product.designPrice}</span>
                          </div>
                          {combinedPrice && (
                            <div>
                              <p className="text-sm text-muted-foreground">Total (with fabric)</p>
                              <span className="font-cursive text-3xl text-primary">₹{combinedPrice}</span>
                            </div>
                          )}
                        </div>
                        {selectedPlainProductId && (
                          <p className="text-sm text-muted-foreground">
                            Plain product selected
                          </p>
                        )}
                      </div>
                    )}
                    
                    {product.type === 'PLAIN' && (
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Price per meter</p>
                          <span className="font-cursive text-4xl text-primary">₹{product.pricePerMeter}</span>
                        </div>
                        {plainProductPrice > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <span className="font-cursive text-3xl text-primary">₹{plainProductPrice}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {product.type === 'DIGITAL' && (
                      <div className="flex items-center gap-4">
                        <span className="font-cursive text-4xl text-primary">₹{product.price}</span>
                        <Badge variant="secondary" className="text-sm">One-time purchase</Badge>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-lg leading-relaxed">{product.description}</p>

                  {/* Custom Fields */}
                  {product.customFields && product.customFields.length > 0 && (
                    <div className="space-y-3">
                      {product.customFields.map((field: CustomField) => (
                        <div key={field.id} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground min-w-[120px]">{field.label}:</span>
                          <span className="text-base">{field.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* DESIGN PRODUCT: Recommended Plain Products with Checkboxes */}
                  {product.type === 'DESIGNED' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-4 text-lg flex items-center gap-2">
                          <Palette className="w-5 h-5 text-primary" />
                          Recommended Plain Products
                        </h4>
                        {product.recommendedPlainProductIds && product.recommendedPlainProductIds.length > 0 ? (
                          <div className="space-y-3 mb-4">
                            <p className="text-sm text-muted-foreground">
                              Select from recommended options or browse all:
                            </p>
                            <div className="flex flex-wrap gap-3">
                              {product.recommendedPlainProductIds.slice(0, 3).map((productId: string, index: number) => {
                                // Mock product names - in real app, fetch from API
                                const productNames: Record<string, string> = {
                                  'p1': 'Premium Silk Fabric',
                                  'p2': 'Cotton Blue Fabric',
                                  'p3': 'Linen Cream Fabric',
                                  'p4': 'Cotton White Fabric',
                                };
                                const productName = productNames[productId] || `Plain Product ${index + 1}`;
                                const isSelected = selectedPlainProductId === productId;
                                
                                return (
                                  <button
                                    key={productId}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedPlainProductId(null);
                                      } else {
                                        setSelectedPlainProductId(productId);
                                        setShowFabricVariant(true);
                                      }
                                    }}
                                    className={cn(
                                      "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all text-sm",
                                      isSelected
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:border-primary/50 text-foreground"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                                      isSelected
                                        ? "border-primary bg-primary"
                                        : "border-border"
                                    )}>
                                      {isSelected && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                    <span className="font-medium">{productName}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                        <Button
                          onClick={() => setShowPlainProductSelection(true)}
                          variant="outline"
                          className="w-full h-12 text-base gap-2"
                        >
                          <Palette className="w-5 h-5" />
                          {selectedPlainProductId ? 'Change Plain Product' : 'Browse All Plain Products'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* PLAIN PRODUCT: Variant Selection (No popup, direct on page) */}
                  {product.type === 'PLAIN' && product.variants && (
                    <div className="space-y-6">
                      {product.variants.map((variant: FabricVariant) => {
                        const selectedOptionId = selectedVariants[variant.id];
                        const selectedOption = variant.options.find(opt => opt.id === selectedOptionId);
                        
                        return (
                          <div key={variant.id}>
                            <h4 className="font-medium mb-4 text-lg">
                              {variant.name}: <span className="text-muted-foreground">{selectedOption?.value}</span>
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {variant.options.map((option) => (
                                <button
                                  key={option.id}
                                  onClick={() => setSelectedVariants({
                                    ...selectedVariants,
                                    [variant.id]: option.id
                                  })}
                                  className={cn(
                                    "px-5 py-3 rounded-full border-2 transition-all text-base",
                                    selectedOptionId === option.id
                                      ? 'border-primary bg-primary/10'
                                      : 'border-border hover:border-primary/50'
                                  )}
                                >
                                  {option.value}
                                  {option.priceModifier && option.priceModifier > 0 && (
                                    <span className="text-xs text-primary ml-2">(+₹{option.priceModifier})</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      <div>
                        <h4 className="font-medium mb-4 text-lg">Quantity (Meters)</h4>
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
                          <span className="text-base text-muted-foreground">
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DIGITAL PRODUCT: Download Info */}
                  {product.type === 'DIGITAL' && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <FileJson className="w-6 h-6 text-purple-600" />
                        <h4 className="font-semibold text-purple-900">Digital Download</h4>
                      </div>
                      <p className="text-sm text-purple-700">
                        After purchase, you'll receive a download link. Files are high-resolution and ready for printing.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4 flex-wrap pt-4">
                    {product.type === 'DESIGNED' && (
                      <Button
                        size="lg"
                        onClick={() => {
                          if (!selectedPlainProductId) {
                            setShowPlainProductSelection(true);
                          } else {
                            setShowFabricVariant(true);
                          }
                        }}
                        className="flex-1 min-w-[220px] btn-primary gap-3 h-14 text-base"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        {selectedPlainProductId ? 'Add to Cart' : 'Select Plain Product First'}
                      </Button>
                    )}
                    
                    {product.type === 'PLAIN' && (
                      <Button
                        size="lg"
                        onClick={handlePlainProductAddToCart}
                        className="flex-1 min-w-[220px] btn-primary gap-3 h-14 text-base"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        Add to Cart
                      </Button>
                    )}
                    
                    {product.type === 'DIGITAL' && (
                      <Button
                        size="lg"
                        onClick={handleDigitalDownload}
                        className="flex-1 min-w-[220px] btn-primary gap-3 h-14 text-base"
                      >
                        <Download className="w-5 h-5" />
                        Download Now
                      </Button>
                    )}
                    
                    <Button size="lg" variant="outline" className="rounded-full w-14 h-14">
                      <Heart className="w-5 h-5" />
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-full w-14 h-14">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border">
                    <div className="text-center">
                      <Truck className="w-7 h-7 mx-auto text-primary mb-3" />
                      <span className="text-base text-muted-foreground">Free Shipping</span>
                    </div>
                    <div className="text-center">
                      <RotateCcw className="w-7 h-7 mx-auto text-primary mb-3" />
                      <span className="text-base text-muted-foreground">Easy Returns</span>
                    </div>
                    <div className="text-center">
                      <Shield className="w-7 h-7 mx-auto text-primary mb-3" />
                      <span className="text-base text-muted-foreground">Secure Payment</span>
                    </div>
                  </div>

                  {/* Dynamic Detail Sections */}
                  {product.detailSections && product.detailSections.length > 0 && (
                    <Accordion type="single" collapsible className="border-t border-border pt-6">
                      {product.detailSections.map((section: DetailSection) => (
                        <AccordionItem key={section.id} value={section.id}>
                          <AccordionTrigger className="text-lg">{section.title}</AccordionTrigger>
                          <AccordionContent>
                            <p className="text-muted-foreground text-base leading-relaxed">
                              {section.content}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="w-full py-14 lg:py-20 bg-secondary/30">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <ScrollReveal>
            <h2 className="font-cursive text-4xl lg:text-5xl mb-12">You May Also Like</h2>
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

      {/* Popups */}
      {product.type === 'DESIGNED' && product.recommendedPlainProductIds && (
        <>
          <PlainProductSelectionPopup
            open={showPlainProductSelection}
            onOpenChange={setShowPlainProductSelection}
            recommendedPlainProductIds={product.recommendedPlainProductIds}
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

export default ProductDetail;
