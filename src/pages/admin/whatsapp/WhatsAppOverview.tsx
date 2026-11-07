import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, CheckCheck, FileText, Inbox, Megaphone, Send, XCircle } from 'lucide-react';
import { WhatsAppLayout } from '@/components/admin/whatsapp-cloud/WhatsAppLayout';
import { MessageStatusBadge, TemplateStatusBadge, BroadcastStatusBadge, failureHint, formatPhone, timeAgo } from '@/components/admin/whatsapp-cloud/shared';
import { whatsappCloudApi } from '@/lib/api';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';
import { cn } from '@/lib/utils';

const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };

const useCount = (key: string, status?: string, from?: string) =>
  useQuery({ queryKey: ['waCloudCount', key], queryFn: () => whatsappCloudApi.listMessages({ size: 1, status, from }), refetchInterval: 30_000, retry: false });

const Stat = ({ label, value, hint, icon: Icon, tone, to }: { label: string; value?: number; hint: string; icon: typeof Send; tone: string; to: string }) => (
  <Link to={to} className="rounded-2xl border bg-background p-4 transition hover:border-primary/50 hover:shadow-sm">
    <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className={cn('h-4 w-4', tone)} /></div>
    <p className="mt-2 text-3xl font-semibold tabular-nums">{value ?? '—'}</p>
    <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
  </Link>
);

const WhatsAppOverview = () => {
  const { hasAny } = useAdminPermissions();
  const canEdit = hasAny(P.WHATSAPP_UPDATE_TEMPLATES);
  const from = todayStart();
  const total = useCount('total', undefined, from);
  const delivered = useCount('delivered', 'DELIVERED', from);
  const read = useCount('read', 'READ', from);
  const failed = useCount('failed', 'FAILED', from);
  const queued = useCount('queued', 'QUEUED');
  const sending = useCount('sending', 'SENDING');
  const recent = useQuery({ queryKey: ['waCloudRecent'], queryFn: () => whatsappCloudApi.listMessages({ size: 6 }), refetchInterval: 30_000, retry: false });
  const failedRecent = useQuery({ queryKey: ['waCloudFailedRecent'], queryFn: () => whatsappCloudApi.listMessages({ size: 4, status: 'FAILED' }), refetchInterval: 60_000, retry: false });
  const templates = useQuery({ queryKey: ['waCloudTemplates'], queryFn: whatsappCloudApi.listTemplates, retry: false });
  const broadcasts = useQuery({ queryKey: ['waCloudBroadcasts', 'overview'], queryFn: () => whatsappCloudApi.listBroadcasts(0, 50), retry: false });

  const gotThere = (delivered.data?.totalElements ?? 0) + (read.data?.totalElements ?? 0);
  const inQueue = (queued.data?.totalElements ?? 0) + (sending.data?.totalElements ?? 0);
  const active = (broadcasts.data?.content ?? []).filter((b) => ['RUNNING', 'PAUSED', 'SCHEDULED'].includes(b.status)).slice(0, 4);
  const attention = (templates.data ?? []).filter((t) => ['REJECTED', 'PAUSED', 'DISABLED'].includes(t.status));
  const inReview = (templates.data ?? []).filter((t) => t.status === 'PENDING');

  return (
    <WhatsAppLayout title="Overview" subtitle="What is happening with your WhatsApp messages today, and what needs your attention.">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Sent today" value={total.data?.totalElements} hint="All messages created today" icon={Send} tone="text-sky-600" to="/admin-sara/whatsapp/messages" />
          <Stat label="Reached customers" value={total.data ? gotThere : undefined} hint="Delivered or read today" icon={CheckCheck} tone="text-emerald-600" to="/admin-sara/whatsapp/messages" />
          <Stat label="Failed today" value={failed.data?.totalElements} hint="Open Messages to see why" icon={XCircle} tone="text-red-600" to="/admin-sara/whatsapp/messages" />
          <Stat label="Waiting to go" value={queued.data && sending.data ? inQueue : undefined} hint="Queued or being sent now" icon={Inbox} tone="text-amber-600" to="/admin-sara/whatsapp/messages" />
        </div>

        {canEdit && (
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['/admin-sara/whatsapp/send', Send, 'Send a message', 'Pick a customer and a template, and send it now.'],
              ['/admin-sara/whatsapp/broadcasts/new', Megaphone, 'Start a broadcast', 'Send one template to many customers, with a test first.'],
              ['/admin-sara/whatsapp/templates/new', FileText, 'Create a template', 'Write a new message and send it to WhatsApp for review.'],
            ].map(([to, Icon, t, d]) => {
              const I = Icon as typeof Send;
              return (
                <Link key={to as string} to={to as string} className="group flex items-start gap-3 rounded-2xl border bg-background p-4 transition hover:border-primary/50 hover:shadow-sm">
                  <span className="rounded-xl bg-primary/10 p-2.5 text-primary"><I className="h-5 w-5" /></span>
                  <span className="flex-1"><span className="block font-semibold">{t as string}</span><span className="block text-sm text-muted-foreground">{d as string}</span></span>
                  <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3"><h2 className="font-semibold">Latest messages</h2><Link to="/admin-sara/whatsapp/messages" className="text-sm text-primary hover:underline">See all</Link></div>
            <ul className="divide-y">
              {(recent.data?.content ?? []).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0"><p className="font-medium">{formatPhone(m.to)}</p><p className="truncate text-xs text-muted-foreground"><code>{m.templateKey}</code> · {timeAgo(m.createdAt)}</p></div>
                  <MessageStatusBadge status={m.status} />
                </li>
              ))}
              {(recent.data?.content.length ?? 0) === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">{recent.isLoading ? 'Loading…' : 'No messages yet.'}</li>}
            </ul>
          </section>

          <section className="rounded-2xl border bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3"><h2 className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-amber-600" /> Needs attention</h2></div>
            <div className="space-y-4 p-4 text-sm">
              {(failedRecent.data?.content ?? []).length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent failures</p>
                  <ul className="space-y-1">{failedRecent.data!.content.map((m) => (
                    <li key={m.id} className="flex justify-between gap-3"><span>{formatPhone(m.to)} · <code className="text-xs">{m.templateKey}</code></span><span className="truncate text-xs text-red-600">{failureHint(m.errorCode, m.errorMessage, m.skipReason)}</span></li>
                  ))}</ul>
                </div>
              )}
              {attention.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Templates with a problem</p>
                  <ul className="space-y-1">{attention.slice(0, 5).map((t) => <li key={t.id} className="flex items-center justify-between"><code className="text-xs">{t.key}</code><TemplateStatusBadge status={t.status} /></li>)}</ul>
                </div>
              )}
              {inReview.length > 0 && <p className="text-muted-foreground">{inReview.length} template{inReview.length === 1 ? ' is' : 's are'} still in review at WhatsApp.</p>}
              {active.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Broadcasts in progress</p>
                  <ul className="space-y-1">{active.map((b) => <li key={b.id} className="flex items-center justify-between"><Link to={`/admin-sara/whatsapp/broadcasts/${b.id}`} className="hover:underline">{b.name}</Link><BroadcastStatusBadge status={b.status} /></li>)}</ul>
                </div>
              )}
              {!(failedRecent.data?.content.length) && !attention.length && !inReview.length && !active.length && <p className="py-4 text-center text-muted-foreground">Nothing needs attention right now.</p>}
            </div>
          </section>
        </div>
      </div>
    </WhatsAppLayout>
  );
};

export default WhatsAppOverview;
