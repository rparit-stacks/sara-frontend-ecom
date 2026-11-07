import { useNavigate } from 'react-router-dom';
import { BroadcastWizard } from '@/components/admin/whatsapp-cloud/BroadcastWizard';

/** Full-screen: the wizard covers the page, and closing it returns to the broadcast list. */
const WhatsAppBroadcastNew = () => {
  const navigate = useNavigate();
  return <BroadcastWizard asPage onClose={() => navigate('/admin-sara/whatsapp/broadcasts')} />;
};
export default WhatsAppBroadcastNew;
