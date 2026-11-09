import { FormEvent, ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { useTheme } from '../ThemeProvider';
import { subscribeEmail } from '@/lib/api';
import { usePrice } from '@/lib/currency';
import { EdBanner, useStorefront } from './data';
import { Abstract } from './Abstract';
import { Line, Marquee, Photo, Rise } from './motion';

const STOCK = [
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1400&h=1800&fit=crop',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1400&h=1800&fit=crop',
  'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1400&h=1800&fit=crop',
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1400&h=1800&fit=crop',
];
const QUOTES = [
  { name: 'Priya Sharma', text: 'Beautiful quality. The prints are stunning and the fabric is so soft.', location: 'Mumbai' },
  { name: 'Anita Reddy', text: 'Fast delivery and gorgeous packaging. The kurti fits perfectly.', location: 'Bangalore' },
  { name: 'Meera Patel', text: 'The customisation options are amazing. Highly recommend.', location: 'Ahmedabad' },
];
const STEPS = [
  ['Design', 'Bring a motif or work with our studio. We resolve colour, scale and repeat with you.'],
  ['Print', 'Small runs from two pieces, colour-matched and proofed before we commit the cloth.'],
  ['Stitch', 'Embroidery from ten metres, finished by hand where the pattern asks for it.'],
  ['Ship', 'Made to order and dispatched across India in five to six days.'],
];

/** Desktop cells of a 12-column bento, two rows tall, no gaps: a tall lead, then four tiles filling the rest. */
const LOOKBOOK = [
  'lg:col-span-5 lg:row-span-2',
  'lg:col-span-4',
  'lg:col-span-3',
  'lg:col-span-3',
  'lg:col-span-4',
];

/** One header for every section: number and label on the left, an optional link on the right, a rule beneath. */
const SectionHead = ({ n, label, to, cta = 'See all' }: { n: string; label: string; to?: string; cta?: string }) => (
  <div className="ed-kicker mb-8 flex items-center justify-between border-b ed-rule pb-3">
    <span><span className="ed-num mr-3 normal-case tracking-normal">{n}</span>{label}</span>
    {to && <Link to={to} className="ed-link">{cta}</Link>}
  </div>
);

const Stars = ({ n, className = '' }: { n?: number; className?: string }) => (
  <div className={`flex gap-1 text-primary ${className}`} aria-label={`${n || 5} out of 5`}>
    {[0, 1, 2, 3, 4].map((i) => <span key={i} className={i < (n || 5) ? '' : 'opacity-25'}>★</span>)}
  </div>
);


const SLIDE_MS = 6500;

/** Splits a banner title into at most three display lines: on newlines if there are any, else by length. */
const titleLines = (title: string): string[] => {
  const manual = title.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (manual.length > 1) return manual.slice(0, 3);
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if (line && (line + ' ' + w).length > 14 && lines.length < 2) { lines.push(line); line = w; }
    else line = line ? `${line} ${w}` : w;
  }
  if (line) lines.push(line);
  return lines;
};

/** Headline size follows the longest line, so a long banner title never overflows. */
const titleSize = (lines: string[]): string => {
  const longest = Math.max(...lines.map((l) => l.length), 1);
  if (longest <= 10) return 'clamp(3.2rem,9.5vw,9rem)';
  if (longest <= 14) return 'clamp(2.8rem,8vw,7.5rem)';
  if (longest <= 20) return 'clamp(2.4rem,6.2vw,5.8rem)';
  return 'clamp(2.1rem,4.8vw,4.4rem)';
};

const SlideLink = ({ to, className, children }: { to: string; className: string; children: ReactNode }) =>
  /^https?:/i.test(to)
    ? <a href={to} className={className}>{children}</a>
    : <Link to={to} className={className}>{children}</Link>;

/**
 * The cover. One slide per CMS banner (image, title, subtitle, button and link all from the banner), in the
 * admin's order. Several banners advance on their own and can be stepped through; one banner is shown still.
 */
