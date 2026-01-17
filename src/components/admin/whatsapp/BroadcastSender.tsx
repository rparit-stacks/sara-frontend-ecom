import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { whatsappApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';

interface BroadcastSenderProps {
  onSuccess: () => void;
}

export const BroadcastSender = ({ onSuccess }: BroadcastSenderProps) => {
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [message, setMessage] = useState('');
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [selectedTemplateValue, setSelectedTemplateValue] = useState<string>('none');
  
  const { data: templates = [] } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => whatsappApi.templates.getAll(),
  });
  
  const broadcastMutation = useMutation({
    mutationFn: (data: any) => whatsappApi.messages.broadcast(data),
    onSuccess: (data: any) => {
      toast.success(`Broadcast sent! ${data.sent}/${data.total} messages sent successfully`);
      setPhoneNumbers('');
      setMessage('');
      setTemplateId(null);
      setVariables({});
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send broadcast');
    },
  });
  
  const selectedTemplate = templates.find((t: any) => t.id === templateId);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numbers = phoneNumbers.split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
    
    if (numbers.length === 0) {
      toast.error('Please enter at least one phone number');
      return;
    }
    
    if (!message && !templateId) {
      toast.error('Please enter a message or select a template');
      return;
    }
    
    broadcastMutation.mutate({
      phoneNumbers: numbers,
      message: templateId ? undefined : message,
      templateId: templateId || undefined,
      variables: Object.keys(variables).length > 0 ? variables : undefined,
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Send Broadcast
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phoneNumbers">Phone Numbers (one per line) *</Label>
            <Textarea
              id="phoneNumbers"
              value={phoneNumbers}
              onChange={(e) => setPhoneNumbers(e.target.value)}
              required
              rows={6}
              placeholder="+919876543210&#10;+919876543211&#10;+919876543212"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter one phone number per line
            </p>
          </div>
          
          <div>
            <Label htmlFor="template">Use Template (Optional)</Label>
            <Select
              value={selectedTemplateValue}
              onValueChange={(value) => {
                setSelectedTemplateValue(value);
                if (value === 'none') {
                  setTemplateId(null);
                  setVariables({});
                } else {
                  const id = parseInt(value);
                  setTemplateId(id);
                  setMessage('');
                  const template = templates.find((t: any) => t.id === id);
                  if (template?.variables) {
                    const vars: Record<string, string> = {};
                    template.variables.forEach((v: string) => {
                      vars[v] = '';
                    });
                    setVariables(vars);
                  } else {
                    setVariables({});
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None - Use custom message</SelectItem>
                {templates.map((template: any) => (
                  <SelectItem key={template.id} value={template.id.toString()}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <Label>Template Variables</Label>
              {selectedTemplate.variables.map((variable: string) => (
                <Input
                  key={variable}
                  value={variables[variable] || ''}
                  onChange={(e) => setVariables({ ...variables, [variable]: e.target.value })}
                  placeholder={`{{${variable}}}`}
                />
              ))}
            </div>
          )}
          
          {selectedTemplateValue === 'none' && (
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                placeholder="Enter message content"
              />
            </div>
          )}
          
          <Button type="submit" disabled={broadcastMutation.isPending} className="w-full">
            {broadcastMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send Broadcast ({phoneNumbers.split('\n').filter(n => n.trim()).length} recipients)
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
