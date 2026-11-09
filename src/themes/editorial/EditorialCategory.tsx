import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Search } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { productsApi } from '@/lib/api';
import { storefrontQueryOptions } from '@/lib/storefrontCache';
import { usePrice } from '@/lib/currency';
import { Abstract } from './Abstract';
import { signedInEmail } from './data';
import { Line, Photo, Rise } from './motion';

const PAGE = 12;
const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'newest', label: 'Newest' },
  { key: 'price-low', label: 'Price, low to high' },
  { key: 'price-high', label: 'Price, high to low' },
];

/** One collection: its title, a trail back up, its sub-collections as tiles, then its pieces. */
const EditorialCategory = () => {
  const { format } = usePrice();
  const params = useParams<{ '*': string }>();
  const slugPath = params['*'] || '';
  const parts = slugPath.split('/').filter(Boolean);
  const email = signedInEmail();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [shown, setShown] = useState(PAGE);

  const { data: category, isLoading: loadingCategory, isError } = useQuery({
    queryKey: ['categoryBySlug', slugPath, email ?? null],
    queryFn: async () => {
      const url = email ? `/api/categories/${slugPath}?userEmail=${encodeURIComponent(email)}` : `/api/categories/${slugPath}`;
      const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`, { headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error('Failed to fetch category');
      return response.json();
    },
    enabled: !!slugPath,
  });
  const { data: apiProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['categoryProducts', category?.id, email ?? null],
    queryFn: () => productsApi.getAll({ categoryId: category?.id, status: 'ACTIVE', userEmail: email }),
    enabled: !!category?.id,
    ...storefrontQueryOptions,
  });

  const subs: any[] = [...(category?.subcategories || [])].sort((a: any, b: any) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

  let products = (apiProducts as any[]).map((p) => ({
    id: String(p.id), slug: p.slug || String(p.id), name: p.name as string, price: (p.price || p.basePrice || 0) as number,
    originalPrice: p.originalPrice as number | undefined, image: (p.images?.[0] || '') as string, category: (p.categoryName || '') as string,
    isNew: p.isNew as boolean, isSale: p.isSale as boolean, createdAt: p.createdAt as string | undefined,
  }));
  if (search.trim()) products = products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(search.trim().toLowerCase()));
  if (sort === 'newest') products = [...products].sort((a, b) => (b.createdAt ? +new Date(b.createdAt) : 0) - (a.createdAt ? +new Date(a.createdAt) : 0));
  if (sort === 'price-low') products = [...products].sort((a, b) => a.price - b.price);
  if (sort === 'price-high') products = [...products].sort((a, b) => b.price - a.price);
  const visible = products.slice(0, shown);

  const trail = parts.map((slug, i) => ({
    name: i === parts.length - 1 && category?.name ? category.name : slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    path: '/category/' + parts.slice(0, i + 1).join('/'),
    last: i === parts.length - 1,
  }));

  if (isError) {
    return (
      <Layout>
        <div className="container-custom py-32 text-center">
          <p className="ed-title !text-[clamp(2rem,5vw,4rem)]">Collection not <em>found.</em></p>
          <Link to="/categories" className="ed-kicker ed-link mt-8 inline-block">All collections</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative overflow-hidden">
        <Abstract variant="wash" className="-right-44 -top-32 h-[640px] w-[640px]" />
        <Abstract variant="arches" className="-bottom-8 -left-10 h-[420px] w-auto opacity-70" />
        <div className="container-custom relative pt-8 lg:pt-10">
          <nav className="ed-kicker flex flex-wrap items-center gap-x-2 border-b ed-hair pb-3" aria-label="Breadcrumb">
            <Link to="/" className="ed-link">Home</Link><span className="opacity-40">/</span>
            <Link to="/categories" className="ed-link">Collections</Link>
            {trail.map((t) => (
              <span key={t.path} className="flex items-center gap-x-2">
                <span className="opacity-40">/</span>
                {t.last ? <span className="text-primary">{t.name}</span> : <Link to={t.path} className="ed-link">{t.name}</Link>}
              </span>
            ))}
          </nav>

          <div className="mt-8 grid items-end gap-8 lg:grid-cols-12">
            <h1 className="ed-display lg:col-span-8" style={{ fontSize: 'clamp(2.8rem,8vw,7rem)' }}>
              <Line key={category?.name}>{loadingCategory ? ' ' : `${category?.name || 'Collection'}.`}</Line>
            </h1>
            <Rise className="lg:col-span-4">
              {category?.description && <p className="mb-3 line-clamp-4 text-[15px] leading-relaxed text-muted-foreground">{category.description}</p>}
              <p className="ed-kicker !text-[11px]">{products.length} {products.length === 1 ? 'piece' : 'pieces'}{subs.length > 0 ? ` · ${subs.length} sub-collections` : ''}</p>
            </Rise>
          </div>

          {subs.length > 0 && (
            <div className="mt-12">
              <p className="ed-kicker mb-4 border-b ed-rule pb-3">Inside this collection</p>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-5">
                {subs.map((c: any, i: number) => (
                  <Rise key={c.id} delay={(i % 4) * 0.06}>
                    <Link to={`/category/${slugPath}/${(c.slug || '').replace(/\s+/g, '-')}`} className="group relative block overflow-hidden">
                      <Photo src={c.image} alt={c.name} aspect="aspect-[4/5]" drift={4} />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white">
                        <h3 className="font-serif text-2xl font-light leading-tight tracking-[-0.02em]">{c.name}</h3>
                        <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  </Rise>
                ))}
              </div>
            </div>
          )}

          {(products.length > 0 || search || loadingProducts) && (
            <div className="mt-14 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-y ed-rule py-3">
              <p className="ed-kicker">{subs.length > 0 ? 'Pieces in this collection' : 'The pieces'}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <label className="flex items-center gap-2 border-b ed-hair pb-0.5">
                  <Search className="h-3.5 w-3.5 opacity-60" strokeWidth={1.5} />
                  <input value={search} onChange={(e) => { setSearch(e.target.value); setShown(PAGE); }} placeholder="Search" aria-label="Search products"
                    className="w-28 bg-transparent text-sm outline-none placeholder:text-foreground/40 sm:w-36" />
                </label>
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className="ed-kicker cursor-pointer bg-transparent outline-none">
                  {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="pb-16 pt-10">
            {loadingProducts ? (
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-muted" />)}</div>
            ) : visible.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-5">
                {visible.map((p, i) => (
                  <Rise key={p.id} delay={(i % 4) * 0.05}>
                    <Link to={`/product/${p.slug}`} className="group block">
                      <div className="relative">
                        <Photo src={p.image} alt={p.name} aspect="aspect-[4/5]" drift={4} />
                        {(p.isNew || p.isSale) && <span className="ed-kicker absolute left-0 top-0 bg-background px-2.5 py-1.5 !text-[10px] text-primary">{p.isSale ? 'Sale' : 'New'}</span>}
                      </div>
                      <div className="mt-3 flex items-baseline justify-between gap-3">
                        <p className="min-w-0 truncate font-serif text-lg font-light italic tracking-[-0.02em] ed-link">{p.name}</p>
                        <p className="ed-kicker shrink-0 !text-[11px]">{format(p.price)}</p>
                      </div>
                    </Link>
                  </Rise>
                ))}
              </div>
            ) : subs.length === 0 ? (
              <p className="ed-title !text-[clamp(1.8rem,4vw,3rem)] py-16 text-center">Nothing here <em>yet.</em></p>
            ) : null}

            {products.length > shown && (
              <div className="mt-16 flex flex-col items-center gap-3 border-t ed-hair pt-10">
                <p className="ed-kicker !text-[11px] text-muted-foreground">Showing {visible.length} of {products.length}</p>
                <button type="button" onClick={() => setShown((n) => n + PAGE)} className="ed-title ed-link !text-[clamp(1.8rem,4vw,3rem)] italic">Turn the page →</button>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default EditorialCategory;
