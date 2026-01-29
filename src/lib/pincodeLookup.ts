/**
 * Look up state and city from postal code + country using Zippopotam (free, no API key).
 * https://api.zippopotam.us/{country_iso2_lower}/{postal_code}
 */

const ZIPPO_BASE = 'https://api.zippopotam.us';

export type PincodeResult = { state: string; city: string };

export async function lookupPincode(
  countryCode: string,
  postalCode: string
): Promise<PincodeResult | null> {
  const code = countryCode?.trim().toLowerCase();
  const zip = postalCode?.trim().replace(/\s/g, '');
  if (!code || !zip) return null;
  try {
    const url = `${ZIPPO_BASE}/${encodeURIComponent(code)}/${encodeURIComponent(zip)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return null;
    const state = place.state || place['state abbreviation'] || '';
    const city = place['place name'] ?? place.name ?? '';
    if (!state && !city) return null;
    return { state: String(state), city: String(city) };
  } catch {
    return null;
  }
}
