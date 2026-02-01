import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { ButtonWithLoading } from '@/components/ui/ButtonWithLoading';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
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
import { Category } from '@/components/admin/CategoryTree';

const AdminCategoryForm = () => {
  const { id, parentId } = useParams<{ id?: string; parentId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const initialParentId = parentId || 'none';

  const [formData, setFormData] = useState({
    name: '',
    parentId: initialParentId,
    status: 'active' as 'active' | 'inactive',
    image: '',
    description: '',
    displayOrder: '',
    isFabric: false,
    isUserSpecific: false,
    allowedEmails: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all categories for parent dropdown (admin API includes personalised)
  const { data: apiCategories = [] } = useQuery({
    queryKey: ['categories', 'admin'],
    queryFn: () => categoriesApi.getAllAdmin(),
  });

  const transformCategories = (cats: any[]): Category[] =>
    cats.map((c: any) => ({
      id: String(c.id),
      name: c.name,
      parentId: c.parentId ? String(c.parentId) : null,
      status: c.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
      subcategories: c.subcategories ? transformCategories(c.subcategories) : [],
    } as Category));
  const categories = transformCategories(apiCategories);

  // Fetch full category when editing
  const { data: fullCategoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesApi.getById(Number(id)),
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    if (parentId && !isEdit) {
      setFormData((prev) => ({ ...prev, parentId }));
    }
  }, [parentId, isEdit]);

  useEffect(() => {
    if (isEdit && fullCategoryData) {
      const hasAllowedEmails = fullCategoryData.allowedEmails?.trim().length > 0;
      setFormData({
        name: fullCategoryData.name || '',
        parentId: fullCategoryData.parentId ? String(fullCategoryData.parentId) : 'none',
        status: (fullCategoryData.status?.toLowerCase() === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        image: fullCategoryData.image || '',
        description: fullCategoryData.description || '',
        displayOrder: fullCategoryData.displayOrder ? String(fullCategoryData.displayOrder) : '',
        isFabric: fullCategoryData.isFabric || false,
        isUserSpecific: !!hasAllowedEmails,
        allowedEmails: fullCategoryData.allowedEmails || '',
      });
      setImagePreview(fullCategoryData.image || '');
    }
  }, [isEdit, fullCategoryData]);

  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully!');
      navigate('/admin-sara/categories');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id: catId, data }: { id: number; data: any }) => categoriesApi.update(catId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully!');
      navigate('/admin-sara/categories');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update category'),
  });

  const getAllParentOptions = () => {
    const options: { id: string; name: string }[] = [];
    const flatten = (list: Category[], level = 0) => {
      list.forEach((c) => {
        if (isEdit && c.id === id) return;
        options.push({ id: c.id, name: '— '.repeat(level) + c.name });
        if (c.subcategories) flatten(c.subcategories, level + 1);
      });
    };
    flatten(categories);
    return options;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview('');
      setIsPreviewLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsPreviewLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    setIsUploadingImage(true);
    try {
      const imageUrl = await categoriesApi.uploadImage(imageFile);
      setFormData((prev) => ({ ...prev, image: imageUrl }));
      setImagePreview(imageUrl);
      toast.success('Image uploaded successfully!');
      setImageFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData((prev) => ({ ...prev, image: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let imageUrl = formData.image;
    if (imageFile && !imageUrl) {
      try {
        setIsUploadingImage(true);
        imageUrl = await categoriesApi.uploadImage(imageFile);
        setFormData((prev) => ({ ...prev, image: imageUrl }));
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
      isFabric: formData.isFabric,
      allowedEmails: formData.isUserSpecific && formData.allowedEmails.trim() ? formData.allowedEmails.trim() : null,
    };

    if (isEdit && id) {
      updateMutation.mutate({ id: Number(id), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingCategory) {
    return (
      <AdminLayout>
        <div className="flex justify-center min-h-[400px] items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" className="gap-2 -ml-2" onClick={() => navigate('/admin-sara/categories')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Categories
        </Button>

        <div className="relative bg-card rounded-xl border border-border p-6 sm:p-8">
          <h1 className="font-cursive text-2xl sm:text-3xl font-bold mb-6">
            {isEdit ? 'Edit Category' : 'Add New Category'}
          </h1>

          {isPending && (
            <div className="absolute inset-0 bg-background/80 z-20 flex items-center justify-center gap-3 rounded-xl">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <span className="text-sm font-medium">{isEdit ? 'Updating...' : 'Creating...'}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g. Silk Scarves"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="image">Category Image</Label>
              {(imagePreview || imageFile || isPreviewLoading) ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-lg border border-border overflow-hidden min-h-[12rem] bg-muted/30"
                >
                  {isPreviewLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[12rem] gap-2 text-muted-foreground">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <span className="text-sm">Loading preview...</span>
                    </div>
                  ) : imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                        disabled={isUploadingImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : null}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2 z-10">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <span className="text-sm font-medium">Uploading image...</span>
                    </div>
                  )}
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
                  <Button type="button" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">Recommended: 800x800px, JPG or PNG</p>
                </div>
              )}
              {imageFile && imagePreview && !isUploadingImage && (
                <Button type="button" onClick={handleImageUpload} className="w-full gap-2 mt-2">
                  <Upload className="w-4 h-4" />
                  Upload to Cloudinary
                </Button>
              )}
              {imageFile && imagePreview && isUploadingImage && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>Uploading image...</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Category</Label>
              <Select
                value={formData.parentId}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, parentId: val }))}
                disabled={isEdit}
              >
                <SelectTrigger id="parentId">
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Main Category)</SelectItem>
                  {getAllParentOptions().map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEdit && (
                <p className="text-[10px] text-muted-foreground mt-1">Parent category cannot be changed after creation.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Category description (optional)"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
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
                onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first in category listings</p>
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
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFabric: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="status">Status</Label>
                <p className="text-xs text-muted-foreground">Inactive categories won&apos;t show on the store</p>
              </div>
              <Switch
                id="status"
                checked={formData.status === 'active'}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, status: checked ? 'active' : 'inactive' }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="isUserSpecific">This category is specific for selected users</Label>
                <p className="text-xs text-muted-foreground">
                  {formData.parentId !== null 
                    ? 'Subcategories automatically inherit parent category permissions' 
                    : 'Restrict this category and all its sub-categories and products to specific users'}
                </p>
              </div>
              <Switch
                id="isUserSpecific"
                checked={formData.isUserSpecific}
                disabled={formData.parentId !== null}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    isUserSpecific: checked,
                    allowedEmails: checked ? prev.allowedEmails : '',
                  }))
                }
              />
            </div>

            {formData.isUserSpecific && formData.parentId === null && (
              <div className="space-y-2">
                <Label htmlFor="allowedEmails">Allowed User Emails</Label>
                <Textarea
                  id="allowedEmails"
                  placeholder="Enter email addresses separated by commas"
                  value={formData.allowedEmails}
                  onChange={(e) => setFormData((prev) => ({ ...prev, allowedEmails: e.target.value }))}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Only logged-in users with these email addresses will be able to see this category and all its subcategories.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate('/admin-sara/categories')} disabled={isPending}>
                Cancel
              </Button>
              <ButtonWithLoading
                type="submit"
                className="btn-primary gap-2"
                isLoading={isPending}
                loadingText={isEdit ? 'Updating...' : 'Creating...'}
                minimumDuration={300}
              >
                <Save className="w-4 h-4" />
                {isEdit ? 'Update' : 'Create'} Category
              </ButtonWithLoading>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCategoryForm;
