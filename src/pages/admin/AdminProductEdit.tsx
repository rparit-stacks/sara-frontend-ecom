import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  X, Save, Upload, IndianRupee, Image as ImageIcon, Plus, Video, Loader2, Trash2, GripVertical, ArrowLeft, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ProductTypeSelector, { ProductType } from '@/components/admin/ProductTypeSelector';
import RichTextEditor from '@/components/admin/RichTextEditor';
import PlainProductSelector, { PlainProduct } from '@/components/admin/PlainProductSelector';
import { toast } from 'sonner';
import { productsApi, plainProductsApi, categoriesApi } from '@/lib/api';

// ─── Sortable helpers (same as ProductFormDialog) ───────────────────────
const SortableVariantItem: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
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

const SortableOptionItem: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-0 top-0 bottom-0 flex items-center cursor-grab active:cursor-grabbing z-10 p-1 text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" {...attributes} {...listeners} />
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
};

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

// ─── Media Upload Section ────────────────────────────────────────────────
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
      const uploadedFiles = await productsApi.uploadMedia(files, 'products');
      const newMedia = uploadedFiles.map((file: any, idx: number) => ({
        url: file.url,
        type: file.type === 'video' ? 'video' as const : 'image' as const,
        displayOrder: media.length + idx
      }));
      onMediaChange([...media, ...newMedia]);
      toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload media');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index).map((m, idx) => ({ ...m, displayOrder: idx }));
    onMediaChange(newMedia);
  };

  const moveMedia = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === media.length - 1)) return;
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
          Product Gallery (Images & Videos)
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="gap-2">
          {isUploading ? (<><Loader2 className="w-4 h-4 animate-spin" />Uploading...</>) : (<><Upload className="w-4 h-4" />Upload Media</>)}
        </Button>
      </div>
      <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {media.map((item, index) => (
          <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
            {item.type === 'video' ? (
              <video src={item.url} className="w-full h-full object-cover" controls={false} muted playsInline />
            ) : (
              <img src={item.url} alt={`Product media ${index + 1}`} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-1">
              <button onClick={() => moveMedia(index, 'up')} disabled={index === 0} className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-white/90 rounded flex items-center justify-center disabled:opacity-30 text-xs" title="Move up">↑</button>
              <button onClick={() => removeMedia(index)} className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center" title="Remove"><X className="w-3 h-3" /></button>
              <button onClick={() => moveMedia(index, 'down')} disabled={index === media.length - 1} className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-white/90 rounded flex items-center justify-center disabled:opacity-30 text-xs" title="Move down">↓</button>
            </div>
            <div className="absolute top-1 left-1">
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {item.type === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
              </Badge>
            </div>
          </motion.div>
        ))}
        <motion.button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-muted/30 transition-colors group disabled:opacity-50">
          {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : (
            <>
              <ImageIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Add Media</span>
              <span className="text-[9px] text-muted-foreground">Images & Videos</span>
            </>
          )}
        </motion.button>
      </div>
      <p className="text-xs text-muted-foreground">Upload multiple images and videos at once. Drag to reorder. First item will be the main image.</p>
    </section>
  );
};

// ─── Detail Section interface ────────────────────────────────────────────
interface DetailSection {
  id: string;
  title: string;
  content: string;
}

// ─── Main Edit Page ──────────────────────────────────────────────────────
const AdminProductEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const productId = id ? Number(id) : null;

  // ─── Form State ────────────────────────────────────────────────────────
  const [activeType, setActiveType] = useState<ProductType>('PLAIN');
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
    images: [] as string[],
    media: [] as Array<{ url: string; type: 'image' | 'video'; displayOrder: number }>,
    digitalFile: null as File | null,
    plainProductId: null as string | null,
    recommendedPlainProductIds: [] as string[],
    pricingSlabs: [] as Array<{ id?: string; minQuantity: number; maxQuantity: number | null; discountType: 'FIXED_AMOUNT' | 'PERCENTAGE'; discountValue: number; pricePerMeter?: number; displayOrder: number }>,
    detailSections: [] as DetailSection[],
    customFields: [] as Array<{ id: string; label: string; fieldType: string; placeholder: string; isRequired: boolean }>,
    variants: [] as Array<{ id: string; name: string; type: string; unit: string; displayOrder: number; options: Array<{ id: string; value: string; priceModifier: number; displayOrder: number }> }>,
    status: 'active' as 'active' | 'inactive',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isUploadingDigitalFile, setIsUploadingDigitalFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDigitalFileUrl, setUploadedDigitalFileUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  // ─── Data Fetching ─────────────────────────────────────────────────────
  const { data: productData, isLoading: isLoadingProduct, error: productError } = useQuery({
    queryKey: ['product', 'admin', productId],
    queryFn: async () => {
      // Try admin endpoint first (returns full data with all nested collections)
      try {
        const data = await productsApi.getByIdAdmin(productId!);
        console.log('[AdminProductEdit] Admin endpoint succeeded:', data?.id, 'detailSections:', data?.detailSections?.length, 'variants:', data?.variants?.length, 'media:', data?.media?.length);
        return data;
      } catch (adminErr) {
        console.warn('[AdminProductEdit] Admin endpoint failed, falling back to public endpoint:', adminErr);
      }
      // Fallback to public endpoint (also returns full details via toDtoWithDetails)
      const data = await productsApi.getById(productId!);
      console.log('[AdminProductEdit] Public endpoint succeeded:', data?.id, 'detailSections:', data?.detailSections?.length, 'variants:', data?.variants?.length, 'media:', data?.media?.length);
      return data;
    },
    enabled: !!productId,
    retry: 1,
  });

  const { data: plainProducts = [] } = useQuery({
    queryKey: ['plainProducts', 'active'],
    queryFn: () => plainProductsApi.getActive(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['leafCategories'],
    queryFn: () => categoriesApi.getLeafCategories(),
  });

  const plainProductsForForm: PlainProduct[] = plainProducts
    .filter((p: any) => p && p.id)
    .map((p: any) => ({
      id: String(p.id),
      name: p.name || 'Unnamed Product',
      image: p.image || '',
      pricePerMeter: Number(p.pricePerMeter) || 0,
      status: (p.status?.toLowerCase() === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
    }));

  const categoriesForForm = categories.map((c: any) => ({
    id: String(c.id),
    name: c.name,
    subcategories: [],
  }));

  // ─── Populate form from loaded product ─────────────────────────────────
  useEffect(() => {
    if (!productData) {
      console.log('[AdminProductEdit] useEffect: no productData yet');
      return;
    }
    console.log('[AdminProductEdit] Populating form from productData:', {
      id: productData.id,
      name: productData.name,
      type: productData.type,
      detailSections: productData.detailSections,
      customFields: productData.customFields,
      variants: productData.variants,
      media: productData.media,
      images: productData.images,
    });

    try {
      const pd = productData;
      setActiveType(pd.type || 'PLAIN');

      const unitVal = pd.plainProduct?.unitExtension || pd.unitExtension || 'per meter';
      const isStandardUnit = unitVal === 'per meter' || unitVal === 'per piece' || unitVal === 'per yard';

      // Build media array - handle both media objects and plain image URL strings
      let mediaArr: Array<{ url: string; type: 'image' | 'video'; displayOrder: number }> = [];
      if (pd.media && Array.isArray(pd.media) && pd.media.length > 0) {
        mediaArr = pd.media.map((m: any, idx: number) => ({
          url: m.url || m.imageUrl || m.mediaUrl || '',
          type: (m.type === 'video' || m.mediaType === 'video') ? 'video' as const : 'image' as const,
          displayOrder: m.displayOrder !== undefined ? m.displayOrder : idx,
        }));
      } else if (pd.images && Array.isArray(pd.images) && pd.images.length > 0) {
        mediaArr = pd.images.map((url: string, idx: number) => ({
          url,
          type: 'image' as const,
          displayOrder: idx,
        }));
      }

      const mappedDetailSections = (pd.detailSections || []).map((s: any, idx: number) => ({
        id: `ds-${s.id || idx}`,
        title: s.title || '',
        content: s.content || '',
      }));

      const mappedCustomFields = (pd.customFields || []).map((f: any, idx: number) => ({
        id: `cf-${f.id || idx}`,
        label: f.label || '',
        fieldType: f.fieldType || 'text',
        placeholder: f.placeholder || '',
        isRequired: typeof f.isRequired === 'boolean' ? f.isRequired : !!f.required,
      }));

      const mappedVariants = (pd.variants || []).map((v: any, idx: number) => ({
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
      }));

      console.log('[AdminProductEdit] Mapped data:', {
        mediaArr: mediaArr.length,
        detailSections: mappedDetailSections.length,
        customFields: mappedCustomFields.length,
        variants: mappedVariants.length,
      });

      setFormData({
        name: pd.name || '',
        categoryId: pd.categoryId ? String(pd.categoryId) : '',
        subcategoryId: pd.subcategoryId ? String(pd.subcategoryId) : '',
        description: pd.description || '',
        basePrice: pd.basePrice || pd.price || 0,
        pricePerMeter: pd.pricePerMeter ?? pd.price ?? 0,
        designPrice: pd.designPrice || 0,
        unitExtension: unitVal,
        unitExtensionType: (isStandardUnit ? unitVal : 'custom') as any,
        unitExtensionCustom: isStandardUnit ? '' : unitVal,
        gstRate: pd.gstRate ?? 0,
        hsnCode: pd.hsnCode || '',
        images: pd.images || [],
        media: mediaArr,
        digitalFile: null,
        plainProductId: pd.plainProductId ? String(pd.plainProductId) : null,
        recommendedPlainProductIds: pd.recommendedPlainProductIds
          ? pd.recommendedPlainProductIds.map((id: any) => String(id))
          : (pd.recommendedFabricIds ? pd.recommendedFabricIds.map((id: any) => String(id)) : []),
        pricingSlabs: pd.pricingSlabs ? pd.pricingSlabs.map((slab: any, idx: number) => ({
          id: `slab-${slab.id || idx}`,
          minQuantity: slab.minQuantity || 1,
          maxQuantity: slab.maxQuantity || null,
          discountType: (slab.discountType || 'FIXED_AMOUNT') as 'FIXED_AMOUNT' | 'PERCENTAGE',
          discountValue: slab.discountValue || slab.pricePerMeter || 0,
          pricePerMeter: slab.pricePerMeter,
          displayOrder: slab.displayOrder !== undefined ? slab.displayOrder : idx,
        })) : [],
        detailSections: mappedDetailSections,
        customFields: mappedCustomFields,
        variants: mappedVariants,
        status: pd.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
      });

      console.log('[AdminProductEdit] Form populated successfully');

      if (pd.type === 'DIGITAL' && pd.fileUrl) setUploadedDigitalFileUrl(pd.fileUrl);
    } catch (error) {
      console.error('[AdminProductEdit] ERROR populating form:', error);
    }
  }, [productData]);

  // ─── Mutations ─────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully!');
      navigate('/admin-sara/products');
    },
    onError: (error: any) => {
      let msg = 'Failed to update product';
      if (error?.message) msg = error.message;
      toast.error(msg);
    },
  });

  // ─── Validation ────────────────────────────────────────────────────────
  const validateField = (fieldName: string, value: any): string => {
    switch (fieldName) {
      case 'name':
        return !value?.toString().trim() ? 'Product name is required' : '';
      case 'categoryId':
        return !value ? 'Please select a category' : '';
      case 'pricePerMeter':
        if (activeType === 'PLAIN') {
          const num = typeof value === 'string' ? parseFloat(value) : Number(value);
          if (!value || isNaN(num) || num <= 0) return 'Price must be greater than 0';
        }
        return '';
      case 'designPrice':
        if (activeType === 'DESIGNED') {
          const num = typeof value === 'string' ? parseFloat(value) : Number(value);
          if (!value || isNaN(num) || num <= 0) return 'Print price must be greater than 0';
        }
        return '';
      case 'basePrice':
        if (activeType === 'DIGITAL') {
          const num = typeof value === 'string' ? parseFloat(value) : Number(value);
          if (!value || isNaN(num) || num <= 0) return 'Price must be greater than 0';
        }
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (fieldName: string, value: any) => {
    setTouched({ ...touched, [fieldName]: true });
    setErrors({ ...errors, [fieldName]: validateField(fieldName, value) });
  };

  const validateForm = (): boolean => {
    const ne: Record<string, string> = {};
    ne.name = validateField('name', formData.name);
    ne.categoryId = validateField('categoryId', formData.categoryId);
    ne.pricePerMeter = validateField('pricePerMeter', formData.pricePerMeter);
    ne.designPrice = validateField('designPrice', formData.designPrice);
    ne.basePrice = validateField('basePrice', formData.basePrice);
    setErrors(ne);
    setTouched({ name: true, categoryId: true, pricePerMeter: true, designPrice: true, basePrice: true });
    const hasErrors = Object.values(ne).some(err => err !== '');
    if (hasErrors) toast.error('Please fix the errors in the form');
    return !hasErrors;
  };

  // ─── Digital file upload ───────────────────────────────────────────────
  const handleDigitalFileChange = async (file: File | null) => {
    if (!file) {
      setFormData({ ...formData, digitalFile: null });
      setUploadedDigitalFileUrl('');
      setUploadError('');
      return;
    }
    const MAX = 50 * 1024 * 1024;
    if (file.size > MAX) {
      setUploadError('File size exceeds 50MB limit.');
      toast.error('File size exceeds 50MB limit.');
      return;
    }
    setFormData({ ...formData, digitalFile: file });
    setIsUploadingDigitalFile(true);
    setUploadProgress(0);
    setUploadError('');
    const interval = setInterval(() => setUploadProgress(p => Math.min(p + 10, 90)), 200);
    toast.loading('Uploading digital file...', { id: 'digital-upload' });
    try {
      const result = await productsApi.uploadDigitalFile(file, formData.name?.trim() || '');
      clearInterval(interval);
      setUploadProgress(100);
      if (result?.success && result.downloadUrl) {
        setUploadedDigitalFileUrl(result.downloadUrl);
        toast.success('Digital file uploaded!', { id: 'digital-upload' });
      } else {
        throw new Error('No download URL returned');
      }
    } catch (err: any) {
      clearInterval(interval);
      setUploadProgress(0);
      const msg = err.message || 'Failed to upload digital file';
      setUploadError(msg);
      toast.error(msg, { id: 'digital-upload' });
      setUploadedDigitalFileUrl('');
    } finally {
      setIsUploadingDigitalFile(false);
      setUploadProgress(0);
    }
  };

  // ─── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!validateForm()) return;
    if (!productId) return;

    const fileUrl = activeType === 'DIGITAL' ? uploadedDigitalFileUrl : '';
    const payload: any = {
      id: productId,
      name: formData.name,
      type: activeType,
      categoryId: formData.categoryId ? Number(formData.categoryId) : null,
      description: formData.description,
      images: formData.media.map(m => m.url),
      media: formData.media.map((m, idx) => ({ url: m.url, type: m.type, displayOrder: m.displayOrder !== undefined ? m.displayOrder : idx })),
      detailSections: formData.detailSections,
      customFields: formData.customFields.map(f => ({ label: f.label, fieldType: f.fieldType, placeholder: f.placeholder, isRequired: f.isRequired })),
      variants: formData.variants.map((v, idx) => ({
        name: v.name, type: v.type, unit: v.unit, displayOrder: v.displayOrder !== undefined ? v.displayOrder : idx,
        options: v.options.map((o, oi) => ({ value: o.value, priceModifier: o.priceModifier, displayOrder: o.displayOrder !== undefined ? o.displayOrder : oi }))
      })),
      status: formData.status,
    };

    if (activeType === 'PLAIN') {
      const sp = formData.pricePerMeter;
      const ue = formData.unitExtensionType === 'custom' ? formData.unitExtensionCustom : formData.unitExtensionType;
      payload.plainProductId = formData.plainProductId || null;
      payload.price = sp; payload.pricePerMeter = sp; payload.originalPrice = sp;
      payload.unitExtension = ue || 'per meter';
    } else if (activeType === 'DESIGNED') {
      const sp = formData.designPrice ?? formData.basePrice;
      payload.designPrice = formData.designPrice; payload.price = sp; payload.originalPrice = sp;
      payload.recommendedPlainProductIds = formData.recommendedPlainProductIds;
      if (formData.pricingSlabs?.length > 0) {
        payload.pricingSlabs = formData.pricingSlabs.map(s => ({
          minQuantity: s.minQuantity, maxQuantity: s.maxQuantity,
          discountType: s.discountType || 'FIXED_AMOUNT', discountValue: s.discountValue ?? 0, displayOrder: s.displayOrder || 0
        }));
      }
    } else if (activeType === 'DIGITAL') {
      const sp = formData.basePrice;
      payload.price = sp; payload.originalPrice = sp; payload.fileUrl = fileUrl;
    }

    if (formData.gstRate !== '' && formData.gstRate !== null && formData.gstRate !== undefined) payload.gstRate = Number(formData.gstRate);
    if (formData.hsnCode) payload.hsnCode = formData.hsnCode;

    updateMutation.mutate({ id: productId, data: payload });
  };

  // ─── List helpers ──────────────────────────────────────────────────────
  const addPricingSlab = () => {
    const slabs = formData.pricingSlabs || [];
    const newSlab = {
      id: `slab-${Date.now()}`,
      minQuantity: slabs.length > 0 ? ((slabs[slabs.length - 1].maxQuantity || slabs[slabs.length - 1].minQuantity) + 1) : 1,
      maxQuantity: null as number | null,
      discountType: 'FIXED_AMOUNT' as 'FIXED_AMOUNT' | 'PERCENTAGE',
      discountValue: 0,
      displayOrder: slabs.length,
    };
    setFormData({ ...formData, pricingSlabs: [...slabs, newSlab] });
  };
  const removePricingSlab = (slabId: string) => setFormData({ ...formData, pricingSlabs: formData.pricingSlabs.filter(s => s.id !== slabId).map((s, i) => ({ ...s, displayOrder: i })) });
  const updatePricingSlab = (slabId: string, field: string, value: any) => setFormData({ ...formData, pricingSlabs: formData.pricingSlabs.map(s => s.id === slabId ? { ...s, [field]: value } : s) });

  const addDetailSection = () => setFormData({ ...formData, detailSections: [...formData.detailSections, { id: `ds-${Date.now()}`, title: '', content: '' }] });
  const removeDetailSection = (secId: string) => setFormData({ ...formData, detailSections: formData.detailSections.filter(s => s.id !== secId) });
  const updateDetailSection = (secId: string, upd: Partial<DetailSection>) => setFormData({ ...formData, detailSections: formData.detailSections.map(s => s.id === secId ? { ...s, ...upd } : s) });

  const addCustomField = () => setFormData({ ...formData, customFields: [...formData.customFields, { id: `cf-${Date.now()}`, label: '', fieldType: 'text', placeholder: '', isRequired: false }] });
  const removeCustomField = (cfId: string) => setFormData({ ...formData, customFields: formData.customFields.filter(f => f.id !== cfId) });
  const updateCustomField = (cfId: string, upd: Partial<typeof formData.customFields[0]>) => setFormData({ ...formData, customFields: formData.customFields.map(f => f.id === cfId ? { ...f, ...upd } : f) });

  const addVariant = () => setFormData({ ...formData, variants: [...formData.variants, { id: `v-${Date.now()}`, name: '', type: '', unit: '', displayOrder: formData.variants.length, options: [] }] });
  const removeVariant = (vId: string) => setFormData({ ...formData, variants: formData.variants.filter(v => v.id !== vId) });
  const updateVariant = (vId: string, upd: Partial<typeof formData.variants[0]>) => setFormData({ ...formData, variants: formData.variants.map(v => v.id === vId ? { ...v, ...upd } : v) });
  const addVariantOption = (vId: string) => setFormData({ ...formData, variants: formData.variants.map(v => v.id === vId ? { ...v, options: [...v.options, { id: `vo-${Date.now()}`, value: '', priceModifier: 0, displayOrder: v.options.length }] } : v) });
  const removeVariantOption = (vId: string, oId: string) => setFormData({ ...formData, variants: formData.variants.map(v => v.id === vId ? { ...v, options: v.options.filter(o => o.id !== oId) } : v) });
  const updateVariantOption = (vId: string, oId: string, upd: Partial<{ value: string; priceModifier: number }>) => setFormData({ ...formData, variants: formData.variants.map(v => v.id === vId ? { ...v, options: v.options.map(o => o.id === oId ? { ...o, ...upd } : o) } : v) });

  // ─── Drag and drop ─────────────────────────────────────────────────────
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleVariantDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oi = prev.variants.findIndex(v => v.id === active.id);
        const ni = prev.variants.findIndex(v => v.id === over.id);
        return { ...prev, variants: arrayMove(prev.variants, oi, ni).map((v, idx) => ({ ...v, displayOrder: idx })) };
      });
    }
  };
  const handleDetailSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oi = prev.detailSections.findIndex(s => s.id === active.id);
        const ni = prev.detailSections.findIndex(s => s.id === over.id);
        if (oi === -1 || ni === -1) return prev;
        return { ...prev, detailSections: arrayMove(prev.detailSections, oi, ni) };
      });
    }
  };
  const handleCustomFieldDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oi = prev.customFields.findIndex(f => f.id === active.id);
        const ni = prev.customFields.findIndex(f => f.id === over.id);
        if (oi === -1 || ni === -1) return prev;
        return { ...prev, customFields: arrayMove(prev.customFields, oi, ni) };
      });
    }
  };
  const handleOptionDragEnd = (event: DragEndEvent, variantId: string) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const variant = prev.variants.find(v => v.id === variantId);
        if (!variant) return prev;
        const oi = variant.options.findIndex(o => o.id === active.id);
        const ni = variant.options.findIndex(o => o.id === over.id);
        const reordered = arrayMove(variant.options, oi, ni).map((o, idx) => ({ ...o, displayOrder: idx }));
        return { ...prev, variants: prev.variants.map(v => v.id === variantId ? { ...v, options: reordered } : v) };
      });
    }
  };

  // ─── Loading state ─────────────────────────────────────────────────────
  if (isLoadingProduct) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!productData && !isLoadingProduct) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-destructive text-lg font-semibold mb-2">Product not found</p>
          {productError && <p className="text-sm text-muted-foreground mb-4">Error: {String(productError)}</p>}
          <Button variant="outline" onClick={() => navigate('/admin-sara/products')}>Back to Products</Button>
        </div>
      </AdminLayout>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      {updateMutation.isPending && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4 min-w-[300px]">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-lg font-semibold text-foreground">Updating your product...</p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/admin-sara/products')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-cursive text-3xl lg:text-4xl font-bold">Edit Product</h1>
              <p className="text-muted-foreground text-sm mt-1">Update product details, fields, and settings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {productData?.slug && (
              <a href={`/product/${productData.slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2"><ExternalLink className="w-4 h-4" />View Product</Button>
              </a>
            )}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 lg:p-8 space-y-10">
          {/* 1. Product Type */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">1</span>
              Product Type
            </div>
            <ProductTypeSelector selected={activeType} onChange={setActiveType} />
          </section>

          {/* 2. Basic Info */}
          <section className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">2</span>
              Basic Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="p-name">Product Name *</Label>
                <Input id="p-name" placeholder="e.g. Premium Silk Fabric" className={`h-11 ${touched.name && errors.name ? 'border-red-500' : ''}`}
                  value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (touched.name) setErrors({ ...errors, name: validateField('name', e.target.value) }); }}
                  onBlur={() => handleBlur('name', formData.name)} />
                {touched.name && errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
              {/* Price */}
              <div className="space-y-2">
                <Label>{activeType === 'PLAIN' ? 'Base Price (₹) *' : activeType === 'DESIGNED' ? 'Print Price (₹) *' : 'Price (₹) *'}</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="number" placeholder="0.00" className={`h-11 pl-10 ${touched[activeType === 'PLAIN' ? 'pricePerMeter' : activeType === 'DESIGNED' ? 'designPrice' : 'basePrice'] && errors[activeType === 'PLAIN' ? 'pricePerMeter' : activeType === 'DESIGNED' ? 'designPrice' : 'basePrice'] ? 'border-red-500' : ''}`}
                    value={activeType === 'PLAIN' ? formData.pricePerMeter : activeType === 'DESIGNED' ? formData.designPrice : formData.basePrice}
                    onChange={(e) => {
                      const nv = e.target.value === '' ? '' : (isNaN(parseFloat(e.target.value)) ? '' : parseFloat(e.target.value));
                      const fn = activeType === 'PLAIN' ? 'pricePerMeter' : activeType === 'DESIGNED' ? 'designPrice' : 'basePrice';
                      setFormData({ ...formData, [fn]: nv });
                      if (touched[fn]) setErrors({ ...errors, [fn]: validateField(fn, nv) });
                    }}
                    onBlur={() => { const fn = activeType === 'PLAIN' ? 'pricePerMeter' : activeType === 'DESIGNED' ? 'designPrice' : 'basePrice'; handleBlur(fn, formData[fn as keyof typeof formData]); }}
                  />
                </div>
                {(() => { const fn = activeType === 'PLAIN' ? 'pricePerMeter' : activeType === 'DESIGNED' ? 'designPrice' : 'basePrice'; return touched[fn] && errors[fn] ? <p className="text-sm text-red-500">{errors[fn]}</p> : null; })()}
              </div>
              {/* Unit Extension (PLAIN only) */}
              {activeType === 'PLAIN' && (
                <div className="space-y-2">
                  <Label>Unit Extension *</Label>
                  <Select value={formData.unitExtensionType} onValueChange={(v: any) => setFormData({ ...formData, unitExtensionType: v, unitExtension: v === 'custom' ? formData.unitExtensionCustom : v })}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select unit extension" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per meter">Per Meter</SelectItem>
                      <SelectItem value="per piece">Per Piece</SelectItem>
                      <SelectItem value="per yard">Per Yard</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.unitExtensionType === 'custom' && (
                    <Input type="text" placeholder="e.g., per yard, per kg" className="h-11"
                      value={formData.unitExtensionCustom}
                      onChange={(e) => setFormData({ ...formData, unitExtensionCustom: e.target.value, unitExtension: e.target.value })} />
                  )}
                </div>
              )}
              {/* GST */}
              <div className="space-y-2">
                <Label>GST Rate (%)</Label>
                <Input type="number" min="0" max="100" step="0.01" placeholder="e.g. 18.00" className="h-11"
                  value={formData.gstRate} onChange={(e) => { const nv = e.target.value === '' ? '' : (isNaN(parseFloat(e.target.value)) ? '' : parseFloat(e.target.value)); setFormData({ ...formData, gstRate: nv }); }} />
              </div>
              {/* HSN */}
              <div className="space-y-2">
                <Label>HSN Code</Label>
                <Input type="text" placeholder="6109" maxLength={8} className="h-11" value={formData.hsnCode} onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })} />
              </div>
              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.categoryId} onValueChange={(v) => { setFormData({ ...formData, categoryId: v, subcategoryId: '' }); if (touched.categoryId) setErrors({ ...errors, categoryId: validateField('categoryId', v) }); }}>
                  <SelectTrigger className={`h-11 ${touched.categoryId && errors.categoryId ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesForForm.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories available.</div>
                    ) : categoriesForForm.map((cat: any) => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {touched.categoryId && errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId}</p>}
              </div>
            </div>
            {/* Description */}
            <div className="space-y-2">
              <Label>Product Description</Label>
              <RichTextEditor value={formData.description} onChange={(c) => setFormData(prev => ({ ...prev, description: c }))} placeholder="Write rich description..." />
            </div>
          </section>

          {/* 3. Type-Specific Sections */}
          <AnimatePresence mode="wait">
            {activeType === 'DESIGNED' && (
              <motion.section key="designed" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[10px]">3</span>
                  Recommended Plain Products
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Select Recommended Plain Products (Max 10)</Label>
                    <Badge variant="secondary" className="text-xs">{formData.recommendedPlainProductIds.length} Selected</Badge>
                  </div>
                  <PlainProductSelector plainProducts={plainProductsForForm} selectedProductIds={formData.recommendedPlainProductIds} onChange={(ids) => setFormData({ ...formData, recommendedPlainProductIds: ids })} maxSelection={10} />
                </div>
                {/* Pricing Slabs */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Quantity-Based Pricing Slabs</Label>
                      <p className="text-xs text-muted-foreground mt-1">Set quantity-based pricing for this design product.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addPricingSlab}><Plus className="w-4 h-4 mr-1" />Add Slab</Button>
                  </div>
                  {(!formData.pricingSlabs || formData.pricingSlabs.length === 0) ? (
                    <div className="p-4 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">No pricing slabs added.</div>
                  ) : (
                    <div className="space-y-3">
                      {formData.pricingSlabs.map((slab, index) => (
                        <div key={slab.id} className="p-4 border border-border rounded-lg space-y-3 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Slab {index + 1}</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removePricingSlab(slab.id!)} className="text-destructive hover:text-destructive"><X className="w-4 h-4" /></Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Min Quantity *</Label>
                              <Input type="number" min="1" value={slab.minQuantity} onChange={(e) => updatePricingSlab(slab.id!, 'minQuantity', parseInt(e.target.value) || 1)} className="h-9" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Max Quantity</Label>
                              <Input type="number" min={slab.minQuantity || 1} value={slab.maxQuantity || ''} onChange={(e) => updatePricingSlab(slab.id!, 'maxQuantity', e.target.value === '' ? null : parseInt(e.target.value))} className="h-9" placeholder="Leave empty for no limit" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Discount Type *</Label>
                              <Select value={slab.discountType || 'FIXED_AMOUNT'} onValueChange={(v: any) => updatePricingSlab(slab.id!, 'discountType', v)}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="FIXED_AMOUNT">Fixed Amount (₹)</SelectItem>
                                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">{slab.discountType === 'PERCENTAGE' ? 'Discount (%) *' : 'Discount Amount (₹) *'}</Label>
                              <Input type="number" min="0" step={slab.discountType === 'PERCENTAGE' ? '0.1' : '0.01'}
                                value={slab.discountValue ?? ''} onChange={(e) => updatePricingSlab(slab.id!, 'discountValue', parseFloat(e.target.value) || 0)} className="h-9" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.section>
            )}
            {activeType === 'DIGITAL' && (
              <motion.section key="digital" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px]">3</span>
                  Digital Asset
                </div>
                <div className={`border-2 border-dashed rounded-xl p-8 text-center space-y-4 hover:bg-muted/30 transition-colors group cursor-pointer ${uploadedDigitalFileUrl ? 'border-green-500 bg-green-50/30' : 'border-border'} ${isUploadingDigitalFile ? 'pointer-events-none opacity-60' : ''}`}>
                  <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    {isUploadingDigitalFile ? <Loader2 className="w-8 h-8 animate-spin" /> : uploadedDigitalFileUrl ? <Badge className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl">✓</Badge> : <Upload className="w-8 h-8" />}
                  </div>
                  <p className="font-semibold">{isUploadingDigitalFile ? 'Uploading...' : uploadedDigitalFileUrl ? 'File Uploaded Successfully!' : 'Upload Digital File'}</p>
                  <p className="text-xs text-muted-foreground">{isUploadingDigitalFile ? `${uploadProgress}%` : uploadedDigitalFileUrl ? 'File ready.' : 'Any file type. Max 50MB.'}</p>
                  {isUploadingDigitalFile && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden"><div className="bg-purple-600 h-2.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                  )}
                  {uploadError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-700 font-medium">Upload Failed</p><p className="text-xs text-red-600 mt-1">{uploadError}</p></div>}
                  <input type="file" className="hidden" id="digital-upload" disabled={isUploadingDigitalFile}
                    onChange={(e) => handleDigitalFileChange(e.target.files?.[0] || null)} />
                  <div className="flex gap-2 justify-center">
                    <Button type="button" variant="outline" onClick={() => document.getElementById('digital-upload')?.click()} disabled={isUploadingDigitalFile}>
                      {isUploadingDigitalFile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : uploadedDigitalFileUrl ? 'Change File' : 'Choose File'}
                    </Button>
                    {uploadedDigitalFileUrl && !isUploadingDigitalFile && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setUploadedDigitalFileUrl(''); setFormData({ ...formData, digitalFile: null }); setUploadError(''); }}>
                        <X className="w-4 h-4 mr-1" />Remove
                      </Button>
                    )}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* 4. Detail Sections */}
          <section className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">4</span>
                Detail Sections
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addDetailSection}><Plus className="w-4 h-4 mr-1" />Add Section</Button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDetailSectionDragEnd}>
              <SortableContext items={formData.detailSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {formData.detailSections.map(section => (
                    <SortableDetailSectionItem key={section.id} id={section.id}>
                      <div className="p-4 border border-border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Detail Section</Label>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeDetailSection(section.id)} className="text-destructive hover:text-destructive"><X className="w-4 h-4" /></Button>
                        </div>
                        <div><Label className="text-xs">Title</Label><Input value={section.title} onChange={(e) => updateDetailSection(section.id, { title: e.target.value })} placeholder="e.g. Product Details" className="h-9" /></div>
                        <div><Label className="text-xs">Content</Label><textarea value={section.content} onChange={(e) => updateDetailSection(section.id, { content: e.target.value })} placeholder="Enter section content..." className="w-full min-h-[100px] p-3 border border-border rounded-lg resize-y" /></div>
                      </div>
                    </SortableDetailSectionItem>
                  ))}
                  {formData.detailSections.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No detail sections added.</p>}
                </div>
              </SortableContext>
            </DndContext>
          </section>

          {/* 5. Custom Fields */}
          <section className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">5</span>
                Custom Fields (Admin Defined → Customer Filled)
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCustomField}><Plus className="w-4 h-4 mr-1" />Add Field</Button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCustomFieldDragEnd}>
              <SortableContext items={formData.customFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {formData.customFields.map(field => (
                    <SortableCustomFieldItem key={field.id} id={field.id}>
                      <div className="p-4 border border-border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Custom Field</Label>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeCustomField(field.id)} className="text-destructive hover:text-destructive"><X className="w-4 h-4" /></Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div><Label className="text-xs">Field Name *</Label><Input value={field.label} onChange={(e) => updateCustomField(field.id, { label: e.target.value })} placeholder="e.g. Upload Design" className="h-9" /></div>
                          <div><Label className="text-xs">Field Type *</Label>
                            <Select value={field.fieldType} onValueChange={(v) => updateCustomField(field.id, { fieldType: v })}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="url">URL</SelectItem>
                                <SelectItem value="image">Image / File Upload</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div><Label className="text-xs">Placeholder / Suggestion</Label><Input value={field.placeholder} onChange={(e) => updateCustomField(field.id, { placeholder: e.target.value })} placeholder="e.g. Upload high-resolution PNG/JPG" className="h-9" /></div>
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div><Label className="text-sm">Required Field</Label><p className="text-xs text-muted-foreground">Customer must fill this field</p></div>
                          <Switch checked={field.isRequired} onCheckedChange={(c) => updateCustomField(field.id, { isRequired: c })} />
                        </div>
                      </div>
                    </SortableCustomFieldItem>
                  ))}
                  {formData.customFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No custom fields added.</p>}
                </div>
              </SortableContext>
            </DndContext>
          </section>

          {/* 6. Variants */}
          <section className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">6</span>
                Variants (Price Calculation Based)
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}><Plus className="w-4 h-4 mr-1" />Add Variant</Button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleVariantDragEnd}>
              <SortableContext items={formData.variants.map(v => v.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {formData.variants.map(variant => (
                    <SortableVariantItem key={variant.id} id={variant.id}>
                      <div className="p-4 border border-border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Variant</Label>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(variant.id)} className="text-destructive hover:text-destructive"><X className="w-4 h-4" /></Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div><Label className="text-xs">Variant Name *</Label><Input value={variant.name} onChange={(e) => updateVariant(variant.id, { name: e.target.value })} placeholder="e.g. Size" className="h-9" /></div>
                          <div><Label className="text-xs">Variant Type</Label><Input value={variant.type} onChange={(e) => updateVariant(variant.id, { type: e.target.value })} placeholder="e.g. size" className="h-9" /></div>
                          <div><Label className="text-xs">Unit (optional)</Label><Input value={variant.unit} onChange={(e) => updateVariant(variant.id, { unit: e.target.value })} placeholder="e.g. cm, kg" className="h-9" /></div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Variant Options</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => addVariantOption(variant.id)}><Plus className="w-3 h-3 mr-1" />Add Option</Button>
                          </div>
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleOptionDragEnd(e, variant.id)}>
                            <SortableContext items={variant.options.map(o => o.id)} strategy={verticalListSortingStrategy}>
                              <div className="space-y-2">
                                {variant.options.map(option => (
                                  <SortableOptionItem key={option.id} id={option.id}>
                                    <div className="flex gap-2 items-end p-3 border border-border rounded-lg">
                                      <div className="flex-1"><Label className="text-xs">Option Value *</Label><Input value={option.value} onChange={(e) => updateVariantOption(variant.id, option.id, { value: e.target.value })} placeholder="e.g. Small, Medium, Large" className="h-9" /></div>
                                      <div className="w-32"><Label className="text-xs">Price Impact (₹)</Label>
                                        <div className="relative"><IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="number" value={option.priceModifier} onChange={(e) => updateVariantOption(variant.id, option.id, { priceModifier: parseFloat(e.target.value) || 0 })} className="h-9 pl-8" /></div>
                                      </div>
                                      <Button type="button" variant="ghost" size="sm" onClick={() => removeVariantOption(variant.id, option.id)} className="text-destructive hover:text-destructive"><X className="w-4 h-4" /></Button>
                                    </div>
                                  </SortableOptionItem>
                                ))}
                                {variant.options.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No options added.</p>}
                              </div>
                            </SortableContext>
                          </DndContext>
                        </div>
                      </div>
                    </SortableVariantItem>
                  ))}
                  {formData.variants.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No variants added.</p>}
                </div>
              </SortableContext>
            </DndContext>
          </section>

          {/* 7. Media Gallery */}
          <MediaUploadSection media={formData.media} onMediaChange={(media) => setFormData(prev => ({ ...prev, media }))} />

          {/* 8. Status */}
          <section className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">8</span>
              Product Status
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <Label className="text-base font-medium">Product Status</Label>
                <p className="text-sm text-muted-foreground">{formData.status === 'active' ? 'Visible to customers' : 'Hidden from customers (Draft)'}</p>
              </div>
              <Switch checked={formData.status === 'active'} onCheckedChange={(c) => setFormData({ ...formData, status: c ? 'active' : 'inactive' })} />
            </div>
          </section>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="sticky bottom-0 bg-white rounded-xl border border-border shadow-lg px-6 py-4 flex items-center justify-between z-30">
          <Button variant="outline" onClick={() => navigate('/admin-sara/products')} className="gap-2 h-11 px-6"><X className="w-4 h-4" />Cancel</Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => {
              // Save as draft
              const payload: any = {
                id: productId,
                name: formData.name || 'Untitled Product',
                type: activeType,
                categoryId: formData.categoryId ? Number(formData.categoryId) : null,
                description: formData.description,
                images: formData.media.map(m => m.url),
                media: formData.media.map((m, idx) => ({ url: m.url, type: m.type, displayOrder: m.displayOrder !== undefined ? m.displayOrder : idx })),
                detailSections: formData.detailSections,
                customFields: formData.customFields.map(f => ({ label: f.label, fieldType: f.fieldType, placeholder: f.placeholder, isRequired: f.isRequired })),
                variants: formData.variants.map(v => ({ name: v.name, type: v.type, unit: v.unit, options: v.options.map(o => ({ value: o.value, priceModifier: o.priceModifier })) })),
                status: 'inactive',
              };
              if (activeType === 'PLAIN') { payload.price = formData.pricePerMeter || 0; payload.pricePerMeter = formData.pricePerMeter || 0; payload.originalPrice = formData.pricePerMeter || 0; payload.plainProductId = formData.plainProductId || null; }
              else if (activeType === 'DESIGNED') { payload.designPrice = formData.designPrice; payload.price = formData.designPrice ?? formData.basePrice ?? 0; payload.originalPrice = payload.price; payload.recommendedPlainProductIds = formData.recommendedPlainProductIds; }
              else if (activeType === 'DIGITAL') { payload.price = formData.basePrice || 0; payload.originalPrice = payload.price; payload.fileUrl = uploadedDigitalFileUrl; }
              if (formData.gstRate !== '' && formData.gstRate !== null && formData.gstRate !== undefined) payload.gstRate = Number(formData.gstRate);
              if (formData.hsnCode) payload.hsnCode = formData.hsnCode;
              updateMutation.mutate({ id: productId!, data: payload });
              toast.success('Product saved as draft');
            }} className="gap-2 h-11 px-6">Save as Draft</Button>
            <Button className="btn-primary gap-2 h-11 px-8" onClick={handleSubmit} disabled={isUploadingDigitalFile || updateMutation.isPending}>
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProductEdit;
