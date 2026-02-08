import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { currencyApi } from '@/lib/api';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  exchangeRates: Record<string, number>;
  setExchangeRates: (rates: Record<string, number>) => void;
  multipliers: Record<string, number>;
  setMultipliers: (multipliers: Record<string, number>) => void;
  /** From DB: 1 unit of currency = ratesToInr INR (e.g. USD: 85). Used for display and order exchangeRate. */
  ratesToInr: Record<string, number>;
  setRatesToInr: (rates: Record<string, number>) => void;
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
  const [multipliers, setMultipliers] = useState<Record<string, number>>({});
  const [ratesToInr, setRatesToInr] = useState<Record<string, number>>({});

  // Fetch exchange rates & multipliers on mount
  useEffect(() => {
    const fetchCurrencyData = async () => {
      try {
        console.log('[CurrencyContext] Fetching exchange rates and multipliers...');

        const [ratesData, multipliersData] = await Promise.allSettled([
          currencyApi.getRates(),
          currencyApi.getMultipliers(),
        ]);

        if (ratesData.status === 'fulfilled') {
          const data = ratesData.value;
          console.log('[CurrencyContext] Received rates:', data);
          if (data?.rates) {
            setExchangeRates(data.rates);
            console.log('[CurrencyContext] Exchange rates set:', Object.keys(data.rates).length, 'currencies');
          } else {
            console.warn('[CurrencyContext] No rates in response');
          }
        } else {
          console.error('[CurrencyContext] Failed to fetch exchange rates:', ratesData.reason);
        }

        if (multipliersData.status === 'fulfilled') {
          const data = multipliersData.value as { multipliers?: Record<string, number>; ratesToInr?: Record<string, number> };
          console.log('[CurrencyContext] Received multipliers:', data);
          if (data?.multipliers) {
            setMultipliers(data.multipliers);
            console.log('[CurrencyContext] Multipliers set for', Object.keys(data.multipliers).length, 'currencies');
          } else {
            console.warn('[CurrencyContext] No multipliers in response');
          }
          if (data?.ratesToInr) {
            setRatesToInr(data.ratesToInr);
            console.log('[CurrencyContext] ratesToInr set for', Object.keys(data.ratesToInr).length, 'currencies');
          }
        } else {
          console.error('[CurrencyContext] Failed to fetch currency multipliers:', multipliersData.reason);
        }
      } catch (error) {
        console.error('[CurrencyContext] Failed to fetch currency data:', error);
      }
    };
    
    fetchCurrencyData();
    
    // Refresh rates every hour
    const interval = setInterval(fetchCurrencyData, 3600000);
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
        multipliers,
        setMultipliers,
        ratesToInr,
        setRatesToInr,
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
