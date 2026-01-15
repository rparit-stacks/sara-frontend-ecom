import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cartApi, orderApi, userApi, shippingApi } from '@/lib/api';
import { guestCart } from '@/lib/guestCart';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    state: '',
  });
  
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [notes, setNotes] = useState('');
  
  // Get user email from token
  const getUserEmail = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.email || null;
    } catch {
      return null;
    }
  };
  
  // Fetch user addresses
  const { data: addresses = [] } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: () => userApi.getAddresses(),
    enabled: !!localStorage.getItem('authToken'),
  });
  
  const isLoggedIn = !!localStorage.getItem('authToken');
  
  // Track applied coupon code separately (before useQuery to avoid circular dependency)
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  
  // Get cart from localStorage for guests (before useQuery/useEffect to avoid initialization issues)
  const guestCartItems = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('guestCart') || '[]') 
    : [];
  const subtotalFromLocalStorage = guestCartItems.reduce((sum: number, item: any) => 
    sum + (item.totalPrice || item.unitPrice * (item.quantity || 1)), 0);
  
  // Fetch user profile for auto-prefill
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getProfile(),
    enabled: isLoggedIn,
    onSuccess: (data) => {
      if (data && !formData.firstName) {
        setFormData(prev => ({
          ...prev,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phoneNumber || '',
        }));
      }
    },
  });
  
  // Fetch cart with current state
  const { data: cartData, isLoading: cartLoading, refetch: refetchCart } = useQuery({
    queryKey: ['cart-checkout', formData.state, appliedCouponCode],
    queryFn: () => cartApi.getCart(formData.state || undefined, appliedCouponCode || undefined),
    enabled: isLoggedIn,
  });
  
  // Update applied coupon code from cart data
  useEffect(() => {
    if (cartData?.appliedCouponCode) {
      setAppliedCouponCode(cartData.appliedCouponCode);
    }
  }, [cartData?.appliedCouponCode]);
  
  // Calculate shipping immediately when state/pincode changes (for both logged in and guest)
  useEffect(() => {
    if (formData.state && (cartData?.subtotal || subtotalFromLocalStorage > 0)) {
      const cartValue = cartData?.subtotal || subtotalFromLocalStorage;
      shippingApi.calculate(cartValue, formData.state)
        .then((result) => {
          // Shipping will be updated via cart refetch or we can set it directly
          if (isLoggedIn) {
            queryClient.invalidateQueries({ queryKey: ['cart-checkout'] });
          }
        })
        .catch(() => {});
    }
  }, [formData.state, formData.postalCode, cartData?.subtotal, subtotalFromLocalStorage, isLoggedIn, queryClient]);
  
  // Load selected address
  useEffect(() => {
    if (selectedAddressId && addresses.length > 0) {
      const address = addresses.find((a: any) => a.id === selectedAddressId);
      if (address) {
        setFormData({
          firstName: address.firstName || '',
          lastName: address.lastName || '',
          email: address.email || '',
          phone: address.phone || '',
          address: address.addressLine1 || '',
          city: address.city || '',
          postalCode: address.postalCode || '',
          state: address.state || '',
        });
        // Trigger shipping recalculation
        queryClient.invalidateQueries({ queryKey: ['cart-checkout'] });
      }
    }
  }, [selectedAddressId, addresses]);
  
  // Create order mutation (supports both logged-in and guest checkout)
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const userEmail = getUserEmail();
      
      const orderData: any = {
        shippingAddressId: isLoggedIn ? selectedAddressId : null,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          state: formData.state,
        },
        paymentMethod,
        notes,
        couponCode: appliedCouponCode || null,
      };
      
      // Add guest checkout fields if not logged in
      if (!isLoggedIn) {
        orderData.guestEmail = formData.email;
        orderData.guestFirstName = formData.firstName;
        orderData.guestLastName = formData.lastName;
        orderData.guestPhone = formData.phone;
        
        // Add guest cart items (convert from guestCartItems format to AddToCartRequest format)
        orderData.guestCartItems = guestCartItems.map((item: any) => ({
          productType: item.productType,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          designId: item.designId,
          fabricId: item.fabricId,
          fabricPrice: item.fabricPrice,
          designPrice: item.designPrice,
          uploadedDesignUrl: item.uploadedDesignUrl,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          variants: item.variants || {},
          customFormData: item.customFormData || {},
        }));
      }
      
      return orderApi.createOrder(orderData);
    },
    onSuccess: (data) => {
      toast.success('Order placed successfully!');
      // Clear guest cart if not logged in
      if (!isLoggedIn) {
        guestCart.clear();
        window.dispatchEvent(new Event('guestCartUpdated'));
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate(`/order-confirmation/${data.id}`, { state: { orderId: data.id } });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to place order');
    },
  });
  
  // Calculate shipping for guest checkout
  const [guestShipping, setGuestShipping] = useState(0);
  useEffect(() => {
    if (!isLoggedIn && formData.state && subtotalFromLocalStorage > 0) {
      shippingApi.calculate(subtotalFromLocalStorage, formData.state)
        .then((result) => {
          setGuestShipping(result.shipping || 0);
        })
        .catch(() => setGuestShipping(0));
    }
  }, [formData.state, subtotalFromLocalStorage, isLoggedIn]);
  
  const items = isLoggedIn ? (cartData?.items || []) : guestCartItems;
  const subtotal = isLoggedIn 
    ? (cartData?.subtotal ? Number(cartData.subtotal) : 0)
    : subtotalFromLocalStorage;
  const gst = isLoggedIn 
    ? (cartData?.gst ? Number(cartData.gst) : 0)
    : 0;
  const shipping = isLoggedIn 
    ? (cartData?.shipping ? Number(cartData.shipping) : 0)
    : guestShipping;
  const couponDiscount = isLoggedIn 
    ? (cartData?.couponDiscount ? Number(cartData.couponDiscount) : 0)
    : 0;
  const total = subtotal + gst + shipping - couponDiscount;
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handlePlaceOrder = () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.phone || !formData.address || !formData.city || 
        !formData.postalCode || !formData.state) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    createOrderMutation.mutate();
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="w-full bg-secondary/30 py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <ScrollReveal>
            <h1 className="font-cursive text-5xl lg:text-6xl">Checkout</h1>
            <p className="text-muted-foreground mt-3 text-lg">Complete your order</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="w-full py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          {cartLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg mb-4">Your cart is empty</p>
              <Button onClick={() => navigate('/cart')}>Go to Cart</Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
              <div className="lg:col-span-2 space-y-8">
                {/* Address Selection */}
                {addresses.length > 0 && (
                  <ScrollReveal>
                    <div className="bg-card p-6 rounded-2xl border border-border">
                      <h3 className="font-cursive text-xl mb-4">Select Address</h3>
                      <Select value={selectedAddressId?.toString() || ''} onValueChange={(val) => setSelectedAddressId(Number(val))}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Choose an address" />
                        </SelectTrigger>
                        <SelectContent>
                          {addresses.map((addr: any) => (
                            <SelectItem key={addr.id} value={addr.id.toString()}>
                              {addr.firstName} {addr.lastName}, {addr.city}, {addr.state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </ScrollReveal>
                )}

                <ScrollReveal>
                  <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border">
                    <h3 className="font-cursive text-xl sm:text-2xl mb-6">Shipping Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <Input 
                        placeholder="First name *" 
                        className="h-12" 
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                      <Input 
                        placeholder="Last name *" 
                        className="h-12" 
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                      <Input 
                        placeholder="Email *" 
                        className="col-span-1 sm:col-span-2 h-12" 
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                      <Input 
                        placeholder="Phone *" 
                        className="col-span-1 sm:col-span-2 h-12" 
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                      <Input 
                        placeholder="Address *" 
                        className="col-span-1 sm:col-span-2 h-12" 
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        required
                      />
                      <Input 
                        placeholder="City *" 
                        className="h-12" 
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                      />
                      <Input 
                        placeholder="Postal code *" 
                        className="h-12" 
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        required
                      />
                      <Select 
                        value={formData.state} 
                        onValueChange={(val) => {
                          handleInputChange('state', val);
                          // Trigger shipping recalculation
                          queryClient.invalidateQueries({ queryKey: ['cart-checkout'] });
                        }}
                      >
                        <SelectTrigger className="col-span-1 sm:col-span-2 h-12">
                          <SelectValue placeholder="State *" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal>
                  <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border">
                    <h3 className="font-cursive text-xl sm:text-2xl mb-6">Payment Method</h3>
                    <div className="space-y-4">
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">Credit/Debit Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="cod">Cash on Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                      {paymentMethod === 'card' && (
                        <div className="space-y-4 pt-4">
                          <Input placeholder="Card number" className="h-12" />
                          <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="MM/YY" className="h-12" />
                            <Input placeholder="CVC" className="h-12" />
                          </div>
                          <Input placeholder="Name on card" className="h-12" />
                        </div>
                      )}
                      <Input 
                        placeholder="Order notes (optional)" 
                        className="h-12" 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border h-fit lg:sticky lg:top-24">
                <h3 className="font-cursive text-xl sm:text-2xl mb-6">Order Summary</h3>
                <div className="space-y-3 text-sm sm:text-base border-b pb-4 mb-4">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="line-clamp-1 flex-1 mr-2">{item.productName}</span>
                      <span className="flex-shrink-0">₹{item.totalPrice?.toLocaleString('en-IN') || 0}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {gst > 0 && (
                    <div className="flex justify-between">
                      <span>GST</span>
                      <span>₹{gst.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `₹${shipping.toLocaleString('en-IN')}`}</span>
                  </div>
                  {isLoggedIn && appliedCouponCode && couponDiscount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Coupon ({appliedCouponCode})</span>
                      <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg sm:text-xl pt-4 border-t">
                    <span>Total</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white mt-6 sm:mt-8 h-12 sm:h-14 text-base"
                  onClick={handlePlaceOrder}
                  disabled={createOrderMutation.isPending || !formData.state}
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
