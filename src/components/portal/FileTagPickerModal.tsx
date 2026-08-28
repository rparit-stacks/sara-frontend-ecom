import { useEffect, useState } from 'react';
import { Sym } from './Sym';
import { fileKind } from '@/lib/clientPortalAggregate';
import type { ProjectMessageDto } from '@/lib/api';

function fileNameFromUrl(url: string) {
  try {
    const part = url.split('/').pop() || 'file';
    return decodeURIComponent(part.split('?')[0]);
  } catch {
    return 'file';
  }
}

/** Picker for the @-mention "Files…" row — files have no searchable title/metadata, so
 *  they're tagged by browsing the current project's already-uploaded attachments instead
 *  of live text search. Fetches on open (attachments aren't preloaded outside the Files tab). */
export default function FileTagPickerModal({
  open,
  onClose,
  onPick,
  fetchAttachments,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (file: { url: string; name: string }) => void;
  fetchAttachments: () => Promise<ProjectMessageDto[]>;
}) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<{ url: string; name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchAttachments()
      .then((messages) => {
        const urls: { url: string; name: string }[] = [];
        for (const m of messages) {
          const list = m.attachmentUrls && m.attachmentUrls.length > 0 ? m.attachmentUrls : (m.attachmentUrl ? [m.attachmentUrl] : []);
          for (const url of list) urls.push({ url, name: fileNameFromUrl(url) });
        }
        setRows(urls);
      })
      .finally(() => setLoading(false));
  }, [open, fetchAttachments]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[70vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--p-surface-container-lowest)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-12 px-4 flex items-center justify-between border-b shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <p className="font-bold text-[14px]">Tag a file</p>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-black/5">
            <Sym name="close" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-10 flex justify-center"><Sym name="progress_activity" className="text-[24px] animate-spin" /></div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>No files uploaded in this project yet</div>
          ) : (
            rows.map((f, i) => {
              const kind = fileKind(f.name);
              return (
                <button
                  key={`${f.url}-${i}`}
                  type="button"
                  onClick={() => onPick(f)}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-black/[0.03] border-b"
                  style={{ borderColor: 'var(--p-outline-variant)' }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--p-surface-container-high)' }}>
                    <Sym name={kind === 'pdf' ? 'picture_as_pdf' : kind === 'image' ? 'image' : kind === 'video' ? 'movie' : 'attach_file'} className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
                  </div>
                  <p className="text-[13px] font-medium truncate">{f.name}</p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
