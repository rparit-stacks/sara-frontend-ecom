/** Tiny pub/sub so a @file chip (rendered by RichMessageBody, possibly deep inside a thread
 *  panel) can ask the workspace page's FilePreviewModal to open — without prop-drilling a
 *  setPreview callback through every intermediate component. The workspace page subscribes
 *  once via onFilePreviewRequest; RichMessageBody only ever calls setPendingFilePreview. */
export interface FilePreviewRequest {
  url: string;
  name: string;
}

type Listener = (req: FilePreviewRequest) => void;
const listeners = new Set<Listener>();

export function setPendingFilePreview(req: FilePreviewRequest) {
  listeners.forEach((l) => l(req));
}

export function onFilePreviewRequest(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
