import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, Loader2, X, Truck, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { shippingApi } from '@/lib/api';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const AdminShipping = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    ruleName: '',
    scope: 'ALL_INDIA',
    state: '',
    calculationType: 'FLAT',
    flatPrice: '',
    freeShippingAbove: '',
    priority: '0',
    isActive: true,
    ranges: [] as Array<{ minCartValue: string; maxCartValue: string; shippingPrice: string; displayOrder: number }>,
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['admin-shipping-rules'],
    queryFn: () => shippingApi.getAllRules(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => shippingApi.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-rules'] });
      toast.success('Shipping rule created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create shipping rule');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => shippingApi.updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-rules'] });
      toast.success('Shipping rule updated successfully');
      setIsEditDialogOpen(false);
      setEditingRule(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update shipping rule');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: shippingApi.deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-rules'] });
      toast.success('Shipping rule deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete shipping rule');
    },
  });

  const resetForm = () => {
    setFormData({
      ruleName: '',
      scope: 'ALL_INDIA',
      state: '',
      calculationType: 'FLAT',
      flatPrice: '',
      freeShippingAbove: '',
      priority: '0',
      isActive: true,
      ranges: [],
    });
  };

  const handleCreate = () => {
    const data = {
      ruleName: formData.ruleName,
      scope: formData.scope,
      state: formData.scope === 'STATE_WISE' ? formData.state : null,
      calculationType: formData.calculationType,
      flatPrice: formData.calculationType === 'FLAT' ? (formData.flatPrice ? parseFloat(formData.flatPrice) : null) : null,
      freeShippingAbove: formData.freeShippingAbove ? parseFloat(formData.freeShippingAbove) : null,
      priority: parseInt(formData.priority) || 0,
      isActive: formData.isActive,
      ranges: formData.calculationType === 'RANGE_BASED' ? formData.ranges.map(r => ({
        minCartValue: r.minCartValue ? parseFloat(r.minCartValue) : null,
        maxCartValue: r.maxCartValue ? parseFloat(r.maxCartValue) : null,
        shippingPrice: parseFloat(r.shippingPrice) || 0,
        displayOrder: r.displayOrder || 0,
      })) : [],
    };
    createMutation.mutate(data);
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setFormData({
      ruleName: rule.ruleName || '',
      scope: rule.scope || 'ALL_INDIA',
      state: rule.state || '',
      calculationType: rule.calculationType || 'FLAT',
      flatPrice: rule.flatPrice?.toString() || '',
      freeShippingAbove: rule.freeShippingAbove?.toString() || '',
      priority: rule.priority?.toString() || '0',
      isActive: rule.isActive !== false,
      ranges: rule.ranges?.map((r: any) => ({
        minCartValue: r.minCartValue?.toString() || '',
        maxCartValue: r.maxCartValue?.toString() || '',
        shippingPrice: r.shippingPrice?.toString() || '',
        displayOrder: r.displayOrder || 0,
      })) || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingRule) return;
    const data = {
      ruleName: formData.ruleName,
      scope: formData.scope,
      state: formData.scope === 'STATE_WISE' ? formData.state : null,
      calculationType: formData.calculationType,
      flatPrice: formData.calculationType === 'FLAT' ? (formData.flatPrice ? parseFloat(formData.flatPrice) : null) : null,
      freeShippingAbove: formData.freeShippingAbove ? parseFloat(formData.freeShippingAbove) : null,
      priority: parseInt(formData.priority) || 0,
      isActive: formData.isActive,
      ranges: formData.calculationType === 'RANGE_BASED' ? formData.ranges.map(r => ({
        minCartValue: r.minCartValue ? parseFloat(r.minCartValue) : null,
        maxCartValue: r.maxCartValue ? parseFloat(r.maxCartValue) : null,
        shippingPrice: parseFloat(r.shippingPrice) || 0,
        displayOrder: r.displayOrder || 0,
      })) : [],
    };
    updateMutation.mutate({ id: editingRule.id, data });
  };

  const addRange = () => {
    setFormData({
      ...formData,
      ranges: [...formData.ranges, { minCartValue: '', maxCartValue: '', shippingPrice: '', displayOrder: formData.ranges.length }],
    });
  };

  const removeRange = (index: number) => {
    setFormData({
      ...formData,
      ranges: formData.ranges.filter((_, i) => i !== index),
    });
  };

  const updateRange = (index: number, field: string, value: string) => {
    const newRanges = [...formData.ranges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    setFormData({ ...formData, ranges: newRanges });
  };

  const filteredRules = rules.filter((rule: any) =>
    rule.ruleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shipping Rules</h1>
            <p className="text-muted-foreground mt-1">Manage shipping charges and rules</p>
          </div>
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Rule
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Rule Name</th>
                    <th className="text-left p-4">Scope</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Price/Ranges</th>
                    <th className="text-left p-4">Priority</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map((rule: any) => (
                    <tr key={rule.id} className="border-b hover:bg-secondary/50">
                      <td className="p-4 font-medium">{rule.ruleName || 'Unnamed Rule'}</td>
                      <td className="p-4">
                        <Badge variant={rule.scope === 'ALL_INDIA' ? 'default' : 'secondary'}>
                          {rule.scope === 'ALL_INDIA' ? 'All India' : rule.state || 'State'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{rule.calculationType}</Badge>
                      </td>
                      <td className="p-4">
                        {rule.calculationType === 'FLAT' ? (
                          <span>₹{rule.flatPrice}</span>
                        ) : (
                          <span>{rule.ranges?.length || 0} range(s)</span>
                        )}
                        {rule.freeShippingAbove && (
                          <span className="text-xs text-muted-foreground block">Free above ₹{rule.freeShippingAbove}</span>
                        )}
                      </td>
                      <td className="p-4">{rule.priority || 0}</td>
                      <td className="p-4">
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteMutation.mutate(rule.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Shipping Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rule Name *</Label>
                  <Input
                    value={formData.ruleName}
                    onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                    placeholder="e.g., Standard Shipping"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority *</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    placeholder="Higher = checked first"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scope *</Label>
                  <Select value={formData.scope} onValueChange={(val) => setFormData({ ...formData, scope: val, state: val === 'ALL_INDIA' ? '' : formData.state })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_INDIA">All India</SelectItem>
                      <SelectItem value="STATE_WISE">State Wise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.scope === 'STATE_WISE' && (
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select value={formData.state} onValueChange={(val) => setFormData({ ...formData, state: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Calculation Type *</Label>
                <Select value={formData.calculationType} onValueChange={(val) => setFormData({ ...formData, calculationType: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat Price</SelectItem>
                    <SelectItem value="RANGE_BASED">Range Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.calculationType === 'FLAT' && (
                <div className="space-y-2">
                  <Label>Flat Price (₹) *</Label>
                  <Input
                    type="number"
                    value={formData.flatPrice}
                    onChange={(e) => setFormData({ ...formData, flatPrice: e.target.value })}
                    placeholder="99"
                  />
                </div>
              )}

              {formData.calculationType === 'RANGE_BASED' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Cart Value Ranges</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addRange}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Range
                    </Button>
                  </div>
                  {formData.ranges.map((range, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 p-3 border rounded-lg">
                      <Input
                        type="number"
                        placeholder="Min (₹)"
                        value={range.minCartValue}
                        onChange={(e) => updateRange(index, 'minCartValue', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max (₹)"
                        value={range.maxCartValue}
                        onChange={(e) => updateRange(index, 'maxCartValue', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Price (₹) *"
                        value={range.shippingPrice}
                        onChange={(e) => updateRange(index, 'shippingPrice', e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRange(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.ranges.length === 0 && (
                    <p className="text-sm text-muted-foreground">Click "Add Range" to add cart value ranges</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Free Shipping Above (₹)</Label>
                <Input
                  type="number"
                  value={formData.freeShippingAbove}
                  onChange={(e) => setFormData({ ...formData, freeShippingAbove: e.target.value })}
                  placeholder="Optional - e.g., 1000"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={createMutation.isPending || !formData.ruleName || 
                    (formData.calculationType === 'FLAT' && !formData.flatPrice) ||
                    (formData.scope === 'STATE_WISE' && !formData.state) ||
                    (formData.calculationType === 'RANGE_BASED' && formData.ranges.length === 0)}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Shipping Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rule Name *</Label>
                  <Input
                    value={formData.ruleName}
                    onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority *</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scope *</Label>
                  <Select value={formData.scope} onValueChange={(val) => setFormData({ ...formData, scope: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_INDIA">All India</SelectItem>
                      <SelectItem value="STATE_WISE">State Wise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.scope === 'STATE_WISE' && (
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select value={formData.state} onValueChange={(val) => setFormData({ ...formData, state: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Calculation Type *</Label>
                <Select value={formData.calculationType} onValueChange={(val) => setFormData({ ...formData, calculationType: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat Price</SelectItem>
                    <SelectItem value="RANGE_BASED">Range Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.calculationType === 'FLAT' && (
                <div className="space-y-2">
                  <Label>Flat Price (₹) *</Label>
                  <Input
                    type="number"
                    value={formData.flatPrice}
                    onChange={(e) => setFormData({ ...formData, flatPrice: e.target.value })}
                  />
                </div>
              )}

              {formData.calculationType === 'RANGE_BASED' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Cart Value Ranges</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addRange}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Range
                    </Button>
                  </div>
                  {formData.ranges.map((range, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 p-3 border rounded-lg">
                      <Input
                        type="number"
                        placeholder="Min (₹)"
                        value={range.minCartValue}
                        onChange={(e) => updateRange(index, 'minCartValue', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Max (₹)"
                        value={range.maxCartValue}
                        onChange={(e) => updateRange(index, 'maxCartValue', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Price (₹) *"
                        value={range.shippingPrice}
                        onChange={(e) => updateRange(index, 'shippingPrice', e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRange(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Free Shipping Above (₹)</Label>
                <Input
                  type="number"
                  value={formData.freeShippingAbove}
                  onChange={(e) => setFormData({ ...formData, freeShippingAbove: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isActiveEdit">Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdate} 
                  disabled={updateMutation.isPending || !formData.ruleName || 
                    (formData.calculationType === 'FLAT' && !formData.flatPrice) ||
                    (formData.scope === 'STATE_WISE' && !formData.state)}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminShipping;
