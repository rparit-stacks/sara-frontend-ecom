import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Share2, Truck, RotateCcw, Shield, Star, Minus, Plus, ChevronRight, Palette, Info, CheckCircle2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

// Conceptual Custom Product State
const getCustomProductData = (designUrl: string | null) => ({
  id: 'temp-custom-product',
  name: 'Your Custom Studio Sara Piece',
  basePrice: 1499,
  description: 'A one-of-a-kind Studio Sara product created with your unique design. Premium quality, handcrafted specifically for you.',
  variants: [
    {
      id: 'v2',
      name: 'Size',
      options: [
        { id: 's1', name: '45x45 cm', extraPrice: 0 },
        { id: 's2', name: '90x90 cm', extraPrice: 500 }
      ]
    }
  ]
});

const CustomProductDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const designUrl = (location.state as any)?.designUrl;
  const mockups = (location.state as any)?.mockups || [];
  
  useEffect(() => {
    if (!designUrl) {
      toast.error('Please upload a design first.');
      navigate('/customize');
    }
  }, [designUrl, navigate]);

  const customProduct = getCustomProductData(designUrl);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
    'v2': 's1'
  });
  const [quantity, setQuantity] = useState(1);

  const currentSize = customProduct.variants[0].options.find(o => o.id === selectedVariants['v2']) as any;
  const totalPrice = (customProduct.basePrice + (currentSize?.extraPrice || 0)) * quantity;

  const handleAddToCart = () => {
    toast.success('Custom product added to cart! It will be saved permanently once you purchase.');
  };

  if (!designUrl) return null;

  const displayImages = mockups.length > 0 ? mockups.map((m: any) => m.url) : [designUrl];

  return (
    <Layout>
      {/* Session Header */}
      <section className="w-full bg-primary/5 py-4 border-b border-primary/10">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Temporary Session: Custom Product Generated from your PSDs
          </div>
          <p className="text-xs text-muted-foreground hidden md:block">
            These mockups were generated in real-time. Complete purchase to save them permanently.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <section className="w-full bg-secondary/30 py-5">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <nav className="flex items-center text-sm text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0" />
            <Link to="/customize" className="hover:text-primary transition-colors">Custom Design</Link>
            <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0" />
            <span className="text-foreground truncate">{customProduct.name}</span>
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
                  {/* Main Preview */}
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="aspect-square rounded-2xl overflow-hidden bg-secondary/30 border border-border shadow-md mx-auto max-w-lg relative"
                  >
                    <img
                      src={displayImages[selectedImage]}
                      alt="Product mockup"
                      className="w-full h-full object-cover"
                    />
                    
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-white/90 text-primary border-primary/20 backdrop-blur-sm gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Generated Mockup
                      </Badge>
                    </div>
                  </motion.div>
                  
                  {/* Gallery Thumbnails */}
                  <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
                    {displayImages.map((img: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          selectedImage === index 
                            ? 'border-primary shadow-sm' 
                            : 'border-transparent hover:border-primary/50'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Mockup ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <button 
                      onClick={() => navigate('/customize')}
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
                  {/* Badges */}
                  <div className="flex gap-3">
                    <Badge className="bg-primary text-white text-sm px-4 py-1 border-none shadow-sm">Custom Creation</Badge>
                    <Badge variant="outline" className="text-sm px-4 py-1">Headless Generated</Badge>
                  </div>

                  {/* Title & Price */}
                  <div>
                    <p className="text-muted-foreground mb-3 text-lg">Personalized Product</p>
                    <h1 className="font-cursive text-5xl lg:text-6xl mb-5">{customProduct.name}</h1>
                    
                    {/* Price */}
                    <div className="flex items-center gap-4">
                      <span className="font-cursive text-4xl text-primary">₹{totalPrice}</span>
                      <span className="text-sm text-muted-foreground mt-2">Incl. all custom processing</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-lg leading-relaxed">{customProduct.description}</p>

                  {/* Dynamic Variants */}
                  {customProduct.variants.map((variant) => (
                    <div key={variant.id} className="space-y-4">
                      <h4 className="font-medium text-lg flex items-center gap-2">
                        {variant.name}: 
                        <span className="text-muted-foreground">
                          {variant.options.find(o => o.id === selectedVariants[variant.id])?.name}
                        </span>
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {variant.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setSelectedVariants({
                              ...selectedVariants,
                              [variant.id]: option.id
                            })}
                            className={`px-5 py-3 rounded-full border-2 transition-all text-base flex items-center gap-2 ${
                              selectedVariants[variant.id] === option.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {option.name}
                            {option.extraPrice > 0 && (
                              <span className="text-xs text-primary font-bold">(+₹{option.extraPrice})</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Quantity */}
                  <div>
                    <h4 className="font-medium mb-4 text-lg">Quantity (Pieces)</h4>
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
                        Custom processing time: 5-7 days
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 flex-wrap pt-4">
                    <Button 
                      size="lg" 
                      onClick={handleAddToCart}
                      className="flex-1 min-w-[220px] btn-primary gap-3 h-14 text-base"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      Add Custom Product to Cart
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-full w-14 h-14">
                      <Heart className="w-5 h-5" />
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
    </Layout>
  );
};

export default CustomProductDetail;
