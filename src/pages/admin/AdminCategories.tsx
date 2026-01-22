import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Category, CategoryTree } from '@/components/admin/CategoryTree';
import { Button } from '@/components/ui/button';
import { ButtonWithLoading } from '@/components/ui/ButtonWithLoading';
import { Input } from '@/components/ui/input';
import { Plus, FolderTree, Search, Save, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { categoriesApi } from '@/lib/api';

const AdminCategories = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch categories from API
  const { data: apiCategories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });
  
  // Transform API response to Category[] format for CategoryTree
  const transformCategories = (cats: any[]): Category[] => {
    return cats.map((c: any) => ({
      id: String(c.id),
      name: c.name,
      parentId: c.parentId ? String(c.parentId) : null,
      status: c.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
      subcategories: c.subcategories ? transformCategories(c.subcategories) : [],
      image: c.image || '',
    } as Category & { image?: string }));
  };
  
  const categories = transformCategories(apiCategories);
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully!');
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully!');
      setIsAddDialogOpen(false);
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });
  
  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    parentId: string | 'none';
    status: 'active' | 'inactive';
    image: string;
    description: string;
    displayOrder: string;
    isFabric: boolean;
    isUserSpecific: boolean;
    allowedEmails: string;
  }>({
    name: '',
    parentId: 'none',
    status: 'active',
    image: '',
    description: '',
    displayOrder: '',
    isFabric: false,
    isUserSpecific: false,
    allowedEmails: ''
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch full category details when editing
  const { data: fullCategoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['category', editingCategory?.id],
    queryFn: () => categoriesApi.getById(Number(editingCategory?.id)),
    enabled: !!editingCategory?.id && isDialogOpen,
  });

  const handleAddMain = () => {
    setEditingCategory(null);
    setFormData({ name: '', parentId: 'none', status: 'active', image: '', description: '', displayOrder: '', isFabric: false, isUserSpecific: false, allowedEmails: '' });
    setImageFile(null);
    setImagePreview('');
    setIsAddDialogOpen(true);
  };

  const handleAddSub = (parentId: string) => {
    setEditingCategory(null);
    setFormData({ name: '', parentId, status: 'active', image: '', description: '', displayOrder: '', isFabric: false, isUserSpecific: false, allowedEmails: '' });
    setImageFile(null);
    setImagePreview('');
    setIsAddDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsAddDialogOpen(true);
  };

  // Load full category data when editing
  useEffect(() => {
    if (isDialogOpen && editingCategory && fullCategoryData) {
      const hasAllowedEmails = fullCategoryData.allowedEmails && fullCategoryData.allowedEmails.trim().length > 0;
      setFormData({ 
        name: fullCategoryData.name || '', 
        parentId: fullCategoryData.parentId ? String(fullCategoryData.parentId) : 'none', 
        status: fullCategoryData.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
        image: fullCategoryData.image || '',
        description: fullCategoryData.description || '',
        displayOrder: fullCategoryData.displayOrder ? String(fullCategoryData.displayOrder) : '',
        isFabric: fullCategoryData.isFabric || false,
        isUserSpecific: hasAllowedEmails,
        allowedEmails: fullCategoryData.allowedEmails || ''
      });
      setImageFile(null);
      setImagePreview(fullCategoryData.image || '');
    } else if (isDialogOpen && !editingCategory) {
      // Reset form when adding new category
      setFormData({ name: '', parentId: 'none', status: 'active', image: '', description: '', displayOrder: '', isFabric: false, isUserSpecific: false, allowedEmails: '' });
      setImageFile(null);
      setImagePreview('');
    }
  }, [isDialogOpen, editingCategory, fullCategoryData]);
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        console.log('[Category Image] File selected, preview ready');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleImageUpload = async () => {
    if (!imageFile) return;
    
    setIsUploadingImage(true);
    try {
      console.log('[Category Image] Uploading image...');
      const imageUrl = await categoriesApi.uploadImage(imageFile);
      setFormData({ ...formData, image: imageUrl });
      setImagePreview(imageUrl);
      toast.success('Image uploaded successfully!');
      // Clear the file input after successful upload
      setImageFile(null);
    } catch (error: any) {
      console.error('[Category Image] Upload failed:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData({ ...formData, image: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category? This will not affect products assigned to it.')) {
      deleteMutation.mutate(Number(id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    // Upload image if file is selected but not uploaded yet
    let imageUrl = formData.image;
    if (imageFile && !imageUrl) {
      try {
        setIsUploadingImage(true);
        imageUrl = await categoriesApi.uploadImage(imageFile);
        setFormData({ ...formData, image: imageUrl });
      } catch (error: any) {
        toast.error(error.message || 'Failed to upload image');
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    const payload = {
      name: formData.name,
      parentId: formData.parentId === 'none' ? null : Number(formData.parentId),
      status: formData.status.toUpperCase(),
      image: imageUrl || null,
      description: formData.description || null,
      displayOrder: formData.displayOrder ? Number(formData.displayOrder) : null,
      isFabric: formData.isFabric || false,
      allowedEmails: formData.isUserSpecific && formData.allowedEmails.trim() ? formData.allowedEmails.trim() : null,
    };

    if (editingCategory) {
      updateMutation.mutate({ id: Number(editingCategory.id), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getAllParentOptions = () => {
    const options: { id: string, name: string }[] = [];
    const flatten = (list: Category[], level = 0) => {
      list.forEach(c => {
        options.push({ id: c.id, name: `${'— '.repeat(level)}${c.name}` });
        if (c.subcategories) flatten(c.subcategories, level + 1);
      });
    };
    flatten(categories);
    return options;
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subcategories && c.subcategories.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())))
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
          <p className="text-destructive">Failed to load categories. Please try again.</p>
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
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
              Category <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground text-lg">Organize your products with hierarchical categories</p>
          </div>
          <Button onClick={handleAddMain} className="btn-primary gap-2 self-start sm:self-center">
            <Plus className="w-4 h-4" />
            Add Main Category
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="relative max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-primary" />
                Category Hierarchy
              </h2>
              <CategoryTree 
                categories={filteredCategories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddSubcategory={handleAddSub}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
              <h3 className="font-semibold text-primary mb-2">Quick Tip</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You can create up to 3 levels of nested categories. 
                Keep your category structure simple for the best customer experience.
                Changes here will reflect instantly on the storefront.
              </p>
            </div>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="font-cursive text-2xl">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            {isLoadingCategory && editingCategory ? (
              <div className="flex items-center justify-center min-h-[200px] flex-1">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6 py-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Silk Scarves"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Category Image</Label>
                {imagePreview ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <Input
                      ref={fileInputRef}
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => {
                        console.log('[Category Image] Opening file selector...');
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: 800x800px, JPG or PNG
                    </p>
                  </div>
                )}
                {imageFile && !imagePreview && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={isUploadingImage}
                      className="w-full gap-2"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload to Cloudinary
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Category</Label>
                <Select 
                  value={formData.parentId} 
                  onValueChange={(val) => setFormData({ ...formData, parentId: val })}
                  disabled={!!editingCategory}
                >
                  <SelectTrigger id="parentId">
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Main Category)</SelectItem>
                    {getAllParentOptions().map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingCategory && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Parent category cannot be changed after creation.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Category description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  placeholder="e.g. 1, 2, 3..."
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first in category listings
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="isFabric">This is a Fabric Category</Label>
                  <p className="text-xs text-muted-foreground">
                    Products in this category will appear in fabric selection for design products
                  </p>
                </div>
                <Switch
                  id="isFabric"
                  checked={formData.isFabric}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isFabric: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="status">Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive categories won't show on the store
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="isUserSpecific">This category is specific for selected users</Label>
                  <p className="text-xs text-muted-foreground">
                    Restrict this category and all its sub-categories and products to specific users
                  </p>
                </div>
                <Switch
                  id="isUserSpecific"
                  checked={formData.isUserSpecific}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isUserSpecific: checked, allowedEmails: checked ? formData.allowedEmails : '' })
                  }
                />
              </div>

              {formData.isUserSpecific && (
                <div className="space-y-2">
                  <Label htmlFor="allowedEmails">Allowed User Emails</Label>
                  <Textarea
                    id="allowedEmails"
                    placeholder="Enter email addresses separated by commas (e.g., user1@example.com, user2@example.com)"
                    value={formData.allowedEmails}
                    onChange={(e) => setFormData({ ...formData, allowedEmails: e.target.value })}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only logged-in users with these email addresses will be able to see this category, its sub-categories, and products. Leave empty to make it public.
                  </p>
                </div>
              )}

              <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </Button>
                <ButtonWithLoading 
                  type="submit" 
                  className="btn-primary gap-2"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  loadingText={editingCategory ? 'Updating...' : 'Creating...'}
                  minimumDuration={300}
                >
                  <Save className="w-4 h-4" />
                  {editingCategory ? 'Update' : 'Create'} Category
                </ButtonWithLoading>
              </DialogFooter>
            </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;
