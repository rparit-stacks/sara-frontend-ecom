import { useNavigate } from 'react-router-dom';
import { WhatsAppLayout } from '@/components/admin/whatsapp-cloud/WhatsAppLayout';
import { SendMessagePanel } from '@/components/admin/whatsapp-cloud/SendMessagePanel';

const WhatsAppSend = () => {
  const navigate = useNavigate();
  return (
    <WhatsAppLayout title="Send message" subtitle="Send one template message to one customer, for example to follow up on an order.">
      <SendMessagePanel onDone={() => navigate('/admin-sara/whatsapp/messages')} />
    </WhatsAppLayout>
  );
};
export default WhatsAppSend;
