import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sym } from './Sym';
import { projectApi } from '@/lib/api';

export default function ProjectAssignModal({
  open,
  projectIds,
  projectLabels,
  onClose,
  onAssigned,
}: {
  open: boolean;
  projectIds: number[];
  projectLabels: string[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [adminId, setAdminId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: portalAdmins = [], isLoading } = useQuery({
    queryKey: ['portal-admins-for-assign'],
    queryFn: () => projectApi.listPortalAdmins(),
    enabled: open,
  });

  if (!open) return null;

  const submit = async () => {
    if (adminId === '') {
      setError('Please select an admin');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await projectApi.bulkAssign(Number(adminId), projectIds);
      onAssigned();
      onClose();
      setAdminId('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Assignment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border rounded-2xl shadow-2xl p-5"
        style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-[18px]">Assign to portal admin</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-black/5"><Sym name="close" /></button>
        </div>
        <p className="text-[13px] mb-3" style={{ color: 'var(--p-on-surface-variant)' }}>
          {projectIds.length === 1
            ? `Assign "${projectLabels[0]}" to a team member with manufacturing portal access.`
            : `Assign ${projectIds.length} selected projects. The admin will receive an email notification.`}
        </p>
        {projectIds.length > 1 && (
          <ul className="text-[12px] mb-3 max-h-24 overflow-y-auto rounded-lg border p-2 space-y-0.5" style={{ borderColor: 'var(--p-outline-variant)' }}>
            {projectLabels.map((l) => <li key={l} className="truncate">• {l}</li>)}
          </ul>
        )}
        <label className="text-[12px] font-bold uppercase block mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Portal admin</label>
        {isLoading ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--p-on-surface-variant)' }}>Loading admins…</p>
        ) : portalAdmins.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--p-on-surface-variant)' }}>No portal admins available. Enable portal access on an admin account first.</p>
        ) : (
          <select
            value={adminId}
            onChange={(e) => setAdminId(e.target.value ? Number(e.target.value) : '')}
            className="w-full h-10 px-3 rounded-lg border text-[14px] mb-3"
            style={{ borderColor: 'var(--p-outline-variant)' }}
          >
            <option value="">Select admin…</option>
            {portalAdmins.map((a) => (
              <option key={a.adminId} value={a.adminId}>{a.name} ({a.email})</option>
            ))}
          </select>
        )}
        {error && <p className="text-[13px] text-red-600 mb-2">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--p-outline)' }}>Cancel</button>
          <button
            type="button"
            disabled={saving || portalAdmins.length === 0}
            onClick={submit}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--p-primary)' }}
          >
            {saving ? 'Assigning…' : 'Assign & notify'}
          </button>
        </div>
      </div>
    </>
  );
}
