import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { registerLoadingCallback } from '@/lib/api';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string | null;
  setLoading: (loading: boolean, message?: string) => void;
  withMinimumDuration: <T>(promise: Promise<T>, minDuration?: number) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const setLoading = useCallback((loading: boolean, message?: string) => {
    if (loading) {
      startTimeRef.current = Date.now();
      setIsLoading(true);
      setLoadingMessage(message || null);
    } else {
      const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      const minDuration = 300; // Minimum 300ms visibility
      const remaining = Math.max(0, minDuration - elapsed);

      if (remaining > 0) {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(false);
          setLoadingMessage(null);
          startTimeRef.current = null;
        }, remaining);
      } else {
        setIsLoading(false);
        setLoadingMessage(null);
        startTimeRef.current = null;
      }
    }
  }, []);

  // Register with API loading system
  useEffect(() => {
    const unregister = registerLoadingCallback(setLoading);
    return unregister;
  }, [setLoading]);

  const withMinimumDuration = useCallback(async <T,>(
    promise: Promise<T>,
    minDuration: number = 300
  ): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await promise;
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);
      
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
      return result;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);
      
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
      throw error;
    }
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, loadingMessage, setLoading, withMinimumDuration }}>
      {children}
    </LoadingContext.Provider>
  );
};
