import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { whatsappCloudApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/admin-sara/whatsapp', label: 'Overview', end: true },
  { to: '/admin-sara/whatsapp/messages', label: 'Messages' },
  { to: '/admin-sara/whatsapp/broadcasts', label: 'Broadcasts' },
  { to: '/admin-sara/whatsapp/templates', label: 'Templates' },
  { to: '/admin-sara/whatsapp/send', label: 'Send message' },
  { to: '/admin-sara/whatsapp/pricing', label: 'Pricing' },
];

/** The frame of every WhatsApp page: a title, the connection status, and tabs across the top so the page gets the full width. */
export const WhatsAppLayout = ({
  title, subtitle, actions, children,
}: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) => {
  const health = useQuery({ queryKey: ['waCloudHealth'], queryFn: () => whatsappCloudApi.listMessages({ size: 1 }), refetchInterval: 60_000, retry: false });
  const online = health.isSuccess;
  const message = (health.error as { message?: string } | null)?.message;

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-sans text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <span className={cn('inline-flex items-center gap-2 text-xs', online ? 'text-emerald-700' : health.isLoading ? 'text-muted-foreground' : 'text-red-700')}>
              <span className={cn('h-2 w-2 rounded-full', online ? 'bg-emerald-500' : health.isLoading ? 'bg-slate-400' : 'bg-red-500')} />
              {online ? 'Connected to WhatsApp' : health.isLoading ? 'Checking…' : 'Not connected'}
            </span>
          </div>
        </div>

        <nav className="mt-5 flex gap-1 overflow-x-auto border-b" aria-label="WhatsApp sections">
          {NAV.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => cn('-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm transition', isActive ? 'border-primary font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {label}
            </NavLink>
          ))}
        </nav>

        {health.isError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {message || 'The WhatsApp service is not reachable.'} Check that it is running and that the service URL and API key are set in Runtime Config.
          </div>
        )}

        <div className="mt-6 min-w-0">{children}</div>
      </div>
    </AdminLayout>
  );
};
