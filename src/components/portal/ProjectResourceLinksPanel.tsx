import { useState } from 'react';
import { Sym } from '@/components/portal/Sym';
import type { ProjectResourceLinkDto } from '@/lib/api';

/**
 * REQ-1 (Portal Feature Requirements, 1st Sept) — "File Links" folder under Resources: a
 * label + URL to a file already on a shared drive, not a portal-uploaded file. Opening a
 * link always goes through `target="_blank" rel="noreferrer"` (the site-wide pattern for
 * arbitrary external URLs — see ProjectBriefPanel/RichMessageBody/LinkPreviewCard), never
 * FilePreviewModal — these aren't files the portal can fetch/render itself.
 *
 * `onAdd`/`onDelete` are only passed from the admin workspace (see
 * AdminClientWorkspacePreview) — the client view renders read-only, matching the
 * requirement's "accessible internally by the team" framing.
 */
export default function ProjectResourceLinksPanel({
  links,
  isLoading,
  onAdd,
  onDelete,
}: {
  links: ProjectResourceLinkDto[];
  isLoading?: boolean;
  onAdd?: (label: string, url: string) => Promise<void> | void;
  onDelete?: (linkId: number) => Promise<void> | void;
}) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canWrite = !!onAdd;

  const submit = async () => {
    if (!onAdd || !label.trim() || !url.trim() || saving) return;
    setSaving(true);
    try {
      await onAdd(label.trim(), url.trim());
      setLabel('');
      setUrl('');
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="max-w-3xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-[20px]">File Links</h2>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
              Links to files stored on the shared drive — opens in a new tab, nothing uploaded to the portal.
            </p>
          </div>
          {canWrite && !adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="px-3 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 shrink-0"
              style={{ background: 'var(--p-primary)', color: 'var(--p-on-primary)' }}
            >
              <Sym name="add_link" className="text-[16px]" /> Add link
            </button>
          )}
        </div>

        {adding && (
          <div className="border rounded-xl p-4 mb-4 space-y-3" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Label</label>
              <input
                autoFocus
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Final tech pack — v3"
                className="w-full mt-1 px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Shared drive URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://drive.google.com/…"
                className="w-full mt-1 px-3 py-2 rounded-lg border text-[13px] outline-none"
                style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface)' }}
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setAdding(false); setLabel(''); setUrl(''); }}
                className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold"
                style={{ color: 'var(--p-on-surface-variant)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!label.trim() || !url.trim() || saving}
                onClick={() => void submit()}
                className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold disabled:opacity-50"
                style={{ background: 'var(--p-primary)', color: 'var(--p-on-primary)' }}
              >
                {saving ? 'Saving…' : 'Save link'}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 flex justify-center"><Sym name="progress_activity" className="text-[28px] animate-spin" /></div>
        ) : links.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
            <Sym name="link" className="text-[40px] opacity-40" />
            <p className="mt-2 font-semibold">No file links yet</p>
            <p className="text-[13px]">{canWrite ? 'Add a link to a file on the shared drive.' : 'Your team will add links to shared-drive files here.'}</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
            {links.map((link, i) => (
              <div
                key={link.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-black/[0.02]"
                style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}
              >
                <div className="w-10 h-10 rounded flex items-center justify-center shrink-0" style={{ background: 'rgba(0,103,106,0.1)', color: 'var(--p-primary)' }}>
                  <Sym name="link" className="text-[20px]" />
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-0"
                >
                  <p className="font-semibold text-[13px] truncate">{link.label}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{link.url}</p>
                </a>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1"
                    style={{ color: 'var(--p-primary)' }}
                  >
                    <Sym name="open_in_new" className="text-[16px]" /> Open
                  </a>
                  {onDelete && (
                    <button
                      type="button"
                      disabled={deletingId === link.id}
                      onClick={async () => {
                        setDeletingId(link.id);
                        try {
                          await onDelete(link.id);
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-black/5 disabled:opacity-50"
                      title="Remove link"
                    >
                      <Sym name="delete" className="text-[18px]" style={{ color: 'var(--p-error)' }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
