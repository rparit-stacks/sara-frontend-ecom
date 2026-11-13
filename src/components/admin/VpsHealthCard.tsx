import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { logsApi } from '@/lib/api';
import { barTone, fmtUptime, vpsStatusTone } from '@/components/admin/VpsHealthPanel';

const Row = ({ label, value, pct, warn, critical }: { label: string; value: string; pct?: number; warn: number; critical: number }) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
    {pct !== undefined && (
      <div className="h-2 w-full rounded-full bg-muted">
        <div className={`h-2 rounded-full transition-all ${barTone(pct, warn, critical)}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    )}
  </div>
);

/** Real system health for the admin dashboard: live VPS numbers, a 6-hour RAM/CPU trend and API health. */
export const VpsHealthCard = () => {
  const { data: vps, isLoading } = useQuery({
    queryKey: ['vps-health'],
    queryFn: () => logsApi.getVpsHealth(),
    refetchInterval: 60_000,
    retry: false,
  });
  const { data: hist } = useQuery({
    queryKey: ['vps-health-history', 6],
    queryFn: () => logsApi.getVpsHistory(6),
    refetchInterval: 60_000,
    retry: false,
  });
  // API response time / error rate need the logs permission; hide those rows when the admin lacks it.
  const { data: api } = useQuery({
    queryKey: ['system-health-brief', 1],
    queryFn: () => logsApi.getHealthBrief(1),
    refetchInterval: 60_000,
    retry: false,
  });

  const tone = vpsStatusTone(vps?.status);
  const apps = vps?.apps ?? [];
  const up = apps.filter((a) => a.status === 'online').length;
  const points = (hist?.points ?? []).map((p) => ({ ts: new Date(p.t).getTime(), ram: p.ram, cpu: p.cpu }));

  return (
    <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-cursive text-2xl font-bold">System Health</h2>
        {vps?.available && (
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone.pill}`}>
            <span className={`h-2 w-2 rounded-full ${tone.dot}`} /> {tone.label}
          </span>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && (!vps || !vps.available) && (
        <p className="text-sm text-muted-foreground">{vps?.message || 'VPS health is not available right now.'}</p>
      )}

      {vps?.available && (
        <div className="space-y-4">
          <Row label="CPU" value={vps.cpuPercent != null ? `${Math.round(vps.cpuPercent)}%` : '—'} pct={vps.cpuPercent ?? undefined} warn={vps.thresholds?.cpuWarn ?? 85} critical={95} />
          <Row label="RAM" value={`${Math.round(vps.ram?.usedPercent ?? 0)}% · ${((vps.ram?.availableMb ?? 0) / 1024).toFixed(1)} GB free`} pct={vps.ram?.usedPercent} warn={vps.thresholds?.ramWarn ?? 85} critical={vps.thresholds?.ramCritical ?? 95} />
          <Row label="Storage" value={`${Math.round(vps.disk?.usedPercent ?? 0)}% · ${Math.round(vps.disk?.freeGb ?? 0)} GB free`} pct={vps.disk?.usedPercent} warn={vps.thresholds?.diskWarn ?? 80} critical={vps.thresholds?.diskCritical ?? 90} />

          {points.length > 1 && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>RAM & CPU, last 6 hours</span>
                <span>peak RAM {Math.round(hist?.peakRamPercent ?? 0)}%</span>
              </div>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      labelFormatter={(ts: number) => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      formatter={(v: number, n: string) => [`${v}%`, n]}
                    />
                    <Area type="monotone" dataKey="ram" name="RAM" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={1.5} />
                    <Area type="monotone" dataKey="cpu" name="CPU" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {api && (
            <>
              <Row label="API response time" value={`${Math.round(api.avgResponseMs)} ms avg`} pct={Math.min(100, (api.avgResponseMs / 1000) * 100)} warn={50} critical={80} />
              <Row label="API error rate" value={`${api.serverErrorRatePercent}%`} pct={Math.min(100, api.serverErrorRatePercent * 10)} warn={10} critical={50} />
            </>
          )}

          <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
            <div>
              <div className={`text-lg font-semibold ${up === apps.length ? 'text-green-600' : 'text-red-600'}`}>{up}/{apps.length}</div>
              <div className="text-[11px] text-muted-foreground">apps online</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{fmtUptime(vps.uptimeSeconds)}</div>
              <div className="text-[11px] text-muted-foreground">uptime</div>
            </div>
            <div>
              <div className={`text-lg font-semibold ${(vps.activeIncidents?.length ?? 0) > 0 ? 'text-red-600' : ''}`}>{vps.activeIncidents?.length ?? 0}</div>
              <div className="text-[11px] text-muted-foreground">open incidents</div>
            </div>
          </div>

          {vps.reasons && vps.reasons.length > 0 && (
            <div className="rounded-md bg-orange-50 p-2 text-xs text-orange-800">{vps.reasons.join(' · ')}</div>
          )}
          <div className="text-right text-xs">
            <Link to="/admin/logs" className="text-primary hover:underline">Full details in Logs →</Link>
          </div>
        </div>
      )}
    </div>
  );
};
