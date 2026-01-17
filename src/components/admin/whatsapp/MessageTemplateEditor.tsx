import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { whatsappApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

interface MessageTemplateEditorProps {
  template?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const MessageTemplateEditor = ({ template, onClose, onSuccess }: MessageTemplateEditorProps) => {
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    variables: [] as string[],
  });
  
  const [newVariable, setNewVariable] = useState('');
  
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        content: template.content || '',
        variables: template.variables || [],
      });
    }
  }, [template]);
  
  const createMutation = useMutation({
    mutationFn: (data: any) => whatsappApi.templates.create(data),
    onSuccess: () => {
      toast.success('Template created successfully!');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create template');
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => whatsappApi.templates.update(id, data),
    onSuccess: () => {
      toast.success('Template updated successfully!');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update template');
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (template) {
      updateMutation.mutate({ id: template.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };
  
  const addVariable = () => {
    if (newVariable.trim() && !formData.variables.includes(newVariable.trim())) {
      setFormData({
        ...formData,
        variables: [...formData.variables, newVariable.trim()],
      });
      setNewVariable('');
    }
  };
  
  const removeVariable = (variable: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v !== variable),
    });
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Message Template' : 'Create Message Template'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Welcome Message"
            />
          </div>
          
          <div>
            <Label htmlFor="content">Message Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={6}
              placeholder="Enter message template. Use variables like {{variable_name}}"
            />
          </div>
          
          <div>
            <Label>Available Variables</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                placeholder="Variable name (without {{}})"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addVariable();
                  }
                }}
              />
              <Button type="button" onClick={addVariable} variant="outline">
                Add
              </Button>
            </div>
            
            {formData.variables.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.variables.map((variable) => (
                  <span
                    key={variable}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-sm"
                  >
                    {'{{' + variable + '}}'}
                    <button
                      type="button"
                      onClick={() => removeVariable(variable)}
                      className="hover:bg-primary/20 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {template ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
