import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { currencyApi } from '@/lib/api';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  exchangeRates: Record<string, number>;
  setExchangeRates: (rates: Record<string, number>) => void;
  baseCurrency: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'selected_currency';
const DEFAULT_CURRENCY = 'INR';
const BASE_CURRENCY = 'INR';

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CURRENCY_STORAGE_KEY) || DEFAULT_CURRENCY;
    }
    return DEFAULT_CURRENCY;
  });

  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  // Fetch exchange rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        console.log('[CurrencyContext] Fetching exchange rates...');
        const data = await currencyApi.getRates();
        console.log('[CurrencyContext] Received rates:', data);
        if (data?.rates) {
          setExchangeRates(data.rates);
          console.log('[CurrencyContext] Exchange rates set:', Object.keys(data.rates).length, 'currencies');
        } else {
          console.warn('[CurrencyContext] No rates in response');
        }
      } catch (error) {
        console.error('[CurrencyContext] Failed to fetch exchange rates:', error);
      }
    };
    
    fetchRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchRates, 3600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    }
  }, [currency]);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        exchangeRates,
        setExchangeRates,
        baseCurrency: BASE_CURRENCY,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
