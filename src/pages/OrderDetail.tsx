import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Package, Download } from 'lucide-react';
import { orderApi, productsApi } from '@/lib/api';
import { format } from 'date-fns';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getOrderById(Number(id)),
    enabled: !!id,
  });

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
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding min-h-[calc(100vh-200px)] bg-muted/40">
        <div className="container-custom max-w-4xl mx-auto py-6 md:py-10">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="space-y-6">
            {/* Order Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Order #{order.id}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Placed on {order.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Swipe Invoice Section */}
            {order.swipeInvoiceNumber && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Swipe Invoice</span>
                    {order.swipeInvoiceUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(order.swipeInvoiceUrl, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Invoice
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Invoice Number:</span>{' '}
                      <span>{order.swipeInvoiceNumber}</span>
                    </div>
                    {order.swipeIrn && (
                      <div>
                        <span className="font-medium">IRN:</span>{' '}
                        <span className="font-mono text-sm">{order.swipeIrn}</span>
                      </div>
                    )}
                    {order.swipeQrCode && (
                      <div className="mt-4">
                        <span className="font-medium block mb-2">QR Code:</span>
                        <img
                          src={order.swipeQrCode}
                          alt="E-Invoice QR Code"
                          className="w-32 h-32 border border-border rounded"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                      <img
                        src={item.image || '/placeholder-product.jpg'}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        <p className="text-sm text-muted-foreground">Price: ₹{item.price?.toLocaleString('en-IN')}</p>
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
                              onClick={async () => {
                                try {
                                  // Check if stored ZIP URL exists
                                  if (item.digitalDownloadUrl) {
                                    const a = document.createElement('a');
                                    a.href = item.digitalDownloadUrl;
                                    a.download = `product_${item.productId}_files.zip`;
                                    a.target = '_blank';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    alert('Download started!');
                                  } else {
                                    // Fallback: Download ZIP from backend
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
                                    
                                    alert('Download started!');
                                  }
                                } catch (error: any) {
                                  console.error('Download error:', error);
                                  alert(error.message || 'Failed to download files');
                                }
                              }}
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{item.totalPrice?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  {order.shippingAddress ? (
                    <div className="text-sm space-y-1">
                      {typeof order.shippingAddress === 'string' ? (
                        <pre className="whitespace-pre-wrap">{order.shippingAddress}</pre>
                      ) : (
                        <>
                          <p className="font-semibold">
                            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                          </p>
                          <p>{order.shippingAddress.address}</p>
                          <p>
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                          </p>
                          <p>Phone: {order.shippingAddress.phone}</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No address available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{order.shipping === 0 ? 'Free' : `₹${order.shipping?.toLocaleString('en-IN')}`}</span>
                    </div>
                    {order.couponCode && order.couponDiscount && order.couponDiscount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Coupon ({order.couponCode})</span>
                        <span>-₹{order.couponDiscount?.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>₹{order.total?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  {order.paymentMethod && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm">
                        <span className="font-medium">Payment Method:</span> {order.paymentMethod}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OrderDetail;
