import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { whatsappApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface WASenderAccountFormProps {
  account?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const WASenderAccountForm = ({ account, onClose, onSuccess }: WASenderAccountFormProps) => {
  const [formData, setFormData] = useState({
    accountName: '',
    bearerToken: '',
    whatsappNumber: '',
  });
  
  useEffect(() => {
    if (account) {
      setFormData({
        accountName: account.accountName || '',
        bearerToken: '', // Don't pre-fill token for security
        whatsappNumber: account.whatsappNumber || '',
      });
    }
  }, [account]);
  
  const createMutation = useMutation({
    mutationFn: (data: any) => whatsappApi.accounts.create(data),
    onSuccess: () => {
      toast.success('Account created successfully!');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create account');
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => whatsappApi.accounts.update(id, data),
    onSuccess: () => {
      toast.success('Account updated successfully!');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update account');
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (account) {
      updateMutation.mutate({ id: account.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? 'Edit Account' : 'Add WASender Account'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              required
              placeholder="e.g., Main Account"
            />
          </div>
          
          <div>
            <Label htmlFor="bearerToken">Bearer Token</Label>
            <Input
              id="bearerToken"
              type="password"
              value={formData.bearerToken}
              onChange={(e) => setFormData({ ...formData, bearerToken: e.target.value })}
              required={!account}
              placeholder="Enter bearer token"
            />
            {account && (
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to keep existing token
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              required
              placeholder="e.g., +919876543210"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {account ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
