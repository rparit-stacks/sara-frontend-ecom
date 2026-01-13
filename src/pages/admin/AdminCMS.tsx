import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Save, Image as ImageIcon, FileText, Globe, Star, Package, MessageSquare, Tag, Instagram, Link as LinkIcon, Copy, Trash2, Plus, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// Mock product data - in real app, this would come from API
const mockProducts = [
  { id: '1', name: 'Rose Garden Silk Saree', price: 8999, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&h=200&fit=crop' },
  { id: '2', name: 'Lavender Cushion Set', price: 2500, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop' },
  { id: '3', name: 'Cherry Blossom Kurti', price: 3499, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&h=200&fit=crop' },
  { id: '4', name: 'Wildflower Dupatta', price: 1599, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&h=200&fit=crop' },
];

const AdminCMS = () => {
  const [landingPageContent, setLandingPageContent] = useState({
    heroTitle: 'Exquisite Handcrafted Textiles',
    heroSubtitle: 'Made in Jaipur, For the World',
    heroDescription: 'Discover timeless artistry in every thread.',
  });

  const [contactPageContent, setContactPageContent] = useState({
    email: 'contact@studiosara.com',
    phone: '+91 9876543210',
    address: '123 Artisan Street, Jaipur, Rajasthan',
  });

  // Best Sellers State
  const [bestSellers, setBestSellers] = useState<string[]>(['1', '2', '3']);

  // New Arrivals State
  const [newArrivals, setNewArrivals] = useState<string[]>(['4', '1']);

  // Testimonials State
  const [testimonials, setTestimonials] = useState([
    { id: '1', name: 'Priya Sharma', text: 'Beautiful quality! The prints are stunning and the fabric is so soft.', rating: 5, location: 'Mumbai', isActive: true },
    { id: '2', name: 'Anita Reddy', text: 'Fast delivery and gorgeous packaging. The kurti fits perfectly.', rating: 5, location: 'Bangalore', isActive: true },
    { id: '3', name: 'Meera Patel', text: 'The customization options are amazing. They helped me create the perfect outfit.', rating: 5, location: 'Ahmedabad', isActive: true },
  ]);
  const [testimonialLinks, setTestimonialLinks] = useState<Array<{ id: string; link: string; createdAt: string }>>([]);

  // Offers State
  const [offers, setOffers] = useState([
    { id: '1', title: 'Get 20% Off Your First Order', description: 'Join our community and be the first to know about new collections', isActive: true },
  ]);

  // Instagram Posts State
  const [instagramPosts, setInstagramPosts] = useState<string[]>([
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=400&fit=crop',
  ]);

  // Generate testimonial link
  const generateTestimonialLink = () => {
    const linkId = `testimonial-${Date.now()}`;
    const link = `${window.location.origin}/testimonial/${linkId}`;
    setTestimonialLinks([...testimonialLinks, { id: linkId, link, createdAt: new Date().toISOString() }]);
    toast.success('Testimonial link generated!');
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const toggleTestimonialActive = (id: string) => {
    setTestimonials(testimonials.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };

  const removeTestimonial = (id: string) => {
    setTestimonials(testimonials.filter(t => t.id !== id));
  };

  const addBestSeller = (productId: string) => {
    if (!bestSellers.includes(productId) && bestSellers.length < 10) {
      setBestSellers([...bestSellers, productId]);
    }
  };

  const removeBestSeller = (productId: string) => {
    setBestSellers(bestSellers.filter(id => id !== productId));
  };

  const addNewArrival = (productId: string) => {
    if (!newArrivals.includes(productId)) {
      setNewArrivals([...newArrivals, productId]);
    }
  };

  const removeNewArrival = (productId: string) => {
    setNewArrivals(newArrivals.filter(id => id !== productId));
  };

  const addInstagramPost = (url: string) => {
    if (url && !instagramPosts.includes(url)) {
      setInstagramPosts([...instagramPosts, url]);
    }
  };

  const removeInstagramPost = (url: string) => {
    setInstagramPosts(instagramPosts.filter(p => p !== url));
  };

  const activeTestimonials = testimonials.filter(t => t.isActive).slice(0, 10);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
            Content <span className="text-primary">Management</span>
          </h1>
          <p className="text-muted-foreground text-lg">Edit website content and pages</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Tabs defaultValue="best-sellers" className="w-full">
            <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 gap-2 overflow-x-auto">
              <TabsTrigger value="best-sellers" className="gap-2 whitespace-nowrap">
                <Star className="w-4 h-4" />
                <span className="hidden lg:inline">Best Sellers</span>
              </TabsTrigger>
              <TabsTrigger value="new-arrivals" className="gap-2 whitespace-nowrap">
                <Package className="w-4 h-4" />
                <span className="hidden lg:inline">New Arrivals</span>
              </TabsTrigger>
              <TabsTrigger value="testimonials" className="gap-2 whitespace-nowrap">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden lg:inline">Testimonials</span>
              </TabsTrigger>
              <TabsTrigger value="offers" className="gap-2 whitespace-nowrap">
                <Tag className="w-4 h-4" />
                <span className="hidden lg:inline">Offers</span>
              </TabsTrigger>
              <TabsTrigger value="instagram" className="gap-2 whitespace-nowrap">
                <Instagram className="w-4 h-4" />
                <span className="hidden lg:inline">Instagram</span>
              </TabsTrigger>
              <TabsTrigger value="landing" className="gap-2 whitespace-nowrap">
                <Globe className="w-4 h-4" />
                <span className="hidden lg:inline">Landing</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-2 whitespace-nowrap">
                <FileText className="w-4 h-4" />
                <span className="hidden lg:inline">Contact</span>
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-2 whitespace-nowrap">
                <ImageIcon className="w-4 h-4" />
                <span className="hidden lg:inline">Media</span>
              </TabsTrigger>
              <TabsTrigger value="banners" className="gap-2 whitespace-nowrap">
                <ImageIcon className="w-4 h-4" />
                <span className="hidden lg:inline">Banners</span>
              </TabsTrigger>
            </TabsList>

            {/* Best Sellers */}
            <TabsContent value="best-sellers" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">Manage Best Sellers</h3>
                  <p className="text-sm text-muted-foreground mb-6">Select products to display in the Best Sellers section on the homepage.</p>
                  
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-2 block">Add Product</label>
                    <Select onValueChange={addBestSeller}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a product to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProducts
                          .filter(p => !bestSellers.includes(p.id))
                          .map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Selected Best Sellers ({bestSellers.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bestSellers.map(productId => {
                        const product = mockProducts.find(p => p.id === productId);
                        if (!product) return null;
                        return (
                          <div key={productId} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                            <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">₹{product.price.toLocaleString('en-IN')}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBestSeller(productId)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Button className="btn-primary gap-2">
                    <Save className="w-4 h-4" />
                    Save Best Sellers
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            {/* New Arrivals */}
            <TabsContent value="new-arrivals" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">Manage New Arrivals</h3>
                  <p className="text-sm text-muted-foreground mb-6">Select products to display in the New Arrivals section on the homepage.</p>
                  
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-2 block">Add Product</label>
                    <Select onValueChange={addNewArrival}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a product to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProducts
                          .filter(p => !newArrivals.includes(p.id))
                          .map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Selected New Arrivals ({newArrivals.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {newArrivals.map(productId => {
                        const product = mockProducts.find(p => p.id === productId);
                        if (!product) return null;
                        return (
                          <div key={productId} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                            <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">₹{product.price.toLocaleString('en-IN')}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeNewArrival(productId)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Button className="btn-primary gap-2">
                    <Save className="w-4 h-4" />
                    Save New Arrivals
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            {/* Testimonials */}
            <TabsContent value="testimonials" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">Manage Testimonials</h3>
                  <p className="text-sm text-muted-foreground mb-6">Generate unique links to collect testimonials from customers. Maximum 10 testimonials can be displayed on the homepage.</p>
                  
                  {/* Generate Link Section */}
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <h4 className="text-sm font-medium mb-3">Generate Testimonial Collection Link</h4>
                    <Button onClick={generateTestimonialLink} className="btn-primary gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Generate New Link
                    </Button>
                  </div>

                  {/* Generated Links */}
                  {testimonialLinks.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <h4 className="text-sm font-medium">Generated Links</h4>
                      {testimonialLinks.map((linkData) => (
                        <div key={linkData.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                          <Input value={linkData.link} readOnly className="flex-1" />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyLink(linkData.link)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Testimonials List */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">
                      All Testimonials ({testimonials.length}) - Active: {activeTestimonials.length}/10
                    </h4>
                    <div className="space-y-3">
                      {testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold">{testimonial.name}</p>
                                <span className="text-xs text-muted-foreground">({testimonial.location})</span>
                                {testimonial.isActive && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Active</span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">"{testimonial.text}"</p>
                              <div className="flex gap-1">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleTestimonialActive(testimonial.id)}
                                disabled={!testimonial.isActive && activeTestimonials.length >= 10}
                              >
                                {testimonial.isActive ? (
                                  <X className="w-4 h-4" />
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTestimonial(testimonial.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="btn-primary gap-2">
                    <Save className="w-4 h-4" />
                    Save Testimonials
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            {/* Offers */}
            <TabsContent value="offers" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">Manage Offers</h3>
                  <p className="text-sm text-muted-foreground mb-6">Add, update, or remove offers displayed on the homepage.</p>
                  
                  <div className="space-y-4">
                    {offers.map((offer) => (
                      <div key={offer.id} className="p-4 border border-border rounded-lg space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Offer Title</label>
                          <Input
                            value={offer.title}
                            onChange={(e) => setOffers(offers.map(o => o.id === offer.id ? { ...o, title: e.target.value } : o))}
                            className="h-11"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Description</label>
                          <textarea
                            value={offer.description}
                            onChange={(e) => setOffers(offers.map(o => o.id === offer.id ? { ...o, description: e.target.value } : o))}
                            className="w-full min-h-[100px] px-3 py-2 border border-border rounded-lg resize-none"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={offer.isActive}
                              onChange={(e) => setOffers(offers.map(o => o.id === offer.id ? { ...o, isActive: e.target.checked } : o))}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Active</span>
                          </label>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setOffers(offers.filter(o => o.id !== offer.id))}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => setOffers([...offers, { id: `offer-${Date.now()}`, title: '', description: '', isActive: true }])}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Offer
                  </Button>

                  <Button className="btn-primary gap-2">
                    <Save className="w-4 h-4" />
                    Save Offers
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            {/* Instagram Posts */}
            <TabsContent value="instagram" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">Manage Instagram Posts</h3>
                  <p className="text-sm text-muted-foreground mb-6">Add or remove Instagram posts displayed on the homepage.</p>
                  
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-2 block">Add Instagram Post URL</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter image URL"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addInstagramPost((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input) {
                            addInstagramPost(input.value);
                            input.value = '';
                          }
                        }}
                        className="btn-primary"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {instagramPosts.map((post, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={post}
                          alt={`Instagram post ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInstagramPost(post)}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button className="btn-primary gap-2">
                    <Save className="w-4 h-4" />
                    Save Instagram Posts
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            {/* Landing Page Editor */}
            <TabsContent value="landing" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">Hero Title</label>
                  <Input
                    value={landingPageContent.heroTitle}
                    onChange={(e) => setLandingPageContent({ ...landingPageContent, heroTitle: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Hero Subtitle</label>
                  <Input
                    value={landingPageContent.heroSubtitle}
                    onChange={(e) => setLandingPageContent({ ...landingPageContent, heroSubtitle: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Hero Description</label>
                  <textarea
                    value={landingPageContent.heroDescription}
                    onChange={(e) => setLandingPageContent({ ...landingPageContent, heroDescription: e.target.value })}
                    className="w-full min-h-[120px] px-3 py-2 border border-border rounded-lg resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Hero Image</label>
                  <Input type="file" accept="image/*" className="h-11" />
                </div>
                <Button className="btn-primary gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </motion.div>
            </TabsContent>

            {/* Contact Page Editor */}
            <TabsContent value="contact" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    type="email"
                    value={contactPageContent.email}
                    onChange={(e) => setContactPageContent({ ...contactPageContent, email: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Phone</label>
                  <Input
                    value={contactPageContent.phone}
                    onChange={(e) => setContactPageContent({ ...contactPageContent, phone: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Address</label>
                  <textarea
                    value={contactPageContent.address}
                    onChange={(e) => setContactPageContent({ ...contactPageContent, address: e.target.value })}
                    className="w-full min-h-[100px] px-3 py-2 border border-border rounded-lg resize-none"
                  />
                </div>
                <Button className="btn-primary gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </motion.div>
            </TabsContent>

            {/* Media Library */}
            <TabsContent value="media" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl border border-border shadow-sm p-6"
              >
                <div className="mb-6">
                  <Input type="file" accept="image/*" multiple className="h-11" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                      className="aspect-square rounded-lg overflow-hidden bg-muted"
                    >
                      <img
                        src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=200&h=200&fit=crop`}
                        alt={`Media ${i}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </TabsContent>

            {/* Banner Management */}
            <TabsContent value="banners" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">Banner Image</label>
                  <Input type="file" accept="image/*" className="h-11" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Date</label>
                    <Input type="datetime-local" className="h-11" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">End Date</label>
                    <Input type="datetime-local" className="h-11" />
                  </div>
                </div>
                <Button className="btn-primary gap-2">
                  <Save className="w-4 h-4" />
                  Save Banner
                </Button>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminCMS;
