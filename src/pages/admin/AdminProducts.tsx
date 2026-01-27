import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Package, ExternalLink, Loader2, Pause, Play, Download, CheckSquare, Square, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductFormDialog from '@/components/admin/ProductFormDialog';
import { PlainProduct } from '@/components/admin/PlainProductSelector';
import { ProductType } from '@/components/admin/ProductTypeSelector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { productsApi, plainProductsApi, categoriesApi } from '@/lib/api';


const AdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[] | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | ProductType>(() => {
    const typeParam = searchParams.get('type') as ProductType | null;
    return typeParam || 'ALL';
  });
  
  const queryClient = useQueryClient();

  // Fetch products from API
  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products', filterType],
    queryFn: () => productsApi.getAll(filterType !== 'ALL' ? { type: filterType } : undefined),
  });

  // Fetch plain products (fabrics) for the form dialog
  const { data: plainProducts = [], isLoading: plainProductsLoading, error: plainProductsError } = useQuery({
    queryKey: ['plainProducts', 'active'],
    queryFn: () => plainProductsApi.getActive(),
  });

  // Debug logging
  useEffect(() => {
    if (plainProductsError) {
      console.error('Error fetching plain products:', plainProductsError);
      toast.error('Failed to load plain products. Please refresh the page.');
    }
    if (plainProducts.length > 0) {
      console.log('Plain products loaded:', plainProducts.length, plainProducts);
    } else if (!plainProductsLoading) {
      console.warn('No plain products found. Make sure you have created plain products first.');
    }
  }, [plainProducts, plainProductsLoading, plainProductsError]);

  // Fetch only leaf categories (categories without subcategories) for product creation
  const { data: categories = [] } = useQuery({
    queryKey: ['leafCategories'],
    queryFn: () => categoriesApi.getLeafCategories(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (data.type === 'PLAIN') return productsApi.createPlain(data);
      if (data.type === 'DESIGNED') return productsApi.createDesigned(data);
      if (data.type === 'DIGITAL') return productsApi.createDigital(data);
      return productsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['plainProducts'] }); // Invalidate plain products for popup
      toast.success('Product created successfully!');
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      // Handle user-friendly error messages
      let errorMessage = 'Failed to create product';
      if (error?.response?.data?.error) {
        const backendError = error.response.data.error;
        if (typeof backendError === 'string') {
          errorMessage = backendError;
        } else if (backendError.error) {
          errorMessage = backendError.error;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['plainProducts'] }); // Invalidate plain products for popup
      toast.success('Product updated successfully!');
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (error: any) => {
      // Handle user-friendly error messages
      let errorMessage = 'Failed to update product';
      if (error?.response?.data?.error) {
        const backendError = error.response.data.error;
        if (typeof backendError === 'string') {
          errorMessage = backendError;
        } else if (backendError.error) {
          errorMessage = backendError.error;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully!');
      setDeleteProductId(null);
      setSelectedProducts(new Set());
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: productsApi.bulkDelete,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${data.count || selectedProducts.size} product(s) deleted successfully!`);
      setBulkDeleteIds(null);
      setSelectedProducts(new Set());
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete products');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: productsApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product status updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product status');
    },
  });

  // Bulk toggle status mutation
  const bulkToggleStatusMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: 'pause' | 'unpause' }) => 
      productsApi.bulkToggleStatus(ids, action),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${data.count || selectedProducts.size} product(s) ${data.message?.includes('pause') ? 'paused' : 'unpaused'} successfully!`);
      setSelectedProducts(new Set());
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update product status');
    },
  });

  // Bulk copy mutation
  const bulkCopyMutation = useMutation({
    mutationFn: (ids: number[]) => productsApi.bulkCopy(ids),
    onSuccess: (data: { copied: number; failed: number; errors?: string[] }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (data.failed && data.failed > 0) {
        toast.success(`${data.copied} product(s) copied. ${data.failed} failed.`, {
          description: data.errors?.slice(0, 3).join('; '),
        });
      } else {
        toast.success(`${data.copied} product(s) copied successfully!`);
      }
      setSelectedProducts(new Set());
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to copy products');
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: productsApi.exportToExcel,
    onSuccess: () => {
      toast.success('Products exported to Excel successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export products');
    },
  });

  // Loading state for admin operations (must be after all mutations are declared)
  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || toggleStatusMutation.isPending || bulkDeleteMutation.isPending || bulkCopyMutation.isPending || exportMutation.isPending;

  // Update filter when URL param changes
  useEffect(() => {
    const typeParam = searchParams.get('type') as ProductType | null;
    if (typeParam) {
      setFilterType(typeParam);
    }
  }, [searchParams]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'DESIGNED': return <Badge className="bg-pink-100 text-pink-700 border-pink-200">Designed</Badge>;
      case 'DIGITAL': return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Digital</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Plain</Badge>;
    }
  };

  // Handle form submission
  const handleSaveProduct = (payload: any) => {
    // Validate payload before submission
    if (!payload.name || !payload.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!payload.categoryId) {
      toast.error('Category is required');
      return;
    }

    if (payload.id) {
      updateMutation.mutate({ id: payload.id, data: payload }, {
        onError: () => {
          // Keep dialog open on error so user can fix issues
          // Dialog will only close on success
        }
      });
    } else {
      createMutation.mutate(payload, {
        onError: () => {
          // Keep dialog open on error so user can fix issues
          // Dialog will only close on success
        }
      });
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (productId: number) => {
    setDeleteProductId(productId);
  };

  const confirmDelete = () => {
    if (deleteProductId) {
      deleteMutation.mutate(deleteProductId);
    }
  };

  const confirmBulkDelete = () => {
    if (bulkDeleteIds && bulkDeleteIds.length > 0) {
      bulkDeleteMutation.mutate(bulkDeleteIds);
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p: any) => p.id)));
    }
  };

  const handleSelectProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkPause = () => {
    const ids = Array.from(selectedProducts);
    if (ids.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    bulkToggleStatusMutation.mutate({ ids, action: 'pause' });
  };

  const handleBulkUnpause = () => {
    const ids = Array.from(selectedProducts);
    if (ids.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    bulkToggleStatusMutation.mutate({ ids, action: 'unpause' });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedProducts);
    if (ids.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    setBulkDeleteIds(ids);
  };

  const handleToggleStatus = (productId: number) => {
    toggleStatusMutation.mutate(productId);
  };

  const handleBulkCopy = () => {
    const ids = Array.from(selectedProducts);
    if (ids.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    bulkCopyMutation.mutate(ids);
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  // Transform plain products for the form dialog
  const plainProductsForForm: PlainProduct[] = plainProducts
    .filter((p: any) => p && p.id) // Filter out any null/undefined products
    .map((p: any) => ({
      id: String(p.id),
      name: p.name || 'Unnamed Product',
      image: p.image || '',
      pricePerMeter: Number(p.pricePerMeter) || 0,
      status: (p.status?.toLowerCase() === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
    }));

  // Transform categories for the form dialog
  // Leaf categories don't have subcategories, so we just map them directly
  const categoriesForForm = categories.map((c: any) => ({
    id: String(c.id),
    name: c.name,
    subcategories: [], // Leaf categories have no subcategories
  }));

  // Filter products by search
  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (productsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (productsError) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-destructive">Failed to load products. Please try again.</p>
        </div>
      </AdminLayout>
    );
  }

  // Global admin loader overlay
  const AdminLoader = () => {
    const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || toggleStatusMutation.isPending || bulkDeleteMutation.isPending || bulkCopyMutation.isPending || exportMutation.isPending;
    
    if (!isLoading) return null;
    
    const getLoadingMessage = () => {
      if (createMutation.isPending) return 'Creating your product...';
      if (updateMutation.isPending) return 'Updating your product...';
      if (deleteMutation.isPending || bulkDeleteMutation.isPending) return 'Deleting products...';
      if (toggleStatusMutation.isPending) return 'Updating product status...';
      if (bulkCopyMutation.isPending) return 'Copying products...';
      if (exportMutation.isPending) return 'Exporting products...';
      return 'Processing...';
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4 min-w-[300px]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-lg font-semibold text-foreground">{getLoadingMessage()}</p>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <AdminLoader />
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
              Product <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground text-lg">Create and manage all product types</p>
          </div>
          <div className="flex gap-2">
            {selectedProducts.size > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2"
              >
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleBulkPause}
                  disabled={bulkToggleStatusMutation.isPending}
                >
                  <Pause className="w-4 h-4" />
                  Pause ({selectedProducts.size})
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleBulkUnpause}
                  disabled={bulkToggleStatusMutation.isPending}
                >
                  <Play className="w-4 h-4" />
                  Unpause ({selectedProducts.size})
                </Button>
                <Button 
                  variant="destructive" 
                  className="gap-2"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedProducts.size})
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleBulkCopy}
                  disabled={bulkCopyMutation.isPending}
                >
                  <Copy className="w-4 h-4" />
                  Copy ({selectedProducts.size})
                </Button>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleExport}
                disabled={exportMutation.isPending}
              >
                <Download className="w-4 h-4" />
                {exportMutation.isPending ? 'Exporting...' : 'Export Excel'}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="btn-primary gap-2" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                Add New Product
              </Button>
            </motion.div>
          </div>
          
          <ProductFormDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            mode="create"
            plainProducts={plainProductsForForm}
            categories={categoriesForForm}
            onSave={handleSaveProduct}
          />
          <ProductFormDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            mode="edit"
            productId={editingProduct?.id}
            initialData={editingProduct}
            plainProducts={plainProductsForForm}
            categories={categoriesForForm}
            onSave={handleSaveProduct}
          />
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search products by name, category, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select 
            value={filterType} 
            onValueChange={(v) => {
              setFilterType(v as any);
              if (v === 'ALL') {
                setSearchParams({});
              } else {
                setSearchParams({ type: v });
              }
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-11">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Products</SelectItem>
              <SelectItem value="PLAIN">Plain Products (Fabrics)</SelectItem>
              <SelectItem value="DESIGNED">Design Products</SelectItem>
              <SelectItem value="DIGITAL">Digital Products</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm w-12">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center justify-center"
                    >
                      {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </th>
                  <th className="text-left p-4 font-semibold text-sm">Product</th>
                  <th className="text-left p-4 font-semibold text-sm">Type</th>
                  <th className="text-left p-4 font-semibold text-sm">Category</th>
                  <th className="text-left p-4 font-semibold text-sm">Price</th>
                  <th className="text-left p-4 font-semibold text-sm">Status</th>
                  <th className="text-left p-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No products found. Create your first product!
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product: any, index: number) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.3 }}
                      className={`border-t border-border hover:bg-muted/50 transition-colors ${selectedProducts.has(product.id) ? 'bg-primary/5' : ''}`}
                    >
                      <td className="p-4">
                        <button
                          onClick={() => handleSelectProduct(product.id)}
                          className="flex items-center justify-center"
                        >
                          {selectedProducts.has(product.id) ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <a
                              href={`${window.location.origin}/product/${product.slug || product.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold hover:text-primary transition-colors"
                            >
                              {product.name}
                            </a>
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getTypeBadge(product.type)}
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{product.categoryName || 'Uncategorized'}</Badge>
                      </td>
                      <td className="p-4 font-medium">
                        ₹{product.price || product.basePrice || 0}
                      </td>
                      <td className="p-4">
                        <Badge 
                          className={product.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                        >
                          {product.status?.toLowerCase() || 'active'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9"
                              onClick={() => handleToggleStatus(product.id)}
                              disabled={toggleStatusMutation.isPending}
                              title={product.status === 'ACTIVE' ? 'Pause' : 'Unpause'}
                            >
                              {toggleStatusMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : product.status === 'ACTIVE' ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="icon" 
                              className="h-9 w-9 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(product.id)}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteProductId !== null} onOpenChange={(open) => !open && setDeleteProductId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this product? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete} 
                className="bg-destructive text-destructive-foreground"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={bulkDeleteIds !== null} onOpenChange={(open) => !open && setBulkDeleteIds(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {bulkDeleteIds?.length || 0} Product(s)</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {bulkDeleteIds?.length || 0} selected product(s)? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmBulkDelete} 
                className="bg-destructive text-destructive-foreground"
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete All'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
