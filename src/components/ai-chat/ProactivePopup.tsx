import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const POPUP_SHOWN_KEY = 'aiChatPopupShown';
const SHOW_AFTER_MS = 4000;
const AUTO_HIDE_AFTER_MS = 10000;

interface ProactivePopupProps {
  onOpen: () => void;
  /** Suppressed while the chat panel itself is open. */
  chatIsOpen: boolean;
  /** Lets the pill button pulse in sync with the popup's visible window. */
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * A one-time, per-session attention nudge — not a second chat surface. Shows a short speech
 * bubble above the pill button a few seconds after page load, auto-hides itself, and never
 * shows again this session (sessionStorage, not localStorage — a fresh visit next session is
 * fine to nudge again). Clicking it opens the real chat panel.
 */
export function ProactivePopup({ onOpen, chatIsOpen, onVisibilityChange }: ProactivePopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [visible, onVisibilityChange]);

  useEffect(() => {
    if (chatIsOpen) {
      setVisible(false);
      return;
    }

    let alreadyShown = true;
    try {
      alreadyShown = sessionStorage.getItem(POPUP_SHOWN_KEY) === '1';
    } catch {
      // sessionStorage unavailable — treat as not-yet-shown so the nudge still appears once.
      alreadyShown = false;
    }
    if (alreadyShown) return;

    const showTimer = setTimeout(() => {
      setVisible(true);
      try {
        sessionStorage.setItem(POPUP_SHOWN_KEY, '1');
      } catch {
        // Ignore — worst case it can show again on the next page within the same session.
      }
    }, SHOW_AFTER_MS);

    return () => clearTimeout(showTimer);
  }, [chatIsOpen]);

  useEffect(() => {
    if (!visible) return;
    const hideTimer = setTimeout(() => setVisible(false), AUTO_HIDE_AFTER_MS);
    return () => clearTimeout(hideTimer);
  }, [visible]);

  const handleClick = () => {
    setVisible(false);
    onOpen();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-40 right-4 z-40 max-w-[220px] md:bottom-24 md:right-6"
        >
          <button
            type="button"
            onClick={handleClick}
            className="relative w-full rounded-2xl rounded-br-md bg-white p-3.5 text-left text-sm text-foreground shadow-medium ring-1 ring-black/[0.06] transition-transform hover:-translate-y-0.5"
          >
            <span
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
              }}
              role="button"
              aria-label="Dismiss"
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-white"
            >
              <X className="h-3 w-3" />
            </span>
            Hi! Need help finding something, or checking your order? 👋
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
