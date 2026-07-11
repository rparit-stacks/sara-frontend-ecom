import { useRef, useState } from 'react';
import { Sym } from './Sym';
import { mediaApi } from '@/lib/api';

export default function AddDesignModal({
  open,
  onClose,
  onCreated,
  simple = false,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string, imageUrl?: string, description?: string) => Promise<void>;
  /** Name-only flow for client portal */
  simple?: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const pickFile = (f: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
  };

  const submit = async () => {
    if (!name.trim()) return;
    setUploading(true);
    setProgress(10);
    try {
      let imageUrl: string | undefined;
      if (!simple && file) {
        setProgress(35);
        imageUrl = await mediaApi.upload(file, 'projects');
        setProgress(85);
      }
      await onCreated(name.trim(), imageUrl, simple ? undefined : (description.trim() || undefined));
      setName('');
      setDescription('');
      pickFile(null);
      setProgress(100);
      onClose();
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  if (simple) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/40" onClick={uploading ? undefined : onClose} />
        <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 border rounded-2xl shadow-2xl p-5" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
          <h3 className="font-display text-[17px] mb-1">New chat</h3>
          <p className="text-[13px] mb-4" style={{ color: 'var(--p-on-surface-variant)' }}>Each design is its own chat — give it a name to start.</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={uploading}
            placeholder="e.g. Summer dress"
            className="w-full h-10 px-3 rounded-lg border text-[14px] mb-4 outline-none focus:ring-2 focus:ring-[#00676a]/20"
            style={{ borderColor: 'var(--p-outline-variant)' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) submit(); }}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button type="button" disabled={uploading} onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--p-outline)' }}>Cancel</button>
            <button type="button" disabled={uploading || !name.trim()} onClick={submit} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: 'var(--p-primary)' }}>
              {uploading ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={uploading ? undefined : onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border rounded-2xl shadow-2xl p-6" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
        <h3 className="font-display text-[18px] mb-1">New design channel</h3>
        <p className="text-[13px] mb-4" style={{ color: 'var(--p-on-surface-variant)' }}>Add a name and optional cover image or PDF reference.</p>

        <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Design name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={uploading}
          placeholder="e.g. Linen Wrap Dress"
          className="w-full h-10 px-3 rounded-lg border text-[14px] mb-4 outline-none focus:ring-2 focus:ring-[#00676a]/20"
          style={{ borderColor: 'var(--p-outline-variant)' }}
        />

        <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Details <span className="normal-case font-normal opacity-70">(optional)</span></label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={uploading}
          rows={3}
          placeholder="Fabric, colors, sizing, MOQ, target timeline, or any spec notes for this design…"
          className="w-full px-3 py-2 rounded-lg border text-[14px] mb-4 outline-none resize-none focus:ring-2 focus:ring-[#00676a]/20"
          style={{ borderColor: 'var(--p-outline-variant)' }}
        />

        <label className="block text-[11px] font-bold uppercase mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>Cover / reference file</label>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 transition-colors hover:border-current mb-4"
          style={{ borderColor: 'var(--p-outline-variant)' }}
        >
          {preview ? (
            <img src={preview} alt="" className="w-20 h-20 rounded-lg object-cover" />
          ) : file ? (
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <Sym name="picture_as_pdf" style={{ color: 'var(--p-error)' }} />
              {file.name}
            </div>
          ) : (
            <>
              <Sym name="cloud_upload" className="text-[28px]" style={{ color: 'var(--p-primary)' }} />
              <span className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>Image, PDF or file</span>
            </>
          )}
        </button>
        <input ref={inputRef} type="file" accept="image/*,.pdf" hidden onChange={(e) => pickFile(e.target.files?.[0] || null)} />

        {uploading && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] font-semibold mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>
              <span className="flex items-center gap-1"><Sym name="progress_activity" className="text-[14px] animate-spin" /> Uploading…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--p-surface-container-high)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--p-primary)' }} />
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button type="button" disabled={uploading} onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--p-outline)' }}>Cancel</button>
          <button type="button" disabled={uploading || !name.trim()} onClick={submit} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: 'var(--p-primary)' }}>
            {uploading ? 'Creating…' : 'Create channel'}
          </button>
        </div>
      </div>
    </>
  );
}
