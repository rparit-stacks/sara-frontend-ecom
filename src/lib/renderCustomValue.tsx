import type { ReactNode } from 'react';

export interface RenderCustomValueOptions {
  /** When true, file/URL values show only [ View File ] [ Download File ] buttons, no image preview. Used in admin ledger. */
  ledgerMode?: boolean;
}

/**
 * Renders a custom field value for display in order details and modals.
 * URLs and Cloudinary links become clickable View/Download links; images get a thumbnail + link.
 * With ledgerMode: true, file/URL values show only buttons (no image).
 */
export function renderCustomValue(value: unknown, options?: RenderCustomValueOptions): ReactNode {
  const ledgerMode = options?.ledgerMode === true;
  if (value == null) return '—';
  if (typeof value === 'string') {
    const isUrl = /^https?:\/\//i.test(value);
    const hasImageExt = /\.(png|jpe?g|gif|webp|svg)$/i.test(value);
    const isCloudinary = value.includes('cloudinary.com');
    const showAsImage = !ledgerMode && isUrl && (hasImageExt || isCloudinary);
    if (ledgerMode && isUrl) {
      return (
        <span className="inline-flex gap-2 flex-wrap">
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium underline text-primary"
          >
            [ View File ]
          </a>
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            download
            className="text-xs font-medium underline text-primary"
          >
            [ Download File ]
          </a>
        </span>
      );
    }
    if (showAsImage) {
      return (
        <span className="inline-flex flex-col gap-1">
          <a href={value} target="_blank" rel="noreferrer" className="inline-block">
            <img src={value} alt="Uploaded file" className="w-24 h-24 object-cover rounded border" />
          </a>
          <a href={value} target="_blank" rel="noreferrer" download className="text-primary underline break-all text-xs font-medium">
            View / Download
          </a>
        </span>
      );
    }
    if (isUrl) {
      return (
        <a href={value} target="_blank" rel="noreferrer" download className="text-primary underline break-all font-medium">
          View / Download
        </a>
      );
    }
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}
