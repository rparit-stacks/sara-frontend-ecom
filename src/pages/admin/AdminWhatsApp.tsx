import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Save, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { whatsappApi } from '@/lib/api';

const TEMPLATE_LABELS: Record<string, string> = {
  signup: 'Signup welcome',
  login: 'Login alert',
  order_placed: 'Order placed',
  order_status: 'Order status update',
};

/** Message bodies sent by backend – must match whatsapp-templates.md (no placeholder at start/end) */
const TEMPLATE_BODIES: Record<string, string> = {
  signup: `Hello {{1}}! 👋

Welcome to {{2}}! We're so glad to have you.

Your account is all set with this email: {{3}}

You can now:
• Browse and save your favourite designs
• Place orders and track them easily
• Update your profile anytime

Need help? Just reply to this message. We're here for you.

— Studio Sara Team`,
  login: `Hello {{1}},

A login was detected on your {{2}} account.

Email: {{3}}
Time: {{4}}

If this was you, you can ignore this message.
If this wasn't you, please change your password or contact our support team immediately.

Regards,
Studio Sara Team`,
  order_placed: `Hi {{1}},

Your order is confirmed! 🎉

Order #{{2}}
Amount: {{3}}
{{4}}

We'll start preparing your order and will notify you as soon as it's shipped.

Thank you for choosing us.

— Studio Sara`,
  order_status: `Hi {{1}},

Update on your order #{{2}}

Status: {{3}}
{{4}}

{{5}}

Questions? Reply to this message — we're here to help.

— Studio Sara Team`,
};

const AdminWhatsApp = () => {
  const [logsPage, setLogsPage] = useState(0);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [expandedPayloadKey, setExpandedPayloadKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: templateConfig = [], isLoading: isLoadingConfig } = useQuery({
    queryKey: ['whatsappTemplateConfig'],
    queryFn: () => whatsappApi.getTemplateConfig(),
  });

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['whatsappLogs', logsPage],
    queryFn: () => whatsappApi.getLogs(logsPage, 20),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { key: string; templateName: string }) => whatsappApi.updateTemplateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappTemplateConfig'] });
      toast.success('Template name saved');
      setEditing({});
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to save'),
  });

  const handleSave = (key: string, currentName: string) => {
    const value = (editing[key] ?? currentName)?.trim();
    if (!value) return;
    updateMutation.mutate({ key, templateName: value });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-semibold text-4xl lg:text-5xl font-bold mb-2">
            WhatsApp <span className="text-primary">Notifications</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Template names (DoubleTick) and notification logs. Values from DB; empty DB uses application.properties.
          </p>
        </motion.div>

        {/* Template names */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Template names
          </h2>
          <p className="text-sm text-muted-foreground">
            Change these to match your DoubleTick template names. Saved in DB; if DB is empty, app uses application.properties.
          </p>
          {isLoadingConfig ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium w-10"></th>
                    <th className="p-3 text-left text-sm font-medium">Event</th>
                    <th className="p-3 text-left text-sm font-medium">Template name</th>
                    <th className="p-3 text-left text-sm font-medium">Source</th>
                    <th className="p-3 text-left text-sm font-medium w-24">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {templateConfig.map((row: { key: string; templateName: string; source: string }) => (
                    <Fragment key={row.key}>
                      <tr className="border-t">
                        <td className="p-2 w-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setExpandedPayloadKey((k) => (k === row.key ? null : row.key))}
                            title="Show message payload"
                          >
                            {expandedPayloadKey === row.key ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </td>
                        <td className="p-3 text-sm font-medium">
                          {TEMPLATE_LABELS[row.key] || row.key}
                        </td>
                        <td className="p-3">
                          <Input
                            className="max-w-md"
                            value={editing[row.key] ?? row.templateName}
                            onChange={(e) => setEditing((prev) => ({ ...prev, [row.key]: e.target.value }))}
                            placeholder="e.g. user_signup_welcome_v1"
                          />
                        </td>
                        <td className="p-3">
                          <Badge variant={row.source === 'db' ? 'default' : 'secondary'}>
                            {row.source === 'db' ? 'DB' : 'application.properties'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            onClick={() => handleSave(row.key, row.templateName)}
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                      {expandedPayloadKey === row.key && TEMPLATE_BODIES[row.key] && (
                        <tr className="border-t bg-muted/30">
                          <td colSpan={5} className="p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Message body (payload sent by backend — matches whatsapp-templates.md)
                            </p>
                            <pre className="text-sm whitespace-pre-wrap font-sans bg-background border rounded p-4 max-h-64 overflow-auto">
                              {TEMPLATE_BODIES[row.key]}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>

        {/* Logs */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Notification logs
          </h2>
          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Order ID</th>
                    <th className="p-3 text-left text-sm font-medium">Phone</th>
                    <th className="p-3 text-left text-sm font-medium">Message</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                    <th className="p-3 text-left text-sm font-medium">Fail reason</th>
                    <th className="p-3 text-left text-sm font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logsData?.content?.map((log: any) => (
                    <tr key={log.id} className="border-t">
                      <td className="p-3 text-sm">{log.orderId === 0 ? 'Test' : log.orderId ?? 'N/A'}</td>
                      <td className="p-3 text-sm">{log.phoneNumber}</td>
                      <td className="p-3 text-sm max-w-md truncate">{log.message}</td>
                      <td className="p-3 text-sm">
                        <Badge
                          variant={
                            log.deliveryStatus === 'SENT' || log.deliveryStatus === 'DELIVERED' || log.deliveryStatus === 'READ'
                              ? 'default'
                              : log.deliveryStatus === 'FAILED'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {log.deliveryStatus || '—'}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm max-w-xs text-muted-foreground" title={log.errorMessage}>
                        {log.errorMessage ? <span className="line-clamp-2">{log.errorMessage}</span> : '—'}
                      </td>
                      <td className="p-3 text-sm">{log.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logsData?.content?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No logs found</div>
              )}
            </div>
          )}
        </motion.section>
      </div>
    </AdminLayout>
  );
};

export default AdminWhatsApp;
