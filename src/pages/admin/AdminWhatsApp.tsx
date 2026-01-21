import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2, MessageSquare, Settings, FileText, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { whatsappApi } from '@/lib/api';

const AdminWhatsApp = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCustomStatusDialogOpen, setIsCustomStatusDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedCustomStatus, setSelectedCustomStatus] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState({
    statusType: '',
    templateName: '',
    messageTemplate: '',
    isEnabled: true,
  });
  const [customStatusForm, setCustomStatusForm] = useState({
    statusName: '',
    displayName: '',
    templateId: null as number | null,
    isActive: true,
  });
  const [configForm, setConfigForm] = useState({
    doubletickApiKey: '',
    doubletickSenderNumber: '',
    doubletickTemplateName: '',
    doubletickEnabled: false,
  });
  const [logsPage, setLogsPage] = useState(0);
  
  const queryClient = useQueryClient();
  
  // Fetch templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['whatsappTemplates'],
    queryFn: () => whatsappApi.getTemplates(),
  });
  
  // Fetch custom statuses
  const { data: customStatuses = [], isLoading: isLoadingCustomStatuses } = useQuery({
    queryKey: ['whatsappCustomStatuses'],
    queryFn: () => whatsappApi.getCustomStatuses(),
  });
  
  // Fetch config
  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['whatsappConfig'],
    queryFn: () => whatsappApi.getConfig(),
    onSuccess: (data) => {
      if (data) {
        // Don't overwrite form if user is editing, only set initial values
        if (!configForm.doubletickApiKey && !configForm.doubletickSenderNumber) {
          setConfigForm({
            doubletickApiKey: '', // Keep empty, show masked in display
            doubletickSenderNumber: data.doubletickSenderNumber || '',
            doubletickTemplateName: data.doubletickTemplateName || '',
            doubletickEnabled: data.doubletickEnabled || false,
          });
        } else {
          // Only update enabled status if form wasn't manually changed
          setConfigForm(prev => ({
            ...prev,
            doubletickEnabled: data.doubletickEnabled || false,
          }));
        }
      }
    },
  });
  
  // Fetch logs
  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['whatsappLogs', logsPage],
    queryFn: () => whatsappApi.getLogs(logsPage, 20),
  });
  
  // Template mutations
  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => whatsappApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappTemplates'] });
      toast.success('Template created successfully!');
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create template');
    },
  });
  
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => whatsappApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappTemplates'] });
      toast.success('Template updated successfully!');
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update template');
    },
  });
  
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => whatsappApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappTemplates'] });
      toast.success('Template deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete template');
    },
  });
  
  // Custom Status mutations
  const createCustomStatusMutation = useMutation({
    mutationFn: (data: any) => whatsappApi.createCustomStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappCustomStatuses'] });
      toast.success('Custom status created successfully!');
      setIsCustomStatusDialogOpen(false);
      resetCustomStatusForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create custom status');
    },
  });
  
  const updateCustomStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => whatsappApi.updateCustomStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappCustomStatuses'] });
      toast.success('Custom status updated successfully!');
      setIsCustomStatusDialogOpen(false);
      resetCustomStatusForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update custom status');
    },
  });
  
  const deleteCustomStatusMutation = useMutation({
    mutationFn: (id: number) => whatsappApi.deleteCustomStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappCustomStatuses'] });
      toast.success('Custom status deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete custom status');
    },
  });
  
  // Config mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => whatsappApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappConfig'] });
      toast.success('Configuration updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update configuration');
    },
  });
  
  const resetTemplateForm = () => {
    setTemplateForm({
      statusType: '',
      templateName: '',
      messageTemplate: '',
      isEnabled: true,
    });
    setSelectedTemplate(null);
  };
  
  const resetCustomStatusForm = () => {
    setCustomStatusForm({
      statusName: '',
      displayName: '',
      templateId: null,
      isActive: true,
    });
    setSelectedCustomStatus(null);
  };
  
  const openTemplateDialog = (template?: any) => {
    if (template) {
      setSelectedTemplate(template);
      setTemplateForm({
        statusType: template.statusType || '',
        templateName: template.templateName || '',
        messageTemplate: template.messageTemplate || '',
        isEnabled: template.isEnabled !== undefined ? template.isEnabled : true,
      });
    } else {
      resetTemplateForm();
    }
    setIsTemplateDialogOpen(true);
  };
  
  const openCustomStatusDialog = (status?: any) => {
    if (status) {
      setSelectedCustomStatus(status);
      setCustomStatusForm({
        statusName: status.statusName || '',
        displayName: status.displayName || '',
        templateId: status.templateId || null,
        isActive: status.isActive !== undefined ? status.isActive : true,
      });
    } else {
      resetCustomStatusForm();
    }
    setIsCustomStatusDialogOpen(true);
  };
  
  const handleSaveTemplate = () => {
    if (!templateForm.statusType || !templateForm.messageTemplate) {
      toast.error('Status Type and Message Template are required');
      return;
    }
    
    if (selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };
  
  const handleSaveCustomStatus = () => {
    if (!customStatusForm.statusName || !customStatusForm.displayName) {
      toast.error('Status Name and Display Name are required');
      return;
    }
    
    if (selectedCustomStatus) {
      updateCustomStatusMutation.mutate({ id: selectedCustomStatus.id, data: customStatusForm });
    } else {
      createCustomStatusMutation.mutate(customStatusForm);
    }
  };
  
  const handleSaveConfig = () => {
    // Don't send masked API key or empty if user didn't change it
    const configToSave = {
      ...configForm,
      doubletickApiKey: configForm.doubletickApiKey && !configForm.doubletickApiKey.startsWith('***') 
        ? configForm.doubletickApiKey 
        : undefined, // Don't update if masked or empty
    };
    updateConfigMutation.mutate(configToSave);
  };
  
  const standardStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const availableStatusTypes = [...standardStatuses, ...customStatuses.map((s: any) => s.statusName)];
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-semibold text-4xl lg:text-5xl font-bold mb-2">
            WhatsApp <span className="text-primary">Notifications</span>
          </h1>
          <p className="text-muted-foreground text-lg">Manage WhatsApp templates, custom statuses, and notifications</p>
        </motion.div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates">
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="custom-statuses">
              <List className="w-4 h-4 mr-2" />
              Custom Statuses
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="w-4 h-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="logs">
              <MessageSquare className="w-4 h-4 mr-2" />
              Notification Logs
            </TabsTrigger>
          </TabsList>
          
          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Message Templates</h2>
              <Button onClick={() => openTemplateDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
            
            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {templates.map((template: any) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border rounded-lg bg-card"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={template.isEnabled ? 'default' : 'secondary'}>
                            {template.statusType}
                          </Badge>
                          {template.templateName && (
                            <span className="text-sm text-muted-foreground">
                              Template: {template.templateName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {template.messageTemplate}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTemplateDialog(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this template?')) {
                              deleteTemplateMutation.mutate(template.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {templates.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No templates found. Create your first template!
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Custom Statuses Tab */}
          <TabsContent value="custom-statuses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Custom Order Statuses</h2>
              <Button onClick={() => openCustomStatusDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Status
              </Button>
            </div>
            
            {isLoadingCustomStatuses ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {customStatuses.map((status: any) => (
                  <motion.div
                    key={status.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border rounded-lg bg-card"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={status.isActive ? 'default' : 'secondary'}>
                            {status.displayName}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ({status.statusName})
                          </span>
                        </div>
                        {status.templateId && (
                          <p className="text-sm text-muted-foreground">
                            Template ID: {status.templateId}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCustomStatusDialog(status)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this custom status?')) {
                              deleteCustomStatusMutation.mutate(status.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {customStatuses.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No custom statuses found. Create your first custom status!
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">DoubleTick Configuration</h2>
              {config && (
                <Badge variant={config.doubletickEnabled ? 'default' : 'secondary'} className="text-sm">
                  {config.doubletickEnabled ? '✓ Enabled' : '✗ Disabled'}
                </Badge>
              )}
            </div>
            
            {isLoadingConfig ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                {/* Current Status Card */}
                {config && (
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                    <h3 className="font-semibold text-sm">Current Configuration</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={config.doubletickEnabled ? 'default' : 'secondary'}>
                          {config.doubletickEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">API Key:</span>
                        <span className="font-mono text-xs">
                          {config.doubletickApiKey ? (
                            <span className="text-green-600">{config.doubletickApiKey}</span>
                          ) : (
                            <span className="text-red-600">Not Set</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Sender Number:</span>
                        <span className="font-mono">
                          {config.doubletickSenderNumber || (
                            <span className="text-red-600">Not Set</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Template Name:</span>
                        <span className="font-mono text-xs">
                          {config.doubletickTemplateName || (
                            <span className="text-yellow-600">Default: order_status_update</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <Input
                    type="password"
                    value={configForm.doubletickApiKey}
                    onChange={(e) => setConfigForm({ ...configForm, doubletickApiKey: e.target.value })}
                    placeholder={config?.doubletickApiKey ? `Current: ${config.doubletickApiKey}` : "Enter DoubleTick API Key"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {config?.doubletickApiKey 
                      ? `Current API key ends with: ${config.doubletickApiKey}. Leave empty to keep current key.`
                      : "Enter your DoubleTick API key to enable WhatsApp notifications"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sender Number</label>
                  <Input
                    value={configForm.doubletickSenderNumber}
                    onChange={(e) => setConfigForm({ ...configForm, doubletickSenderNumber: e.target.value })}
                    placeholder="Enter sender phone number (e.g., 919876543210)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your registered DoubleTick sender phone number in international format (without +)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    value={configForm.doubletickTemplateName}
                    onChange={(e) => setConfigForm({ ...configForm, doubletickTemplateName: e.target.value })}
                    placeholder="order_status_update"
                  />
                  <p className="text-xs text-muted-foreground">
                    DoubleTick approved template name. Leave empty to use default "order_status_update". 
                    Template must be approved in DoubleTick dashboard.
                  </p>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <label className="text-sm font-medium">Enable WhatsApp Notifications</label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable WhatsApp notifications for order status updates
                    </p>
                  </div>
                  <Switch
                    checked={configForm.doubletickEnabled}
                    onCheckedChange={(checked) => setConfigForm({ ...configForm, doubletickEnabled: checked })}
                  />
                </div>
                
                <Button
                  onClick={handleSaveConfig}
                  disabled={updateConfigMutation.isPending}
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <h2 className="text-2xl font-semibold">Notification Logs</h2>
            
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium">Order ID</th>
                        <th className="p-3 text-left text-sm font-medium">Phone</th>
                        <th className="p-3 text-left text-sm font-medium">Message</th>
                        <th className="p-3 text-left text-sm font-medium">Status</th>
                        <th className="p-3 text-left text-sm font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsData?.content?.map((log: any) => (
                        <tr key={log.id} className="border-t">
                          <td className="p-3 text-sm">{log.orderId || 'N/A'}</td>
                          <td className="p-3 text-sm">{log.phoneNumber}</td>
                          <td className="p-3 text-sm max-w-md truncate">{log.message}</td>
                          <td className="p-3 text-sm">
                            <Badge
                              variant={
                                log.deliveryStatus === 'SENT' || log.deliveryStatus === 'DELIVERED'
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {log.deliveryStatus || 'UNKNOWN'}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{log.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {logsData?.content?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No logs found
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Template Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
              <DialogDescription>
                Configure WhatsApp message template for order status notifications
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Type</label>
                <Select
                  value={templateForm.statusType}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, statusType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status type" />
                  </SelectTrigger>
                  <SelectContent>
                    {standardStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                    {customStatuses.map((status: any) => (
                      <SelectItem key={status.statusName} value={status.statusName}>
                        {status.displayName} ({status.statusName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name (Optional)</label>
                <Input
                  value={templateForm.templateName}
                  onChange={(e) => setTemplateForm({ ...templateForm, templateName: e.target.value })}
                  placeholder="DoubleTick template name (if using template messages)"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Message Template</label>
                <Textarea
                  value={templateForm.messageTemplate}
                  onChange={(e) => setTemplateForm({ ...templateForm, messageTemplate: e.target.value })}
                  placeholder="Enter message template with variables like {{name}}, {{order_id}}, {{amount}}, {{status}}"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {'{'}
                  {'{'}name{'}'}, {'{'}
                  {'{'}order_id{'}'}, {'{'}
                  {'{'}amount{'}'}, {'{'}
                  {'{'}status{'}'}, {'{'}
                  {'{'}custom_status{'}'}, {'{'}
                  {'{'}custom_message{'}'}, {'{'}
                  {'{'}payment_status{'}'}, {'{'}
                  {'{'}subtotal{'}'}, {'{'}
                  {'{'}gst{'}'}, {'{'}
                  {'{'}shipping{'}'}, {'{'}
                  {'{'}coupon_code{'}'}, {'{'}
                  {'{'}items_count{'}'}, {'{'}
                  {'{'}order_date{'}'}
                  {'}'}
                </p>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <label className="text-sm font-medium">Enabled</label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this template
                  </p>
                </div>
                <Switch
                  checked={templateForm.isEnabled}
                  onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isEnabled: checked })}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsTemplateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                >
                  {(createTemplateMutation.isPending || updateTemplateMutation.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Custom Status Dialog */}
        <Dialog open={isCustomStatusDialogOpen} onOpenChange={setIsCustomStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCustomStatus ? 'Edit Custom Status' : 'Create Custom Status'}
              </DialogTitle>
              <DialogDescription>
                Create a custom order status for special order states
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Name</label>
                <Input
                  value={customStatusForm.statusName}
                  onChange={(e) => setCustomStatusForm({ ...customStatusForm, statusName: e.target.value })}
                  placeholder="e.g., Out for Stitching"
                  disabled={!!selectedCustomStatus}
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for this status (cannot be changed after creation)
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  value={customStatusForm.displayName}
                  onChange={(e) => setCustomStatusForm({ ...customStatusForm, displayName: e.target.value })}
                  placeholder="e.g., Out for Stitching"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Template ID (Optional)</label>
                <Select
                  value={customStatusForm.templateId?.toString() || ''}
                  onValueChange={(value) => setCustomStatusForm({ ...customStatusForm, templateId: value ? parseInt(value) : null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {templates.map((template: any) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.statusType} - {template.templateName || 'No name'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <label className="text-sm font-medium">Active</label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this custom status
                  </p>
                </div>
                <Switch
                  checked={customStatusForm.isActive}
                  onCheckedChange={(checked) => setCustomStatusForm({ ...customStatusForm, isActive: checked })}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCustomStatusDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCustomStatus}
                  disabled={createCustomStatusMutation.isPending || updateCustomStatusMutation.isPending}
                >
                  {(createCustomStatusMutation.isPending || updateCustomStatusMutation.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
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

export default AdminWhatsApp;
