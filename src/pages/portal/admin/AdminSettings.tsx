import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import { adminAuthApi, manufacturingApi, notificationSettingsApi, adminNotificationSettingsApi, type PortalAdminSettings, type GlobalNotificationPreferenceDto } from '@/lib/api';
import { getAdminChatDisplayName } from '@/lib/adminAccess';

const DEFAULT_SETTINGS: PortalAdminSettings = {
  projectCodePrefix: 'PRJ-',
  defaultCurrency: 'INR',
  autoGenerateProjectCodes: true,
};

const Toggle = ({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="w-11 h-6 rounded-full relative transition-colors shrink-0 disabled:opacity-50"
    style={{ background: on ? 'var(--p-primary)' : 'var(--p-outline-variant)' }}
  >
    <span
      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
      style={{ transform: on ? 'translateX(20px)' : 'none' }}
    />
  </button>
);

/** A settings card — icon header + body. The consistent unit this whole page is built from. */
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

/** Platform-wide, per-event switch controlling whether the CLIENT gets notified about a
 *  project event (rename, delete, stage change, etc.) — separate from "Notify the team
 *  about" above, which is about alerting internal staff. Registry-driven: every event
 *  the backend knows about (ProjectNotificationEvents) shows up here automatically. */
function ClientNotificationSettings() {
  const queryClient = useQueryClient();
  const { data: prefs, isLoading } = useQuery({
    queryKey: ['global-notification-preferences'],
    queryFn: () => notificationSettingsApi.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ eventKey, enabled }: { eventKey: string; enabled: boolean }) =>
      notificationSettingsApi.setPreference(eventKey, enabled),
    onMutate: async ({ eventKey, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['global-notification-preferences'] });
      const previous = queryClient.getQueryData<GlobalNotificationPreferenceDto[]>(['global-notification-preferences']);
      queryClient.setQueryData<GlobalNotificationPreferenceDto[]>(['global-notification-preferences'], (old) =>
        old?.map((p) => (p.eventKey === eventKey ? { ...p, enabled } : p)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['global-notification-preferences'], ctx.previous);
      toast.error('Could not update notification setting');
    },
  });

  return (
    <SettingsCard icon="notifications_active" title="Client notifications" description="Controls whether clients are notified for each event below, across every project.">
      {isLoading ? (
        <p className="px-5 py-4 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>Loading…</p>
      ) : (
        prefs?.map((ev, i) => (
          <div
            key={ev.eventKey}
            className="px-5 py-4 flex items-center justify-between gap-3"
            style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}
          >
            <div className="min-w-0">
              <p className="font-semibold text-[14px]">{ev.label}</p>
              <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{ev.description}</p>
            </div>
            <Toggle on={ev.enabled} onClick={() => toggleMutation.mutate({ eventKey: ev.eventKey, enabled: !ev.enabled })} />
          </div>
        ))
      )}
    </SettingsCard>
  );
}

/** Platform-wide, per-event switch controlling whether STAFF gets notified about an event
 *  (handover requests, quotation requests, client message digests) — the admin-audience
 *  counterpart of ClientNotificationSettings above. Registry-driven the same way: every
 *  event AdminNotificationEvents knows about shows up here automatically. Replaces the old
 *  "Notify the team about" card, which persisted three toggles nothing ever read back. */
function AdminNotificationSettings() {
  const queryClient = useQueryClient();
  const { data: prefs, isLoading } = useQuery({
    queryKey: ['admin-notification-preferences'],
    queryFn: () => adminNotificationSettingsApi.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ eventKey, enabled }: { eventKey: string; enabled: boolean }) =>
      adminNotificationSettingsApi.setPreference(eventKey, enabled),
    onMutate: async ({ eventKey, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-notification-preferences'] });
      const previous = queryClient.getQueryData<GlobalNotificationPreferenceDto[]>(['admin-notification-preferences']);
      queryClient.setQueryData<GlobalNotificationPreferenceDto[]>(['admin-notification-preferences'], (old) =>
        old?.map((p) => (p.eventKey === eventKey ? { ...p, enabled } : p)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['admin-notification-preferences'], ctx.previous);
      toast.error('Could not update notification setting');
    },
  });

  return (
    <SettingsCard icon="groups" title="Notify the team about" description="Controls whether admins/staff are notified for each event below.">
      {isLoading ? (
        <p className="px-5 py-4 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>Loading…</p>
      ) : (
        prefs?.map((ev, i) => (
          <div
            key={ev.eventKey}
            className="px-5 py-4 flex items-center justify-between gap-3"
            style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}
          >
            <div className="min-w-0">
              <p className="font-semibold text-[14px]">{ev.label}</p>
              <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{ev.description}</p>
            </div>
            <Toggle on={ev.enabled} onClick={() => toggleMutation.mutate({ eventKey: ev.eventKey, enabled: !ev.enabled })} />
          </div>
        ))
      )}
    </SettingsCard>
  );
}

