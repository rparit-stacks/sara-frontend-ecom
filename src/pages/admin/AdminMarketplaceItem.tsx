import { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, CircleCheck, Clock, Loader2, MousePointerClick, Power } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { marketplaceApi, MarketplaceItemState } from '@/lib/api';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';
import { findListing } from '@/components/admin/marketplace/catalog';
import { Showcase } from '@/components/admin/marketplace/Showcase';
import { PurchasePanel } from '@/components/admin/marketplace/PurchasePanel';

const EASE = [0.2, 0.7, 0.1, 1] as const;

/** Fades and lifts into place once, as it scrolls into view. */
const Reveal = ({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -10% 0px' }} transition={{ duration: 0.7, ease: EASE, delay }}>
    {children}
  </motion.div>
);

const SectionTitle = ({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) => (
  <Reveal className="mb-8 max-w-2xl">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
    <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
    {text && <p className="mt-3 text-muted-foreground">{text}</p>}
  </Reveal>
);

const THEME_STEPS = [
  { icon: MousePointerClick, title: 'Start the trial', text: 'One click. The theme goes live on your shop at once and your 10 days of use begin counting.' },
  { icon: Power, title: 'Switch it on and off', text: 'The clock runs only while the theme is on. Switch it off and it stops; switch it on and it carries on.' },
  { icon: Clock, title: 'Keep it or go back', text: 'When the 10 days of use are spent, your shop returns to its classic look. Buy it any time to keep the new one.' },
];

const THEME_POINTS = ['Redesigns every storefront page', 'Reads your banners and catalogue', 'Switch on and off any time', 'Admin panel stays untouched'];

const AdminMarketplaceItem = () => {
  const { key } = useParams<{ key: string }>();
  const listing = findListing(key);
  const { hasAny } = useAdminPermissions();
  const { data: item, dataUpdatedAt, isLoading, error, refetch } = useQuery({
    queryKey: ['marketplace', key],
    queryFn: () => marketplaceApi.get(key!),
    enabled: !!listing,
    refetchInterval: 60_000,
    retry: 1,
  });
  // If the server cannot be reached the buttons still show; only the trial waits.
  const fallbackItem: MarketplaceItemState | null = listing
    ? { key: listing.key, kind: listing.kind, name: listing.name, priceInr: listing.priceInr, trialDays: listing.trialDays, status: 'AVAILABLE', enabled: false, live: false, trialStartedAt: null, trialEndsAt: null, secondsLeft: 0, purchasedAt: null }
    : null;

  if (!listing) {
    return (
      <AdminLayout>
        <div className="py-24 text-center">
          <p className="text-xl font-semibold">That product does not exist</p>
          <Link to="/admin-sara/marketplace" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Back to the marketplace</Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[1300px] space-y-20 pb-16">
        <div>
          <Link to="/admin-sara/marketplace" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Marketplace</Link>

          {/* Hero */}
          <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((t) => <span key={t} className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">{t}</span>)}
                </div>
                <h1 className={listing.kind === 'theme' ? 'mt-5 font-serif text-6xl font-light italic leading-[0.95] tracking-tight sm:text-8xl' : 'mt-5 text-5xl font-semibold leading-[1] tracking-tight sm:text-7xl'}>{listing.name}</h1>
                <p className="mt-5 text-2xl font-medium tracking-tight sm:text-3xl">{listing.tagline}</p>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{listing.summary}</p>
                <ul className="mt-6 grid max-w-xl gap-2 text-sm sm:grid-cols-2">
                  {(listing.points ?? THEME_POINTS).map((t, i) => (
                    <motion.li key={t} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }} className="flex items-center gap-2">
                      <CircleCheck className="h-4 w-4 shrink-0 text-primary" /> {t}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
            <div className="lg:col-span-5">
              <motion.div className="lg:sticky lg:top-6" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }}>
                {isLoading ? (
                  <div className="flex h-64 items-center justify-center rounded-2xl border"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <PurchasePanel
                    item={(item ?? fallbackItem)!}
                    name={listing.name}
                    canManage={hasAny(P.MARKETPLACE_MANAGE)}
                    fetchedAt={dataUpdatedAt || Date.now()}
                    offlineReason={!item ? (error instanceof Error && error.message ? error.message : 'The server did not answer.') : undefined}
                    onRetry={() => refetch()}
                    noun={listing.noun}
                    openPath={listing.openPath}
                    openLabel={listing.openLabel}
                  />
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Showcase */}
        {listing.previews.length > 0 && (
        <section>
          <SectionTitle eyebrow="See it" title={listing.showcaseTitle ?? 'Every page, in place'} text={listing.showcaseText ?? 'Pick a page. Long pages scroll by themselves; hover to hold one still, or open the live preview to click around.'} />
          <Reveal><Showcase previews={listing.previews} themeId={listing.themeId} host={listing.showcaseHost ?? 'yourshop.com'} /></Reveal>
        </section>
        )}

        {/* Highlights */}
        <section>
          <SectionTitle eyebrow="What is inside" title={listing.kind === 'theme' ? 'More than a new colour' : 'What you get'} text={listing.kind === 'theme' ? 'The layouts, the type, the motion and the details, all included.' : 'Everything you need to answer customers on WhatsApp.'} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listing.highlights.map((h, i) => (
              <Reveal key={h.title} delay={(i % 4) * 0.07}>
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25 }} className="group h-full rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><h.icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 font-semibold">{h.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{h.text}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Pages covered */}
        <section className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4"><SectionTitle eyebrow="Coverage" title={listing.coverageTitle ?? 'Pages it covers'} text={listing.coverageText ?? 'The whole public side of your shop. The admin panel is never touched.'} /></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {listing.pagesCovered.map((g, i) => (
              <Reveal key={g.group} delay={i * 0.06}>
                <div className="h-full rounded-2xl border p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.group}</p>
                  <ul className="mt-3 space-y-2">
                    {g.pages.map((p, j) => (
                      <motion.li key={p} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: j * 0.05 }} className="flex items-center gap-2 text-sm">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-primary"><Check className="h-3 w-3" /></span>{p}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How the trial works */}
        <section>
          <SectionTitle eyebrow="Try before you buy" title="How the free trial works" />
          <div className="relative grid gap-6 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-7 hidden border-t-2 border-dashed border-primary/30 md:block" />
            {(listing.steps ?? THEME_STEPS).map((st, i) => { const s = { ...st, icon: THEME_STEPS[i].icon }; return (
              <Reveal key={s.title} delay={i * 0.12}>
                <div className="relative text-center md:px-4">
                  <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"><s.icon className="h-6 w-6" /></span>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">Step {i + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{s.text}</p>
                </div>
              </Reveal>
            );})}
          </div>
        </section>

        {/* Included + FAQ */}
        <section className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionTitle eyebrow="Included" title="Everything in the box" />
            <ul className="space-y-3">
              {listing.included.map((t, i) => (
                <Reveal key={t} delay={i * 0.06}>
                  <li className="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{t}</li>
                </Reveal>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <SectionTitle eyebrow="Questions" title="Good to know" />
            <Reveal>
              <Accordion type="single" collapsible className="rounded-2xl border px-5">
                {listing.faq.map((f, i) => (
                  <AccordionItem key={f.q} value={`q${i}`} className={i === listing.faq.length - 1 ? 'border-b-0' : ''}>
                    <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketplaceItem;
