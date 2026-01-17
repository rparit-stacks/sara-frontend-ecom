import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { whatsappApi } from '@/lib/api';
import { toast } from 'sonner';
import { Eye, Loader2, Power, PowerOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface OrderStatusTemplateEditorProps {
  template: any;
  onUpdate: () => void;
}

export const OrderStatusTemplateEditor = ({ template, onUpdate }: OrderStatusTemplateEditorProps) => {
  // Initialize with template data or empty (will load default from backend)
  const [messageTemplate, setMessageTemplate] = useState(template?.messageTemplate || '');
  const [isEnabled, setIsEnabled] = useState(template?.isEnabled !== false);
  
  // Load template if not provided
  useEffect(() => {
    if (!template?.messageTemplate && template?.statusType) {
      // Template will be loaded from backend with defaults
    }
  }, [template]);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState('');
  
  const updateMutation = useMutation({
    mutationFn: (data: any) => whatsappApi.orderTemplates.update(template.statusType, data),
    onSuccess: () => {
      toast.success('Template updated successfully!');
      onUpdate();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update template');
    },
  });
  
  const toggleMutation = useMutation({
    mutationFn: () => whatsappApi.orderTemplates.toggle(template.statusType),
    onSuccess: () => {
      setIsEnabled(!isEnabled);
      toast.success('Template toggled successfully!');
      onUpdate();
    },
  });
  
  const previewMutation = useMutation({
    mutationFn: () => whatsappApi.orderTemplates.preview(template.statusType),
    onSuccess: (data: any) => {
      setPreview(data.preview);
      setShowPreview(true);
    },
  });
  
  const handleSave = () => {
    if (!messageTemplate || messageTemplate.trim().isEmpty()) {
      toast.error('Please enter a message template');
      return;
    }
    
    updateMutation.mutate({
      messageTemplate,
      isEnabled,
    });
  };
  
  const statusTypeLabels: Record<string, string> = {
    ORDER_PLACED: 'Order Placed',
    ORDER_CONFIRMED: 'Order Confirmed',
    PAYMENT_SUCCESS: 'Payment Success',
    PAYMENT_FAILED: 'Payment Failed',
    ORDER_SHIPPED: 'Order Shipped',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    REFUND_INITIATED: 'Refund Initiated',
    REFUND_COMPLETED: 'Refund Completed',
  };
  
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{statusTypeLabels[template.statusType] || template.statusType}</h3>
          <p className="text-xs text-muted-foreground">Status: {template.statusType}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => previewMutation.mutate()}
            disabled={previewMutation.isPending}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant={isEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
          >
            {isEnabled ? (
              <>
                <PowerOff className="w-4 h-4 mr-2" />
                Disable
              </>
            ) : (
              <>
                <Power className="w-4 h-4 mr-2" />
                Enable
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div>
        <Label>Message Template</Label>
        <Textarea
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          rows={6}
          placeholder="Enter message template. Use variables like {{order_id}}, {{name}}, {{amount}}, etc."
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Available variables: {'{{order_id}}'}, {'{{name}}'}, {'{{amount}}'}, {'{{status}}'}, {'{{payment_status}}'}, {'{{items_count}}'}, {'{{tracking_number}}'}, {'{{delivery_date}}'}
        </p>
      </div>
      
      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="w-full"
      >
        {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Template
      </Button>
      
      {showPreview && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Message Preview</DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-muted rounded-lg">
              <p className="whitespace-pre-wrap">{preview}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
