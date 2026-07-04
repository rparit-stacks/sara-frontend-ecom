import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import PortalShell from '@/components/portal/PortalShell';
import SettingsNav from '@/components/portal/SettingsNav';
import { Sym } from '@/components/portal/Sym';
import { getUserEmailFromToken, userApi } from '@/lib/api';

const Field = ({ label, value, onChange, disabled }: { label: string; value: string; onChange?: (v: string) => void; disabled?: boolean }) => (
  <div>
    <label className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{label}</label>
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className="w-full mt-1 px-3 py-2 rounded-lg border outline-none text-[14px] disabled:opacity-60"
      style={{ borderColor: 'var(--p-outline-variant)', background: disabled ? 'var(--p-surface-container)' : 'var(--p-surface-container-lowest)' }}
    />
  </div>
);

export default function PortalProfile() {
  const qc = useQueryClient();
  const email = getUserEmailFromToken() || '';
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getProfile(),
  });

  useEffect(() => {
    if (profile) {
      const full = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
      setName(full || email.split('@')[0] || '');
      setPhone(profile.phoneNumber || profile.phone || '');
      setCompany(profile.company || profile.brand || '');
    }
  }, [profile, email]);

  const saveMut = useMutation({
    mutationFn: () => {
      const parts = name.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ');
      return userApi.updateProfile({ firstName, lastName, phoneNumber: phone, company });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-profile'] });
      setEdit(false);
      toast.success('Profile updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to save'),
  });

  const initials = (name || email).split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <PortalShell active="more">
      <SettingsNav active="profile" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="h-14 px-8 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <h2 className="font-display text-[18px]">Profile</h2>
          {edit ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => setEdit(false)} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}>Cancel</button>
              <button type="button" disabled={saveMut.isPending} onClick={() => saveMut.mutate()} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white hover:brightness-110 disabled:opacity-50" style={{ background: 'var(--p-primary)' }}>Save changes</button>
            </div>
          ) : (
            <button type="button" onClick={() => setEdit(true)} className="px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 text-white hover:brightness-110" style={{ background: 'var(--p-primary)' }}>
              <Sym name="edit" className="text-[18px]" /> Edit profile
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          {isLoading ? (
            <div className="flex justify-center py-20"><Sym name="progress_activity" className="text-[28px] animate-spin" /></div>
          ) : (
            <div className="max-w-2xl">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-[28px] font-bold" style={{ background: 'var(--p-primary)' }}>{initials}</div>
                <div>
                  <h3 className="font-bold text-[20px]">{name || 'Your profile'}</h3>
                  <p className="text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>{email}</p>
                </div>
              </div>
              <div className="space-y-5">
                <Field label="Full name" value={name} onChange={setName} disabled={!edit} />
                <Field label="Email" value={email} disabled />
                <Field label="Phone" value={phone} onChange={setPhone} disabled={!edit} />
                <Field label="Brand / company" value={company} onChange={setCompany} disabled={!edit} />
              </div>
            </div>
          )}
        </div>
      </main>
    </PortalShell>
  );
}
