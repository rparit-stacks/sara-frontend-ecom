import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Save, Image as ImageIcon, FileText, Globe, Star, Package, MessageSquare, Tag, Instagram, Link as LinkIcon, Copy, Trash2, Plus, X, Loader2, Upload, Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cmsApi, productsApi, mediaApi } from '@/lib/api';

const AdminCMS = () => {
  const queryClient = useQueryClient();
  
  // Fetch CMS data from API
  const { data: cmsData, isLoading: cmsLoading } = useQuery({
    queryKey: ['cms'],
    queryFn: () => cmsApi.getHomepage(),
  });
  
  // Fetch offers separately for admin management
  const { data: allOffers = [], refetch: refetchOffers } = useQuery({
    queryKey: ['admin-offers'],
    queryFn: () => cmsApi.getAllOffers(),
  });
  
  // Fetch testimonials separately for admin management
  const { data: allTestimonials = [], refetch: refetchTestimonials } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: () => cmsApi.getAllTestimonials(),
  });
  
  // Fetch banners separately for admin management
  const { data: allBanners = [], refetch: refetchBanners } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => cmsApi.getAllBanners(),
  });
  
  // Fetch announcement/marquee text
  const { data: announcementData } = useQuery({
    queryKey: ['announcement'],
    queryFn: () => cmsApi.getAnnouncement(),
  });
  
  // Announcement state
  const [announcementText, setAnnouncementText] = useState('');
  
  // Update announcement state when data loads
  useEffect(() => {
    if (announcementData?.text) {
      setAnnouncementText(announcementData.text);
    }
  }, [announcementData]);
  
  // Announcement mutation
  const saveAnnouncementMutation = useMutation({
    mutationFn: (text: string) => cmsApi.setAnnouncement(text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement'] });
      toast.success('Announcement saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save announcement');
    },
  });
  
  // Testimonial mutations
  const createTestimonialMutation = useMutation({
    mutationFn: (data: any) => cmsApi.createTestimonial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      toast.success('Testimonial created successfully!');
      refetchTestimonials();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create testimonial');
    },
  });
  
  const updateTestimonialMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => cmsApi.updateTestimonial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      toast.success('Testimonial updated successfully!');
      refetchTestimonials();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update testimonial');
    },
  });
  
  const deleteTestimonialMutation = useMutation({
    mutationFn: (id: number) => cmsApi.deleteTestimonial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      toast.success('Testimonial deleted successfully!');
      refetchTestimonials();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete testimonial');
    },
  });
  
  // Fetch products for selection
  const { data: apiProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });
  
  // Transform products for selection
  const products = apiProducts.map((p: any) => ({
    id: String(p.id),
    name: p.name,
    price: p.price || p.basePrice || 0,
    image: p.images?.[0] || '',
  }));
  
  // Best Sellers mutation
  const saveBestSellersMutation = useMutation({
    mutationFn: (productIds: number[]) => cmsApi.setBestSellers(productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      queryClient.invalidateQueries({ queryKey: ['cms'] });
      toast.success('Best Sellers saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save Best Sellers');
    },
  });
  
  // New Arrivals mutation
  const saveNewArrivalsMutation = useMutation({
    mutationFn: (productIds: number[]) => cmsApi.setNewArrivals(productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      queryClient.invalidateQueries({ queryKey: ['cms'] });
      toast.success('New Arrivals saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save New Arrivals');
    },
  });
  
  // Instagram mutation
  const saveInstagramMutation = useMutation({
    mutationFn: (posts: Array<{ imageUrl: string; linkUrl?: string }>) => cmsApi.setInstagramPosts(posts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      queryClient.invalidateQueries({ queryKey: ['cms'] });
      toast.success('Instagram posts saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save Instagram posts');
    },
  });
  
  // Contact Info mutation
  const saveContactContentMutation = useMutation({
    mutationFn: (content: Record<string, string>) => cmsApi.setContactInfo(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      queryClient.invalidateQueries({ queryKey: ['cms'] });
      queryClient.invalidateQueries({ queryKey: ['contactInfo'] });
      toast.success('Contact info saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save contact info');
    },
  });
  
  // Banner mutations
  const createBannerMutation = useMutation({
    mutationFn: (data: any) => cmsApi.createBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      toast.success('Banner created successfully!');
      refetchBanners();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create banner');
    },
  });
  
  const updateBannerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => cmsApi.updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      toast.success('Banner updated successfully!');
      refetchBanners();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update banner');
    },
  });
  
  const deleteBannerMutation = useMutation({
    mutationFn: (id: number) => cmsApi.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      toast.success('Banner deleted successfully!');
      refetchBanners();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete banner');
    },
  });
  
  // Banner state
  const [banners, setBanners] = useState<any[]>([]);
  
  useEffect(() => {
    if (allBanners.length > 0) {
      setBanners(allBanners);
    }
  }, [allBanners]);
  

  // Local state for forms
  const [contactPageContent, setContactPageContent] = useState({
    email: '',
    phone: '',
    address: '',
  });

  // Best Sellers State
  const [bestSellers, setBestSellers] = useState<string[]>([]);

  // New Arrivals State
  const [newArrivals, setNewArrivals] = useState<string[]>([]);

  // Testimonials State
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [testimonialLinks, setTestimonialLinks] = useState<Array<{ id: string; link: string; createdAt: string }>>([]);

  // Offers State - initialize from API
  const [offers, setOffers] = useState<any[]>([]);
  
  // Offer mutations
  const createOfferMutation = useMutation({
    mutationFn: (data: any) => cmsApi.createOffer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      toast.success('Offer created successfully!');
      refetchOffers();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create offer');
    },
  });
  
  const updateOfferMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => cmsApi.updateOffer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      toast.success('Offer updated successfully!');
      refetchOffers();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update offer');
    },
  });
  
  const deleteOfferMutation = useMutation({
    mutationFn: (id: number) => cmsApi.deleteOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
      toast.success('Offer deleted successfully!');
      refetchOffers();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete offer');
    },
  });

  // Instagram Posts State
  const [instagramPosts, setInstagramPosts] = useState<Array<{ imageUrl: string; linkUrl?: string }>>([]);
  
  // Update local state when CMS data loads
  useEffect(() => {
    if (cmsData) {
      // Handle both property name variations (bestSellerIds/bestSellers)
      const bestSellerIds = cmsData.bestSellerIds || cmsData.bestSellers || [];
      const newArrivalIds = cmsData.newArrivalIds || cmsData.newArrivals || [];
      
      if (bestSellerIds.length > 0) {
        setBestSellers(bestSellerIds.map(String));
      }
      if (newArrivalIds.length > 0) {
        setNewArrivals(newArrivalIds.map(String));
      }
      if (cmsData.instagramPosts) {
        // Handle both old format (string[]) and new format (Array<{imageUrl, linkUrl}>)
        if (Array.isArray(cmsData.instagramPosts) && cmsData.instagramPosts.length > 0) {
          if (typeof cmsData.instagramPosts[0] === 'string') {
            // Old format - convert to new format
            setInstagramPosts(cmsData.instagramPosts.map((url: string) => ({ imageUrl: url })));
          } else {
            // New format
            setInstagramPosts(cmsData.instagramPosts);
          }
        }
      }
      if (cmsData.contactInfo) {
        setContactPageContent({
          email: cmsData.contactInfo.email || '',
          phone: cmsData.contactInfo.phone || '',
          address: cmsData.contactInfo.address || '',
        });
      }
    }
  }, [cmsData]);

  // Generate testimonial link mutation
  const generateLinkMutation = useMutation({
    mutationFn: () => cmsApi.generateTestimonialLink(),
    onSuccess: (data) => {
      const fullLink = `${window.location.origin}/testimonial/${data.linkId}`;
      setTestimonialLinks([...testimonialLinks, { 
        id: data.linkId, 
        link: fullLink, 
        createdAt: data.createdAt || new Date().toISOString() 
      }]);
      queryClient.invalidateQueries({ queryKey: ['admin-testimonial-links'] });
      toast.success('Testimonial link generated!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate link');
    },
  });
  
  // Fetch testimonial links from API
  const { data: apiTestimonialLinks = [] } = useQuery({
    queryKey: ['admin-testimonial-links'],
    queryFn: () => cmsApi.getTestimonialLinks(),
  });
  
  // Update testimonial links state when API data loads
  useEffect(() => {
    if (apiTestimonialLinks && apiTestimonialLinks.length > 0) {
      const formattedLinks = apiTestimonialLinks.map((link: any) => ({
        id: link.linkId || link.id,
        link: link.fullLink || `${window.location.origin}/testimonial/${link.linkId || link.id}`,
        createdAt: link.createdAt || new Date().toISOString(),
        isUsed: link.isUsed !== undefined ? link.isUsed : false,
      }));
      setTestimonialLinks(formattedLinks);
    }
  }, [apiTestimonialLinks]);
  
  // Generate testimonial link
  const generateTestimonialLink = () => {
    generateLinkMutation.mutate();
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const toggleTestimonialActive = (testimonial: any) => {
    if (testimonial.id && typeof testimonial.id === 'number') {
      updateTestimonialMutation.mutate({
        id: testimonial.id,
        data: {
          name: testimonial.name,
          text: testimonial.text,
          rating: testimonial.rating,
          location: testimonial.location,
          isActive: !testimonial.isActive,
        },
      });
    }
  };

  const removeTestimonial = (testimonialId: number) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      deleteTestimonialMutation.mutate(testimonialId);
    }
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

  const addInstagramPost = (imageUrl: string, linkUrl?: string) => {
    if (!imageUrl || !imageUrl.trim()) {
      toast.error('Please select an image or enter image URL');
      return;
    }
    
    const trimmedImageUrl = imageUrl.trim();
    const trimmedLinkUrl = linkUrl?.trim() || '';
    
    // Check if already exists
    const existingPost = instagramPosts.find(p => {
      const postImageUrl = typeof p === 'string' ? p : p.imageUrl;
      return postImageUrl === trimmedImageUrl;
    });
    
    if (existingPost) {
      toast.error('This image is already added');
      return;
    }
    
    // Add to list - simple and direct
    setInstagramPosts([...instagramPosts, { 
      imageUrl: trimmedImageUrl, 
      linkUrl: trimmedLinkUrl || undefined 
    }]);
    
    toast.success('Instagram post added successfully!');
  };

  const handleInstagramImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploadingInstagram(true);
    try {
      // Upload to Cloudinary in instagram folder
      const imageUrl = await mediaApi.upload(file, 'instagram');
      
      // Set the uploaded image URL in the input field
      setNewInstagramImage(imageUrl);
      
      toast.success('Image uploaded successfully! Now add Instagram link and click Add Post.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
      console.error('Error uploading image:', error);
    } finally {
      setIsUploadingInstagram(false);
    }
  };

  const updateInstagramPost = (index: number, field: 'imageUrl' | 'linkUrl', value: string) => {
    const updatedPosts = [...instagramPosts];
    updatedPosts[index] = {
      ...updatedPosts[index],
      [field]: value
    };
    setInstagramPosts(updatedPosts);
  };

  const removeInstagramPost = (index: number) => {
    setInstagramPosts(instagramPosts.filter((_, i) => i !== index));
  };

  const activeTestimonials = testimonials.filter(t => t.isActive).slice(0, 10);
  
  // Save handlers
  const saveBestSellers = () => {
    saveBestSellersMutation.mutate(bestSellers.map(Number));
  };
  
  const saveNewArrivals = () => {
    saveNewArrivalsMutation.mutate(newArrivals.map(Number));
  };
  
  const saveTestimonials = () => {
    // Testimonials are managed individually via create/update/delete mutations
    toast.info('Use individual Save/Delete buttons on each testimonial');
  };
  
  // Update offers state when API data loads
  useEffect(() => {
    if (allOffers.length > 0) {
      setOffers(allOffers);
    }
  }, [allOffers]);
  
  // Update testimonials state when API data loads
  useEffect(() => {
    if (allTestimonials && allTestimonials.length > 0) {
      setTestimonials(allTestimonials);
    } else if (allTestimonials && allTestimonials.length === 0) {
      // Clear testimonials if API returns empty array
      setTestimonials([]);
    }
  }, [allTestimonials]);
  
  const handleSaveOffer = (offer: any) => {
    if (offer.id && typeof offer.id === 'number') {
      // Update existing offer
      updateOfferMutation.mutate({
        id: offer.id,
        data: {
          title: offer.title,
          description: offer.description,
          isActive: offer.isActive,
        },
      });
    } else {
      // Create new offer
      createOfferMutation.mutate({
        title: offer.title,
        description: offer.description,
        isActive: offer.isActive,
      });
    }
  };
  
  const handleDeleteOffer = (offerId: number) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      deleteOfferMutation.mutate(offerId);
    }
  };
  
  const saveInstagram = () => {
    saveInstagramMutation.mutate(instagramPosts);
  };
  
  // State for adding new Instagram post
  const [newInstagramImage, setNewInstagramImage] = useState('');
  const [newInstagramLink, setNewInstagramLink] = useState('');
  const [isUploadingInstagram, setIsUploadingInstagram] = useState(false);
  const instagramFileInputRef = useRef<HTMLInputElement>(null);


  const saveContactContent = () => {
    saveContactContentMutation.mutate(contactPageContent);
  };
  
  if (cmsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

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
          <Tabs defaultValue="announcement" className="w-full">
            <TabsList className="flex w-full gap-2 overflow-x-auto pb-1">
              <TabsTrigger value="announcement" className="gap-2 whitespace-nowrap">
                <Megaphone className="w-4 h-4" />
                <span className="hidden lg:inline">Announcement</span>
              </TabsTrigger>
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
              <TabsTrigger value="contact" className="gap-2 whitespace-nowrap">
                <FileText className="w-4 h-4" />
                <span className="hidden lg:inline">Contact</span>
              </TabsTrigger>
              <TabsTrigger value="banners" className="gap-2 whitespace-nowrap">
                <ImageIcon className="w-4 h-4" />
                <span className="hidden lg:inline">Banners</span>
              </TabsTrigger>
            </TabsList>

            {/* Announcement/Marquee */}
            <TabsContent value="announcement" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">Manage Announcement Bar</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Edit the scrolling announcement text displayed at the top of the website. This is shown on every page.
                  </p>
                  
                  {/* Preview */}
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <label className="text-sm font-medium mb-2 block">Preview</label>
                    <div className="bg-foreground text-background text-xs py-2 px-4 rounded overflow-hidden">
                      <div className="whitespace-nowrap">
                        {announcementText || 'Made to order. Dispatch takes 5–6 days (India)'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Edit */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Announcement Text</label>
                      <Input
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        className="h-11"
                        placeholder="e.g., Made to order. Dispatch takes 5–6 days (India)"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        This text will scroll continuously in the announcement bar at the top of your website.
                      </p>
                    </div>
                    
                    {/* Suggestions */}
                    <div className="p-4 border border-border rounded-lg bg-muted/30">
                      <p className="text-sm font-medium mb-3">Quick suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Free shipping on orders above ₹999',
                          '20% OFF on your first order - Use code: FIRST20',
                          'Made to order. Dispatch takes 5–6 days',
                          'New arrivals just dropped! Shop now',
                          'Sale live: Up to 50% OFF',
                        ].map((suggestion) => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            onClick={() => setAnnouncementText(suggestion)}
                            className="text-xs"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="btn-primary gap-2 mt-6" 
                    onClick={() => saveAnnouncementMutation.mutate(announcementText)} 
                    disabled={saveAnnouncementMutation.isPending || !announcementText.trim()}
                  >
                    {saveAnnouncementMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Announcement
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

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
                        {products
                          .filter((p: any) => !bestSellers.includes(p.id))
                          .map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">
                      Selected Best Sellers ({bestSellers.length})
                      {bestSellers.length > 0 && (
                        <span className="text-xs text-primary ml-2 font-normal">✓ Currently on homepage</span>
                      )}
                    </h4>
                    {bestSellers.length === 0 ? (
                      <div className="p-6 border border-dashed border-border rounded-lg text-center text-muted-foreground bg-muted/30">
                        <p className="text-sm">No products selected. Add products to display on homepage.</p>
                        <p className="text-xs mt-1">Homepage will show fallback products until you add selections.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bestSellers.map(productId => {
                          const product = products.find((p: any) => String(p.id) === String(productId));
                          if (!product) {
                            return (
                              <div key={productId} className="flex items-center gap-4 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-destructive">Product ID: {productId}</p>
                                  <p className="text-xs text-muted-foreground">Product not found in catalog</p>
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
                          }
                          return (
                            <div key={productId} className="flex items-center gap-4 p-4 border border-border rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                              {product.image && (
                                <img 
                                  src={product.image} 
                                  alt={product.name} 
                                  className="w-16 h-16 object-cover rounded border-2 border-primary/20"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-muted-foreground">₹{product.price.toLocaleString('en-IN')}</p>
                                <p className="text-xs text-primary mt-1 font-medium">✓ Active on homepage</p>
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
                    )}
                  </div>

                  <Button className="btn-primary gap-2" onClick={saveBestSellers} disabled={saveBestSellersMutation.isPending}>
                    {saveBestSellersMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Best Sellers
                      </>
                    )}
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
                        {products
                          .filter((p: any) => !newArrivals.includes(p.id))
                          .map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">
                      Selected New Arrivals ({newArrivals.length})
                      {newArrivals.length > 0 && (
                        <span className="text-xs text-primary ml-2 font-normal">✓ Currently on homepage</span>
                      )}
                    </h4>
                    {newArrivals.length === 0 ? (
                      <div className="p-6 border border-dashed border-border rounded-lg text-center text-muted-foreground bg-muted/30">
                        <p className="text-sm">No products selected. Add products to display on homepage.</p>
                        <p className="text-xs mt-1">Homepage will show fallback products until you add selections.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {newArrivals.map(productId => {
                          const product = products.find((p: any) => String(p.id) === String(productId));
                          if (!product) {
                            return (
                              <div key={productId} className="flex items-center gap-4 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-destructive">Product ID: {productId}</p>
                                  <p className="text-xs text-muted-foreground">Product not found in catalog</p>
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
                          }
                          return (
                            <div key={productId} className="flex items-center gap-4 p-4 border border-border rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                              {product.image && (
                                <img 
                                  src={product.image} 
                                  alt={product.name} 
                                  className="w-16 h-16 object-cover rounded border-2 border-primary/20"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-muted-foreground">₹{product.price.toLocaleString('en-IN')}</p>
                                <p className="text-xs text-primary mt-1 font-medium">✓ Active on homepage</p>
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
                    )}
                  </div>

                  <Button className="btn-primary gap-2" onClick={saveNewArrivals} disabled={saveNewArrivalsMutation.isPending}>
                    {saveNewArrivalsMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save New Arrivals
                      </>
                    )}
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
                  <div className="mb-6 p-4 bg-muted rounded-lg space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Generate Testimonial Collection Link</h4>
                      <p className="text-xs text-muted-foreground">
                        Generate a unique link to collect testimonials from customers. Share this link with customers to submit their testimonials.
                      </p>
                    </div>

                    {/* Generated Links */}
                    {testimonialLinks.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Generated Links ({testimonialLinks.length})</h4>
                        {testimonialLinks.map((linkData: any) => (
                          <div key={linkData.id} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background">
                            <Input value={linkData.link} readOnly className="flex-1 font-mono text-sm" />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyLink(linkData.link)}
                              title="Copy link"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            {linkData.isUsed && (
                              <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                                Used
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Button 
                      onClick={generateTestimonialLink} 
                      className="btn-primary gap-2" 
                      disabled={generateLinkMutation.isPending}
                    >
                      {generateLinkMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4" />
                          Generate New Link
                        </>
                      )}
                    </Button>
                  </div>

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
                                onClick={() => toggleTestimonialActive(testimonial)}
                                disabled={(!testimonial.isActive && activeTestimonials.length >= 10) || updateTestimonialMutation.isPending}
                              >
                                {testimonial.isActive ? (
                                  <X className="w-4 h-4" />
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                              </Button>
                              {testimonial.id && typeof testimonial.id === 'number' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeTestimonial(testimonial.id)}
                                  className="text-destructive hover:text-destructive"
                                  disabled={deleteTestimonialMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mt-4">
                    <p>Use individual Save/Delete buttons on each testimonial card to manage them.</p>
                  </div>
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
                            value={offer.title || ''}
                            onChange={(e) => setOffers(offers.map(o => o.id === offer.id ? { ...o, title: e.target.value } : o))}
                            className="h-11"
                            placeholder="e.g., Get 20% Off Your First Order"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Description</label>
                          <textarea
                            value={offer.description || ''}
                            onChange={(e) => setOffers(offers.map(o => o.id === offer.id ? { ...o, description: e.target.value } : o))}
                            className="w-full min-h-[100px] px-3 py-2 border border-border rounded-lg resize-none"
                            placeholder="Enter offer description..."
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={offer.isActive !== false}
                              onChange={(e) => setOffers(offers.map(o => o.id === offer.id ? { ...o, isActive: e.target.checked } : o))}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">Active (visible on homepage)</span>
                          </label>
                          <div className="flex gap-2">
                            {offer.id && typeof offer.id === 'number' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSaveOffer(offer)}
                                disabled={updateOfferMutation.isPending || !offer.title}
                                className="gap-2"
                              >
                                {updateOfferMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4" />
                                    Save
                                  </>
                                )}
                              </Button>
                            )}
                            {offer.id && typeof offer.id === 'number' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteOffer(offer.id)}
                                className="text-destructive hover:text-destructive"
                                disabled={deleteOfferMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                            {(!offer.id || typeof offer.id !== 'number') && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSaveOffer(offer)}
                                  disabled={createOfferMutation.isPending || !offer.title}
                                  className="gap-2"
                                >
                                  {createOfferMutation.isPending ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-4 h-4" />
                                      Save
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setOffers(offers.filter(o => o.id !== offer.id))}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => setOffers([...offers, { id: `new-${Date.now()}`, title: '', description: '', isActive: true }])}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Offer
                  </Button>
                  
                  {offers.some(o => !o.id || typeof o.id !== 'number') && (
                    <div className="text-sm text-muted-foreground mt-4">
                      <p>New offers will be saved when you click "Save" on each offer card.</p>
                    </div>
                  )}
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
                  <p className="text-sm text-muted-foreground mb-6">Add image and link for Instagram posts displayed on the homepage.</p>
                  
                  {/* Add New Instagram Post */}
                  <div className="mb-6 p-4 border border-border rounded-lg bg-muted/30">
                    <label className="text-sm font-medium mb-3 block">Add New Instagram Post</label>
                    <div className="space-y-3">
                      {/* Upload Image */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Select Image *</label>
                        <div className="flex gap-2">
                          <input
                            ref={instagramFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleInstagramImageUpload}
                            className="hidden"
                            disabled={isUploadingInstagram}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => instagramFileInputRef.current?.click()}
                            disabled={isUploadingInstagram}
                            className="flex-1 gap-2"
                          >
                            {isUploadingInstagram ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-4 h-4" />
                                Choose Image
                              </>
                            )}
                          </Button>
                        </div>
                        {newInstagramImage && (
                          <p className="text-xs text-muted-foreground mt-1.5">Selected: {newInstagramImage.length > 50 ? newInstagramImage.substring(0, 50) + '...' : newInstagramImage}</p>
                        )}
                      </div>
                      
                      {/* Image URL (Alternative) */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Or Enter Image URL</label>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          value={newInstagramImage}
                          onChange={(e) => setNewInstagramImage(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      
                      {/* Instagram Link */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Instagram Link (Post/Reel/Story)</label>
                        <Input
                          placeholder="https://www.instagram.com/p/ABC123/ or /reel/ABC123/"
                          value={newInstagramLink}
                          onChange={(e) => setNewInstagramLink(e.target.value)}
                          className="h-10"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Supports posts, reels, and all Instagram links</p>
                      </div>
                      
                      <Button
                        onClick={() => {
                          if (newInstagramImage.trim()) {
                            addInstagramPost(newInstagramImage, newInstagramLink);
                            setNewInstagramImage('');
                            setNewInstagramLink('');
                            if (instagramFileInputRef.current) {
                              instagramFileInputRef.current.value = '';
                            }
                          } else {
                            toast.error('Please select an image or enter image URL');
                          }
                        }}
                        className="btn-primary gap-2 w-full"
                        disabled={isUploadingInstagram || !newInstagramImage.trim()}
                      >
                        <Plus className="w-4 h-4" />
                        Add Post
                      </Button>
                    </div>
                  </div>

                  {/* Existing Instagram Posts */}
                  <div className="space-y-4 mb-6">
                    {instagramPosts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                        <Instagram className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No Instagram posts added yet</p>
                      </div>
                    ) : (
                      instagramPosts.map((post, index) => {
                        // Handle both old format (string) and new format (object)
                        const imageUrl = typeof post === 'string' ? post : post?.imageUrl || '';
                        const linkUrl = typeof post === 'string' ? undefined : post?.linkUrl;
                        
                        return (
                        <div key={index} className="p-4 border border-border rounded-lg bg-card">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0">
                              <img
                                src={imageUrl}
                                alt={`Instagram post ${index + 1}`}
                                className="w-24 h-24 object-cover rounded-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                                }}
                              />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block">Image URL</label>
                                <Input
                                  value={imageUrl}
                                  onChange={(e) => updateInstagramPost(index, 'imageUrl', e.target.value)}
                                  className="h-9 text-sm"
                                  placeholder="Image URL"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block">Link URL</label>
                                <Input
                                  value={linkUrl || ''}
                                  onChange={(e) => updateInstagramPost(index, 'linkUrl', e.target.value)}
                                  className="h-9 text-sm"
                                  placeholder="https://www.instagram.com/p/ABC123/"
                                />
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeInstagramPost(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        );
                      })
                    )}
                  </div>

                  <Button className="btn-primary gap-2" onClick={saveInstagram} disabled={saveInstagramMutation.isPending}>
                    {saveInstagramMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Instagram Posts
                      </>
                    )}
                  </Button>
                </div>
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
                <Button className="btn-primary gap-2" onClick={saveContactContent} disabled={saveContactContentMutation.isPending}>
                  {saveContactContentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </motion.div>
            </TabsContent>

            {/* Banner Management (Landing Page Slider) */}
            <TabsContent value="banners" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">Manage Landing Page Slider</h3>
                  <p className="text-sm text-muted-foreground mb-6">Add, update, or remove slider banners displayed on the homepage.</p>
                  
                  <div className="space-y-6">
                    {banners.map((banner) => (
                      <div key={banner.id} className="p-4 border border-border rounded-lg space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Banner Image</label>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  value={banner.image || ''}
                                  onChange={(e) => setBanners(banners.map(b => b.id === banner.id ? { ...b, image: e.target.value } : b))}
                                  className="h-11 flex-1"
                                  placeholder="Image URL or upload"
                                />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id={`banner-upload-${banner.id}`}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const url = await mediaApi.upload(file, 'banners');
                                        setBanners(banners.map(b => b.id === banner.id ? { ...b, image: url } : b));
                                        toast.success('Image uploaded successfully!');
                                      } catch (error: any) {
                                        toast.error(error.message || 'Failed to upload image');
                                      }
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => document.getElementById(`banner-upload-${banner.id}`)?.click()}
                                  className="gap-2"
                                >
                                  <Upload className="w-4 h-4" />
                                  Upload
                                </Button>
                              </div>
                              {banner.image && (
                                <img src={banner.image} alt="Banner preview" className="w-full h-32 object-cover rounded" />
                              )}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Title (Small Text)</label>
                              <Input
                                value={banner.title || ''}
                                onChange={(e) => setBanners(banners.map(b => b.id === banner.id ? { ...b, title: e.target.value } : b))}
                                className="h-11"
                                placeholder="e.g., New Collection 2024"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Subtitle (Large Text)</label>
                              <Input
                                value={banner.subtitle || ''}
                                onChange={(e) => setBanners(banners.map(b => b.id === banner.id ? { ...b, subtitle: e.target.value } : b))}
                                className="h-11"
                                placeholder="e.g., Embrace the Art of Floral"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Button Text</label>
                              <Input
                                value={banner.buttonText || ''}
                                onChange={(e) => setBanners(banners.map(b => b.id === banner.id ? { ...b, buttonText: e.target.value } : b))}
                                className="h-11"
                                placeholder="e.g., Shop Now"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Link (Page to Land)</label>
                              <Input
                                value={banner.link || ''}
                                onChange={(e) => setBanners(banners.map(b => b.id === banner.id ? { ...b, link: e.target.value } : b))}
                                className="h-11"
                                placeholder="e.g., /products or /categories"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Display Order</label>
                              <Input
                                type="number"
                                value={banner.displayOrder || 0}
                                onChange={(e) => setBanners(banners.map(b => b.id === banner.id ? { ...b, displayOrder: parseInt(e.target.value) || 0 } : b))}
                                className="h-11"
                                placeholder="0"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={banner.isActive !== false}
                                onChange={(e) => setBanners(banners.map(b => b.id === banner.id ? { ...b, isActive: e.target.checked } : b))}
                                className="w-4 h-4"
                              />
                              <label className="text-sm">Active (visible on homepage)</label>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const bannerData = {
                                image: banner.image,
                                title: banner.title,
                                subtitle: banner.subtitle,
                                buttonText: banner.buttonText,
                                link: banner.link,
                                displayOrder: banner.displayOrder || 0,
                                isActive: banner.isActive !== false,
                              };
                              if (banner.id) {
                                updateBannerMutation.mutate({ id: banner.id, data: bannerData });
                              } else {
                                createBannerMutation.mutate(bannerData);
                              }
                            }}
                            disabled={updateBannerMutation.isPending || createBannerMutation.isPending || !banner.image}
                            className="gap-2"
                          >
                            {(updateBannerMutation.isPending || createBannerMutation.isPending) ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                {banner.id ? 'Update' : 'Create'} Banner
                              </>
                            )}
                          </Button>
                          {banner.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteBannerMutation.mutate(banner.id)}
                              disabled={deleteBannerMutation.isPending}
                              className="text-destructive hover:text-destructive gap-2"
                            >
                              {deleteBannerMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => setBanners([...banners, { image: '', title: '', subtitle: '', buttonText: 'Shop Now', link: '/products', displayOrder: banners.length, isActive: true }])}
                    >
                      <Plus className="w-4 h-4" />
                      Add New Banner
                    </Button>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

// Media Manager Component
const IMAGES_PER_PAGE = 50;

const MediaManager = ({ onImageSelect }: { onImageSelect?: (url: string) => void }) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: mediaData, isLoading, refetch } = useQuery({
    queryKey: ['cloudinary-media', selectedFolder],
    queryFn: () => mediaApi.listAll(selectedFolder === 'all' ? undefined : selectedFolder),
  });
  
  const deleteMutation = useMutation({
    mutationFn: (url: string) => mediaApi.delete(url),
    onSuccess: () => {
      toast.success('Image deleted successfully!');
      setSelectedImages(new Set());
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete image');
    },
  });
  
  const bulkDeleteMutation = useMutation({
    mutationFn: (urls: string[]) => mediaApi.bulkDelete(urls),
    onSuccess: (result) => {
      const successCount = result.success.length;
      const failedCount = result.failed.length;
      if (failedCount === 0) {
        toast.success(`Successfully deleted ${successCount} image(s)!`);
      } else {
        toast.warning(`Deleted ${successCount} image(s), ${failedCount} failed`);
      }
      setSelectedImages(new Set());
      setDeleteConfirmOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete images');
    },
  });
  
  const allImages = mediaData?.images || [];
  const totalImages = allImages.length;
  const totalPages = Math.ceil(totalImages / IMAGES_PER_PAGE);
  
  // Get current page images
  const startIndex = currentPage * IMAGES_PER_PAGE;
  const endIndex = startIndex + IMAGES_PER_PAGE;
  const currentPageImages = allImages.slice(startIndex, endIndex);
  
  // Reset page when folder changes
  useEffect(() => {
    setCurrentPage(0);
    setSelectedImages(new Set());
  }, [selectedFolder]);
  
  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageUrl)) {
        newSet.delete(imageUrl);
      } else {
        newSet.add(imageUrl);
      }
      return newSet;
    });
  };
  
  const selectAllOnPage = () => {
    setSelectedImages(new Set(currentPageImages.map((img: any) => img.url)));
  };
  
  const selectAllImages = () => {
    setSelectedImages(new Set(allImages.map((img: any) => img.url)));
  };
  
  const deselectAllImages = () => {
    setSelectedImages(new Set());
  };
  
  const handleBulkDelete = () => {
    if (selectedImages.size === 0) return;
    setDeleteConfirmOpen(true);
  };
  
  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedImages));
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const folder = selectedFolder === 'all' ? 'banners' : selectedFolder;
      await mediaApi.upload(file, folder);
      toast.success('Image uploaded successfully!');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const folders = [
    { value: 'all', label: 'All Images' },
    { value: 'banners', label: 'Banners' },
    { value: 'categories', label: 'Categories' },
    { value: 'products/images', label: 'Products' },
    { value: 'instagram', label: 'Instagram' },
  ];
  
  const allOnPageSelected = currentPageImages.length > 0 && 
    currentPageImages.every((img: any) => selectedImages.has(img.url));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Media Manager</h3>
            <p className="text-sm text-muted-foreground">
              {totalImages} images in Cloudinary
              {selectedImages.size > 0 && (
                <span className="ml-2 text-primary font-medium">• {selectedImages.size} selected</span>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger className="w-[160px] h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem key={folder.value} value={folder.value}>
                    {folder.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="media-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              size="sm"
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Selection & Delete Controls */}
        {currentPageImages.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground mr-2">Selection:</span>
            
            {!allOnPageSelected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllOnPage}
                className="gap-2 h-8"
              >
                Select Page ({currentPageImages.length})
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAllImages}
                className="gap-2 h-8"
              >
                <X className="w-3 h-3" />
                Deselect Page
              </Button>
            )}
            
            {totalImages > IMAGES_PER_PAGE && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllImages}
                className="gap-2 h-8"
              >
                Select All ({totalImages})
              </Button>
            )}
            
            {selectedImages.size > 0 && (
              <>
                <div className="w-px h-6 bg-border mx-2" />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="gap-2 h-8"
                >
                  {bulkDeleteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete {selectedImages.size} Image{selectedImages.size > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Images Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : totalImages === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No images found. Upload your first image!
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {currentPageImages.map((image: any, index: number) => {
              const isSelected = selectedImages.has(image.url);
              return (
                <motion.div
                  key={image.publicId || startIndex + index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01, duration: 0.2 }}
                  className={`group relative aspect-square rounded-lg overflow-hidden bg-muted border-2 transition-all ${
                    isSelected ? 'border-primary ring-2 ring-primary shadow-lg' : 'border-border hover:border-primary/50'
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleImageSelection(image.url);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleImageSelection(image.url)}
                      className="w-5 h-5 rounded border-2 border-white bg-white/90 cursor-pointer shadow"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Image */}
                  <div
                    className="w-full h-full cursor-pointer"
                    onClick={() => {
                      if (onImageSelect) {
                        onImageSelect(image.url);
                        toast.success('Image selected!');
                      } else {
                        setSelectedImage(image.url);
                      }
                    }}
                  >
                    <img
                      src={image.url}
                      alt={image.publicId || `Image ${startIndex + index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(image.url);
                          toast.success('URL copied!');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this image?')) {
                            deleteMutation.mutate(image.url);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} - {Math.min(endIndex, totalImages)} of {totalImages} images
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(0)}
                  disabled={currentPage === 0}
                  className="h-8 px-2"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="h-8 px-2"
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>{selectedImages.size}</strong> image{selectedImages.size > 1 ? 's' : ''}? 
              This action cannot be undone.
            </p>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive font-medium">
                Warning: Deleted images may still be referenced in products, banners, or other content.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete {selectedImages.size} Image{selectedImages.size > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Image Preview Dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <img src={selectedImage} alt="Preview" className="w-full h-auto rounded-lg max-h-[60vh] object-contain bg-muted" />
              <div className="flex gap-2">
                <Input value={selectedImage} readOnly className="flex-1 text-xs" />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedImage);
                    toast.success('URL copied!');
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Delete this image?')) {
                      deleteMutation.mutate(selectedImage);
                      setSelectedImage(null);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};

export default AdminCMS;
