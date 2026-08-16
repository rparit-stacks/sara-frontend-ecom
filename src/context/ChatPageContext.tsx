import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import type { PageContextDto } from '@/lib/api';

interface ChatPageContextType {
  getPageContext: () => PageContextDto | null;
  setPageContext: (context: PageContextDto | null) => void;
}

const ChatPageContext = createContext<ChatPageContextType | undefined>(undefined);

/**
 * Lets any page tell the site-wide chat widget what it's currently looking at (product,
 * category, cart, etc.) without prop-drilling — ChatWidget is mounted once, globally, in
 * App.tsx, outside <Routes>, so it has no per-page props to receive this through otherwise.
 * A ref (not state) backs this so setting it never re-renders the whole page tree; ChatWidget
 * only reads the latest value at send-time.
 */
export const ChatPageContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contextRef = useRef<PageContextDto | null>(null);

  const getPageContext = useCallback(() => contextRef.current, []);
  const setPageContext = useCallback((context: PageContextDto | null) => {
    contextRef.current = context;
  }, []);

  return (
    <ChatPageContext.Provider value={{ getPageContext, setPageContext }}>
      {children}
    </ChatPageContext.Provider>
  );
};

function useChatPageContextValue() {
  const ctx = useContext(ChatPageContext);
  if (!ctx) {
    throw new Error('useChatPageContext must be used within ChatPageContextProvider');
  }
  return ctx;
}

/** For ChatWidget: reads whatever the current page last set. */
export function useChatPageContext() {
  const { getPageContext } = useChatPageContextValue();
  return getPageContext;
}

/**
 * For pages: registers `context` as what the assistant should see while this page is mounted,
 * and clears it on unmount so a stale product/category doesn't leak into the next page's chat.
 */
export function useSetChatPageContext(context: PageContextDto | null) {
  const { setPageContext } = useChatPageContextValue();

  useEffect(() => {
    setPageContext(context);
    return () => setPageContext(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(context)]);
}
