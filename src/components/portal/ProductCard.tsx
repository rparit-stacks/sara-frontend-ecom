import { Link } from 'react-router-dom';
import { Sym } from './Sym';

export interface ParsedProduct {
  id: string;
  name: string;
  price?: string;
  image?: string;
  slug?: string;
}

const PRODUCT_MARKER = '[[product:';

function extractField(body: string, key: string): string {
  const re = new RegExp(`(?:^|\\|)${key}=([^|\\]]+)`);
  const m = body.match(re);
  return m ? decodeURIComponent(m[1].trim()) : '';
}

export function buildProductMarker(p: {
  id: number | string;
  name: string;
  price?: string;
  image?: string;
  slug?: string;
}): string {
  const enc = (v: string) => encodeURIComponent(v);
  const parts = [
    `id=${enc(String(p.id))}`,
    `name=${enc(p.name)}`,
  ];
  if (p.price) parts.push(`price=${enc(p.price)}`);
  if (p.image) parts.push(`image=${enc(p.image)}`);
  if (p.slug) parts.push(`slug=${enc(p.slug)}`);
  return `[[product:${parts.join('|')}]]`;
}

export function parseProductCard(body?: string): ParsedProduct | null {
  if (!body || !body.includes(PRODUCT_MARKER)) return null;
  const markerMatch = body.match(/\[\[product:([^\]]+)\]\]/);
  if (!markerMatch?.[1]) return null;
  const payload = markerMatch[1].trim();
  const id = extractField(payload, 'id');
  const name = extractField(payload, 'name');
  if (!id || !name) return null;
  return {
    id,
    name,
    price: extractField(payload, 'price') || undefined,
    image: extractField(payload, 'image') || undefined,
    slug: extractField(payload, 'slug') || undefined,
  };
}

export function stripProductMarker(body?: string): string {
  if (!body) return '';
  return body.replace(/\[\[product:[^\]]+\]\]/g, '').trim();
}

export default function ProductCard({ data }: { data: ParsedProduct }) {
  const href = data.slug ? `/products/${data.slug}` : `/products/${data.id}`;
  return (
    <Link
      to={href}
      className="max-w-xs border rounded-xl overflow-hidden mb-2 flex hover:shadow-md transition-shadow"
      style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
    >
      <div className="w-20 h-20 shrink-0 flex items-center justify-center overflow-hidden" style={{ background: 'var(--p-surface-container-high)' }}>
        {data.image ? (
          <img src={data.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <Sym name="shopping_bag" className="text-[28px]" style={{ color: 'var(--p-on-surface-variant)' }} />
        )}
      </div>
      <div className="flex-1 min-w-0 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide mb-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>Product</p>
        <p className="font-semibold text-[14px] truncate">{data.name}</p>
        {data.price ? (
          <p className="text-[13px] font-bold mt-1" style={{ color: 'var(--p-primary)' }}>{data.price}</p>
        ) : null}
      </div>
    </Link>
  );
}
