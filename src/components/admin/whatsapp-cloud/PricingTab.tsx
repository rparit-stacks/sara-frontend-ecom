import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CreditCard, ExternalLink, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { whatsappCloudApi } from '@/lib/api';
import { cn } from '@/lib/utils';

type Preset = 'month' | 'last7' | 'last30' | 'lastMonth' | 'custom';

const PRESETS: Array<[Preset, string]> = [['month', 'This month'], ['last7', 'Last 7 days'], ['last30', 'Last 30 days'], ['lastMonth', 'Last month'], ['custom', 'Choose dates']];
const CATEGORY_LABEL: Record<string, string> = { MARKETING: 'Marketing', UTILITY: 'Utility (orders, alerts)', AUTHENTICATION: 'Login codes', UNKNOWN: 'Unknown type' };

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const rupees = (n: number, digits = 2) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
const nice = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const rangeFor = (preset: Preset, customFrom: string, customTo: string) => {
  const today = new Date();
  if (preset === 'last7') { const f = new Date(today); f.setDate(f.getDate() - 6); return { from: iso(f), to: iso(today) }; }
  if (preset === 'last30') { const f = new Date(today); f.setDate(f.getDate() - 29); return { from: iso(f), to: iso(today) }; }
  if (preset === 'lastMonth') { return { from: iso(new Date(today.getFullYear(), today.getMonth() - 1, 1)), to: iso(new Date(today.getFullYear(), today.getMonth(), 0)) }; }
  if (preset === 'custom') return { from: customFrom, to: customTo };
  return { from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso(today) };
};

