import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Eye, Loader2, CheckCircle2, XCircle, Package, Truck, Download, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { orderApi } from '@/lib/api';

const AdminOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch orders
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['adminOrders', statusFilter],
    queryFn: () => orderApi.getAllOrders(statusFilter === 'all' ? undefined : statusFilter),
  });
  
  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      orderApi.updateOrderStatus(id, status),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      toast.success('Swipe invoice created successfully!');
      if (selectedOrder) {
        refetch();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create Swipe invoice');
    },
  });
  
  // Fetch order details
  const { data: orderDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['adminOrderDetails', selectedOrder?.id],
    queryFn: () => orderApi.getOrderByIdAdmin(selectedOrder.id),
    enabled: !!selectedOrder && isDetailDialogOpen,
  });
  
  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };
  
  const handleUpdateStatus = (status: string) => {
    if (selectedOrder) {
      updateStatusMutation.mutate({
        id: selectedOrder.id,
        status,
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
                      <Button
                        onClick={() => handleUpdateStatus('CONFIRMED')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirm Order
                      </Button>
                    )}
                    {displayOrder.status === 'CONFIRMED' && (
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus('PROCESSING')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Mark Processing
                      </Button>
                    )}
                    {displayOrder.status === 'PROCESSING' && (
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus('SHIPPED')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Mark Shipped
                      </Button>
                    )}
                    {displayOrder.status === 'SHIPPED' && (
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus('DELIVERED')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark Delivered
                      </Button>
                    )}
                    {(displayOrder.status === 'PENDING' || displayOrder.status === 'CONFIRMED') && (
                      <Button
                        variant="destructive"
                        onClick={() => handleUpdateStatus('CANCELLED')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Swipe Invoice Section */}
                {displayOrder.swipeInvoiceNumber && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-green-800">Swipe Invoice</h3>
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
                      <div><span className="font-medium">Invoice #:</span> {displayOrder.swipeInvoiceNumber}</div>
                      {displayOrder.swipeIrn && (
                        <div><span className="font-medium">IRN:</span> {displayOrder.swipeIrn}</div>
                      )}
                    </div>
                  </div>
                )}
                
                {!displayOrder.swipeInvoiceNumber && displayOrder.status === 'CONFIRMED' && (
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
                )}
                
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Name</div>
                      <div className="font-medium">{displayOrder.userName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Email</div>
                      <div className="font-medium">{displayOrder.userEmail}</div>
                    </div>
                  </div>
                </div>
                
                {/* Shipping Address */}
                {displayOrder.shippingAddress && (
                  <div>
                    <h3 className="font-semibold mb-3">Shipping Address</h3>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-1">
                        {displayOrder.shippingAddress.address && (
                          <div>{displayOrder.shippingAddress.address}</div>
                        )}
                        <div>
                          {displayOrder.shippingAddress.city && `${displayOrder.shippingAddress.city}, `}
                          {displayOrder.shippingAddress.state && `${displayOrder.shippingAddress.state} `}
                          {displayOrder.shippingAddress.zipCode && `- ${displayOrder.shippingAddress.zipCode}`}
                        </div>
                        {displayOrder.shippingAddress.gstin && (
                          <div className="mt-2">
                            <span className="font-medium">GSTIN:</span> {displayOrder.shippingAddress.gstin}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
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
