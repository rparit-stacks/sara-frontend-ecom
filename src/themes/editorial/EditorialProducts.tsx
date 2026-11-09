import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { usePrice } from '@/lib/currency';
import { EdCategory, EdProduct, useStorefront } from './data';
import { Abstract } from './Abstract';
import { Line, Photo, Rise } from './motion';

const PAGE = 12;
const TABS = [
  { key: '', label: 'Everything' },
  { key: 'new', label: 'New in' },
  { key: 'best', label: 'Best sellers' },
  { key: 'sale', label: 'On sale' },
];
const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'newest', label: 'Newest' },
  { key: 'price-low', label: 'Price, low to high' },
  { key: 'price-high', label: 'Price, high to low' },
];
const PRICES = [
  { key: '', label: 'Any price', test: (_: number) => true },
  { key: 'u500', label: 'Under 500', test: (p: number) => p < 500 },
  { key: '500-1500', label: '500 to 1,500', test: (p: number) => p >= 500 && p <= 1500 },
  { key: 'o1500', label: 'Over 1,500', test: (p: number) => p > 1500 },
];

/** Product listing set as a magazine spread: staggered columns, a feature tile, an index of collections above. */
const EditorialProducts = () => {
  const { format } = usePrice();
  const [params, setParams] = useSearchParams();
  const { products, rawCategories, cms, isLoading } = useStorefront();

  const tab = params.get('filter') || '';
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [price, setPrice] = useState('');
  const [path, setPath] = useState<number[]>([]);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => setShown(PAGE), [tab, search, sort, price, path]);

  const byId = useMemo(() => {
    const map = new Map<number, EdCategory & { subcategories: any[] }>();
    const walk = (list: any[]) => list.forEach((c) => { map.set(c.id, c); walk(c.subcategories || []); });
    walk(rawCategories);
    return map;
  }, [rawCategories]);
  const roots = useMemo(
    () => rawCategories.filter((c: any) => !c.parentId).sort((a: any, b: any) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999)),
    [rawCategories],
  );
  const descendants = (id: number): number[] => {
    const out = [id];
    (byId.get(id)?.subcategories || []).forEach((s: any) => out.push(...descendants(s.id)));
    return out;
  };
  const current = path.length ? byId.get(path[path.length - 1]) : null;
  const children: any[] = current ? current.subcategories || [] : [];

  const bestIds = new Set<string>(((cms?.bestSellerIds || cms?.bestSellers || []) as any[]).map(String));
  const newIds = new Set<string>(((cms?.newArrivalIds || cms?.newArrivals || []) as any[]).map(String));

  const list = useMemo(() => {
    let out: EdProduct[] = products;
    if (tab === 'new') out = newIds.size ? out.filter((p) => newIds.has(p.id)) : out.filter((p) => p.isNew);
    if (tab === 'best') out = bestIds.size ? out.filter((p) => bestIds.has(p.id)) : out;
    if (tab === 'sale') out = out.filter((p) => p.isSale);
    if (search.trim()) out = out.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));
    if (path.length) {
      const allowed = new Set(descendants(path[path.length - 1]));
      out = out.filter((p) => p.categoryId !== undefined && allowed.has(p.categoryId));
    }
    const test = PRICES.find((x) => x.key === price)?.test;
    if (test) out = out.filter((p) => test(p.price));
    if (sort === 'newest') out = [...out].sort((a, b) => (b.createdAt ? +new Date(b.createdAt) : 0) - (a.createdAt ? +new Date(a.createdAt) : 0));
    if (sort === 'price-low') out = [...out].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') out = [...out].sort((a, b) => b.price - a.price);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, tab, search, path, price, sort, cms, byId]);

  const setTab = (key: string) => {
    const next = new URLSearchParams(params);
    if (key) next.set('filter', key); else next.delete('filter');
    setParams(next, { replace: true });
  };
  const choose = (level: number, id: number | null) => setPath((p) => (id === null ? p.slice(0, level) : [...p.slice(0, level), id]));
  const filtered = !!(search || price || path.length);
  const clear = () => { setSearch(''); setPrice(''); setPath([]); };

  const visible = list.slice(0, shown);
  const heading = TABS.find((t) => t.key === tab)?.label || 'Everything';

  const chip = (active: boolean) =>
    `ed-kicker ed-link whitespace-nowrap py-1 ${active ? 'text-primary [background-size:100%_1px]' : 'text-foreground/55 hover:text-foreground'}`;

  return (
    <Layout>
      <section className="container-custom relative pt-8 lg:pt-10">
        <Abstract variant="wash" className="-right-40 -top-24 h-[560px] w-[560px]" />
        <div className="ed-kicker relative flex items-center justify-between border-b ed-hair pb-3">
          <span>The shop</span>
          <span>{list.length} {list.length === 1 ? 'piece' : 'pieces'}</span>
        </div>
        <h1 className="ed-display relative !text-[clamp(3rem,9vw,8rem)] mt-6"><Line key={heading}>{heading}.</Line></h1>

        {/* Index of collections */}
        <div className="mt-8 border-y ed-rule">
          <div className="flex gap-7 overflow-x-auto py-4 [scrollbar-width:none]">
            <button type="button" className={chip(path.length === 0)} onClick={() => choose(0, null)}>All collections</button>
            {roots.map((c: any) => (
              <button key={c.id} type="button" className={chip(path[0] === c.id)} onClick={() => choose(0, c.id)}>{c.name}</button>
            ))}
          </div>
          {children.length > 0 && (
            <div className="flex gap-7 overflow-x-auto border-t ed-hair py-3 [scrollbar-width:none]">
              {children.map((c: any) => (
                <button key={c.id} type="button" className={chip(path[path.length - 1] === c.id)} onClick={() => choose(path.length, c.id)}>{c.name}</button>
              ))}
            </div>
          )}
        </div>

        {/* Filter bar */}
        <div className="sticky top-[82px] z-30 -mx-4 mb-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b ed-hair bg-background/95 px-4 py-3 backdrop-blur-sm ">
          <div className="flex gap-6 overflow-x-auto [scrollbar-width:none]">
            {TABS.map((t) => (
              <button key={t.key} type="button" className={chip(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 border-b ed-hair pb-0.5">
              <Search className="h-3.5 w-3.5 opacity-60" strokeWidth={1.5} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" aria-label="Search products"
                className="w-28 bg-transparent text-sm outline-none placeholder:text-foreground/40 sm:w-36" />
            </label>
            <select value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Price" className="ed-kicker cursor-pointer bg-transparent outline-none">
              {PRICES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className="ed-kicker cursor-pointer bg-transparent outline-none">
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            {filtered && (
              <button type="button" onClick={clear} className="ed-kicker ed-link inline-flex items-center gap-1 text-primary"><X className="h-3 w-3" /> Clear</button>
            )}
          </div>
        </div>
      </section>

      {/* Spread */}
      <section className="container-custom pb-16">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-muted" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="py-32 text-center">
            <p className="ed-title !text-[clamp(1.8rem,4vw,3rem)]">Nothing here <em>yet.</em></p>
            <button type="button" onClick={clear} className="ed-kicker ed-link mt-6">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-5">
            {visible.map((p, i) => (
              <Rise key={p.id} delay={(i % 4) * 0.05}>
                <Link to={`/product/${p.slug}`} className="group block">
                  <div className="relative">
                    <Photo src={p.image} alt={p.name} aspect="aspect-[4/5]" drift={4} />
                    {(p.isNew || p.isSale) && (
                      <span className="ed-kicker absolute left-0 top-0 bg-background px-2.5 py-1.5 !text-[10px] text-primary">{p.isSale ? 'Sale' : 'New'}</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate font-serif text-lg font-light italic tracking-[-0.02em] ed-link">{p.name}</p>
                    <p className="ed-kicker shrink-0 !text-[11px]">
                      {p.originalPrice && p.originalPrice > p.price && <span className="mr-2 text-muted-foreground line-through">{format(p.originalPrice)}</span>}
                      {format(p.price)}
                    </p>
                  </div>
                  {p.category && <p className="ed-kicker mt-0.5 !text-[10px] text-muted-foreground">{p.category}</p>}
                </Link>
              </Rise>
            ))}
          </div>
        )}

        {list.length > shown && (
          <div className="mt-20 flex flex-col items-center gap-3 border-t ed-hair pt-10">
            <p className="ed-kicker !text-[11px] text-muted-foreground">Showing {visible.length} of {list.length}</p>
            <button type="button" onClick={() => setShown((n) => n + PAGE)} className="ed-title !text-[clamp(1.8rem,4vw,3rem)] ed-link italic">Turn the page →</button>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default EditorialProducts;
