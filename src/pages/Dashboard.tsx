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
import { Package, MapPin, User, Edit, Trash2, Plus, Loader2, Check, Gift, ArrowRight, Download, Menu, X, LogOut, Pencil } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MandatoryProfileDialog } from '@/components/MandatoryProfileDialog';

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
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
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
    queryFn: () => categoriesApi.getDashboardNotification(),
    enabled: !!token && !showMandatoryDialog && !isCheckingMandatory,
    retry: 1,
  });

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
      phone: profile?.phoneNumber || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setAddressFormData({
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      email: address.email || profile?.email || '',
      phone: address.phone || profile?.phoneNumber || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      isDefault: address.isDefault || false,
    });
    setIsAddressDialogOpen(true);
  };

  const handleSaveAddress = () => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressFormData });
    } else {
      createAddressMutation.mutate(addressFormData);
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

          {/* Dashboard Notification for Restricted Categories */}
          {dashboardNotification?.hasRestrictedCategories && (
            <Card className="mb-4 md:mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="rounded-full bg-primary/20 p-2 md:p-3 flex-shrink-0">
                    <Gift className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base md:text-lg mb-2">Special Products Available!</h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                      {dashboardNotification.message || 'The store has loaded special products for you.'}
                    </p>
                    {dashboardNotification.categories && dashboardNotification.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {dashboardNotification.categories.map((cat: any) => (
                          <Button
                            key={cat.id}
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/category/${cat.id}`)}
                            className="gap-2 text-xs md:text-sm"
                          >
                            {cat.name}
                            <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
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
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Desktop Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full hidden lg:block">
                <TabsList className="grid w-full grid-cols-4 mb-6">
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
              <Label>Phone *</Label>
              <Input
                value={addressFormData.phone}
                onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
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
            <div>
              <Label>Postal Code *</Label>
              <Input
                value={addressFormData.postalCode}
                onChange={(e) => setAddressFormData({ ...addressFormData, postalCode: e.target.value })}
              />
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
