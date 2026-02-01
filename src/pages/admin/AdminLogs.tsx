import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Eye, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  X, 
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { logsApi, ApiLogDTO } from '@/lib/api';
import { LogDetailModal } from '@/components/admin/LogDetailModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const AdminLogs = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial values from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [errorFlagFilter, setErrorFlagFilter] = useState<string>(searchParams.get('errorFlag') || 'all');
  const [endpointFilter, setEndpointFilter] = useState<string>(searchParams.get('endpoint') || 'all');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '0'));
  const [pageSize, setPageSize] = useState(parseInt(searchParams.get('size') || '50'));
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>((searchParams.get('sortDir') as 'asc' | 'desc') || 'desc');
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Modal state
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<'selected' | 'cleanup'>('selected');
  const [cleanupDays, setCleanupDays] = useState(15);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (errorFlagFilter !== 'all') params.set('errorFlag', errorFlagFilter);
    if (endpointFilter !== 'all') params.set('endpoint', endpointFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (currentPage > 0) params.set('page', currentPage.toString());
    if (pageSize !== 50) params.set('size', pageSize.toString());
    if (sortBy !== 'timestamp') params.set('sortBy', sortBy);
    if (sortDir !== 'desc') params.set('sortDir', sortDir);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, errorFlagFilter, endpointFilter, startDate, endDate, currentPage, pageSize, sortBy, sortDir, setSearchParams]);
  
  // Fetch logs
  const { data: logsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['adminLogs', currentPage, pageSize, sortBy, sortDir, errorFlagFilter, endpointFilter, debouncedSearch, startDate, endDate],
    queryFn: () => logsApi.getLogs({
      page: currentPage,
      size: pageSize,
      sortBy,
      sortDir,
      errorFlag: errorFlagFilter,
      endpoint: endpointFilter,
      search: debouncedSearch,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
  });
  
  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['logStats'],
    queryFn: () => logsApi.getStats(),
    staleTime: 30000,
  });
  
  // Fetch endpoints for dropdown
  const { data: endpoints } = useQuery({
    queryKey: ['logEndpoints'],
    queryFn: () => logsApi.getEndpoints(),
    staleTime: 60000,
  });
  
  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: logsApi.bulkDelete,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
      queryClient.invalidateQueries({ queryKey: ['logStats'] });
      setSelectedIds(new Set());
      setSelectAll(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete logs: ${error.message}`);
    },
  });
  
  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: ({ days, flag }: { days: number; flag?: string }) => logsApi.cleanup(days, flag),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
      queryClient.invalidateQueries({ queryKey: ['logStats'] });
    },
    onError: (error: Error) => {
      toast.error(`Cleanup failed: ${error.message}`);
    },
  });
  
  const logs = logsData?.content || [];
  const totalElements = logsData?.totalElements || 0;
  const totalPages = logsData?.totalPages || 0;
  
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
    setErrorFlagFilter('all');
    setEndpointFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(0);
    setSortBy('timestamp');
    setSortDir('desc');
  };
  
  const hasActiveFilters = debouncedSearch || errorFlagFilter !== 'all' || endpointFilter !== 'all' || startDate || endDate;
  
  const getFlagBadge = (flag: string) => {
    switch (flag) {
      case 'GREEN':
        return <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle2 className="w-3 h-3" /> Success</Badge>;
      case 'ORANGE':
        return <Badge className="bg-orange-100 text-orange-700 gap-1"><AlertTriangle className="w-3 h-3" /> Warning</Badge>;
      case 'RED':
        return <Badge className="bg-red-100 text-red-700 gap-1"><XCircle className="w-3 h-3" /> Error</Badge>;
      default:
        return <Badge>{flag}</Badge>;
    }
  };
  
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(new Set(logs.map(log => log.id)));
    } else {
      setSelectedIds(new Set());
    }
  };
  
  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === logs.length && logs.length > 0);
  };
  
  const handleBulkDelete = () => {
    if (deleteType === 'selected' && selectedIds.size > 0) {
      bulkDeleteMutation.mutate({ ids: Array.from(selectedIds) });
    } else if (deleteType === 'cleanup') {
      cleanupMutation.mutate({ days: cleanupDays, flag: errorFlagFilter !== 'all' ? errorFlagFilter : undefined });
    }
    setShowDeleteDialog(false);
  };
  
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
              API <span className="text-primary">Logs</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Monitor API requests and errors
              {totalElements > 0 && <span className="ml-2 text-sm">({totalElements} total)</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => { setDeleteType('cleanup'); setShowDeleteDialog(true); }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cleanup Old Logs
            </Button>
          </div>
        </motion.div>
        
        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3"
          >
            <div className="bg-white rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Logs</div>
            </div>
            <div className="bg-green-50 rounded-lg border border-green-200 p-3 text-center">
              <div className="text-2xl font-bold text-green-700">{stats.greenCount.toLocaleString()}</div>
              <div className="text-xs text-green-600">Success (2xx)</div>
            </div>
            <div className="bg-orange-50 rounded-lg border border-orange-200 p-3 text-center">
              <div className="text-2xl font-bold text-orange-700">{stats.orangeCount.toLocaleString()}</div>
              <div className="text-xs text-orange-600">Client Errors (4xx)</div>
            </div>
            <div className="bg-red-50 rounded-lg border border-red-200 p-3 text-center">
              <div className="text-2xl font-bold text-red-700">{stats.redCount.toLocaleString()}</div>
              <div className="text-xs text-red-600">Server Errors (5xx)</div>
            </div>
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 text-center col-span-2 sm:col-span-1">
              <div className="text-2xl font-bold text-blue-700">{stats.todayTotal.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Today Total</div>
            </div>
            <div className="bg-green-50/50 rounded-lg border border-green-100 p-3 text-center">
              <div className="text-xl font-bold text-green-600">{stats.todayGreen.toLocaleString()}</div>
              <div className="text-xs text-green-500">Today Success</div>
            </div>
            <div className="bg-orange-50/50 rounded-lg border border-orange-100 p-3 text-center">
              <div className="text-xl font-bold text-orange-600">{stats.todayOrange.toLocaleString()}</div>
              <div className="text-xs text-orange-500">Today 4xx</div>
            </div>
            <div className="bg-red-50/50 rounded-lg border border-red-100 p-3 text-center">
              <div className="text-xl font-bold text-red-600">{stats.todayRed.toLocaleString()}</div>
              <div className="text-xs text-red-500">Today 5xx</div>
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
                placeholder="Search by IP address or user email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            
            {/* Flag Filter */}
            <Select value={errorFlagFilter} onValueChange={(v) => { setErrorFlagFilter(v); setCurrentPage(0); }}>
              <SelectTrigger className="w-full lg:w-[160px] h-11">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="GREEN">Success (2xx)</SelectItem>
                <SelectItem value="ORANGE">Client Errors (4xx)</SelectItem>
                <SelectItem value="RED">Server Errors (5xx)</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Endpoint Filter */}
            <Select value={endpointFilter} onValueChange={(v) => { setEndpointFilter(v); setCurrentPage(0); }}>
              <SelectTrigger className="w-full lg:w-[220px] h-11">
                <SelectValue placeholder="Endpoint" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All Endpoints</SelectItem>
                {endpoints?.map((endpoint) => (
                  <SelectItem key={endpoint} value={endpoint}>
                    {endpoint.length > 35 ? endpoint.substring(0, 35) + '...' : endpoint}
                  </SelectItem>
                ))}
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
            
            {selectedIds.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => { setDeleteType('selected'); setShowDeleteDialog(true); }}
                className="h-10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedIds.size})
              </Button>
            )}
          </div>
        </motion.div>
        
        {/* Logs Table */}
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
                      <th className="px-4 py-4 text-left">
                        <Checkbox 
                          checked={selectAll}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        />
                      </th>
                      <th 
                        className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort('timestamp')}
                      >
                        <div className="flex items-center">
                          Timestamp {getSortIcon('timestamp')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort('apiEndpoint')}
                      >
                        <div className="flex items-center">
                          Endpoint {getSortIcon('apiEndpoint')}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Method</th>
                      <th 
                        className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort('statusCode')}
                      >
                        <div className="flex items-center">
                          Status {getSortIcon('statusCode')}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Flag</th>
                      <th 
                        className="px-4 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort('country')}
                      >
                        <div className="flex items-center">
                          Country {getSortIcon('country')}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Device</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">IP Address</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">
                          {hasActiveFilters ? 'No logs match your filters' : 'No logs found'}
                        </td>
                      </tr>
                    ) : (
                      logs.map((log: ApiLogDTO, index: number) => (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedLogId(log.id)}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={selectedIds.has(log.id)}
                              onCheckedChange={(checked) => handleSelectOne(log.id, !!checked)}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm truncate max-w-[200px] block" title={log.apiEndpoint}>
                              {log.apiEndpoint.length > 30 ? log.apiEndpoint.substring(0, 30) + '...' : log.apiEndpoint}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="font-mono">
                              {log.httpMethod}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge 
                              className={
                                log.statusCode >= 500 ? 'bg-red-100 text-red-700' :
                                log.statusCode >= 400 ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                              }
                            >
                              {log.statusCode}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {getFlagBadge(log.errorFlag)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {log.country || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {log.device || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono">
                            {log.ipAddress || 'N/A'}
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLogId(log.id)}
                            >
                              <Eye className="w-4 h-4" />
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
                      | Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements.toLocaleString()}
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
      
      {/* Log Detail Modal */}
      <LogDetailModal
        logId={selectedLogId}
        open={selectedLogId !== null}
        onClose={() => setSelectedLogId(null)}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteType === 'selected' ? 'Delete Selected Logs' : 'Cleanup Old Logs'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'selected' ? (
                <>Are you sure you want to delete {selectedIds.size} selected log entries? This action cannot be undone.</>
              ) : (
                <div className="space-y-4">
                  <p>This will delete success logs (2xx) older than the specified days. Error logs will be preserved for analysis.</p>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Delete logs older than:</label>
                    <Input
                      type="number"
                      value={cleanupDays}
                      onChange={(e) => setCleanupDays(parseInt(e.target.value) || 15)}
                      className="w-20"
                      min={1}
                    />
                    <span className="text-sm">days</span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending || cleanupMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminLogs;
