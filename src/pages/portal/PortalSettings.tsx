import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import PortalShell from '@/components/portal/PortalShell';
import SettingsNav, { SettingsNavMobile } from '@/components/portal/SettingsNav';
import { Sym } from '@/components/portal/Sym';
import { clientNotificationSettingsApi, type GlobalNotificationPreferenceDto } from '@/lib/api';

const Toggle = ({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="w-11 h-6 rounded-full relative transition-colors shrink-0 disabled:opacity-50"
    style={{ background: on ? 'var(--p-primary)' : 'var(--p-outline-variant)' }}
  >
    <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: on ? 'translateX(20px)' : 'none' }} />
  </button>
);

/** A settings card — icon header + body. Matches the pattern used on the admin Settings page. */
function SettingsCard({ icon, title, description, children }: { icon: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-xl overflow-hidden flex flex-col" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
      <div className="px-5 py-4 flex items-start gap-3 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(0,103,106,0.1)', color: 'var(--p-primary)' }}>
          <Sym name={icon} className="text-[18px]" />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-[14px]">{title}</h4>
          {description && <p className="text-[12px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>{description}</p>}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

/** Real, account-level notification preferences — registry-driven from the backend
 *  (same ProjectNotificationEvents list the admin's own Settings screen renders), but this
 *  is the CLIENT'S OWN per-account toggle: turning one off here affects only this client,
 *  never anyone else. Replaces the old localStorage-only mock (six hardcoded, never-synced
 *  keys with zero server connection). */
function NotificationEventSettings() {
  const queryClient = useQueryClient();
  const { data: prefs, isLoading } = useQuery({
    queryKey: ['client-own-notification-preferences'],
    queryFn: () => clientNotificationSettingsApi.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ eventKey, enabled }: { eventKey: string; enabled: boolean }) =>
      clientNotificationSettingsApi.setPreference(eventKey, enabled),
    onMutate: async ({ eventKey, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['client-own-notification-preferences'] });
      const previous = queryClient.getQueryData<GlobalNotificationPreferenceDto[]>(['client-own-notification-preferences']);
      queryClient.setQueryData<GlobalNotificationPreferenceDto[]>(['client-own-notification-preferences'], (old) =>
        old?.map((p) => (p.eventKey === eventKey ? { ...p, enabled } : p)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['client-own-notification-preferences'], ctx.previous);
      toast.error('Could not update notification setting');
    },
    onSuccess: () => toast.success('Saved'),
  });

  return (
    <SettingsCard icon="notifications_active" title="Notifications" description="Choose what you get notified about. These only affect your own account.">
      {isLoading ? (
        <p className="px-5 py-4 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>Loading…</p>
      ) : !prefs || prefs.length === 0 ? (
        <p className="px-5 py-4 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>No notification events configured yet.</p>
      ) : (
        prefs.map((ev, i) => (
          <div
            key={ev.eventKey}
            className="px-5 py-4 flex items-center justify-between gap-3"
            style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}
          >
            <div className="min-w-0">
              <p className="font-semibold text-[14px]">{ev.label}</p>
              <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{ev.description}</p>
            </div>
            <Toggle
              on={ev.enabled}
              disabled={toggleMutation.isPending}
              onClick={() => toggleMutation.mutate({ eventKey: ev.eventKey, enabled: !ev.enabled })}
            />
          </div>
        ))
      )}
    </SettingsCard>
  );
}

export default function PortalSettings() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authEmail');
    navigate('/login', { replace: true });
  };

  return (
    <PortalShell active="more">
      <SettingsNav active="settings" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <SettingsNavMobile active="settings" />
        <div className="h-14 px-4 sm:px-8 flex items-center border-b shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <h2 className="font-display text-[18px]">Notification settings</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start max-w-6xl">
            <NotificationEventSettings />

            <SettingsCard icon="account_circle" title="Account">
              <button onClick={() => navigate('/dashboard')} className="w-full px-5 py-4 flex items-center justify-between hover:bg-black/[0.02]">
                <span className="flex items-center gap-3 text-[14px]"><Sym name="storefront" style={{ color: 'var(--p-on-surface-variant)' }} /> Back to Studio Sara store</span>
                <Sym name="chevron_right" style={{ color: 'var(--p-on-surface-variant)' }} />
              </button>
              <button onClick={() => navigate('/')} className="w-full px-5 py-4 flex items-center justify-between hover:bg-black/[0.02]" style={{ borderTop: '1px solid var(--p-outline-variant)' }}>
                <span className="flex items-center gap-3 text-[14px]"><Sym name="language" style={{ color: 'var(--p-on-surface-variant)' }} /> View public website</span>
                <Sym name="chevron_right" style={{ color: 'var(--p-on-surface-variant)' }} />
              </button>
              <button onClick={logout} className="w-full px-5 py-4 flex items-center justify-between hover:bg-black/[0.02]" style={{ borderTop: '1px solid var(--p-outline-variant)', color: 'var(--p-error)' }}>
                <span className="flex items-center gap-3 text-[14px] font-semibold"><Sym name="logout" /> Log out</span>
                <Sym name="chevron_right" />
              </button>
            </SettingsCard>
          </div>
        </div>
      </main>
    </PortalShell>
  );
}
