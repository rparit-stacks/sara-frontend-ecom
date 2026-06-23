const COUNTRY_STORAGE_KEY = 'visitor_country_code';

type GeoProvider = {
  name: string;
  fetchCountry: () => Promise<string | null>;
};

const normalizeCountryCode = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
};

const fetchFromIpWhoIs = async (): Promise<string | null> => {
  const res = await fetch('https://ipwho.is/', { method: 'GET' });
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.success === false) return null;
  return normalizeCountryCode(data?.country_code);
};

const fetchFromGeoJs = async (): Promise<string | null> => {
  const res = await fetch('https://get.geojs.io/v1/ip/country.json', { method: 'GET' });
  if (!res.ok) return null;
  const data = await res.json();
  return normalizeCountryCode(data?.country);
};

const fetchFromIpApiCo = async (): Promise<string | null> => {
  const res = await fetch('https://ipapi.co/json/', { method: 'GET' });
  if (!res.ok) return null;
  const data = await res.json();
  return normalizeCountryCode(data?.country_code);
};

const GEO_PROVIDERS: GeoProvider[] = [
  { name: 'ipwho.is', fetchCountry: fetchFromIpWhoIs },
  { name: 'geojs.io', fetchCountry: fetchFromGeoJs },
  { name: 'ipapi.co', fetchCountry: fetchFromIpApiCo },
];

/**
 * Resolve visitor country (ISO 3166-1 alpha-2) from public IP using free APIs.
 * Result is cached for the browser session to avoid repeated lookups.
 */
export const fetchVisitorCountry = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  const cached = sessionStorage.getItem(COUNTRY_STORAGE_KEY);
  if (cached) return cached;

  for (const provider of GEO_PROVIDERS) {
    try {
      const code = await provider.fetchCountry();
      if (code) {
        sessionStorage.setItem(COUNTRY_STORAGE_KEY, code);
        return code;
      }
    } catch {
      // Try the next provider.
    }
  }

  return null;
};
