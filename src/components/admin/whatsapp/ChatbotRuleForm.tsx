import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { whatsappApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ChatbotRuleFormProps {
  rule?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChatbotRuleForm = ({ rule, onClose, onSuccess }: ChatbotRuleFormProps) => {
  const [formData, setFormData] = useState({
    keyword: '',
    userMessage: '',
    botReply: '',
    isActive: true,
    priority: 0,
  });
  
  useEffect(() => {
    if (rule) {
      setFormData({
        keyword: rule.keyword || '',
        userMessage: rule.userMessage || '',
        botReply: rule.botReply || '',
        isActive: rule.isActive !== false,
        priority: rule.priority || 0,
      });
    }
  }, [rule]);
  
  const createMutation = useMutation({
    mutationFn: (data: any) => whatsappApi.chatbot.rules.create(data),
    onSuccess: () => {
      toast.success('Rule created successfully!');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create rule');
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => whatsappApi.chatbot.rules.update(id, data),
    onSuccess: () => {
      toast.success('Rule updated successfully!');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update rule');
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rule) {
      updateMutation.mutate({ id: rule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Chatbot Rule' : 'Create Chatbot Rule'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="keyword">Keyword *</Label>
            <Input
              id="keyword"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              required
              placeholder="e.g., hello, hi, help"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Message will match if it contains this keyword
            </p>
          </div>
          
          <div>
            <Label htmlFor="userMessage">User Message Pattern (Optional)</Label>
            <Input
              id="userMessage"
              value={formData.userMessage}
              onChange={(e) => setFormData({ ...formData, userMessage: e.target.value })}
              placeholder="Optional: specific message pattern to match"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to match any message containing the keyword
            </p>
          </div>
          
          <div>
            <Label htmlFor="botReply">Bot Reply *</Label>
            <Textarea
              id="botReply"
              value={formData.botReply}
              onChange={(e) => setFormData({ ...formData, botReply: e.target.value })}
              required
              rows={4}
              placeholder="Message to send when this rule matches"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Higher priority rules are checked first
              </p>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {rule ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
