import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cartApi, orderApi, userApi, shippingApi, paymentApi, businessConfigApi } from '@/lib/api';
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
  
  // Get cart from localStorage for guests (before useQuery/useEffect to avoid initialization issues)
  const guestCartItems = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('guestCart') || '[]') 
    : [];
  const subtotalFromLocalStorage = guestCartItems.reduce((sum: number, item: any) => 
    sum + (item.totalPrice || item.unitPrice * (item.quantity || 1)), 0);
  
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
      
      return orderApi.createOrder(orderData);
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
      toast.error(error.message || 'Failed to place order');
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
  
  // Fetch BusinessConfig to check COD/Partial COD settings
  const { data: businessConfig } = useQuery({
    queryKey: ['business-config'],
    queryFn: () => businessConfigApi.getConfig(),
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
    const codEnabled = businessConfig?.codEnabled ?? false;
    const partialCodEnabled = businessConfig?.partialCodEnabled ?? false;
    const onlinePaymentEnabled = businessConfig?.onlinePaymentEnabled ?? true;
    
    const gateways: string[] = [];
    
    // If cart contains Digital products, COD is NOT available
    if (hasDigitalProducts) {
      // Digital products: Only online payment gateways
      if (isIndia) {
        // India: Razorpay (if enabled) + Stripe (if enabled)
        if (apiGateways.includes('RAZORPAY') && onlinePaymentEnabled) {
          gateways.push('RAZORPAY');
        }
        if (apiGateways.includes('STRIPE') && onlinePaymentEnabled) {
          gateways.push('STRIPE');
        }
      } else {
        // Outside India: Only Stripe
        if (apiGateways.includes('STRIPE') && onlinePaymentEnabled) {
          gateways.push('STRIPE');
        }
      }
    } else {
      // Physical products: All available gateways based on country
      if (isIndia) {
        // India: Razorpay + Stripe + COD/Partial COD
        if (apiGateways.includes('RAZORPAY') && onlinePaymentEnabled) {
          gateways.push('RAZORPAY');
        }
        if (apiGateways.includes('STRIPE') && onlinePaymentEnabled) {
          gateways.push('STRIPE');
        }
        if (codEnabled) {
          gateways.push('COD');
        }
        if (partialCodEnabled) {
          gateways.push('PARTIAL_COD');
        }
      } else {
        // Outside India: Stripe + COD/Partial COD
        if (apiGateways.includes('STRIPE') && onlinePaymentEnabled) {
          gateways.push('STRIPE');
        }
        if (codEnabled) {
          gateways.push('COD');
        }
        if (partialCodEnabled) {
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
  }, [formData.country, isIndia, paymentMethodsData, hasDigitalProducts, businessConfig, paymentGateway]);
  
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
      toast.error('We are not able to process your order right now. Please try again after some time.');
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
        
        // Calculate advance amount (percentage of total)
        const advancePercentage = businessConfig?.partialCodAdvancePercentage || 20;
        const advanceAmount = (total * advancePercentage) / 100;
        
        // Process advance payment online
        const paymentRequest = {
          amount: convert(advanceAmount),
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
          await handleRazorpayPayment(paymentResponse, order.id);
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

      // Create payment order
      const paymentRequest = {
        amount: convert(total),
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
        await handleRazorpayPayment(paymentResponse, order.id);
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
      navigate(`/order-confirmation/${orderId}`, { 
        state: { 
          orderId, 
          paymentIntent: clientSecret,
          stripeKey: paymentResponse.orderData.key_id 
        } 
      });
    } catch (error: any) {
      toast.error(error.message || 'Payment initialization failed');
      setIsProcessingPayment(false);
    }
  };

  const handleRazorpayPayment = async (paymentResponse: any, orderId: number) => {
    return new Promise((resolve, reject) => {
      // Check if Razorpay is already loaded
      // @ts-ignore
      if (window.Razorpay) {
        processRazorpayPayment(paymentResponse, orderId).then(resolve).catch(reject);
        return;
      }

      const razorpayScript = document.createElement('script');
      razorpayScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
      razorpayScript.async = true;
      razorpayScript.onload = () => {
        processRazorpayPayment(paymentResponse, orderId).then(resolve).catch(reject);
      };
      razorpayScript.onerror = () => {
        reject(new Error('Failed to load Razorpay script'));
      };
      document.body.appendChild(razorpayScript);
    });
  };

  const processRazorpayPayment = async (paymentResponse: any, orderId: number) => {
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
          }
        }
      };

      // @ts-ignore
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        toast.error('Payment failed: ' + (response.error?.description || 'Unknown error'));
        setIsProcessingPayment(false);
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
            <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
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
                        <Select 
                          value={selectedAddressId?.toString() || ''} 
                          onValueChange={(val) => setSelectedAddressId(Number(val))}
                          required
                        >
                        <SelectTrigger className="h-12">
                            <SelectValue placeholder="Choose an address *" />
                        </SelectTrigger>
                        <SelectContent>
                          {addresses.map((addr: any) => (
                            <SelectItem key={addr.id} value={addr.id.toString()}>
                                {addr.firstName} {addr.lastName}, {addr.addressLine1 || addr.address}, {addr.city}, {addr.state}
                              {addr.isDefault && ' (Default)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      ) : (
                        <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                          No saved addresses. Fill in the form below and click "Save Address" to add one.
                        </div>
                      )}
                    </div>
                  </ScrollReveal>
                )}

                <ScrollReveal>
                  <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border">
                    <h3 className="font-serif text-lg sm:text-xl mb-6 font-semibold">
                      {isLoggedIn ? 'Shipping Information' : 'Shipping Information (Guest Checkout)'}
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
                    <h3 className="font-serif text-lg sm:text-xl mb-6 font-semibold">Payment Method</h3>
                    {hasDigitalProducts && (
                      <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-400 font-medium">
                          ⚠️ Digital products require online payment only. COD is not available.
                        </p>
                      </div>
                    )}
                    <div className="space-y-4">
                      <Select 
                        value={paymentGateway} 
                        onValueChange={(value) => {
                          setPaymentGateway(value);
                          if (value === 'COD') {
                            setPaymentMethod('cod');
                          } else if (value === 'PARTIAL_COD') {
                            setPaymentMethod('partial_cod');
                          } else if (value === 'STRIPE') {
                            setPaymentMethod('card');
                          } else if (value === 'RAZORPAY') {
                            setPaymentMethod('razorpay');
                          }
                        }}
                        disabled={availableGateways.length === 0}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={availableGateways.length === 0 ? "No payment methods available" : "Select payment method"} />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Only show available gateways */}
                          {availableGateways.includes('COD') && (
                            <SelectItem value="COD">Cash on Delivery (COD)</SelectItem>
                          )}
                          {availableGateways.includes('PARTIAL_COD') && (
                            <SelectItem value="PARTIAL_COD">Partial Cash on Delivery</SelectItem>
                          )}
                          {availableGateways.includes('STRIPE') && (
                            <SelectItem value="STRIPE">Stripe (Card)</SelectItem>
                          )}
                          {availableGateways.includes('RAZORPAY') && (
                            <SelectItem value="RAZORPAY">Razorpay (Card/UPI/Netbanking)</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
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
                      {paymentGateway === 'PARTIAL_COD' && businessConfig?.partialCodAdvancePercentage && (
                        <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                          You will pay {businessConfig.partialCodAdvancePercentage}% online as advance, and the remaining amount will be collected on delivery.
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
                <h3 className="font-serif text-lg sm:text-xl mb-6 font-semibold">Order Summary</h3>
                <div className="space-y-3 text-sm sm:text-base border-b pb-4 mb-4">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="line-clamp-1 flex-1 mr-2">{item.productName}</span>
                      <span className="flex-shrink-0">{format(item.totalPrice || 0)}</span>
                    </div>
                  ))}
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
                    <div className="flex justify-between text-primary">
                      <span>Coupon ({appliedCouponCode})</span>
                      <span>-{format(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg sm:text-xl pt-4 border-t">
                    <span>Total</span>
                    <span>{format(total)}</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white mt-6 sm:mt-8 h-12 sm:h-14 text-base"
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
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
