import { useEffect } from 'react';
import { Sym } from '@/components/portal/Sym';
import { fileKind } from '@/lib/clientPortalAggregate';

export default function FilePreviewModal({
  open,
  url,
  fileName,
  onClose,
}: {
  open: boolean;
  url: string | null;
  fileName?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !url) return null;

  const kind = fileKind(url);
  const name = fileName || url.split('/').pop() || 'file';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <header className="h-14 px-4 flex items-center justify-between shrink-0 text-white border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <Sym name={kind === 'pdf' ? 'picture_as_pdf' : kind === 'image' ? 'image' : kind === 'video' ? 'movie' : 'attach_file'} />
          <span className="font-semibold text-[14px] truncate">{decodeURIComponent(name)}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={url}
            download
            className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-white/15 hover:bg-white/25 flex items-center gap-1.5"
          >
            <Sym name="download" className="text-[16px]" /> Download
          </a>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-white/15 hover:bg-white/25 hidden sm:flex items-center gap-1.5"
          >
            <Sym name="open_in_new" className="text-[16px]" /> Open
          </a>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/15">
            <Sym name="close" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex items-center justify-center p-4 sm:p-8">
        {kind === 'image' ? (
          <img src={url} alt="" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        ) : kind === 'pdf' ? (
          <iframe
            title={name}
            src={`${url}#toolbar=1`}
            className="w-full h-full max-w-5xl rounded-lg bg-white shadow-2xl"
          />
        ) : kind === 'video' ? (
          <video src={url} controls className="max-w-full max-h-full rounded-lg shadow-2xl" />
        ) : (
          <div className="text-center text-white max-w-sm">
            <Sym name="description" className="text-[56px] opacity-50" />
            <p className="mt-4 text-[15px] font-semibold">Preview not available</p>
            <p className="mt-1 text-[13px] text-white/70">Download or open this file in a new tab.</p>
            <div className="flex gap-3 justify-center mt-6">
              <a href={url} download className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: 'var(--p-primary)' }}>
                Download
              </a>
              <a href={url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg text-[13px] font-semibold border border-white/30">
                Open in browser
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
