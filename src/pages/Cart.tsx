import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, Calculator, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cartApi, couponApi, productsApi } from '@/lib/api';
import { guestCart } from '@/lib/guestCart';
import PriceBreakdownPopup from '@/components/products/PriceBreakdownPopup';
import CartItemDetails from '@/components/cart/CartItemDetails';
import { usePrice } from '@/lib/currency';

// Separate component for cart item to allow hooks usage; compact with expandable variants/details
const CartItem = ({
  item,
  isLoggedIn,
  updateMutation,
  removeMutation,
  handleQuantityChange,
  handleRemoveItem,
  setSelectedItemForBreakdown,
  setShowPriceBreakdown,
}: any) => {
  const [detailsOpen, setDetailsOpen] = useState(item.productType === 'CUSTOM');
  const { format } = usePrice();

  const { data: productData } = useQuery({
    queryKey: ['product-slug', item.productId],
    queryFn: () => productsApi.getById(item.productId),
    enabled: !!item.productId && !item.productSlug && item.productType !== 'CUSTOM',
    retry: false,
  });

  const productSlug = item.productSlug || productData?.slug;
  const isCustom = item.productType === 'CUSTOM';
  const customEditUrl = isCustom && item.productId
    ? `/custom-product/${item.productId}?cartItemId=${encodeURIComponent(String(item.id))}`
    : null;
  const hasVariants = !!(item.variants && Object.keys(item.variants).length) || !!(item.variantSelections && Object.keys(item.variantSelections).length) || !!(item.customFormData && Object.keys(item.customFormData).length) || (item.productType === 'DESIGNED' && item.fabricId) || (isCustom && item.fabricId);

  return (
    <ScrollReveal key={item.id}>
      <div className="flex gap-3 xs:gap-4 sm:gap-6 p-3 xs:p-4 sm:p-6 bg-card rounded-xl sm:rounded-2xl border border-border">
        <img src={item.productImage || ''} alt={item.productName} className="w-20 h-24 xs:w-24 xs:h-32 sm:w-28 sm:h-36 lg:w-32 lg:h-40 object-cover rounded-lg sm:rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {customEditUrl ? (
            <Link to={customEditUrl} className="font-cursive text-lg xs:text-xl sm:text-2xl hover:text-[#2b9d8f] line-clamp-2">
              {item.productName}
            </Link>
          ) : productSlug ? (
            <Link to={`/product/${productSlug}`} className="font-cursive text-lg xs:text-xl sm:text-2xl hover:text-[#2b9d8f] line-clamp-2">
              {item.productName}
            </Link>
          ) : (
            <span className="font-cursive text-lg xs:text-xl sm:text-2xl line-clamp-2">{item.productName}</span>
          )}
          <p className="text-xs xs:text-sm sm:text-base text-muted-foreground mt-1">{item.productType}</p>

          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            {hasVariants && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs mt-1.5 h-7 px-2 -ml-2 text-muted-foreground hover:text-foreground">
                  {detailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {detailsOpen ? 'Hide details' : 'View details'}
                </Button>
              </CollapsibleTrigger>
            )}
            <CollapsibleContent>
              <div className="mt-1">
                <CartItemDetails
                  item={{
                    ...item,
                    productType: item.productType,
                    productId: item.productId,
                    fabricId: item.fabricId,
                    quantity: item.quantity || 1,
                    variants: item.variants,
                    variantSelections: item.variantSelections,
                    customFormData: item.customFormData,
                    designPrice: item.designPrice,
                    fabricPrice: item.fabricPrice,
                    uploadedDesignUrl: item.uploadedDesignUrl,
                  }}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex items-center justify-between mt-2 xs:mt-3">
            {(() => {
              const linePrice = item.totalPrice || item.unitPrice || 0;

              // #region agent log
              try {
                fetch('http://127.0.0.1:7242/ingest/c85bf050-6243-4194-976e-3e54a6a21ac3', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: 'debug-session',
                    runId: 'pre-fix',
                    hypothesisId: 'H3',
                    location: 'Cart.tsx:93',
                    message: 'CartItem line price render',
                    data: {
                      id: item.id,
                      productType: item.productType,
                      unitPrice: item.unitPrice,
                      quantity: item.quantity,
                      totalPrice: item.totalPrice,
                      linePrice,
                    },
                    timestamp: Date.now(),
                  }),
                }).catch(() => {});
              } catch {
                // ignore
              }
              // #endregion

              return (
                <p className="font-semibold text-[#2b9d8f] text-base xs:text-lg sm:text-xl">
                  {format(linePrice)}
                </p>
              );
            })()}
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => { setSelectedItemForBreakdown(item); setShowPriceBreakdown(true); }}>
              <Calculator className="w-3.5 h-3.5" />
              Breakdown
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 xs:gap-3 sm:gap-4 mt-3 xs:mt-4">
            <div className="flex items-center border border-border rounded-full">
              <Button variant="ghost" size="icon" className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 rounded-full" onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={isLoggedIn && updateMutation.isPending}>
                <Minus className="w-3 h-3 xs:w-4 xs:h-4" />
              </Button>
              <span className="w-8 xs:w-9 sm:w-10 text-center text-xs xs:text-sm sm:text-base">{item.quantity || 1}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 rounded-full" onClick={() => handleQuantityChange(item.id, item.quantity + 1)} disabled={isLoggedIn && updateMutation.isPending}>
                <Plus className="w-3 h-3 xs:w-4 xs:h-4" />
              </Button>
            </div>
            {customEditUrl && (
              <Link to={customEditUrl}>
                <Button variant="ghost" size="icon" className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10" title="Edit">
                  <Pencil className="w-4 h-4 xs:w-5 xs:h-5" />
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="text-destructive w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10" onClick={() => handleRemoveItem(item.id)} disabled={isLoggedIn && removeMutation.isPending}>
              <Trash2 className="w-4 h-4 xs:w-5 xs:h-5" />
            </Button>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
};

const Cart = () => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [selectedItemForBreakdown, setSelectedItemForBreakdown] = useState<any>(null);
  const queryClient = useQueryClient();
  const { format } = usePrice();
  
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
  
  const isLoggedIn = !!localStorage.getItem('authToken');
  
  // Fetch cart from API with coupon code (only if logged in)
  const { data: cartData, isLoading, refetch: refetchCart } = useQuery({
    queryKey: ['cart', appliedCouponCode],
    queryFn: () => cartApi.getCart(undefined, appliedCouponCode || undefined),
    enabled: isLoggedIn,
  });
  
  // Get guest cart items from localStorage
  const [guestCartItems, setGuestCartItems] = useState(guestCart.getItems());
  
  // Listen for guest cart updates
  useEffect(() => {
    const handleGuestCartUpdate = () => {
      setGuestCartItems(guestCart.getItems());
    };
    window.addEventListener('guestCartUpdated', handleGuestCartUpdate);
    return () => window.removeEventListener('guestCartUpdated', handleGuestCartUpdate);
  }, []);
  
  // Update cart item quantity
  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) => 
      cartApi.updateItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update cart');
    },
  });
  
  // Remove cart item
  const removeMutation = useMutation({
    mutationFn: cartApi.removeItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed from cart');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove item');
    },
  });
  
  // Handle guest cart operations
  const handleGuestCartUpdate = (itemId: string, quantity: number) => {
    guestCart.updateItem(itemId, quantity);
    setGuestCartItems(guestCart.getItems());
    window.dispatchEvent(new Event('guestCartUpdated'));
  };
  
  const handleGuestCartRemove = (itemId: string) => {
    guestCart.removeItem(itemId);
    setGuestCartItems(guestCart.getItems());
    window.dispatchEvent(new Event('guestCartUpdated'));
    toast.success('Item removed from cart');
  };
  
  // Calculate totals
  const items = isLoggedIn ? (cartData?.items || []) : guestCartItems;
  const subtotal = isLoggedIn 
    ? (cartData?.subtotal ? Number(cartData.subtotal) : 0)
    : guestCartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const gst = isLoggedIn 
    ? (cartData?.gst ? Number(cartData.gst) : 0)
    : 0; // GST calculated at checkout for guests
  const shipping = isLoggedIn 
    ? (cartData?.shipping ? Number(cartData.shipping) : 0)
    : 0; // Guest shipping calculated at checkout
  const couponDiscount = isLoggedIn 
    ? (cartData?.couponDiscount ? Number(cartData.couponDiscount) : 0)
    : 0; // Coupons only for logged-in users
  const total = subtotal + gst + shipping - couponDiscount;
  const orderTotalBeforeCoupon = subtotal + gst + shipping;

  // Eligible coupons for logged-in users (order total before discount)
  const { data: eligibleCoupons = [] } = useQuery({
    queryKey: ['coupons-eligible', orderTotalBeforeCoupon],
    queryFn: () => couponApi.getEligible(orderTotalBeforeCoupon),
    enabled: isLoggedIn && orderTotalBeforeCoupon > 0,
  });

  // Update applied coupon code from cart data
  useEffect(() => {
    if (cartData?.appliedCouponCode) {
      setAppliedCouponCode(cartData.appliedCouponCode);
    }
  }, [cartData?.appliedCouponCode]);
  
  // Apply coupon
  const applyCouponMutation = useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      const userEmail = getUserEmail();
      const totalBeforeCoupon = subtotal + gst + shipping;
      const validation = await couponApi.validate(code, totalBeforeCoupon, userEmail || undefined);
      if (validation.valid) {
        setAppliedCouponCode(code);
        await refetchCart();
        return validation;
      } else {
        throw new Error(validation.message || 'Invalid coupon code');
      }
    },
    onSuccess: (data) => {
      toast.success(`Coupon applied! You save ${format(data.discount || 0)}`);
      setCouponCode('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Invalid coupon code');
    },
  });
  
  // Remove coupon
  const removeCoupon = () => {
    setAppliedCouponCode(null);
    setCouponCode('');
    refetchCart();
    toast.success('Coupon removed');
  };
  
  const handleQuantityChange = (itemId: number | string, newQuantity: number) => {
    if (newQuantity > 0) {
      if (isLoggedIn) {
        updateMutation.mutate({ itemId: itemId as number, quantity: newQuantity });
      } else {
        handleGuestCartUpdate(itemId as string, newQuantity);
      }
    }
  };
  
  const handleRemoveItem = (itemId: number | string) => {
    if (isLoggedIn) {
      removeMutation.mutate(itemId as number);
    } else {
      handleGuestCartRemove(itemId as string);
    }
  };
  
  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      applyCouponMutation.mutate({ code: couponCode.trim().toUpperCase() });
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="w-full bg-secondary/30 py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          <ScrollReveal>
            <h1 className="font-cursive text-3xl xs:text-4xl sm:text-5xl lg:text-6xl">Shopping Cart</h1>
            <p className="text-muted-foreground mt-2 xs:mt-3 text-sm xs:text-base sm:text-lg">{items.length} items in your cart</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="w-full py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="max-w-[1600px] mx-auto px-3 xs:px-4 sm:px-6 lg:px-12">
          {(isLoading && isLoggedIn) ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : items.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 xl:gap-14">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {items.map((item: any) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    isLoggedIn={isLoggedIn}
                    updateMutation={updateMutation}
                    removeMutation={removeMutation}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveItem={handleRemoveItem}
                    setSelectedItemForBreakdown={setSelectedItemForBreakdown}
                    setShowPriceBreakdown={setShowPriceBreakdown}
                  />
                ))}
              </div>
              
              <div className="bg-card p-4 xs:p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-border h-fit lg:sticky lg:top-24">
                <h3 className="font-cursive text-xl xs:text-2xl mb-4 xs:mb-6">Order Summary</h3>
                <div className="space-y-3 xs:space-y-4 text-sm xs:text-base">
                  <div className="flex justify-between"><span>Subtotal</span><span>{format(subtotal)}</span></div>
                  {gst > 0 && (
                    <div className="flex justify-between"><span>GST</span><span>{format(gst)}</span></div>
                  )}
                  <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? (isLoggedIn ? 'Free' : 'Calculated at checkout') : format(shipping)}</span></div>
                  {isLoggedIn && appliedCouponCode && couponDiscount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Coupon ({appliedCouponCode})</span>
                      <span>-{format(couponDiscount)}</span>
                    </div>
                  )}
                  {!isLoggedIn && (
                    <p className="text-xs text-muted-foreground mt-2">Shipping, GST, and coupons calculated at checkout</p>
                  )}
                  <div className="border-t pt-3 xs:pt-4 flex justify-between font-semibold text-lg xs:text-xl">
                    <span>Total</span>
                    <span>{format(total)}</span>
                  </div>
                </div>
                <div className="mt-4 xs:mt-6 space-y-3">
                  {isLoggedIn ? (
                    appliedCouponCode ? (
                      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div>
                          <p className="text-sm font-medium">Applied: {appliedCouponCode}</p>
                          <p className="text-xs text-muted-foreground">Discount: {format(couponDiscount)}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={removeCoupon} className="text-xs">
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        {eligibleCoupons.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Available coupons</p>
                            <div className="flex flex-wrap gap-2">
                              {eligibleCoupons.map((c: any) => (
                                <Button
                                  key={c.code}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => applyCouponMutation.mutate({ code: c.code })}
                                  disabled={applyCouponMutation.isPending}
                                >
                                  {c.code} — {c.message}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 xs:gap-3">
                          <Input
                            placeholder="Have a code? Enter here"
                            className="flex-1 h-10 xs:h-11 sm:h-12 text-sm sm:text-base"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          />
                          <Button
                            variant="outline"
                            className="h-10 xs:h-11 sm:h-12 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
                            onClick={handleApplyCoupon}
                            disabled={applyCouponMutation.isPending || !couponCode.trim()}
                          >
                            {applyCouponMutation.isPending ? 'Applying...' : 'Apply'}
                          </Button>
                        </div>
                      </>
                    )
                  ) : (
                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                      <p className="text-xs sm:text-sm font-medium">Discount / Coupon</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Log in to see and use discount coupons.</p>
                      <Link to="/login" state={{ returnTo: '/cart' }} className="inline-block mt-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          Log in
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                <Link to="/checkout" className="block mt-4 xs:mt-6">
                  <Button className="w-full bg-[#2b9d8f] hover:bg-[#238a7d] text-white h-12 xs:h-14 text-sm sm:text-base">
                    <span className="truncate">Checkout</span>
                    <ArrowRight className="w-4 h-4 xs:w-5 xs:h-5 ml-1.5 xs:ml-2 flex-shrink-0" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 xs:py-16 sm:py-20">
              <ShoppingBag className="w-16 h-16 xs:w-20 xs:h-20 mx-auto text-muted-foreground mb-4 xs:mb-6" />
              <h2 className="font-cursive text-2xl xs:text-3xl mb-2 xs:mb-3">Your cart is empty</h2>
              <p className="text-muted-foreground text-sm xs:text-base sm:text-lg mb-6 xs:mb-8">Looks like you haven't added anything yet.</p>
              <Link to="/products"><Button className="bg-[#2b9d8f] hover:bg-[#238a7d] text-white px-4 sm:px-8 py-2 sm:py-4 text-xs sm:text-sm">Continue Shopping</Button></Link>
            </div>
          )}
        </div>
      </section>
      
      {/* Price Breakdown Popup */}
      {selectedItemForBreakdown && (
        <PriceBreakdownPopup
          open={showPriceBreakdown}
          onOpenChange={setShowPriceBreakdown}
          item={{
            productType: selectedItemForBreakdown.productType,
            productName: selectedItemForBreakdown.productName,
            productId: selectedItemForBreakdown.productId,
            designPrice: selectedItemForBreakdown.designPrice ? Number(selectedItemForBreakdown.designPrice) : undefined,
            fabricPrice: selectedItemForBreakdown.fabricPrice ? Number(selectedItemForBreakdown.fabricPrice) : undefined,
            unitPrice: selectedItemForBreakdown.unitPrice ? Number(selectedItemForBreakdown.unitPrice) : undefined,
            totalPrice: selectedItemForBreakdown.totalPrice ? Number(selectedItemForBreakdown.totalPrice) : undefined,
            quantity: selectedItemForBreakdown.quantity || 1,
            variants: selectedItemForBreakdown.variants,
            pricePerMeter: selectedItemForBreakdown.unitPrice ? Number(selectedItemForBreakdown.unitPrice) : undefined,
            basePrice: selectedItemForBreakdown.designPrice ? Number(selectedItemForBreakdown.designPrice) : (selectedItemForBreakdown.unitPrice ? Number(selectedItemForBreakdown.unitPrice) : undefined),
          }}
        />
      )}
    </Layout>
  );
};

export default Cart;
