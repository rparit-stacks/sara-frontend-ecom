import { COUNTRY_CODES } from './countryCodes';

/**
 * Phone numbers for WhatsApp: country-aware parsing and checks, built on the shared country list.
 * The result `digits` is the number with its country code and no plus sign (what the service stores).
 */

export interface Country {
  code: string; // "+91"
  country: string; // "India"
}

export const DEFAULT_COUNTRY = '+91';
export const COUNTRIES: Country[] = COUNTRY_CODES as Country[];

/** "+1" belongs to more than one country; show them together. */
export const countryLabel = (code: string): string => {
  const names = COUNTRIES.filter((c) => c.code === code).map((c) => c.country);
  if (names.length === 0) return code;
  return names.slice(0, 2).join(' / ');
};

// dial code digits -> sorted longest first, so +1242 (Bahamas) wins over +1 when it matches
const BY_LENGTH = Array.from(new Set(COUNTRIES.map((c) => c.code.slice(1)))).sort((a, b) => b.length - a.length);

export interface ParsedPhone {
  ok: boolean;
  /** Country code and number, digits only: 919810167696. Empty when the input has no digits. */
  digits: string;
  /** Readable: +91 98101 67696 */
  display: string;
  countryCode: string; // "+91" or ""
  country: string; // "India" or ""
  national: string;
  reason?: string;
}

const group = (code: string, national: string): string => {
  if (code === '+91' && national.length === 10) return `${national.slice(0, 5)} ${national.slice(5)}`;
  if (code === '+1' && national.length === 10) return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
  return national;
};

/** Checks the national part against what is known about that country, and a general rule for the rest. */
const checkNational = (code: string, national: string): string | undefined => {
  if (!national) return 'Add the phone number';
  if (!/^\d+$/.test(national)) return 'Use digits only';
  if (code === '+91') {
    if (national.length !== 10) return 'An Indian number has 10 digits';
    if (!/^[6-9]/.test(national)) return 'An Indian mobile number starts with 6, 7, 8 or 9';
    return undefined;
  }
  if (code === '+1') {
    if (national.length !== 10) return 'A US or Canadian number has 10 digits';
    if (!/^[2-9]/.test(national)) return 'The area code cannot start with 0 or 1';
    return undefined;
  }
  const total = code.length - 1 + national.length;
  if (national.length < 4) return 'This number is too short';
  if (total > 15) return 'This number is too long (a phone number has at most 15 digits with the country code)';
  if (total < 8) return 'This number is too short';
  return undefined;
};

/**
 * Reads a number the way a person types it. With a plus (or 00) the country is found from the
 * number itself; without one, `defaultCode` is used and a leading 0 is dropped.
 */
export const parsePhone = (raw: string, defaultCode: string = DEFAULT_COUNTRY): ParsedPhone => {
  const text = (raw ?? '').trim();
  const empty: ParsedPhone = { ok: false, digits: '', display: '', countryCode: '', country: '', national: '', reason: 'Add the phone number' };
  if (!text) return empty;

  let digits = text.replace(/\D/g, '');
  if (!digits) return { ...empty, reason: 'Use digits only' };

  const international = text.startsWith('+') || text.startsWith('00');
  let code = defaultCode;
  let national = digits;

  if (international) {
    if (text.startsWith('00')) digits = digits.slice(2);
    const match = BY_LENGTH.find((c) => digits.startsWith(c));
    if (!match) return { ...empty, digits, display: `+${digits}`, reason: 'The country code is not recognised' };
    code = `+${match}`;
    national = digits.slice(match.length);
  } else {
    const defaultDigits = defaultCode.slice(1);
    // A number typed with its country code but without the plus, e.g. 919810167696
    if (defaultCode === '+91' && digits.length === 12 && digits.startsWith('91')) national = digits.slice(2);
    else if (digits.length > 10 && digits.startsWith(defaultDigits) && defaultCode !== '+91') national = digits.slice(defaultDigits.length);
    else if (national.startsWith('0')) national = national.replace(/^0+/, '');
  }

  const reason = checkNational(code, national);
  const full = `${code.slice(1)}${national}`;
  return {
    ok: !reason,
    digits: full,
    display: `${code} ${group(code, national)}`.trim(),
    countryCode: code,
    country: countryLabel(code),
    national,
    reason,
  };
};

export const formatDigits = (digits: string): string => (digits ? parsePhone(`+${digits}`).display || `+${digits}` : '');

/** The country behind a stored number such as 919810167696. */
export const countryOfDigits = (digits: string): string => {
  const match = BY_LENGTH.find((c) => digits.startsWith(c));
  return match ? countryLabel(`+${match}`) : 'Unknown';
};
