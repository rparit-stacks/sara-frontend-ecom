import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Save, Type, FileText, Loader2, Search, Eye, Calendar, Mail, Phone, Image as ImageIcon, Plus, X, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FormBuilder, { FormField } from '@/components/admin/FormBuilder';
import { toast } from 'sonner';
import { customConfigApi } from '@/lib/api';

const AdminCustomConfig = () => {
  const queryClient = useQueryClient();
  
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  
  const [pageConfig, setPageConfig] = useState({
    title: 'Design Your Custom Piece',
    description: 'Upload your unique artwork and choose from our premium fabrics to create a one-of-a-kind Studio Sara product.',
    uploadLabel: 'Upload Design (PNG/JPG)',
    designPrice: 0,
    minQuantity: 1,
    maxQuantity: 100,
    termsAndConditions: '',
    // UI Text Fields
    uploadButtonText: 'Choose Design File',
    continueButtonText: 'Continue',
    submitButtonText: 'Submit',
    addToCartButtonText: 'Add to Cart',
    selectFabricLabel: 'Select Fabric',
    quantityLabel: 'Quantity',
    instructions: '',
    // Business Logic Fields
    gstRate: null as number | null,
    hsnCode: '',
    recommendedFabricIds: [] as number[],
  });
  
  const [variants, setVariants] = useState<any[]>([]);
  const [pricingSlabs, setPricingSlabs] = useState<any[]>([]);
  
  // Fetch config from API
  const { data: configData, isLoading, error } = useQuery({
    queryKey: ['customConfig'],
    queryFn: () => customConfigApi.getAdminConfig(),
  });
  
  // Fetch design requests
  const { data: designRequests = [], isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ['designRequests'],
    queryFn: () => customConfigApi.getDesignRequests(),
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: customConfigApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customConfig'] });
      toast.success('Custom product configuration saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save configuration');
    },
  });
  
  // Update design request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) => 
      customConfigApi.updateDesignRequestStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designRequests'] });
      toast.success('Status updated successfully!');
      setIsDetailDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });
  
  // Update local state when data loads
  useEffect(() => {
    if (configData) {
      // Map backend formFields to frontend format
      if (configData.formFields && Array.isArray(configData.formFields)) {
        const mappedFields = configData.formFields.map((field: any) => ({
          id: field.id ? String(field.id) : `field-${Date.now()}-${Math.random()}`,
          type: field.type || 'text',
          label: field.label || '',
          placeholder: field.placeholder || undefined,
          required: field.required || false,
          options: field.options || undefined,
          min: field.minValue || undefined,
          max: field.maxValue || undefined,
          validation: undefined, // Backend doesn't store validation, but frontend can add it
        }));
        setFormFields(mappedFields);
      } else {
        setFormFields([]);
      }
      
      // Update page config with all fields
      if (configData) {
        setPageConfig({
          title: configData.pageTitle || '',
          description: configData.pageDescription || '',
          uploadLabel: configData.uploadLabel || '',
          designPrice: configData.designPrice || 0,
          minQuantity: configData.minQuantity || 1,
          maxQuantity: configData.maxQuantity || 100,
          termsAndConditions: configData.termsAndConditions || '',
          uploadButtonText: configData.uploadButtonText || 'Choose Design File',
          continueButtonText: configData.continueButtonText || 'Continue',
          submitButtonText: configData.submitButtonText || 'Submit',
          addToCartButtonText: configData.addToCartButtonText || 'Add to Cart',
          selectFabricLabel: configData.selectFabricLabel || 'Select Fabric',
          quantityLabel: configData.quantityLabel || 'Quantity',
          instructions: configData.instructions || '',
          gstRate: configData.gstRate || null,
          hsnCode: configData.hsnCode || '',
          recommendedFabricIds: configData.recommendedFabricIds || [],
        });
      }
      
      // Update variants and pricing slabs
      if (configData.variants) setVariants(configData.variants);
      if (configData.pricingSlabs) setPricingSlabs(configData.pricingSlabs);
    }
  }, [configData]);

  const handleSave = () => {
    // Convert formFields to backend format
    const formFieldsPayload = formFields.map((field, index) => ({
      type: field.type,
      label: field.label,
      placeholder: field.placeholder || null,
      required: field.required || false,
      minValue: field.min || null,
      maxValue: field.max || null,
      options: field.type === 'dropdown' ? field.options : null,
      displayOrder: index,
    }));
    
    updateMutation.mutate({
      pageTitle: pageConfig.title,
      pageDescription: pageConfig.description,
      uploadLabel: pageConfig.uploadLabel,
      designPrice: pageConfig.designPrice,
      minQuantity: pageConfig.minQuantity,
      maxQuantity: pageConfig.maxQuantity,
      termsAndConditions: pageConfig.termsAndConditions,
      // UI Text Fields
      uploadButtonText: pageConfig.uploadButtonText,
      continueButtonText: pageConfig.continueButtonText,
      submitButtonText: pageConfig.submitButtonText,
      addToCartButtonText: pageConfig.addToCartButtonText,
      selectFabricLabel: pageConfig.selectFabricLabel,
      quantityLabel: pageConfig.quantityLabel,
      instructions: pageConfig.instructions,
      // Business Logic Fields
      gstRate: pageConfig.gstRate,
      hsnCode: pageConfig.hsnCode,
      recommendedFabricIds: pageConfig.recommendedFabricIds,
      // Variants and Pricing Slabs
      variants: variants,
      pricingSlabs: pricingSlabs,
      // Form Fields
      formFields: formFieldsPayload,
    });
  };
  
  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || '');
    setIsDetailDialogOpen(true);
  };
  
  const handleUpdateStatus = (status: string) => {
    if (selectedRequest) {
      updateStatusMutation.mutate({
        id: selectedRequest.id,
        status,
        notes: adminNotes || undefined,
      });
    }
  };
  
  const filteredRequests = designRequests.filter((request: any) => {
    const matchesSearch = 
      request.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.designType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
      IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
      COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
      CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge className={config.className}>{config.label}</Badge>;
  };
  
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
          <p className="text-destructive">Failed to load configuration. Please try again.</p>
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
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
              Custom Product <span className="text-primary">Config</span>
            </h1>
            <p className="text-muted-foreground text-lg">Configure the flow and options for user-uploaded designs</p>
          </div>
        </motion.div>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="requests">Design Requests ({designRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6">
            <div className="flex justify-end mb-4">
              <Button onClick={handleSave} className="btn-primary gap-2 h-11 px-8" disabled={updateMutation.isPending}>
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Page Content Config */}
                <section className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Type className="w-5 h-5 text-primary" />
                    Page Content & Labels
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Page Title</Label>
                      <Input 
                        value={pageConfig.title} 
                        onChange={(e) => setPageConfig({...pageConfig, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Button Label</Label>
                      <Input 
                        value={pageConfig.uploadLabel} 
                        onChange={(e) => setPageConfig({...pageConfig, uploadLabel: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Page Description</Label>
                      <Textarea 
                        value={pageConfig.description} 
                        onChange={(e) => setPageConfig({...pageConfig, description: e.target.value})}
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Design Price (₹)</Label>
                      <Input 
                        type="number"
                        value={pageConfig.designPrice} 
                        onChange={(e) => setPageConfig({...pageConfig, designPrice: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Quantity</Label>
                      <Input 
                        type="number"
                        value={pageConfig.minQuantity} 
                        onChange={(e) => setPageConfig({...pageConfig, minQuantity: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Quantity</Label>
                      <Input 
                        type="number"
                        value={pageConfig.maxQuantity} 
                        onChange={(e) => setPageConfig({...pageConfig, maxQuantity: parseInt(e.target.value) || 100})}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Terms & Conditions</Label>
                      <Textarea 
                        value={pageConfig.termsAndConditions} 
                        onChange={(e) => setPageConfig({...pageConfig, termsAndConditions: e.target.value})}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </section>

                {/* UI Text Fields */}
                <section className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Type className="w-5 h-5 text-primary" />
                    UI Text & Button Labels
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Upload Button Text</Label>
                      <Input 
                        value={pageConfig.uploadButtonText} 
                        onChange={(e) => setPageConfig({...pageConfig, uploadButtonText: e.target.value})}
                        placeholder="Choose Design File"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Continue Button Text</Label>
                      <Input 
                        value={pageConfig.continueButtonText} 
                        onChange={(e) => setPageConfig({...pageConfig, continueButtonText: e.target.value})}
                        placeholder="Continue"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Submit Button Text</Label>
                      <Input 
                        value={pageConfig.submitButtonText} 
                        onChange={(e) => setPageConfig({...pageConfig, submitButtonText: e.target.value})}
                        placeholder="Submit"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Add to Cart Button Text</Label>
                      <Input 
                        value={pageConfig.addToCartButtonText} 
                        onChange={(e) => setPageConfig({...pageConfig, addToCartButtonText: e.target.value})}
                        placeholder="Add to Cart"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Select Fabric Label</Label>
                      <Input 
                        value={pageConfig.selectFabricLabel} 
                        onChange={(e) => setPageConfig({...pageConfig, selectFabricLabel: e.target.value})}
                        placeholder="Select Fabric"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity Label</Label>
                      <Input 
                        value={pageConfig.quantityLabel} 
                        onChange={(e) => setPageConfig({...pageConfig, quantityLabel: e.target.value})}
                        placeholder="Quantity"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Instructions</Label>
                      <Textarea 
                        value={pageConfig.instructions} 
                        onChange={(e) => setPageConfig({...pageConfig, instructions: e.target.value})}
                        className="min-h-[100px]"
                        placeholder="Additional instructions for users..."
                      />
                    </div>
                  </div>
                </section>

                {/* Business Logic Fields */}
                <section className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Type className="w-5 h-5 text-primary" />
                    Business Logic & Tax Settings
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>GST Rate (%)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={pageConfig.gstRate || ''} 
                        onChange={(e) => setPageConfig({...pageConfig, gstRate: e.target.value ? parseFloat(e.target.value) : null})}
                        placeholder="e.g., 18"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>HSN Code</Label>
                      <Input 
                        value={pageConfig.hsnCode} 
                        onChange={(e) => setPageConfig({...pageConfig, hsnCode: e.target.value})}
                        placeholder="e.g., 5407"
                      />
                    </div>
                  </div>
                </section>

                {/* Form Builder */}
                <section className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Custom Form Builder
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Define the custom fields that users will fill after uploading their design. 
                    These fields will appear on the product page along with fabric selection.
                  </p>
                  <FormBuilder 
                    fields={formFields}
                    onChange={setFormFields}
                  />
                </section>

                {/* Variants Configuration */}
                <section className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Type className="w-5 h-5 text-primary" />
                      Product Variants
                    </h2>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setVariants([...variants, { type: '', name: '', unit: '', options: [], displayOrder: variants.length }])}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Variant
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Define variants (e.g., Size, Color) that will be available for all custom products.
                  </p>
                  <div className="space-y-4">
                    {variants.map((variant, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Variant {idx + 1}</h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Type (e.g., "size", "color")</Label>
                            <Input
                              value={variant.type || ''}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[idx].type = e.target.value;
                                setVariants(updated);
                              }}
                              placeholder="size"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Name (e.g., "Size", "Color")</Label>
                            <Input
                              value={variant.name || ''}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[idx].name = e.target.value;
                                setVariants(updated);
                              }}
                              placeholder="Size"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit (optional, e.g., "cm")</Label>
                            <Input
                              value={variant.unit || ''}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[idx].unit = e.target.value;
                                setVariants(updated);
                              }}
                              placeholder="cm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Display Order</Label>
                            <Input
                              type="number"
                              value={variant.displayOrder || 0}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[idx].displayOrder = parseInt(e.target.value) || 0;
                                setVariants(updated);
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Options</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updated = [...variants];
                                if (!updated[idx].options) updated[idx].options = [];
                                updated[idx].options.push({ value: '', priceModifier: 0, displayOrder: updated[idx].options.length });
                                setVariants(updated);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Option
                            </Button>
                          </div>
                          {variant.options && variant.options.map((option: any, optIdx: number) => (
                            <div key={optIdx} className="flex gap-2 items-end">
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={option.value || ''}
                                  onChange={(e) => {
                                    const updated = [...variants];
                                    updated[idx].options[optIdx].value = e.target.value;
                                    setVariants(updated);
                                  }}
                                  placeholder="Option value (e.g., Small)"
                                />
                              </div>
                              <div className="w-32 space-y-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={option.priceModifier || 0}
                                  onChange={(e) => {
                                    const updated = [...variants];
                                    updated[idx].options[optIdx].priceModifier = parseFloat(e.target.value) || 0;
                                    setVariants(updated);
                                  }}
                                  placeholder="Price modifier"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const updated = [...variants];
                                  updated[idx].options = updated[idx].options.filter((_: any, i: number) => i !== optIdx);
                                  setVariants(updated);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {variants.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No variants configured. Click "Add Variant" to get started.
                      </p>
                    )}
                  </div>
                </section>

                {/* Pricing Slabs Configuration */}
                <section className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Type className="w-5 h-5 text-primary" />
                      Pricing Slabs
                    </h2>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPricingSlabs([...pricingSlabs, { minQuantity: 0, maxQuantity: null, discountType: 'FIXED_AMOUNT', discountValue: 0, displayOrder: pricingSlabs.length }])}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Pricing Slab
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Define quantity-based pricing discounts that will apply to all custom products.
                  </p>
                  <div className="space-y-4">
                    {pricingSlabs.map((slab, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Pricing Slab {idx + 1}</h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setPricingSlabs(pricingSlabs.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Min Quantity</Label>
                            <Input
                              type="number"
                              value={slab.minQuantity || 0}
                              onChange={(e) => {
                                const updated = [...pricingSlabs];
                                updated[idx].minQuantity = parseInt(e.target.value) || 0;
                                setPricingSlabs(updated);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Max Quantity (leave empty for unlimited)</Label>
                            <Input
                              type="number"
                              value={slab.maxQuantity || ''}
                              onChange={(e) => {
                                const updated = [...pricingSlabs];
                                updated[idx].maxQuantity = e.target.value ? parseInt(e.target.value) : null;
                                setPricingSlabs(updated);
                              }}
                              placeholder="Unlimited"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Discount Type</Label>
                            <Select
                              value={slab.discountType || 'FIXED_AMOUNT'}
                              onValueChange={(value) => {
                                const updated = [...pricingSlabs];
                                updated[idx].discountType = value;
                                setPricingSlabs(updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FIXED_AMOUNT">Fixed Amount (₹)</SelectItem>
                                <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Discount Value</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={slab.discountValue || 0}
                              onChange={(e) => {
                                const updated = [...pricingSlabs];
                                updated[idx].discountValue = parseFloat(e.target.value) || 0;
                                setPricingSlabs(updated);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Display Order</Label>
                            <Input
                              type="number"
                              value={slab.displayOrder || 0}
                              onChange={(e) => {
                                const updated = [...pricingSlabs];
                                updated[idx].displayOrder = parseInt(e.target.value) || 0;
                                setPricingSlabs(updated);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {pricingSlabs.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No pricing slabs configured. Click "Add Pricing Slab" to get started.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              {/* Info Sidebar */}
              <div className="space-y-6">
                <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                  <h3 className="font-semibold text-primary mb-2">How it works</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    When a user uploads a design, they'll go through the same flow as a Design Product:
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                      User uploads design
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                      Product page opens (same as Design Product)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                      User selects fabric + variants
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                      Custom form appears for additional info
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                      Price = Design Price + Fabric Price
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, design type, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-11">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Design Requests List */}
            {requestsLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border border-border">
                    No design requests found.
                  </div>
                ) : (
                  filteredRequests.map((request: any, index: number) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="bg-white rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-lg">{request.fullName}</h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{request.email}</span>
                            </div>
                            {request.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                <span>{request.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {request.createdAt 
                                  ? new Date(request.createdAt).toLocaleDateString('en-IN', { 
                                      day: 'numeric', 
                                      month: 'short', 
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : '-'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-sm mb-1">
                              Design Type: <span className="text-muted-foreground">{request.designType || 'Not specified'}</span>
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {request.description}
                            </p>
                          </div>
                          {request.referenceImage && (() => {
                            const urls = String(request.referenceImage)
                              .split(',')
                              .map((u) => u.trim())
                              .filter(Boolean);
                            if (!urls.length) return null;
                            return (
                              <div className="mt-2 space-y-1.5">
                                <span className="text-xs font-medium text-muted-foreground">
                                  Reference Image{urls.length > 1 ? 's' : ''} ({urls.length})
                                </span>
                                <div className="flex flex-wrap gap-2 items-center">
                                  {urls.map((url: string, idx: number) => (
                                    <a
                                      key={`${request.id}-img-${idx}`}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex flex-col items-center gap-0.5 group"
                                    >
                                      <img
                                        src={url}
                                        alt={`Reference ${idx + 1}`}
                                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded border border-border bg-muted group-hover:ring-2 group-hover:ring-primary/50 transition-all"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                      <span className="text-[10px] xs:text-xs text-primary group-hover:underline">
                                        File {idx + 1}
                                      </span>
                                    </a>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {urls.map((url: string, idx: number) => (
                                    <a
                                      key={`${request.id}-link-${idx}`}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      Open {idx + 1}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex gap-2 lg:flex-col">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(request)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Design Request Details</DialogTitle>
              <DialogDescription>View and manage custom design request submission</DialogDescription>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-base font-medium">{selectedRequest.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base">{selectedRequest.email}</p>
                </div>
                
                {selectedRequest.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-base">{selectedRequest.phone}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Design Type</label>
                  <p className="text-base font-medium">{selectedRequest.designType || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-base whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
                
                {selectedRequest.referenceImage && (() => {
                  const urls = String(selectedRequest.referenceImage)
                    .split(',')
                    .map((u) => u.trim())
                    .filter(Boolean);
                  if (!urls.length) return null;
                  return (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Reference Image{urls.length > 1 ? 's' : ''} / Uploaded File{urls.length > 1 ? 's' : ''}
                      </label>
                      <div className="flex flex-wrap gap-3 mb-2">
                        {urls.map((url, idx) => (
                          <a
                            key={`detail-img-link-${idx}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>{`Open file ${idx + 1}`}</span>
                          </a>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {urls.map((url, idx) => (
                          <img
                            key={`detail-img-${idx}`}
                            src={url}
                            alt={`Reference ${idx + 1}`}
                            className="max-h-[180px] w-full object-contain rounded-lg border border-border bg-muted"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Submitted On</label>
                  <p className="text-base">
                    {selectedRequest.createdAt 
                      ? new Date(selectedRequest.createdAt).toLocaleString('en-IN', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this request..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('PENDING')}
                    disabled={updateStatusMutation.isPending || selectedRequest.status === 'PENDING'}
                    className="gap-2"
                  >
                    {updateStatusMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Mark as Pending'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('IN_PROGRESS')}
                    disabled={updateStatusMutation.isPending || selectedRequest.status === 'IN_PROGRESS'}
                    className="gap-2"
                  >
                    {updateStatusMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Mark as In Progress'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    disabled={updateStatusMutation.isPending || selectedRequest.status === 'COMPLETED'}
                    className="gap-2"
                  >
                    {updateStatusMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Mark as Completed'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('CANCELLED')}
                    disabled={updateStatusMutation.isPending || selectedRequest.status === 'CANCELLED'}
                    className="gap-2"
                  >
                    {updateStatusMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Cancel Request'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      setSelectedRequest(null);
                      setAdminNotes('');
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomConfig;
