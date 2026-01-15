import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Upload, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { plainProductsApi, categoriesApi } from '@/lib/api';

const AdminFabrics = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFabric, setEditingFabric] = useState<any>(null);
  const [deleteFabricId, setDeleteFabricId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    status: 'ACTIVE',
    images: [''],
    variants: [{ color: '', pricePerMeter: 0, stock: 100 }],
  });
  
  const queryClient = useQueryClient();
  
  // Fetch fabrics (plain products)
  const { data: fabrics = [], isLoading, error } = useQuery({
    queryKey: ['plainProducts'],
    queryFn: () => plainProductsApi.getAll(),
  });
  
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: plainProductsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plainProducts'] });
      toast.success('Fabric created successfully!');
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create fabric');
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => plainProductsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plainProducts'] });
      toast.success('Fabric updated successfully!');
      setEditingFabric(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update fabric');
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: plainProductsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plainProducts'] });
      toast.success('Fabric deleted successfully!');
      setDeleteFabricId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete fabric');
    },
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      status: 'ACTIVE',
      images: [''],
      variants: [{ color: '', pricePerMeter: 0, stock: 100 }],
    });
  };
  
  const handleEdit = (fabric: any) => {
    setFormData({
      name: fabric.name || '',
      description: fabric.description || '',
      categoryId: String(fabric.categoryId || ''),
      status: fabric.status || 'ACTIVE',
      images: fabric.images?.length ? fabric.images : [''],
      variants: fabric.variants?.length ? fabric.variants : [{ color: '', pricePerMeter: 0, stock: 100 }],
    });
    setEditingFabric(fabric);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      categoryId: formData.categoryId ? Number(formData.categoryId) : null,
    };
    
    if (editingFabric) {
      updateMutation.mutate({ id: editingFabric.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };
  
  const confirmDelete = () => {
    if (deleteFabricId) {
      deleteMutation.mutate(deleteFabricId);
    }
  };
  
  // Filter fabrics by search
  const filteredFabrics = fabrics.filter((fabric: any) =>
    fabric.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-destructive">Failed to load fabrics. Please try again.</p>
        </div>
      </AdminLayout>
    );
  }

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
            <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
              Fabric <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground text-lg">Manage fabric images and assignments</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="btn-primary gap-2">
                  <Plus className="w-4 h-4" />
                  Add Fabric
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-cursive text-2xl">Add New Fabric</DialogTitle>
              </DialogHeader>
              <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fabric Name</label>
                  <Input 
                    placeholder="Enter fabric name" 
                    className="h-11" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea 
                    placeholder="Enter description" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Image URL</label>
                  <Input 
                    placeholder="Enter image URL" 
                    className="h-11" 
                    value={formData.images[0]}
                    onChange={(e) => setFormData({ ...formData, images: [e.target.value] })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Color Variant</label>
                    <Input 
                      placeholder="e.g., Natural White"
                      className="h-11" 
                      value={formData.variants[0].color}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        variants: [{ ...formData.variants[0], color: e.target.value }] 
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Price per Meter (₹)</label>
                    <Input 
                      type="number"
                      placeholder="0"
                      className="h-11" 
                      value={formData.variants[0].pricePerMeter}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        variants: [{ ...formData.variants[0], pricePerMeter: Number(e.target.value) }] 
                      })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    className="btn-primary flex-1"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Fabric'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Dialog */}
          <Dialog open={!!editingFabric} onOpenChange={(open) => { if (!open) { setEditingFabric(null); resetForm(); } }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-cursive text-2xl">Edit Fabric</DialogTitle>
              </DialogHeader>
              <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fabric Name</label>
                  <Input 
                    placeholder="Enter fabric name" 
                    className="h-11" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea 
                    placeholder="Enter description" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Image URL</label>
                  <Input 
                    placeholder="Enter image URL" 
                    className="h-11" 
                    value={formData.images[0]}
                    onChange={(e) => setFormData({ ...formData, images: [e.target.value] })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Color Variant</label>
                    <Input 
                      placeholder="e.g., Natural White"
                      className="h-11" 
                      value={formData.variants[0]?.color || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        variants: [{ ...formData.variants[0], color: e.target.value }] 
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Price per Meter (₹)</label>
                    <Input 
                      type="number"
                      placeholder="0"
                      className="h-11" 
                      value={formData.variants[0]?.pricePerMeter || 0}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        variants: [{ ...formData.variants[0], pricePerMeter: Number(e.target.value) }] 
                      })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    className="btn-primary flex-1"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Updating...' : 'Update Fabric'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingFabric(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search fabrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </motion.div>

        {/* Fabrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFabrics.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No fabrics found. Create your first fabric!
            </div>
          ) : (
            filteredFabrics.map((fabric: any, index: number) => (
              <motion.div
                key={fabric.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.4 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square bg-muted">
                  {fabric.images?.[0] ? (
                    <img
                      src={fabric.images[0]}
                      alt={fabric.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge 
                      className={fabric.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    >
                      {fabric.status?.toLowerCase() || 'active'}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{fabric.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    ₹{fabric.variants?.[0]?.pricePerMeter || 0}/meter
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {fabric.categoryName || 'Uncategorized'}
                  </p>
                  <div className="flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9"
                        onClick={() => handleEdit(fabric)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-destructive hover:text-destructive ml-auto"
                        onClick={() => setDeleteFabricId(fabric.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteFabricId !== null} onOpenChange={(open) => !open && setDeleteFabricId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Fabric</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this fabric? This action cannot be undone.
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
      </div>
    </AdminLayout>
  );
};

export default AdminFabrics;
