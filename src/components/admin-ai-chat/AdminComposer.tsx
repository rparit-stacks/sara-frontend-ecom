import { useCallback, useEffect, useRef, useState, KeyboardEvent } from 'react';
import { ImagePlus, Loader2, Send, X } from 'lucide-react';
import { adminAiChatApi } from '@/lib/api';

interface Props {
  onSend: (text: string, imageUrls?: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

interface PendingImage {
  id: string;
  previewUrl: string;
  uploadedUrl: string | null;
  status: 'uploading' | 'done' | 'error';
}

export function AdminComposer({ onSend, disabled, placeholder }: Props) {
  const [value, setValue] = useState('');
  const [images, setImages] = useState<PendingImage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploading = images.some((i) => i.status === 'uploading');

  const addFiles = useCallback(
    (files: File[]) => {
      if (disabled) return;
      for (const file of files) {
        if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) continue;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const previewUrl = URL.createObjectURL(file);
        setImages((prev) => [...prev, { id, previewUrl, uploadedUrl: null, status: 'uploading' }]);
        adminAiChatApi
          .uploadImage(file)
          .then(({ url }) => {
            setImages((prev) =>
              prev.map((img) => (img.id === id ? { ...img, uploadedUrl: url, status: 'done' } : img))
            );
          })
          .catch(() => {
            setImages((prev) =>
              prev.map((img) => (img.id === id ? { ...img, status: 'error' } : img))
            );
          });
      }
    },
    [disabled]
  );

  const submit = () => {
    const text = value.trim();
    const urls = images.filter((i) => i.status === 'done' && i.uploadedUrl).map((i) => i.uploadedUrl!);
    if ((!text && urls.length === 0) || disabled || uploading) return;
    onSend(text || (urls.length ? `Uploaded ${urls.length} image(s)` : ''), urls.length ? urls : undefined);
    setValue('');
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-slate-100 bg-white p-3">
      {images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative h-14 w-14 overflow-hidden rounded-lg ring-1 ring-slate-200">
              <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
              {img.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                </div>
              )}
              {img.status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-600/80 text-[10px] text-white">
                  err
                </div>
              )}
              <button
                type="button"
                className="absolute right-0.5 top-0.5 rounded-full bg-slate-800/70 p-0.5"
                onClick={() => {
                  URL.revokeObjectURL(img.previewUrl);
                  setImages((prev) => prev.filter((x) => x.id !== img.id));
                }}
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 focus-within:border-amber-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-100">
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
          className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40"
          title="Upload image for CMS / product"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          multiple
          onChange={(e) => {
            addFiles(Array.from(e.target.files || []));
            e.target.value = '';
          }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={placeholder || 'Ask ops AI…'}
          className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || uploading || (!value.trim() && images.every((i) => i.status !== 'done'))}
          className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white transition hover:bg-amber-600 disabled:opacity-40"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