export default function PortalAdminSettings() {
  const qc = useQueryClient();
  const [identityName, setIdentityName] = useState('');
  const [identityEmail, setIdentityEmail] = useState('');
  const [settings, setSettings] = useState<PortalAdminSettings>(DEFAULT_SETTINGS);

  const { data: savedSettings, isLoading } = useQuery({
    queryKey: ['portal-admin-settings'],
    queryFn: () => manufacturingApi.getPortalSettings(),
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
    }
  }, [savedSettings]);

  useEffect(() => {
    adminAuthApi.getCurrentAdmin()
      .then((admin) => {
        localStorage.setItem('adminUser', JSON.stringify(admin));
        setIdentityName(admin.name?.trim() || admin.username || getAdminChatDisplayName());
        setIdentityEmail(admin.email || '');
      })
      .catch(() => {
        setIdentityName(getAdminChatDisplayName());
      });
  }, []);

  const saveMutation = useMutation({
    mutationFn: () => manufacturingApi.savePortalSettings(settings),
    onSuccess: (data) => {
      setSettings({ ...DEFAULT_SETTINGS, ...data });
      qc.setQueryData(['portal-admin-settings'], data);
      toast.success('Settings saved');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to save settings'),
  });

  const setBool = (key: keyof PortalAdminSettings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  return (
    <AdminShell
      title="Settings"
      actions={
        <button
          type="button"
          disabled={saveMutation.isPending || isLoading}
          onClick={() => saveMutation.mutate()}
          className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white hover:brightness-110 flex items-center gap-2 disabled:opacity-60"
          style={{ background: 'var(--p-primary)' }}
        >
          <Sym name="save" className="text-[16px]" />
          {saveMutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      }
    >
      <div className="p-5 sm:p-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <SettingsCard icon="badge" title="Your identity" description="This name appears when you reply in project chat. It comes from your admin account.">
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Display name in chat</label>
                <input
                  value={identityName}
                  readOnly
                  className="w-full mt-1 px-3 py-2 rounded-lg border outline-none text-[14px]"
                  style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Email</label>
                <input
                  value={identityEmail}
                  readOnly
                  className="w-full mt-1 px-3 py-2 rounded-lg border outline-none text-[14px]"
                  style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}
                />
              </div>
              <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                To change your display name, ask the primary admin to update your profile under Store Admin → Admins.
              </p>
            </div>
          </SettingsCard>

          <SettingsCard icon="factory" title="Manufacturing settings">
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Project code prefix</label>
                <input
                  value={settings.projectCodePrefix}
                  onChange={(e) => setSettings((s) => ({ ...s, projectCodePrefix: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border outline-none text-[14px]"
                  style={{ borderColor: 'var(--p-outline-variant)' }}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Default currency</label>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) => setSettings((s) => ({ ...s, defaultCurrency: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border outline-none text-[14px] bg-transparent"
                  style={{ borderColor: 'var(--p-outline-variant)' }}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[14px]">Auto-generate project codes</p>
                  <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>Assign next number on project creation.</p>
                </div>
                <Toggle on={settings.autoGenerateProjectCodes} onClick={() => setBool('autoGenerateProjectCodes')} />
              </div>
            </div>
          </SettingsCard>

          <AdminNotificationSettings />

          <ClientNotificationSettings />
        </div>
      </div>
    </AdminShell>
  );
}
