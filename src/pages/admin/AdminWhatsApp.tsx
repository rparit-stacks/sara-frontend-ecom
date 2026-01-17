import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { whatsappApi } from '@/lib/api';
import { 
  MessageSquare, 
  Settings, 
  Users, 
  FileText, 
  Send, 
  History,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  TestTube,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

// Import components (will create these next)
import { WASenderAccountForm } from '@/components/admin/whatsapp/WASenderAccountForm';
import { ChatbotRuleForm } from '@/components/admin/whatsapp/ChatbotRuleForm';
import { OrderStatusTemplateEditor } from '@/components/admin/whatsapp/OrderStatusTemplateEditor';
import { MessageTemplateEditor } from '@/components/admin/whatsapp/MessageTemplateEditor';
import { ManualMessageSender } from '@/components/admin/whatsapp/ManualMessageSender';
import { BroadcastSender } from '@/components/admin/whatsapp/BroadcastSender';
import { MessageHistory } from '@/components/admin/whatsapp/MessageHistory';

const AdminWhatsApp = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('accounts');
  
  // Accounts
  const { data: accounts = [], refetch: refetchAccounts } = useQuery({
    queryKey: ['whatsapp-accounts'],
    queryFn: () => whatsappApi.accounts.getAll(),
  });
  
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  
  // Chatbot
  const { data: chatbotConfig, refetch: refetchChatbotConfig } = useQuery({
    queryKey: ['whatsapp-chatbot-config'],
    queryFn: () => whatsappApi.chatbot.getConfig(),
  });
  
  const { data: chatbotRules = [], refetch: refetchChatbotRules } = useQuery({
    queryKey: ['whatsapp-chatbot-rules'],
    queryFn: () => whatsappApi.chatbot.rules.getAll(),
  });
  
  const [showChatbotRuleForm, setShowChatbotRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  
  // Order Templates
  const { data: orderTemplates = [], refetch: refetchOrderTemplates } = useQuery({
    queryKey: ['whatsapp-order-templates'],
    queryFn: () => whatsappApi.orderTemplates.getAll(),
  });
  
  // Message Templates
  const { data: messageTemplates = [], refetch: refetchMessageTemplates } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => whatsappApi.templates.getAll(),
  });
  
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  
  // Messages
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['whatsapp-messages'],
    queryFn: () => whatsappApi.messages.getHistory(),
  });
  
  // Mutations
  const activateAccountMutation = useMutation({
    mutationFn: (id: number) => whatsappApi.accounts.activate(id),
    onSuccess: () => {
      refetchAccounts();
      toast.success('Account activated successfully!');
    },
  });
  
  const testConnectionMutation = useMutation({
    mutationFn: (id: number) => whatsappApi.accounts.testConnection(id),
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success('Connection test successful!');
      } else {
        toast.error(data.message || 'Connection test failed');
      }
    },
  });
  
  const deleteAccountMutation = useMutation({
    mutationFn: (id: number) => whatsappApi.accounts.delete(id),
    onSuccess: () => {
      refetchAccounts();
      toast.success('Account deleted successfully!');
    },
  });
  
  const toggleChatbotMutation = useMutation({
    mutationFn: (data: any) => whatsappApi.chatbot.updateConfig(data),
    onSuccess: () => {
      refetchChatbotConfig();
      toast.success('Chatbot configuration updated!');
    },
  });
  
  const toggleRuleMutation = useMutation({
    mutationFn: (id: number) => whatsappApi.chatbot.rules.toggle(id),
    onSuccess: () => {
      refetchChatbotRules();
      toast.success('Rule toggled successfully!');
    },
  });
  
  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => whatsappApi.chatbot.rules.delete(id),
    onSuccess: () => {
      refetchChatbotRules();
      toast.success('Rule deleted successfully!');
    },
  });
  
  const toggleTemplateMutation = useMutation({
    mutationFn: (statusType: string) => whatsappApi.orderTemplates.toggle(statusType),
    onSuccess: () => {
      refetchOrderTemplates();
      toast.success('Template toggled successfully!');
    },
  });
  
  const deleteMessageTemplateMutation = useMutation({
    mutationFn: (id: number) => whatsappApi.templates.delete(id),
    onSuccess: () => {
      refetchMessageTemplates();
      toast.success('Template deleted successfully!');
    },
  });
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
            WhatsApp <span className="text-primary">Automation</span>
          </h1>
          <p className="text-muted-foreground text-lg">Manage WhatsApp accounts, chatbot, and notifications</p>
        </motion.div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-2 overflow-x-auto">
            <TabsTrigger value="accounts" className="gap-2 whitespace-nowrap">
              <Users className="w-4 h-4" />
              <span className="hidden lg:inline">Accounts</span>
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="gap-2 whitespace-nowrap">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden lg:inline">Chatbot</span>
            </TabsTrigger>
            <TabsTrigger value="order-notifications" className="gap-2 whitespace-nowrap">
              <FileText className="w-4 h-4" />
              <span className="hidden lg:inline">Order Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2 whitespace-nowrap">
              <FileText className="w-4 h-4" />
              <span className="hidden lg:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2 whitespace-nowrap">
              <Send className="w-4 h-4" />
              <span className="hidden lg:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 whitespace-nowrap">
              <History className="w-4 h-4" />
              <span className="hidden lg:inline">History</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">WASender Accounts</h2>
              <Button onClick={() => { setEditingAccount(null); setShowAccountForm(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </div>
            
            <div className="grid gap-4">
              {accounts.map((account: any) => (
                <div key={account.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{account.accountName}</h3>
                      {account.isActive && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{account.whatsappNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    {!account.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activateAccountMutation.mutate(account.id)}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnectionMutation.mutate(account.id)}
                    >
                      <TestTube className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingAccount(account); setShowAccountForm(true); }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this account?')) {
                          deleteAccountMutation.mutate(account.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {showAccountForm && (
              <WASenderAccountForm
                account={editingAccount}
                onClose={() => { setShowAccountForm(false); setEditingAccount(null); }}
                onSuccess={() => { setShowAccountForm(false); setEditingAccount(null); refetchAccounts(); }}
              />
            )}
          </TabsContent>
          
          {/* Chatbot Tab */}
          <TabsContent value="chatbot" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Chatbot Configuration</h2>
            </div>
            
            {chatbotConfig && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Chatbot Status</h3>
                    <p className="text-sm text-muted-foreground">Enable or disable the chatbot</p>
                  </div>
                  <Button
                    variant={chatbotConfig.isEnabled ? "default" : "outline"}
                    onClick={() => toggleChatbotMutation.mutate({ ...chatbotConfig, isEnabled: !chatbotConfig.isEnabled })}
                  >
                    {chatbotConfig.isEnabled ? (
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
                
                <div>
                  <label className="text-sm font-medium">Default Fallback Reply</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded"
                    rows={3}
                    value={chatbotConfig.defaultFallbackReply || ''}
                    onChange={(e) => toggleChatbotMutation.mutate({ ...chatbotConfig, defaultFallbackReply: e.target.value })}
                    placeholder="Message sent when no keyword matches"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Webhook Secret (Optional)</label>
                  <input
                    type="password"
                    className="w-full mt-1 p-2 border rounded"
                    value={chatbotConfig.webhookSecret || ''}
                    onChange={(e) => toggleChatbotMutation.mutate({ ...chatbotConfig, webhookSecret: e.target.value })}
                    placeholder="WASender webhook secret for signature verification"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This is the secret key from WASender dashboard for webhook signature verification
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-6">
              <h2 className="text-2xl font-bold">Chatbot Rules</h2>
              <Button onClick={() => { setEditingRule(null); setShowChatbotRuleForm(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>
            
            <div className="grid gap-4">
              {chatbotRules.map((rule: any) => (
                <div key={rule.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Keyword: {rule.keyword}</h3>
                        {rule.isActive ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs text-muted-foreground">Priority: {rule.priority}</span>
                      </div>
                      {rule.userMessage && (
                        <p className="text-sm text-muted-foreground mt-1">Pattern: {rule.userMessage}</p>
                      )}
                      <p className="text-sm mt-2">Reply: {rule.botReply}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRuleMutation.mutate(rule.id)}
                      >
                        {rule.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditingRule(rule); setShowChatbotRuleForm(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this rule?')) {
                            deleteRuleMutation.mutate(rule.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {showChatbotRuleForm && (
              <ChatbotRuleForm
                rule={editingRule}
                onClose={() => { setShowChatbotRuleForm(false); setEditingRule(null); }}
                onSuccess={() => { setShowChatbotRuleForm(false); setEditingRule(null); refetchChatbotRules(); }}
              />
            )}
          </TabsContent>
          
          {/* Order Notifications Tab */}
          <TabsContent value="order-notifications" className="space-y-4">
            <h2 className="text-2xl font-bold">Order Status Notification Templates</h2>
            
            <div className="grid gap-4">
              {orderTemplates.map((template: any) => (
                <OrderStatusTemplateEditor
                  key={template.statusType}
                  template={template}
                  onUpdate={() => refetchOrderTemplates()}
                />
              ))}
            </div>
          </TabsContent>
          
          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Message Templates</h2>
              <Button onClick={() => { setEditingTemplate(null); setShowTemplateForm(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
            
            <div className="grid gap-4">
              {messageTemplates.map((template: any) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{template.content}</p>
                      {template.variables && template.variables.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium">Variables: </span>
                          <span className="text-xs text-muted-foreground">
                            {template.variables.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditingTemplate(template); setShowTemplateForm(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this template?')) {
                            deleteMessageTemplateMutation.mutate(template.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {showTemplateForm && (
              <MessageTemplateEditor
                template={editingTemplate}
                onClose={() => { setShowTemplateForm(false); setEditingTemplate(null); }}
                onSuccess={() => { setShowTemplateForm(false); setEditingTemplate(null); refetchMessageTemplates(); }}
              />
            )}
          </TabsContent>
          
          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <h2 className="text-2xl font-bold">Send Messages</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <ManualMessageSender onSuccess={() => refetchMessages()} />
              <BroadcastSender onSuccess={() => refetchMessages()} />
            </div>
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <h2 className="text-2xl font-bold">Message History</h2>
            <MessageHistory messages={messages} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminWhatsApp;
