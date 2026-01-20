import { useCurrency } from '@/context/CurrencyContext';

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  AED: 'د.إ',
  SAR: '﷼',
  SGD: 'S$',
  MYR: 'RM',
  THB: '฿',
  IDR: 'Rp',
  PHP: '₱',
  KRW: '₩',
  NZD: 'NZ$',
  HKD: 'HK$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  RON: 'lei',
  BGN: 'лв',
  HRK: 'kn',
  RUB: '₽',
  TRY: '₺',
  ZAR: 'R',
  BRL: 'R$',
  MXN: '$',
  ARS: '$',
  CLP: '$',
  COP: '$',
  PEN: 'S/',
  ILS: '₪',
  EGP: '£',
  NGN: '₦',
  KES: 'KSh',
  GHS: '₵',
  PKR: '₨',
  BDT: '৳',
  LKR: 'Rs',
  NPR: 'Rs',
  MMK: 'K',
  VND: '₫',
};

// Currency names mapping
const CURRENCY_NAMES: Record<string, string> = {
  INR: 'Indian Rupee',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
  AED: 'UAE Dirham',
  SAR: 'Saudi Riyal',
  SGD: 'Singapore Dollar',
  MYR: 'Malaysian Ringgit',
  THB: 'Thai Baht',
  IDR: 'Indonesian Rupiah',
  PHP: 'Philippine Peso',
  KRW: 'South Korean Won',
  NZD: 'New Zealand Dollar',
  HKD: 'Hong Kong Dollar',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  DKK: 'Danish Krone',
  PLN: 'Polish Zloty',
  CZK: 'Czech Koruna',
  HUF: 'Hungarian Forint',
  RON: 'Romanian Leu',
  BGN: 'Bulgarian Lev',
  HRK: 'Croatian Kuna',
  RUB: 'Russian Ruble',
  TRY: 'Turkish Lira',
  ZAR: 'South African Rand',
  BRL: 'Brazilian Real',
  MXN: 'Mexican Peso',
  ARS: 'Argentine Peso',
  CLP: 'Chilean Peso',
  COP: 'Colombian Peso',
  PEN: 'Peruvian Sol',
  ILS: 'Israeli Shekel',
  EGP: 'Egyptian Pound',
  NGN: 'Nigerian Naira',
  KES: 'Kenyan Shilling',
  GHS: 'Ghanaian Cedi',
  PKR: 'Pakistani Rupee',
  BDT: 'Bangladeshi Taka',
  LKR: 'Sri Lankan Rupee',
  NPR: 'Nepalese Rupee',
  MMK: 'Myanmar Kyat',
  VND: 'Vietnamese Dong',
};

/**
 * Convert price from one currency to another
 */
export const convertPrice = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, number>
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // If converting from base currency (INR)
  if (fromCurrency === 'INR') {
    const rate = exchangeRates[toCurrency];
    if (!rate) return amount; // Fallback to original if rate not available
    return amount * rate;
  }

  // If converting to base currency (INR)
  if (toCurrency === 'INR') {
    const rate = exchangeRates[fromCurrency];
    if (!rate) return amount; // Fallback to original if rate not available
    return amount / rate;
  }

  // Converting between two non-base currencies
  // First convert to INR, then to target currency
  const fromRate = exchangeRates[fromCurrency];
  const toRate = exchangeRates[toCurrency];
  
  if (!fromRate || !toRate) return amount;
  
  const inrAmount = amount / fromRate;
  return inrAmount * toRate;
};

/**
 * Format price with currency symbol
 */
export const formatPrice = (amount: number, currency: string): string => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  // For some currencies, symbol comes after
  if (['EUR', 'GBP', 'INR'].includes(currency)) {
    return `${formattedAmount} ${symbol}`;
  }

  return `${symbol}${formattedAmount}`;
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency] || currency;
};

/**
 * Get currency name
 */
export const getCurrencyName = (currency: string): string => {
  return CURRENCY_NAMES[currency] || currency;
};

/**
 * Hook to convert and format price using current currency
 */
export const usePrice = () => {
  const { currency, exchangeRates, baseCurrency, multipliers } = useCurrency();

  const getMultiplierForCurrency = (targetCurrency: string): number => {
    const normalized = (targetCurrency || '').toUpperCase();

    // For INR / India, multiplier should always behave as 1 (no change)
    if (normalized === 'INR') {
      return 1;
    }

    const value = multipliers?.[normalized];
    if (typeof value !== 'number') {
      return 1;
    }

    if (!Number.isFinite(value) || value <= 0) {
      return 1;
    }

    return value;
  };

  const convert = (amount: number, fromCurrency: string = baseCurrency): number => {
    // If no exchange rates available, return original amount
    if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
      console.warn('Exchange rates not available, returning original amount');
      return amount;
    }

    let effectiveAmount = amount;
    let effectiveFromCurrency = fromCurrency;

    // If we are converting from base INR, first apply the currency-wise multiplier
    if (effectiveFromCurrency === 'INR') {
      const multiplier = getMultiplierForCurrency(currency);
      effectiveAmount = amount * multiplier;
    }

    const converted = convertPrice(effectiveAmount, effectiveFromCurrency, currency, exchangeRates);
    return converted;
  };

  const format = (amount: number, fromCurrency: string = baseCurrency): string => {
    const converted = convert(amount, fromCurrency);
    return formatPrice(converted, currency);
  };

  return {
    convert,
    format,
    currency,
    symbol: getCurrencySymbol(currency),
  };
};
