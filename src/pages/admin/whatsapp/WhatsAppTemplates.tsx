import { WhatsAppLayout } from '@/components/admin/whatsapp-cloud/WhatsAppLayout';
import { TemplateGallery } from '@/components/admin/whatsapp-cloud/TemplateGallery';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';

const WhatsAppTemplates = () => {
  const { hasAny } = useAdminPermissions();
  return (
    <WhatsAppLayout title="Templates" subtitle="A template is a message WhatsApp lets you send first. Each one is reviewed by WhatsApp before you can use it. Templates the platform sends itself are marked and protected.">
      <TemplateGallery canEdit={hasAny(P.WHATSAPP_UPDATE_TEMPLATES)} />
    </WhatsAppLayout>
  );
};
export default WhatsAppTemplates;
