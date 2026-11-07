import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { WhatsAppLayout } from '@/components/admin/whatsapp-cloud/WhatsAppLayout';
import { BroadcastWizard } from '@/components/admin/whatsapp-cloud/BroadcastWizard';

const WhatsAppBroadcastNew = () => {
  const navigate = useNavigate();
  return (
    <WhatsAppLayout title="New broadcast" subtitle="Six short steps. Nothing is sent until the last one.">
      <Link to="/admin-sara/whatsapp/broadcasts" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All broadcasts</Link>
      <BroadcastWizard asPage onClose={() => navigate('/admin-sara/whatsapp/broadcasts')} />
    </WhatsAppLayout>
  );
};
export default WhatsAppBroadcastNew;
