import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import { adminAuthApi, manufacturingApi, type PortalAdminSettings } from '@/lib/api';
import { getAdminChatDisplayName } from '@/lib/adminAccess';

const DEFAULT_SETTINGS: PortalAdminSettings = {
  projectCodePrefix: 'PRJ-',
  defaultCurrency: 'INR',
  autoGenerateProjectCodes: true,
  notifyNewInquiries: true,
  notifyClientApprovals: true,
  notifyPaymentsReceived: true,
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
    <AdminShell title="Settings">
      <div className="p-5 sm:p-8 max-w-2xl space-y-6">
        {/* Identity — used in project chat */}
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
            <h4 className="font-bold text-[14px]">Your identity</h4>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
              This name appears when you reply in project chat. It comes from your admin account.
            </p>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <label className="text-[12px] font-semibold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>Display name in chat</label>
              <input
                value={identityName}
                readOnly
                className="w-full mt-1 px-3 py-2 rounded-lg border outline-none text-[14px] bg-[var(--p-surface-container-low)]"
                style={{ borderColor: 'var(--p-outline-variant)' }}
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>Email</label>
              <input
                value={identityEmail}
                readOnly
                className="w-full mt-1 px-3 py-2 rounded-lg border outline-none text-[14px] bg-[var(--p-surface-container-low)]"
                style={{ borderColor: 'var(--p-outline-variant)' }}
              />
            </div>
            <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>
              To change your display name, ask the primary admin to update your profile under Store Admin → Admins.
            </p>
          </div>
        </div>

        {/* Manufacturing settings */}
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
            <h4 className="font-bold text-[14px]">Manufacturing settings</h4>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-[12px] font-semibold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>Project code prefix</label>
              <input
                value={settings.projectCodePrefix}
                onChange={(e) => setSettings((s) => ({ ...s, projectCodePrefix: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg border outline-none text-[14px]"
                style={{ borderColor: 'var(--p-outline-variant)' }}
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>Default currency</label>
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
        </div>

        {/* Notifications */}
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
            <h4 className="font-bold text-[14px]">Notify the team about</h4>
          </div>
          {(
            [
              ['notifyNewInquiries', 'New inquiries'],
              ['notifyClientApprovals', 'Client approvals & revision requests'],
              ['notifyPaymentsReceived', 'Payments received'],
            ] as const
          ).map(([key, label], i) => (
            <div
              key={key}
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}
            >
              <p className="font-semibold text-[14px]">{label}</p>
              <Toggle on={settings[key]} onClick={() => setBool(key)} />
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={saveMutation.isPending || isLoading}
          onClick={() => saveMutation.mutate()}
          className="px-5 py-2.5 rounded-lg text-[14px] font-semibold text-white hover:brightness-110 flex items-center gap-2 disabled:opacity-60"
          style={{ background: 'var(--p-primary)' }}
        >
          <Sym name="save" className="text-[18px]" />
          {saveMutation.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </AdminShell>
  );
}
