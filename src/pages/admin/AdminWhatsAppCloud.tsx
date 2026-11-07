import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageCircle, Send } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { SendMessageDialog } from '@/components/admin/whatsapp-cloud/SendMessageDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessagesTab } from '@/components/admin/whatsapp-cloud/MessagesTab';
import { TemplatesTab } from '@/components/admin/whatsapp-cloud/TemplatesTab';
import { BroadcastsTab } from '@/components/admin/whatsapp-cloud/BroadcastsTab';
import { whatsappCloudApi } from '@/lib/api';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';
import { cn } from '@/lib/utils';

const AdminWhatsAppCloud = () => {
  const { hasAny } = useAdminPermissions();
  const canEdit = hasAny(P.WHATSAPP_UPDATE_TEMPLATES);
  const [sending, setSending] = useState(false);

  // A tiny call that tells us whether the WhatsApp service is reachable.
  const health = useQuery({
    queryKey: ['waCloudHealth'],
    queryFn: () => whatsappCloudApi.listMessages({ size: 1 }),
    refetchInterval: 60_000,
    retry: false,
  });
  const online = health.isSuccess;
  const message = (health.error as { message?: string } | null)?.message;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <MessageCircle className="h-6 w-6 text-emerald-600" /> WhatsApp Cloud
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Messages, broadcasts and templates sent through the WhatsApp Business Platform.</p>
          </div>
          <div className="flex items-center gap-3">
          {canEdit && (
            <Button className="gap-2" onClick={() => setSending(true)}>
              <Send className="h-4 w-4" /> Send message
            </Button>
          )}
          <div className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium', online ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : health.isLoading ? 'bg-muted text-muted-foreground' : 'border-red-200 bg-red-50 text-red-800')}>
            <span className={cn('h-2 w-2 rounded-full', online ? 'bg-emerald-500' : health.isLoading ? 'bg-slate-400' : 'bg-red-500')} />
            {online ? 'Connected' : health.isLoading ? 'Checking…' : 'Not connected'}
          </div>
          </div>
        </motion.div>

        <SendMessageDialog open={sending} onOpenChange={setSending} />

        {health.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {message || 'The WhatsApp service is not reachable.'} Check that it is running and that the service URL and API key are set in Runtime Config.
          </div>
        )}

        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <TabsContent value="messages"><MessagesTab canEdit={canEdit} /></TabsContent>
          <TabsContent value="broadcasts"><BroadcastsTab canEdit={canEdit} /></TabsContent>
          <TabsContent value="templates"><TemplatesTab canEdit={canEdit} /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminWhatsAppCloud;
