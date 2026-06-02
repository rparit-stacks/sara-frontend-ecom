import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { AiIntroDialog } from '@/components/admin/AiIntroDialog';
import { AiProductDialog } from '@/components/admin/AiProductDialog';

/**
 * Create-with-AI entry on the admin products page.
 * Opens an intro popup (what you can do + credit plans). The chat only opens
 * when the store has credits; otherwise the popup sells a credit pack.
 */
export function AiCreateButton() {
  const [introOpen, setIntroOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <Button
        type="button"
        className="gap-2 bg-gradient-to-tr from-rose-500 to-red-600 text-white hover:opacity-90"
        onClick={() => setIntroOpen(true)}
      >
        <FontAwesomeIcon icon={faWandMagicSparkles} className="h-4 w-4" />
        Create with AI
      </Button>

      <AiIntroDialog
        open={introOpen}
        onOpenChange={setIntroOpen}
        onStart={() => setChatOpen(true)}
      />
      <AiProductDialog open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
