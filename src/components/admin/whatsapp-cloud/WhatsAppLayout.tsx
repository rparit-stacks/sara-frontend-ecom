import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, LayoutDashboard, Megaphone, MessageCircle, MessagesSquare, Send } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { whatsappCloudApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/admin-sara/whatsapp', label: 'Overview', icon: LayoutDashboard, end: true, hint: 'What is happening' },
  { to: '/admin-sara/whatsapp/send', label: 'Send message', icon: Send, hint: 'To one customer' },
  { to: '/admin-sara/whatsapp/messages', label: 'Messages', icon: MessagesSquare, hint: 'Everything sent' },
  { to: '/admin-sara/whatsapp/broadcasts', label: 'Broadcasts', icon: Megaphone, hint: 'To many customers' },
  { to: '/admin-sara/whatsapp/templates', label: 'Templates', icon: FileText, hint: 'The messages you can send' },
];

/** The frame every WhatsApp page sits in: a title, the connection status and the side menu. */
export const WhatsAppLayout = ({
  title, subtitle, actions, children,
}: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) => {
  const health = useQuery({ queryKey: ['waCloudHealth'], queryFn: () => whatsappCloudApi.listMessages({ size: 1 }), refetchInterval: 60_000, retry: false });
  const online = health.isSuccess;
  const message = (health.error as { message?: string } | null)?.message;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><MessageCircle className="h-4 w-4" /> WhatsApp</p>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <div className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium', online ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : health.isLoading ? 'bg-muted text-muted-foreground' : 'border-red-200 bg-red-50 text-red-800')}>
              <span className={cn('h-2 w-2 rounded-full', online ? 'bg-emerald-500' : health.isLoading ? 'bg-slate-400' : 'bg-red-500')} />
              {online ? 'Connected' : health.isLoading ? 'Checking…' : 'Not connected'}
            </div>
          </div>
        </div>

        {health.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {message || 'The WhatsApp service is not reachable.'} Check that it is running and that the service URL and API key are set in Runtime Config.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[210px_1fr]">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="WhatsApp sections">
            {NAV.map(({ to, label, icon: Icon, end, hint }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => cn('flex min-w-[150px] items-center gap-3 rounded-xl border px-3 py-2.5 transition lg:min-w-0', isActive ? 'border-primary bg-primary/5 text-foreground' : 'border-transparent text-muted-foreground hover:bg-muted/60')}>
                <Icon className="h-4 w-4 shrink-0" />
                <span><span className="block text-sm font-medium leading-tight">{label}</span><span className="hidden text-[11px] lg:block">{hint}</span></span>
              </NavLink>
            ))}
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </AdminLayout>
  );
};
