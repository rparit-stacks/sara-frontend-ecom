import { WhatsAppLayout } from '@/components/admin/whatsapp-cloud/WhatsAppLayout';
import { IncomingTab } from '@/components/admin/whatsapp-cloud/IncomingTab';

const WhatsAppIncoming = () => (
  <WhatsAppLayout title="Incoming" subtitle="Messages customers sent to the business number. Each new sender gets one automatic notice, then none for 6 hours.">
    <IncomingTab />
  </WhatsAppLayout>
);
export default WhatsAppIncoming;
