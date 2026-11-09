import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Clock, Search, Sparkles, Store } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { marketplaceApi, MarketplaceItemState } from '@/lib/api';
import { formatInr } from '@/data/platformPayments';
import { cn } from '@/lib/utils';
import { LISTINGS } from '@/components/admin/marketplace/catalog';
import { BrowserFrame, ScrollShot } from '@/components/admin/marketplace/ScrollShot';

const KINDS = [
  { id: 'all', label: 'All' },
  { id: 'theme', label: 'Themes' },
];

const StatusBadge = ({ state }: { state?: MarketplaceItemState }) => {
  if (!state || state.status === 'AVAILABLE') return <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">10-day free trial</span>;
  if (state.status === 'OWNED') return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{state.live ? 'Purchased · live' : 'Purchased'}</span>;
  if (state.status === 'TRIAL') {
    const days = Math.ceil(state.secondsLeft / 86400);
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"><Clock className="h-3 w-3" /> {days} {days === 1 ? 'day' : 'days'} left{state.live ? ' · live' : ''}</span>;
  }
  return <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Trial ended</span>;
};

const AdminMarketplace = () => {
  const [kind, setKind] = useState('all');
  const [query, setQuery] = useState('');
  const { data: states = [] } = useQuery({ queryKey: ['marketplace'], queryFn: () => marketplaceApi.list(), retry: 1 });
  const byKey = useMemo(() => new Map(states.map((s) => [s.key, s])), [states]);

  const list = LISTINGS.filter((l) => (kind === 'all' || l.kind === kind) && `${l.name} ${l.tagline} ${l.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
  const featured = LISTINGS[0];

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[1400px] space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary"><Store className="h-4 w-4" /> Marketplace</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Make your shop yours</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">Themes and add-ons for your store. Try anything free first, buy it when you are sure, switch it on and off whenever you like.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the marketplace" className="pl-9" />
          </div>
        </div>

        {/* Featured */}
        {featured && !query && kind !== 'none' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.2, 0.7, 0.1, 1] }}>
            <Link to={`/admin-sara/marketplace/${featured.key}`} className="group relative block overflow-hidden rounded-3xl bg-[hsl(195_40%_9%)] text-white">
              <div className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-primary/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-40 left-1/3 h-[420px] w-[420px] rounded-full bg-emerald-300/15 blur-3xl" />
              <div className="relative grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-12 lg:gap-12 lg:p-14">
                <div className="lg:col-span-5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider"><Sparkles className="h-3.5 w-3.5" /> Featured theme</span>
                  <h2 className="mt-5 font-serif text-4xl font-light italic leading-none tracking-tight sm:text-6xl">{featured.name}</h2>
                  <p className="mt-4 max-w-md text-base text-white/75">{featured.tagline} {featured.summary}</p>
                  <div className="mt-7 flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[hsl(195_40%_9%)] transition-transform group-hover:-translate-y-0.5">See what is inside <ArrowUpRight className="h-4 w-4" /></span>
                    <span className="text-sm text-white/70">{formatInr(byKey.get(featured.key)?.priceInr ?? 2000)} · {byKey.get(featured.key)?.trialDays ?? 10} days free</span>
                  </div>
                </div>
                <div className="relative lg:col-span-7">
                  <motion.div initial={{ rotate: 0, y: 30, opacity: 0 }} animate={{ rotate: 2, y: 0, opacity: 1 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.2, 0.7, 0.1, 1] }} whileHover={{ rotate: 0 }}>
                    <BrowserFrame url="yourshop.com">
                      <ScrollShot tall={featured.previews[0].tall} still={featured.previews[0].image} alt={`${featured.name} home page`} className="aspect-[16/10]" seconds={22} />
                    </BrowserFrame>
                  </motion.div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="flex gap-1">
            {KINDS.map((k) => (
              <button key={k.id} type="button" onClick={() => setKind(k.id)} className={cn('relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors', kind === k.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {kind === k.id && <motion.span layoutId="kind-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }} />}
                <span className="relative">{k.label}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{list.length} {list.length === 1 ? 'product' : 'products'}</p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((l, i) => {
            const state = byKey.get(l.key);
            return (
              <motion.div key={l.key} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.2, 0.7, 0.1, 1] }}>
                <Link to={`/admin-sara/marketplace/${l.key}`} className="group block overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative overflow-hidden border-b bg-muted">
                    <ScrollShot tall={l.previews[0].tall} still={l.previews[0].image} alt={`${l.name} preview`} className="aspect-[16/10]" seconds={20} />
                    <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-sm backdrop-blur">{l.kind}</span>
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold leading-tight">{l.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{l.tagline}</p>
                      </div>
                      <p className="shrink-0 text-lg font-semibold">{formatInr(state?.priceInr ?? 2000)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {l.tags.map((t) => <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{t}</span>)}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <StatusBadge state={state} />
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">View details <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
          {list.length === 0 && <p className="col-span-full py-20 text-center text-muted-foreground">Nothing matches that search.</p>}
          {!query && kind === 'all' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center text-muted-foreground">
              <Store className="mb-3 h-8 w-8 opacity-50" />
              <p className="font-medium text-foreground">More on the way</p>
              <p className="mt-1 max-w-[16rem] text-sm">New themes and add-ons will appear here.</p>
            </motion.div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketplace;
