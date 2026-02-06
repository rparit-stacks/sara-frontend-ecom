import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, Loader2, X, Calendar, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { couponApi } from '@/lib/api';

const AdminCoupons = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: '',
    minOrder: '',
    maxDiscount: '',
    usageLimit: '',
    perUserUsageLimit: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    applicability: 'GLOBAL' as 'GLOBAL' | 'USER_SPECIFIC',
    allowedUserEmail: '',
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => couponApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => couponApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create coupon');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => couponApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon updated successfully');
      setIsEditDialogOpen(false);
      setEditingCoupon(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update coupon');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: couponApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon deactivated and hidden');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete coupon');
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'PERCENTAGE',
      value: '',
      minOrder: '',
      maxDiscount: '',
      usageLimit: '',
      perUserUsageLimit: '',
      validFrom: '',
      validUntil: '',
      isActive: true,
      applicability: 'GLOBAL',
      allowedUserEmail: '',
    });
  };

  const handleCreate = () => {
    if (formData.applicability === 'USER_SPECIFIC' && !formData.allowedUserEmail?.trim()) {
      toast.error('Email is required for user-specific coupons');
      return;
    }
    const data = {
      code: formData.code,
      type: formData.type,
      value: parseFloat(formData.value) || 0,
      minOrder: formData.minOrder ? parseFloat(formData.minOrder) : null,
      maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      perUserUsageLimit: formData.perUserUsageLimit ? parseInt(formData.perUserUsageLimit) : null,
      validFrom: formData.validFrom || null,
      validUntil: formData.validUntil || null,
      isActive: formData.isActive,
      applicability: formData.applicability,
      allowedUserEmail: formData.applicability === 'USER_SPECIFIC' && formData.allowedUserEmail?.trim() ? formData.allowedUserEmail.trim() : null,
    };
    createMutation.mutate(data);
  };

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || '',
      type: coupon.type || 'PERCENTAGE',
      value: coupon.value?.toString() || '',
      minOrder: coupon.minOrder?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      perUserUsageLimit: coupon.perUserUsageLimit?.toString() || '',
      validFrom: coupon.validFrom ? (coupon.validFrom.includes('T') ? coupon.validFrom.slice(0, 16) : coupon.validFrom.split('T')[0]) : '',
      validUntil: coupon.validUntil ? (coupon.validUntil.includes('T') ? coupon.validUntil.slice(0, 16) : coupon.validUntil.split('T')[0]) : '',
      isActive: coupon.isActive !== false,
      applicability: (coupon.applicability === 'USER_SPECIFIC' ? 'USER_SPECIFIC' : 'GLOBAL') as 'GLOBAL' | 'USER_SPECIFIC',
      allowedUserEmail: coupon.allowedUserEmail || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingCoupon) return;
    if (formData.applicability === 'USER_SPECIFIC' && !formData.allowedUserEmail?.trim()) {
      toast.error('Email is required for user-specific coupons');
      return;
    }
    const data = {
      code: formData.code,
      type: formData.type,
      value: parseFloat(formData.value) || 0,
      minOrder: formData.minOrder ? parseFloat(formData.minOrder) : null,
      maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      perUserUsageLimit: formData.perUserUsageLimit ? parseInt(formData.perUserUsageLimit) : null,
      validFrom: formData.validFrom || null,
      validUntil: formData.validUntil || null,
      isActive: formData.isActive,
      applicability: formData.applicability,
      allowedUserEmail: formData.applicability === 'USER_SPECIFIC' && formData.allowedUserEmail?.trim() ? formData.allowedUserEmail.trim() : null,
    };
    updateMutation.mutate({ id: editingCoupon.id, data });
  };

  const filteredCoupons = coupons.filter((coupon: any) =>
    coupon.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Coupons</h1>
            <p className="text-muted-foreground mt-1">Manage discount coupons</p>
          </div>
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Coupon
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search coupons..."
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
                    <th className="text-left p-4">Code</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Value</th>
                    <th className="text-left p-4">Min Order</th>
                    <th className="text-left p-4">Applicability</th>
                    <th className="text-left p-4">Usage</th>
                    <th className="text-left p-4">Validity</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon: any) => (
                    <tr key={coupon.id} className="border-b hover:bg-secondary/50">
                      <td className="p-4 font-medium">{coupon.code}</td>
                      <td className="p-4">
                        <Badge variant={coupon.type === 'PERCENTAGE' ? 'default' : 'secondary'}>
                          {coupon.type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `₹${coupon.value}`}
                        {coupon.maxDiscount && coupon.type === 'PERCENTAGE' && (
                          <span className="text-xs text-muted-foreground ml-1">(max ₹{coupon.maxDiscount})</span>
                        )}
                      </td>
                      <td className="p-4">{coupon.minOrder ? `₹${coupon.minOrder}` : '-'}</td>
                      <td className="p-4">
                        {coupon.applicability === 'USER_SPECIFIC' ? (
                          <span className="text-xs" title={coupon.allowedUserEmail || ''}>User: {coupon.allowedUserEmail ? `${String(coupon.allowedUserEmail).slice(0, 20)}${String(coupon.allowedUserEmail).length > 20 ? '…' : ''}` : '-'}</span>
                        ) : (
                          <Badge variant="outline">Global</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        {coupon.usedCount ?? 0} / {coupon.usageLimit ?? '∞'}
                        {coupon.perUserUsageLimit != null && (
                          <span className="text-xs text-muted-foreground block">Per user: {coupon.perUserUsageLimit}</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {coupon.validFrom ? new Date(coupon.validFrom).toLocaleDateString() : '-'} – {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : '∞'}
                      </td>
                      <td className="p-4">
                        <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteMutation.mutate(coupon.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin text-destructive" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-destructive" />
                            )}
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="COUPON10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Value *</Label>
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === 'PERCENTAGE' ? '10' : '100'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Order (₹)</Label>
                  <Input
                    type="number"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {formData.type === 'PERCENTAGE' && (
                <div className="space-y-2">
                  <Label>Max Discount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Applicability *</Label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applicability-create"
                      checked={formData.applicability === 'GLOBAL'}
                      onChange={() => setFormData({ ...formData, applicability: 'GLOBAL', allowedUserEmail: '' })}
                      className="w-4 h-4"
                    />
                    <span>Global (all users)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applicability-create"
                      checked={formData.applicability === 'USER_SPECIFIC'}
                      onChange={() => setFormData({ ...formData, applicability: 'USER_SPECIFIC' })}
                      className="w-4 h-4"
                    />
                    <span>For specific user</span>
                  </label>
                </div>
                {formData.applicability === 'USER_SPECIFIC' && (
                  <div className="mt-2">
                    <Label>User email *</Label>
                    <Input
                      type="email"
                      value={formData.allowedUserEmail}
                      onChange={(e) => setFormData({ ...formData, allowedUserEmail: e.target.value })}
                      placeholder="user@example.com"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Global Usage Limit</Label>
                  <Input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per User Usage Limit</Label>
                  <Input
                    type="number"
                    value={formData.perUserUsageLimit}
                    onChange={(e) => setFormData({ ...formData, perUserUsageLimit: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From</Label>
                  <Input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
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
                <Button onClick={handleCreate} disabled={createMutation.isPending || !formData.code || !formData.value} className="gap-2">
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Value *</Label>
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Order (₹)</Label>
                  <Input
                    type="number"
                    value={formData.minOrder}
                    onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                  />
                </div>
              </div>

              {formData.type === 'PERCENTAGE' && (
                <div className="space-y-2">
                  <Label>Max Discount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Applicability *</Label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applicability-edit"
                      checked={formData.applicability === 'GLOBAL'}
                      onChange={() => setFormData({ ...formData, applicability: 'GLOBAL', allowedUserEmail: '' })}
                      className="w-4 h-4"
                    />
                    <span>Global (all users)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applicability-edit"
                      checked={formData.applicability === 'USER_SPECIFIC'}
                      onChange={() => setFormData({ ...formData, applicability: 'USER_SPECIFIC' })}
                      className="w-4 h-4"
                    />
                    <span>For specific user</span>
                  </label>
                </div>
                {formData.applicability === 'USER_SPECIFIC' && (
                  <div className="mt-2">
                    <Label>User email *</Label>
                    <Input
                      type="email"
                      value={formData.allowedUserEmail}
                      onChange={(e) => setFormData({ ...formData, allowedUserEmail: e.target.value })}
                      placeholder="user@example.com"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Global Usage Limit</Label>
                  <Input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per User Usage Limit</Label>
                  <Input
                    type="number"
                    value={formData.perUserUsageLimit}
                    onChange={(e) => setFormData({ ...formData, perUserUsageLimit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From</Label>
                  <Input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
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
                <Button onClick={handleUpdate} disabled={updateMutation.isPending || !formData.code || !formData.value} className="gap-2">
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCoupons;
