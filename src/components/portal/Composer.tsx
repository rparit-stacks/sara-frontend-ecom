import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Sym } from './Sym';
import { htmlToMarkdown, isEditorEmpty } from '@/lib/messageFormat';

export interface Attachment {
  id: string;
  kind: 'image' | 'file';
  name: string;
  size: string;
  url: string;
  file?: File;
}

let uid = 0;
const fmtSize = (bytes: number) => (bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

function ToolbarBtn({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className="p-1.5 rounded-md hover:bg-black/6 transition-colors disabled:opacity-40 w-8 h-8 flex items-center justify-center"
    >
      {children}
    </button>
  );
}

/**
 * Slack-style WYSIWYG composer — formatting toolbar applies visual styles; stored as markdown.
 */
export default function Composer({
  placeholder,
  compact = false,
  onSend,
}: {
  placeholder: string;
  compact?: boolean;
  onSend: (text: string, attachments: Attachment[]) => void | Promise<void>;
}) {
  const [atts, setAtts] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const [empty, setEmpty] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const syncEmpty = useCallback(() => {
    setEmpty(isEditorEmpty(editorRef.current));
  }, []);

  useEffect(() => {
    syncEmpty();
  }, [syncEmpty]);

  const focusEditor = () => editorRef.current?.focus();

  const exec = (cmd: string, val?: string) => {
    focusEditor();
    document.execCommand(cmd, false, val);
    syncEmpty();
  };

  const wrapCode = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const code = document.createElement('code');
    code.style.background = 'var(--p-surface-container-high)';
    code.style.padding = '1px 4px';
    code.style.borderRadius = '3px';
    code.style.fontSize = '0.9em';
    try {
      range.surroundContents(code);
    } catch {
      code.appendChild(range.extractContents());
      range.insertNode(code);
    }
    syncEmpty();
    focusEditor();
  };

  const addLink = () => {
    const url = window.prompt('Link URL');
    if (url) exec('createLink', url);
  };

  const addFiles = (files: FileList | null, kind: 'image' | 'file') => {
    if (!files) return;
    const next: Attachment[] = Array.from(files).map((f) => ({
      id: `a${uid++}`,
      kind,
      name: f.name,
      size: fmtSize(f.size),
      url: URL.createObjectURL(f),
      file: f,
    }));
    setAtts((xs) => [...xs, ...next]);
  };

  const removeAtt = (id: string) =>
    setAtts((xs) => {
      const found = xs.find((a) => a.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return xs.filter((a) => a.id !== id);
    });

  const canSend = (!empty || atts.length > 0) && !sending;

  const getText = () => htmlToMarkdown(editorRef.current?.innerHTML || '');

  const submit = async () => {
    if (!canSend) return;
    const text = getText();
    const outgoing = atts;
    const hasAttachments = outgoing.length > 0;

    // Clear the input immediately so the next message can be typed while this one
    // is still in flight — Slack-style. Text-only messages never block the box.
    if (editorRef.current) editorRef.current.innerHTML = '';
    setEmpty(true);
    setAtts([]);

    // Only show the blocking "sending" state when a file/image is actually
    // being uploaded (that genuinely needs to finish before the message posts).
    if (hasAttachments) {
      setSending(true);
      setUploadLabel(outgoing.some((a) => a.kind === 'image') ? 'Uploading image…' : 'Uploading file…');
    }
    try {
      await onSend(text, outgoing);
    } finally {
      outgoing.forEach((a) => URL.revokeObjectURL(a.url));
      if (hasAttachments) {
        setSending(false);
        setUploadLabel('');
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const toolbar = (
    <div className="px-2 py-1 flex items-center gap-0.5 border-b" style={{ background: 'var(--p-surface-container-low)', borderColor: 'var(--p-outline-variant)' }}>
      <ToolbarBtn title="Bold" disabled={sending} onClick={() => exec('bold')}>
        <span className="font-bold text-[14px]">B</span>
      </ToolbarBtn>
      <ToolbarBtn title="Italic" disabled={sending} onClick={() => exec('italic')}>
        <span className="italic text-[14px]">I</span>
      </ToolbarBtn>
      <ToolbarBtn title="Code" disabled={sending} onClick={wrapCode}>
        <Sym name="code" className="text-[17px]" style={{ color: 'var(--p-on-surface-variant)' }} />
      </ToolbarBtn>
      <ToolbarBtn title="Link" disabled={sending} onClick={addLink}>
        <Sym name="link" className="text-[17px]" style={{ color: 'var(--p-on-surface-variant)' }} />
      </ToolbarBtn>
      <ToolbarBtn title="Bullet list" disabled={sending} onClick={() => exec('insertUnorderedList')}>
        <Sym name="format_list_bulleted" className="text-[17px]" style={{ color: 'var(--p-on-surface-variant)' }} />
      </ToolbarBtn>
    </div>
  );

  return (
    <div
      className={`border rounded-xl overflow-hidden slack-input-shadow focus-within:ring-2 focus-within:ring-offset-0 transition-all relative ${sending ? 'opacity-90' : ''}`}
      style={{ borderColor: 'var(--p-outline)', background: 'var(--p-surface-container-lowest)', ['--tw-ring-color' as string]: 'rgba(0,103,106,0.25)' }}
    >
      {toolbar}

      {sending && (
        <div className="px-3 py-2 flex items-center gap-2 text-[12px] font-semibold border-b animate-pulse" style={{ background: 'rgba(0,103,106,0.08)', borderColor: 'var(--p-outline-variant)', color: 'var(--p-primary)' }}>
          <Sym name="cloud_upload" className="text-[16px]" />
          {uploadLabel}
        </div>
      )}

      {atts.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {atts.map((a) =>
            a.kind === 'image' ? (
              <div key={a.id} className="relative w-16 h-16 rounded-lg overflow-hidden border group" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <img src={a.url} className="w-full h-full object-cover" alt={a.name} />
                {!sending && (
                  <button type="button" onClick={() => removeAtt(a.id)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sym name="close" className="text-[14px]" />
                  </button>
                )}
              </div>
            ) : (
              <div key={a.id} className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg border" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
                <Sym name="description" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
                <div className="text-[12px] max-w-[120px]">
                  <p className="truncate font-semibold">{a.name}</p>
                  <p style={{ color: 'var(--p-on-surface-variant)' }}>{a.size}</p>
                </div>
                {!sending && (
                  <button type="button" onClick={() => removeAtt(a.id)} className="p-0.5 rounded hover:bg-black/10"><Sym name="close" className="text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }} /></button>
                )}
              </div>
            ),
          )}
        </div>
      )}

      <div className="relative">
        {empty && (
          <div
            className="absolute left-4 top-2.5 text-[15px] pointer-events-none select-none"
            style={{ color: 'var(--p-on-surface-variant)', opacity: 0.65 }}
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!sending}
          suppressContentEditableWarning
          onInput={syncEmpty}
          onKeyDown={onKeyDown}
          className={`w-full px-4 py-2.5 bg-transparent border-none outline-none text-[15px] block ${compact ? 'min-h-[38px] max-h-[120px]' : 'min-h-[44px] max-h-[200px]'} overflow-y-auto disabled:opacity-60 composer-editor`}
          style={{ wordBreak: 'break-word' }}
        />
      </div>

      <div className="px-2.5 pb-2 flex justify-between items-center">
        <div className="flex items-center gap-0.5">
          <button type="button" disabled={sending} onClick={() => fileInput.current?.click()} title="Attach file" className="p-1.5 rounded-md hover:bg-black/6 transition-colors">
            <Sym name="attach_file" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
          </button>
          <button type="button" disabled={sending} onClick={() => imgInput.current?.click()} title="Add image" className="p-1.5 rounded-md hover:bg-black/6 transition-colors">
            <Sym name="image" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
          </button>
          <input ref={imgInput} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files, 'image'); e.target.value = ''; }} />
          <input ref={fileInput} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files, 'file'); e.target.value = ''; }} />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          className="p-2 rounded-lg flex items-center justify-center transition-all min-w-[40px]"
          style={canSend ? { background: 'var(--p-primary)', color: '#fff' } : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)', cursor: 'not-allowed' }}
        >
          {sending ? <Sym name="progress_activity" className="text-[18px] animate-spin" /> : <Sym name="send" className="text-[18px]" />}
        </button>
      </div>
    </div>
  );
}
