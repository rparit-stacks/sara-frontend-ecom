import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Eye, Loader2, CheckCircle2, XCircle, Package, Truck, Download, RefreshCw, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { orderApi } from '@/lib/api';

const AdminOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditAddressDialogOpen, setIsEditAddressDialogOpen] = useState(false);
  const [editAddressForm, setEditAddressForm] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    gstin: '',
  });
  
  const queryClient = useQueryClient();
  
  // Fetch orders
  const { data: orders = [], isLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['adminOrders', statusFilter],
    queryFn: () => orderApi.getAllOrders(statusFilter === 'all' ? undefined : statusFilter),
  });
  
  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, skipWhatsApp }: { id: number; status: string; skipWhatsApp?: boolean }) => 
      orderApi.updateOrderStatus(id, status, skipWhatsApp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      toast.success('Order status updated successfully!');
      setIsDetailDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order status');
    },
  });
  
  // Retry Swipe invoice mutation
  const retrySwipeMutation = useMutation({
    mutationFn: (id: number) => orderApi.retrySwipeInvoice(id),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrderDetails'] });
      toast.success('Swipe invoice created successfully!');
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create Swipe invoice');
    },
  });
  
  const updateShippingAddressMutation = useMutation({
    mutationFn: ({ id, shippingAddress }: { id: number; shippingAddress: any }) =>
      orderApi.updateOrderShippingAddressAdmin(id, shippingAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      if (selectedOrder) {
        queryClient.invalidateQueries({ queryKey: ['adminOrderDetails', selectedOrder.id] });
      }
      toast.success('Shipping address updated successfully!');
      setIsEditAddressDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update shipping address');
    },
  });
  
  // Fetch order details
  const { data: orderDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['adminOrderDetails', selectedOrder?.id],
    queryFn: () => orderApi.getOrderByIdAdmin(selectedOrder.id),
    enabled: !!selectedOrder && isDetailDialogOpen,
  });
  
  // Check Swipe invoice status when order details open
  const { data: swipeInvoiceCheck } = useQuery({
    queryKey: ['swipeInvoiceCheck', selectedOrder?.id],
    queryFn: () => orderApi.checkSwipeInvoice(selectedOrder.id),
    enabled: !!selectedOrder && isDetailDialogOpen,
  });
  
  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };
  
  const openEditShippingAddress = (order: any) => {
    const sa = order?.shippingAddress || {};
    const postalCode = sa.postalCode || sa.zipCode || '';
    setEditAddressForm({
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
    });
    setIsEditAddressDialogOpen(true);
  };
  
  const handleUpdateStatus = (status: string, skipWhatsApp?: boolean) => {
    if (selectedOrder) {
      updateStatusMutation.mutate({
        id: selectedOrder.id,
        status,
        skipWhatsApp,
      });
    }
  };
  
  const handleRetrySwipe = () => {
    if (selectedOrder) {
      retrySwipeMutation.mutate(selectedOrder.id);
    }
  };
  
  const filteredOrders = orders.filter((order: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.userName?.toLowerCase().includes(searchLower) ||
      order.userEmail?.toLowerCase().includes(searchLower)
    );
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
  
  const getNextStatus = (currentStatus: string) => {
    const statusFlow: Record<string, string> = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PROCESSING',
      PROCESSING: 'SHIPPED',
      SHIPPED: 'DELIVERED',
    };
    return statusFlow[currentStatus];
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  const displayOrder = orderDetails || selectedOrder;
  const shippingAddress = displayOrder?.shippingAddress || {};
  const displayPostalCode = shippingAddress.postalCode || shippingAddress.zipCode || '';
  const displayPhone = shippingAddress.phone || shippingAddress.phoneNumber || '';
  const displayEmail = shippingAddress.email || displayOrder?.userEmail || '';
  const displayName = `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || displayOrder?.userName || '';
  const displayAddressLine2 = shippingAddress.addressLine2 || shippingAddress.address_line2 || '';
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-semibold text-4xl lg:text-5xl font-bold mb-2">
            Order <span className="text-primary">Management</span>
          </h1>
          <p className="text-muted-foreground text-lg">View and manage customer orders</p>
        </motion.div>
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by order number, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-11">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
        
        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Order #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Payment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order: any, index: number) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold">#{order.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{order.userName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{order.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">₹{order.total?.toLocaleString('en-IN') || '0'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4">
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Order Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Order #{displayOrder?.orderNumber}
              </DialogTitle>
              <DialogDescription>
                View and manage order details, update status, and handle Swipe invoice
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : displayOrder ? (
              <div className="space-y-6 mt-4">
                {/* Order Status & Actions */}
                <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Status</div>
                    {getStatusBadge(displayOrder.status)}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Payment</div>
                    {getPaymentStatusBadge(displayOrder.paymentStatus)}
                  </div>
                  <div className="flex-1"></div>
                  <div className="flex gap-2">
                    {displayOrder.status === 'PENDING' && (
                      <>
                      <Button
                          onClick={() => handleUpdateStatus('CONFIRMED', false)}
                        disabled={updateStatusMutation.isPending}
                        className="gap-2"
                      >
                        {updateStatusMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Confirm Order
                          </>
                        )}
                      </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateStatus('CONFIRMED', true)}
                          disabled={updateStatusMutation.isPending}
                          className="gap-2"
                        >
                          {updateStatusMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Confirm without WhatsApp
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    {displayOrder.status === 'CONFIRMED' && (
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus('PROCESSING')}
                        disabled={updateStatusMutation.isPending}
                        className="gap-2"
                      >
                        {updateStatusMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4" />
                            Mark Processing
                          </>
                        )}
                      </Button>
                    )}
                    {displayOrder.status === 'PROCESSING' && (
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus('SHIPPED')}
                        disabled={updateStatusMutation.isPending}
                        className="gap-2"
                      >
                        {updateStatusMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Truck className="w-4 h-4" />
                            Mark Shipped
                          </>
                        )}
                      </Button>
                    )}
                    {displayOrder.status === 'SHIPPED' && (
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus('DELIVERED')}
                        disabled={updateStatusMutation.isPending}
                        className="gap-2"
                      >
                        {updateStatusMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Mark Delivered
                          </>
                        )}
                      </Button>
                    )}
                    {(displayOrder.status === 'PENDING' || displayOrder.status === 'CONFIRMED') && (
                      <Button
                        variant="destructive"
                        onClick={() => handleUpdateStatus('CANCELLED')}
                        disabled={updateStatusMutation.isPending}
                        className="gap-2"
                      >
                        {updateStatusMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Cancel
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Swipe Invoice Section */}
                {(displayOrder.swipeInvoiceNumber || displayOrder.swipeInvoiceId || 
                  (swipeInvoiceCheck?.invoiceExists && swipeInvoiceCheck.invoiceStatus === 'CREATED')) ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-green-800">Swipe Invoice Created</h3>
                      {displayOrder.swipeInvoiceUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(displayOrder.swipeInvoiceUrl, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Invoice
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      {displayOrder.swipeInvoiceNumber && (
                      <div><span className="font-medium">Invoice #:</span> {displayOrder.swipeInvoiceNumber}</div>
                      )}
                      {displayOrder.swipeInvoiceId && (
                        <div><span className="font-medium">Hash ID:</span> {displayOrder.swipeInvoiceId}</div>
                      )}
                      {displayOrder.swipeIrn && (
                        <div><span className="font-medium">IRN:</span> {displayOrder.swipeIrn}</div>
                      )}
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        ⚠️ Invoice created. Please check your Swipe dashboard for details.
                      </div>
                    </div>
                  </div>
                ) : swipeInvoiceCheck?.invoiceExists ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-yellow-800 mb-1">Invoice Created</h3>
                        <p className="text-sm text-yellow-700">Invoice was created in Swipe. Please check your Swipe dashboard.</p>
                      </div>
                    </div>
                  </div>
                ) : displayOrder.status === 'CONFIRMED' ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-yellow-800 mb-1">Swipe Invoice Not Created</h3>
                        <p className="text-sm text-yellow-700">Invoice was not created automatically. You can retry creating it.</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetrySwipe}
                        disabled={retrySwipeMutation.isPending}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${retrySwipeMutation.isPending ? 'animate-spin' : ''}`} />
                        Retry Invoice
                      </Button>
                    </div>
                  </div>
                ) : null}
                
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Name</div>
                      <div className="font-medium">{displayName || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Email</div>
                      <div className="font-medium">{displayOrder.userEmail}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Phone</div>
                      <div className="font-medium">{displayPhone || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Shipping Email</div>
                      <div className="font-medium">{displayEmail || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                
                {/* Shipping Address */}
                {displayOrder.shippingAddress && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Shipping Address</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditShippingAddress(displayOrder)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-1">
                        {shippingAddress.address && <div>{shippingAddress.address}</div>}
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
                        {displayOrder.shippingAddress.gstin && (
                          <div className="mt-2">
                            <span className="font-medium">GSTIN:</span> {displayOrder.shippingAddress.gstin}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Address Dialog */}
                <Dialog open={isEditAddressDialogOpen} onOpenChange={setIsEditAddressDialogOpen}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Shipping Address</DialogTitle>
                      <DialogDescription>Update customer delivery details for this order</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <Input placeholder="First Name *" value={editAddressForm.firstName} onChange={(e) => setEditAddressForm((p: any) => ({ ...p, firstName: e.target.value }))} />
                      <Input placeholder="Last Name *" value={editAddressForm.lastName} onChange={(e) => setEditAddressForm((p: any) => ({ ...p, lastName: e.target.value }))} />
                      <Input placeholder="Phone *" value={editAddressForm.phone} onChange={(e) => setEditAddressForm((p: any) => ({ ...p, phone: e.target.value }))} className="sm:col-span-2" />
                      <Input placeholder="Email" value={editAddressForm.email} onChange={(e) => setEditAddressForm((p: any) => ({ ...p, email: e.target.value }))} className="sm:col-span-2" />
                      <Input placeholder="Address Line 1 *" value={editAddressForm.address} onChange={(e) => setEditAddressForm((p: any) => ({ ...p, address: e.target.value }))} className="sm:col-span-2" />
                      <Input placeholder="Address Line 2" value={editAddressForm.addressLine2} onChange={(e) => setEditAddressForm((p: any) => ({ ...p, addressLine2: e.target.value }))} className="sm:col-span-2" />
                      <Input placeholder="City *" value={editAddressForm.city} onChange={(e) => setEditAddressForm((p: any) => ({ ...p, city: e.target.value }))} />
                      <Input placeholder="State *" value={editAddressForm.state} onChange={(e) => setEditAddressForm((p: any) => ({ ...p, state: e.target.value }))} />
                      <Input placeholder="Pincode / Postal Code *" value={editAddressForm.postalCode} onChange={(e) => setEditAddressForm((p: any) => ({ ...p, postalCode: e.target.value }))} />
                      <Input placeholder="Country (India/IN) *" value={editAddressForm.country} onChange={(e) => setEditAddressForm((p: any) => ({ ...p, country: e.target.value }))} />
                      <Input placeholder="GSTIN (optional)" value={editAddressForm.gstin} onChange={(e) => setEditAddressForm((p: any) => ({ ...p, gstin: e.target.value.toUpperCase() }))} className="sm:col-span-2" />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button variant="outline" onClick={() => setIsEditAddressDialogOpen(false)}>Cancel</Button>
                      <Button
                        onClick={() => {
                          if (!selectedOrder?.id) return;
                          // Basic validation (server also validates)
                          if (!editAddressForm.phone || !editAddressForm.address || !editAddressForm.city || !editAddressForm.state || !editAddressForm.postalCode) {
                            toast.error('Please fill all required fields');
                            return;
                          }
                          updateShippingAddressMutation.mutate({
                            id: selectedOrder.id,
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
                          'Save'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {displayOrder.items?.map((item: any, index: number) => (
                      <div key={index} className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium mb-1">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="font-semibold">
                          ₹{item.totalPrice?.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Order Summary */}
                <div>
                  <h3 className="font-semibold mb-3">Order Summary</h3>
                  <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{displayOrder.subtotal?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    {displayOrder.gst && displayOrder.gst > 0 && (
                      <div className="flex justify-between">
                        <span>GST</span>
                        <span>₹{displayOrder.gst.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {displayOrder.shipping && displayOrder.shipping > 0 && (
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>₹{displayOrder.shipping.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {displayOrder.couponDiscount && displayOrder.couponDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({displayOrder.couponCode})</span>
                        <span>-₹{displayOrder.couponDiscount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>₹{displayOrder.total?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
