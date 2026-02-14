import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Save, Upload, IndianRupee, Image as ImageIcon, Plus, Video, Loader2, Trash2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ProductTypeSelector, { ProductType } from '@/components/admin/ProductTypeSelector';
import RichTextEditor from '@/components/admin/RichTextEditor';
import PlainProductSelector, { PlainProduct } from '@/components/admin/PlainProductSelector';
import { toast } from 'sonner';
import { productsApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

// Sortable Variant Item Component
interface SortableVariantItemProps {
  id: string;
  children: React.ReactNode;
}

const SortableVariantItem: React.FC<SortableVariantItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-0 top-0 bottom-0 flex items-center cursor-grab active:cursor-grabbing z-10 p-2 text-muted-foreground hover:text-foreground">
        <GripVertical className="w-5 h-5" {...attributes} {...listeners} />
      </div>
      <div className="pl-8">
        {children}
      </div>
    </div>
  );
};

// Sortable Option Item Component
interface SortableOptionItemProps {
  id: string;
  children: React.ReactNode;
}

const SortableOptionItem: React.FC<SortableOptionItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-0 top-0 bottom-0 flex items-center cursor-grab active:cursor-grabbing z-10 p-1 text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" {...attributes} {...listeners} />
      </div>
      <div className="pl-6">
        {children}
      </div>
    </div>
  );
};

// Sortable Detail Section Item
const SortableDetailSectionItem: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-0 top-0 bottom-0 flex items-center cursor-grab active:cursor-grabbing z-10 p-2 text-muted-foreground hover:text-foreground">
        <GripVertical className="w-5 h-5" {...attributes} {...listeners} />
      </div>
      <div className="pl-8">{children}</div>
    </div>
  );
};

// Sortable Custom Field Item
const SortableCustomFieldItem: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-0 top-0 bottom-0 flex items-center cursor-grab active:cursor-grabbing z-10 p-2 text-muted-foreground hover:text-foreground">
        <GripVertical className="w-5 h-5" {...attributes} {...listeners} />
      </div>
      <div className="pl-8">{children}</div>
    </div>
  );
};

