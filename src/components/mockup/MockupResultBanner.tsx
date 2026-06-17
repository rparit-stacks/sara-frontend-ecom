import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MockupGeneratorResult } from './MockupGeneratorPopup';

interface MockupResultBannerProps {
  result: MockupGeneratorResult | null;
  onDismiss: () => void;
}

export function MockupResultBanner({ result, onDismiss }: MockupResultBannerProps) {
  if (!result) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `studio-sara-mockup-${Date.now()}.png`;
    link.click();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="mb-6 overflow-hidden rounded-2xl border border-[#2b9d8f]/30 bg-gradient-to-r from-teal-50 to-white shadow-lg"
      >
        <div className="flex items-center justify-between gap-3 bg-[#2b9d8f] px-4 py-3 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base truncate">Your AI mockup is ready!</p>
              <p className="text-xs text-white/80 truncate">
                {result.templateName} · {result.fabricType}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-full p-1.5 hover:bg-white/20 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
          <img
            src={result.imageUrl}
            alt="Generated fabric mockup"
            className="max-h-48 sm:max-h-56 rounded-xl object-contain shadow-md border border-border"
          />
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              This is a preview mockup with <strong>Studio Sara</strong> branding. Use it to see how your design looks on fabric.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 self-center sm:self-start"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download mockup
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
