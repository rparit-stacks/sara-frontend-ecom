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
  const href = data.slug ? `/product/${data.slug}` : `/product/${data.id}`;
  return (
    <Link
      to={href}
      className="w-64 border rounded-2xl overflow-hidden mb-1 block shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
      style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
    >
      <div className="w-full h-40 flex items-center justify-center overflow-hidden" style={{ background: 'var(--p-surface-container-high)' }}>
        {data.image ? (
          <img src={data.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <Sym name="shopping_bag" className="text-[40px]" style={{ color: 'var(--p-on-surface-variant)' }} />
        )}
      </div>
      <div className="p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-wide mb-1 flex items-center gap-1" style={{ color: 'var(--p-primary)' }}>
          <Sym name="shopping_bag" className="text-[13px]" /> Product
        </p>
        <p className="font-semibold text-[14px] leading-snug line-clamp-2 mb-1.5">{data.name}</p>
        <div className="flex items-center justify-between gap-2">
          {data.price ? (
            <p className="text-[15px] font-bold" style={{ color: 'var(--p-on-surface)' }}>{data.price}</p>
          ) : <span />}
          <span className="flex items-center gap-0.5 text-[12px] font-semibold" style={{ color: 'var(--p-primary)' }}>
            View <Sym name="arrow_forward" className="text-[14px]" />
          </span>
        </div>
      </div>
    </Link>
  );
}
