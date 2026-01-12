import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Share2, Truck, RotateCcw, Shield, Star, Minus, Plus, ChevronRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import ProductCard, { Product } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Mock product data
const product = {
  id: '1',
  name: 'Rose Garden Silk Scarf',
  price: 89.99,
  originalPrice: 120,
  images: [
    'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&h=1000&fit=crop',
  ],
  category: 'Scarves',
  description: 'Luxurious silk scarf featuring an elegant rose garden print. Hand-finished edges with delicate stitching. Perfect for adding a touch of sophistication to any outfit.',
  colors: ['Blush Pink', 'Cream', 'Sage Green'],
  sizes: ['One Size'],
  material: '100% Mulberry Silk',
  care: 'Dry clean only',
  rating: 4.8,
  reviewCount: 124,
  inStock: true,
  isNew: true,
};

const relatedProducts: Product[] = [
  { id: '2', name: 'Lavender Fields Cushion', price: 45.00, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=500&fit=crop', category: 'Home Decor' },
  { id: '3', name: 'Cherry Blossom Dress', price: 159.99, originalPrice: 199, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop', category: 'Clothing', isSale: true },
  { id: '4', name: 'Wildflower Print Tote', price: 35.00, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop', category: 'Bags', isNew: true },
  { id: '5', name: 'Peony Paradise Blouse', price: 79.99, image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=500&fit=crop', category: 'Clothing' },
];

const reviews = [
  { id: 1, name: 'Sarah M.', rating: 5, date: '2 weeks ago', text: 'Absolutely stunning scarf! The silk is so soft and the colors are even more beautiful in person.', verified: true },
  { id: 2, name: 'Emily R.', rating: 5, date: '1 month ago', text: 'Perfect gift for my mother. She loved it! The packaging was beautiful too.', verified: true },
  { id: 3, name: 'Jessica L.', rating: 4, date: '1 month ago', text: 'Beautiful design and quality. Slightly smaller than expected but still love it.', verified: true },
];

const ProductDetail = () => {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);

  return (
    <Layout>
      {/* Breadcrumb */}
      <section className="bg-secondary/30 py-4">
        <div className="container-custom">
          <nav className="flex items-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to={`/category/${product.category.toLowerCase()}`} className="hover:text-primary transition-colors">{product.category}</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>
      </section>

      {/* Product Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images */}
            <ScrollReveal direction="left">
              <div className="space-y-4">
                {/* Main Image */}
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="aspect-[4/5] rounded-2xl overflow-hidden bg-secondary/30"
                >
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                
                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index 
                          ? 'border-primary' 
                          : 'border-transparent hover:border-primary/50'
                      }`}
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

            {/* Product Info */}
            <ScrollReveal direction="right">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Badges */}
                <div className="flex gap-2">
                  {product.isNew && <Badge className="bg-accent text-accent-foreground">New Arrival</Badge>}
                  {product.originalPrice && (
                    <Badge className="bg-destructive text-destructive-foreground">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% Off
                    </Badge>
                  )}
                </div>

                {/* Title & Price */}
                <div>
                  <p className="text-muted-foreground mb-2">{product.category}</p>
                  <h1 className="font-serif text-3xl md:text-4xl mb-4">{product.name}</h1>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-warm text-warm' : 'text-muted'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.rating} ({product.reviewCount} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-3xl text-primary">${product.price}</span>
                    {product.originalPrice && (
                      <span className="text-xl text-muted-foreground line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-muted-foreground">{product.description}</p>

                {/* Color Selection */}
                <div>
                  <h4 className="font-medium mb-3">Color: <span className="text-muted-foreground">{selectedColor}</span></h4>
                  <div className="flex gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-full border-2 transition-all ${
                          selectedColor === color
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <h4 className="font-medium mb-3">Quantity</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-border rounded-full">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button size="lg" className="flex-1 btn-primary gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Add to Cart
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full">
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <Truck className="w-6 h-6 mx-auto text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">Free Shipping</span>
                  </div>
                  <div className="text-center">
                    <RotateCcw className="w-6 h-6 mx-auto text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">Easy Returns</span>
                  </div>
                  <div className="text-center">
                    <Shield className="w-6 h-6 mx-auto text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">Secure Payment</span>
                  </div>
                </div>

                {/* Accordion Details */}
                <Accordion type="single" collapsible className="border-t border-border pt-4">
                  <AccordionItem value="details">
                    <AccordionTrigger>Product Details</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 text-muted-foreground">
                        <li><strong>Material:</strong> {product.material}</li>
                        <li><strong>Care:</strong> {product.care}</li>
                        <li><strong>Size:</strong> {product.sizes.join(', ')}</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="shipping">
                    <AccordionTrigger>Shipping & Returns</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">
                        Free standard shipping on orders over $50. Express shipping available. 
                        30-day return policy for unused items in original packaging.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </ScrollReveal>
          </div>

          {/* Reviews Section */}
          <div className="mt-16">
            <Tabs defaultValue="reviews">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 gap-8">
                <TabsTrigger 
                  value="reviews" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-4"
                >
                  Reviews ({product.reviewCount})
                </TabsTrigger>
                <TabsTrigger 
                  value="qa" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-4"
                >
                  Q&A
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="reviews" className="pt-8">
                <div className="grid md:grid-cols-3 gap-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-card p-6 rounded-2xl border border-border">
                      <div className="flex gap-1 mb-3">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-warm text-warm" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4">"{review.text}"</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{review.name}</p>
                          <p className="text-sm text-muted-foreground">{review.date}</p>
                        </div>
                        {review.verified && (
                          <Badge variant="secondary">Verified</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="qa" className="pt-8">
                <p className="text-muted-foreground">No questions yet. Be the first to ask!</p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="section-padding bg-secondary/30">
        <div className="container-custom">
          <ScrollReveal>
            <h2 className="font-serif text-2xl md:text-3xl mb-8">You May Also Like</h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((product, index) => (
              <ScrollReveal key={product.id} delay={index * 0.1}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetail;
