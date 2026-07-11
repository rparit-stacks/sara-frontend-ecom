import { useState } from 'react';
import { Sym } from '@/components/portal/Sym';
import FilePreviewModal from '@/components/portal/FilePreviewModal';
import { fileKind } from '@/lib/clientPortalAggregate';
import type { ProjectMessageDto } from '@/lib/api';

const KIND_META = {
  pdf: { icon: 'picture_as_pdf', bg: 'rgba(186,26,26,0.1)', fg: 'var(--p-error)' },
  image: { icon: 'image', bg: 'rgba(0,103,106,0.1)', fg: 'var(--p-primary)' },
  doc: { icon: 'description', bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  video: { icon: 'movie', bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface)' },
  other: { icon: 'attach_file', bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface)' },
};

function fileNameFromUrl(url: string) {
  try {
    const part = url.split('/').pop() || 'file';
    return decodeURIComponent(part.split('?')[0]);
  } catch {
    return 'attachment';
  }
}

export default function ProjectFilesPanel({
  files,
  isLoading,
  title = 'Project files',
}: {
  files: ProjectMessageDto[];
  isLoading?: boolean;
  title?: string;
}) {
  const items = files.filter((f) => f.attachmentUrl);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-3xl">
          <div className="mb-5">
            <h2 className="font-display text-[20px]">{title}</h2>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
              Attachments shared in this project&apos;s chats — view PDFs, images and more.
            </p>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center"><Sym name="progress_activity" className="text-[28px] animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-12 text-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
              <Sym name="folder_open" className="text-[40px] opacity-40" />
              <p className="mt-2 font-semibold">No files yet</p>
              <p className="text-[13px]">Files uploaded in chat will appear here.</p>
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
              {items.map((f, i) => {
                const url = f.attachmentUrl!;
                const kind = fileKind(url);
                const k = KIND_META[kind];
                const fname = fileNameFromUrl(url);
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-black/[0.02]"
                    style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}
                  >
                    <div className="w-10 h-10 rounded flex items-center justify-center shrink-0" style={{ background: k.bg, color: k.fg }}>
                      <Sym name={k.icon} className="text-[20px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] truncate">{fname}</p>
                      <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                        {f.authorName || 'Team'}
                        {f.createdAt ? ` · ${new Date(f.createdAt).toLocaleDateString()}` : ''}
                        {' · '}{kind.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreview({ url, name: fname })}
                        className="px-2.5 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1"
                        style={{ color: 'var(--p-primary)' }}
                      >
                        <Sym name="visibility" className="text-[16px]" /> View
                      </button>
                      <a href={url} download className="p-2 rounded-lg hover:bg-black/5" title="Download">
                        <Sym name="download" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <FilePreviewModal
        open={preview != null}
        url={preview?.url ?? null}
        fileName={preview?.name}
        onClose={() => setPreview(null)}
      />
    </>
  );
}
