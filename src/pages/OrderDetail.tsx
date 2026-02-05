import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Download, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { orderApi, paymentApi } from '@/lib/api';
import { getPaymentStatusDisplay } from '@/lib/orderUtils';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { renderCustomValue } from '@/lib/renderCustomValue';
import { format } from 'date-fns';

/** Renders one order item as key-value (left) + amount (right). Used in both single and all-products dialogs. */
function OrderItemDetailBlock({
  item,
  currency = 'INR',
  showDigitalActions,
  order,
  onDownload,
  onPayAgain,
  isDownloading,
}: {
  item: any;
  currency?: string;
  showDigitalActions?: boolean;
  order?: any;
  onDownload?: (item: any) => void;
  onPayAgain?: () => void;
  isDownloading?: boolean;
}) {
  const price = (n: number | undefined) =>
    n != null ? formatPrice(Number(n), currency) : '—';
  return (
    <div className="flex gap-6 border border-border rounded-lg p-4">
      <div className="flex-1 min-w-0 space-y-2 text-sm">
        <div className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-3 gap-y-1 items-baseline">
          <span className="font-medium text-muted-foreground shrink-0">Product</span>
          <span className="font-semibold">{item.name || '—'}</span>
        </div>
        <div className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-3 gap-y-1 items-baseline">
          <span className="font-medium text-muted-foreground shrink-0">Quantity</span>
          <span>{item.quantity ?? '—'}</span>
        </div>
        <div className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-3 gap-y-1 items-baseline">
          <span className="font-medium text-muted-foreground shrink-0">Unit price</span>
          <span>{price(item.price ?? item.unitPrice)}</span>
        </div>
        <div className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-3 gap-y-1 items-baseline">
          <span className="font-medium text-muted-foreground shrink-0">Type</span>
          <span>{item.productType || 'N/A'}</span>
        </div>
        {item.variantDisplay && item.variantDisplay.length > 0 && (
          <div>
            <div className="font-medium text-muted-foreground mb-1">Variant</div>
            <div className="space-y-1">
              {item.variantDisplay.map((v: any, idx: number) => (
                <div key={idx}>
                  {v.variantName || '—'}: {v.optionValue || '—'}
                  {v.variantUnit && ` (${v.variantUnit})`}
                  {v.priceModifier != null && Number(v.priceModifier) !== 0 && (
                    <span className="text-green-600 ml-1">
                      {Number(v.priceModifier) > 0 ? '+' : ''}
                      {price(Number(v.priceModifier))}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {item.customData && Object.keys(item.customData).length > 0 && (
          <div>
            <div className="font-medium text-muted-foreground mb-1">Custom fields</div>
            <div className="space-y-1.5">
              {Object.entries(item.customData).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-2 items-baseline">
                  <span className="font-medium text-muted-foreground shrink-0">
                    {item.customFieldLabels?.[k] ?? k}
                  </span>
                  <span className="break-words">{renderCustomValue(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {item.uploadedDesignUrl && (
          <div>
            <div className="font-medium text-muted-foreground mb-1">Uploaded design</div>
            <a
              href={item.uploadedDesignUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm break-all"
            >
              View design
            </a>
            {item.uploadedDesignUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) && (
              <div className="mt-2">
                <img
                  src={item.uploadedDesignUrl}
                  alt="Uploaded design"
                  className="max-h-24 rounded border border-border object-contain"
                />
              </div>
            )}
          </div>
        )}
        {item.productType === 'DIGITAL' && (item.zipPassword || item.digitalDownloadUrl) && (
          <div className="pt-2 border-t border-border space-y-1">
            <div className="font-medium text-muted-foreground">Digital product</div>
            {item.zipPassword && (
              <div className="text-muted-foreground">
                ZIP Password: <span className="font-mono">{item.zipPassword}</span>
              </div>
            )}
            {showDigitalActions && order && onDownload && (
              <div className="pt-2">
                {(() => {
                  const d = getPaymentStatusDisplay(order);
                  const canDownload = d?.label === 'Paid' || d?.label === 'Partial Paid';
                  const status = (order?.paymentStatus || '').toUpperCase();
                  const isRefunded = status === 'REFUNDED';
                  const isFailed = status === 'FAILED';
                  const isPending = status === 'PENDING';
                  if (canDownload) {
                    return (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => onDownload?.(item)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {isDownloading ? 'Downloading...' : 'Download'}
                      </Button>
                    );
                  }
                  if (isRefunded) {
                    return <p className="text-xs text-muted-foreground">Refunded. Download no longer available.</p>;
                  }
                  if (isFailed) {
                    return (
                      <Button size="sm" variant="default" onClick={onPayAgain}>
                        Pay Again
                      </Button>
                    );
                  }
                  if (isPending) {
                    return (
                      <Button size="sm" variant="default" onClick={onPayAgain}>
                        Complete payment
                      </Button>
                    );
                  }
                  return <p className="text-xs text-muted-foreground">Download available after payment is confirmed.</p>;
                })()}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="font-semibold text-lg">{price(item.totalPrice)}</div>
        <div className="text-xs text-muted-foreground">Incl. GST</div>
      </div>
    </div>
  );
}

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mainDetailOpen, setMainDetailOpen] = useState(false);
  const [productDetailItem, setProductDetailItem] = useState<any | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getOrderById(Number(id)),
    enabled: !!id,
  });

  const currency = order?.paymentCurrency || 'INR';

  const handleDigitalDownload = async (item: any) => {
    if (!order?.id || !item?.productId) return;
    setDownloadingIds((prev) => new Set(prev).add(item.productId));
    try {
      const blob = await orderApi.downloadDigitalForOrder(order.id, item.productId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product_${item.productId}_files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download error:', err);
      alert(err?.message || 'Failed to download files');
    } finally {
      setDownloadingIds((prev) => {
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
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  const isPartialCodWithPending =
    (order.paymentMethod || '').toUpperCase() === 'PARTIAL_COD' &&
    (order.paymentStatus || '').toUpperCase() === 'PAID' &&
    Number(order.paymentAmount ?? 0) < Number(order.total ?? 0);
  const pendingAmount = isPartialCodWithPending
    ? Number(order.total ?? 0) - Number(order.paymentAmount ?? 0)
    : 0;

  const handlePayRemaining = async () => {
    if (!order?.id || pendingAmount <= 0) return;
    try {
      const res = await paymentApi.payRemaining(order.id);
      const gateway = (res?.gateway || 'STRIPE').toUpperCase();
      if (gateway === 'RAZORPAY') {
        await openRazorpayPayRemaining(res, order.id, order.orderNumber, pendingAmount);
      } else {
        navigate(`/order-confirmation/${order.id}`, {
          state: {
            orderId: order.id,
            paymentIntentId: res?.orderData?.payment_intent_id ?? res?.paymentId,
            paymentIntent: res?.orderData?.client_secret,
            stripeKey: res?.orderData?.key_id,
            isPayRemaining: true,
            remainingAmount: pendingAmount,
          },
        });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start payment');
    }
  };

  const openRazorpayPayRemaining = async (
    paymentResponse: any,
    orderId: number,
    orderNumber: string,
    remainingAmount: number
  ) => {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).Razorpay) {
        runRazorpayPayRemaining(paymentResponse, orderId, orderNumber, remainingAmount).then(resolve).catch(reject);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () =>
        runRazorpayPayRemaining(paymentResponse, orderId, orderNumber, remainingAmount).then(resolve).catch(reject);
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });
  };

  const runRazorpayPayRemaining = async (
    paymentResponse: any,
    orderId: number,
    orderNumber: string,
    remainingAmount: number
  ) => {
    const Razorpay = (window as any).Razorpay;
    if (!Razorpay) return;
    const options = {
      key: paymentResponse.orderData?.key_id,
      amount: paymentResponse.orderData?.amount,
      currency: paymentResponse.orderData?.currency,
      name: 'Studio Sara',
      description: `Pay remaining for Order #${orderId}`,
      order_id: paymentResponse.orderData?.order_id,
      handler: async (response: any) => {
        try {
          await paymentApi.verify({
            paymentId: response.razorpay_payment_id,
            orderId: String(orderId),
            gateway: 'RAZORPAY',
            amount: remainingAmount,
            verificationData: {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            },
          });
          toast.success('Payment successful!');
          navigate(`/orders/${orderId}`);
          window.location.reload();
        } catch (e: any) {
          toast.error(e?.message || 'Verification failed');
        }
      },
      modal: { ondismiss: () => {} },
    };
    const rp = new Razorpay(options);
    rp.on('payment.failed', () => toast.error('Payment failed'));
    rp.open();
  };

  return (
    <Layout>
      <section className="section-padding min-h-[calc(100vh-200px)] bg-muted/40">
        <div className="container-custom max-w-6xl mx-auto py-6 md:py-10">
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

            {/* 30% Shipping + Summary | 70% Order Items */}
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_7fr] gap-6">
              {/* Left: Shipping + Order Summary */}
              <div className="space-y-6">
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
                              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                              {order.shippingAddress.postalCode}
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
                        <span>{formatPrice(Number(order.subtotal ?? 0), currency)}</span>
                      </div>
                      {order.gst != null && Number(order.gst) !== 0 && (
                        <div className="flex justify-between">
                          <span>GST</span>
                          <span>{formatPrice(Number(order.gst), currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>
                          {order.shipping === 0 ? 'Free' : formatPrice(Number(order.shipping ?? 0), currency)}
                        </span>
                      </div>
                      {order.couponCode && order.couponDiscount && order.couponDiscount > 0 && (
                        <div className="flex justify-between text-primary">
                          <span>Coupon ({order.couponCode})</span>
                          <span>-{formatPrice(Number(order.couponDiscount), currency)}</span>
                        </div>
                      )}
                      {(() => {
                        // Calculate COD charge: Total - (Subtotal + GST + Shipping - Discount)
                        const baseTotal = Number(order.subtotal ?? 0) + Number(order.gst ?? 0) + Number(order.shipping ?? 0) - Number(order.couponDiscount ?? 0);
                        const codCharge = Number(order.total ?? 0) - baseTotal;
                        const isCod = order.paymentMethod === 'COD' || order.paymentMethod === 'cod' || order.paymentMethod === 'CASH_ON_DELIVERY';
                        
                        if (isCod && codCharge > 0) {
                          return (
                            <div className="flex justify-between text-primary">
                              <span>COD charge</span>
                              <span>+{formatPrice(codCharge, currency)}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>{formatPrice(Number(order.total ?? 0), currency)}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      {(() => {
                        const d = getPaymentStatusDisplay(order);
                        return (
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">Payment:</span>{' '}
                              <Badge className={d.className}>{d.label}</Badge>
                            </p>
                            {d.detail && <p className="text-xs text-muted-foreground">{d.detail}</p>}
                            {isPartialCodWithPending && pendingAmount > 0 && (
                              <div className="mt-3 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                  Pending amount: {formatPrice(pendingAmount, currency)}
                                </p>
                                <Button
                                  size="sm"
                                  className="mt-2 bg-[#2b9d8f] hover:bg-[#238a7d] text-white"
                                  onClick={handlePayRemaining}
                                >
                                  Pay remaining
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Order Items */}
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>Order Items</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMainDetailOpen(true)}
                      className="gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View in Detail
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.items?.map((item: any, index: number) => (
                      <div
                        key={item.id ?? index}
                        className="flex items-center justify-between gap-4 py-3 border-b last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{item.name}</p>
                            {item.productType === 'DIGITAL' && (
                              <Badge variant="secondary" className="text-xs">
                                Digital
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × {formatPrice(Number(item.price ?? item.unitPrice ?? 0), currency)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <p className="font-semibold">
                            {formatPrice(Number(item.totalPrice ?? 0), currency)}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setProductDetailItem(item)}
                          >
                            <FileText className="w-4 h-4" />
                            View in Detail
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Single-product "View in Detail" dialog */}
      <Dialog open={!!productDetailItem} onOpenChange={(open) => !open && setProductDetailItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product details</DialogTitle>
          </DialogHeader>
          {productDetailItem && (
            <OrderItemDetailBlock
              item={productDetailItem}
              currency={currency}
              showDigitalActions
              order={order}
              onDownload={handleDigitalDownload}
              onPayAgain={() => navigate('/checkout')}
              isDownloading={downloadingIds.has(productDetailItem.productId)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* All-products "View in Detail" dialog */}
      <Dialog open={mainDetailOpen} onOpenChange={setMainDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Order items – full detail</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {order.items?.map((item: any, index: number) => (
              <OrderItemDetailBlock
                key={item.id ?? index}
                item={item}
                currency={currency}
              />
            ))}
          </div>
          <div className="border-t pt-4 mt-4 space-y-2 text-sm shrink-0">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(Number(order.subtotal ?? 0), currency)}</span>
            </div>
            {order.gst != null && Number(order.gst) !== 0 && (
              <div className="flex justify-between">
                <span>GST</span>
                <span>{formatPrice(Number(order.gst), currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>
                {order.shipping === 0 ? 'Free' : formatPrice(Number(order.shipping ?? 0), currency)}
              </span>
            </div>
            {order.couponCode && order.couponDiscount && order.couponDiscount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Coupon ({order.couponCode})</span>
                <span>-{formatPrice(Number(order.couponDiscount), currency)}</span>
              </div>
            )}
            {(() => {
              // Calculate COD charge: Total - (Subtotal + GST + Shipping - Discount)
              const baseTotal = Number(order.subtotal ?? 0) + Number(order.gst ?? 0) + Number(order.shipping ?? 0) - Number(order.couponDiscount ?? 0);
              const codCharge = Number(order.total ?? 0) - baseTotal;
              const isCod = order.paymentMethod === 'COD' || order.paymentMethod === 'cod' || order.paymentMethod === 'CASH_ON_DELIVERY';
              
              if (isCod && codCharge > 0) {
                return (
                  <div className="flex justify-between text-primary">
                    <span>COD charge</span>
                    <span>+{formatPrice(codCharge, currency)}</span>
                  </div>
                );
              }
              return null;
            })()}
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total (incl. GST)</span>
              <span>{formatPrice(Number(order.total ?? 0), currency)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default OrderDetail;
