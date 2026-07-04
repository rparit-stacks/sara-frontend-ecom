import { useEffect, useState } from 'react';
import { Sym } from '@/components/portal/Sym';

export default function RenameDesignModal({
  open,
  currentName,
  onClose,
  onSave,
  heading = 'Rename chat',
  placeholder = 'Chat name',
}: {
  open: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  heading?: string;
  placeholder?: string;
}) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  if (!open) return null;

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-sm rounded-xl border p-5 shadow-xl" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[16px]">{heading}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-black/5"><Sym name="close" /></button>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
          className="w-full border rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2"
          style={{ borderColor: 'var(--p-outline-variant)' }}
          placeholder={placeholder}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ color: 'var(--p-on-surface-variant)' }}>Cancel</button>
          <button type="button" onClick={() => void submit()} disabled={saving || !name.trim()} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: 'var(--p-primary)' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
