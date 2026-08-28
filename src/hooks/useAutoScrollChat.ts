import { useEffect, useRef, useState, useCallback } from 'react';

const NEAR_BOTTOM_PX = 80;

/**
 * WhatsApp/Slack-style chat auto-scroll:
 *  - New message arrives while the user is already near the bottom -> scroll to it.
 *  - User has scrolled up to read history -> don't yank them down; instead
 *    surface a "new message" indicator (isAtBottom=false + newCount) they can
 *    tap to jump down.
 *  - Sending your own message always scrolls to bottom (call scrollToBottom()).
 *
 * `messageCount` should be the number of messages currently rendered (e.g.
 * activeMessages.length) — the hook scrolls whenever it grows.
 *
 * `typingVisible` is the typing-indicator's visibility. It's a rendered element that grows
 * the scroll height without changing messageCount, so without this the bubble could push the
 * newest message out of view. Toggling it on scrolls down too — but only for a user who is
 * already at the bottom, same rule as a new message.
 */
export function useAutoScrollChat(messageCount: number, typingVisible: boolean = false) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(messageCount);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
    setNewCount(0);
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    setIsAtBottom(atBottom);
    if (atBottom) setNewCount(0);
  }, []);

  useEffect(() => {
    const grew = messageCount > prevCount.current;
    const delta = messageCount - prevCount.current;
    prevCount.current = messageCount;
    if (!grew) return;
    if (isAtBottom) {
      // Already at the bottom — follow the conversation down.
      requestAnimationFrame(() => scrollToBottom(delta > 3 ? 'auto' : 'smooth'));
    } else {
      setNewCount((n) => n + delta);
    }
  }, [messageCount, isAtBottom, scrollToBottom]);

  // Typing bubble appeared — keep the newest message visible above it. Only when the user is
  // already at the bottom, and never a newCount bump (typing isn't an unread message).
  useEffect(() => {
    if (!typingVisible || !isAtBottom) return;
    requestAnimationFrame(() => scrollToBottom('smooth'));
  }, [typingVisible, isAtBottom, scrollToBottom]);

  // Jump straight to bottom (no animation) the first time a channel's messages load.
  const resetToBottom = useCallback(() => {
    prevCount.current = messageCount;
    setNewCount(0);
    setIsAtBottom(true);
    requestAnimationFrame(() => scrollToBottom('auto'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToBottom]);

  return { containerRef, bottomRef, isAtBottom, newCount, scrollToBottom, handleScroll, resetToBottom };
}
