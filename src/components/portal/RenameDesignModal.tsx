import { useEffect, useRef, useState } from 'react';
import { Sym } from './Sym';
import { mediaApi } from '@/lib/api';

export default function RenameDesignModal({
  open,
  currentName,
  currentImageUrl,
  showImageUpload = false,
  onClose,
  onSave,
  heading = 'Rename design',
  placeholder = 'Design name',
}: {
  open: boolean;
  currentName: string;
  currentImageUrl?: string | null;
  /** When true, allow updating the sidebar thumbnail (design channels only). */
  showImageUpload?: boolean;
  onClose: () => void;
  onSave: (name: string, imageUrl?: string) => Promise<void>;
  heading?: string;
  placeholder?: string;
}) {
  const [name, setName] = useState(currentName);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(currentName);
    setFile(null);
    setPreview(null);
  }, [open, currentName]);

  if (!open) return null;

  const pickFile = (f: File | null) => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
  };

  const displayImage = preview || (currentImageUrl && !file ? currentImageUrl : null);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      let imageUrl: string | undefined;
      if (showImageUpload && file) {
        imageUrl = await mediaApi.upload(file, 'projects');
      }
      const nameChanged = trimmed !== currentName.trim();
      const imageChanged = !!file;
      if (!nameChanged && !imageChanged) {
        onClose();
        return;
      }
      await onSave(trimmed, imageChanged ? imageUrl : undefined);
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

        {showImageUpload && (
          <>
            <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Cover image</label>
            <button
              type="button"
              disabled={saving}
              onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed rounded-xl p-3 flex items-center gap-3 mb-4 transition-colors hover:border-current"
              style={{ borderColor: 'var(--p-outline-variant)' }}
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border flex items-center justify-center" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-high)' }}>
                {displayImage ? (
                  <img src={displayImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Sym name="palette" className="text-[22px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                )}
              </div>
              <div className="text-left min-w-0">
                <p className="text-[13px] font-semibold">Change thumbnail</p>
                <p className="text-[12px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>Shown in the left sidebar</p>
              </div>
            </button>
            <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => pickFile(e.target.files?.[0] || null)} />
          </>
        )}

        <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
          disabled={saving}
          className="w-full border rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2"
          style={{ borderColor: 'var(--p-outline-variant)' }}
          placeholder={placeholder}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ color: 'var(--p-on-surface-variant)' }}>Cancel</button>
          <button type="button" onClick={() => void submit()} disabled={saving || !name.trim()} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: 'var(--p-primary)' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
