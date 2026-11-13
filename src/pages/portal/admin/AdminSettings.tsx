import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import { adminAuthApi, manufacturingApi, notificationSettingsApi, adminNotificationSettingsApi, type PortalAdminSettings, type GlobalNotificationPreferenceDto } from '@/lib/api';
import { getAdminChatDisplayName } from '@/lib/adminAccess';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';
import { AnimatePresence, motion } from 'framer-motion';

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

/** One settings panel: a plain title + description, then rows. (icon kept in the signature for callers, not drawn) */
function SettingsCard({ icon, title, description, children }: { icon?: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="pa-card pa-settings-panel" data-ghost={icon} style={{ padding: 0, overflow: 'hidden' }}>
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
        <h4 className="font-display font-bold text-[20px]">{title}</h4>
        {description && <p className="text-[13px] mt-1" style={{ color: 'var(--p-on-surface-variant)' }}>{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/** Platform-wide, per-event switch controlling whether the CLIENT gets notified about a
 *  project event (rename, delete, stage change, etc.) — separate from "Notify the team
 *  about" above, which is about alerting internal staff. Registry-driven: every event
 *  the backend knows about (ProjectNotificationEvents) shows up here automatically. */
function ClientNotificationSettings({ canToggle }: { canToggle: boolean }) {
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
            <Toggle
              on={ev.enabled}
              disabled={!canToggle}
              onClick={() => toggleMutation.mutate({ eventKey: ev.eventKey, enabled: !ev.enabled })}
            />
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
function AdminNotificationSettings({ canToggle }: { canToggle: boolean }) {
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
            <Toggle
              on={ev.enabled}
              disabled={!canToggle}
              onClick={() => toggleMutation.mutate({ eventKey: ev.eventKey, enabled: !ev.enabled })}
            />
          </div>
        ))
      )}
    </SettingsCard>
  );
}

const SECTIONS: { key: 'profile' | 'manufacturing' | 'team' | 'clients'; label: string; hint: string }[] = [
  { key: 'profile', label: 'Your identity', hint: 'Name, email, WhatsApp' },
  { key: 'manufacturing', label: 'Manufacturing', hint: 'Project codes, currency' },
  { key: 'team', label: 'Team alerts', hint: 'What alerts staff' },
  { key: 'clients', label: 'Client notifications', hint: 'What clients are told' },
];

/** Label + hint on the left, the control on the right: the same row shape for every setting. */
function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-x-6 gap-y-2 items-center" style={{ borderTop: '1px solid var(--p-outline-variant)' }}>
      <div className="min-w-0">
        <p className="font-semibold text-[14px]">{label}</p>
        {hint && <p className="text-[12px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>{hint}</p>}
      </div>
      <div className="sm:justify-self-end w-full sm:max-w-sm">{children}</div>
    </div>
  );
}

export default function PortalAdminSettings() {
  const { hasAny } = useAdminPermissions();
  const canUpdateSettings = hasAny(P.PORTAL_SETTINGS_UPDATE);
  const canUpdateCompany = hasAny(P.PORTAL_SETTINGS_UPDATE_COMPANY);
  const canToggleOrgNotifications = hasAny(P.PORTAL_SETTINGS_TOGGLE_ORG_NOTIFICATIONS);
  const canToggleStaffNotifications = hasAny(P.PORTAL_SETTINGS_TOGGLE_STAFF_NOTIFICATIONS);
  const qc = useQueryClient();
  const [identityName, setIdentityName] = useState('');
  const [identityEmail, setIdentityEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [settings, setSettings] = useState<PortalAdminSettings>(DEFAULT_SETTINGS);
  const [section, setSection] = useState<'profile' | 'manufacturing' | 'team' | 'clients'>('profile');

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
        setWhatsappNumber(admin.whatsappNumber || '');
      })
      .catch(() => {
        setIdentityName(getAdminChatDisplayName());
      });
  }, []);

  const saveWhatsapp = async () => {
    const digits = whatsappNumber.replace(/[^0-9]/g, '');
    if (digits.length < 10) {
      toast.error('Enter at least 10 digits.');
      return;
    }
    setWhatsappSaving(true);
    try {
      const admin = await adminAuthApi.updateOwnWhatsappNumber(digits);
      localStorage.setItem('adminUser', JSON.stringify(admin));
      setWhatsappNumber(admin.whatsappNumber || '');
      toast.success('WhatsApp number updated.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save that number.');
    } finally {
      setWhatsappSaving(false);
    }
  };

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
        canUpdateSettings ? (
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
        ) : undefined
      }
    >
      <div className="p-5 sm:p-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)] gap-6 items-start">
          <nav className="md:sticky md:top-4 flex md:flex-col gap-1 overflow-x-auto" aria-label="Settings sections">
            {SECTIONS.map((sec) => (
              <button
                key={sec.key}
                type="button"
                onClick={() => setSection(sec.key)}
                className={`pa-setnav ${section === sec.key ? 'on' : ''}`}
              >
                <span className="pa-setnav-title">{sec.label}</span>
                <span className="pa-setnav-hint">{sec.hint}</span>
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {section === 'profile' && (
                <SettingsCard icon="badge" title="Your identity" description="This name appears when you reply in project chat. It comes from your admin account.">
                  <FieldRow label="Display name in chat" hint="Set by the primary admin under Store Admin → Admins.">
                    <input value={identityName} readOnly className="pa-field" />
                  </FieldRow>
                  <FieldRow label="Email">
                    <input value={identityEmail} readOnly className="pa-field" />
                  </FieldRow>
                  <FieldRow label="WhatsApp number" hint="Where your admin notifications (new messages, requests to talk to a human) are sent.">
                    <div className="flex gap-2">
                      <input type="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="e.g. 9876543210" className="pa-field" />
                      {canUpdateCompany && (
                        <button
                          type="button"
                          onClick={() => void saveWhatsapp()}
                          disabled={whatsappSaving}
                          className="px-4 rounded-lg text-[13px] font-semibold text-white disabled:opacity-60 shrink-0"
                          style={{ background: 'var(--p-primary)' }}
                        >
                          {whatsappSaving ? 'Saving…' : 'Save'}
                        </button>
                      )}
                    </div>
                  </FieldRow>
                </SettingsCard>
              )}

              {section === 'manufacturing' && (
                <SettingsCard icon="factory" title="Manufacturing" description="Defaults used when new projects are created. Use Save changes at the top right.">
                  <FieldRow label="Project code prefix" hint="Shown at the start of every project code.">
                    <input
                      value={settings.projectCodePrefix}
                      onChange={(e) => setSettings((s) => ({ ...s, projectCodePrefix: e.target.value }))}
                      readOnly={!canUpdateSettings}
                      className="pa-field"
                    />
                  </FieldRow>
                  <FieldRow label="Default currency">
                    <select
                      value={settings.defaultCurrency}
                      onChange={(e) => setSettings((s) => ({ ...s, defaultCurrency: e.target.value }))}
                      disabled={!canUpdateSettings}
                      className="pa-field"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </FieldRow>
                  <FieldRow label="Auto-generate project codes" hint="Assign the next number when a project is created.">
                    <Toggle on={settings.autoGenerateProjectCodes} disabled={!canUpdateSettings} onClick={() => setBool('autoGenerateProjectCodes')} />
                  </FieldRow>
                </SettingsCard>
              )}

              {section === 'team' && <AdminNotificationSettings canToggle={canToggleStaffNotifications} />}
              {section === 'clients' && <ClientNotificationSettings canToggle={canToggleOrgNotifications} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AdminShell>
  );
}
