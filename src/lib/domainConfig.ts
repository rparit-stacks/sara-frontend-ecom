export type DomainRegion = 'IN' | 'GLOBAL';

export interface DomainConfig {
  /** The hostname this config matches (without protocol/port). */
  hostname: string;
  /** Default currency to auto-select for visitors on this domain. */
  defaultCurrency: string;
  /** When false, the currency dropdown is hidden in the UI. */
  showCurrencyDropdown: boolean;
  /** Currencies visible in UI. If undefined, all backend-supported currencies are shown. */
  allowedCurrencies?: string[];
  /** Region tag, used for cross-domain geo suggestion banner. */
  region: DomainRegion;
  /** Sibling domain to suggest when visitor's location does not match this store. */
  suggestDomain?: string;
  /** Human-readable label used in suggestion banners. */
  label: string;
}

export const INDIA_DOMAIN = 'studiosara.in';
export const UK_DOMAIN = 'studiosara.uk';

/**
 * Hostname → store configuration. Keep this as the single source of truth
 * for per-domain behavior. Backend/admin/products/pricing remain shared.
 */
export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  [INDIA_DOMAIN]: {
    hostname: INDIA_DOMAIN,
    defaultCurrency: 'INR',
    showCurrencyDropdown: false,
    allowedCurrencies: ['INR'],
    region: 'IN',
    suggestDomain: UK_DOMAIN,
    label: 'India',
  },
  [UK_DOMAIN]: {
    hostname: UK_DOMAIN,
    defaultCurrency: 'GBP',
    showCurrencyDropdown: false,
    allowedCurrencies: ['GBP'],
    region: 'GLOBAL',
    suggestDomain: INDIA_DOMAIN,
    label: 'International',
  },
};

const DEFAULT_CONFIG: DomainConfig = DOMAIN_CONFIGS[INDIA_DOMAIN];

const stripWww = (host: string): string => host.replace(/^www\./i, '').toLowerCase();

/**
 * Resolve a hostname to its DomainConfig. Falls back to the India config for
 * unknown hosts (local dev, previews, etc.) so the UI stays in its current shape.
 */
export const getDomainConfigForHostname = (hostname: string): DomainConfig => {
  const host = stripWww(hostname || '');

  if (DOMAIN_CONFIGS[host]) {
    return DOMAIN_CONFIGS[host];
  }

  // Match by suffix for previews like studiosara.uk.vercel.app etc.
  if (host.endsWith('.' + UK_DOMAIN) || host === UK_DOMAIN) {
    return DOMAIN_CONFIGS[UK_DOMAIN];
  }
  if (host.endsWith('.' + INDIA_DOMAIN) || host === INDIA_DOMAIN) {
    return DOMAIN_CONFIGS[INDIA_DOMAIN];
  }

  return DEFAULT_CONFIG;
};

/** Browser-only helper. Returns the default (India) config on SSR / non-window. */
export const getCurrentDomainConfig = (): DomainConfig => {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG;
  }
  return getDomainConfigForHostname(window.location.hostname);
};
