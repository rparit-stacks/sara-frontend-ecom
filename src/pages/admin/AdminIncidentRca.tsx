import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Brain, ChevronDown, ChevronUp, FileSearch, Loader2, Sparkles, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { LogsTabs } from '@/components/admin/LogsTabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { logsApi, type IncidentRca } from '@/lib/api';

const SERVICES: Record<string, string> = {
  'sara-backend': 'Backend',
  notification: 'Notification service',
  whatsapp: 'WhatsApp service',
  storage: 'Cloud storage',
};

const TRIGGERS: Record<string, string> = {
  API_INCIDENT: 'API incident',
  VPS_INCIDENT: 'VPS incident',
  REPEATING_ERROR: 'Repeating error',
  STARTUP_CRASH: 'Restart after a crash',
  MANUAL: 'Manual',
};

const sevTone = (s?: string | null) =>
  s === 'CRITICAL' ? 'bg-red-100 text-red-700 border-red-200'
    : s === 'HIGH' ? 'bg-orange-100 text-orange-700 border-orange-200'
      : s === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-slate-100 text-slate-600 border-slate-200';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const kb = (n?: number | null) => (n == null ? '—' : n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);

const Section = ({ icon: Icon, title, children }: { icon: typeof Brain; title: string; children: React.ReactNode }) => (
  <div>
    <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {title}
    </div>
    <div className="text-sm leading-relaxed">{children}</div>
  </div>
);

const RcaCard = ({ r }: { r: IncidentRca }) => {
  const [showBundle, setShowBundle] = useState(false);
  const { data: full, isLoading } = useQuery({
    queryKey: ['rca', r.id],
    queryFn: () => logsApi.getRca(r.id),
    enabled: showBundle,
  });
  const evidence = (r.evidence ?? '').split('\n').filter(Boolean);

  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">{r.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="rounded-full border px-2 py-0.5 font-medium">{TRIGGERS[r.triggerKind] ?? r.triggerKind}</span>
            <span className="rounded-full bg-muted px-2 py-0.5">{SERVICES[r.service] ?? r.service}</span>
            {r.severity && <span className={`rounded-full border px-2 py-0.5 font-medium ${sevTone(r.severity)}`}>{r.severity}</span>}
            {r.confidence && <span className="text-muted-foreground">confidence {r.confidence.toLowerCase()}</span>}
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>{fmt(r.createdAt)}</div>
          <div>logs {fmtTime(r.windowFrom)}–{fmtTime(r.windowTo)}</div>
        </div>
      </div>

      {r.summary && (
        <div className="rounded-md bg-muted/60 px-3 py-2 text-sm">
          <span className="font-medium">{r.errorCount > 0 ? `${r.errorCount} error record${r.errorCount > 1 ? 's' : ''}, ${r.distinctErrors} kind${r.distinctErrors > 1 ? 's' : ''}: ` : ''}</span>
          {r.summary}
        </div>
      )}

      {r.status === 'AI_FAILED' && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4" /> {r.rootCause || 'The AI could not analyse this one. The grouped log evidence below is still real.'}
        </div>
      )}
      {r.status === 'NO_EVIDENCE' && (
        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">{r.rootCause}</div>
      )}

      {r.status === 'DONE' && (
        <div className="grid gap-3 md:grid-cols-2">
          <Section icon={Brain} title="Root cause">{r.rootCause}</Section>
          <Section icon={Wrench} title="Suggested fix">{r.suggestedFix}</Section>
          {evidence.length > 0 && (
            <Section icon={FileSearch} title="Evidence from the logs">
              <ul className="list-disc space-y-0.5 pl-4">{evidence.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </Section>
          )}
          {r.affected && <Section icon={AlertTriangle} title="Affected">{r.affected}</Section>}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
        <span>
          The AI was given {r.bundleChars != null ? `${r.bundleChars.toLocaleString()} characters` : 'a small bundle'}
          {' '}(read {kb(r.logBytesRead)} of log to build it)
          {r.model ? ` · ${r.model}` : ''}
          {r.tokensIn != null ? ` · ${r.tokensIn.toLocaleString()} tokens in, ${(r.tokensOut ?? 0).toLocaleString()} out` : ''}
        </span>
        {r.bundleChars != null && (
          <button className="inline-flex items-center gap-1 text-primary hover:underline" onClick={() => setShowBundle((v) => !v)}>
            {showBundle ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} {showBundle ? 'Hide' : 'Show'} exactly what the AI read
          </button>
        )}
      </div>
      {showBundle && (
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
          {isLoading ? 'Loading…' : full?.bundle || 'Not stored.'}
        </pre>
      )}
    </div>
  );
};

const AdminIncidentRca = () => {
  const { isMainAdmin } = useAdminPermissions();
  const queryClient = useQueryClient();
  const [days, setDays] = useState('14');
  const [service, setService] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [analyzeService, setAnalyzeService] = useState('sara-backend');
  const [minutes, setMinutes] = useState('15');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['incident-rca', days],
    queryFn: () => logsApi.getRcaList(Number(days)),
    refetchInterval: 30_000,
  });

  const analyze = useMutation({
    mutationFn: () => logsApi.analyzeRca(analyzeService, Number(minutes)),
    onSuccess: () => {
      toast.success('Analysis added');
      queryClient.invalidateQueries({ queryKey: ['incident-rca'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not analyse'),
  });

  const rows = useMemo(
    () => (data ?? []).filter((r) => (service === 'all' || r.service === service) && (severity === 'all' || r.severity === severity)),
    [data, service, severity],
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <LogsTabs />

        <div>
          <h1 className="font-semibold text-4xl lg:text-5xl mb-2">Incident <span className="text-primary">RCA</span></h1>
          <p className="max-w-3xl text-muted-foreground">
            When an incident opens, or the same error keeps repeating, the system reads only the few minutes of real server log
            around it, merges identical failures, removes secrets, and asks the AI for the root cause. Each analysis below shows
            exactly how little the AI was given.
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24h</SelectItem><SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Service" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {Object.entries(SERVICES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isMainAdmin && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white p-2">
              <span className="px-1 text-xs text-muted-foreground">Analyse now:</span>
              <Select value={analyzeService} onValueChange={setAnalyzeService}>
                <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SERVICES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={minutes} onValueChange={setMinutes}>
                <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">last 5 min</SelectItem><SelectItem value="15">last 15 min</SelectItem>
                  <SelectItem value="30">last 30 min</SelectItem><SelectItem value="60">last 60 min</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="gap-1.5" disabled={analyze.isPending} onClick={() => analyze.mutate()}>
                {analyze.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyse
              </Button>
            </div>
          )}
        </div>

        {isLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}
        {isError && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">Could not load analyses: {(error as Error)?.message}</div>}

        {!isLoading && !isError && rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <Brain className="mx-auto mb-2 h-8 w-8" />
            <p className="font-medium">No analyses yet.</p>
            <p className="text-sm">One is created automatically when an incident opens, when the same error repeats 10+ times, or after a restart that followed a crash.</p>
          </div>
        )}

        <div className="space-y-4">{rows.map((r) => <RcaCard key={r.id} r={r} />)}</div>
      </div>
    </AdminLayout>
  );
};

export default AdminIncidentRca;
