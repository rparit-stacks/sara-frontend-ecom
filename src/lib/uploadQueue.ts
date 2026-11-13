/**
 * Helpers for sending several attachments the way a messaging app does: shrink big photos first, upload a few at a
 * time, retry flaky uploads, and never let one failure take the others down.
 */

/** Phone photos are several MB; resize JPEG/WebP above ~1.2 MB to at most 2560px (quality .88). PNGs and everything
 *  else are sent untouched, because a print studio's PNG designs (often transparent) must stay pixel-perfect. */
export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!/^image\/(jpeg|webp)$/.test(file.type) || file.size < 1.2 * 1024 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2560 / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/** Run an async job, retrying with a growing pause. Errors that retrying cannot fix (file too big) fail at once. */
export async function withRetry<T>(job: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await job();
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : '';
      if (/exceeds|too large|10MB|unsupported/i.test(msg)) throw e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Upload failed');
}

/** Start the jobs with at most `limit` running at once; returns one promise per job, in the same order. */
export function startLimited<T>(jobs: Array<() => Promise<T>>, limit = 3): Array<Promise<T>> {
  let running = 0;
  const waiting: Array<() => void> = [];
  const acquire = () => new Promise<void>((resolve) => {
    if (running < limit) { running++; resolve(); } else waiting.push(() => { running++; resolve(); });
  });
  const release = () => { running--; waiting.shift()?.(); };
  return jobs.map(async (job) => {
    await acquire();
    try { return await job(); } finally { release(); }
  });
}
