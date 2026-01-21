import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Edit, Download, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { orderApi } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

const AdminOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orderId = Number(id);

  const {
    data: order,
    isLoading,
  } = useQuery({
    queryKey: ['adminOrderDetails', orderId],
    queryFn: () => orderApi.getOrderByIdAdmin(orderId),
    enabled: !!orderId,
  });

  const { data: swipeInvoiceCheck } = useQuery({
    queryKey: ['swipeInvoiceCheck', orderId],
    queryFn: () => orderApi.checkSwipeInvoice(orderId),
    enabled: !!orderId,
  });

  const { data: customStatuses = [] } = useQuery({
    queryKey: ['whatsappCustomStatuses'],
    queryFn: () => {
      const { whatsappApi } = require('@/lib/api');
      return whatsappApi.getCustomStatuses();
    },
  });

  const paymentCurrency: string = order?.paymentCurrency || 'INR';
  const paymentAmount: number = useMemo(
    () => Number(order?.paymentAmount ?? order?.total ?? 0),
    [order?.paymentAmount, order?.total]
  );

  const [statusUpdateForm, setStatusUpdateForm] = useState({
    statusType: (order?.customStatus ? 'custom' : 'standard') as 'standard' | 'custom',
    status: order?.status || '',
    customStatus: order?.customStatus || '',
    customMessage: '',
    skipWhatsApp: false,
  });

  const [editAddressForm, setEditAddressForm] = useState<any>(() => {
    const sa = order?.shippingAddress || {};
    const postalCode = sa.postalCode || sa.zipCode || '';
    return {
      firstName: sa.firstName || '',
      lastName: sa.lastName || '',
      email: sa.email || order?.userEmail || '',
      phone: sa.phone || sa.phoneNumber || '',
      address: sa.address || '',
      addressLine2: sa.addressLine2 || sa.address_line2 || '',
      city: sa.city || '',
      state: sa.state || '',
      postalCode,
      country: sa.country || 'IN',
      gstin: sa.gstin || '',
    };
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      customStatus,
      customMessage,
      skipWhatsApp,
    }: {
      id: number;
      status?: string;
      customStatus?: string;
      customMessage?: string;
      skipWhatsApp?: boolean;
    }) => orderApi.updateOrderStatus(id, status || '', customStatus, customMessage, skipWhatsApp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetails', orderId] });
      toast.success('Order status updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order status');
    },
  });

  const retrySwipeMutation = useMutation({
    mutationFn: (id: number) => orderApi.retrySwipeInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetails', orderId] });
      toast.success('Swipe invoice created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create Swipe invoice');
    },
  });

  const updateShippingAddressMutation = useMutation({
    mutationFn: ({ id, shippingAddress }: { id: number; shippingAddress: any }) =>
      orderApi.updateOrderShippingAddressAdmin(id, shippingAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetails', orderId] });
      toast.success('Shipping address updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update shipping address');
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
      CONFIRMED: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
      PROCESSING: { label: 'Processing', className: 'bg-purple-100 text-purple-700' },
      SHIPPED: { label: 'Shipped', className: 'bg-indigo-100 text-indigo-700' },
      DELIVERED: { label: 'Delivered', className: 'bg-green-100 text-green-700' },
      CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pending', className: 'bg-gray-100 text-gray-700' },
      PAID: { label: 'Paid', className: 'bg-green-100 text-green-700' },
      FAILED: { label: 'Failed', className: 'bg-red-100 text-red-700' },
      REFUNDED: { label: 'Refunded', className: 'bg-orange-100 text-orange-700' },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleSaveStatusUpdate = () => {
    if (!order) return;
    if (statusUpdateForm.statusType === 'custom' && !statusUpdateForm.customStatus) {
      toast.error('Please select a custom status');
      return;
    }
    if (statusUpdateForm.statusType === 'standard' && !statusUpdateForm.status) {
      toast.error('Please select a status');
      return;
    }

    updateStatusMutation.mutate({
      id: orderId,
      status: statusUpdateForm.statusType === 'standard' ? statusUpdateForm.status : undefined,
      customStatus: statusUpdateForm.statusType === 'custom' ? statusUpdateForm.customStatus : undefined,
      customMessage: statusUpdateForm.customMessage || undefined,
      skipWhatsApp: statusUpdateForm.skipWhatsApp,
    });
  };

  const handleRetrySwipe = () => {
    retrySwipeMutation.mutate(orderId);
  };

  const shippingAddress = order?.shippingAddress || {};
  const displayPostalCode = shippingAddress.postalCode || shippingAddress.zipCode || '';
  const displayPhone = shippingAddress.phone || shippingAddress.phoneNumber || '';
  const displayEmail = shippingAddress.email || order?.userEmail || '';
  const displayName =
    `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || order?.userName || '';
  const displayAddressLine2 = shippingAddress.addressLine2 || shippingAddress.address_line2 || '';

  const renderCustomValue = (value: any) => {
    if (value == null) return '—';
    if (typeof value === 'string') {
      const isUrl = /^https?:\/\//i.test(value);
      const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(value);
      if (isUrl && isImage) {
        return (
          <a href={value} target="_blank" rel="noreferrer" className="inline-block">
            <img src={value} alt="Custom upload" className="w-16 h-16 object-cover rounded border" />
          </a>
        );
      }
      if (isUrl) {
        return (
          <a href={value} target="_blank" rel="noreferrer" className="text-primary underline break-all">
            {value}
          </a>
        );
      }
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return JSON.stringify(value);
  };

  if (!orderId || Number.isNaN(orderId)) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-red-500">Invalid order ID</p>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading || !order) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between gap-4 flex-wrap"
        >
          <div>
            <button
              className="inline-flex items-center text-sm text-muted-foreground mb-2"
              onClick={() => navigate('/admin-sara/orders')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Orders
            </button>
            <h1 className="font-semibold text-3xl lg:text-4xl mb-1">
              Order <span className="text-primary">#{order.orderNumber}</span>
            </h1>
            <p className="text-muted-foreground">
              Placed on{' '}
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'N/A'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                {getStatusBadge(order.status)}
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Payment</div>
                {getPaymentStatusBadge(order.paymentStatus)}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground text-xs">Gateway Amount</div>
              <div className="font-semibold">{formatPrice(paymentAmount, paymentCurrency)}</div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Address */}
            <section className="bg-white border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Customer & Shipping</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sa = order.shippingAddress || {};
                    const postalCode = sa.postalCode || sa.zipCode || '';
                    setEditAddressForm({
                      firstName: sa.firstName || '',
                      lastName: sa.lastName || '',
                      email: sa.email || order.userEmail || '',
                      phone: sa.phone || sa.phoneNumber || '',
                      address: sa.address || '',
                      addressLine2: sa.addressLine2 || sa.address_line2 || '',
                      city: sa.city || '',
                      state: sa.state || '',
                      postalCode,
                      country: sa.country || 'IN',
                      gstin: sa.gstin || '',
                    });
                  }}
                  disabled={updateShippingAddressMutation.isPending}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update Address
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Customer</div>
                  <div className="font-medium">{displayName || 'N/A'}</div>
                  <div className="text-muted-foreground break-all">{order.userEmail}</div>
                  <div className="text-muted-foreground">{displayPhone || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Shipping Address</div>
                  <div>{shippingAddress.address}</div>
                  {displayAddressLine2 && <div>{displayAddressLine2}</div>}
                  <div>
                    {shippingAddress.city && `${shippingAddress.city}, `}
                    {shippingAddress.state && `${shippingAddress.state} `}
                    {displayPostalCode && `- ${displayPostalCode}`}
                  </div>
                  {shippingAddress.country && (
                    <div>
                      <span className="font-medium">Country:</span> {shippingAddress.country}
                    </div>
                  )}
                  {shippingAddress.gstin && (
                    <div>
                      <span className="font-medium">GSTIN:</span> {shippingAddress.gstin}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 grid md:grid-cols-2 gap-3">
                <Input
                  placeholder="First Name *"
                  value={editAddressForm.firstName}
                  onChange={(e) => setEditAddressForm((p: any) => ({ ...p, firstName: e.target.value }))}
                />
                <Input
                  placeholder="Last Name *"
                  value={editAddressForm.lastName}
                  onChange={(e) => setEditAddressForm((p: any) => ({ ...p, lastName: e.target.value }))}
                />
                <Input
                  placeholder="Phone *"
                  value={editAddressForm.phone}
                  onChange={(e) => setEditAddressForm((p: any) => ({ ...p, phone: e.target.value }))}
                />
                <Input
                  placeholder="Email"
                  value={editAddressForm.email}
                  onChange={(e) => setEditAddressForm((p: any) => ({ ...p, email: e.target.value }))}
                />
                <Input
                  placeholder="Address Line 1 *"
                  value={editAddressForm.address}
                  onChange={(e) => setEditAddressForm((p: any) => ({ ...p, address: e.target.value }))}
                  className="md:col-span-2"
                />
                <Input
                  placeholder="Address Line 2"
                  value={editAddressForm.addressLine2}
                  onChange={(e) => setEditAddressForm((p: any) => ({ ...p, addressLine2: e.target.value }))}
                  className="md:col-span-2"
                />
                <Input
                  placeholder="City *"
                  value={editAddressForm.city}
                  onChange={(e) => setEditAddressForm((p: any) => ({ ...p, city: e.target.value }))}
                />
                <Input
                  placeholder="State *"
                  value={editAddressForm.state}
                  onChange={(e) => setEditAddressForm((p: any) => ({ ...p, state: e.target.value }))}
                />
                <Input
                  placeholder="Postal Code *"
                  value={editAddressForm.postalCode}
                  onChange={(e) => setEditAddressForm((p: any) => ({ ...p, postalCode: e.target.value }))}
                />
                <Input
                  placeholder="Country *"
                  value={editAddressForm.country}
                  onChange={(e) => setEditAddressForm((p: any) => ({ ...p, country: e.target.value }))}
                />
                <Input
                  placeholder="GSTIN (optional)"
                  value={editAddressForm.gstin}
                  onChange={(e) =>
                    setEditAddressForm((p: any) => ({ ...p, gstin: e.target.value.toUpperCase() }))
                  }
                  className="md:col-span-2"
                />
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!editAddressForm.phone || !editAddressForm.address || !editAddressForm.city ||
                      !editAddressForm.state || !editAddressForm.postalCode) {
                      toast.error('Please fill all required fields');
                      return;
                    }
                    updateShippingAddressMutation.mutate({
                      id: orderId,
                      shippingAddress: {
                        firstName: editAddressForm.firstName,
                        lastName: editAddressForm.lastName,
                        email: editAddressForm.email,
                        phone: editAddressForm.phone,
                        address: editAddressForm.address,
                        addressLine2: editAddressForm.addressLine2 || '',
                        city: editAddressForm.city,
                        state: editAddressForm.state,
                        postalCode: editAddressForm.postalCode,
                        country: editAddressForm.country,
                        gstin: editAddressForm.gstin || undefined,
                      },
                    });
                  }}
                  disabled={updateShippingAddressMutation.isPending}
                >
                  {updateShippingAddressMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Address'
                  )}
                </Button>
              </div>
            </section>

            {/* Order Items with customization */}
            <section className="bg-white border border-border rounded-xl p-4 space-y-4">
              <h2 className="font-semibold text-lg">Order Items</h2>
              <div className="space-y-3">
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between gap-2">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Type: {item.productType || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            IDs: P#{item.productId || '—'}
                            {item.designId && ` · D#${item.designId}`}
                            {item.fabricId && ` · F#${item.fabricId}`}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-muted-foreground">
                            Qty: {item.quantity} × {formatPrice(Number(item.price || 0), paymentCurrency)}
                          </div>
                          <div className="font-semibold">
                            {formatPrice(Number(item.totalPrice || 0), paymentCurrency)}
                          </div>
                        </div>
                      </div>

                      {item.variants && Object.keys(item.variants).length > 0 && (
                        <div className="mt-1">
                          <div className="text-xs font-semibold mb-1">Variants</div>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(item.variants).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-[10px]">
                                {key}: {String(value)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.customData && Object.keys(item.customData).length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-semibold">Custom Fields</div>
                          <div className="space-y-1">
                            {Object.entries(item.customData).map(([key, value]) => (
                              <div key={key} className="flex flex-col text-xs">
                                <span className="font-medium">{key}</span>
                                <span className="text-muted-foreground">{renderCustomValue(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column: payment & status */}
          <div className="space-y-6">
            {/* Payment summary */}
            <section className="bg-white border border-border rounded-xl p-4 space-y-3">
              <h2 className="font-semibold text-lg">Payment Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Gateway Amount</span>
                  <span className="font-semibold">
                    {formatPrice(paymentAmount, paymentCurrency)}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-dashed space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal (INR)</span>
                  <span>{formatPrice(Number(order.subtotal || 0), 'INR')}</span>
                </div>
                {order.gst && Number(order.gst) > 0 && (
                  <div className="flex justify-between">
                    <span>GST (INR)</span>
                    <span>{formatPrice(Number(order.gst), 'INR')}</span>
                  </div>
                )}
                {order.shipping && Number(order.shipping) > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping (INR)</span>
                    <span>{formatPrice(Number(order.shipping), 'INR')}</span>
                  </div>
                )}
                {order.couponDiscount && Number(order.couponDiscount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount (INR){order.couponCode ? ` (${order.couponCode})` : ''}</span>
                    <span>-{formatPrice(Number(order.couponDiscount), 'INR')}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total (INR)</span>
                  <span>{formatPrice(Number(order.total || 0), 'INR')}</span>
                </div>
              </div>
            </section>

            {/* Status update */}
            <section className="bg-white border border-border rounded-xl p-4 space-y-4">
              <h2 className="font-semibold text-lg">Update Status</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Type</label>
                <Select
                  value={statusUpdateForm.statusType}
                  onValueChange={(value) =>
                    setStatusUpdateForm((prev) => ({ ...prev, statusType: value as 'standard' | 'custom' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Status</SelectItem>
                    <SelectItem value="custom">Custom Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {statusUpdateForm.statusType === 'standard' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={statusUpdateForm.status}
                    onValueChange={(value) =>
                      setStatusUpdateForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="SHIPPED">Shipped</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Status</label>
                  <Select
                    value={statusUpdateForm.customStatus}
                    onValueChange={(value) =>
                      setStatusUpdateForm((prev) => ({ ...prev, customStatus: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select custom status" />
                    </SelectTrigger>
                    <SelectContent>
                      {customStatuses.map((status: any) => (
                        <SelectItem key={status.id} value={status.statusName}>
                          {status.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Message (Optional)</label>
                <Textarea
                  value={statusUpdateForm.customMessage}
                  onChange={(e) =>
                    setStatusUpdateForm((prev) => ({ ...prev, customMessage: e.target.value }))
                  }
                  placeholder="Enter custom WhatsApp message. Leave empty to use template."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {'{{name}}'}, {'{{order_id}}'}, {'{{amount}}'}, {'{{status}}'},
                  {' {{custom_status}}'}, {' {{custom_message}}'}
                </p>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <Checkbox
                  id="skipWhatsApp"
                  checked={statusUpdateForm.skipWhatsApp}
                  onCheckedChange={(checked) =>
                    setStatusUpdateForm((prev) => ({ ...prev, skipWhatsApp: !!checked }))
                  }
                />
                <label htmlFor="skipWhatsApp" className="text-sm font-medium cursor-pointer">
                  Skip WhatsApp Notification
                </label>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveStatusUpdate}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </section>

            {/* Swipe Invoice */}
            <section className="bg-white border border-border rounded-xl p-4 space-y-3">
              <h2 className="font-semibold text-lg">Swipe Invoice</h2>
              {(order.swipeInvoiceNumber ||
                order.swipeInvoiceId ||
                (swipeInvoiceCheck?.invoiceExists && swipeInvoiceCheck.invoiceStatus === 'CREATED')) ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-green-800">Invoice Created</span>
                    {order.swipeInvoiceUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(order.swipeInvoiceUrl, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                  {order.swipeInvoiceNumber && (
                    <div>Invoice #: {order.swipeInvoiceNumber}</div>
                  )}
                  {order.swipeInvoiceId && <div>Hash ID: {order.swipeInvoiceId}</div>}
                  {order.swipeIrn && <div>IRN: {order.swipeIrn}</div>}
                </div>
              ) : order.status === 'CONFIRMED' ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3 text-sm">
                  <div>Swipe invoice not created automatically. You can retry creating it.</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetrySwipe}
                    disabled={retrySwipeMutation.isPending}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${
                        retrySwipeMutation.isPending ? 'animate-spin' : ''
                      }`}
                    />
                    Retry Invoice
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Invoice will be available after the order is confirmed.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderDetail;

