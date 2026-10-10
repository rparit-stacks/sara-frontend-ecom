import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, AlertTriangle, Gauge, Loader2, Settings2, Timer, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logsApi } from '@/lib/api';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { HealthAlertRecipients } from '@/components/admin/HealthAlertRecipients';

const WINDOWS = [
  { value: '1', label: 'Last 1h' },
  { value: '6', label: 'Last 6h' },
  { value: '24', label: 'Last 24h' },
  { value: '168', label: 'Last 7d' },
];

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const healthTone = (pct: number) =>
  pct >= 99
    ? { bar: 'bg-green-500', text: 'text-green-700', label: 'Healthy' }
    : pct >= 95
      ? { bar: 'bg-orange-500', text: 'text-orange-700', label: 'Degraded' }
      : { bar: 'bg-red-500', text: 'text-red-700', label: 'Unhealthy' };

export const SystemHealthPanel = () => {
  const { isMainAdmin } = useAdminPermissions();
  const queryClient = useQueryClient();
  const [windowHours, setWindowHours] = useState('24');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['system-health-brief', windowHours],
    queryFn: () => logsApi.getHealthBrief(Number(windowHours)),
    refetchInterval: 60_000,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['system-job-health', windowHours],
    queryFn: () => logsApi.getJobHealth(Number(windowHours)),
    refetchInterval: 60_000,
  });

  const { data: ingest, isLoading: ingestLoading } = useQuery({
    queryKey: ['api-log-ingest-settings'],
    queryFn: () => logsApi.getLogIngestSettings(),
    enabled: isMainAdmin,
  });

  const [samplePct, setSamplePct] = useState('1');
  const [slowMs, setSlowMs] = useState('2000');

  useEffect(() => {
    if (!ingest) return;
    setSamplePct(String(Math.round((ingest.successSampleRate ?? 0.01) * 10000) / 100));
    setSlowMs(String(ingest.slowThresholdMs ?? 2000));
  }, [ingest]);

  const saveIngest = useMutation({
    mutationFn: () => {
      const pct = Number(samplePct);
      const ms = Number(slowMs);
      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
        throw new Error('Sample rate must be 0–100%');
      }
      if (Number.isNaN(ms) || ms < 100) {
        throw new Error('Slow threshold must be ≥ 100 ms');
      }
      return logsApi.updateLogIngestSettings({
        successSampleRate: pct / 100,
        slowThresholdMs: Math.round(ms),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-log-ingest-settings'] });
      toast.success('Log sampling updated (applies within ~15s, no restart)');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to save'),
  });

  if (isError) return null;

  const tone = data ? healthTone(data.healthPercent) : null;
  const nd = jobs?.notificationDelivery;

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> System Health
        </h2>
        <Select value={windowHours} onValueChange={setWindowHours}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WINDOWS.map((w) => (
              <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading || !data || !tone ? (
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Gauge className="w-3.5 h-3.5" /> Health</div>
              <div className={`text-2xl font-bold ${tone.text}`}>{data.healthPercent}%</div>
              <div className="h-1.5 mt-1 rounded bg-muted overflow-hidden">
                <div className={`h-full ${tone.bar}`} style={{ width: `${data.healthPercent}%` }} />
              </div>
              <div className={`text-xs mt-1 ${tone.text}`}>{tone.label}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Requests / min</div>
              <div className="text-2xl font-bold">{data.requestsPerMinute}</div>
              <div className="text-xs text-muted-foreground">{data.totalRequests.toLocaleString()} total</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">5xx rate</div>
              <div className={`text-2xl font-bold ${data.serverErrorCount > 0 ? 'text-red-700' : ''}`}>
                {data.serverErrorRatePercent}%
              </div>
              <div className="text-xs text-muted-foreground">{data.serverErrorCount.toLocaleString()} server errors</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Timer className="w-3.5 h-3.5" /> Avg latency</div>
              <div className="text-2xl font-bold">{Math.round(data.avgResponseMs)} ms</div>
              <div className="text-xs text-muted-foreground">
                max {data.maxResponseMs.toLocaleString()} ms · {data.slowRatePercent}% slow
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Incidents ({data.incidentCount})
              </div>
              {data.incidents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No incidents in this window.</p>
              ) : (
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {data.incidents.slice().reverse().map((i, idx) => (
                    <li key={idx} className="text-sm flex justify-between rounded bg-red-50 px-2 py-1">
                      <span>{fmtTime(i.from)} → {fmtTime(i.to)}</span>
                      <span className="text-red-700 font-medium">{i.serverErrors} 5xx</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Top failing APIs</div>
              {data.topFailingEndpoints.length === 0 ? (
                <p className="text-sm text-muted-foreground">No failing endpoints.</p>
              ) : (
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {data.topFailingEndpoints.map((e) => (
                    <li key={`${e.method} ${e.endpoint}`} className="text-sm rounded border px-2 py-1" title={e.sampleError}>
                      <div className="flex justify-between gap-2">
                        <span className="truncate font-mono text-xs">{e.method} {e.endpoint}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {e.failures} fail{e.serverErrors > 0 && <span className="text-red-700"> · {e.serverErrors} 5xx</span>}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {/* Job health — async / queue, not HTTP */}
      <div className="rounded-lg border border-border p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Job health</h3>
            <p className="text-xs text-muted-foreground">
              Email / WhatsApp / AI / push failures outside HTTP request logs.
            </p>
          </div>
        </div>
        {jobsLoading || !jobs ? (
          <div className="h-16 animate-pulse rounded bg-muted" />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded border px-2 py-1.5">
                <div className="text-[11px] text-muted-foreground">Local async fails</div>
                <div className={`text-lg font-semibold ${jobs.localFailureCount > 0 ? 'text-red-700' : ''}`}>
                  {jobs.localFailureCount}
                </div>
              </div>
              {Object.entries(jobs.failuresByType || {}).map(([type, n]) => (
                <div key={type} className="rounded border px-2 py-1.5">
                  <div className="text-[11px] text-muted-foreground">{type}</div>
                  <div className="text-lg font-semibold">{n}</div>
                </div>
              ))}
              {nd && (
                <div className="rounded border px-2 py-1.5 col-span-2 sm:col-span-2">
                  <div className="text-[11px] text-muted-foreground">Notification delivery</div>
                  {nd.available ? (
                    <div className="text-sm">
                      <span className="font-semibold text-green-700">{nd.successCount}</span> ok
                      {' · '}
                      <span className={`font-semibold ${nd.failedCount > 0 ? 'text-red-700' : ''}`}>
                        {nd.failedCount}
                      </span>{' '}
                      failed
                      {nd.failedByChannel && Object.keys(nd.failedByChannel).length > 0 && (
                        <span className="text-xs text-muted-foreground block mt-0.5">
                          {Object.entries(nd.failedByChannel)
                            .map(([c, n]) => `${c}: ${n}`)
                            .join(' · ')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Service unreachable{nd.error ? `: ${nd.error}` : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
            {jobs.recentFailures.length > 0 && (
              <ul className="max-h-36 overflow-y-auto divide-y border rounded">
                {jobs.recentFailures.map((f) => (
                  <li key={f.id} className="px-2 py-1.5 text-xs flex gap-2">
                    <span className="text-muted-foreground shrink-0 w-24">
                      {f.createdAt ? fmtTime(f.createdAt) : '—'}
                    </span>
                    <span className="font-medium shrink-0 w-16">{f.jobType}</span>
                    <span className="truncate text-muted-foreground" title={f.message}>
                      {f.message || f.source}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {isMainAdmin && (
        <div className="rounded-lg border border-border p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold">Log sampling</h3>
              <p className="text-xs text-muted-foreground">
                Success sample rate + slow threshold — live, no restart.
              </p>
            </div>
          </div>
          {ingestLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <Label className="text-xs">Success sample %</Label>
                <Input
                  className="mt-1 h-9"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={samplePct}
                  onChange={(e) => setSamplePct(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Slow threshold (ms)</Label>
                <Input
                  className="mt-1 h-9"
                  type="number"
                  min={100}
                  step={100}
                  value={slowMs}
                  onChange={(e) => setSlowMs(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="h-9"
                disabled={saveIngest.isPending}
                onClick={() => saveIngest.mutate()}
              >
                {saveIngest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          )}
          {ingest?.updatedBy && (
            <p className="text-[11px] text-muted-foreground">
              Last set by {ingest.updatedBy}
              {ingest.updatedAt ? ` · ${fmtTime(ingest.updatedAt)}` : ''}
            </p>
          )}
        </div>
      )}

      {isMainAdmin && <HealthAlertRecipients />}
    </div>
  );
};
