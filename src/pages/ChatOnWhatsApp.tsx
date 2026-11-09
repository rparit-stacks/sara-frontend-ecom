import { useEffect } from 'react';

const WHATSAPP_URL = 'https://wa.me/916362636113';

/** Opened from the "Chat with us" button of the auto-reply. Meta does not allow wa.me links in buttons, so the button points here and this page forwards on. */
const ChatOnWhatsApp = () => {
  useEffect(() => {
    window.location.replace(WHATSAPP_URL);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <p className="text-sm text-muted-foreground">
        Opening WhatsApp…{' '}
        <a href={WHATSAPP_URL} className="font-medium text-foreground underline underline-offset-2">
          Tap here if it does not open
        </a>
      </p>
    </div>
  );
};

export default ChatOnWhatsApp;
