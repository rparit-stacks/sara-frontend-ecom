import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { userApi, orderApi, categoriesApi } from '@/lib/api';
import { getPaymentStatusDisplay } from '@/lib/orderUtils';
import { Package, MapPin, User, Edit, Trash2, Plus, Loader2, Check, Gift, ArrowRight, Download, Menu, X, LogOut, Pencil, ChevronRight, LayoutGrid } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MandatoryProfileDialog } from '@/components/MandatoryProfileDialog';

/** Recursive component for personalized category tree with expandable subcategories */
const PersonalizedCategoryItem = ({
  category,
  parentPath,
  navigate,
}: {
  category: any;
  parentPath: string;
  navigate: (path: string) => void;
}) => {
  const slugPath = parentPath ? `${parentPath}/${category.slug || category.id}` : (category.slug || String(category.id));
  const hasSubs = category.subcategories && category.subcategories.length > 0;

  return (
    <AccordionItem value={String(category.id)} className="border rounded-lg px-3 [&>div]:border-none">
      <div className="flex items-center gap-2 py-2 min-h-[44px]">
        {hasSubs ? (
          <>
            <AccordionTrigger className="flex-1 py-2 hover:no-underline">
              <span className="font-medium text-left">{category.name}</span>
            </AccordionTrigger>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/category/${slugPath}`);
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <span
              className="flex-1 font-medium hover:text-primary cursor-pointer py-2"
              onClick={() => navigate(`/category/${slugPath}`)}
            >
              {category.name}
            </span>
            <Button variant="ghost" size="sm" className="shrink-0" onClick={() => navigate(`/category/${slugPath}`)}>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
      {hasSubs && (
        <AccordionContent>
          <div className="pl-4 mt-1 space-y-1 border-l-2 border-muted ml-2 pb-2">
            {(category.subcategories || [])
              .sort((a: any, b: any) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
              .map((sub: any) => (
                <PersonalizedCategoryItem key={sub.id} category={sub} parentPath={slugPath} navigate={navigate} />
              ))}
          </div>
        </AccordionContent>
      )}
    </AccordionItem>
  );
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast: toastHook } = useToast();
  const queryClient = useQueryClient();
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const email = typeof window !== 'undefined' ? localStorage.getItem('authEmail') : null;
  // Get initial tab from navigation state or default to 'profile'
  const initialTab = (location.state as any)?.activeTab || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMandatoryDialog, setShowMandatoryDialog] = useState(false);
  const [isCheckingMandatory, setIsCheckingMandatory] = useState(true);

  const [isProfileEditMode, setIsProfileEditMode] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  const [addressFormData, setAddressFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    isDefault: false,
  });

  useEffect(() => {
    if (!token) {
      toastHook({
        title: 'Sign in required',
        description: 'Please log in to access your dashboard.',
        variant: 'destructive',
      });
      navigate('/login', { replace: true });
      return;
    }
  }, [token, navigate, toastHook]);

  // Fetch user profile with error handling
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const currentToken = localStorage.getItem('authToken');
      console.log('[Dashboard] Fetching profile, token exists:', !!currentToken);
      
      if (!currentToken) {
        console.error('[Dashboard] No token found, redirecting to login');
        navigate('/login', { replace: true });
        throw new Error('No authentication token');
      }
      
      try {
        const result = await userApi.getProfile();
        console.log('[Dashboard] Profile loaded successfully');
        return result;
      } catch (error: any) {
        console.error('[Dashboard] Profile fetch error:', error);
        
        // Check if it's a 401 Unauthorized error
        const isUnauthorized = error?.status === 401 || 
                              error?.message?.includes('401') || 
                              error?.message?.includes('Unauthorized') ||
                              JSON.stringify(error).includes('401');
        
        if (isUnauthorized) {
          console.log('[Dashboard] 401 Unauthorized - token may be invalid or expired');
          // Don't immediately clear token - wait a moment and check again
          // This handles race conditions where token was just set
          const checkToken = localStorage.getItem('authToken');
          if (checkToken && checkToken === currentToken) {
            // Token still exists and matches - it's likely invalid
            console.log('[Dashboard] Token exists but invalid, will clear after delay');
            setTimeout(() => {
              if (localStorage.getItem('authToken') === currentToken) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('authEmail');
                navigate('/login', { replace: true });
              }
            }, 500);
          }
        }
        throw error;
      }
    },
    enabled: !!token,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      const isUnauthorized = error?.status === 401 || 
                            error?.message?.includes('401') || 
                            error?.message?.includes('Unauthorized');
      if (isUnauthorized) {
        console.log('[Dashboard] Not retrying 401 error');
        return false;
      }
      return failureCount < 1; // Retry once for other errors
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Check for mandatory fields after profile loads
  useEffect(() => {
    if (!token) {
      setIsCheckingMandatory(false);
      return;
    }

    if (profile && !profileLoading && !profileError) {
      // Populate profileFormData with data from profile
      setProfileFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phoneNumber: profile.phoneNumber || '',
      });

      const hasMandatoryFields = profile.firstName && profile.lastName && profile.phoneNumber;
      if (!hasMandatoryFields) {
        setShowMandatoryDialog(true);
      } else {
        setShowMandatoryDialog(false);
      }
      setIsCheckingMandatory(false);
    } else if (profileError) {
      setIsCheckingMandatory(false);
    }
  }, [profile, profileLoading, profileError, token]);

  // Check if user has mandatory fields (only check when profile is loaded)
  const hasMandatoryFields = profile ? (profile.firstName && profile.lastName && profile.phoneNumber) : false;

  // Fetch addresses - allow to fetch if token exists and not showing mandatory dialog
  const { data: addresses = [], refetch: refetchAddresses } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: () => userApi.getAddresses(),
    enabled: !!token && !showMandatoryDialog && !isCheckingMandatory,
    retry: 1,
  });

  // Fetch orders - allow to fetch if token exists and not showing mandatory dialog
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['user-orders'],
    queryFn: () => orderApi.getUserOrders(),
    enabled: !!token && !showMandatoryDialog && !isCheckingMandatory,
    retry: 1,
  });

  // Fetch dashboard notification - allow to fetch if token exists and not showing mandatory dialog
  const { data: dashboardNotification } = useQuery({
    queryKey: ['dashboardNotification'],
    queryFn: async () => {
      const result = await categoriesApi.getDashboardNotification();
      console.log('[Dashboard] Dashboard notification:', result);
      return result;
    },
    enabled: !!token && !showMandatoryDialog && !isCheckingMandatory,
    retry: 1,
  });

  // Fetch user's categories for Personalized Portal (only when they have restricted categories)
  const { data: myCategories = [] } = useQuery({
    queryKey: ['myCategories'],
    queryFn: () => categoriesApi.getMyCategories(),
    enabled: !!token && !showMandatoryDialog && !isCheckingMandatory && !!dashboardNotification?.hasRestrictedCategories,
    retry: 1,
  });

  // Derived state for personalized categories
  const hasRestrictedCategories = dashboardNotification?.hasRestrictedCategories === true;
  const effectiveTab = activeTab === 'personalized' && !hasRestrictedCategories ? 'profile' : activeTab;
  
  // Debug logging
  console.log('[Dashboard] hasRestrictedCategories:', hasRestrictedCategories);
  console.log('[Dashboard] dashboardNotification:', dashboardNotification);
  
  // Helper function to recursively check if category or subcategories have allowedEmails
  const hasRestrictedCategoriesInTree = (cat: any): boolean => {
    if (cat.allowedEmails != null && String(cat.allowedEmails).trim() !== '') {
      return true;
    }
    if (cat.subcategories && cat.subcategories.length > 0) {
      return cat.subcategories.some((sub: any) => hasRestrictedCategoriesInTree(sub));
    }
    return false;
  };

  // Filter to only personalized (admin-assigned) categories - includes roots that have restricted subcategories
  const personalizedCategories = (myCategories as any[]).filter(hasRestrictedCategoriesInTree);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated successfully');
      setShowMandatoryDialog(false);
      setIsCheckingMandatory(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  // Handle mandatory profile completion
  const handleMandatoryComplete = async (data: { firstName: string; lastName: string; phoneNumber: string }) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      setProfileFormData(data);
    } catch (error) {
      // Error already handled in mutation
    }
  };

  const handleMandatoryCancel = () => {
    // Just close the dialog - user can still access dashboard but with limited functionality
    setShowMandatoryDialog(false);
    toast.info('You can complete your profile later from the Profile tab');
  };

  const handleMandatoryLogout = () => {
    // User explicitly chose to log out
    localStorage.removeItem('authToken');
    localStorage.removeItem('authEmail');
    toast.info('You have been logged out');
    navigate('/login', { replace: true });
  };

  const handleProfileEditStart = () => {
    setProfileFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phoneNumber: profile?.phoneNumber || '',
    });
    setIsProfileEditMode(true);
  };

  const handleProfileSave = () => {
    updateProfileMutation.mutate(profileFormData, {
      onSuccess: () => setIsProfileEditMode(false),
    });
  };

  const handleProfileCancel = () => {
    setProfileFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phoneNumber: profile?.phoneNumber || '',
    });
    setIsProfileEditMode(false);
  };

  // Address mutations
  const createAddressMutation = useMutation({
    mutationFn: (data: any) => userApi.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast.success('Address added successfully');
      setIsAddressDialogOpen(false);
      resetAddressForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add address');
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => userApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast.success('Address updated successfully');
      setIsAddressDialogOpen(false);
      setEditingAddress(null);
      resetAddressForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update address');
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: number) => userApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast.success('Address deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete address');
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: (id: number) => userApi.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast.success('Default address updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to set default address');
    },
  });

  const resetAddressForm = () => {
    setAddressFormData({
      firstName: '',
      lastName: '',
      email: profile?.email || '',
      phoneNumber: profile?.phoneNumber || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    // Split address into addressLine1 and addressLine2 for display
    const addressParts = (address.address || '').split('\n');
    setAddressFormData({
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      email: address.email || profile?.email || '',
      phoneNumber: address.phoneNumber || profile?.phoneNumber || '',
      addressLine1: addressParts[0] || '',
      addressLine2: addressParts[1] || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      country: address.country || 'India',
      isDefault: address.isDefault || false,
    });
    setIsAddressDialogOpen(true);
  };

  const handleSaveAddress = () => {
    // Transform form data to match backend expectations
    const addressData = {
      firstName: addressFormData.firstName,
      lastName: addressFormData.lastName,
      phoneNumber: addressFormData.phoneNumber,
      address: [addressFormData.addressLine1, addressFormData.addressLine2].filter(Boolean).join('\n'),
      city: addressFormData.city,
      state: addressFormData.state,
      zipCode: addressFormData.zipCode,
      country: addressFormData.country || 'India',
      isDefault: addressFormData.isDefault,
    };

    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressData });
    } else {
      createAddressMutation.mutate(addressData);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authEmail');
    toast.success('Logged out successfully');
    navigate('/', { replace: true });
  };

  // Extract digital products only from orders that are paid (downloads gated by payment status)
  const digitalProducts = orders
    .filter((o: any) => (o.paymentStatus || '').toUpperCase() === 'PAID')
    .flatMap((order: any) =>
      (order.items || [])
        .filter((item: any) => item.productType === 'DIGITAL')
        .map((item: any) => ({
          ...item,
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
        }))
    );

  const handleDigitalDownload = async (item: any) => {
    if (!item.productId) {
      toast.error('Product ID not available');
      return;
    }

    setDownloadingIds(prev => new Set(prev).add(item.productId));
    
    try {
      const blob = await orderApi.downloadDigitalForOrder(item.orderId, item.productId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product_${item.productId}_files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Download started!');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download files');
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(item.productId);
        return next;
      });
    }
  };

  const initials = (profile?.firstName?.[0] || '') + (profile?.lastName?.[0] || profile?.email?.[0] || '');

  // Show loading while checking mandatory fields or loading profile
  if (isCheckingMandatory || (profileLoading && !profile && !profileError)) {
    return (
      <Layout>
        <section className="section-padding min-h-[calc(100vh-200px)] bg-muted/40 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </section>
      </Layout>
    );
  }

  // Show error state only if there's an error and no profile
  if (profileError && !profile) {
    return (
      <Layout>
        <section className="section-padding min-h-[calc(100vh-200px)] bg-muted/40 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-destructive mb-4">Failed to load dashboard. Please try again.</p>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </section>
      </Layout>
    );
  }

  // Block dashboard access ONLY if mandatory dialog is showing (user missing fields)
  // Don't block if user already has fields filled
  if (showMandatoryDialog && profile && (!profile.firstName || !profile.lastName || !profile.phoneNumber)) {
    return (
      <Layout>
        <MandatoryProfileDialog
          open={true}
          email={email || profile?.email || ''}
          onComplete={handleMandatoryComplete}
          onCancel={handleMandatoryCancel}
          onLogout={handleMandatoryLogout}
        />
        <section className="section-padding min-h-[calc(100vh-200px)] bg-muted/40 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Please complete your profile to continue</p>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Mandatory Profile Dialog - Only show if user is missing fields */}
      {showMandatoryDialog && profile && (!profile.firstName || !profile.lastName || !profile.phoneNumber) && (
        <MandatoryProfileDialog
          open={true}
          email={email || profile?.email || ''}
          onComplete={handleMandatoryComplete}
          onCancel={handleMandatoryCancel}
          onLogout={handleMandatoryLogout}
        />
      )}

      <section className="section-padding min-h-[calc(100vh-200px)] bg-muted/40">
        <div className="container-custom max-w-7xl mx-auto py-4 md:py-6 lg:py-8">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-4 pb-4 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <div>
                <h1 className="font-serif text-xl font-semibold">My Account</h1>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <div>
              <h1 className="font-serif text-3xl font-bold">My Account</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your profile, addresses, and orders.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          {/* Dashboard Notification for Restricted Categories - CTA to Personalized Portal */}
          {hasRestrictedCategories && (
            <Card
              className="mb-4 md:mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 cursor-pointer hover:from-primary/15 hover:to-secondary/15 transition-colors"
              onClick={() => {
                setActiveTab('personalized');
                setIsMobileMenuOpen(false);
              }}
            >
              <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/20 p-2 md:p-3 flex-shrink-0">
                    <Gift className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <p className="flex-1 text-sm md:text-base text-foreground">
                    You have a personalized category allotted by the admin.{' '}
                    <span className="font-semibold text-primary underline underline-offset-2">Click here to view.</span>
                  </p>
                  <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
            {/* Sidebar - Desktop & Mobile */}
            <aside className={`w-full lg:w-64 space-y-4 transition-all duration-300 ${
              isMobileMenuOpen ? 'block' : 'hidden lg:block'
            }`}>
              <Card className="bg-card sticky top-4">
                <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-start gap-4">
                    <div className="h-16 w-16 md:h-20 md:w-20 lg:h-16 lg:w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg md:text-xl lg:text-lg flex-shrink-0">
                      <span>{initials || 'U'}</span>
                    </div>
                    <div className="text-center lg:text-left flex-1 min-w-0">
                      <p className="text-sm md:text-base font-medium truncate">
                        {profile?.firstName || profile?.lastName
                          ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
                          : 'User'}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground break-all mt-1">{profile?.email}</p>
                    </div>
                  </div>
                  
                  {/* Mobile Navigation */}
                  <div className="lg:hidden mt-6 pt-6 border-t space-y-2">
                    <Button
                      variant={activeTab === 'profile' ? 'default' : 'ghost'}
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        setActiveTab('profile');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Button>
                    <Button
                      variant={activeTab === 'orders' ? 'default' : 'ghost'}
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        setActiveTab('orders');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Package className="w-4 h-4" />
                      Orders ({orders.length})
                    </Button>
                    <Button
                      variant={activeTab === 'downloads' ? 'default' : 'ghost'}
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        setActiveTab('downloads');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Downloads ({digitalProducts.length})
                    </Button>
                    <Button
                      variant={activeTab === 'addresses' ? 'default' : 'ghost'}
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        setActiveTab('addresses');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <MapPin className="w-4 h-4" />
                      Addresses ({addresses.length})
                    </Button>
                    {hasRestrictedCategories && (
                      <Button
                        variant={activeTab === 'personalized' ? 'default' : 'ghost'}
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          setActiveTab('personalized');
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LayoutGrid className="w-4 h-4" />
                        Personalized
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Desktop Tabs */}
              <Tabs value={effectiveTab} onValueChange={setActiveTab} className="w-full hidden lg:block">
                <TabsList className={`grid w-full mb-6 ${hasRestrictedCategories ? 'grid-cols-5' : 'grid-cols-4'}`}>
                  <TabsTrigger value="profile" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden xl:inline">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="gap-2">
                    <Package className="w-4 h-4" />
                    Orders ({orders.length})
                  </TabsTrigger>
                  <TabsTrigger value="downloads" className="gap-2">
                    <Download className="w-4 h-4" />
                    Downloads ({digitalProducts.length})
                  </TabsTrigger>
                  <TabsTrigger value="addresses" className="gap-2">
                    <MapPin className="w-4 h-4" />
                    Addresses ({addresses.length})
                  </TabsTrigger>
                  {hasRestrictedCategories && (
                    <TabsTrigger value="personalized" className="gap-2">
                      <LayoutGrid className="w-4 h-4" />
                      <span className="hidden xl:inline">Personalized</span>
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Profile Tab: read-only by default, single Edit toggles edit mode */}
                <TabsContent value="profile" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
                  <Card>
                    <CardHeader className="p-4 md:p-6 flex flex-row items-center justify-between gap-4">
                      <CardTitle className="text-lg md:text-xl">Profile</CardTitle>
                      {!profileLoading && (
                        isProfileEditMode ? (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleProfileCancel}>
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleProfileSave} disabled={updateProfileMutation.isPending}>
                              {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" onClick={handleProfileEditStart} className="gap-2">
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Button>
                        )
                      )}
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                      {profileLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : isProfileEditMode ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label>First Name</Label>
                              <Input
                                value={profileFormData.firstName}
                                onChange={(e) => setProfileFormData({ ...profileFormData, firstName: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Last Name</Label>
                              <Input
                                value={profileFormData.lastName}
                                onChange={(e) => setProfileFormData({ ...profileFormData, lastName: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Email</Label>
                            <p className="mt-1 text-sm text-muted-foreground py-2 px-3 rounded-md bg-muted/50 border border-transparent">
                              {profile?.email || ''}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                          </div>
                          <div>
                            <Label>Phone Number</Label>
                            <Input
                              value={profileFormData.phoneNumber}
                              onChange={(e) => setProfileFormData({ ...profileFormData, phoneNumber: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</p>
                              <p className="text-base font-medium mt-1">
                                {profile?.firstName || profile?.lastName
                                  ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || '—'
                                  : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                              <p className="text-base mt-1 break-all">{profile?.email || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</p>
                              <p className="text-base mt-1">{profile?.phoneNumber || '—'}</p>
                            </div>
                          </div>
                          <div className="space-y-3 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm text-muted-foreground">Saved addresses</span>
                              <Button variant="ghost" size="sm" onClick={() => setActiveTab('addresses')} className="text-primary shrink-0">
                                {addresses.length} saved · View
                              </Button>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm text-muted-foreground">Order history</span>
                              <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')} className="text-primary shrink-0">
                                {orders.length} orders · View
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
                  <Card>
                    <CardHeader className="p-4 md:p-6">
                      <CardTitle className="text-lg md:text-xl">Order History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                      {ordersLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">No orders yet</p>
                          <Button className="mt-4" onClick={() => navigate('/products')}>
                            Start Shopping
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3 md:space-y-4">
                          {orders.map((order: any) => (
                            <Card key={order.id} className="border">
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm md:text-base">Order #{order.id}</p>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                      {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                    <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'} className="text-xs">
                                      {order.status}
                                    </Badge>
                                    {(() => {
                                      const d = getPaymentStatusDisplay(order);
                                      return (
                                        <>
                                          <Badge className={`text-xs ${d.className}`}>{d.label}</Badge>
                                          {d.detail && <span className="text-xs text-muted-foreground">{d.detail}</span>}
                                        </>
                                      );
                                    })()}
                                    <p className="font-semibold text-sm md:text-base">₹{order.total?.toLocaleString('en-IN')}</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                    className="w-full sm:w-auto"
                                  >
                                    View Details
                                  </Button>
                                  {(order.paymentStatus || '').toUpperCase() === 'FAILED' &&
                                    (order.items || []).some((i: any) => i.productType === 'DIGITAL') && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => navigate('/checkout')}
                                    >
                                      Pay again
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Digital Downloads Tab */}
                <TabsContent value="downloads" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
                  <Card>
                    <CardHeader className="p-4 md:p-6">
                      <CardTitle className="text-lg md:text-xl">Digital Downloads</CardTitle>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        Download your purchased digital products anytime
                      </p>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                      {ordersLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : digitalProducts.length === 0 ? (
                        <div className="text-center py-12">
                          <Download className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">No digital products purchased yet</p>
                          <Button className="mt-4" onClick={() => navigate('/products')}>
                            Browse Products
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3 md:space-y-4">
                          {digitalProducts.map((item: any, index: number) => (
                            <Card key={`${item.orderId}-${item.productId}-${index}`} className="border">
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                  {item.image && (
                                    <img
                                      src={item.image}
                                      alt={item.name || item.productName}
                                      className="w-16 h-16 object-cover rounded flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm md:text-base">{item.name || item.productName}</p>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                      From Order #{item.orderNumber || item.orderId}
                                    </p>
                                    {item.orderDate && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Purchased on {format(new Date(item.orderDate), 'MMM dd, yyyy')}
                                      </p>
                                    )}
                                    {item.zipPassword && (
                                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded">
                                        <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                                          📦 ZIP Password:
                                        </p>
                                        <p className="text-xs md:text-sm font-mono font-bold text-yellow-900 dark:text-yellow-300 tracking-wider break-all">
                                          {item.zipPassword}
                                        </p>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1 italic">
                                          ZIP is password-protected. Use your account email as the password.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDigitalDownload(item)}
                                    disabled={downloadingIds.has(item.productId)}
                                    className="gap-2 w-full sm:w-auto"
                                  >
                                    {downloadingIds.has(item.productId) ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="w-4 h-4" />
                                        Download
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Personalized Portal Tab */}
                {hasRestrictedCategories && (
                  <TabsContent value="personalized" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
                    <Card>
                      <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-lg md:text-xl">Your Personalized Categories</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Categories assigned to you by the admin. Click to browse products.
                        </p>
                      </CardHeader>
                      <CardContent className="p-4 md:p-6">
                        {personalizedCategories.length === 0 ? (
                          <div className="text-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading your personalized categories...</p>
                          </div>
                        ) : (
                          <Accordion type="multiple" className="w-full space-y-2">
                            {personalizedCategories
                              .sort((a: any, b: any) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
                              .map((cat: any) => (
                                <PersonalizedCategoryItem key={cat.id} category={cat} parentPath="" navigate={navigate} />
                              ))}
                          </Accordion>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {/* Addresses Tab */}
                <TabsContent value="addresses" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
                  <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 md:p-6">
                      <CardTitle className="text-lg md:text-xl">Saved Addresses</CardTitle>
                      <Button onClick={() => { resetAddressForm(); setIsAddressDialogOpen(true); }} className="w-full sm:w-auto" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Address
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                      {addresses.length === 0 ? (
                        <div className="text-center py-12">
                          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">No addresses saved</p>
                          <Button onClick={() => { resetAddressForm(); setIsAddressDialogOpen(true); }}>
                            Add Your First Address
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-3 md:gap-4">
                          {addresses.map((address: any) => (
                            <Card key={address.id} className="border">
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      {address.isDefault && (
                                        <Badge variant="default" className="text-xs">Default</Badge>
                                      )}
                                    </div>
                                    <p className="font-semibold text-sm md:text-base">
                                      {address.firstName} {address.lastName}
                                    </p>
                                    <p className="text-xs md:text-sm text-muted-foreground">{address.addressLine1}</p>
                                    {address.addressLine2 && (
                                      <p className="text-xs md:text-sm text-muted-foreground">{address.addressLine2}</p>
                                    )}
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                      {address.city}, {address.state} {address.postalCode}
                                    </p>
                                    <p className="text-xs md:text-sm text-muted-foreground mt-1">Phone: {address.phone}</p>
                                  </div>
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    {!address.isDefault && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDefaultAddressMutation.mutate(address.id)}
                                        className="flex-1 sm:flex-none"
                                      >
                                        Set Default
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditAddress(address)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteAddressMutation.mutate(address.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Mobile Tabs Content */}
              <div className="lg:hidden mt-4">
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="p-4 flex flex-row items-center justify-between gap-4">
                        <CardTitle className="text-lg">Profile</CardTitle>
                        {!profileLoading && (
                          isProfileEditMode ? (
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={handleProfileCancel}>
                                Cancel
                              </Button>
                              <Button size="sm" onClick={handleProfileSave} disabled={updateProfileMutation.isPending}>
                                {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" onClick={handleProfileEditStart} className="gap-2">
                              <Pencil className="w-4 h-4" />
                              Edit
                            </Button>
                          )
                        )}
                      </CardHeader>
                      <CardContent className="p-4">
                        {profileLoading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        ) : isProfileEditMode ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <Label>First Name</Label>
                                <Input
                                  value={profileFormData.firstName}
                                  onChange={(e) => setProfileFormData({ ...profileFormData, firstName: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label>Last Name</Label>
                                <Input
                                  value={profileFormData.lastName}
                                  onChange={(e) => setProfileFormData({ ...profileFormData, lastName: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Email</Label>
                              <p className="mt-1 text-sm text-muted-foreground py-2 px-3 rounded-md bg-muted/50">
                                {profile?.email || ''}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                            </div>
                            <div>
                              <Label>Phone Number</Label>
                              <Input
                                value={profileFormData.phoneNumber}
                                onChange={(e) => setProfileFormData({ ...profileFormData, phoneNumber: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        ) : (
                          <Accordion type="single" collapsible defaultValue="personal" className="w-full">
                            <AccordionItem value="personal" className="border-b border-border">
                              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                                Personal details
                              </AccordionTrigger>
                              <AccordionContent className="pb-3 space-y-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Name</p>
                                  <p className="text-base font-medium">
                                    {profile?.firstName || profile?.lastName
                                      ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || '—'
                                      : '—'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Email</p>
                                  <p className="text-base break-all">{profile?.email || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Phone</p>
                                  <p className="text-base">{profile?.phoneNumber || '—'}</p>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="addresses" className="border-b border-border">
                              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                                Saved addresses ({addresses.length})
                              </AccordionTrigger>
                              <AccordionContent className="pb-3">
                                <Button variant="ghost" size="sm" className="w-full justify-start text-primary" onClick={() => setActiveTab('addresses')}>
                                  View and manage addresses
                                </Button>
                              </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="orders" className="border-b border-border">
                              <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                                Order history ({orders.length})
                              </AccordionTrigger>
                              <AccordionContent className="pb-3">
                                <Button variant="ghost" size="sm" className="w-full justify-start text-primary" onClick={() => setActiveTab('orders')}>
                                  View order history
                                </Button>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">Order History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {ordersLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">No orders yet</p>
                          <Button className="mt-4" onClick={() => navigate('/products')}>
                            Start Shopping
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.map((order: any) => (
                            <Card key={order.id} className="border">
                              <CardContent className="p-4">
                                <div className="flex flex-col gap-3 mb-3">
                                  <div>
                                    <p className="font-semibold text-sm">Order #{order.id}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'} className="text-xs">
                                        {order.status}
                                      </Badge>
                                      {(() => {
                                        const d = getPaymentStatusDisplay(order);
                                        return (
                                          <>
                                            <Badge className={`text-xs ${d.className}`}>{d.label}</Badge>
                                            {d.detail && <span className="text-xs text-muted-foreground">{d.detail}</span>}
                                          </>
                                        );
                                      })()}
                                    </div>
                                    <p className="font-semibold text-sm">₹{order.total?.toLocaleString('en-IN')}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                  className="w-full"
                                >
                                  View Details
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'downloads' && (
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">Digital Downloads</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Download your purchased digital products anytime
                      </p>
                    </CardHeader>
                    <CardContent className="p-4">
                      {ordersLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : digitalProducts.length === 0 ? (
                        <div className="text-center py-12">
                          <Download className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">No digital products purchased yet</p>
                          <Button className="mt-4" onClick={() => navigate('/products')}>
                            Browse Products
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {digitalProducts.map((item: any, index: number) => (
                            <Card key={`${item.orderId}-${item.productId}-${index}`} className="border">
                              <CardContent className="p-4">
                                <div className="flex flex-col gap-4">
                                  {item.image && (
                                    <img
                                      src={item.image}
                                      alt={item.name || item.productName}
                                      className="w-full h-32 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">{item.name || item.productName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      From Order #{item.orderNumber || item.orderId}
                                    </p>
                                    {item.orderDate && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Purchased on {format(new Date(item.orderDate), 'MMM dd, yyyy')}
                                      </p>
                                    )}
                                    {item.zipPassword && (
                                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded">
                                        <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                                          📦 ZIP Password:
                                        </p>
                                        <p className="text-xs font-mono font-bold text-yellow-900 dark:text-yellow-300 tracking-wider break-all">
                                          {item.zipPassword}
                                        </p>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1 italic">
                                          ZIP is password-protected. Use your account email as the password.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDigitalDownload(item)}
                                    disabled={downloadingIds.has(item.productId)}
                                    className="gap-2 w-full"
                                  >
                                    {downloadingIds.has(item.productId) ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="w-4 h-4" />
                                        Download
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'personalized' && hasRestrictedCategories && (
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">Your Personalized Categories</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Categories assigned to you by the admin. Click to browse products.
                      </p>
                    </CardHeader>
                    <CardContent className="p-4">
                      {personalizedCategories.length === 0 ? (
                        <div className="text-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground text-sm">Loading your personalized categories...</p>
                        </div>
                      ) : (
                        <Accordion type="multiple" className="w-full space-y-2">
                          {personalizedCategories
                            .sort((a: any, b: any) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
                            .map((cat: any) => (
                              <PersonalizedCategoryItem key={cat.id} category={cat} parentPath="" navigate={navigate} />
                            ))}
                        </Accordion>
                      )}
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'addresses' && (
                  <Card>
                    <CardHeader className="flex flex-col gap-4 p-4">
                      <CardTitle className="text-lg">Saved Addresses</CardTitle>
                      <Button onClick={() => { resetAddressForm(); setIsAddressDialogOpen(true); }} className="w-full" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Address
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4">
                      {addresses.length === 0 ? (
                        <div className="text-center py-12">
                          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">No addresses saved</p>
                          <Button onClick={() => { resetAddressForm(); setIsAddressDialogOpen(true); }}>
                            Add Your First Address
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {addresses.map((address: any) => (
                            <Card key={address.id} className="border">
                              <CardContent className="p-4">
                                <div className="flex flex-col gap-4">
                                  <div className="flex-1 min-w-0">
                                    {address.isDefault && (
                                      <Badge variant="default" className="text-xs mb-2">Default</Badge>
                                    )}
                                    <p className="font-semibold text-sm">
                                      {address.firstName} {address.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{address.addressLine1}</p>
                                    {address.addressLine2 && (
                                      <p className="text-xs text-muted-foreground">{address.addressLine2}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      {address.city}, {address.state} {address.postalCode}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Phone: {address.phone}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    {!address.isDefault && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDefaultAddressMutation.mutate(address.id)}
                                        className="flex-1"
                                      >
                                        Set Default
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditAddress(address)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteAddressMutation.mutate(address.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Address Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={addressFormData.firstName}
                  onChange={(e) => setAddressFormData({ ...addressFormData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={addressFormData.lastName}
                  onChange={(e) => setAddressFormData({ ...addressFormData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={addressFormData.email}
                onChange={(e) => setAddressFormData({ ...addressFormData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone Number *</Label>
              <Input
                value={addressFormData.phoneNumber}
                onChange={(e) => setAddressFormData({ ...addressFormData, phoneNumber: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label>Address Line 1 *</Label>
              <Input
                value={addressFormData.addressLine1}
                onChange={(e) => setAddressFormData({ ...addressFormData, addressLine1: e.target.value })}
              />
            </div>
            <div>
              <Label>Address Line 2</Label>
              <Input
                value={addressFormData.addressLine2}
                onChange={(e) => setAddressFormData({ ...addressFormData, addressLine2: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>City *</Label>
                <Input
                  value={addressFormData.city}
                  onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                />
              </div>
              <div>
                <Label>State *</Label>
                <Select
                  value={addressFormData.state}
                  onValueChange={(val) => setAddressFormData({ ...addressFormData, state: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>ZIP Code *</Label>
                <Input
                  value={addressFormData.zipCode}
                  onChange={(e) => setAddressFormData({ ...addressFormData, zipCode: e.target.value })}
                  placeholder="Enter ZIP code"
                />
              </div>
              <div>
                <Label>Country *</Label>
                <Input
                  value={addressFormData.country}
                  onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
                  placeholder="Enter country"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={addressFormData.isDefault}
                onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isDefault">Set as default address</Label>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddressDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                onClick={handleSaveAddress}
                disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                className="w-full sm:w-auto"
              >
                {createAddressMutation.isPending || updateAddressMutation.isPending ? 'Saving...' : 'Save Address'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Dashboard;
