import { Sym } from './Sym';

/** Same per-type classification web already uses elsewhere for the full-screen viewer
 *  (FilePreviewModal / clientPortalAggregate's fileKind) — reused here so the inline chat
 *  bubble agrees with the modal about what a file "is", instead of every non-image/non-audio
 *  attachment collapsing into one generic grey button regardless of type. */
export type AttachmentKind = 'pdf' | 'doc' | 'video' | 'other';

export function classifyAttachment(nameOrUrl: string): AttachmentKind {
  const lower = nameOrUrl.toLowerCase().split('?')[0];
  if (/\.pdf$/.test(lower)) return 'pdf';
  if (/\.(mp4|mov|webm|m4v)$/.test(lower)) return 'video';
  if (/\.(docx?|xlsx?|pptx?)$/.test(lower)) return 'doc';
  return 'other';
}

const ICON: Record<AttachmentKind, string> = {
  pdf: 'picture_as_pdf',
  doc: 'description',
  video: 'movie',
  other: 'insert_drive_file',
};

// Distinct per-kind color so a PDF, an Office doc and "everything else" read apart at a
// glance — mirrors sara-admin-mobile's FilePreviewTile (pdf=destructive/red, doc=muted,
// video=violet), rather than every kind sharing one flat primary-teal button.
const COLOR: Record<AttachmentKind, string> = {
  pdf: 'var(--p-error)',
  doc: 'var(--p-on-surface-variant)',
  video: '#6D28D9',
  other: 'var(--p-primary)',
};

const LABEL: Record<AttachmentKind, string> = {
  pdf: 'PDF',
  doc: 'Document',
  video: 'Video',
  other: 'File',
};

/**
 * Chat-bubble file/document card — replaces the one-size-fits-all grey button both
 * ClientWorkspacePreview.tsx and AdminClientWorkspacePreview.tsx used to render for every
 * non-image/non-audio attachment. Gives each kind its own icon/color and an extension badge
 * next to the filename, the same distinguishing information sara-admin-mobile's
 * FilePreviewTile already shows (this app has no file-size metadata to add, since the
 * backend message payload never carries it — see fileNameFromUrl/originalNameFromUrl).
 */
export function AttachmentFileCard({
  name,
  url,
  onOpen,
  bubbleBg,
  bubbleColor,
}: {
  name: string;
  url?: string;
  onOpen?: () => void;
  bubbleBg?: string;
  bubbleColor?: string;
}) {
  const kind = classifyAttachment(name || url || '');
  const ext = (name.split('.').pop() || '').toUpperCase();
  const sub = ext && ext !== name.toUpperCase() ? `${LABEL[kind]} · ${ext}` : LABEL[kind];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-2xl flex items-center gap-2.5 px-3 py-2.5 border text-left min-w-[200px] max-w-[280px]"
      style={{ borderColor: 'var(--p-outline-variant)', background: bubbleBg ?? 'var(--p-surface-container-lowest)' }}
    >
      <span
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `color-mix(in srgb, ${COLOR[kind]} 14%, transparent)` }}
      >
        <Sym name={ICON[kind]} className="text-[20px]" style={{ color: COLOR[kind] }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold truncate" style={{ color: bubbleColor }}>
          {name}
        </span>
        <span className="block text-[11.5px] mt-0.5" style={{ color: bubbleColor ? undefined : 'var(--p-on-surface-variant)', opacity: bubbleColor ? 0.75 : 1 }}>
          {sub}
        </span>
      </span>
      <Sym name="visibility" className="text-[16px] shrink-0" style={{ color: bubbleColor, opacity: 0.7 }} />
    </button>
  );
}

export default AttachmentFileCard;