/** Spend so far (an estimate from delivered messages and Meta's INR rate card), how it is worked out, and a button to Meta's billing page. */
export const PricingTab = () => {
  const [preset, setPreset] = useState<Preset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showAllMarkets, setShowAllMarkets] = useState(false);

  const range = useMemo(() => rangeFor(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const ready = !!range.from && !!range.to && range.from <= range.to;

  const usage = useQuery({ queryKey: ['waCloudUsage', range.from, range.to], queryFn: () => whatsappCloudApi.getUsage(range), enabled: ready, retry: false });
  const rates = useQuery({ queryKey: ['waCloudRates'], queryFn: () => whatsappCloudApi.getUsageRates(), retry: false });
  const billing = useQuery({ queryKey: ['waCloudBillingLink'], queryFn: () => whatsappCloudApi.getBillingLink(), retry: false });

  const u = usage.data;
  const payUrl = billing.data?.url || rates.data?.billingUrl;
  const peak = u ? Math.max(1, ...u.daily.map((d) => d.cost)) : 1;
  const markets = rates.data?.markets ?? [];
  const india = markets.find((m) => m.market === 'India');
  const shownMarkets = showAllMarkets ? markets : markets.filter((m) => ['India', 'United Arab Emirates', 'United Kingdom', 'North America', 'Other countries'].includes(m.market));

  return (
    <div className="space-y-8">
      {/* Filters and the pay button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(([key, label]) => (
            <button key={key} type="button" onClick={() => setPreset(key)}
              className={cn('rounded-full border px-3.5 py-1.5 text-sm transition', preset === key ? 'border-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground')}>
              {label}
            </button>
          ))}
        </div>
        <Button asChild={!!payUrl} disabled={!payUrl} className="gap-2">
          {payUrl ? <a href={payUrl} target="_blank" rel="noopener noreferrer"><CreditCard className="h-4 w-4" /> Pay now on Meta <ExternalLink className="h-3.5 w-3.5" /></a> : <span>Pay now on Meta</span>}
        </Button>
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-end gap-3">
          <div><label className="text-xs text-muted-foreground">From</label><Input type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} className="mt-1 w-44" /></div>
          <div><label className="text-xs text-muted-foreground">To</label><Input type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} className="mt-1 w-44" /></div>
          {!ready && <p className="pb-2 text-sm text-muted-foreground">Pick both dates to see the amount.</p>}
        </div>
      )}

      {/* Estimate notice */}
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>This is an <strong>estimate</strong>. We count the messages that were delivered and multiply by Meta's published rates. We cannot be sure Meta will charge exactly this. The real amount is on Meta's billing page, and your card on the WhatsApp account is charged by Meta, not by us.</p>
      </div>

      {usage.isLoading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Working out the amount</p>}
      {usage.isError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{(usage.error as Error)?.message || 'Could not load usage.'}</p>}

      {u && (
        <>
          {/* The one big number */}
          <section className="rounded-2xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">Estimated spend, {nice(u.from)} to {nice(u.to)}</p>
            <p className="mt-1 font-sans text-4xl font-semibold tracking-tight">{rupees(u.estimatedTotal)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{rupees(u.estimatedCost)} for messages + {rupees(u.estimatedGst)} GST ({u.gstPercent}% assumed) · {u.deliveredMessages.toLocaleString('en-IN')} delivered messages</p>
            {u.rateSource === 'custom' && <p className="mt-2 text-xs text-amber-800">A custom rate card is saved in the WhatsApp service, so these numbers use it instead of Meta's October 2026 card.</p>}
            {u.unpricedMessages > 0 && <p className="mt-2 text-xs text-amber-800">{u.unpricedMessages} messages had no rate and are counted as free.</p>}
          </section>

          {/* How it is worked out */}
          <section>
            <h2 className="font-sans text-lg font-semibold">How the amount is worked out</h2>
            <ol className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
              {[
                ['1', 'Count delivered messages', 'Only messages Meta delivered are charged. Failed and skipped ones are free.'],
                ['2', 'Find the rate', "By message type (Marketing costs most) and the customer's country."],
                ['3', 'Multiply and add up', 'Messages × rate, for every type and country.'],
                ['4', `Add ${u.gstPercent}% GST`, "Meta's rates are before tax."],
              ].map(([n, t, d]) => (
                <li key={n} className="rounded-xl border p-4"><span className="text-xs font-semibold text-primary">Step {n}</span><p className="mt-1 font-medium">{t}</p><p className="mt-1 text-muted-foreground">{d}</p></li>
              ))}
            </ol>
          </section>

          {/* By type and by country */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="font-sans text-lg font-semibold">By message type</h2>
              <div className="mt-3 overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-2 font-medium">Type</th><th className="px-4 py-2 text-right font-medium">Messages</th><th className="px-4 py-2 text-right font-medium">Cost</th></tr></thead>
                  <tbody className="divide-y">
                    {u.byCategory.length === 0 && <tr><td colSpan={3} className="px-4 py-4 text-muted-foreground">No delivered messages in this period.</td></tr>}
                    {u.byCategory.map((c) => <tr key={c.category}><td className="px-4 py-2">{CATEGORY_LABEL[c.category] ?? c.category}</td><td className="px-4 py-2 text-right">{c.count.toLocaleString('en-IN')}</td><td className="px-4 py-2 text-right">{rupees(c.cost)}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </section>
            <section>
              <h2 className="font-sans text-lg font-semibold">By customer country</h2>
              <div className="mt-3 overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-2 font-medium">Country</th><th className="px-4 py-2 text-right font-medium">Messages</th><th className="px-4 py-2 text-right font-medium">Cost</th></tr></thead>
                  <tbody className="divide-y">
                    {u.byMarket.length === 0 && <tr><td colSpan={3} className="px-4 py-4 text-muted-foreground">No delivered messages in this period.</td></tr>}
                    {u.byMarket.map((m) => <tr key={m.market}><td className="px-4 py-2">{m.market}{m.callingCode ? <span className="text-muted-foreground"> +{m.callingCode}</span> : null}</td><td className="px-4 py-2 text-right">{m.count.toLocaleString('en-IN')}</td><td className="px-4 py-2 text-right">{rupees(m.cost)}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Day by day */}
          <section>
            <h2 className="font-sans text-lg font-semibold">Day by day</h2>
            <div className="mt-3 flex h-32 items-end gap-[3px] rounded-xl border p-3">
              {u.daily.map((d) => (
                <div key={d.date} className="group relative flex h-full flex-1 items-end" title={`${nice(d.date)}: ${rupees(d.cost)} · ${d.count} messages`}>
                  <div className={cn('w-full rounded-t', d.cost > 0 ? 'bg-primary/70 group-hover:bg-primary' : 'bg-muted')} style={{ height: `${Math.max(d.cost > 0 ? 6 : 2, (d.cost / peak) * 100)}%` }} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Each bar is one day, before GST. Hover to see the amount.</p>
          </section>

          {/* Not charged */}
          <section className="grid gap-3 sm:grid-cols-3">
            {[['Failed', u.notCharged.failed, 'Never delivered, so not charged'], ['Skipped', u.notCharged.skipped, 'Not sent (for example no opt-in), so not charged'], ['Waiting', u.notCharged.waitingForDelivery, 'Sent but not confirmed delivered yet']].map(([k, v, d]) => (
              <div key={k as string} className="rounded-xl border px-4 py-3"><p className="text-xs text-muted-foreground">{k}</p><p className="text-2xl font-semibold">{(v as number).toLocaleString('en-IN')}</p><p className="text-xs text-muted-foreground">{d}</p></div>
            ))}
          </section>
        </>
      )}

      {/* Meta's rates */}
      <section>
        <h2 className="font-sans text-lg font-semibold">Meta's rates, per delivered message</h2>
        {rates.isLoading && <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading rates</p>}
        {india && <p className="mt-1 text-sm text-muted-foreground">For customers in India: Marketing {rupees(india.marketing, 4)}, Utility and login codes {rupees(india.utility, 4)}, before GST.</p>}
        {markets.length > 0 && (
          <>
            <div className="mt-3 overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-2 font-medium">Customer's country</th><th className="px-4 py-2 text-right font-medium">Marketing</th><th className="px-4 py-2 text-right font-medium">Utility</th><th className="px-4 py-2 text-right font-medium">Login codes</th></tr></thead>
                <tbody className="divide-y">
                  {shownMarkets.map((m) => (
                    <tr key={m.market} className={m.market === 'India' ? 'bg-primary/5 font-medium' : ''}>
                      <td className="px-4 py-2">{m.market}</td><td className="px-4 py-2 text-right">{rupees(m.marketing, 4)}</td><td className="px-4 py-2 text-right">{rupees(m.utility, 4)}</td><td className="px-4 py-2 text-right">{rupees(m.authentication, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="mt-2 text-sm text-primary underline" onClick={() => setShowAllMarkets((v) => !v)}>{showAllMarkets ? 'Show fewer countries' : `Show all ${markets.length} countries`}</button>
          </>
        )}
        {rates.data && (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {rates.data.howBilled.map((line) => <li key={line}>{line}</li>)}
          </ul>
        )}
      </section>

      {/* Sources */}
      <section className="rounded-xl border p-5">
        <h2 className="font-sans text-lg font-semibold">Where these rates come from</h2>
        <p className="mt-1 text-sm text-muted-foreground">Meta's INR rate card for the WhatsApp Business Platform, effective 1 October 2026. Meta changes its rates on the first day of a quarter, so look at their page for the latest.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2"><a href={rates.data?.officialPricingUrl || 'https://developers.facebook.com/docs/whatsapp/pricing'} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> Meta's pricing page</a></Button>
          <Button asChild variant="outline" size="sm" className="gap-2"><a href="/meta-rate-card/meta-inr-list-rates-2026-10-01.xlsx" download><FileSpreadsheet className="h-4 w-4" /> INR list rates (Excel)</a></Button>
          <Button asChild variant="outline" size="sm" className="gap-2"><a href="/meta-rate-card/meta-inr-volume-tiers-2026-10-01.xlsx" download><FileSpreadsheet className="h-4 w-4" /> INR volume tiers (Excel)</a></Button>
          <Button asChild variant="outline" size="sm" className="gap-2"><a href="/meta-rate-card/meta-inr-rates-and-volume-tiers-2026-10-01.pdf" target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4" /> Rates and tiers (PDF)</a></Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">"Pay now on Meta" opens the billing page of the WhatsApp account this platform sends from, where you can add or change the card and see the real invoices.</p>
      </section>
    </div>
  );
};
