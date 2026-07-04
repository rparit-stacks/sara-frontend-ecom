import { useState } from 'react';
import AdminShell from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';

const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button onClick={onClick} className="w-11 h-6 rounded-full relative transition-colors shrink-0" style={{ background: on ? 'var(--p-primary)' : 'var(--p-outline-variant)' }}>
    <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: on ? 'translateX(20px)' : 'none' }} />
  </button>
);

export default function PortalAdminSettings() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ inq: true, approvals: true, payments: true, autoCode: true });
  const t = (k: string) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <AdminShell title="Settings">
      <div className="p-5 sm:p-8 max-w-2xl space-y-6">
        {/* business */}
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}><h4 className="font-bold text-[14px]">Manufacturing settings</h4></div>
          <div className="p-5 space-y-4">
            <div><label className="text-[12px] font-semibold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>Project code prefix</label><input defaultValue="SS-2026-" className="w-full mt-1 px-3 py-2 rounded-lg border outline-none text-[14px]" style={{ borderColor: 'var(--p-outline-variant)' }} /></div>
            <div><label className="text-[12px] font-semibold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>Default currency</label>
              <select className="w-full mt-1 px-3 py-2 rounded-lg border outline-none text-[14px] bg-transparent" style={{ borderColor: 'var(--p-outline-variant)' }}><option>USD ($)</option><option>INR (₹)</option><option>EUR (€)</option></select>
            </div>
            <div className="flex items-center justify-between"><div><p className="font-semibold text-[14px]">Auto-generate project codes</p><p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>Assign next number on project creation.</p></div><Toggle on={prefs.autoCode} onClick={() => t('autoCode')} /></div>
          </div>
        </div>

        {/* notifications */}
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}><h4 className="font-bold text-[14px]">Notify the team about</h4></div>
          {[['inq', 'New inquiries'], ['approvals', 'Client approvals & revision requests'], ['payments', 'Payments received']].map(([k, l], i) => (
            <div key={k} className="px-5 py-4 flex items-center justify-between" style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}>
              <p className="font-semibold text-[14px]">{l}</p><Toggle on={prefs[k]} onClick={() => t(k)} />
            </div>
          ))}
        </div>

        <button className="px-5 py-2.5 rounded-lg text-[14px] font-semibold text-white hover:brightness-110 flex items-center gap-2" style={{ background: 'var(--p-primary)' }}><Sym name="save" className="text-[18px]" /> Save settings</button>
      </div>
    </AdminShell>
  );
}