// Media Upload Component
const MediaUploadSection: React.FC<{
  media: Array<{ url: string; type: 'image' | 'video'; displayOrder: number }>;
  onMediaChange: (media: Array<{ url: string; type: 'image' | 'video'; displayOrder: number }>) => void;
}> = ({ media, onMediaChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      console.log('[Product Media] Uploading', files.length, 'files...');
      const uploadedFiles = await productsApi.uploadMedia(files, 'products');
      
      const newMedia = uploadedFiles.map((file: any, idx: number) => ({
        url: file.url,
        type: file.type === 'video' ? 'video' as const : 'image' as const,
        displayOrder: media.length + idx
      }));
      
      onMediaChange([...media, ...newMedia]);
      toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`);
    } catch (error: any) {
      console.error('[Product Media] Upload failed:', error);
      toast.error(error.message || 'Failed to upload media');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index).map((m, idx) => ({
      ...m,
      displayOrder: idx
    }));
    onMediaChange(newMedia);
  };

  const moveMedia = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === media.length - 1)) {
      return;
    }
    const newMedia = [...media];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newMedia[index], newMedia[newIndex]] = [newMedia[newIndex], newMedia[index]];
    newMedia.forEach((m, idx) => m.displayOrder = idx);
    onMediaChange(newMedia);
  };

  return (
    <section className="space-y-6 pt-6 border-t border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">6</span>
          Product Gallery (Images & Videos)
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Media
            </>
          )}
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {media.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-square rounded-xl overflow-hidden border border-border group"
          >
            {item.type === 'video' ? (
              <video
                src={item.url}
                className="w-full h-full object-cover"
                controls={false}
                muted
                playsInline
              />
            ) : (
              <img 
                src={item.url} 
                alt={`Product media ${index + 1}`} 
                className="w-full h-full object-cover" 
              />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-1">
              <button
                onClick={() => moveMedia(index, 'up')}
                disabled={index === 0}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-white/90 rounded flex items-center justify-center disabled:opacity-30 text-xs"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => removeMedia(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
              <button
                onClick={() => moveMedia(index, 'down')}
                disabled={index === media.length - 1}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-white/90 rounded flex items-center justify-center disabled:opacity-30 text-xs"
                title="Move down"
              >
                ↓
              </button>
            </div>
            <div className="absolute top-1 left-1">
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {item.type === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
              </Badge>
            </div>
          </motion.div>
        ))}
        
        <motion.button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-muted/30 transition-colors group disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          ) : (
            <>
              <ImageIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Add Media</span>
              <span className="text-[9px] text-muted-foreground">Images & Videos</span>
            </>
          )}
        </motion.button>
      </div>
      <p className="text-xs text-muted-foreground">
        Upload multiple images and videos at once. Drag to reorder. First item will be the main image.
      </p>
    </section>
  );
};

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
    basePrice: '' as string | number,
    pricePerMeter: '' as string | number,
    designPrice: '' as string | number,
    unitExtension: 'per meter' as string,
    unitExtensionType: 'per meter' as 'per meter' | 'per piece' | 'per yard' | 'custom',
    unitExtensionCustom: '' as string,
    gstRate: '' as string | number,
    hsnCode: '',
    images: [] as string[], // Deprecated - use media
    media: [] as Array<{ url: string; type: 'image' | 'video'; displayOrder: number }>,
    digitalFile: null as File | null,
    plainProductId: null as string | null,
    recommendedPlainProductIds: [] as string[],
    pricingSlabs: [] as Array<{ id?: string; minQuantity: number; maxQuantity: number | null; discountType: 'FIXED_AMOUNT' | 'PERCENTAGE'; discountValue: number; pricePerMeter?: number; displayOrder: number }>,
    detailSections: [] as DetailSection[],
    customFields: [] as Array<{
      id: string;
      label: string;
      fieldType: string;
      placeholder: string;
      isRequired: boolean;
    }>,
    variants: [] as Array<{
      id: string;
      name: string;
      type: string;
      unit: string;
      displayOrder: number;
      options: Array<{ id: string; value: string; priceModifier: number; displayOrder: number }>;
    }>,
    status: 'active' as 'active' | 'inactive',
  });

  // Error state for real-time validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Upload state for digital files
  const [isUploadingDigitalFile, setIsUploadingDigitalFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDigitalFileUrl, setUploadedDigitalFileUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  // Fetch full product details when editing (admin endpoint to include all nested data)
  const { data: fullProductData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', 'admin', productId],
    queryFn: () => productsApi.getByIdAdmin(Number(productId)),
    enabled: mode === 'edit' && !!productId && open,
  });

  // Load initial data when editing
  useEffect(() => {
    if (mode === 'edit' && open) {
      // Use full product data if available, otherwise fallback to initialData
      const productData = fullProductData || initialData;
      
      if (productData) {
        setActiveType(productData.type || 'PLAIN');
        setFormData({
          name: productData.name || '',
          categoryId: productData.categoryId ? String(productData.categoryId) : '',
          subcategoryId: productData.subcategoryId ? String(productData.subcategoryId) : '',
          description: productData.description || '',
          basePrice: productData.basePrice || productData.price || 0,
          pricePerMeter: productData.pricePerMeter ?? productData.price ?? 0,
          designPrice: productData.designPrice || 0,
          unitExtension: productData.plainProduct?.unitExtension || productData.unitExtension || 'per meter',
          unitExtensionType: (() => {
            const unit = productData.plainProduct?.unitExtension || productData.unitExtension || 'per meter';
            if (unit === 'per meter' || unit === 'per piece' || unit === 'per yard') return unit;
            return 'custom';
          })() as 'per meter' | 'per piece' | 'per yard' | 'custom',
          unitExtensionCustom: (() => {
            const unit = productData.plainProduct?.unitExtension || productData.unitExtension || 'per meter';
            if (unit !== 'per meter' && unit !== 'per piece' && unit !== 'per yard') return unit;
            return '';
          })(),
          gstRate: productData.gstRate ?? 0,
          hsnCode: productData.hsnCode || '',
          images: productData.images || [],
          media: productData.media || (productData.images ? productData.images.map((url: string, idx: number) => ({ url, type: 'image' as const, displayOrder: idx })) : []),
          digitalFile: null,
          plainProductId: productData.plainProductId ? String(productData.plainProductId) : null,
          recommendedPlainProductIds: productData.recommendedPlainProductIds ? productData.recommendedPlainProductIds.map((id: any) => String(id)) : [],
          pricingSlabs: productData.pricingSlabs ? productData.pricingSlabs.map((slab: any, idx: number) => ({
            id: `slab-${slab.id || idx}`,
            minQuantity: slab.minQuantity || 1,
            maxQuantity: slab.maxQuantity || null,
            discountType: (slab.discountType || 'FIXED_AMOUNT') as 'FIXED_AMOUNT' | 'PERCENTAGE',
            discountValue: slab.discountValue || slab.pricePerMeter || 0, // Support legacy pricePerMeter
            pricePerMeter: slab.pricePerMeter, // Keep for legacy support
            displayOrder: slab.displayOrder !== undefined ? slab.displayOrder : idx,
          })) : [],
          detailSections: (productData.detailSections || []).map((section: any, idx: number) => ({
            id: `ds-${section.id || idx}`,
            title: section.title || '',
            content: section.content || '',
          })),
          customFields: (productData.customFields || []).map((field: any, idx: number) => ({
            id: `cf-${field.id || idx}`,
            label: field.label || '',
            fieldType: field.fieldType || 'text',
            placeholder: field.placeholder || '',
            isRequired: typeof field.isRequired === 'boolean' ? field.isRequired : !!field.required,
          })),
          variants: (productData.variants || []).map((v: any, idx: number) => ({
            id: `v-${v.id || idx}`,
            name: v.name || '',
            type: v.type || '',
            unit: v.unit || '',
            displayOrder: v.displayOrder !== undefined ? v.displayOrder : idx,
            options: (v.options || []).map((opt: any, optIdx: number) => ({
              id: `vo-${opt.id || optIdx}`,
              value: opt.value || '',
              priceModifier: opt.priceModifier || 0,
              displayOrder: opt.displayOrder !== undefined ? opt.displayOrder : optIdx,
            })),
          })),
          status: productData.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
        });
        
        // Set uploaded file URL if editing digital product
        if (productData.type === 'DIGITAL' && productData.fileUrl) {
          setUploadedDigitalFileUrl(productData.fileUrl);
        }
      }
    } else if (mode === 'create' || !open) {
      handleResetForm();
    }
  }, [mode, initialData, fullProductData, open, productId]);

  const handleResetForm = () => {
    setFormData({
      name: '',
      categoryId: '',
      subcategoryId: '',
      description: '',
      basePrice: '' as string | number,
      pricePerMeter: '' as string | number,
      designPrice: '' as string | number,
      unitExtension: 'per meter' as string,
      unitExtensionType: 'per meter' as 'per meter' | 'per piece' | 'per yard' | 'custom',
      unitExtensionCustom: '' as string,
      gstRate: '' as string | number,
      hsnCode: '',
      images: [],
      media: [],
      digitalFile: null,
      plainProductId: null,
      recommendedPlainProductIds: [],
      pricingSlabs: [] as Array<{ id?: string; minQuantity: number; maxQuantity: number | null; discountType: 'FIXED_AMOUNT' | 'PERCENTAGE'; discountValue: number; pricePerMeter?: number; displayOrder: number }>,
      detailSections: [],
      customFields: [],
      variants: [],
      status: 'active',
    });
    setActiveType('PLAIN');
    setUploadedDigitalFileUrl('');
    setUploadError('');
    setIsUploadingDigitalFile(false);
    setUploadProgress(0);
  };

  // Automatic upload handler for digital files
  const handleDigitalFileChange = async (file: File | null) => {
    if (!file) {
      setFormData({ ...formData, digitalFile: null });
      setUploadedDigitalFileUrl('');
      setUploadError('');
      return;
    }

    // Validate file size (50MB for local storage)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size exceeds 50MB limit for local storage.');
      toast.error('File size exceeds 50MB limit for local storage.');
      return;
    }

    // Start automatic upload
    setFormData({ ...formData, digitalFile: file });
    setIsUploadingDigitalFile(true);
    setUploadProgress(0);
    setUploadError('');

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    toast.loading('Uploading digital file to S3...', { id: 'digital-upload' });

    try {
      const productName = formData.name?.trim() || '';
      const uploadResult = await productsApi.uploadDigitalFile(file, productName);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadResult && uploadResult.success && uploadResult.downloadUrl) {
        // Store just the S3 URL — that's all we need
        setUploadedDigitalFileUrl(uploadResult.downloadUrl);
        toast.success('Digital file uploaded to S3!', { id: 'digital-upload' });
      } else {
        throw new Error('Upload failed: No download URL returned');
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      
      console.error('Digital file upload error:', error);
      const errorMessage = error.message || 'Failed to upload digital file';
      
      setUploadError(errorMessage);
      toast.error(errorMessage, { id: 'digital-upload', duration: 5000 });
      setUploadedDigitalFileUrl('');
    } finally {
      setIsUploadingDigitalFile(false);
      setUploadProgress(0);
    }
  };

  // Real-time validation function
  const validateField = (fieldName: string, value: any): string => {
    switch (fieldName) {
      case 'name':
        if (!value?.toString().trim()) {
          return 'Product name is required';
        }
        return '';
      case 'categoryId':
        if (!value) {
          return 'Please select a category';
        }
        return '';
      case 'pricePerMeter':
        if (activeType === 'PLAIN') {
          const num = typeof value === 'string' ? parseFloat(value) : Number(value);
          if (!value || isNaN(num) || num <= 0) {
            return 'Price per meter must be greater than 0';
          }
        }
        return '';
      case 'designPrice':
        if (activeType === 'DESIGNED') {
          const num = typeof value === 'string' ? parseFloat(value) : Number(value);
          if (!value || isNaN(num) || num <= 0) {
            return 'Print price must be greater than 0';
          }
        }
        return '';
      case 'basePrice':
        if (activeType === 'DIGITAL') {
          const num = typeof value === 'string' ? parseFloat(value) : Number(value);
          if (!value || isNaN(num) || num <= 0) {
            return 'Price must be greater than 0';
          }
        }
        return '';
      case 'digitalFile':
        if (activeType === 'DIGITAL' && mode === 'create' && !uploadedDigitalFileUrl) {
          return 'Digital file is required. Please upload a file.';
        }
        return '';
      default:
        // Handle pricing slab validation
        if (fieldName.startsWith('pricingSlab_')) {
          const parts = fieldName.split('_');
          if (parts.length >= 3) {
            const index = parseInt(parts[1]);
            const field = parts[2];
            if (field === 'discountValue') {
              if (value === undefined || value === null || value < 0) {
                return 'Discount value must be 0 or greater';
              }
            } else if (field === 'discountType') {
              if (!value || (value !== 'FIXED_AMOUNT' && value !== 'PERCENTAGE')) {
                return 'Discount type is required';
              }
            } else if (field === 'minQuantity') {
              if (value === undefined || value === null || value < 1) {
                return 'Min quantity must be at least 1';
              }
            } else if (field === 'maxQuantity') {
              // maxQuantity can be null, but if set, must be >= minQuantity
              if (value !== null && value !== undefined) {
                const slab = formData.pricingSlabs?.[index];
                if (slab && slab.minQuantity && value < slab.minQuantity) {
                  return 'Max quantity must be greater than min quantity';
                }
              }
            }
          }
        }
        return '';
    }
  };


  // Handle field blur for validation
  const handleBlur = (fieldName: string, value: any) => {
    setTouched({ ...touched, [fieldName]: true });
    const error = validateField(fieldName, value);
    setErrors({ ...errors, [fieldName]: error });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate all fields
    newErrors.name = validateField('name', formData.name);
    newErrors.categoryId = validateField('categoryId', formData.categoryId);
    newErrors.pricePerMeter = validateField('pricePerMeter', formData.pricePerMeter);
    newErrors.designPrice = validateField('designPrice', formData.designPrice);
    newErrors.basePrice = validateField('basePrice', formData.basePrice);
    newErrors.digitalFile = validateField('digitalFile', formData.digitalFile);

    // Validate pricing slabs for DESIGNED products
    if (activeType === 'DESIGNED' && formData.pricingSlabs && formData.pricingSlabs.length > 0) {
      formData.pricingSlabs.forEach((slab, index) => {
        if (!slab.discountType || (slab.discountType !== 'FIXED_AMOUNT' && slab.discountType !== 'PERCENTAGE')) {
          newErrors[`pricingSlab_${index}_discountType`] = 'Discount type is required';
        }
        if (slab.discountValue === undefined || slab.discountValue === null || slab.discountValue < 0) {
          newErrors[`pricingSlab_${index}_discountValue`] = 'Discount value must be 0 or greater';
        }
        if (slab.minQuantity === undefined || slab.minQuantity < 1) {
          newErrors[`pricingSlab_${index}_minQuantity`] = 'Min quantity must be at least 1';
        }
        if (slab.maxQuantity !== null && slab.maxQuantity !== undefined && slab.maxQuantity < slab.minQuantity) {
          newErrors[`pricingSlab_${index}_maxQuantity`] = 'Max quantity must be greater than min quantity';
        }
      });
    }

    setErrors(newErrors);
    setTouched({
      name: true,
      categoryId: true,
      pricePerMeter: true,
      designPrice: true,
      basePrice: true,
      digitalFile: true,
    });

    const hasErrors = Object.values(newErrors).some(err => err !== '');
    if (hasErrors) {
      toast.error('Please fix the errors in the form');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    // Mark all fields as touched to show all errors
    setTouched({
      name: true,
      categoryId: true,
      pricePerMeter: true,
      designPrice: true,
      basePrice: true,
      digitalFile: true,
    });

    // Validate form - prevent submission if errors exist
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // For digital products, uploadedDigitalFileUrl is already the S3 URL
    const fileUrl = (activeType === 'DIGITAL') ? uploadedDigitalFileUrl : '';

    const payload: any = {
      name: formData.name,
      type: activeType,
      categoryId: formData.categoryId ? Number(formData.categoryId) : null,
      description: formData.description,
      images: formData.media.map(m => m.url), // For backward compatibility
      media: formData.media.map((m, idx) => ({
        url: m.url,
        type: m.type,
        displayOrder: m.displayOrder !== undefined ? m.displayOrder : idx
      })),
      detailSections: formData.detailSections,
      customFields: formData.customFields.map(field => ({
        label: field.label,
        fieldType: field.fieldType,
        placeholder: field.placeholder,
        isRequired: field.isRequired
      })),
      variants: formData.variants.map((variant, idx) => ({
        name: variant.name,
        type: variant.type,
        unit: variant.unit,
        displayOrder: variant.displayOrder !== undefined ? variant.displayOrder : idx,
        options: variant.options.map((opt, optIdx) => ({
          value: opt.value,
          priceModifier: opt.priceModifier,
          displayOrder: opt.displayOrder !== undefined ? opt.displayOrder : optIdx
        }))
      })),
      status: formData.status,
    };

    // Keep a single selling price and mirror it to originalPrice for backend
    if (activeType === 'PLAIN') {
      const sellingPrice = formData.pricePerMeter;
      // Determine unit extension value
      const unitExtensionValue = formData.unitExtensionType === 'custom' 
        ? formData.unitExtensionCustom 
        : formData.unitExtensionType;
      
      payload.plainProductId = formData.plainProductId || null;
      payload.price = sellingPrice;
      payload.pricePerMeter = sellingPrice;
      payload.originalPrice = sellingPrice;
      payload.unitExtension = unitExtensionValue || 'per meter';
    } else if (activeType === 'DESIGNED') {
      const sellingPrice = formData.designPrice ?? formData.basePrice;
      payload.designPrice = formData.designPrice;
      payload.price = sellingPrice;
      payload.originalPrice = sellingPrice;
      payload.recommendedPlainProductIds = formData.recommendedPlainProductIds;
      // Add pricing slabs
      if (formData.pricingSlabs && formData.pricingSlabs.length > 0) {
        payload.pricingSlabs = formData.pricingSlabs.map(slab => {
          // Ensure required fields are present
          const discountType = slab.discountType || 'FIXED_AMOUNT';
          const discountValue = slab.discountValue !== undefined && slab.discountValue !== null ? slab.discountValue : 0;
          
          return {
            minQuantity: slab.minQuantity,
            maxQuantity: slab.maxQuantity,
            discountType: discountType,
            discountValue: discountValue,
            displayOrder: slab.displayOrder || 0
          };
        });
      }
    } else if (activeType === 'DIGITAL') {
      const sellingPrice = formData.basePrice;
      payload.price = sellingPrice;
      payload.originalPrice = sellingPrice;
      payload.fileUrl = fileUrl; // S3 download URL
    }

    // Add GST rate
    if (formData.gstRate !== '' && formData.gstRate !== null && formData.gstRate !== undefined) {
      payload.gstRate = Number(formData.gstRate);
    }
    
    // Add HSN code
    if (formData.hsnCode) {
      payload.hsnCode = formData.hsnCode;
    }

    if (mode === 'edit' && productId) {
      payload.id = productId;
    }

    // Call onSave - parent component will handle API call and errors
    try {
      onSave(payload);
      // Don't close dialog immediately - let parent handle success/error
      // Dialog will close on success via parent component
    } catch (error: any) {
      // Error handling is done in parent component's mutation
      console.error('Error submitting product:', error);
    }
  };

  const addPricingSlab = () => {
    const newSlab = {
      id: `slab-${Date.now()}`,
      minQuantity: (formData.pricingSlabs && formData.pricingSlabs.length > 0)
        ? ((formData.pricingSlabs[formData.pricingSlabs.length - 1].maxQuantity || formData.pricingSlabs[formData.pricingSlabs.length - 1].minQuantity) + 1)
        : 1,
      maxQuantity: null as number | null,
      discountType: 'FIXED_AMOUNT' as 'FIXED_AMOUNT' | 'PERCENTAGE',
      discountValue: 0,
      displayOrder: (formData.pricingSlabs || []).length,
    };
    setFormData({ ...formData, pricingSlabs: [...(formData.pricingSlabs || []), newSlab] });
  };

  const removePricingSlab = (id: string) => {
    setFormData({
      ...formData,
      pricingSlabs: (formData.pricingSlabs || []).filter(slab => slab.id !== id).map((slab, idx) => ({ ...slab, displayOrder: idx }))
    });
  };

  const updatePricingSlab = (id: string, field: string, value: any) => {
    setFormData({
      ...formData,
      pricingSlabs: (formData.pricingSlabs || []).map(slab =>
        slab.id === id ? { ...slab, [field]: value } : slab
      )
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

  // Custom Fields helpers
  const addCustomField = () => {
    const newField = {
      id: `cf-${Date.now()}`,
      label: '',
      fieldType: 'text',
      placeholder: '',
      isRequired: false,
    };
    setFormData({ ...formData, customFields: [...formData.customFields, newField] });
  };

  const removeCustomField = (id: string) => {
    setFormData({ ...formData, customFields: formData.customFields.filter(f => f.id !== id) });
  };

  const updateCustomField = (id: string, updates: Partial<typeof formData.customFields[0]>) => {
    setFormData({
      ...formData,
      customFields: formData.customFields.map(f => f.id === id ? { ...f, ...updates } : f)
    });
  };

  // Variants helpers
  const addVariant = () => {
    const newVariant = {
      id: `v-${Date.now()}`,
      name: '',
      type: '',
      unit: '',
      displayOrder: formData.variants.length,
      options: [],
    };
    setFormData({ ...formData, variants: [...formData.variants, newVariant] });
  };
  
  // Drag and drop handlers for variants
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleVariantDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.variants.findIndex((v) => v.id === active.id);
        const newIndex = prev.variants.findIndex((v) => v.id === over.id);

        const newVariants = arrayMove(prev.variants, oldIndex, newIndex);
        // Update displayOrder values
        const updatedVariants = newVariants.map((v, idx) => ({
          ...v,
          displayOrder: idx,
        }));

        return {
          ...prev,
          variants: updatedVariants,
        };
      });
    }
  };
  
  const handleDetailSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.detailSections.findIndex((s) => s.id === active.id);
        const newIndex = prev.detailSections.findIndex((s) => s.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const reordered = arrayMove(prev.detailSections, oldIndex, newIndex);
        return { ...prev, detailSections: reordered };
      });
    }
  };

  const handleCustomFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.customFields.findIndex((f) => f.id === active.id);
        const newIndex = prev.customFields.findIndex((f) => f.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const reordered = arrayMove(prev.customFields, oldIndex, newIndex);
        return { ...prev, customFields: reordered };
      });
    }
  };

  const handleOptionDragEnd = (event: DragEndEvent, variantId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const variant = prev.variants.find((v) => v.id === variantId);
        if (!variant) return prev;

        const oldIndex = variant.options.findIndex((opt) => opt.id === active.id);
        const newIndex = variant.options.findIndex((opt) => opt.id === over.id);

        const newOptions = arrayMove(variant.options, oldIndex, newIndex);
        // Update displayOrder values
        const updatedOptions = newOptions.map((opt, idx) => ({
          ...opt,
          displayOrder: idx,
        }));

        return {
          ...prev,
          variants: prev.variants.map((v) =>
            v.id === variantId
              ? { ...v, options: updatedOptions }
              : v
          ),
        };
      });
    }
  };

  const removeVariant = (id: string) => {
    setFormData({ ...formData, variants: formData.variants.filter(v => v.id !== id) });
  };

  const updateVariant = (id: string, updates: Partial<typeof formData.variants[0]>) => {
    setFormData({
      ...formData,
      variants: formData.variants.map(v => v.id === id ? { ...v, ...updates } : v)
    });
  };

  const addVariantOption = (variantId: string) => {
    setFormData({
      ...formData,
      variants: formData.variants.map(v =>
        v.id === variantId
          ? { 
              ...v, 
              options: [...v.options, { 
                id: `vo-${Date.now()}`, 
                value: '', 
                priceModifier: 0,
                displayOrder: v.options.length
              }] 
            }
          : v
      )
    });
  };

  const removeVariantOption = (variantId: string, optionId: string) => {
    setFormData({
      ...formData,
      variants: formData.variants.map(v =>
        v.id === variantId
          ? { ...v, options: v.options.filter(o => o.id !== optionId) }
          : v
      )
    });
  };

  const updateVariantOption = (variantId: string, optionId: string, updates: Partial<{ value: string; priceModifier: number }>) => {
    setFormData({
      ...formData,
      variants: formData.variants.map(v =>
        v.id === variantId
          ? {
              ...v,
              options: v.options.map(o => o.id === optionId ? { ...o, ...updates } : o)
            }
          : v
      )
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) handleResetForm();
    }}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 gap-0 border-none shadow-2xl flex flex-col">
        {mode === 'edit' && isLoadingProduct ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <DialogHeader>
                <DialogTitle className="font-cursive text-3xl">
                  {mode === 'edit' ? 'Edit Product' : 'Create Product'}
                </DialogTitle>
                <DialogDescription>
                  {mode === 'edit' ? 'Update product details and settings' : 'Fill in the details to create a new product'}
                </DialogDescription>
              </DialogHeader>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

        <div className="p-6 space-y-10 overflow-y-auto flex-1">
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
                <Label htmlFor="p-name">Product Name *</Label>
                <Input 
                  id="p-name" 
                  placeholder="e.g. Premium Silk Fabric" 
                  className={`h-11 ${touched.name && errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (touched.name) {
                      const error = validateField('name', e.target.value);
                      setErrors({ ...errors, name: error });
                    }
                  }}
                  onBlur={() => handleBlur('name', formData.name)}
                />
                {touched.name && errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
                {!touched.name && (
                  <p className="text-xs text-muted-foreground">Enter a descriptive product name</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-price">
                  {activeType === 'PLAIN' ? 'Base Price (₹) *' : activeType === 'DESIGNED' ? 'Print Price (₹) *' : 'Price (₹) *'}
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="p-price" 
                    type="number" 
                    placeholder="0.00" 
                    className={`h-11 pl-10 ${touched[activeType === 'PLAIN' ? 'pricePerMeter' : activeType === 'DESIGNED' ? 'designPrice' : 'basePrice'] && errors[activeType === 'PLAIN' ? 'pricePerMeter' : activeType === 'DESIGNED' ? 'designPrice' : 'basePrice'] ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    value={activeType === 'PLAIN' ? formData.pricePerMeter : activeType === 'DESIGNED' ? formData.designPrice : formData.basePrice}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const numValue = inputValue === '' ? '' : (isNaN(parseFloat(inputValue)) ? '' : parseFloat(inputValue));
                      const fieldName = activeType === 'PLAIN' ? 'pricePerMeter' : activeType === 'DESIGNED' ? 'designPrice' : 'basePrice';
                      
                      if (activeType === 'PLAIN') {
                        setFormData({ ...formData, pricePerMeter: numValue });
                      } else if (activeType === 'DESIGNED') {
                        setFormData({ ...formData, designPrice: numValue });
                      } else {
                        setFormData({ ...formData, basePrice: numValue });
                      }
                      
                      if (touched[fieldName]) {
                        const error = validateField(fieldName, numValue);
                        setErrors({ ...errors, [fieldName]: error });
                      }
                    }}
                    onBlur={() => {
                      const fieldName = activeType === 'PLAIN' ? 'pricePerMeter' : activeType === 'DESIGNED' ? 'designPrice' : 'basePrice';
                      const value = activeType === 'PLAIN' ? formData.pricePerMeter : activeType === 'DESIGNED' ? formData.designPrice : formData.basePrice;
                      handleBlur(fieldName, value);
                    }}
                  />
                </div>
                {touched[activeType === 'PLAIN' ? 'pricePerMeter' : activeType === 'DESIGNED' ? 'designPrice' : 'basePrice'] && errors[activeType === 'PLAIN' ? 'pricePerMeter' : activeType === 'DESIGNED' ? 'designPrice' : 'basePrice'] && (
                  <p className="text-sm text-red-500">{errors[activeType === 'PLAIN' ? 'pricePerMeter' : activeType === 'DESIGNED' ? 'designPrice' : 'basePrice']}</p>
                )}
                {!touched[activeType === 'PLAIN' ? 'pricePerMeter' : activeType === 'DESIGNED' ? 'designPrice' : 'basePrice'] && (
                  <p className="text-xs text-muted-foreground">Enter a valid price greater than 0</p>
                )}
              </div>
              {activeType === 'PLAIN' && (
                <div className="space-y-2">
                  <Label htmlFor="p-unit-extension">Unit Extension *</Label>
                  <Select
                    value={formData.unitExtensionType}
                    onValueChange={(value: 'per meter' | 'per piece' | 'per yard' | 'custom') => {
                      setFormData({
                        ...formData,
                        unitExtensionType: value,
                        unitExtension: value === 'custom' ? formData.unitExtensionCustom : value,
                      });
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select unit extension" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per meter">Per Meter</SelectItem>
                      <SelectItem value="per piece">Per Piece</SelectItem>
                      <SelectItem value="per yard">Per Yard</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.unitExtensionType === 'custom' && (
                    <Input
                      id="p-unit-custom"
                      type="text"
                      placeholder="e.g., per yard, per kg"
                      className="h-11"
                      value={formData.unitExtensionCustom}
                      onChange={(e) => {
                        const customValue = e.target.value;
                        setFormData({
                          ...formData,
                          unitExtensionCustom: customValue,
                          unitExtension: customValue,
                        });
                      }}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Choose how the price unit is displayed (e.g., "per meter", "per piece", or enter a custom unit)
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="p-gst">GST Rate (%)</Label>
                <Input 
                  id="p-gst" 
                  type="number" 
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g. 18.00" 
                  className="h-11"
                  value={formData.gstRate}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const numValue = inputValue === '' ? '' : (isNaN(parseFloat(inputValue)) ? '' : parseFloat(inputValue));
                    setFormData({ ...formData, gstRate: numValue });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  GST rate applied to this product at checkout (leave empty or 0 for no GST)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-hsn">HSN Code</Label>
                <Input
                  id="p-hsn"
                  type="text"
                  placeholder="6109"
                  maxLength={8}
                  className="h-11"
                  value={formData.hsnCode}
                  onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  HSN code for GST invoice (e.g., 6109 for garments)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(v) => {
                    setFormData({ ...formData, categoryId: v, subcategoryId: '' });
                    if (touched.categoryId) {
                      const error = validateField('categoryId', v);
                      setErrors({ ...errors, categoryId: error });
                    }
                  }}
                  onOpenChange={(open) => {
                    if (!open && !touched.categoryId) {
                      setTouched({ ...touched, categoryId: true });
                      const error = validateField('categoryId', formData.categoryId);
                      setErrors({ ...errors, categoryId: error });
                    }
                  }}
                >
                  <SelectTrigger className={`h-11 ${touched.categoryId && errors.categoryId ? 'border-red-500 focus-visible:ring-red-500' : ''}`}>
                    <SelectValue placeholder="Select category (only leaf categories shown)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories available. Please create a category first.</div>
                    ) : (
                      categories.map(cat => (
                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {touched.categoryId && errors.categoryId && (
                  <p className="text-sm text-red-500">{errors.categoryId}</p>
                )}
                {!touched.categoryId && (
                  <p className="text-xs text-muted-foreground">
                    Only categories without subcategories can have products. Create subcategories first if needed.
                  </p>
                )}
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
                
                {/* Quantity-Based Pricing Slabs */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Quantity-Based Pricing Slabs</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Set quantity-based pricing that works for ANY fabric. First slab (1-10m) uses fabric's base price. 
                        Subsequent slabs use the price you set (e.g., 11-50m = ₹90/m means ₹10 less per meter from base).
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addPricingSlab}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Slab
                    </Button>
                  </div>
                  
                  {(!formData.pricingSlabs || formData.pricingSlabs.length === 0) ? (
                    <div className="p-4 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
                      No pricing slabs added. Add slabs to enable quantity-based pricing.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(formData.pricingSlabs || []).map((slab, index) => (
                        <div key={slab.id} className="p-4 border border-border rounded-lg space-y-3 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Slab {index + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePricingSlab(slab.id!)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Min Quantity (meters) *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={slab.minQuantity}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  updatePricingSlab(slab.id!, 'minQuantity', value);
                                  // Clear error on change
                                  if (errors[`pricingSlab_${index}_minQuantity`]) {
                                    setErrors({ ...errors, [`pricingSlab_${index}_minQuantity`]: '' });
                                  }
                                }}
                                onBlur={() => {
                                  const error = validateField(`pricingSlab_${index}_minQuantity`, slab.minQuantity);
                                  setErrors({ ...errors, [`pricingSlab_${index}_minQuantity`]: error });
                                }}
                                className={`h-9 ${errors[`pricingSlab_${index}_minQuantity`] ? 'border-red-500' : ''}`}
                                placeholder="1"
                              />
                              {errors[`pricingSlab_${index}_minQuantity`] && (
                                <p className="text-xs text-red-500">{errors[`pricingSlab_${index}_minQuantity`]}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Max Quantity (meters)</Label>
                              <Input
                                type="number"
                                min={slab.minQuantity || 1}
                                value={slab.maxQuantity || ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? null : parseInt(e.target.value);
                                  updatePricingSlab(slab.id!, 'maxQuantity', value);
                                  // Clear error on change
                                  if (errors[`pricingSlab_${index}_maxQuantity`]) {
                                    setErrors({ ...errors, [`pricingSlab_${index}_maxQuantity`]: '' });
                                  }
                                }}
                                onBlur={() => {
                                  const error = validateField(`pricingSlab_${index}_maxQuantity`, slab.maxQuantity);
                                  setErrors({ ...errors, [`pricingSlab_${index}_maxQuantity`]: error });
                                }}
                                className={`h-9 ${errors[`pricingSlab_${index}_maxQuantity`] ? 'border-red-500' : ''}`}
                                placeholder="Leave empty for no limit"
                              />
                              <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
                              {errors[`pricingSlab_${index}_maxQuantity`] && (
                                <p className="text-xs text-red-500">{errors[`pricingSlab_${index}_maxQuantity`]}</p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Discount Type *</Label>
                              <Select
                                value={slab.discountType || 'FIXED_AMOUNT'}
                                onValueChange={(value: 'FIXED_AMOUNT' | 'PERCENTAGE') => updatePricingSlab(slab.id!, 'discountType', value)}
                              >
                                <SelectTrigger className={`h-9 ${errors[`pricingSlab_${index}_discountType`] ? 'border-red-500' : ''}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="FIXED_AMOUNT">Fixed Amount (₹)</SelectItem>
                                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                </SelectContent>
                              </Select>
                              {errors[`pricingSlab_${index}_discountType`] && (
                                <p className="text-xs text-red-500">{errors[`pricingSlab_${index}_discountType`]}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">
                                {slab.discountType === 'PERCENTAGE' ? 'Discount (%) *' : 'Discount Amount (₹) *'}
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                step={slab.discountType === 'PERCENTAGE' ? '0.1' : '0.01'}
                                value={slab.discountValue !== undefined && slab.discountValue !== null ? slab.discountValue : ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                  updatePricingSlab(slab.id!, 'discountValue', value);
                                  // Clear error on change
                                  if (errors[`pricingSlab_${index}_discountValue`]) {
                                    setErrors({ ...errors, [`pricingSlab_${index}_discountValue`]: '' });
                                  }
                                }}
                                onBlur={() => {
                                  const error = validateField(`pricingSlab_${index}_discountValue`, slab.discountValue);
                                  setErrors({ ...errors, [`pricingSlab_${index}_discountValue`]: error });
                                }}
                                className={`h-9 ${errors[`pricingSlab_${index}_discountValue`] ? 'border-red-500' : ''}`}
                                placeholder={slab.discountType === 'PERCENTAGE' ? '10' : '10.00'}
                              />
                              {errors[`pricingSlab_${index}_discountValue`] && (
                                <p className="text-xs text-red-500">{errors[`pricingSlab_${index}_discountValue`]}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                            {slab.discountType === 'PERCENTAGE' 
                              ? `${slab.discountValue || 0}% discount per meter for ${slab.maxQuantity ? `${slab.minQuantity}-${slab.maxQuantity}` : `${slab.minQuantity}+`} meters`
                              : `₹${slab.discountValue || 0} discount per meter for ${slab.maxQuantity ? `${slab.minQuantity}-${slab.maxQuantity}` : `${slab.minQuantity}+`} meters`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                <div className={`border-2 border-dashed rounded-xl p-8 text-center space-y-4 hover:bg-muted/30 transition-colors group cursor-pointer ${touched.digitalFile && errors.digitalFile ? 'border-red-500 bg-red-50/30' : uploadedDigitalFileUrl ? 'border-green-500 bg-green-50/30' : 'border-border'} ${isUploadingDigitalFile ? 'pointer-events-none opacity-60' : ''}`}>
                  <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    {isUploadingDigitalFile ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : uploadedDigitalFileUrl ? (
                      <Badge className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl">✓</Badge>
                    ) : (
                      <Upload className="w-8 h-8" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {isUploadingDigitalFile 
                        ? 'Uploading to local storage...' 
                        : uploadedDigitalFileUrl 
                          ? 'File Uploaded Successfully!' 
                          : 'Upload Digital File *'}
                    </p>
                    <p className="text-xs text-muted-foreground text-center max-w-[200px] mx-auto">
                      {isUploadingDigitalFile 
                        ? `Upload progress: ${uploadProgress}%` 
                        : uploadedDigitalFileUrl
                          ? 'File ready. You can now create the product.'
                          : 'Any file type supported. Max 50MB (local storage).'}
                    </p>
                  </div>
                  
                  {/* Progress bar */}
                  {isUploadingDigitalFile && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Error message */}
                  {uploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">Upload Failed</p>
                      <p className="text-xs text-red-600 mt-1">{uploadError}</p>
                    </div>
                  )}
                  
                  <input 
                    type="file" 
                    className="hidden" 
                    id="digital-upload" 
                    disabled={isUploadingDigitalFile}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleDigitalFileChange(file);
                      if (touched.digitalFile) {
                        const error = validateField('digitalFile', file);
                        setErrors({ ...errors, digitalFile: error });
                      }
                    }}
                    onBlur={() => handleBlur('digitalFile', formData.digitalFile)}
                  />
                  <div className="flex gap-2 justify-center">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.getElementById('digital-upload')?.click()}
                      disabled={isUploadingDigitalFile}
                    >
                      {isUploadingDigitalFile ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : uploadedDigitalFileUrl ? (
                        'Change File'
                      ) : (
                        'Choose File'
                      )}
                    </Button>
                    {uploadedDigitalFileUrl && !isUploadingDigitalFile && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setUploadedDigitalFileUrl('');
                          setFormData({ ...formData, digitalFile: null });
                          setUploadError('');
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                  {touched.digitalFile && errors.digitalFile && (
                    <p className="text-sm text-red-500">{errors.digitalFile}</p>
                  )}
                  {!touched.digitalFile && mode === 'create' && !isUploadingDigitalFile && !uploadedDigitalFileUrl && (
                    <p className="text-xs text-muted-foreground">Digital file is required for digital products</p>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Step 4: Detail Sections */}
          <section className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">{activeType === 'PLAIN' ? '4' : '4'}</span>
                Detail Sections
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addDetailSection}>
                <Plus className="w-4 h-4 mr-1" />
                Add Section
              </Button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDetailSectionDragEnd}>
              <SortableContext items={formData.detailSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {formData.detailSections.map((section) => (
                    <SortableDetailSectionItem key={section.id} id={section.id}>
                      <div className="p-4 border border-border rounded-lg space-y-3">
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
                    </SortableDetailSectionItem>
                  ))}
                  {formData.detailSections.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No detail sections added. Click "Add Section" to create one.
                    </p>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </section>

          {/* Step 5: Custom Fields */}
          <section className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">5</span>
                Custom Fields (Admin Defined → Customer Filled)
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                <Plus className="w-4 h-4 mr-1" />
                Add Field
              </Button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCustomFieldDragEnd}>
              <SortableContext items={formData.customFields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {formData.customFields.map((field) => (
                    <SortableCustomFieldItem key={field.id} id={field.id}>
                      <div className="p-4 border border-border rounded-lg space-y-3">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Field Name (shown to customer) *</Label>
                            <Input
                              value={field.label}
                              onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                              placeholder="e.g. Upload Design"
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Field Type *</Label>
                            <Select
                              value={field.fieldType}
                              onValueChange={(value) => updateCustomField(field.id, { fieldType: value })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="url">URL</SelectItem>
                                <SelectItem value="image">Image / File Upload</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Placeholder / Suggestion</Label>
                          <Input
                            value={field.placeholder}
                            onChange={(e) => updateCustomField(field.id, { placeholder: e.target.value })}
                            placeholder="e.g. Upload high-resolution PNG/JPG"
                            className="h-9"
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <Label className="text-sm">Required Field</Label>
                            <p className="text-xs text-muted-foreground">Customer must fill this field</p>
                          </div>
                          <Switch
                            checked={field.isRequired}
                            onCheckedChange={(checked) => updateCustomField(field.id, { isRequired: checked })}
                          />
                        </div>
                      </div>
                    </SortableCustomFieldItem>
                  ))}
                  {formData.customFields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No custom fields added. Click "Add Field" to create one.
                    </p>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </section>

          {/* Step 6: Variants */}
          <section className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">6</span>
                Variants (Price Calculation Based)
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="w-4 h-4 mr-1" />
                Add Variant
              </Button>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleVariantDragEnd}
            >
              <SortableContext
                items={formData.variants.map((v) => v.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {formData.variants.map((variant) => (
                    <SortableVariantItem key={variant.id} id={variant.id}>
                      <div className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Variant</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(variant.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Variant Name *</Label>
                      <Input
                        value={variant.name}
                        onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                        placeholder="e.g. Size"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Variant Type</Label>
                      <Input
                        value={variant.type}
                        onChange={(e) => updateVariant(variant.id, { type: e.target.value })}
                        placeholder="e.g. size"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unit (optional)</Label>
                      <Input
                        value={variant.unit}
                        onChange={(e) => updateVariant(variant.id, { unit: e.target.value })}
                        placeholder="e.g. cm, kg"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Variant Options</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addVariantOption(variant.id)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleOptionDragEnd(e, variant.id)}
                    >
                      <SortableContext
                        items={variant.options.map((opt) => opt.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {variant.options.map((option) => (
                            <SortableOptionItem key={option.id} id={option.id}>
                              <div className="flex gap-2 items-end p-3 border border-border rounded-lg">
                                <div className="flex-1">
                                  <Label className="text-xs">Option Value *</Label>
                                  <Input
                                    value={option.value}
                                    onChange={(e) => updateVariantOption(variant.id, option.id, { value: e.target.value })}
                                    placeholder="e.g. Small, Medium, Large"
                                    className="h-9"
                                  />
                                </div>
                                <div className="w-32">
                                  <Label className="text-xs">Price Impact (₹)</Label>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      value={option.priceModifier}
                                      onChange={(e) => updateVariantOption(variant.id, option.id, { priceModifier: parseFloat(e.target.value) || 0 })}
                                      placeholder="0"
                                      className="h-9 pl-8"
                                    />
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeVariantOption(variant.id, option.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </SortableOptionItem>
                          ))}
                          {variant.options.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              No options added. Click "Add Option" to create one.
                            </p>
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                      </div>
                    </SortableVariantItem>
                  ))}
                  {formData.variants.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No variants added. Click "Add Variant" to create one.
                    </p>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </section>

          {/* Step 7: Media Gallery (Images & Videos) */}
          <MediaUploadSection 
            media={formData.media}
            onMediaChange={(media) => setFormData({ ...formData, media })}
          />

          {/* Step 8: Status */}
          <section className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">8</span>
              Product Status
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <Label className="text-base font-medium">Product Status</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.status === 'active' ? 'Product will be visible to customers' : 'Product will be hidden from customers (Draft)'}
                </p>
              </div>
              <Switch
                checked={formData.status === 'active'}
                onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
              />
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-border flex items-center justify-between shadow-up flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2 h-11 px-6">
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                // Save as draft (inactive status) - skip validation
                const draftPayload: any = {
                  name: formData.name || 'Untitled Product',
                  type: activeType,
                  categoryId: formData.categoryId ? Number(formData.categoryId) : null,
                  description: formData.description,
                  images: formData.media.map(m => m.url),
                  media: formData.media.map((m, idx) => ({
                    url: m.url,
                    type: m.type,
                    displayOrder: m.displayOrder !== undefined ? m.displayOrder : idx
                  })),
                  detailSections: formData.detailSections,
                  customFields: formData.customFields.map(field => ({
                    label: field.label,
                    fieldType: field.fieldType,
                    placeholder: field.placeholder,
                    isRequired: field.isRequired
                  })),
                  variants: formData.variants.map(variant => ({
                    name: variant.name,
                    type: variant.type,
                    unit: variant.unit,
                    options: variant.options.map(opt => ({
                      value: opt.value,
                      priceModifier: opt.priceModifier
                    }))
                  })),
                  status: 'inactive', // Draft status
                };
                
                if (activeType === 'PLAIN') {
                  const sellingPrice = formData.pricePerMeter || 0;
                  draftPayload.plainProductId = formData.plainProductId || null;
                  draftPayload.price = sellingPrice;
                  draftPayload.pricePerMeter = sellingPrice;
                  draftPayload.originalPrice = sellingPrice;
                } else if (activeType === 'DESIGNED') {
                  const sellingPrice = formData.designPrice ?? formData.basePrice ?? 0;
                  draftPayload.designPrice = formData.designPrice;
                  draftPayload.price = sellingPrice;
                  draftPayload.originalPrice = sellingPrice;
                  draftPayload.recommendedPlainProductIds = formData.recommendedPlainProductIds;
                } else if (activeType === 'DIGITAL') {
                  const sellingPrice = formData.basePrice || 0;
                  draftPayload.price = sellingPrice;
                  draftPayload.originalPrice = sellingPrice;
                  draftPayload.fileUrl = formData.digitalFile ? 'uploaded-file-url' : initialData?.fileUrl || '';
                }
                
                if (mode === 'edit' && productId) {
                  draftPayload.id = productId;
                }
                
                onSave(draftPayload);
                toast.success('Product saved as draft');
              }}
              className="gap-2 h-11 px-6"
            >
              Save as Draft
            </Button>
            <Button 
              className="btn-primary gap-2 h-11 px-8" 
              onClick={handleSubmit}
              disabled={isUploadingDigitalFile || (activeType === 'DIGITAL' && !uploadedDigitalFileUrl && mode === 'create')}
            >
              <Save className="w-4 h-4" />
              {isUploadingDigitalFile 
                ? 'Uploading...' 
                : mode === 'edit' 
                  ? 'Update Product' 
                  : 'Create Product'}
            </Button>
          </div>
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
