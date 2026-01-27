import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Loader2, Truck, CreditCard, ShoppingBag, Lock, ChevronDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cartApi, orderApi, userApi, shippingApi, paymentApi, paymentConfigApi } from '@/lib/api';
import { guestCart } from '@/lib/guestCart';
import { usePrice } from '@/lib/currency';

// Countries list
const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'NP', name: 'Nepal' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
];

// Indian states
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Major cities by country (simplified - can be expanded or fetched from API)
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'IN': [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
    'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut'
  ],
  'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
  'GB': ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool', 'Leeds', 'Edinburgh', 'Bristol', 'Cardiff', 'Belfast'],
  'CA': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener'],
  'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong'],
  'DE': ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'],
  'FR': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
  'IT': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania'],
  'ES': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'],
  'NL': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen'],
  'BE': ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst'],
  'CH': ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'St. Gallen', 'Lucerne', 'Lugano', 'Biel', 'Thun'],
  'AT': ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn'],
  'SE': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping'],
  'NO': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Bærum', 'Kristiansand', 'Fredrikstad', 'Sandnes', 'Tromsø', 'Sarpsborg'],
  'DK': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde'],
  'FI': ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Pori'],
  'PL': ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice'],
  'PT': ['Lisbon', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga', 'Funchal', 'Coimbra', 'Setúbal', 'Almada', 'Agualva-Cacém'],
  'IE': ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Kilkenny', 'Wexford', 'Sligo', 'Clonmel'],
  'NZ': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Napier', 'Dunedin', 'Palmerston North', 'Hastings', 'Nelson'],
  'SG': ['Singapore'],
  'MY': ['Kuala Lumpur', 'George Town', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Johor Bahru', 'Melaka', 'Kota Kinabalu', 'Kuching', 'Kota Bharu'],
  'TH': ['Bangkok', 'Nonthaburi', 'Nakhon Ratchasima', 'Chiang Mai', 'Hat Yai', 'Udon Thani', 'Pak Kret', 'Khon Kaen', 'Chaophraya Surasak', 'Nakhon Si Thammarat'],
  'AE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Kalba'],
  'SA': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Taif', 'Abha', 'Tabuk', 'Buraydah'],
  'JP': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama'],
  'KR': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Goyang'],
  'CN': ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Xi\'an', 'Nanjing', 'Tianjin'],
  'BR': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'],
  'MX': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Torreón', 'Querétaro', 'San Luis Potosí'],
  'AR': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan'],
  'ZA': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Nelspruit', 'Kimberley', 'Polokwane'],
  'EG': ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Aswan', 'Asyut', 'Ismailia'],
  'NG': ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt', 'Benin City', 'Kaduna', 'Maiduguri', 'Zaria', 'Aba'],
  'KE': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega'],
  'PK': ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Peshawar', 'Hyderabad', 'Islamabad', 'Quetta'],
  'BD': ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Comilla', 'Rangpur', 'Mymensingh', 'Barisal', 'Jessore'],
  'LK': ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Trincomalee', 'Batticaloa', 'Anuradhapura', 'Ratnapura', 'Matara'],
  'NP': ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bharatpur', 'Biratnagar', 'Birgunj', 'Dharan', 'Butwal', 'Hetauda', 'Janakpur'],
  'MM': ['Yangon', 'Mandalay', 'Naypyidaw', 'Mawlamyine', 'Taunggyi', 'Monywa', 'Meiktila', 'Bago', 'Pathein', 'Sittwe'],
  'VN': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Haiphong', 'Can Tho', 'Bien Hoa', 'Hue', 'Nha Trang', 'Vung Tau', 'Quy Nhon'],
  'PH': ['Manila', 'Quezon City', 'Caloocan', 'Davao City', 'Cebu City', 'Zamboanga City', 'Antipolo', 'Pasig', 'Cagayan de Oro', 'Valenzuela'],
  'ID': ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Palembang', 'Makassar', 'Batam', 'Pekanbaru', 'Denpasar'],
};

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { format, convert, currency } = usePrice();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    addressLine2: '', // Address Line 2 for Swipe API
    country: 'IN', // Default to India
    city: '',
    postalCode: '',
    state: '',
    gstin: '',
  });
  
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentGateway, setPaymentGateway] = useState<string>('COD');
  const [availableGateways, setAvailableGateways] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [hasGstin, setHasGstin] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [saveAddressAsDefault, setSaveAddressAsDefault] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const shippingFormRef = useRef<HTMLDivElement>(null);
  
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
  
  // Find default address
  const defaultAddress = addresses.find((addr: any) => addr.isDefault === true);
  
  // Track applied coupon code separately (before useQuery to avoid circular dependency)
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  
  // Guest cart: single source via guestCart.getItems(), kept in sync with guestCartUpdated
  const [guestCartItems, setGuestCartItems] = useState<any[]>(() =>
    typeof window !== 'undefined' ? guestCart.getItems() : []);
  useEffect(() => {
    setGuestCartItems(guestCart.getItems());
    const handler = () => setGuestCartItems(guestCart.getItems());
    window.addEventListener('guestCartUpdated', handler);
    return () => window.removeEventListener('guestCartUpdated', handler);
  }, []);
  const subtotalFromLocalStorage = guestCartItems.reduce((sum: number, item: any) =>
    sum + (item.totalPrice || (item.unitPrice || 0) * (item.quantity || 1)), 0);
  
  // Fetch user profile for auto-prefill (only for logged-in users)
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getProfile(),
    enabled: isLoggedIn,
  });
  
  // Auto-fill email from profile when userProfile is loaded
  useEffect(() => {
    if (userProfile && isLoggedIn) {
      setFormData(prev => ({
        ...prev,
        email: (userProfile as any).email || prev.email, // Always use profile email for logged-in users
        // Only auto-fill name/phone if no address is selected
        ...(prev.firstName ? {} : {
          firstName: (userProfile as any).firstName || '',
          lastName: (userProfile as any).lastName || '',
          phone: (userProfile as any).phoneNumber || '',
        }),
      }));
    }
  }, [userProfile, isLoggedIn]);
  
  // Don't auto-select default address - let user explicitly choose
  // This ensures the selected address is what user wants, not auto-selected
  
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
  
  // Load selected address - this is the single source of truth for logged-in users
  useEffect(() => {
    if (isLoggedIn && selectedAddressId && addresses.length > 0) {
      const address = addresses.find((a: any) => a.id === selectedAddressId);
      if (address) {
        // Use selected address data - this ensures order uses the exact address user selected
        setFormData(prev => ({
          ...prev,
          firstName: address.firstName || prev.firstName,
          lastName: address.lastName || prev.lastName,
          email: address.email || prev.email || (userProfile as any)?.email || prev.email, // Use address email, fallback to profile
          phone: address.phoneNumber || address.phone || prev.phone, // Use address phone (important for WhatsApp)
          address: address.address || address.addressLine1 || prev.address,
          addressLine2: address.addressLine2 || prev.addressLine2 || '',
          country: address.country || prev.country || 'IN',
          city: address.city || prev.city,
          postalCode: address.zipCode || address.postalCode || prev.postalCode,
          state: address.state || prev.state,
          gstin: address.gstin || prev.gstin || '',
        }));
        setHasGstin(!!address.gstin);
        // Trigger shipping recalculation
        queryClient.invalidateQueries({ queryKey: ['cart-checkout'] });
      }
    }
  }, [selectedAddressId, addresses, isLoggedIn, userProfile]);
  
  // Create order mutation (supports both logged-in and guest checkout)
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const userEmail = getUserEmail();
      
      // Build shipping address using helper function - ensures single source of truth
      const orderData: any = {
        shippingAddressId: isLoggedIn ? selectedAddressId : null,
        shippingAddress: buildShippingAddress(),
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
      
      try {
        return await orderApi.createOrder(orderData);
      } catch (error: any) {
        // Better error handling for guest checkout
        if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
          // If unauthorized and doing guest checkout, retry without token
          if (!isLoggedIn && orderData.guestEmail) {
            // Remove any token from localStorage temporarily for this request
            const tempToken = localStorage.getItem('authToken');
            if (tempToken) {
              localStorage.removeItem('authToken');
              try {
                const result = await orderApi.createOrder(orderData);
                // Restore token
                if (tempToken) localStorage.setItem('authToken', tempToken);
                return result;
              } catch (retryError) {
                // Restore token even on retry failure
                if (tempToken) localStorage.setItem('authToken', tempToken);
                throw retryError;
              }
            }
          }
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Order placed successfully!');
      // Clear guest cart if not logged in
      if (!isLoggedIn) {
        guestCart.clear();
        window.dispatchEvent(new Event('guestCartUpdated'));
      }
      // Refresh addresses in case a new one was saved
      if (isLoggedIn) {
        queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate(`/order-confirmation/${data.id}`, { state: { orderId: data.id } });
    },
    onError: (error: Error) => {
      console.error('[Order Creation Error]', error);
      // Better error messages
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        if (!isLoggedIn) {
          toast.error('Please ensure all required fields are filled correctly');
        } else {
          toast.error('Session expired. Please refresh the page and try again.');
        }
      } else {
        toast.error(error.message || 'Failed to create order. Please try again.');
      }
    },
  });
  
  // Get country name from code
  const getCountryName = () => {
    const country = COUNTRIES.find(c => c.code === formData.country);
    return country?.name || 'India';
  };
  
  // Get available cities for selected country
  const availableCities = CITIES_BY_COUNTRY[formData.country] || [];
  
  // Check if selected country is India
  const isIndia = formData.country === 'IN';
  // Check if currently selected currency is INR
  const isINRCurrency = currency === 'INR';

  // Fetch payment methods from API to check which are enabled
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['payment-methods', getCountryName()],
    queryFn: () => paymentApi.getMethods(getCountryName()),
    enabled: !!formData.country,
  });
  
  // Fetch PaymentConfig to check COD/Partial COD settings
  const { data: paymentConfig } = useQuery({
    queryKey: ['payment-config'],
    queryFn: () => paymentConfigApi.getConfig(),
  });
  
  // Calculate cart items and totals (must be before useMemo that uses items)
  const items = isLoggedIn ? (cartData?.items || []) : guestCartItems;
  
  // Check if cart contains Digital products (COD not allowed)
  const hasDigitalProducts = useMemo(() => {
    return items.some((item: any) => item.productType === 'DIGITAL');
  }, [items]);
  
  // Determine available payment gateways based on country and BusinessConfig
  // Rules:
  // - For India: Razorpay (if enabled) + Stripe (if enabled) + COD/Partial COD (if enabled in config)
  // - Outside India: Stripe (if enabled) + COD/Partial COD (if enabled in config)
  // - Digital products: Never allow COD/Partial COD, only online payment
  useEffect(() => {
    const apiGateways = paymentMethodsData?.gateways || [];
    const codEnabled = paymentConfig?.codEnabled ?? false;
    const partialCodEnabled = paymentConfig?.partialCodEnabled ?? false;
    const razorpayEnabled = paymentConfig?.razorpayEnabled ?? false;
    const stripeEnabled = paymentConfig?.stripeEnabled ?? false;
    
    const gateways: string[] = [];
    
    // If cart contains Digital products, COD is NOT available
    if (hasDigitalProducts) {
      // Digital products: Only online payment gateways
      if (isIndia) {
        // India: Razorpay (if enabled) + Stripe (if enabled)
        if (apiGateways.includes('RAZORPAY') && razorpayEnabled) {
          gateways.push('RAZORPAY');
        }
        if (apiGateways.includes('STRIPE') && stripeEnabled) {
          gateways.push('STRIPE');
        }
      } else {
        // Outside India: Only Stripe (if enabled)
        if (apiGateways.includes('STRIPE') && stripeEnabled) {
          gateways.push('STRIPE');
        }
      }
    } else {
      // Physical products: All available gateways based on country
      if (isIndia) {
        // India: Razorpay (if enabled) + Stripe (if enabled) + COD (if enabled) + Partial COD (if enabled)
        if (apiGateways.includes('RAZORPAY') && razorpayEnabled) {
          gateways.push('RAZORPAY');
        }
        if (apiGateways.includes('STRIPE') && stripeEnabled) {
          gateways.push('STRIPE');
        }
        if (codEnabled) {
          gateways.push('COD');
        }
        if (partialCodEnabled) {
          // Partial COD requires at least one gateway
          if (razorpayEnabled || stripeEnabled) {
            gateways.push('PARTIAL_COD');
          }
        }
      } else {
        // Outside India: Stripe only (if enabled) + Partial COD (if enabled and Stripe ON), COD not available
        if (apiGateways.includes('STRIPE') && stripeEnabled) {
          gateways.push('STRIPE');
        }
        // COD not available outside India
        // Partial COD only if Stripe is enabled
        if (partialCodEnabled && stripeEnabled) {
          gateways.push('PARTIAL_COD');
        }
      }
    }
    
    setAvailableGateways(gateways);
    
    // Set default gateway
    if (gateways.length > 0) {
      let defaultGateway = gateways[0];
      
      // Prefer COD for physical products if available
      if (!hasDigitalProducts && gateways.includes('COD')) {
        defaultGateway = 'COD';
      } else if (gateways.includes('STRIPE')) {
        defaultGateway = 'STRIPE';
      } else if (gateways.includes('RAZORPAY')) {
        defaultGateway = 'RAZORPAY';
      }
      
      // Only update if current gateway is not available
      if (!paymentGateway || !gateways.includes(paymentGateway)) {
        setPaymentGateway(defaultGateway);
        if (defaultGateway === 'COD') {
          setPaymentMethod('cod');
        } else if (defaultGateway === 'PARTIAL_COD') {
          setPaymentMethod('partial_cod');
        } else if (defaultGateway === 'STRIPE') {
          setPaymentMethod('card');
        } else if (defaultGateway === 'RAZORPAY') {
          setPaymentMethod('razorpay');
        }
      }
    }
  }, [formData.country, isIndia, paymentMethodsData, hasDigitalProducts, paymentConfig, paymentGateway]);
  
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
  
  // Helper function to build shipping address object - ensures single source of truth
  const buildShippingAddress = () => {
    // For logged-in users with selected address, use address data
    if (isLoggedIn && selectedAddressId && addresses.length > 0) {
      const selectedAddress = addresses.find((a: any) => a.id === selectedAddressId);
      if (selectedAddress) {
        return {
          firstName: selectedAddress.firstName || formData.firstName,
          lastName: selectedAddress.lastName || formData.lastName,
          email: selectedAddress.email || formData.email || (userProfile as any)?.email,
          phone: selectedAddress.phoneNumber || selectedAddress.phone || formData.phone,
          address: selectedAddress.address || selectedAddress.addressLine1 || formData.address,
          addressLine2: selectedAddress.addressLine2 || formData.addressLine2 || '',
          country: selectedAddress.country || getCountryName(),
          city: selectedAddress.city || formData.city,
          postalCode: selectedAddress.zipCode || selectedAddress.postalCode || formData.postalCode,
          state: selectedAddress.state || formData.state,
          gstin: selectedAddress.gstin || (hasGstin && formData.gstin ? formData.gstin : undefined),
        };
      }
    }
    
    // For guest users or when no address selected, use form data
    return {
      firstName: formData.firstName,
      lastName: formData.lastName,
          email: formData.email || (userProfile as any)?.email,
      phone: formData.phone,
      address: formData.address,
      addressLine2: formData.addressLine2 || '',
      country: getCountryName(),
      city: formData.city,
      postalCode: formData.postalCode,
      state: formData.state,
      gstin: hasGstin && formData.gstin ? formData.gstin : undefined,
    };
  };
  
  const handlePlaceOrder = async () => {
    // Smart validation - check actual data that will be used
    const errors: string[] = [];
    
    // For logged-in users with selected address, validate from selected address
    let dataToValidate: any = formData;
    if (isLoggedIn && selectedAddressId && addresses.length > 0) {
      const selectedAddress = addresses.find((a: any) => a.id === selectedAddressId);
      if (selectedAddress) {
        // Validate selected address data
        dataToValidate = {
          firstName: selectedAddress.firstName || formData.firstName,
          lastName: selectedAddress.lastName || formData.lastName,
          email: selectedAddress.email || formData.email || (userProfile as any)?.email,
          phone: selectedAddress.phoneNumber || selectedAddress.phone || formData.phone,
          address: selectedAddress.address || selectedAddress.addressLine1 || formData.address,
          addressLine2: selectedAddress.addressLine2 || formData.addressLine2 || '',
          city: selectedAddress.city || formData.city,
          state: selectedAddress.state || formData.state,
          postalCode: selectedAddress.zipCode || selectedAddress.postalCode || formData.postalCode,
          country: selectedAddress.country || formData.country || 'IN',
        };
      }
    }
    
    // Basic fields validation
    if (!dataToValidate.firstName?.trim()) errors.push('First name is required');
    if (!dataToValidate.lastName?.trim()) errors.push('Last name is required');
    
    // Email validation - only required for guest users
    if (!isLoggedIn && !dataToValidate.email?.trim()) {
      errors.push('Email is required');
    } else if (isLoggedIn && !dataToValidate.email?.trim() && !(userProfile as any)?.email) {
      errors.push('Email is required');
    }
    
    // Phone number validation (mandatory for all)
    if (!dataToValidate.phone?.trim()) {
      errors.push('Phone number is required');
    } else {
      const phoneDigits = dataToValidate.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        errors.push('Phone number must be at least 10 digits');
      }
    }
    
    // Address fields (all mandatory)
    if (!dataToValidate.address?.trim()) errors.push('Address Line 1 is required');
    if (!dataToValidate.city?.trim()) errors.push('City is required');
    if (!dataToValidate.state?.trim()) errors.push('State is required');
    if (!dataToValidate.postalCode?.trim()) errors.push('Postal code is required');
    if (!dataToValidate.country?.trim()) errors.push('Country is required');
    
    // For logged-in users, validate address selection only if addresses exist
    if (isLoggedIn && addresses.length > 0 && !selectedAddressId) {
      errors.push('Please select an address or fill in the form below');
    }
    
    if (errors.length > 0) {
      // Show all errors for better debugging
      const errorMessage = errors.length === 1 
        ? errors[0] 
        : `${errors[0]} (${errors.length - 1} more: ${errors.slice(1).join(', ')})`;
      toast.error(errorMessage);
      console.log('Validation errors:', errors);
      console.log('Form data:', formData);
      console.log('Selected address ID:', selectedAddressId);
      console.log('Data being validated:', dataToValidate);
      return;
    }
    
    // Validate payment method for digital products
    if (hasDigitalProducts && (paymentGateway === 'COD' || paymentGateway === 'PARTIAL_COD')) {
      toast.error('Digital products require online payment only. COD is not available.');
      return;
    }
    
    // Validate payment gateway availability
    if (availableGateways.length === 0) {
      toast.error(hasDigitalProducts
        ? 'Payment method not available. Please try again later.'
        : 'We are not able to process your order right now. Please try again after some time.');
      return;
    }
    
    // For COD, create order directly
    if (paymentGateway === 'COD') {
      createOrderMutation.mutate();
      return;
    }
    
    // For PARTIAL_COD, create order first, then process advance payment online
    if (paymentGateway === 'PARTIAL_COD') {
      setIsProcessingPayment(true);
      try {
        const orderData: any = {
          shippingAddressId: isLoggedIn ? selectedAddressId : null,
          shippingAddress: buildShippingAddress(),
          paymentMethod: 'PARTIAL_COD',
          notes,
          couponCode: appliedCouponCode || null,
        };

        if (!isLoggedIn) {
          orderData.guestEmail = formData.email;
          orderData.guestFirstName = formData.firstName;
          orderData.guestLastName = formData.lastName;
          orderData.guestPhone = formData.phone;
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

        const order = await orderApi.createOrder(orderData);
        
        // Backend sets order.paymentAmount = advance amount (GST-inclusive). Use it for gateway.
        const amountToCharge = Number(order.paymentAmount ?? order.total ?? total);
        
        // Process advance payment online
        const paymentRequest = {
          amount: convert(amountToCharge),
          currency: currency,
          orderId: order.id,
          orderNumber: order.orderNumber,
          country: getCountryName(),
          paymentGateway: isIndia && paymentMethodsData?.gateways?.includes('RAZORPAY') ? 'RAZORPAY' : 'STRIPE',
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerPhone: formData.phone,
          returnUrl: `${window.location.origin}/order-confirmation/${order.id}`,
          cancelUrl: `${window.location.origin}/checkout`,
        };

        const paymentResponse = await paymentApi.createOrder(paymentRequest);
        const selectedGateway = paymentRequest.paymentGateway;

        if (selectedGateway === 'STRIPE') {
          await handleStripePayment(paymentResponse, order.id);
        } else if (selectedGateway === 'RAZORPAY') {
          await handleRazorpayPayment(paymentResponse, order.id, order.orderNumber);
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to process advance payment');
        setIsProcessingPayment(false);
      }
      return;
    }

    // For Stripe/Razorpay, create order first, then process payment
    setIsProcessingPayment(true);
    try {
      // First create the order - use helper function for shipping address
      const orderData: any = {
        shippingAddressId: isLoggedIn ? selectedAddressId : null,
        shippingAddress: buildShippingAddress(),
        paymentMethod: paymentGateway.toLowerCase(),
        notes,
        couponCode: appliedCouponCode || null,
      };

      if (!isLoggedIn) {
        orderData.guestEmail = formData.email;
        orderData.guestFirstName = formData.firstName;
        orderData.guestLastName = formData.lastName;
        orderData.guestPhone = formData.phone;
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

      const order = await orderApi.createOrder(orderData);

      // Use order's payment amount so GST is always included (backend has correct total for guest & logged-in)
      const amountToCharge = Number(order.paymentAmount ?? order.total ?? total);

      // Create payment order
      const paymentRequest = {
        amount: convert(amountToCharge),
        currency: currency,
        orderId: order.id,
        orderNumber: order.orderNumber,
        country: getCountryName(),
        paymentGateway: paymentGateway,
        customerEmail: formData.email,
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerPhone: formData.phone,
        returnUrl: `${window.location.origin}/order-confirmation/${order.id}`,
        cancelUrl: `${window.location.origin}/checkout`,
      };

      const paymentResponse = await paymentApi.createOrder(paymentRequest);

      // Handle payment based on gateway
      if (paymentGateway === 'STRIPE') {
        await handleStripePayment(paymentResponse, order.id);
      } else if (paymentGateway === 'RAZORPAY') {
        await handleRazorpayPayment(paymentResponse, order.id, order.orderNumber);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process payment');
      setIsProcessingPayment(false);
    }
  };

  const handleStripePayment = async (paymentResponse: any, orderId: number) => {
    // Load Stripe.js dynamically
    return new Promise((resolve, reject) => {
      // Check if Stripe is already loaded
      // @ts-ignore
      if (window.Stripe) {
        processStripePayment(paymentResponse, orderId).then(resolve).catch(reject);
        return;
      }

      const stripeScript = document.createElement('script');
      stripeScript.src = 'https://js.stripe.com/v3/';
      stripeScript.async = true;
      stripeScript.onload = () => {
        processStripePayment(paymentResponse, orderId).then(resolve).catch(reject);
      };
      stripeScript.onerror = () => {
        reject(new Error('Failed to load Stripe.js'));
      };
      document.body.appendChild(stripeScript);
    });
  };

  const processStripePayment = async (paymentResponse: any, orderId: number) => {
    try {
      // @ts-ignore
      const stripe = window.Stripe(paymentResponse.orderData.key_id || '');
      const clientSecret = paymentResponse.orderData.client_secret;

      // Use Stripe's confirmCardPayment with a simple form
      // For now, redirect to a payment page or show payment form
      // In production, you'd use Stripe Elements for card collection
      
      // For simplicity, we'll show a message and let user complete payment
      // The webhook will update order status when payment succeeds
      toast.info('Order placed! Please complete payment using the link sent to your email, or payment will be processed automatically.');
      
      setIsProcessingPayment(false);
      if (!isLoggedIn) {
        guestCart.clear();
        window.dispatchEvent(new Event('guestCartUpdated'));
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const paymentIntentId = paymentResponse.orderData.payment_intent_id ?? paymentResponse.paymentId;
      navigate(`/order-confirmation/${orderId}`, { 
        state: { 
          orderId, 
          paymentIntent: clientSecret,
          paymentIntentId,
          stripeKey: paymentResponse.orderData.key_id 
        } 
      });
    } catch (error: any) {
      toast.error(error.message || 'Payment initialization failed');
      setIsProcessingPayment(false);
    }
  };

  const handleRazorpayPayment = async (paymentResponse: any, orderId: number, orderNumber?: string) => {
    return new Promise((resolve, reject) => {
      // Check if Razorpay is already loaded
      // @ts-ignore
      if (window.Razorpay) {
        processRazorpayPayment(paymentResponse, orderId, orderNumber ?? '').then(resolve).catch(reject);
        return;
      }

      const razorpayScript = document.createElement('script');
      razorpayScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
      razorpayScript.async = true;
      razorpayScript.onload = () => {
        processRazorpayPayment(paymentResponse, orderId, orderNumber ?? '').then(resolve).catch(reject);
      };
      razorpayScript.onerror = () => {
        reject(new Error('Failed to load Razorpay script'));
      };
      document.body.appendChild(razorpayScript);
    });
  };

  const processRazorpayPayment = async (paymentResponse: any, orderId: number, orderNumber: string) => {
    try {
      // @ts-ignore
      const options = {
        key: paymentResponse.orderData.key_id,
        amount: paymentResponse.orderData.amount,
        currency: paymentResponse.orderData.currency,
        name: 'Studio Sara',
        description: `Order #${paymentResponse.orderData.order_id}`,
        order_id: paymentResponse.orderData.order_id,
        handler: async function (response: any) {
          try {
            // Verify payment
            await paymentApi.verify({
              paymentId: response.razorpay_payment_id,
              orderId: orderId.toString(),
              gateway: 'RAZORPAY',
              verificationData: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              },
            });

            toast.success('Payment successful!');
            if (!isLoggedIn) {
              guestCart.clear();
              window.dispatchEvent(new Event('guestCartUpdated'));
            }
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            navigate(`/order-confirmation/${orderId}`);
            setIsProcessingPayment(false);
          } catch (error: any) {
            toast.error(error.message || 'Payment verification failed');
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#2b9d8f',
        },
        modal: {
          ondismiss: function() {
            setIsProcessingPayment(false);
            toast.info('Payment cancelled');
            paymentApi.recordPaymentFailed(String(orderNumber), 'RAZORPAY').catch(() => {});
          }
        }
      };

      // @ts-ignore
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        toast.error('Payment failed: ' + (response.error?.description || 'Unknown error'));
        setIsProcessingPayment(false);
        paymentApi.recordPaymentFailed(String(orderNumber), 'RAZORPAY').catch(() => {});
      });
      razorpay.open();
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize Razorpay');
      setIsProcessingPayment(false);
      throw error;
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="w-full bg-secondary/30 py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <ScrollReveal>
            <h1 className="font-serif text-4xl lg:text-5xl font-semibold">Checkout</h1>
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
            <div className="relative">
              {(createOrderMutation.isPending || isProcessingPayment) && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl min-h-[400px]">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm font-medium">{isProcessingPayment ? 'Opening payment…' : 'Placing order…'}</p>
                  </div>
                </div>
              )}
            <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
              <div className="lg:col-span-2 space-y-8">
                {/* Login Prompt for Guests */}
                {!isLoggedIn && (
                  <ScrollReveal>
                    <div className="bg-card p-6 rounded-2xl border border-border">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <h3 className="font-serif text-lg mb-2 font-semibold">Have an account?</h3>
                          <p className="text-sm text-muted-foreground">Login to use your saved addresses</p>
                        </div>
                        <Button 
                          onClick={() => navigate('/login', { state: { returnTo: '/checkout' } })}
                          variant="outline"
                          className="h-11"
                        >
                          Login Now
                        </Button>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Or continue as guest - we'll create an account for you and save this address automatically
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                )}

                {/* Address Selection - Mandatory for logged-in users */}
                {isLoggedIn && (
                  <ScrollReveal>
                    <div className="bg-card p-6 rounded-2xl border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-serif text-lg font-semibold">
                          Select Address *
                          {addresses.length === 0 && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              (No saved addresses - add one below)
                            </span>
                          )}
                        </h3>
                        {selectedAddressId && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAddressId(null);
                              // Reset form to allow manual entry
                              setFormData(prev => ({
                                ...prev,
                                firstName: (userProfile as any)?.firstName || prev.firstName,
                                lastName: (userProfile as any)?.lastName || prev.lastName,
                                email: (userProfile as any)?.email || prev.email,
                                phone: (userProfile as any)?.phoneNumber || prev.phone,
                              }));
                            }}
                            className="h-8 text-xs"
                          >
                            Clear Selection
                          </Button>
                        )}
                      </div>
                      {addresses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" role="group" aria-label="Address selection">
                          {addresses.map((addr: any) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={`p-3 rounded-lg border text-left text-sm transition-colors ${
                                selectedAddressId === addr.id
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border hover:bg-muted/50'
                              }`}
                            >
                              <span className="font-medium">{addr.firstName} {addr.lastName}</span>
                              <span className="block text-muted-foreground truncate mt-0.5">{addr.addressLine1 || addr.address}, {addr.city}, {addr.state}</span>
                              {addr.isDefault && <span className="inline-block mt-1 text-xs text-primary">Default</span>}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAddressId(null);
                              setFormData(prev => ({
                                ...prev,
                                firstName: (userProfile as any)?.firstName || prev.firstName,
                                lastName: (userProfile as any)?.lastName || prev.lastName,
                                email: (userProfile as any)?.email || prev.email,
                                phone: (userProfile as any)?.phoneNumber || prev.phone,
                              }));
                              shippingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="p-3 rounded-lg border border-dashed border-border hover:bg-muted/50 text-muted-foreground text-sm flex items-center justify-center gap-1.5 min-h-[72px]"
                          >
                            <Plus className="w-4 h-4" />
                            Add new address
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                          No saved addresses. Fill in the form below and click "Save Address" to add one.
                        </div>
                      )}
                    </div>
                  </ScrollReveal>
                )}

                <ScrollReveal>
                  <div ref={shippingFormRef} className="bg-card p-6 sm:p-8 rounded-2xl border border-border">
                    <h3 className="font-serif text-lg sm:text-xl mb-6 font-semibold flex items-center gap-2">
                      <Truck className="w-5 h-5 text-muted-foreground" />
                      {isLoggedIn ? 'Shipping Details' : 'Shipping Details (Guest Checkout)'}
                    </h3>
                    {isLoggedIn && selectedAddressId && (
                      <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
                        ✓ Using selected address - fields below are auto-filled from your saved address
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <Input 
                        placeholder="First name *" 
                        className="h-12" 
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        disabled={isLoggedIn && selectedAddressId !== null}
                        required
                      />
                      <Input 
                        placeholder="Last name *" 
                        className="h-12" 
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        disabled={isLoggedIn && selectedAddressId !== null}
                        required
                      />
                      {/* Email field - only show for guest users */}
                      {!isLoggedIn && (
                      <Input 
                        placeholder="Email *" 
                        className="col-span-1 sm:col-span-2 h-12" 
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                      )}
                      {/* For logged-in users, email is auto-filled from profile and shown as read-only */}
                      {isLoggedIn && (
                        <div className="col-span-1 sm:col-span-2">
                          <label className="text-sm font-medium mb-1.5 block">Email</label>
                            <div className="h-12 px-3 flex items-center bg-muted rounded-md text-sm">
                            {formData.email || (userProfile as any)?.email || 'Loading...'}
                          </div>
                        </div>
                      )}
                      <Input 
                        placeholder="Phone *" 
                        className="col-span-1 sm:col-span-2 h-12" 
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={isLoggedIn && selectedAddressId !== null}
                        required
                      />
                      <Input 
                        placeholder="Address Line 1 *" 
                        className="col-span-1 sm:col-span-2 h-12" 
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={isLoggedIn && selectedAddressId !== null}
                        required
                      />
                      <Input 
                        placeholder="Address Line 2 (Apartment, Suite, etc.)" 
                        className="col-span-1 sm:col-span-2 h-12" 
                        value={formData.addressLine2}
                        onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                        disabled={isLoggedIn && selectedAddressId !== null}
                      />
                      <Select 
                        value={formData.country} 
                        onValueChange={(val) => {
                          handleInputChange('country', val);
                          // Reset city when country changes
                          handleInputChange('city', '');
                          // Reset state for non-India countries
                          if (val !== 'IN') {
                            handleInputChange('state', '');
                          }
                        }}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Country *" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isIndia ? (
                        <Select 
                          value={formData.state} 
                          onValueChange={(val) => {
                            handleInputChange('state', val);
                            queryClient.invalidateQueries({ queryKey: ['cart-checkout'] });
                          }}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="State *" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDIAN_STATES.map((state) => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input 
                          placeholder="State/Province *" 
                          className="h-12" 
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          required
                        />
                      )}
                      <Select 
                        value={formData.city} 
                        onValueChange={(val) => handleInputChange('city', val)}
                        disabled={!formData.country || availableCities.length === 0}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={availableCities.length > 0 ? "City *" : "Select country first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableCities.length === 0 && formData.country && (
                        <Input 
                          placeholder="City *" 
                          className="h-12" 
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          required
                        />
                      )}
                      <Input 
                        placeholder="Postal code *" 
                        className="h-12" 
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        required
                      />
                    </div>
                    
                    {/* GSTIN Field (Optional for B2B) */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center space-x-2 mb-3">
                        <input
                          type="checkbox"
                          id="hasGstin"
                          checked={hasGstin}
                          onChange={(e) => {
                            setHasGstin(e.target.checked);
                            if (!e.target.checked) {
                              setFormData(prev => ({ ...prev, gstin: '' }));
                            }
                          }}
                          className="w-4 h-4 rounded border-border"
                        />
                        <label htmlFor="hasGstin" className="text-sm font-medium cursor-pointer">
                          I have a GSTIN (Business Customer)
                        </label>
                      </div>
                      {hasGstin && (
                        <Input
                          placeholder="Enter 15-digit GSTIN (e.g., 27ABCDE1234F1Z5)"
                          value={formData.gstin}
                          onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                          maxLength={15}
                          className="h-11"
                        />
                      )}
                    </div>
                    
                    {/* Save Address Button - Only for logged-in users */}
                    {isLoggedIn && (
                      <div className="sm:col-span-2 mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="saveAddressAsDefault"
                              checked={saveAddressAsDefault}
                              onChange={(e) => setSaveAddressAsDefault(e.target.checked)}
                              className="w-4 h-4 rounded border-border"
                            />
                            <label htmlFor="saveAddressAsDefault" className="text-sm font-medium cursor-pointer">
                              Set as default address
                            </label>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                              // Validate required fields before saving
                              if (!formData.firstName || !formData.lastName || !formData.phone || 
                                  !formData.address || !formData.city || !formData.postalCode || 
                                  !formData.state || !formData.country) {
                                toast.error('Please fill in all required address fields before saving');
                                return;
                              }
                              
                              setIsSavingAddress(true);
                              try {
                                // Map to backend expected field names
                                // Combine addressLine1 and addressLine2 into single address field
                                const fullAddress = formData.address + 
                                  (formData.addressLine2 ? `, ${formData.addressLine2}` : '');
                                
                                const addressData = {
                                  firstName: formData.firstName,
                                  lastName: formData.lastName,
                                  phoneNumber: formData.phone, // Backend expects phoneNumber, not phone
                                  address: fullAddress, // Combine addressLine1 and addressLine2
                                  city: formData.city,
                                  state: formData.state,
                                  zipCode: formData.postalCode, // Backend expects zipCode, not postalCode
                                  country: formData.country,
                                  gstin: hasGstin && formData.gstin ? formData.gstin : undefined,
                                  isDefault: saveAddressAsDefault,
                                };
                                
                                const savedAddress = await userApi.createAddress(addressData);
                                toast.success('Address saved successfully!');
                                
                                // Refresh addresses list
                                queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
                                
                                // Auto-select the newly saved address
                                if (savedAddress?.id) {
                                  setSelectedAddressId(savedAddress.id);
                                  toast.info('Address selected for this order');
                                }
                                
                                // Reset checkbox
                                setSaveAddressAsDefault(false);
                              } catch (error: any) {
                                toast.error(error?.message || 'Failed to save address');
                              } finally {
                                setIsSavingAddress(false);
                              }
                            }}
                            disabled={isSavingAddress || (isLoggedIn && selectedAddressId !== null)}
                            className="h-10"
                          >
                            {isSavingAddress ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              '💾 Save Address'
                            )}
                          </Button>
                        </div>
                        {isLoggedIn && selectedAddressId !== null && (
                          <p className="text-xs text-muted-foreground mt-2">
                            To save a new address, first clear the selected address above
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollReveal>

                <ScrollReveal>
                  <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border">
                    <h3 className="font-serif text-lg sm:text-xl mb-6 font-semibold flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      Payment Method
                    </h3>
                    {hasDigitalProducts && availableGateways.length === 0 && (
                      <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-400 font-medium">
                          Payment method not available. Please try again later.
                        </p>
                      </div>
                    )}
                    {hasDigitalProducts && availableGateways.length > 0 && (
                      <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-400 font-medium">
                          ⚠️ Digital products require online payment only. COD is not available.
                        </p>
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2" role="group" aria-label="Payment method">
                        {availableGateways.includes('COD') && (
                          <button
                            type="button"
                            onClick={() => { setPaymentGateway('COD'); setPaymentMethod('cod'); }}
                            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                              paymentGateway === 'COD' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            Cash on Delivery (COD)
                          </button>
                        )}
                        {availableGateways.includes('PARTIAL_COD') && (
                          <button
                            type="button"
                            onClick={() => { setPaymentGateway('PARTIAL_COD'); setPaymentMethod('partial_cod'); }}
                            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                              paymentGateway === 'PARTIAL_COD' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            Partial COD
                          </button>
                        )}
                        {availableGateways.includes('STRIPE') && (
                          <button
                            type="button"
                            onClick={() => { setPaymentGateway('STRIPE'); setPaymentMethod('card'); }}
                            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                              paymentGateway === 'STRIPE' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            Card (Stripe)
                          </button>
                        )}
                        {availableGateways.includes('RAZORPAY') && (
                          <button
                            type="button"
                            onClick={() => { setPaymentGateway('RAZORPAY'); setPaymentMethod('razorpay'); }}
                            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                              paymentGateway === 'RAZORPAY' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            Razorpay (UPI/Card)
                          </button>
                        )}
                        {availableGateways.length === 0 && (
                          <span className="text-sm text-muted-foreground py-2">
                            {hasDigitalProducts ? 'Payment method not available. Please try again later.' : 'No payment methods available'}
                          </span>
                        )}
                      </div>
                      {paymentGateway === 'STRIPE' && (
                        <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                          You will be redirected to Stripe secure payment page after placing order.
                        </div>
                      )}
                      {paymentGateway === 'RAZORPAY' && (
                        <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                          You will be redirected to Razorpay secure payment page after placing order.
                          </div>
                      )}
                      {paymentGateway === 'COD' && (
                        <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                          Payment will be collected when your order is delivered.
                        </div>
                      )}
                      {paymentGateway === 'PARTIAL_COD' && paymentConfig?.partialCodAdvancePercentage && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg space-y-3">
                          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400 font-semibold">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Partial COD Payment Breakdown</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Order Total:</span>
                              <span className="font-medium">{format(total)}</span>
                            </div>
                            <div className="flex justify-between text-blue-700 dark:text-blue-300">
                              <span>Advance Payment ({paymentConfig.partialCodAdvancePercentage}%):</span>
                              <span className="font-semibold">{format((total * paymentConfig.partialCodAdvancePercentage) / 100)}</span>
                            </div>
                            <div className="flex justify-between text-green-700 dark:text-green-300">
                              <span>Remaining (COD on Delivery):</span>
                              <span className="font-semibold">{format(total - (total * paymentConfig.partialCodAdvancePercentage) / 100)}</span>
                            </div>
                            <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                              <p className="text-xs text-muted-foreground">
                                Pay {paymentConfig.partialCodAdvancePercentage}% online now, remaining amount will be collected when your order is delivered.
                              </p>
                            </div>
                          </div>
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
                <h3 className="font-serif text-lg sm:text-xl mb-6 font-semibold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                  Order Summary
                </h3>
                <div className="space-y-2 text-sm sm:text-base border-b pb-4 mb-4">
                  {items.map((item: any) => {
                    const hasBreakdown = item.productType === 'DESIGNED' && (item.designPrice != null || item.fabricPrice != null) || (item.unitPrice != null && (item.quantity || 1) > 0);
                    return (
                      <Collapsible key={item.id}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="line-clamp-1">{item.productName}</span>
                            {hasBreakdown && (
                              <CollapsibleTrigger asChild>
                                <button type="button" className="text-xs text-muted-foreground hover:text-foreground mt-0.5 flex items-center gap-0.5">
                                  Why this price? <ChevronDown className="w-3 h-3" />
                                </button>
                              </CollapsibleTrigger>
                            )}
                          </div>
                          <span className="flex-shrink-0 font-medium">{format(item.totalPrice || 0)}</span>
                        </div>
                        {hasBreakdown && (
                          <CollapsibleContent>
                            <div className="mt-2 pl-2 border-l-2 border-muted text-xs text-muted-foreground space-y-0.5">
                              {item.productType === 'DESIGNED' && item.designPrice != null && (
                                <div>Design: {format(Number(item.designPrice))}</div>
                              )}
                              {item.productType === 'DESIGNED' && item.fabricPrice != null && (
                                <div>Fabric: {format(Number(item.fabricPrice))}</div>
                              )}
                              {item.unitPrice != null && (
                                <div>Unit: {format(Number(item.unitPrice))} × {item.quantity || 1}</div>
                              )}
                              <div className="font-medium text-foreground pt-0.5">Total: {format(item.totalPrice || 0)}</div>
                            </div>
                          </CollapsibleContent>
                        )}
                      </Collapsible>
                    );
                  })}
                </div>
                <div className="space-y-3 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{format(subtotal)}</span>
                  </div>
                  {gst > 0 && (
                    <div className="flex justify-between">
                      <span>GST</span>
                      <span>{format(gst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : format(shipping)}</span>
                  </div>
                  {isLoggedIn && appliedCouponCode && couponDiscount > 0 && (
                    <div className="flex justify-between items-center text-primary">
                      <span>Coupon ({appliedCouponCode})</span>
                      <span className="flex items-center gap-2">
                        -{format(couponDiscount)}
                        <Link to="/cart" className="text-xs underline hover:no-underline">Change</Link>
                      </span>
                    </div>
                  )}
                  {paymentGateway === 'PARTIAL_COD' && paymentConfig?.partialCodAdvancePercentage && (
                    <>
                      <div className="pt-3 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Advance Payment ({paymentConfig.partialCodAdvancePercentage}%):</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{format((total * paymentConfig.partialCodAdvancePercentage) / 100)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Remaining (COD):</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">{format(total - (total * paymentConfig.partialCodAdvancePercentage) / 100)}</span>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-semibold text-lg sm:text-xl pt-4 border-t">
                    <span>Total</span>
                    <span>{format(total)}</span>
                  </div>
                  {paymentGateway === 'PARTIAL_COD' && paymentConfig?.partialCodAdvancePercentage && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground text-center">
                        You'll pay <span className="font-semibold text-blue-600 dark:text-blue-400">{format((total * paymentConfig.partialCodAdvancePercentage) / 100)}</span> online now
                      </p>
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white mt-6 sm:mt-8 h-12 sm:h-14 text-base font-semibold"
                  onClick={handlePlaceOrder}
                  disabled={createOrderMutation.isPending || isProcessingPayment}
                >
                  {(createOrderMutation.isPending || isProcessingPayment) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isProcessingPayment ? 'Processing Payment...' : 'Placing Order...'}
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
                <p className="mt-3 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Secure checkout
                </p>
              </div>
            </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
