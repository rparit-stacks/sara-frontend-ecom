import { useState, useRef, useEffect, useCallback, KeyboardEvent, ClipboardEvent, DragEvent } from 'react';
import { Send, Paperclip, X, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiChatApi } from '@/lib/api';

interface ComposerProps {
  onSend: (text: string, imageUrls?: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // matches the backend's cap

interface PendingImage {
  id: string;
  previewUrl: string; // local object URL, shown immediately
  uploadedUrl: string | null; // set once the backend upload resolves
  status: 'uploading' | 'done' | 'error';
}

function collectImageFiles(list: FileList | File[] | null | undefined): File[] {
  if (!list) return [];
  return Array.from(list).filter(
    (file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_SIZE_BYTES
  );
}

export function Composer({ onSend, disabled, placeholder, autoFocus }: ComposerProps) {
  const [value, setValue] = useState('');
  const [images, setImages] = useState<PendingImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  // Revoke local object URLs on unmount to avoid leaking memory.
  useEffect(() => {
    return () => images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isUploading = images.some((img) => img.status === 'uploading');

  const addImageFiles = useCallback((files: File[]) => {
    if (disabled || files.length === 0) return;

    for (const file of files) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = URL.createObjectURL(file);
      setImages((prev) => [...prev, { id, previewUrl, uploadedUrl: null, status: 'uploading' }]);

      aiChatApi
        .uploadImage(file)
        .then(({ url }) => {
          setImages((prev) =>
            prev.map((img) => (img.id === id ? { ...img, uploadedUrl: url, status: 'done' } : img))
          );
        })
        .catch(() => {
          setImages((prev) => prev.map((img) => (img.id === id ? { ...img, status: 'error' } : img)));
        });
    }
  }, [disabled]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = collectImageFiles(e.target.files);
    e.target.value = ''; // allow re-selecting the same file later
    addImageFiles(files);
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    const imageFiles = collectImageFiles(files);
    if (imageFiles.length === 0) return;

    e.preventDefault(); // don't also paste a binary filename / junk into the textarea
    addImageFiles(imageFiles);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (disabled) return;
    addImageFiles(collectImageFiles(e.dataTransfer?.files));
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const submit = () => {
    const trimmed = value.trim();
    const readyImages = images.filter((img) => img.status === 'done' && img.uploadedUrl);
    if (!trimmed && readyImages.length === 0) return;
    if (disabled || isUploading) return;

    onSend(trimmed || 'Here is an image.', readyImages.map((img) => img.uploadedUrl!) || undefined);
    setValue('');
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  const canSend = !disabled && !isUploading && (value.trim().length > 0 || images.some((i) => i.status === 'done'));

  return (
    <div
      className="relative border-t border-border bg-white"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-t-2xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm">
            <ImagePlus className="h-4 w-4 text-primary" />
            Drop images here
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-3 pt-3">
          {images.map((img) => (
            <div key={img.id} className="relative shrink-0">
              <img
                src={img.previewUrl}
                alt="Preview"
                className={`h-16 w-16 rounded-xl object-cover ring-1 ring-black/[0.06] ${
                  img.status === 'error' ? 'opacity-40' : ''
                }`}
              />
              {img.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-white shadow-sm"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          aria-label="Attach an image"
          title="Attach image (or paste / drag & drop)"
        >
          <Paperclip className="h-4.5 w-4.5" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={placeholder ?? 'Type, paste, or drop an image…'}
          rows={1}
          className="max-h-24 flex-1 resize-none rounded-2xl border border-input bg-muted/40 px-4 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-white disabled:opacity-50"
        />
        <Button
          size="icon"
          onClick={submit}
          disabled={!canSend}
          className="h-10 w-10 shrink-0 rounded-full shadow-soft"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
