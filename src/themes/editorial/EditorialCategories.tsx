import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Abstract } from './Abstract';
import { useStorefront } from './data';
import { Line, Photo, Rise } from './motion';

const STOCK = 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1200&h=900&fit=crop';

/** Spans per row on desktop: each row fills all 12 columns, so the index has no holes. */
const ROWS: number[][] = [[7, 5], [4, 4, 4], [5, 7]];
const SPAN: Record<number, string> = { 4: 'lg:col-span-4', 5: 'lg:col-span-5', 7: 'lg:col-span-7' };

/** The collections index: every top-level collection as a numbered, full-bleed tile. */
const EditorialCategories = () => {
  const { rawCategories, isLoading } = useStorefront();
  const [search, setSearch] = useState('');

  const all = rawCategories
    .filter((c: any) => !c.parentId)
    .sort((a: any, b: any) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  const list = search.trim()
    ? all.filter((c: any) => `${c.name} ${c.description || ''}`.toLowerCase().includes(search.trim().toLowerCase()))
    : all;

  // Cut the list into rows following ROWS, repeating the pattern.
  const rows: any[][] = [];
  let at = 0;
  for (let r = 0; at < list.length; r++) {
    const spans = ROWS[r % ROWS.length];
    rows.push(list.slice(at, at + spans.length));
    at += spans.length;
  }

  return (
    <Layout>
      <section className="relative overflow-hidden">
        <Abstract variant="wash" className="-right-40 -top-28 h-[620px] w-[620px]" />
        <Abstract variant="rings" className="-bottom-80 -left-72 h-[720px] w-[720px] opacity-60" />
        <div className="container-custom relative pb-16 pt-8 lg:pt-10">
          <div className="ed-kicker flex items-center justify-between border-b ed-hair pb-3">
            <span>The index</span>
            <span>{all.length} {all.length === 1 ? 'collection' : 'collections'}</span>
          </div>
          <div className="mt-6 grid items-end gap-6 lg:grid-cols-12">
            <h1 className="ed-display !text-[clamp(3rem,9vw,8rem)] lg:col-span-8"><Line>Collections.</Line></h1>
            <Rise className="lg:col-span-4">
              <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">Every pattern family we make, from florals to botanicals. Open one to see its prints and embroideries.</p>
              <label className="flex items-center gap-2 border-b ed-rule pb-1.5">
                <Search className="h-4 w-4 opacity-60" strokeWidth={1.5} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search collections" aria-label="Search collections"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40" />
              </label>
            </Rise>
          </div>

          <div className="mt-12 border-t ed-rule pt-6">
            {isLoading ? (
              <div className="grid gap-4 lg:grid-cols-12">
                {[7, 5].map((n) => <div key={n} className={`aspect-[4/3] animate-pulse bg-muted lg:h-[30vw] lg:aspect-auto col-span-12 ${SPAN[n]}`} />)}
              </div>
            ) : list.length === 0 ? (
              <p className="ed-title !text-[clamp(1.8rem,4vw,3rem)] py-24 text-center">No collection <em>found.</em></p>
            ) : (
              <div className="space-y-4 lg:space-y-5">
                {rows.map((row, r) => {
                  const spans = ROWS[r % ROWS.length];
                  const offset = rows.slice(0, r).reduce((n, x) => n + x.length, 0);
                  return (
                    <div key={r} className="grid gap-4 lg:grid-cols-12 lg:gap-5">
                      {row.map((c: any, i: number) => {
                        const n = offset + i + 1;
                        const subs = (c.subcategories || []).length;
                        return (
                          <Rise key={c.id} delay={i * 0.08} className={`col-span-12 ${SPAN[spans[i]]}`}>
                            <Link to={`/category/${(c.slug || '').replace(/\s+/g, '-')}`} className="group relative block overflow-hidden">
                              <Photo src={c.image || STOCK} alt={c.name} aspect="aspect-[4/3] lg:aspect-auto lg:h-[30vw]" drift={5} />
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white lg:p-7">
                                <div className="min-w-0">
                                  <p className="ed-num text-lg text-white/70">{String(n).padStart(2, '0')}</p>
                                  <h2 className="truncate font-serif text-[clamp(1.8rem,3.4vw,3rem)] font-light leading-none tracking-[-0.03em]">{c.name}</h2>
                                  {subs > 0 && <p className="ed-kicker mt-2 !text-[10px] text-white/75">{subs} {subs === 1 ? 'sub-collection' : 'sub-collections'}</p>}
                                </div>
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/60 transition-colors duration-300 group-hover:bg-white group-hover:text-foreground">
                                  <ArrowUpRight className="h-5 w-5" />
                                </span>
                              </div>
                            </Link>
                          </Rise>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default EditorialCategories;
