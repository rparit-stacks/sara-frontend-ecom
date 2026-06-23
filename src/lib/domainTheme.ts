import { getDomainConfigForHostname } from '@/lib/domainConfig';

export type DomainThemeId = 'in' | 'uk';

export const DOMAIN_BRAND_COLORS: Record<DomainThemeId, { primary: string; foreground: string }> = {
  in: { primary: '#2b9d8f', foreground: '#0c2c3e' },
  uk: { primary: '#C8102E', foreground: '#1B2A4A' },
};

/** Apply storefront theme class on <html> from the current hostname. */
export const applyDomainTheme = (hostname?: string): DomainThemeId => {
  const host =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  const theme: DomainThemeId =
    getDomainConfigForHostname(host).region === 'GLOBAL' ? 'uk' : 'in';

  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('theme-in', 'theme-uk');
    document.documentElement.classList.add(`theme-${theme}`);
    document.documentElement.dataset.theme = theme;
  }

  return theme;
};

export const getDomainBrandColorHex = (hostname?: string): string => {
  const host =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  const theme: DomainThemeId =
    getDomainConfigForHostname(host).region === 'GLOBAL' ? 'uk' : 'in';
  return DOMAIN_BRAND_COLORS[theme].primary;
};
