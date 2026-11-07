import { WhatsAppLayout } from '@/components/admin/whatsapp-cloud/WhatsAppLayout';
import { BroadcastList } from '@/components/admin/whatsapp-cloud/BroadcastList';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';

const WhatsAppBroadcasts = () => {
  const { hasAny } = useAdminPermissions();
  return (
    <WhatsAppLayout title="Broadcasts" subtitle="Send one template to many customers. Broadcasts are grouped by what they are doing right now, so you can see what is sending, waiting or finished.">
      <BroadcastList canEdit={hasAny(P.WHATSAPP_UPDATE_TEMPLATES)} />
    </WhatsAppLayout>
  );
};
export default WhatsAppBroadcasts;
