import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Save, Upload, IndianRupee, Image as ImageIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductTypeSelector, { ProductType } from '@/components/admin/ProductTypeSelector';
import RichTextEditor from '@/components/admin/RichTextEditor';
import VariantBuilder, { VariantType, VariantCombination } from '@/components/admin/VariantBuilder';
import PlainProductSelector, { PlainProduct } from '@/components/admin/PlainProductSelector';
import { toast } from 'sonner';

// Custom Field Types
export interface CustomField {
  id: string;
  type: 'text' | 'image' | 'input' | 'dropdown';
  label: string;
  value?: string;
  options?: string[];
}

// Detail Section
export interface DetailSection {
  id: string;
  title: string;
  content: string;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  productId?: number | string;
  initialData?: any;
  plainProducts: PlainProduct[];
  categories: Array<{ id: string; name: string; subcategories: Array<{ id: string; name: string }> }>;
  onSave: (data: any) => void;
}

const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  onOpenChange,
  mode,
  productId,
  initialData,
  plainProducts,
  categories,
  onSave,
}) => {
  const [activeType, setActiveType] = useState<ProductType>(initialData?.type || 'PLAIN');
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    subcategoryId: '',
    description: '',
    basePrice: 0,
    pricePerMeter: 0,
    designPrice: 0,
    images: [] as string[],
    digitalFile: null as File | null,
    recommendedPlainProductIds: [] as string[],
    variants: [] as VariantType[],
    combinations: [] as VariantCombination[],
    customFields: [] as CustomField[],
    detailSections: [] as DetailSection[],
    status: 'active' as 'active' | 'inactive',
  });

  // Load initial data when editing
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setActiveType(initialData.type || 'PLAIN');
      setFormData({
        name: initialData.name || '',
        categoryId: initialData.categoryId || '',
        subcategoryId: initialData.subcategoryId || '',
        description: initialData.description || '',
        basePrice: initialData.basePrice || initialData.price || 0,
        pricePerMeter: initialData.pricePerMeter || 0,
        designPrice: initialData.designPrice || 0,
        images: initialData.images || [],
        digitalFile: null,
        recommendedPlainProductIds: initialData.recommendedPlainProductIds || [],
        variants: initialData.variants || [],
        combinations: initialData.combinations || [],
        customFields: initialData.customFields || [],
        detailSections: initialData.detailSections || [],
        status: initialData.status || 'active',
      });
    } else {
      handleResetForm();
    }
  }, [mode, initialData, open]);

  const handleResetForm = () => {
    setFormData({
      name: '',
      categoryId: '',
      subcategoryId: '',
      description: '',
      basePrice: 0,
      pricePerMeter: 0,
      designPrice: 0,
      images: [],
      digitalFile: null,
      recommendedPlainProductIds: [],
      variants: [],
      combinations: [],
      customFields: [],
      detailSections: [],
      status: 'active',
    });
    setActiveType('PLAIN');
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return false;
    }
    if (!formData.categoryId) {
      toast.error('Category is required');
      return false;
    }
    if (activeType === 'PLAIN' && formData.pricePerMeter <= 0) {
      toast.error('Price per meter must be greater than 0');
      return false;
    }
    if (activeType === 'DESIGNED' && formData.designPrice <= 0) {
      toast.error('Design price must be greater than 0');
      return false;
    }
    if (activeType === 'DIGITAL' && formData.basePrice <= 0) {
      toast.error('Price must be greater than 0');
      return false;
    }
    if (activeType === 'DIGITAL' && !formData.digitalFile && mode === 'create') {
      toast.error('Digital file is required');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const payload: any = {
      name: formData.name,
      type: activeType,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId,
      description: formData.description,
      images: formData.images,
      customFields: formData.customFields,
      detailSections: formData.detailSections,
      status: formData.status,
    };

    if (activeType === 'PLAIN') {
      payload.pricePerMeter = formData.pricePerMeter;
      payload.variants = formData.variants;
      payload.variantCombinations = formData.combinations;
    } else if (activeType === 'DESIGNED') {
      payload.designPrice = formData.designPrice;
      payload.recommendedPlainProductIds = formData.recommendedPlainProductIds;
    } else if (activeType === 'DIGITAL') {
      payload.price = formData.basePrice;
      payload.digitalFileUrl = formData.digitalFile ? 'uploaded-file-url' : initialData?.digitalFileUrl || '';
    }

    if (mode === 'edit' && productId) {
      payload.id = productId;
    }

    onSave(payload);
    onOpenChange(false);
    handleResetForm();
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: `cf-${Date.now()}`,
      type: 'text',
      label: '',
      value: '',
    };
    setFormData({ ...formData, customFields: [...formData.customFields, newField] });
  };

  const removeCustomField = (id: string) => {
    setFormData({ ...formData, customFields: formData.customFields.filter(f => f.id !== id) });
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setFormData({
      ...formData,
      customFields: formData.customFields.map(f => f.id === id ? { ...f, ...updates } : f)
    });
  };

  const addDetailSection = () => {
    const newSection: DetailSection = {
      id: `ds-${Date.now()}`,
      title: '',
      content: '',
    };
    setFormData({ ...formData, detailSections: [...formData.detailSections, newSection] });
  };

  const removeDetailSection = (id: string) => {
    setFormData({ ...formData, detailSections: formData.detailSections.filter(s => s.id !== id) });
  };

  const updateDetailSection = (id: string, updates: Partial<DetailSection>) => {
    setFormData({
      ...formData,
      detailSections: formData.detailSections.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) handleResetForm();
    }}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-border flex items-center justify-between">
          <DialogHeader>
            <DialogTitle className="font-cursive text-3xl">
              {mode === 'edit' ? 'Edit Product' : 'Create Product'}
            </DialogTitle>
          </DialogHeader>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-10">
          {/* Step 1: Product Type */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">1</span>
              Product Type
            </div>
            <ProductTypeSelector selected={activeType} onChange={setActiveType} />
          </section>

          {/* Step 2: Basic Info */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">2</span>
              Basic Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="p-name">Product Name</Label>
                <Input 
                  id="p-name" 
                  placeholder="e.g. Premium Silk Fabric" 
                  className="h-11"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-price">
                  {activeType === 'PLAIN' ? 'Price per Meter (₹)' : activeType === 'DESIGNED' ? 'Design Price (₹)' : 'Price (₹)'}
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="p-price" 
                    type="number" 
                    placeholder="0.00" 
                    className="h-11 pl-10"
                    value={activeType === 'PLAIN' ? formData.pricePerMeter : activeType === 'DESIGNED' ? formData.designPrice : formData.basePrice}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      if (activeType === 'PLAIN') {
                        setFormData({ ...formData, pricePerMeter: value });
                      } else if (activeType === 'DESIGNED') {
                        setFormData({ ...formData, designPrice: value });
                      } else {
                        setFormData({ ...formData, basePrice: value });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select 
                  value={formData.subcategoryId} 
                  onValueChange={(v) => setFormData({ ...formData, subcategoryId: v })}
                  disabled={!formData.categoryId}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.find(c => c.id === formData.categoryId)?.subcategories.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product Description</Label>
              <RichTextEditor 
                value={formData.description} 
                onChange={(content) => setFormData({ ...formData, description: content })}
                placeholder="Write rich description with details, care instructions, etc..."
              />
            </div>
          </section>

          {/* Type Specific Sections */}
          <AnimatePresence mode="wait">
            {activeType === 'DESIGNED' && (
              <motion.section
                key="designed-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 pt-6 border-t border-border"
              >
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[10px]">3</span>
                  Recommended Plain Products
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Select Recommended Plain Products (Max 10)</Label>
                    <Badge variant="secondary" className="text-xs">
                      {formData.recommendedPlainProductIds.length} Selected
                    </Badge>
                  </div>
                  <PlainProductSelector 
                    plainProducts={plainProducts}
                    selectedProductIds={formData.recommendedPlainProductIds}
                    onChange={(ids) => setFormData({ ...formData, recommendedPlainProductIds: ids })}
                    maxSelection={10}
                  />
                </div>
              </motion.section>
            )}

            {activeType === 'DIGITAL' && (
              <motion.section
                key="digital-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 pt-6 border-t border-border"
              >
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px]">3</span>
                  Digital Asset
                </div>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-4 hover:bg-muted/30 transition-colors group cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">Upload Digital File</p>
                    <p className="text-xs text-muted-foreground text-center max-w-[200px] mx-auto">
                      PDF, JPG, PNG, or ZIP files supported. Max size 50MB.
                    </p>
                  </div>
                  <input type="file" className="hidden" id="digital-upload" onChange={(e) => setFormData({ ...formData, digitalFile: e.target.files?.[0] || null })} />
                  <Button type="button" variant="outline" onClick={() => document.getElementById('digital-upload')?.click()}>
                    {formData.digitalFile ? formData.digitalFile.name : initialData?.digitalFileUrl ? 'File Uploaded' : 'Choose File'}
                  </Button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Step 4: Variants (Only for Plain products) */}
          {activeType === 'PLAIN' && (
            <section className="space-y-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">3</span>
                Product Variants
              </div>
              <VariantBuilder 
                onChange={(variants, combos) => setFormData({ ...formData, variants, combinations: combos })}
                initialVariants={formData.variants}
                initialCombinations={formData.combinations}
              />
            </section>
          )}

          {/* Step 5: Custom Fields */}
          <section className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">{activeType === 'PLAIN' ? '4' : '4'}</span>
                Custom Fields
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                <Plus className="w-4 h-4 mr-1" />
                Add Field
              </Button>
            </div>
            <div className="space-y-4">
              {formData.customFields.map((field) => (
                <div key={field.id} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Custom Field</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomField(field.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Field Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value: CustomField['type']) => updateCustomField(field.id, { type: value })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="input">Input</SelectItem>
                          <SelectItem value="dropdown">Dropdown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                        placeholder="e.g. Material"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input
                      value={field.value || ''}
                      onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                      placeholder="Enter value"
                      className="h-9"
                    />
                  </div>
                </div>
              ))}
              {formData.customFields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No custom fields added. Click "Add Field" to create one.
                </p>
              )}
            </div>
          </section>

          {/* Step 6: Detail Sections */}
          <section className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">5</span>
                Detail Sections
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addDetailSection}>
                <Plus className="w-4 h-4 mr-1" />
                Add Section
              </Button>
            </div>
            <div className="space-y-4">
              {formData.detailSections.map((section) => (
                <div key={section.id} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Detail Section</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDetailSection(section.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={section.title}
                      onChange={(e) => updateDetailSection(section.id, { title: e.target.value })}
                      placeholder="e.g. Product Details"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Content</Label>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateDetailSection(section.id, { content: e.target.value })}
                      placeholder="Enter section content..."
                      className="w-full min-h-[100px] p-3 border border-border rounded-lg resize-y"
                    />
                  </div>
                </div>
              ))}
              {formData.detailSections.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No detail sections added. Click "Add Section" to create one.
                </p>
              )}
            </div>
          </section>

          {/* Step 7: Images */}
          <section className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">6</span>
              Product Gallery
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                  <img src={image} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) })}
                    className="absolute top-1 right-1 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setFormData({ ...formData, images: [...formData.images, event.target?.result as string] });
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
                className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-muted/30 transition-colors group"
              >
                <ImageIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Add Image</span>
              </button>
            </div>
          </section>

          {/* Step 8: Status */}
          <section className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">7</span>
              Product Status
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <Label className="text-base font-medium">Product Status</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.status === 'active' ? 'Product will be visible to customers' : 'Product will be hidden from customers'}
                </p>
              </div>
              <Switch
                checked={formData.status === 'active'}
                onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
              />
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-border flex items-center justify-between shadow-up">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2 h-11 px-6">
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button className="btn-primary gap-2 h-11 px-8" onClick={handleSubmit}>
            <Save className="w-4 h-4" />
            {mode === 'edit' ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
