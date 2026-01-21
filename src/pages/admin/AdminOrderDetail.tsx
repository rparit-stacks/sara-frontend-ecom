import { useMemo, useState, useEffect } from 'react';
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

  const { data: paymentHistory = [] } = useQuery({
    queryKey: ['paymentHistory', orderId],
    queryFn: () => orderApi.getPaymentHistory(orderId),
    enabled: !!orderId,
  });

  const { data: auditLog = [] } = useQuery({
    queryKey: ['auditLog', orderId],
    queryFn: () => orderApi.getAuditLog(orderId),
    enabled: !!orderId,
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

  const [editBillingAddressForm, setEditBillingAddressForm] = useState<any>(() => {
    const ba = order?.billingAddress || {};
    const postalCode = ba.postalCode || ba.zipCode || '';
    return {
      firstName: ba.firstName || '',
      lastName: ba.lastName || '',
      email: ba.email || order?.userEmail || '',
      phone: ba.phone || ba.phoneNumber || '',
      address: ba.address || '',
      addressLine2: ba.addressLine2 || ba.address_line2 || '',
      city: ba.city || '',
      state: ba.state || '',
      postalCode,
      country: ba.country || 'IN',
      gstin: ba.gstin || '',
    };
  });

  const [editNotesForm, setEditNotesForm] = useState<string>('');
  const [editPaymentForm, setEditPaymentForm] = useState({
    paymentStatus: 'PENDING',
    paymentId: '',
    paymentAmount: 0,
  });
  const [editCancellationForm, setEditCancellationForm] = useState({
    cancellationReason: '',
    cancelledBy: '',
  });
  const [editRefundForm, setEditRefundForm] = useState({
    refundAmount: 0,
    refundDate: '',
    refundTransactionId: '',
    refundReason: '',
  });
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editItemForm, setEditItemForm] = useState<{ quantity: number; price: number; name: string } | null>(null);
  const [editPricingForm, setEditPricingForm] = useState({
    subtotal: 0,
    gst: 0,
    shipping: 0,
    total: 0,
  });

  // Update forms when order data changes
  useEffect(() => {
    if (order) {
      setEditNotesForm(order.notes || '');
      setEditPaymentForm({
        paymentStatus: order.paymentStatus || 'PENDING',
        paymentId: order.paymentId || '',
        paymentAmount: order.paymentAmount ? Number(order.paymentAmount) : order.total ? Number(order.total) : 0,
      });
      setEditCancellationForm({
        cancellationReason: order.cancellationReason || '',
        cancelledBy: order.cancelledBy || '',
      });
      setEditRefundForm({
        refundAmount: order.refundAmount ? Number(order.refundAmount) : 0,
        refundDate: order.refundDate ? new Date(order.refundDate).toISOString().split('T')[0] : '',
        refundTransactionId: order.refundTransactionId || '',
        refundReason: order.refundReason || '',
      });
      setEditPricingForm({
        subtotal: order.subtotal ? Number(order.subtotal) : 0,
        gst: order.gst ? Number(order.gst) : 0,
        shipping: order.shipping ? Number(order.shipping) : 0,
        total: order.total ? Number(order.total) : 0,
      });
      const ba = order.billingAddress || {};
      const billingPostalCode = ba.postalCode || ba.zipCode || '';
      setEditBillingAddressForm({
        firstName: ba.firstName || '',
        lastName: ba.lastName || '',
        email: ba.email || order.userEmail || '',
        phone: ba.phone || ba.phoneNumber || '',
        address: ba.address || '',
        addressLine2: ba.addressLine2 || ba.address_line2 || '',
        city: ba.city || '',
        state: ba.state || '',
        postalCode: billingPostalCode,
        country: ba.country || 'IN',
        gstin: ba.gstin || '',
      });
    }
  }, [order]);

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

  const updateBillingAddressMutation = useMutation({
    mutationFn: ({ id, billingAddress }: { id: number; billingAddress: any }) =>
      orderApi.updateOrderBillingAddressAdmin(id, billingAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetails', orderId] });
      toast.success('Billing address updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update billing address');
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      orderApi.updateOrderNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetails', orderId] });
      toast.success('Notes updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update notes');
    },
  });

  const updateCancellationMutation = useMutation({
    mutationFn: ({ id, cancellationReason, cancelledBy }: { 
      id: number; 
      cancellationReason: string; 
      cancelledBy: string;
    }) => orderApi.updateCancellationInfo(id, cancellationReason, cancelledBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetails', orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      toast.success('Cancellation information updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update cancellation information');
    },
  });

  const updateRefundMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      orderApi.updateRefundInfo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetails', orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      toast.success('Refund information updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update refund information');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ orderId, itemId, data }: { orderId: number; itemId: number; data: any }) =>
      orderApi.updateOrderItem(orderId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetails', orderId] });
      setEditingItemId(null);
      setEditItemForm(null);
      toast.success('Order item updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order item');
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      orderApi.updateOrderPricing(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetails', orderId] });
      toast.success('Pricing updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update pricing');
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: (id: number) => orderApi.recalculateOrderTotals(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetails', orderId] });
      toast.success('Order totals recalculated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to recalculate totals');
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, paymentStatus, paymentId, paymentAmount }: { 
      id: number; 
      paymentStatus: string; 
      paymentId?: string;
      paymentAmount?: number;
    }) => orderApi.updatePaymentStatus(id, paymentStatus, paymentId, paymentAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetails', orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      toast.success('Payment information updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payment information');
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
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <> · Updated {new Date(order.updatedAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</>
              )}
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
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Order Items</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    recalculateMutation.mutate(orderId);
                  }}
                  disabled={recalculateMutation.isPending}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
                  Recalculate Totals
                </Button>
              </div>
              <div className="space-y-3">
                {order.items?.map((item: any, index: number) => (
                  <div key={item.id || index} className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1">
                          {editingItemId === item.id ? (
                            <div className="space-y-2">
                              <Input
                                value={editItemForm?.name || ''}
                                onChange={(e) =>
                                  setEditItemForm((prev) => (prev ? { ...prev, name: e.target.value } : null))
                                }
                                placeholder="Product Name"
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  value={editItemForm?.quantity || ''}
                                  onChange={(e) =>
                                    setEditItemForm((prev) =>
                                      prev ? { ...prev, quantity: Number(e.target.value) } : null
                                    )
                                  }
                                  placeholder="Qty"
                                  className="w-20 text-sm"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editItemForm?.price || ''}
                                  onChange={(e) =>
                                    setEditItemForm((prev) =>
                                      prev ? { ...prev, price: Number(e.target.value) } : null
                                    )
                                  }
                                  placeholder="Price"
                                  className="w-32 text-sm"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (editItemForm) {
                                      updateItemMutation.mutate({
                                        orderId,
                                        itemId: item.id,
                                        data: {
                                          quantity: editItemForm.quantity,
                                          price: editItemForm.price,
                                          name: editItemForm.name,
                                        },
                                      });
                                    }
                                  }}
                                  disabled={updateItemMutation.isPending}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingItemId(null);
                                    setEditItemForm(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Type: {item.productType || 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                IDs: P#{item.productId || '—'}
                                {item.designId && ` · D#${item.designId}`}
                                {item.fabricId && ` · F#${item.fabricId}`}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          {editingItemId !== item.id && (
                            <>
                              <div className="text-muted-foreground">
                                Qty: {item.quantity} × {formatPrice(Number(item.price || 0), paymentCurrency)}
                              </div>
                              <div className="font-semibold">
                                {formatPrice(Number(item.totalPrice || 0), paymentCurrency)}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  setEditingItemId(item.id);
                                  setEditItemForm({
                                    quantity: item.quantity || 1,
                                    price: Number(item.price || 0),
                                    name: item.name || '',
                                  });
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </>
                          )}
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

                      {item.productType === 'DIGITAL' && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-semibold">Digital Product</div>
                          {item.digitalDownloadUrl && (
                            <div className="text-xs">
                              <a
                                href={item.digitalDownloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline"
                              >
                                Download ZIP
                              </a>
                            </div>
                          )}
                          {item.zipPassword && (
                            <div className="text-xs text-muted-foreground">
                              ZIP Password: <span className="font-mono">{item.zipPassword}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Billing Address */}
            <section className="bg-white border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Billing Address</h2>
                {order.billingAddress && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const ba = order.billingAddress || {};
                      const postalCode = ba.postalCode || ba.zipCode || '';
                      setEditBillingAddressForm({
                        firstName: ba.firstName || '',
                        lastName: ba.lastName || '',
                        email: ba.email || order.userEmail || '',
                        phone: ba.phone || ba.phoneNumber || '',
                        address: ba.address || '',
                        addressLine2: ba.addressLine2 || ba.address_line2 || '',
                        city: ba.city || '',
                        state: ba.state || '',
                        postalCode,
                        country: ba.country || 'IN',
                        gstin: ba.gstin || '',
                      });
                    }}
                    disabled={updateBillingAddressMutation.isPending}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {order.billingAddress ? 'Update Address' : 'Add Address'}
                  </Button>
                )}
              </div>
              {order.billingAddress ? (
                <div className="text-sm space-y-1">
                  {(() => {
                    const ba = order.billingAddress || {};
                    const billingName = `${ba.firstName || ''} ${ba.lastName || ''}`.trim();
                    return (
                      <>
                        {billingName && <div className="font-medium">{billingName}</div>}
                        {ba.address && <div>{ba.address}</div>}
                        {(ba.addressLine2 || ba.address_line2) && (
                          <div>{ba.addressLine2 || ba.address_line2}</div>
                        )}
                        <div>
                          {ba.city && `${ba.city}, `}
                          {ba.state && `${ba.state} `}
                          {(ba.postalCode || ba.zipCode) && `- ${ba.postalCode || ba.zipCode}`}
                        </div>
                        {ba.country && (
                          <div>
                            <span className="font-medium">Country:</span> {ba.country}
                          </div>
                        )}
                        {(ba.phone || ba.phoneNumber) && (
                          <div>
                            <span className="font-medium">Phone:</span> {ba.phone || ba.phoneNumber}
                          </div>
                        )}
                        {ba.email && (
                          <div>
                            <span className="font-medium">Email:</span> {ba.email}
                          </div>
                        )}
                        {ba.gstin && (
                          <div>
                            <span className="font-medium">GSTIN:</span> {ba.gstin}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">No billing address set</div>
              )}
              <div className="mt-4 grid md:grid-cols-2 gap-3">
                <Input
                  placeholder="First Name *"
                  value={editBillingAddressForm.firstName}
                  onChange={(e) => setEditBillingAddressForm((p: any) => ({ ...p, firstName: e.target.value }))}
                />
                <Input
                  placeholder="Last Name *"
                  value={editBillingAddressForm.lastName}
                  onChange={(e) => setEditBillingAddressForm((p: any) => ({ ...p, lastName: e.target.value }))}
                />
                <Input
                  placeholder="Phone *"
                  value={editBillingAddressForm.phone}
                  onChange={(e) => setEditBillingAddressForm((p: any) => ({ ...p, phone: e.target.value }))}
                />
                <Input
                  placeholder="Email"
                  value={editBillingAddressForm.email}
                  onChange={(e) => setEditBillingAddressForm((p: any) => ({ ...p, email: e.target.value }))}
                />
                <Input
                  placeholder="Address Line 1 *"
                  value={editBillingAddressForm.address}
                  onChange={(e) => setEditBillingAddressForm((p: any) => ({ ...p, address: e.target.value }))}
                  className="md:col-span-2"
                />
                <Input
                  placeholder="Address Line 2"
                  value={editBillingAddressForm.addressLine2}
                  onChange={(e) => setEditBillingAddressForm((p: any) => ({ ...p, addressLine2: e.target.value }))}
                  className="md:col-span-2"
                />
                <Input
                  placeholder="City *"
                  value={editBillingAddressForm.city}
                  onChange={(e) => setEditBillingAddressForm((p: any) => ({ ...p, city: e.target.value }))}
                />
                <Input
                  placeholder="State *"
                  value={editBillingAddressForm.state}
                  onChange={(e) => setEditBillingAddressForm((p: any) => ({ ...p, state: e.target.value }))}
                />
                <Input
                  placeholder="Postal Code *"
                  value={editBillingAddressForm.postalCode}
                  onChange={(e) => setEditBillingAddressForm((p: any) => ({ ...p, postalCode: e.target.value }))}
                />
                <Input
                  placeholder="Country *"
                  value={editBillingAddressForm.country}
                  onChange={(e) => setEditBillingAddressForm((p: any) => ({ ...p, country: e.target.value }))}
                />
                <Input
                  placeholder="GSTIN (optional)"
                  value={editBillingAddressForm.gstin}
                  onChange={(e) =>
                    setEditBillingAddressForm((p: any) => ({ ...p, gstin: e.target.value.toUpperCase() }))
                  }
                  className="md:col-span-2"
                />
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!editBillingAddressForm.phone || !editBillingAddressForm.address || !editBillingAddressForm.city ||
                      !editBillingAddressForm.state || !editBillingAddressForm.postalCode) {
                      toast.error('Please fill all required fields');
                      return;
                    }
                    updateBillingAddressMutation.mutate({
                      id: orderId,
                      billingAddress: {
                        firstName: editBillingAddressForm.firstName,
                        lastName: editBillingAddressForm.lastName,
                        email: editBillingAddressForm.email,
                        phone: editBillingAddressForm.phone,
                        address: editBillingAddressForm.address,
                        addressLine2: editBillingAddressForm.addressLine2 || '',
                        city: editBillingAddressForm.city,
                        state: editBillingAddressForm.state,
                        postalCode: editBillingAddressForm.postalCode,
                        country: editBillingAddressForm.country,
                        gstin: editBillingAddressForm.gstin || undefined,
                      },
                    });
                  }}
                  disabled={updateBillingAddressMutation.isPending}
                >
                  {updateBillingAddressMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Billing Address'
                  )}
                </Button>
              </div>
            </section>

            {/* Order Notes */}
            <section className="bg-white border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Order Notes</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditNotesForm(order.notes || '');
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
              <div className="space-y-2">
                <Textarea
                  value={editNotesForm}
                  onChange={(e) => setEditNotesForm(e.target.value)}
                  placeholder="Add internal notes about this order..."
                  rows={4}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    updateNotesMutation.mutate({
                      id: orderId,
                      notes: editNotesForm,
                    });
                  }}
                  disabled={updateNotesMutation.isPending}
                  className="w-full"
                >
                  {updateNotesMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Notes'
                  )}
                </Button>
              </div>
            </section>
          </div>

          {/* Right column: payment & status */}
          <div className="space-y-6">
            {/* Payment summary */}
            <section className="bg-white border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Payment Summary</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditPaymentForm({
                      paymentStatus: order.paymentStatus || 'PENDING',
                      paymentId: order.paymentId || '',
                      paymentAmount: order.paymentAmount ? Number(order.paymentAmount) : order.total ? Number(order.total) : 0,
                    });
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="font-medium">{order.paymentMethod || 'N/A'}</span>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Payment Status</label>
                    <Select
                      value={editPaymentForm.paymentStatus}
                      onValueChange={(value) =>
                        setEditPaymentForm((prev) => ({ ...prev, paymentStatus: value }))
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="REFUNDED">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Transaction ID</label>
                    <Input
                      value={editPaymentForm.paymentId}
                      onChange={(e) =>
                        setEditPaymentForm((prev) => ({ ...prev, paymentId: e.target.value }))
                      }
                      placeholder="Transaction ID"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Payment Amount ({paymentCurrency})</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editPaymentForm.paymentAmount}
                      onChange={(e) =>
                        setEditPaymentForm((prev) => ({ ...prev, paymentAmount: Number(e.target.value) }))
                      }
                      placeholder="0.00"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      updatePaymentMutation.mutate({
                        id: orderId,
                        paymentStatus: editPaymentForm.paymentStatus,
                        paymentId: editPaymentForm.paymentId || undefined,
                        paymentAmount: editPaymentForm.paymentAmount || undefined,
                      });
                    }}
                    disabled={updatePaymentMutation.isPending}
                    className="w-full"
                  >
                    {updatePaymentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Payment Info'
                    )}
                  </Button>
                </div>
                {order.paymentId && (
                  <div className="flex justify-between pt-2 border-t">
                    <span>Current Transaction ID</span>
                    <span className="font-mono text-xs">{order.paymentId}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span>Current Gateway Amount</span>
                  <span className="font-semibold">
                    {formatPrice(paymentAmount, paymentCurrency)}
                  </span>
                </div>
                {order.paymentMethod === 'PARTIAL_COD' && (
                  <div className="pt-2 border-t border-dashed space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Advance Paid</span>
                      <span className="font-medium text-green-600">
                        {formatPrice(paymentAmount, paymentCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Remaining</span>
                      <span className="font-medium text-orange-600">
                        {formatPrice(Number(order.total || 0) - paymentAmount, 'INR')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-dashed space-y-2 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Subtotal (INR)</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editPricingForm.subtotal}
                        onChange={(e) =>
                          setEditPricingForm((prev) => ({ ...prev, subtotal: Number(e.target.value) }))
                        }
                        className="w-24 h-6 text-xs"
                      />
                      <span className="text-xs">({formatPrice(Number(order.subtotal || 0), 'INR')})</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>GST (INR)</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editPricingForm.gst}
                        onChange={(e) =>
                          setEditPricingForm((prev) => ({ ...prev, gst: Number(e.target.value) }))
                        }
                        className="w-24 h-6 text-xs"
                      />
                      <span className="text-xs">({formatPrice(Number(order.gst || 0), 'INR')})</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping (INR)</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editPricingForm.shipping}
                        onChange={(e) =>
                          setEditPricingForm((prev) => ({ ...prev, shipping: Number(e.target.value) }))
                        }
                        className="w-24 h-6 text-xs"
                      />
                      <span className="text-xs">({formatPrice(Number(order.shipping || 0), 'INR')})</span>
                    </div>
                  </div>
                  {order.couponDiscount && Number(order.couponDiscount) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount (INR){order.couponCode ? ` (${order.couponCode})` : ''}</span>
                      <span>-{formatPrice(Number(order.couponDiscount), 'INR')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-semibold pt-2 border-t">
                    <span>Total (INR)</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editPricingForm.total}
                        onChange={(e) =>
                          setEditPricingForm((prev) => ({ ...prev, total: Number(e.target.value) }))
                        }
                        className="w-24 h-6 text-xs font-semibold"
                      />
                      <span className="text-xs">({formatPrice(Number(order.total || 0), 'INR')})</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      // Auto-calculate total if not manually set
                      const calculatedTotal =
                        editPricingForm.subtotal +
                        editPricingForm.gst +
                        editPricingForm.shipping -
                        (order.couponDiscount ? Number(order.couponDiscount) : 0);
                      
                      updatePricingMutation.mutate({
                        id: orderId,
                        data: {
                          subtotal: editPricingForm.subtotal,
                          gst: editPricingForm.gst,
                          shipping: editPricingForm.shipping,
                          total: editPricingForm.total || calculatedTotal,
                        },
                      });
                    }}
                    disabled={updatePricingMutation.isPending}
                    className="w-full mt-2"
                  >
                    {updatePricingMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Pricing'
                    )}
                  </Button>
                </div>
              </div>
            </section>

            {/* Payment History */}
            {(order.paymentMethod === 'PARTIAL_COD' || paymentHistory.length > 0) && (
              <section className="bg-white border border-border rounded-xl p-4 space-y-4">
                <h2 className="font-semibold text-lg">Payment History</h2>
                {paymentHistory.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {paymentHistory.map((entry: any) => (
                      <div key={entry.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{entry.paymentType}</div>
                            <div className="text-xs text-muted-foreground">
                              {entry.paidAt
                                ? new Date(entry.paidAt).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'N/A'}
                            </div>
                            {entry.transactionId && (
                              <div className="text-xs font-mono text-muted-foreground mt-1">
                                TXN: {entry.transactionId}
                              </div>
                            )}
                            {entry.notes && (
                              <div className="text-xs text-muted-foreground mt-1">{entry.notes}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatPrice(Number(entry.amount || 0), entry.currency || 'INR')}
                            </div>
                            {entry.paymentMethod && (
                              <div className="text-xs text-muted-foreground">{entry.paymentMethod}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">No payment history recorded</div>
                )}
              </section>
            )}

            {/* Cancellation Info - Show when status is CANCELLED */}
            {order.status === 'CANCELLED' && (
              <section className="bg-white border border-border rounded-xl p-4 space-y-4">
                <h2 className="font-semibold text-lg">Cancellation Information</h2>
                <div className="space-y-3 text-sm">
                  {order.cancelledAt && (
                    <div>
                      <span className="text-muted-foreground">Cancelled At:</span>{' '}
                      <span className="font-medium">
                        {new Date(order.cancelledAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Cancellation Reason</label>
                    <Textarea
                      value={editCancellationForm.cancellationReason}
                      onChange={(e) =>
                        setEditCancellationForm((prev) => ({ ...prev, cancellationReason: e.target.value }))
                      }
                      placeholder="Enter reason for cancellation..."
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Cancelled By</label>
                    <Input
                      value={editCancellationForm.cancelledBy}
                      onChange={(e) =>
                        setEditCancellationForm((prev) => ({ ...prev, cancelledBy: e.target.value }))
                      }
                      placeholder="Admin email or 'Customer'"
                      className="text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      updateCancellationMutation.mutate({
                        id: orderId,
                        cancellationReason: editCancellationForm.cancellationReason,
                        cancelledBy: editCancellationForm.cancelledBy,
                      });
                    }}
                    disabled={updateCancellationMutation.isPending}
                    className="w-full"
                  >
                    {updateCancellationMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Cancellation Info'
                    )}
                  </Button>
                </div>
              </section>
            )}

            {/* Refund Info - Show when payment status is REFUNDED or refund amount exists */}
            {(order.paymentStatus === 'REFUNDED' || order.refundAmount) && (
              <section className="bg-white border border-border rounded-xl p-4 space-y-4">
                <h2 className="font-semibold text-lg">Refund Information</h2>
                <div className="space-y-3 text-sm">
                  {order.refundDate && (
                    <div>
                      <span className="text-muted-foreground">Refund Date:</span>{' '}
                      <span className="font-medium">
                        {new Date(order.refundDate).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Refund Amount (INR)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editRefundForm.refundAmount}
                      onChange={(e) =>
                        setEditRefundForm((prev) => ({ ...prev, refundAmount: Number(e.target.value) }))
                      }
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Refund Date</label>
                    <Input
                      type="date"
                      value={editRefundForm.refundDate}
                      onChange={(e) =>
                        setEditRefundForm((prev) => ({ ...prev, refundDate: e.target.value }))
                      }
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Refund Transaction ID</label>
                    <Input
                      value={editRefundForm.refundTransactionId}
                      onChange={(e) =>
                        setEditRefundForm((prev) => ({ ...prev, refundTransactionId: e.target.value }))
                      }
                      placeholder="Transaction ID"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Refund Reason</label>
                    <Textarea
                      value={editRefundForm.refundReason}
                      onChange={(e) =>
                        setEditRefundForm((prev) => ({ ...prev, refundReason: e.target.value }))
                      }
                      placeholder="Enter reason for refund..."
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      updateRefundMutation.mutate({
                        id: orderId,
                        data: {
                          refundAmount: editRefundForm.refundAmount || undefined,
                          refundDate: editRefundForm.refundDate || undefined,
                          refundTransactionId: editRefundForm.refundTransactionId || undefined,
                          refundReason: editRefundForm.refundReason || undefined,
                        },
                      });
                    }}
                    disabled={updateRefundMutation.isPending}
                    className="w-full"
                  >
                    {updateRefundMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Refund Info'
                    )}
                  </Button>
                </div>
              </section>
            )}

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

            {/* Audit Log */}
            <section className="bg-white border border-border rounded-xl p-4 space-y-4">
              <h2 className="font-semibold text-lg">Change History</h2>
              {auditLog.length > 0 ? (
                <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
                  {auditLog.map((log: any) => (
                    <div key={log.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{log.changeType.replace(/_/g, ' ')}</div>
                          {log.fieldName && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Field: {log.fieldName}
                            </div>
                          )}
                          {log.oldValue && log.newValue && (
                            <div className="text-xs mt-1">
                              <span className="line-through text-red-600">{log.oldValue}</span>
                              {' → '}
                              <span className="text-green-600 font-medium">{log.newValue}</span>
                            </div>
                          )}
                          {log.changeReason && (
                            <div className="text-xs text-muted-foreground mt-1">{log.changeReason}</div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            By: {log.changedBy}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">No changes recorded</div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderDetail;

