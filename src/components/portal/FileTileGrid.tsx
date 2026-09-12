import { useState } from 'react';
import { Sym } from '@/components/portal/Sym';
import { fileKind } from '@/lib/clientPortalAggregate';

/**
 * The shared "files as visible thumbnails" grid used by every portal surface
 * that lists attachments — the per-project Files panel (customer *and* admin,
 * both of which render `ProjectFilesPanel`) and the cross-project browser
 * (`PortalFiles`).
 *
 * The point is that a user should recognise a file without opening it: every
 * image renders its real thumbnail, and everything else gets a same-size
 * type-icon tile so the grid stays uniform. Filenames are always visible as a
 * caption, with the full name on hover via `title`.
 *
 * It owns no modal — the caller decides what a click does (the customer/admin
 * panel opens the existing `FilePreviewModal`; the browser opens the file),
 * so this component is presentation only.
 */

export const KIND_META = {
  pdf: { icon: 'picture_as_pdf', bg: 'rgba(186,26,26,0.1)', fg: 'var(--p-error)' },
  image: { icon: 'image', bg: 'rgba(0,103,106,0.1)', fg: 'var(--p-primary)' },
  doc: { icon: 'description', bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  video: { icon: 'movie', bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface)' },
  other: { icon: 'attach_file', bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface)' },
} as const;

export type FileTile = {
  /** Unique within one grid. */
  key: string;
  url: string;
  name: string;
  /** Small line under the filename — project title, or author · date. */
  meta?: string;
};

/**
 * One tile. Images start optimistic (render the `<img>`) and fall back to the
 * type-icon tile on `onError`, so a dead/expired URL shows a labelled file
 * card instead of an empty box.
 */
function Tile({
  file,
  onOpen,
  showDownload,
}: {
  file: FileTile;
  onOpen: (file: FileTile) => void;
  showDownload?: boolean;
}) {
  const kind = fileKind(file.name || file.url);
  const meta = KIND_META[kind];
  const [broken, setBroken] = useState(false);
  const showImage = kind === 'image' && !broken;

  return (
    <div
      className="group relative border rounded-xl overflow-hidden card-hover"
      style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
    >
      <button
        type="button"
        onClick={() => onOpen(file)}
        title={file.name}
        aria-label={`Open ${file.name}`}
        className="block w-full text-left"
      >
        <div
          className="aspect-square w-full flex items-center justify-center overflow-hidden"
          style={{ background: showImage ? 'var(--p-surface-container)' : meta.bg }}
        >
          {showImage ? (
            <img
              src={file.url}
              alt={file.name}
              loading="lazy"
              onError={() => setBroken(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 px-2">
              <Sym name={meta.icon} className="text-[34px]" style={{ color: meta.fg }} />
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: meta.fg }}>
                {kind === 'other' ? 'File' : kind}
              </span>
            </div>
          )}
        </div>
        <div className="p-2.5">
          <p className="font-semibold text-[12px] truncate">{file.name}</p>
          {file.meta ? (
            <p className="text-[10.5px] mt-0.5 truncate" style={{ color: 'var(--p-on-surface-variant)' }}>
              {file.meta}
            </p>
          ) : null}
        </div>
      </button>

      {showDownload ? (
        <a
          href={file.url}
          download
          title="Download"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          style={{ background: 'var(--p-surface)', color: 'var(--p-primary)' }}
        >
          <Sym name="download" className="text-[16px]" />
        </a>
      ) : null}
    </div>
  );
}

export default function FileTileGrid({
  files,
  onOpen,
  showDownload = true,
}: {
  files: FileTile[];
  onOpen: (file: FileTile) => void;
  /** Hover download affordance — off where the tile itself already downloads. */
  showDownload?: boolean;
}) {
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {files.map((f) => (
        <Tile key={f.key} file={f} onOpen={onOpen} showDownload={showDownload} />
      ))}
    </div>
  );
}
