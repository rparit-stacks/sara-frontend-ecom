import { WhatsAppLayout } from '@/components/admin/whatsapp-cloud/WhatsAppLayout';
import { MessagesTab } from '@/components/admin/whatsapp-cloud/MessagesTab';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';

const WhatsAppMessages = () => {
  const { hasAny } = useAdminPermissions();
  return (
    <WhatsAppLayout title="Messages" subtitle="Every WhatsApp message sent through the platform, with its delivery status. Open a message to see its full history, or send a failed one again.">
      <MessagesTab canEdit={hasAny(P.WHATSAPP_UPDATE_TEMPLATES)} />
    </WhatsAppLayout>
  );
};
export default WhatsAppMessages;
