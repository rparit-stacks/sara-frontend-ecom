import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalShell from '@/components/portal/PortalShell';
import SettingsNav from '@/components/portal/SettingsNav';
import { Sym } from '@/components/portal/Sym';

const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-11 h-6 rounded-full relative transition-colors shrink-0"
    style={{ background: on ? 'var(--p-primary)' : 'var(--p-outline-variant)' }}
  >
    <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: on ? 'translateX(20px)' : 'none' }} />
  </button>
);

interface Pref { key: string; label: string; desc: string }
const EMAIL_PREFS: Pref[] = [
  { key: 'e_approval', label: 'Approvals needed', desc: 'When a quotation or sample needs your decision.' },
  { key: 'e_message', label: 'New messages & replies', desc: 'Direct messages and thread replies.' },
  { key: 'e_stage', label: 'Stage updates', desc: 'When a design moves to a new production stage.' },
  { key: 'e_payment', label: 'Payments & invoices', desc: 'Payment confirmations and new invoices.' },
];
const WA_PREFS: Pref[] = [
  { key: 'w_approval', label: 'Approvals needed', desc: 'Urgent approvals via WhatsApp.' },
  { key: 'w_stage', label: 'Stage updates', desc: 'Production milestones via WhatsApp.' },
];

export default function PortalSettings() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    e_approval: true, e_message: true, e_stage: true, e_payment: true,
    w_approval: true, w_stage: false,
  });
  const toggle = (k: string) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authEmail');
    navigate('/login', { replace: true });
  };

  const Section = ({ title, icon, items }: { title: string; icon: string; items: Pref[] }) => (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
      <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
        <Sym name={icon} className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
        <h4 className="font-bold text-[14px]">{title}</h4>
      </div>
      {items.map((p, i) => (
        <div key={p.key} className="px-5 py-4 flex items-center justify-between gap-4" style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
          <div>
            <p className="font-semibold text-[14px]">{p.label}</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>{p.desc}</p>
          </div>
          <Toggle on={!!prefs[p.key]} onClick={() => toggle(p.key)} />
        </div>
      ))}
    </div>
  );

  return (
    <PortalShell active="more">
      <SettingsNav active="settings" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="h-14 px-8 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <h2 className="font-display text-[18px]">Notification settings</h2>
          <button className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white hover:brightness-110" style={{ background: 'var(--p-primary)' }}>Save preferences</button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-2xl space-y-6">
            <Section title="Email notifications" icon="mail" items={EMAIL_PREFS} />
            <Section title="WhatsApp notifications" icon="chat" items={WA_PREFS} />

            {/* Danger / account zone */}
            <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
                <h4 className="font-bold text-[14px]">Account</h4>
              </div>
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
            </div>
          </div>
        </div>
      </main>
    </PortalShell>
  );
}
