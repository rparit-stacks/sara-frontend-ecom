import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import { currencyApi } from '@/lib/api';
import { ChevronDown } from 'lucide-react';
import { getCurrencySymbol, getCurrencyName } from '@/lib/currency';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

export const CurrencySelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currency, setCurrency, setExchangeRates } = useCurrency();

  // Fetch available currencies and rates
  const { data: currenciesData } = useQuery({
    queryKey: ['currency-rates'],
    queryFn: async () => {
      const data = await currencyApi.getRates();
      // Update exchange rates in context
      if (data?.rates) {
        setExchangeRates(data.rates);
      }
      return data;
    },
    refetchInterval: 3600000, // Refetch every hour
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currencies: Currency[] = currenciesData?.currencies || [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 1 },
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 0.012 },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.011 },
    { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.0095 },
  ];

  const handleCurrencySelect = (code: string) => {
    setCurrency(code);
    setIsOpen(false);
  };

  const currentCurrency = currencies.find((c) => c.code === currency) || currencies[0];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          'hover:bg-secondary border border-transparent hover:border-border',
          isOpen && 'bg-secondary border-border'
        )}
      >
        <span className="text-base">{getCurrencySymbol(currency)}</span>
        <span className="hidden sm:inline">{currency}</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-64 bg-white border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            <div className="py-2">
              {currencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => handleCurrencySelect(curr.code)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between',
                    currency === curr.code
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-secondary'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{curr.symbol || getCurrencySymbol(curr.code)}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{curr.code}</span>
                      <span className="text-xs text-muted-foreground">{curr.name || getCurrencyName(curr.code)}</span>
                    </div>
                  </div>
                  {currency === curr.code && (
                    <i className="fa-solid fa-check text-primary"></i>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