const Cover = ({ banners, fallback, fallbackSecond }: { banners: EdBanner[]; fallback: string; fallbackSecond: string }) => {
  const slides: EdBanner[] = banners.length
    ? banners
    : [{ id: 'default', title: 'Pattern, thread & patience.', subtitle: 'Contemporary prints and embroideries drawn from Indian craft. Begin with two pieces of print or ten metres of embroidery.', image: fallback, cta: 'Shop now', link: '/products' }];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const { preview } = useTheme();
  const count = slides.length;
  const active = slides[index % count];
  const next = slides[(index + 1) % count];
  const lines = titleLines(active.title || 'Studio Sara');
  const go = (to: number) => setIndex((to + count) % count);

  useEffect(() => { if (index >= count) setIndex(0); }, [count, index]);
  useEffect(() => {
    if (count < 2 || paused || preview || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [index, count, paused, preview]);

  return (
    <section className="relative overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Abstract variant="wash" className="-right-32 -top-24 h-[760px] w-[760px]" />
      <Abstract variant="rings" className="-bottom-72 -left-60 h-[700px] w-[700px] opacity-70" />
      <div className="container-custom relative pb-14 pt-6 lg:pb-20">
        <div className="ed-kicker flex items-center justify-between border-b ed-hair pb-3">
          <span>The Studio Sara edit</span>
          <span className="hidden sm:block">Prints · Embroidery · Made to order</span>
        </div>

        <div className="grid gap-10 pt-8 lg:h-[clamp(540px,76vh,720px)] lg:grid-cols-12 lg:gap-12 lg:pt-10">
          <div className="flex flex-col lg:col-span-7 lg:h-full">
            <div key={active.id + index} className="flex min-h-[20rem] flex-col justify-center lg:min-h-0 lg:flex-1">
              <h1 className="ed-display" style={{ fontSize: titleSize(lines) }}>
                {lines.map((l, i) => (
                  <Line key={i} delay={i * 0.12}>{i === 1 && lines.length > 1 ? <em>{l}</em> : l}</Line>
                ))}
              </h1>
              <Rise delay={0.4} className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                {active.subtitle ? <p className="line-clamp-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground">{active.subtitle}</p> : <span />}
                <div className="flex shrink-0 items-center gap-6">
                  <SlideLink to={active.link} className="bg-foreground px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-background transition-colors hover:bg-primary">{active.cta}</SlideLink>
                  <Link to="/custom-design" className="ed-kicker ed-link pb-1">Design your own</Link>
                </div>
              </Rise>
            </div>

            {count > 1 && (
              <div className="mt-8 flex items-center gap-5 lg:mt-auto">
                <span className="ed-num text-lg tabular-nums">{String(index % count + 1).padStart(2, '0')}<span className="text-muted-foreground"> / {String(count).padStart(2, '0')}</span></span>
                <div className="flex flex-1 gap-2">
                  {slides.map((sl, i) => (
                    <button key={sl.id + i} type="button" aria-label={`Show slide ${i + 1}`} onClick={() => go(i)} className="group relative h-[3px] flex-1 bg-foreground/15">
                      <span
                        key={i === index % count ? `on${index}${paused}` : 'off'}
                        className={`ed-progress absolute inset-0 origin-left bg-primary ${i < index % count ? 'scale-x-100' : i === index % count ? '' : 'scale-x-0'}`}
                        style={i === index % count ? { animation: `ed-progress ${SLIDE_MS}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' } : undefined}
                      />
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <button type="button" aria-label="Previous slide" onClick={() => go(index - 1)} className="flex h-9 w-9 items-center justify-center border ed-hair transition-colors hover:bg-foreground hover:text-background"><ArrowLeft className="h-4 w-4" /></button>
                  <button type="button" aria-label="Next slide" onClick={() => go(index + 1)} className="flex h-9 w-9 items-center justify-center border ed-hair transition-colors hover:bg-foreground hover:text-background"><ArrowRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>

          <div className="relative flex flex-col lg:col-span-5 lg:h-full">
            <Photo key={active.id + index} src={active.image} alt={active.title || 'Studio Sara'} aspect="aspect-[4/5] lg:aspect-auto lg:min-h-0 lg:flex-1" drift={6} />
            <div className="absolute -bottom-6 -left-4 w-[42%] border-[10px] border-background sm:-left-8">
              <Photo key={`n${next.id}${index}`} src={count > 1 ? next.image : fallbackSecond} alt="" aspect="aspect-[3/4]" drift={8} delay={0.2} />
            </div>
            <p className="ed-kicker mt-3 shrink-0 text-right !text-[10px] text-muted-foreground">
              <span className="ed-num mr-1 normal-case tracking-normal">Fig. {index % count + 1}</span> {count > 1 ? 'Up next, bottom left' : 'Print, and thread detail'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const EditorialHome = () => {
  const { format } = usePrice();
  const { categories, bestSellers, newArrivals, banners, instagram, blogs, products, testimonials } = useStorefront();
  const [email, setEmail] = useState('');
  const [hover, setHover] = useState(0);

  const subscribe = useMutation({
    mutationFn: (v: string) => subscribeEmail(v),
    onSuccess: () => { toast.success('You are on the list.'); setEmail(''); },
    onError: (e: Error) => toast.error(e.message || 'Could not subscribe. Please try again.'),
  });
  const onSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email address');
    subscribe.mutate(email.trim());
  };

  const pool = [...banners.map((b) => b.image), ...categories.map((c) => c.image), ...products.map((p) => p.image)].filter(Boolean);
  const img = (i: number) => pool[i] || STOCK[i % STOCK.length];
  // The CMS testimonials, however many and however short; the stock quotes only when there are none.
  const quotes = ((testimonials.length ? testimonials : QUOTES) as any[]).filter((t) => (t.text || '').trim()).slice(0, 6);
  let section = 0;
  const num = () => String(++section).padStart(2, '0');
  const collections = categories.slice(0, 7);
  const shown = collections[hover] ?? collections[0];

  return (
    <Layout>
      {/* ───────── Cover ───────── */}
      <Cover banners={banners} fallback={img(0)} fallbackSecond={img(1)} />

      <Marquee items={['Block print', 'Embroidery', 'Made to order', 'From two pieces', 'Designed in India']} />

      {/* ───────── Opening note ───────── */}
      <section className="container-custom py-14 lg:py-20">
        <SectionHead n={num()} label="The studio" />
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
          <Rise className="lg:col-span-8">
            <p className="ed-title !text-[clamp(1.7rem,3.6vw,3.2rem)]">
              We make cloth the slow way: drawn first, proofed twice, and cut only when you say so. Every order is made for one person, in small runs, with the pattern given room to breathe.
            </p>
            <div className="ed-stitch mt-10 max-w-xs" />
          </Rise>
          <div className="lg:col-span-4"><Photo src={img(2)} aspect="aspect-[4/5]" drift={5} /></div>
        </div>
      </section>

      {/* ───────── Index of collections ───────── */}
      {collections.length > 0 && (
        <section className="relative overflow-hidden bg-muted/60">
          <Abstract variant="arches" className="-bottom-4 -right-10 h-[78%] w-auto opacity-90 lg:right-[4%]" />
          <div className="container-custom relative py-14 lg:py-20">
            <SectionHead n={num()} label="Collections" to="/categories" cta="View all" />
            <div className="grid items-start gap-10 lg:grid-cols-12">
              <ul className="lg:col-span-7">
                {collections.map((c, i) => (
                  <li key={c.id} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)}>
                    <Link
                      to={c.slug ? `/category/${c.slug}` : '/products'}
                      className="group flex items-baseline gap-5 border-t ed-hair py-5 transition-[padding] duration-500 hover:pl-4 lg:py-7"
                    >
                      <span className="ed-num w-8 text-lg text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                      <span className={`ed-title !text-[clamp(2rem,4.6vw,4rem)] transition-colors duration-300 ${hover === i ? 'text-foreground' : 'text-foreground/35'}`}>{c.name}</span>
                      <ArrowUpRight className="ml-auto h-6 w-6 -translate-x-2 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
                <li className="border-t ed-hair" />
              </ul>
              <div className="hidden lg:col-span-5 lg:block">
                <div className="sticky top-32 aspect-[4/5] overflow-hidden bg-muted">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={shown?.id}
                      src={shown?.image || STOCK[hover % STOCK.length]}
                      alt={shown?.name || ''}
                      className="absolute inset-0 h-full w-full object-cover"
                      initial={{ opacity: 0, scale: 1.06 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.55, ease: [0.2, 0.7, 0.1, 1] }}
                    />
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───────── Lookbook ───────── */}
      {bestSellers.length > 0 && (
        <section className="container-custom py-14 lg:py-20">
          <SectionHead n={num()} label="Lookbook" to="/products?filter=best" />
          <h2 className="ed-title mb-10 max-w-3xl"><Line>The pieces people</Line><Line delay={0.1}>keep <em>coming back</em> to.</Line></h2>
          <div className="grid grid-cols-2 gap-4 lg:auto-rows-[21vw] lg:grid-cols-12 lg:gap-5">
            {bestSellers.slice(0, 5).map((p, i) => (
              <Rise key={p.id} delay={(i % 3) * 0.07} className={`${LOOKBOOK[i]} ${i === 0 ? 'col-span-2' : ''}`}>
                <Link to={`/product/${p.slug}`} className="group flex h-full flex-col">
                  <Photo src={p.image} alt={p.name} aspect={`${i === 0 ? 'aspect-[4/3]' : 'aspect-[4/5]'} lg:aspect-auto lg:flex-1 lg:min-h-0`} drift={4} />
                  <div className="mt-2.5 flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate font-serif text-lg font-light italic tracking-[-0.02em] ed-link">{p.name}</p>
                    <p className="ed-kicker shrink-0 !text-[11px]"><span className="ed-num mr-2 normal-case tracking-normal text-muted-foreground">No. {String(i + 1).padStart(2, '0')}</span>{format(p.price)}</p>
                  </div>
                </Link>
              </Rise>
            ))}
          </div>
        </section>
      )}

      {/* ───────── Process ───────── */}
      <section className="relative overflow-hidden bg-foreground text-background">
        <Abstract variant="rings" dark className="-right-72 -top-72 h-[900px] w-[900px] opacity-80" />
        <div className="container-custom relative grid gap-12 py-14 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            <Rise><p className="ed-kicker mb-6 text-background/60"><span className="ed-num mr-3 normal-case tracking-normal">{num()}</span>How it is made</p></Rise>
            <h2 className="ed-title"><Line>Four steps,</Line><Line delay={0.1}><em className="!text-[hsl(171_52%_62%)]">no shortcuts.</em></Line></h2>
            <Rise delay={0.2} className="mt-8 flex flex-wrap gap-6">
              <Link to="/make-your-own" className="ed-kicker ed-link inline-flex items-center gap-2 pb-1">Upload your design <ArrowUpRight className="h-4 w-4" /></Link>
              <Link to="/custom-design" className="ed-kicker ed-link inline-flex items-center gap-2 pb-1">Work with the studio <ArrowUpRight className="h-4 w-4" /></Link>
            </Rise>
          </div>
          <ol className="lg:col-span-6 lg:col-start-7">
            {STEPS.map(([name, text], i) => (
              <Rise key={name}>
                <li className="grid grid-cols-[3rem_1fr] gap-4 border-t border-background/25 py-7 first:border-t-0 first:pt-0">
                  <span className="ed-num text-2xl text-[hsl(171_52%_62%)]">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="font-serif text-3xl font-light tracking-[-0.025em] lg:text-4xl">{name}</h3>
                    <p className="mt-3 max-w-md text-[15px] leading-relaxed text-background/65">{text}</p>
                  </div>
                </li>
              </Rise>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Get a quote ───────── */}
      <section className="container-custom pb-4 pt-14 lg:pt-20">
        <Rise>
          <div className="relative overflow-hidden bg-primary px-6 py-14 text-primary-foreground shadow-[14px_14px_0_hsl(var(--foreground))] sm:px-12 lg:px-16 lg:py-20">
            <Abstract variant="rings" dark className="-right-40 -top-40 h-[560px] w-[560px] opacity-70" />
            <span className="absolute right-6 top-6 z-10 hidden rotate-[8deg] bg-background px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-foreground shadow-[4px_4px_0_hsl(var(--foreground))] sm:block">Free quote</span>
            <div className="relative grid items-end gap-8 lg:grid-cols-12">
              <h2 className="ed-title !text-[clamp(2.4rem,6vw,5.5rem)] !text-primary-foreground lg:col-span-8">
                <Line>Something one</Line><Line delay={0.1}>of a kind in <em className="!text-background">mind?</em></Line>
              </h2>
              <div className="lg:col-span-4">
                <p className="mb-6 text-[15px] leading-relaxed text-primary-foreground/85">Tell us the design, the quantity and the cloth. We reply with a clear quote, usually within a day.</p>
                <div className="flex flex-wrap items-center gap-5">
                  <Link to="/inquiry" className="bg-background px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground shadow-[4px_4px_0_hsl(var(--foreground))] transition-transform hover:-translate-y-0.5">Get a quote</Link>
                  <Link to="/custom-design" className="ed-kicker ed-link pb-1">Start a custom design</Link>
                </div>
              </div>
            </div>
          </div>
        </Rise>
      </section>

      {/* ───────── New in ───────── */}
      {newArrivals.length > 0 && (
        <section className="container-custom py-14 lg:py-20">
          <SectionHead n={num()} label="New in" to="/products?filter=new" />
          <h2 className="ed-title mb-10"><Line>This season.</Line></h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 lg:gap-x-5">
            {newArrivals.slice(0, 8).map((p, i) => (
              <Rise key={p.id} delay={(i % 4) * 0.06}>
                <Link to={`/product/${p.slug}`} className="group block">
                  <Photo src={p.image} alt={p.name} aspect="aspect-[4/5]" drift={4} />
                  <p className="mt-3 truncate font-serif text-lg font-light italic tracking-[-0.02em] ed-link">{p.name}</p>
                  <p className="ed-kicker mt-0.5 !text-[11px] text-muted-foreground">{format(p.price)}</p>
                </Link>
              </Rise>
            ))}
          </div>
        </section>
      )}

      {/* ───────── Journal (homepage blogs from the CMS) ───────── */}
      {blogs.length > 0 && (
        <section className="container-custom py-14 lg:py-20">
          <SectionHead n={num()} label="Journal" to="/blog" cta="Read all" />
          <div className="grid gap-x-6 gap-y-10 md:grid-cols-3">
            {blogs.map((b, i) => (
              <Rise key={b.id} delay={i * 0.08}>
                <Link to={`/blog/${b.id}`} className="group block">
                  <Photo src={b.image} alt={b.title} aspect="aspect-[4/3]" drift={4} />
                  {b.publishedAt && (
                    <p className="ed-kicker mt-4 !text-[10px] text-muted-foreground">
                      {new Date(b.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  <h3 className="mt-1.5 font-serif text-2xl font-light leading-tight tracking-[-0.02em] ed-link">{b.title}</h3>
                </Link>
              </Rise>
            ))}
          </div>
        </section>
      )}

      {/* ───────── Instagram (posts from the CMS) ───────── */}
      {instagram.length > 0 && (
        <section className="container-custom pb-14 lg:pb-20">
          <SectionHead n={num()} label="On Instagram" to="https://www.instagram.com/_studio__sara_" cta="Follow @_studio__sara_" />
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-6 lg:gap-3">
            {instagram.map((p, i) => (
              <Rise key={i} delay={i * 0.04}>
                <a href={p.linkUrl || 'https://www.instagram.com/_studio__sara_'} target="_blank" rel="noopener noreferrer" className="group block">
                  <Photo src={p.imageUrl} aspect="aspect-square" drift={3} />
                </a>
              </Rise>
            ))}
          </div>
        </section>
      )}

      {/* ───────── Letters ───────── */}
      {quotes.length > 0 && (
        <section className="relative overflow-hidden bg-muted/60">
          <Abstract variant="wash" className="-left-40 -top-32 h-[640px] w-[640px]" />
          <Abstract variant="wash" className="-bottom-48 -right-32 h-[520px] w-[520px] opacity-80" />
          <div className="container-custom relative py-14 lg:py-20">
            <SectionHead n={num()} label="Letters" />
            {quotes.length === 1 ? (
              <Rise>
                <figure className="mx-auto max-w-3xl py-6 text-center lg:py-10">
                  <span className="block font-serif text-[8rem] font-light leading-[0.6] text-primary">“</span>
                  <blockquote className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] font-light leading-[1.1] tracking-[-0.03em]">{quotes[0].text}</blockquote>
                  <Stars n={quotes[0].rating} className="mt-8 justify-center" />
                  <figcaption className="ed-kicker mt-4 !text-[11px]">{quotes[0].name}{quotes[0].location ? ` — ${quotes[0].location}` : ''}</figcaption>
                </figure>
              </Rise>
            ) : (
              <div className={`grid gap-10 md:gap-x-10 ${quotes.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                {quotes.map((t: any, i: number) => (
                  <Rise key={t.id ?? i} delay={(i % 3) * 0.08}>
                    <figure className="flex h-full flex-col border-t ed-rule pt-5">
                      <Stars n={t.rating} />
                      <blockquote className={`mt-4 flex-1 font-serif font-light leading-snug tracking-[-0.02em] ${quotes.length === 2 ? 'text-[clamp(1.6rem,2.6vw,2.2rem)]' : 'text-[1.4rem]'}`}>“{t.text}”</blockquote>
                      <figcaption className="ed-kicker mt-6 !text-[11px]">{t.name}{t.location ? ` — ${t.location}` : ''}</figcaption>
                    </figure>
                  </Rise>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ───────── Subscribe ───────── */}
      <section className="relative overflow-hidden">
        <Abstract variant="arches" className="-bottom-6 left-1/2 h-[120%] w-auto -translate-x-1/2 opacity-50 lg:left-[72%]" />
      <div className="container-custom relative py-14 lg:py-20">
        <SectionHead n={num()} label="Stay in touch" />
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <h2 className="ed-title lg:col-span-7"><Line>Letters from</Line><Line delay={0.1}>the <em>studio.</em></Line></h2>
          <Rise className="lg:col-span-5">
            <p className="mb-5 text-[15px] text-muted-foreground">New prints, studio notes and early access. Sent rarely.</p>
            <form onSubmit={onSubscribe} className="flex items-end gap-4 border-b ed-rule pb-2">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address"
                className="min-w-0 flex-1 bg-transparent font-serif text-2xl font-light italic outline-none placeholder:text-foreground/35"
              />
              <button type="submit" disabled={subscribe.isPending} className="ed-kicker ed-link pb-1 disabled:opacity-50">Subscribe</button>
            </form>
          </Rise>
        </div>
      </div>
      </section>
    </Layout>
  );
};

export default EditorialHome;
