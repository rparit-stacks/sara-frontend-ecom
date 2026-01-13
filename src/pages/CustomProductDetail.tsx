import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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

// Mock custom form fields from admin config - In real app, fetch from API: GET /api/admin/custom-config
const getCustomFormFields = (): FormField[] => [
  {
    id: 'field-1',
    type: 'text',
    label: 'Product Name',
    placeholder: 'Enter a name for your custom product',
    required: true,
    min: 3,
    max: 50,
  },
  {
    id: 'field-2',
    type: 'dropdown',
    label: 'Product Category',
    required: true,
    options: ['Home Decor', 'Fashion', 'Accessories'],
  },
];

// Mock design price - In real app, this would come from config
const DESIGN_PRICE = 1000;

const CustomProductDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const designUrl = (location.state as any)?.designUrl;
  const isTemporary = (location.state as any)?.isTemporary ?? true;
  const isCustomDesign = (location.state as any)?.isCustomDesign ?? true;
  
  useEffect(() => {
    if (!designUrl) {
      toast.error('Please upload a design first.');
      navigate('/make-your-own');
    }
  }, [designUrl, navigate]);

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
  const customFormFields = getCustomFormFields();

  // Calculate combined price (Design Price + Fabric Price)
  const combinedPrice = useMemo(() => {
    if (!fabricSelectionData) return DESIGN_PRICE;
    return DESIGN_PRICE + fabricSelectionData.totalPrice;
  }, [fabricSelectionData]);

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

    const productData = {
      id: `custom-${Date.now()}`,
      type: 'CUSTOM',
      name: customFormData['field-1'] || 'Custom Studio Sara Piece',
      designUrl,
      designPrice: DESIGN_PRICE,
      fabricId: fabricSelectionData.fabricId,
      fabricPrice: fabricSelectionData.totalPrice,
      variants: fabricSelectionData.selectedVariants,
      quantity: fabricSelectionData.quantity,
      customFormData,
      totalPrice: combinedPrice,
      isCustom: true,
      savedAt: new Date().toISOString()
    };
    
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    existingCart.push(productData);
    localStorage.setItem('cart', JSON.stringify(existingCart));
    
    setIsSaved(true);
    toast.success('Custom product added to cart and saved!');
  };

  const handleAddToWishlist = () => {
    if (!fabricSelectionData) {
      toast.error('Please select a fabric first');
      return;
    }

    const productData = {
      id: `custom-${Date.now()}`,
      type: 'CUSTOM',
      name: customFormData['field-1'] || 'Custom Studio Sara Piece',
      designUrl,
      designPrice: DESIGN_PRICE,
      fabricId: fabricSelectionData.fabricId,
      fabricPrice: fabricSelectionData.totalPrice,
      variants: fabricSelectionData.selectedVariants,
      customFormData,
      totalPrice: combinedPrice,
      isCustom: true,
      savedAt: new Date().toISOString()
    };
    
    const existingWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    existingWishlist.push(productData);
    localStorage.setItem('wishlist', JSON.stringify(existingWishlist));
    
    setIsSaved(true);
    toast.success('Custom product added to wishlist and saved!');
  };

  if (!designUrl) return null;

  const displayImages = [designUrl]; // Just the uploaded design

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
            <Link to="/make-your-own" className="hover:text-primary transition-colors">Make Your Own</Link>
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
                      alt="Your custom design"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  
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
                    <h1 className="font-cursive text-5xl lg:text-6xl mb-5">Your Custom Design</h1>
                    
                    {/* Price Display */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-4">
                        <span className="font-cursive text-4xl text-primary">₹{combinedPrice}</span>
                      </div>
                      {fabricSelectionData && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Design Price: ₹{DESIGN_PRICE}</p>
                          <p>Fabric Price: ₹{fabricSelectionData.totalPrice}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Create a one-of-a-kind Studio Sara product with your unique design. Select your preferred fabric and customize your product.
                  </p>

                  {/* Fabric Selection - Same as Design Product */}
                  {!fabricSelectionData ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-4 text-lg flex items-center gap-2">
                          <Palette className="w-5 h-5 text-primary" />
                          Select Plain Product (Fabric)
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
                          Browse All Plain Products
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-lg">Selected Fabric</h4>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {fabricSelectionData.quantity} meters
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
                      Add to Cart
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
            recommendedPlainProductIds={[]} // No recommendations for custom designs
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
