import { useEffect, useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { type DomainRegion } from '@/lib/domainConfig';
import { fetchVisitorCountry } from '@/lib/visitorGeo';

/**
 * Decide whether the visitor's country mismatches the current store.
 * On studiosara.in we suggest the UK store to visitors outside India.
 * On studiosara.uk we suggest the India store to visitors inside India.
 */
const shouldSuggest = (region: DomainRegion, country: string | null): boolean => {
  if (!country) return false;
  if (region === 'IN' && country !== 'IN') return true;
  if (region === 'GLOBAL' && country === 'IN') return true;
  return false;
};

const buildMessage = (region: DomainRegion, targetDomain: string) => {
  if (region === 'IN') {
    return {
      heading: 'You are visiting the Indian store.',
      body: 'We recommend using our international website for localized pricing.',
      cta: `Go to ${targetDomain}`,
    };
  }
  return {
    heading: 'You are browsing from India.',
    body: 'Visit our India store for localized pricing.',
    cta: `Go to ${targetDomain}`,
  };
};

export const GeoSuggestionBanner = () => {
  const { domainConfig } = useCurrency();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (typeof window === 'undefined') return;
      if (!domainConfig.suggestDomain) return;

      const country = await fetchVisitorCountry();
      if (cancelled) return;
      if (shouldSuggest(domainConfig.region, country)) {
        setVisible(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [domainConfig]);

  if (!visible || !domainConfig.suggestDomain) return null;

  const targetDomain = domainConfig.suggestDomain;
  const targetHref = `https://${targetDomain}`;
  const { heading, body, cta } = buildMessage(domainConfig.region, targetDomain);

  return (
    <div className="w-full bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 text-sm">
          <span className="font-semibold">{heading}</span>{' '}
          <span className="opacity-90">{body}</span>
        </div>
        <a
          href={targetHref}
          className="inline-flex items-center rounded-md bg-white/15 hover:bg-white/25 transition-colors px-3 py-1.5 text-sm font-medium shrink-0"
        >
          {cta}
        </a>
      </div>
    </div>
  );
};

export default GeoSuggestionBanner;
