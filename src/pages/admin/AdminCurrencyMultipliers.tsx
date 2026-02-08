import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Edit, Plus, Loader2, Globe2, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { currencyMultiplierAdminApi } from '@/lib/api';

type Multiplier = {
  id: number;
  currencyCode: string;
  multiplier: number;
  rateToInr?: number | null;
};

const AdminCurrencyMultipliers = () => {
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Multiplier | null>(null);
  const [formData, setFormData] = useState<{ currencyCode: string; multiplier: string; rateToInr: string }>({
    currencyCode: '',
    multiplier: '',
    rateToInr: '',
  });

  const { data: multipliers = [], isLoading } = useQuery({
    queryKey: ['admin-currency-multipliers'],
    queryFn: () => currencyMultiplierAdminApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { currencyCode: string; multiplier: number; rateToInr?: number }) =>
      currencyMultiplierAdminApi.create(data),
    onSuccess: () => {
      toast.success('Multiplier saved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-currency-multipliers'] });
      setIsDialogOpen(false);
      setEditing(null);
      setFormData({ currencyCode: '', multiplier: '', rateToInr: '' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save multiplier');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { currencyCode?: string; multiplier?: number; rateToInr?: number | null } }) =>
      currencyMultiplierAdminApi.update(id, data),
    onSuccess: () => {
      toast.success('Multiplier updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-currency-multipliers'] });
      setIsDialogOpen(false);
      setEditing(null);
      setFormData({ currencyCode: '', multiplier: '', rateToInr: '' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update multiplier');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => currencyMultiplierAdminApi.delete(id),
    onSuccess: () => {
      toast.success('Multiplier deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-currency-multipliers'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete multiplier');
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormData({ currencyCode: '', multiplier: '', rateToInr: '' });
    setIsDialogOpen(true);
  };

  const openEdit = (item: Multiplier) => {
    setEditing(item);
    setFormData({
      currencyCode: item.currencyCode || '',
      multiplier: item.multiplier?.toString() || '',
      rateToInr: item.rateToInr != null ? String(item.rateToInr) : '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = formData.currencyCode.trim().toUpperCase();
    const multiplierValue = parseFloat(formData.multiplier);
    const rateToInrValue = formData.rateToInr.trim() ? parseFloat(formData.rateToInr) : undefined;

    if (!code) {
      toast.error('Currency code is required');
      return;
    }
    if (Number.isNaN(multiplierValue) || multiplierValue <= 0) {
      toast.error('Multiplier must be a positive number');
      return;
    }
    if (rateToInrValue !== undefined && (Number.isNaN(rateToInrValue) || rateToInrValue <= 0)) {
      toast.error('Rate to INR must be a positive number (e.g. 85 for 1 USD = 85 INR)');
      return;
    }

    const payload = {
      currencyCode: code,
      multiplier: multiplierValue,
      ...(rateToInrValue != null && rateToInrValue > 0 ? { rateToInr: rateToInrValue } : editing ? { rateToInr: null } : {}),
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload as { currencyCode: string; multiplier: number; rateToInr?: number });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Currency Multipliers</h1>
              <p className="text-muted-foreground">
                Configure price multipliers per currency before exchange rate conversion.
              </p>
            </div>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Multiplier
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
                  <tr className="border-b bg-muted/40">
                    <th className="text-left p-4">Currency Code</th>
                    <th className="text-left p-4">Multiplier</th>
                    <th className="text-left p-4">Rate to INR (1 unit =)</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {multipliers.length === 0 ? (
                    <tr>
                      <td className="p-4 text-sm text-muted-foreground" colSpan={4}>
                        No multipliers configured yet. Click &quot;Add Multiplier&quot; to create one.
                      </td>
                    </tr>
                  ) : (
                    multipliers.map((item: any) => (
                      <tr key={item.id} className="border-b hover:bg-secondary/40">
                        <td className="p-4 font-medium flex items-center gap-2">
                          <span>{item.currencyCode}</span>
                          {item.currencyCode === 'INR' && (
                            <span className="text-xs text-muted-foreground">
                              (India base – always treated as 1x)
                            </span>
                          )}
                        </td>
                        <td className="p-4 flex items-center gap-2">
                          <Percent className="w-4 h-4 text-muted-foreground" />
                          <span>{item.multiplier}</span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {item.rateToInr != null ? `1 ${item.currencyCode} = ${item.rateToInr} INR` : '—'}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(item.id)}
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Edit Currency Multiplier' : 'Add Currency Multiplier'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Currency Code (e.g., USD, EUR, AED)</Label>
                <Input
                  value={formData.currencyCode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, currencyCode: e.target.value }))
                  }
                  placeholder="USD"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label>Multiplier (e.g., 2, 1.2)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.multiplier}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, multiplier: e.target.value }))
                  }
                  placeholder="1.00"
                />
                <p className="text-xs text-muted-foreground">
                  Base price × multiplier = stored order value in INR. Admin sees this INR; user sees it converted using Rate to INR.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Rate to INR (e.g. 85 for 1 USD = 85 INR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.rateToInr}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, rateToInr: e.target.value }))
                  }
                  placeholder="85"
                />
                <p className="text-xs text-muted-foreground">
                  User sees: (order total in INR) ÷ this rate = amount in their currency. Required for non-INR display.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCurrencyMultipliers;

