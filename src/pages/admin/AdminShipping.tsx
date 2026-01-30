import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2, Truck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { shippingApi } from '@/lib/api';

type Slab = { id: number; minQuantity: number; maxQuantity: number | null; shippingPrice: number; displayOrder: number };

const AdminShipping = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<Slab | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    minQuantity: '',
    maxQuantity: '',
    shippingPrice: '',
    displayOrder: '0',
  });

  const { data: slabs = [], isLoading } = useQuery({
    queryKey: ['admin-shipping-quantity-slabs'],
    queryFn: () => shippingApi.getQuantitySlabs(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { minQuantity: number; maxQuantity?: number | null; shippingPrice: number; displayOrder?: number }) =>
      shippingApi.createQuantitySlab(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-quantity-slabs'] });
      toast.success('Quantity slab created');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create slab');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { minQuantity: number; maxQuantity?: number | null; shippingPrice: number; displayOrder?: number } }) =>
      shippingApi.updateQuantitySlab(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-quantity-slabs'] });
      toast.success('Quantity slab updated');
      setIsEditDialogOpen(false);
      setEditingSlab(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update slab');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => shippingApi.deleteQuantitySlab(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-quantity-slabs'] });
      toast.success('Quantity slab deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete slab');
    },
  });

  const resetForm = () => {
    setFormData({
      minQuantity: '',
      maxQuantity: '',
      shippingPrice: '',
      displayOrder: '0',
    });
  };

  const handleCreate = () => {
    const min = parseInt(formData.minQuantity, 10);
    if (isNaN(min) || min < 0) {
      toast.error('Min quantity must be 0 or greater');
      return;
    }
    const max = formData.maxQuantity.trim() === '' ? null : parseInt(formData.maxQuantity, 10);
    if (max !== null && (isNaN(max) || max < min)) {
      toast.error('Max quantity must be empty or >= min quantity');
      return;
    }
    const price = parseFloat(formData.shippingPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Shipping price must be 0 or greater');
      return;
    }
    const displayOrder = parseInt(formData.displayOrder, 10) || 0;
    createMutation.mutate({ minQuantity: min, maxQuantity: max, shippingPrice: price, displayOrder });
  };

  const handleEdit = (slab: Slab) => {
    setEditingSlab(slab);
    setFormData({
      minQuantity: String(slab.minQuantity),
      maxQuantity: slab.maxQuantity == null ? '' : String(slab.maxQuantity),
      shippingPrice: String(slab.shippingPrice),
      displayOrder: String(slab.displayOrder ?? 0),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingSlab) return;
    const min = parseInt(formData.minQuantity, 10);
    if (isNaN(min) || min < 0) {
      toast.error('Min quantity must be 0 or greater');
      return;
    }
    const max = formData.maxQuantity.trim() === '' ? null : parseInt(formData.maxQuantity, 10);
    if (max !== null && (isNaN(max) || max < min)) {
      toast.error('Max quantity must be empty or >= min quantity');
      return;
    }
    const price = parseFloat(formData.shippingPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Shipping price must be 0 or greater');
      return;
    }
    const displayOrder = parseInt(formData.displayOrder, 10) || 0;
    updateMutation.mutate({
      id: editingSlab.id,
      data: { minQuantity: min, maxQuantity: max, shippingPrice: price, displayOrder },
    });
  };

  const formatRange = (min: number, max: number | null) => {
    if (max == null) return `${min}+`;
    return `${min}–${max}`;
  };

  const slabList = slabs as Slab[];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Truck className="w-8 h-8" />
              Shipping – Quantity slabs
            </h1>
            <p className="text-muted-foreground mt-1">
              Set shipping cost by total cart quantity. Example: 1–5 qty → ₹50, 6–10 → ₹100, 11+ → free. Cart total quantity (sum of all item quantities) selects the slab; shipping updates when quantity changes.
            </p>
          </div>
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Add slab
          </Button>
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
                    <th className="text-left p-4">Min Qty</th>
                    <th className="text-left p-4">Max Qty</th>
                    <th className="text-left p-4">Shipping (₹)</th>
                    <th className="text-left p-4">Range</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slabList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No quantity slabs yet. Add one to set shipping by cart total quantity.
                      </td>
                    </tr>
                  ) : (
                    slabList.map((slab) => (
                      <tr key={slab.id} className="border-b hover:bg-secondary/50">
                        <td className="p-4 font-medium">{slab.minQuantity}</td>
                        <td className="p-4">{slab.maxQuantity == null ? '—' : slab.maxQuantity}</td>
                        <td className="p-4">₹{slab.shippingPrice}</td>
                        <td className="p-4 text-muted-foreground">{formatRange(slab.minQuantity, slab.maxQuantity)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(slab)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(slab.id)}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create slab dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add quantity slab</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Min quantity *</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                  placeholder="e.g. 1"
                />
              </div>
              <div className="space-y-2">
                <Label>Max quantity (leave empty for &quot;above min&quot;)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.maxQuantity}
                  onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
                  placeholder="e.g. 5 or empty"
                />
              </div>
              <div className="space-y-2">
                <Label>Shipping price (₹) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.shippingPrice}
                  onChange={(e) => setFormData({ ...formData, shippingPrice: e.target.value })}
                  placeholder="e.g. 50"
                />
              </div>
              <div className="space-y-2">
                <Label>Display order (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || formData.minQuantity === '' || formData.shippingPrice === ''}
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit slab dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit quantity slab</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Min quantity *</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max quantity (leave empty for &quot;above min&quot;)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.maxQuantity}
                  onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Shipping price (₹) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.shippingPrice}
                  onChange={(e) => setFormData({ ...formData, shippingPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Display order (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending || formData.minQuantity === '' || formData.shippingPrice === ''}
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Update
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
