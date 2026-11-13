import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EyeOff, Globe2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IGNORE_VISITS_KEY, logsApi } from '@/lib/api';

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtAt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '';

const Stat = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="rounded-lg border border-border p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 text-xl font-semibold leading-tight">{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
  </div>
);

/** Who is on the public website right now (any page, excluding admins and bots) and daily active users. */
export const LiveVisitorsPanel = ({ windowHours }: { windowHours: number }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['live-visitors', windowHours],
    queryFn: () => logsApi.getVisitors(windowHours),
    refetchInterval: 10_000,
  });
  const [ignored, setIgnored] = useState(() => {
    try { return localStorage.getItem(IGNORE_VISITS_KEY) === '1'; } catch { return false; }
  });

  const toggleIgnore = () => {
    const next = !ignored;
    try {
      if (next) localStorage.setItem(IGNORE_VISITS_KEY, '1');
      else localStorage.removeItem(IGNORE_VISITS_KEY);
    } catch { /* storage blocked */ }
    setIgnored(next);
  };

  if (isError) return null;
  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading visitors…</div>;

  const points = data.history.map((p) => ({ ...p, ts: new Date(p.t).getTime() }));
  const areas = Object.entries(data.byArea).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const tickFmt = (ts: number) =>
    windowHours <= 24
      ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const axis = { stroke: '#9ca3af', fontSize: 11 } as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Visitors on the website</h3>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={toggleIgnore}
          title="Your own visits are never counted while you are logged in as admin. Use this on a browser where you browse the site without logging in.">
          <EyeOff className="h-4 w-4" /> {ignored ? 'This browser is not counted (click to count)' : "Don't count this browser"}
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-border p-4 lg:col-span-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            On the site right now
          </div>
          <div className="mt-1 text-5xl font-bold leading-none">{data.liveNow}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">any page · excludes admins and bots · updates every few seconds</div>

          <div className="mt-4 space-y-1.5">
            {areas.length === 0 && <div className="text-xs text-muted-foreground">Nobody on the public site at this moment.</div>}
            {areas.map(([name, n]) => (
              <div key={name}>
                <div className="flex justify-between text-xs"><span>{name}</span><span className="font-medium">{n}</span></div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${data.liveNow ? (n / data.liveNow) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>

          {data.topPages.length > 0 && (
            <div className="mt-4 border-t border-border pt-2">
              <div className="mb-1 flex items-center gap-1 text-xs font-medium"><Globe2 className="h-3.5 w-3.5" /> Pages open now</div>
              {data.topPages.map((p) => (
                <div key={p.path} className="flex justify-between text-[11px] text-muted-foreground">
                  <span className="truncate pr-2">{p.path}</span><span>{p.visitors}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:col-span-2 xl:grid-cols-3">
          <Stat label="Most at once today" value={data.peakToday} sub={data.peakTodayAt ? `at ${fmtAt(data.peakTodayAt)}` : 'no data yet'} />
          <Stat label="Visitors today" value={data.uniqueToday} sub="distinct people" />
          <Stat label="Stayed 2+ min today" value={data.engagedToday} sub="engaged daily active users" />
          <Stat label="Visitors yesterday" value={data.uniqueYesterday} sub={`${data.engagedYesterday} stayed 2+ min`} />
          <Stat label="7-day average" value={Math.round(data.avgUnique7d)} sub="visitors per day" />
          <Stat label="Engaged rate today"
            value={data.uniqueToday ? `${Math.round((data.engagedToday / data.uniqueToday) * 100)}%` : '—'} sub="stayed 2+ minutes" />
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <div className="mb-2 flex items-baseline justify-between">
          <h4 className="text-sm font-medium">People on the site over time</h4>
          <span className="text-[11px] text-muted-foreground">per minute, last {windowHours >= 48 ? `${Math.round(windowHours / 24)} days` : `${windowHours}h`}</span>
        </div>
        <div className="h-44">
          {points.length < 2 ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">The chart fills in as minutes pass.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={tickFmt} {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip labelFormatter={(ts: number) => new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="peak" name="Most at once" stroke="#a855f7" fill="#a855f7" fillOpacity={0.12} />
                <Area type="monotone" dataKey="live" name="On site" stroke="#16a34a" fill="#16a34a" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border p-3">
        <h4 className="mb-2 text-sm font-medium">Daily active users, last 7 days</h4>
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr className="text-left"><th className="py-1 font-medium">Day</th><th className="font-medium">Visitors</th><th className="font-medium">Stayed 2+ min</th><th className="font-medium">Most at once</th></tr>
          </thead>
          <tbody>
            {data.days.slice().reverse().map((d) => (
              <tr key={d.day} className="border-t border-border">
                <td className="py-1.5">{fmtDay(d.day)}</td><td>{d.unique}</td><td>{d.engaged || '—'}</td><td>{d.peak || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-muted-foreground">"Stayed 2+ min" is counted from the moment live tracking started; older days only have visitor totals.</p>
      </div>
    </div>
  );
};
