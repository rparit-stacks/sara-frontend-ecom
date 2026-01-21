import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Package, ArrowRight, LogIn, Download } from 'lucide-react';
import { orderApi, productsApi } from '@/lib/api';
import { format } from 'date-fns';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { toast } from 'sonner';
import { useState } from 'react';

const OrderConfirmation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());
  
  // Get order ID from URL params or location state
  const orderId = id || (location.state as any)?.orderId;
  
  const isLoggedIn = !!localStorage.getItem('authToken');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.getOrderById(Number(orderId)),
    enabled: !!orderId,
  });

  const handleDigitalDownload = async (item: any) => {
    if (!item.productId) {
      toast.error('Product ID not available');
      return;
    }

    setDownloadingIds(prev => new Set(prev).add(item.productId));
    
    try {
      // Check if stored ZIP URL exists in order item
      if (item.digitalDownloadUrl) {
        // Use stored Cloudinary URL directly
        const a = document.createElement('a');
        a.href = item.digitalDownloadUrl;
        a.download = `product_${item.productId}_files.zip`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Download started!');
      } else {
        // Fallback: Download ZIP from backend (generates on-demand)
      const blob = await productsApi.downloadDigitalFiles(item.productId);
      
      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product_${item.productId}_files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started!');
      }
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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-lg mb-4">Order not found</p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="w-full bg-secondary/30 py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <ScrollReveal>
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h1 className="font-cursive text-5xl lg:text-6xl mb-3">Order Confirmed!</h1>
              <p className="text-muted-foreground mt-3 text-lg">
                Thank you for your purchase. Your order has been placed successfully.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="w-full py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Order Summary Card */}
            <ScrollReveal>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">Order #{order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Placed on {order.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                    <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'} className="text-sm">
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items */}
                    <div>
                      <h3 className="font-semibold mb-3">Order Items</h3>
                      <div className="space-y-3">
                        {order.items?.map((item: any, index: number) => (
                          <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name || item.productName}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{item.name || item.productName}</p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity} × ₹{(item.price || item.unitPrice)?.toLocaleString('en-IN')}
                              </p>
                              {item.productType === 'DIGITAL' && (
                                <div className="mt-2 space-y-2">
                                  {item.zipPassword && (
                                    <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded">
                                      <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                                        📦 ZIP Password:
                                      </p>
                                      <p className="text-sm font-mono font-bold text-yellow-900 dark:text-yellow-300 tracking-wider">
                                        {item.zipPassword}
                                      </p>
                                      <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1 italic">
                                        First 4 letters of email (uppercase) + Last 4 digits of mobile
                                      </p>
                                    </div>
                                  )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                    className="gap-2"
                                  onClick={() => handleDigitalDownload(item)}
                                  disabled={downloadingIds.has(item.productId)}
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
                              )}
                            </div>
                            <p className="font-semibold">₹{item.totalPrice?.toLocaleString('en-IN')}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>{order.shipping === 0 ? 'Free' : `₹${order.shipping?.toLocaleString('en-IN')}`}</span>
                      </div>
                      {order.couponDiscount && order.couponDiscount > 0 && (
                        <div className="flex justify-between text-primary">
                          <span>Coupon Discount</span>
                          <span>-₹{order.couponDiscount?.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>₹{order.total?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <ScrollReveal>
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      </p>
                      <p className="text-muted-foreground">{order.shippingAddress.address}</p>
                      <p className="text-muted-foreground">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                      </p>
                      <p className="text-muted-foreground">Phone: {order.shippingAddress.phone}</p>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}

            {/* Action Buttons */}
            <ScrollReveal>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isLoggedIn ? (
                  <>
                    <Button
                      onClick={() => navigate('/dashboard')}
                      className="bg-[#2b9d8f] hover:bg-[#238a7d] text-white"
                      size="lg"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Go to My Orders
                    </Button>
                    <Button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      variant="outline"
                      size="lg"
                    >
                      View Order Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => navigate('/login')}
                      className="bg-[#2b9d8f] hover:bg-[#238a7d] text-white"
                      size="lg"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Login to Check Your Order
                    </Button>
                    <Button
                      onClick={() => navigate('/')}
                      variant="outline"
                      size="lg"
                    >
                      Continue Shopping
                    </Button>
                  </>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OrderConfirmation;
