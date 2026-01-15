import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Upload, Edit, Trash2, Eye, EyeOff, Save, X, Palette, Loader2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import FabricSelector, { Fabric } from '@/components/admin/FabricSelector';
import { designsApi, plainProductsApi, categoriesApi } from '@/lib/api';

const AdminDesigns = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<any>(null);
  const [deleteDesignId, setDeleteDesignId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    imageUrl: '',
    status: 'ACTIVE',
    selectedFabricIds: [] as string[]
  });
  
  // Fetch designs
  const { data: designs = [], isLoading, error } = useQuery({
    queryKey: ['designs'],
    queryFn: () => designsApi.getAll(),
  });
  
  // Fetch fabrics (plain products) for fabric selector
  const { data: plainProducts = [] } = useQuery({
    queryKey: ['plainProducts'],
    queryFn: () => plainProductsApi.getAll(),
  });
  
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });
  
  // Transform plain products to fabrics for selector
  const fabricsForSelector: Fabric[] = plainProducts.map((p: any) => ({
    id: String(p.id),
    name: p.name,
    image: p.images?.[0] || '',
    status: p.status?.toLowerCase() || 'active',
  }));
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: designsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs'] });
      toast.success('Design created successfully!');
      setIsAddDialogOpen(false);
      handleResetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create design');
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => designsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs'] });
      toast.success('Design updated successfully!');
      setEditingDesign(null);
      handleResetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update design');
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: designsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs'] });
      toast.success('Design deleted successfully!');
      setDeleteDesignId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete design');
    },
  });

  const handleResetForm = () => {
    setFormData({
      name: '',
      category: '',
      imageUrl: '',
      status: 'ACTIVE',
      selectedFabricIds: []
    });
  };
  
  const handleEdit = (design: any) => {
    setFormData({
      name: design.name || '',
      category: design.category || '',
      imageUrl: design.imageUrl || '',
      status: design.status || 'ACTIVE',
      selectedFabricIds: (design.fabricIds || []).map(String),
    });
    setEditingDesign(design);
  };
  
  const handleSubmit = () => {
    const payload = {
      name: formData.name,
      category: formData.category,
      imageUrl: formData.imageUrl,
      status: formData.status,
      fabricIds: formData.selectedFabricIds.map(Number),
    };
    
    if (editingDesign) {
      updateMutation.mutate({ id: editingDesign.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };
  
  const confirmDelete = () => {
    if (deleteDesignId) {
      deleteMutation.mutate(deleteDesignId);
    }
  };
  
  // Filter designs
  const filteredDesigns = designs.filter((design: any) => {
    const matchesSearch = design.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || design.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });
  
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
          <p className="text-destructive">Failed to load designs. Please try again.</p>
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
              Design <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground text-lg">Manage design library and assign available fabrics</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) handleResetForm();
          }}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="btn-primary gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Design
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
              <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-border flex items-center justify-between">
                <DialogHeader>
                  <DialogTitle className="font-cursive text-3xl">Create Design</DialogTitle>
                </DialogHeader>
                <Button variant="ghost" size="icon" onClick={() => setIsAddDialogOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="d-name">Design Name</Label>
                    <Input 
                      id="d-name" 
                      placeholder="e.g. Traditional Paisley" 
                      className="h-11"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="floral">Floral</SelectItem>
                        <SelectItem value="traditional">Traditional</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="geometric">Geometric</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Design Image URL</Label>
                  <Input 
                    placeholder="Enter image URL" 
                    className="h-11"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                  {formData.imageUrl && (
                    <div className="mt-2">
                      <img src={formData.imageUrl} alt="Preview" className="h-32 object-cover rounded-lg" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
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

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-bold flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      Available Fabrics
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {formData.selectedFabricIds.length} Selected
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Select fabrics that are suitable for this design. These will be available for customers to choose from.
                  </p>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <FabricSelector 
                      fabrics={fabricsForSelector}
                      selectedFabricIds={formData.selectedFabricIds}
                      onChange={(ids) => setFormData({ ...formData, selectedFabricIds: ids })}
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-border flex items-center justify-between">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="gap-2 h-11 px-6">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button 
                  className="btn-primary gap-2 h-11 px-8"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                >
                  <Save className="w-4 h-4" />
                  {createMutation.isPending ? 'Creating...' : 'Create Design'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Edit Dialog */}
          <Dialog open={!!editingDesign} onOpenChange={(open) => { if (!open) { setEditingDesign(null); handleResetForm(); } }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
              <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-border flex items-center justify-between">
                <DialogHeader>
                  <DialogTitle className="font-cursive text-3xl">Edit Design</DialogTitle>
                </DialogHeader>
                <Button variant="ghost" size="icon" onClick={() => setEditingDesign(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Design Name</Label>
                    <Input 
                      placeholder="e.g. Traditional Paisley" 
                      className="h-11"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="floral">Floral</SelectItem>
                        <SelectItem value="traditional">Traditional</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="geometric">Geometric</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Design Image URL</Label>
                  <Input 
                    placeholder="Enter image URL" 
                    className="h-11"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                  {formData.imageUrl && (
                    <div className="mt-2">
                      <img src={formData.imageUrl} alt="Preview" className="h-32 object-cover rounded-lg" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
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

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-bold flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      Available Fabrics
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {formData.selectedFabricIds.length} Selected
                    </Badge>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <FabricSelector 
                      fabrics={fabricsForSelector}
                      selectedFabricIds={formData.selectedFabricIds}
                      onChange={(ids) => setFormData({ ...formData, selectedFabricIds: ids })}
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-border flex items-center justify-between">
                <Button variant="outline" onClick={() => setEditingDesign(null)} className="gap-2 h-11 px-6">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button 
                  className="btn-primary gap-2 h-11 px-8"
                  onClick={handleSubmit}
                  disabled={updateMutation.isPending}
                >
                  <Save className="w-4 h-4" />
                  {updateMutation.isPending ? 'Updating...' : 'Update Design'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px] h-11">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="floral">Floral</SelectItem>
              <SelectItem value="traditional">Traditional</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="geometric">Geometric</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Designs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDesigns.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No designs found. Create your first design!
            </div>
          ) : (
            filteredDesigns.map((design: any, index: number) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.4 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="relative aspect-square bg-muted">
                  {design.imageUrl ? (
                    <img
                      src={design.imageUrl}
                      alt={design.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge 
                      className={design.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    >
                      {design.status?.toLowerCase() || 'active'}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" className="gap-2" onClick={() => handleEdit(design)}>
                      <Edit className="w-4 h-4" />
                      Edit Design
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{design.name}</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase">{design.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Palette className="w-3 h-3" />
                    <span>{design.fabricIds?.length || 0} Fabrics Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleEdit(design)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-destructive hover:text-destructive ml-auto"
                        onClick={() => setDeleteDesignId(design.id)}
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
        <AlertDialog open={deleteDesignId !== null} onOpenChange={(open) => !open && setDeleteDesignId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Design</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this design? This action cannot be undone.
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

export default AdminDesigns;
