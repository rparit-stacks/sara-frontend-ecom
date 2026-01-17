import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Package, MapPin, User, Edit, Trash2, Plus, Loader2, Check, Gift, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  const { toast: toastHook } = useToast();
  const queryClient = useQueryClient();
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const [activeTab, setActiveTab] = useState('profile');
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

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
    }
  }, [token, navigate, toastHook]);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getProfile(),
    enabled: !!token,
    onSuccess: (data) => {
      setProfileFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phoneNumber: data.phoneNumber || '',
      });
    },
  });

  // Fetch addresses
  const { data: addresses = [], refetch: refetchAddresses } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: () => userApi.getAddresses(),
    enabled: !!token,
  });

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['user-orders'],
    queryFn: () => orderApi.getUserOrders(),
    enabled: !!token,
  });

  // Fetch dashboard notification for restricted categories
  const { data: dashboardNotification } = useQuery({
    queryKey: ['dashboardNotification'],
    queryFn: () => categoriesApi.getDashboardNotification(),
    enabled: !!token,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

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

  const initials = (profile?.firstName?.[0] || '') + (profile?.lastName?.[0] || profile?.email?.[0] || '');

  return (
    <Layout>
      <section className="section-padding min-h-[calc(100vh-200px)] bg-muted/40">
        <div className="container-custom max-w-6xl mx-auto py-6 md:py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl">My Account</h1>
              <p className="text-sm text-muted-foreground">
                Manage your profile, addresses, and orders.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>

          {/* Dashboard Notification for Restricted Categories */}
          {dashboardNotification?.hasRestrictedCategories && (
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/20 p-3">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Special Products Available!</h3>
                    <p className="text-muted-foreground mb-4">
                      {dashboardNotification.message || 'The store has loaded special products for you.'}
                    </p>
                    {dashboardNotification.categories && dashboardNotification.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {dashboardNotification.categories.map((cat: any) => (
                          <Button
                            key={cat.id}
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/categories/${cat.id}`)}
                            className="gap-2"
                          >
                            {cat.name}
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside className="w-full lg:w-64 space-y-4">
              <Card className="bg-card">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    <span>{initials || 'U'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {profile?.firstName || profile?.lastName
                        ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
                        : 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground break-all">{profile?.email}</p>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main content */}
            <div className="flex-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile" className="gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="gap-2">
                    <Package className="w-4 h-4" />
                    Orders ({orders.length})
                  </TabsTrigger>
                  <TabsTrigger value="addresses" className="gap-2">
                    <MapPin className="w-4 h-4" />
                    Addresses ({addresses.length})
                  </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {profileLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label>Email</Label>
                            <Input value={profile?.email || ''} disabled className="mt-1" />
                            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
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
                            <Label>Phone Number</Label>
                            <Input
                              value={profileFormData.phoneNumber}
                              onChange={(e) => setProfileFormData({ ...profileFormData, phoneNumber: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <Button
                            onClick={() => updateProfileMutation.mutate(profileFormData)}
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {ordersLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No orders yet</p>
                          <Button className="mt-4" onClick={() => navigate('/products')}>
                            Start Shopping
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order: any) => (
                            <Card key={order.id} className="border">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <p className="font-semibold">Order #{order.id}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>
                                      {order.status}
                                    </Badge>
                                    <p className="font-semibold mt-1">₹{order.total?.toLocaleString('en-IN')}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                  >
                                    View Details
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
                <TabsContent value="addresses" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Saved Addresses</CardTitle>
                      <Button onClick={() => { resetAddressForm(); setIsAddressDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Address
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {addresses.length === 0 ? (
                        <div className="text-center py-12">
                          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">No addresses saved</p>
                          <Button onClick={() => { resetAddressForm(); setIsAddressDialogOpen(true); }}>
                            Add Your First Address
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {addresses.map((address: any) => (
                            <Card key={address.id} className="border">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    {address.isDefault && (
                                      <Badge variant="default" className="mb-2">Default</Badge>
                                    )}
                                    <p className="font-semibold">
                                      {address.firstName} {address.lastName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{address.addressLine1}</p>
                                    {address.addressLine2 && (
                                      <p className="text-sm text-muted-foreground">{address.addressLine2}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                      {address.city}, {address.state} {address.postalCode}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">Phone: {address.phone}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    {!address.isDefault && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDefaultAddressMutation.mutate(address.id)}
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddressDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveAddress}
                disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
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
