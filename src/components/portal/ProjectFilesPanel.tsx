import { useState } from 'react';
import { Sym } from '@/components/portal/Sym';
import FilePreviewModal from '@/components/portal/FilePreviewModal';
import FileTileGrid, { type FileTile } from '@/components/portal/FileTileGrid';
import type { ProjectMessageDto } from '@/lib/api';

/**
 * The per-project Files panel, rendered by BOTH the customer workspace
 * (`pages/portal/ClientWorkspacePreview.tsx`) and its admin twin
 * (`pages/portal/admin/AdminClientWorkspacePreview.tsx`) — so the grid below
 * is the single source of truth for both surfaces.
 */

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
  const items: FileTile[] = files.flatMap((f) => {
    const urls = f.attachmentUrls && f.attachmentUrls.length > 0 ? f.attachmentUrls : (f.attachmentUrl ? [f.attachmentUrl] : []);
    return urls.map((url, i) => ({
      key: `${f.id}-${i}`,
      url,
      name: fileNameFromUrl(url),
      meta: `${f.authorName || 'Team'}${f.createdAt ? ` · ${new Date(f.createdAt).toLocaleDateString()}` : ''}`,
    }));
  });
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-5xl">
          <div className="mb-5">
            <h2 className="font-bold text-[20px]">{title}</h2>
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
            <FileTileGrid files={items} onOpen={(f) => setPreview({ url: f.url, name: f.name })} />
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
