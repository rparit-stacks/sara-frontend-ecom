import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Calendar, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { orderApi } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { getPaymentStatusDisplay } from '@/lib/orderUtils';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const AdminOrders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial values from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [paymentFilter, setPaymentFilter] = useState<string>(searchParams.get('payment') || 'all');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '0'));
  const [pageSize, setPageSize] = useState(parseInt(searchParams.get('size') || '10'));
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>((searchParams.get('sortDir') as 'asc' | 'desc') || 'desc');
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (paymentFilter !== 'all') params.set('payment', paymentFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (currentPage > 0) params.set('page', currentPage.toString());
    if (pageSize !== 10) params.set('size', pageSize.toString());
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortDir !== 'desc') params.set('sortDir', sortDir);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, statusFilter, paymentFilter, startDate, endDate, currentPage, pageSize, sortBy, sortDir, setSearchParams]);
  
  // Fetch paginated orders
  const { data: ordersData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['adminOrdersPaginated', currentPage, pageSize, sortBy, sortDir, statusFilter, paymentFilter, debouncedSearch, startDate, endDate],
    queryFn: () => orderApi.getAllOrdersPaginated({
      page: currentPage,
      size: pageSize,
      sortBy,
      sortDir,
      status: statusFilter,
      paymentStatus: paymentFilter,
      search: debouncedSearch,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
  });
  
  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['orderStats'],
    queryFn: () => orderApi.getOrderStats(),
    staleTime: 60000, // Cache for 1 minute
  });
  
  const orders = ordersData?.content || [];
  const totalElements = ordersData?.totalElements || 0;
  const totalPages = ordersData?.totalPages || 0;
  
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
    setCurrentPage(0);
  };
  
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDir === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 text-primary" />
      : <ArrowDown className="w-4 h-4 ml-1 text-primary" />;
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(0);
    setSortBy('createdAt');
    setSortDir('desc');
  };
  
  const hasActiveFilters = debouncedSearch || statusFilter !== 'all' || paymentFilter !== 'all' || startDate || endDate;
  
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
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-semibold text-4xl lg:text-5xl font-bold mb-2">
              Order <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              View and manage customer orders
              {totalElements > 0 && <span className="ml-2 text-sm">({totalElements} total)</span>}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>
        
        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3"
          >
            <div className="bg-white rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-3 text-center">
              <div className="text-2xl font-bold text-yellow-700">{stats.pendingOrders}</div>
              <div className="text-xs text-yellow-600">Pending</div>
            </div>
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.confirmedOrders}</div>
              <div className="text-xs text-blue-600">Confirmed</div>
            </div>
            <div className="bg-purple-50 rounded-lg border border-purple-200 p-3 text-center">
              <div className="text-2xl font-bold text-purple-700">{stats.processingOrders}</div>
              <div className="text-xs text-purple-600">Processing</div>
            </div>
            <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-3 text-center">
              <div className="text-2xl font-bold text-indigo-700">{stats.shippedOrders}</div>
              <div className="text-xs text-indigo-600">Shipped</div>
            </div>
            <div className="bg-green-50 rounded-lg border border-green-200 p-3 text-center">
              <div className="text-2xl font-bold text-green-700">{stats.deliveredOrders}</div>
              <div className="text-xs text-green-600">Delivered</div>
            </div>
            <div className="bg-red-50 rounded-lg border border-red-200 p-3 text-center">
              <div className="text-2xl font-bold text-red-700">{stats.cancelledOrders}</div>
              <div className="text-xs text-red-600">Cancelled</div>
            </div>
          </motion.div>
        )}
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="bg-white rounded-xl border border-border shadow-sm p-4 space-y-4"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by order #, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(0); }}>
              <SelectTrigger className="w-full lg:w-[180px] h-11">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setCurrentPage(0); }}>
              <SelectTrigger className="w-full lg:w-[180px] h-11">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="COD">COD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Range */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 sm:flex-initial">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(0); }}
                  className="pl-10 h-10 w-full sm:w-[160px]"
                />
              </div>
            </div>
            <div className="flex-1 sm:flex-initial">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(0); }}
                  className="pl-10 h-10 w-full sm:w-[160px]"
                />
              </div>
            </div>
            
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="h-10">
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </motion.div>
        
        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort('orderNumber')}
                      >
                        <div className="flex items-center">
                          Order # {getSortIcon('orderNumber')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort('userName')}
                      >
                        <div className="flex items-center">
                          Customer {getSortIcon('userName')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          Date {getSortIcon('createdAt')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort('total')}
                      >
                        <div className="flex items-center">
                          Amount {getSortIcon('total')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status {getSortIcon('status')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort('paymentStatus')}
                      >
                        <div className="flex items-center">
                          Payment {getSortIcon('paymentStatus')}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                          {hasActiveFilters ? 'No orders match your filters' : 'No orders found'}
                        </td>
                      </tr>
                    ) : (
                      orders.map((order: any, index: number) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="font-semibold">#{order.orderNumber}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium">{order.userName || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">{order.userEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const currency = order.paymentCurrency || 'INR';
                              const amount = Number(order.paymentAmount ?? order.total ?? 0);
                              return (
                                <span className="font-semibold whitespace-nowrap">
                                  {formatPrice(amount, currency)}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const d = getPaymentStatusDisplay(order);
                              return <Badge className={d.className}>{d.label}</Badge>;
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin-sara/orders/${order.id}`)}
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
              
              {/* Pagination */}
              {totalPages > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-muted/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Show</span>
                    <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setCurrentPage(0); }}>
                      <SelectTrigger className="w-[70px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>per page</span>
                    <span className="hidden sm:inline ml-2">
                      | Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(0)}
                      disabled={currentPage === 0}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1 mx-2">
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i;
                        } else if (currentPage < 3) {
                          pageNum = i;
                        } else if (currentPage > totalPages - 4) {
                          pageNum = totalPages - 5 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum + 1}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(totalPages - 1)}
                      disabled={currentPage >= totalPages - 1}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
