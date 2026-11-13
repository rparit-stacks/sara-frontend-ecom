import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, Cpu, Database, Gauge, HardDrive, MemoryStick, Server, ShieldAlert } from 'lucide-react';
import { logsApi, type VpsApp, type VpsHealth, type VpsIncident } from '@/lib/api';

type Status = 'OK' | 'WARN' | 'CRITICAL';

export const vpsStatusTone = (s?: string) =>
  s === 'CRITICAL'
    ? { pill: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'Critical', icon: ShieldAlert }
    : s === 'WARN'
      ? { pill: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'Needs attention', icon: AlertTriangle }
      : { pill: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500', label: 'Healthy', icon: CheckCircle2 };

export const barTone = (pct: number, warn: number, critical: number) =>
  pct >= critical ? 'bg-red-500' : pct >= warn ? 'bg-orange-500' : 'bg-green-500';

export const fmtUptime = (sec?: number | null) => {
  if (sec == null) return '—';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtGb = (mb: number) => `${(mb / 1024).toFixed(1)} GB`;
const fmtWhen = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const Stat = ({
  icon: Icon, label, value, sub, pct, warn = 85, critical = 95,
}: {
  icon: typeof Cpu; label: string; value: string; sub?: string; pct?: number; warn?: number; critical?: number;
}) => (
  <div className="rounded-lg border border-border p-3">
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {label}</span>
    </div>
    <div className="mt-1 text-xl font-semibold leading-tight">{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    {pct !== undefined && (
      <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
        <div className={`h-1.5 rounded-full ${barTone(pct, warn, critical)}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    )}
  </div>
);

const ChartCard = ({ title, right, children }: { title: string; right?: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-border p-3">
    <div className="mb-2 flex items-baseline justify-between">
      <h4 className="text-sm font-medium">{title}</h4>
      {right && <span className="text-[11px] text-muted-foreground">{right}</span>}
    </div>
    <div className="h-48">{children}</div>
  </div>
);

const appTone = (a: VpsApp) =>
  a.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';

export const VpsHealthPanel = ({ windowHours }: { windowHours: number }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['vps-health'],
    queryFn: () => logsApi.getVpsHealth(),
    refetchInterval: 60_000,
  });
  const { data: hist } = useQuery({
    queryKey: ['vps-health-history', windowHours],
    queryFn: () => logsApi.getVpsHistory(windowHours),
    refetchInterval: 60_000,
  });

  const points = useMemo(
    () => (hist?.points ?? []).map((p) => ({ ...p, ts: new Date(p.t).getTime() })),
    [hist],
  );

  if (isError) return null;
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading VPS health…</div>;
  if (!data) return null;

  if (!data.available) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground flex items-center gap-2">
        <Server className="w-4 h-4" /> VPS health: {data.message || 'not available'}
      </div>
    );
  }

  const tone = vpsStatusTone(data.status as Status);
  const StatusIcon = tone.icon;
  const th = data.thresholds;
  const tickFmt = (ts: number) =>
    windowHours <= 24
      ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const labelFmt = (ts: number) => new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const axis = { stroke: '#9ca3af', fontSize: 11 } as const;
  const incidents: VpsIncident[] = [...(data.activeIncidents ?? [])];
  for (const i of data.recentIncidents ?? []) if (!incidents.some((x) => x.id === i.id)) incidents.push(i);
  const certs = data.certs ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold flex items-center gap-2"><Server className="w-4 h-4 text-primary" /> VPS Health</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Updated {fmtWhen(data.sampledAt)}</span>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${tone.pill}`}>
            <StatusIcon className="w-3.5 h-3.5" /> {tone.label}
          </span>
        </div>
      </div>

      {data.reasons && data.reasons.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          {data.reasons.map((r) => <div key={r}>• {r}</div>)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat icon={Cpu} label="CPU" value={data.cpuPercent != null ? `${Math.round(data.cpuPercent)}%` : '—'}
          sub={hist ? `24h avg ${Math.round(hist.avgCpuPercent)}% · peak ${Math.round(hist.peakCpuPercent)}%` : undefined}
          pct={data.cpuPercent ?? undefined} warn={th?.cpuWarn ?? 85} critical={95} />
        <Stat icon={MemoryStick} label="RAM" value={`${Math.round(data.ram?.usedPercent ?? 0)}%`}
          sub={data.ram ? `${fmtGb(data.ram.usedMb)} of ${fmtGb(data.ram.totalMb)} · ${fmtGb(data.ram.availableMb)} free` : undefined}
          pct={data.ram?.usedPercent} warn={th?.ramWarn ?? 85} critical={th?.ramCritical ?? 95} />
        <Stat icon={HardDrive} label="Disk" value={`${Math.round(data.disk?.usedPercent ?? 0)}%`}
          sub={data.disk ? `${data.disk.usedGb.toFixed(1)} of ${data.disk.totalGb.toFixed(0)} GB · ${data.disk.freeGb.toFixed(0)} GB free` : undefined}
          pct={data.disk?.usedPercent} warn={th?.diskWarn ?? 80} critical={th?.diskCritical ?? 90} />
        <Stat icon={Gauge} label="Load (1 / 5 / 15 min)"
          value={data.load1 != null ? data.load1.toFixed(2) : '—'}
          sub={`${data.load5?.toFixed(2) ?? '—'} · ${data.load15?.toFixed(2) ?? '—'} · ${data.cores ?? '?'} cores`}
          pct={data.load1 != null && data.cores ? (data.load1 / data.cores) * 100 : undefined} warn={100} critical={150} />
        <Stat icon={Database} label="Postgres connections"
          value={data.postgres?.used != null ? `${data.postgres.used} / ${data.postgres.max ?? '?'}` : '—'}
          sub={data.postgres?.usedPercent != null ? `${Math.round(data.postgres.usedPercent)}% of max` : undefined}
          pct={data.postgres?.usedPercent ?? undefined} warn={80} critical={95} />
        <Stat icon={Clock} label="Uptime" value={fmtUptime(data.uptimeSeconds)}
          sub={data.rebootRequired ? 'Reboot pending (updates)' : `${data.restartsLast24h ?? 0} app restart(s) in 24h`} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="CPU & RAM (%)" right={hist ? `RAM avg ${Math.round(hist.avgRamPercent)}% · peak ${Math.round(hist.peakRamPercent)}%` : undefined}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={tickFmt} {...axis} />
              <YAxis domain={[0, 100]} {...axis} />
              <Tooltip labelFormatter={labelFmt} formatter={(v: number) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {th && <ReferenceLine y={th.ramWarn} stroke="#f59e0b" strokeDasharray="4 4" />}
              <Line type="monotone" dataKey="ram" name="RAM" stroke="#6366f1" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="cpu" name="CPU" stroke="#10b981" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Disk & swap (%)" right={hist ? `disk peak ${Math.round(hist.peakDiskPercent)}%` : undefined}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={tickFmt} {...axis} />
              <YAxis domain={[0, 100]} {...axis} />
              <Tooltip labelFormatter={labelFmt} formatter={(v: number) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {th && <ReferenceLine y={th.diskWarn} stroke="#f59e0b" strokeDasharray="4 4" />}
              <Area type="monotone" dataKey="disk" name="Disk" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
              <Area type="monotone" dataKey="swap" name="Swap" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Load average (1 min) & Postgres connections">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={tickFmt} {...axis} />
              <YAxis yAxisId="load" {...axis} />
              <YAxis yAxisId="pg" orientation="right" {...axis} />
              <Tooltip labelFormatter={labelFmt} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="load" type="monotone" dataKey="load1" name="Load" stroke="#ef4444" dot={false} strokeWidth={2} />
              <Line yAxisId="pg" type="monotone" dataKey="pgUsed" name="DB connections" stroke="#f59e0b" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Apps online" right={`${(data.apps ?? []).filter((a) => a.status === 'online').length} of ${(data.apps ?? []).length} now`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={tickFmt} {...axis} />
              <YAxis allowDecimals={false} domain={[0, (max: number) => Math.max(max, 1)]} {...axis} />
              <Tooltip labelFormatter={labelFmt} />
              <Area type="stepAfter" dataKey="appsUp" name="Apps up" stroke="#16a34a" fill="#16a34a" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-3 overflow-x-auto">
          <h4 className="mb-2 text-sm font-medium">PM2 apps</h4>
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr className="text-left">
                <th className="py-1 pr-2 font-medium">App</th><th className="pr-2 font-medium">Status</th>
                <th className="pr-2 font-medium">Uptime</th><th className="pr-2 font-medium">Restarts</th>
                <th className="pr-2 font-medium">Memory</th><th className="font-medium">CPU</th>
              </tr>
            </thead>
            <tbody>
              {(data.apps ?? []).map((a) => (
                <tr key={a.name} className="border-t border-border">
                  <td className="py-1.5 pr-2 font-medium">{a.name}</td>
                  <td className="pr-2"><span className={`rounded px-1.5 py-0.5 ${appTone(a)}`}>{a.status}</span></td>
                  <td className="pr-2">{fmtUptime(a.uptimeSeconds)}</td>
                  <td className="pr-2">{a.restarts ?? 0}</td>
                  <td className="pr-2">{a.memoryMb ?? 0} MB</td>
                  <td>{(a.cpuPercent ?? 0).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border p-3 text-xs space-y-3">
          <div>
            <h4 className="mb-1.5 text-sm font-medium">Health checks</h4>
            <div className="space-y-1">
              {(data.services ?? []).map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.up ? 'bg-green-500' : 'bg-red-500'}`} /> {s.name} <span className="text-muted-foreground">:{s.port}</span>
                  </span>
                  <span className="text-muted-foreground">{s.up ? `${s.responseMs ?? 0} ms` : 'DOWN'}</span>
                </div>
              ))}
              {(data.services ?? []).length === 0 && <div className="text-muted-foreground">No probes configured.</div>}
            </div>
          </div>
          <div>
            <h4 className="mb-1.5 text-sm font-medium">SSL certificates</h4>
            <div className="space-y-1">
              {certs.map((c) => (
                <div key={c.domain} className="flex items-center justify-between">
                  <span>{c.domain}</span>
                  <span className={c.daysLeft != null && c.daysLeft < 14 ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                    {c.daysLeft != null ? `${c.daysLeft} days left` : 'checking…'}
                  </span>
                </div>
              ))}
              {certs.length === 0 && <div className="text-muted-foreground">Checked once an hour.</div>}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2 text-muted-foreground">
            <span>Backup: {data.backup?.latestAt ? `${data.backup.ageHours}h ago` : 'unknown'}</span>
            <span>Failed services: {data.failedUnits ?? '—'}</span>
            <span>Incidents (24h): {data.incidentsLast24h ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <h4 className="mb-2 text-sm font-medium">VPS incidents (last 7 days)</h4>
        {incidents.length === 0 ? (
          <p className="text-xs text-muted-foreground">No VPS incidents. Everything has been within limits.</p>
        ) : (
          <div className="space-y-1.5">
            {incidents.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded px-1.5 py-0.5 font-medium ${i.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                  {i.severity === 'CRITICAL' ? 'Critical' : 'Warning'}
                </span>
                <span className="font-medium">{i.message}</span>
                <span className="text-muted-foreground">
                  {fmtWhen(i.startedAt)} → {i.open ? 'still open' : fmtWhen(i.resolvedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export type { VpsHealth };
