import { WhatsAppLayout } from '@/components/admin/whatsapp-cloud/WhatsAppLayout';
import { PricingTab } from '@/components/admin/whatsapp-cloud/PricingTab';

const WhatsAppPricing = () => (
  <WhatsAppLayout title="Pricing" subtitle="What WhatsApp has cost so far, worked out from the messages that were delivered and Meta's rates. It is an estimate, so check Meta's bill for the real amount.">
    <PricingTab />
  </WhatsAppLayout>
);
export default WhatsAppPricing;
