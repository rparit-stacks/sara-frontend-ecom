import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Sym } from './Sym';
import { htmlToMarkdown, isEditorEmpty } from '@/lib/messageFormat';
import EmojiPicker from './EmojiPicker';
import ProductPickerModal, { type ProductPickerItem } from './ProductPickerModal';
import FilePreviewModal from './FilePreviewModal';
import { buildProductMarker } from './ProductCard';
import { buildFileTagMarker, type EntityTagType } from './EntityTagCard';
import { ANNOUNCEMENT_CATEGORIES } from '@/lib/portalChatConstants';
import { applyFormat, handleListEnter, readFormatState, wrapSelectionInCode, type FormatState } from '@/lib/richEditor';
import { handleInlineAutoFormat, handleListShortcut, handleAutoLink } from '@/lib/autoFormat';

export interface Attachment {
  id: string;
  kind: 'image' | 'file';
  name: string;
  size: string;
  url: string;
  file?: File;
}

/** One @-mention search result — pre-flattened by the caller (who owns the actual API
 *  calls per entity type) so Composer stays entity-agnostic: it just renders label/sublabel/
 *  icon-by-type and inserts `marker` verbatim as the chip's underlying [[type:...]] text. */
export interface MentionResult {
  type: EntityTagType;
  marker: string;
  label: string;
  sublabel?: string;
}

const MENTION_ICON: Record<EntityTagType, string> = {
  project: 'folder',
  design: 'palette',
  invoice: 'receipt_long',
  quote: 'request_quote',
  file: 'attach_file',
};

let uid = 0;
const fmtSize = (bytes: number) => (bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

function ToolbarBtn({ title, onClick, disabled, active, children }: {
  title: string; onClick: () => void; disabled?: boolean; active?: boolean; children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-md hover:bg-black/6 transition-colors disabled:opacity-40 w-8 h-8 flex items-center justify-center ${active ? 'ring-2 ring-[var(--p-primary)]/30 bg-black/6' : ''}`}
    >
      {children}
    </button>
  );
}

export default function Composer({
  placeholder,
  compact = false,
  showProductAttach = false,
  showAnnouncementCategory = false,
  showAskSara = false,
  onRequestPayment,
  onSearchMentions,
  onPickFileTag,
  onSend,
}: {
  placeholder: string;
  compact?: boolean;
  showProductAttach?: boolean;
  showAnnouncementCategory?: boolean;
  /** Feature 3 — insert `@sara ` so the customer can ask Portal AI in-channel. */
  showAskSara?: boolean;
  /** When provided, "/payment" is offered in the slash-command menu — opens the caller's own
   *  Request Payment flow (amount/label/description), same as its dedicated header button. */
  onRequestPayment?: () => void;
  /** When provided, typing "@" opens an entity-mention search box (scoped to whatever the
   *  caller wants to allow — the caller owns the actual API calls and picks which entity
   *  types to search, e.g. project+design+invoice+quote in parallel). */
  onSearchMentions?: (q: string) => Promise<MentionResult[]>;
  /** When provided, the @-mention dropdown offers a "Files" row that calls this to let the
   *  user browse/pick an already-uploaded file (files have no text-searchable metadata, so
   *  they're tagged via a picker instead of live search). Resolve null if the user cancels. */
  onPickFileTag?: () => Promise<{ url: string; name: string } | null>;
  onSend: (text: string, attachments: Attachment[], opts?: { announcementCategory?: string }) => void | Promise<void>;
}) {
  const [atts, setAtts] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const [empty, setEmpty] = useState(true);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductPickerItem | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [announcementCategory, setAnnouncementCategory] = useState(ANNOUNCEMENT_CATEGORIES[0].key);
  const [fmt, setFmt] = useState<FormatState>({ bold: false, italic: false, underline: false, unorderedList: false, orderedList: false });
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionResult[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
  const mentionRangeRef = useRef<Range | null>(null);
  const mentionSeqRef = useRef(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const syncEmpty = useCallback(() => {
    setEmpty(isEditorEmpty(editorRef.current));
  }, []);

  const syncFmt = useCallback(() => {
    setFmt(readFormatState());
  }, []);

  useEffect(() => { syncEmpty(); }, [syncEmpty]);

  useEffect(() => {
    const onSel = () => syncFmt();
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, [syncFmt]);

  const focusEditor = () => editorRef.current?.focus();

  const runFormat = (cmd: string, val?: string) => {
    focusEditor();
    applyFormat(cmd, val);
    syncEmpty();
    syncFmt();
  };

  const addLink = () => {
    const url = window.prompt('Link URL (include https://)');
    if (!url) return;
    const href = url.startsWith('http') ? url : `https://${url}`;
    const sel = window.getSelection();
    if (sel && sel.isCollapsed) {
      runFormat('insertHTML', `<a href="${href}">${href}</a>`);
    } else {
      runFormat('createLink', href);
    }
  };

  const insertText = (text: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    focusEditor();
    let inserted = false;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        const node = document.createTextNode(text);
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        inserted = true;
      }
    }
    if (!inserted) {
      const needsBreak = (editor.textContent || '').trim().length > 0;
      if (needsBreak) editor.appendChild(document.createElement('br'));
      editor.appendChild(document.createTextNode(text));
    }
    syncEmpty();
    syncFmt();
  };

  const addFiles = (files: FileList | File[] | null, kind?: 'image' | 'file') => {
    if (!files) return;
    const arr = Array.from(files);
    if (arr.length === 0) return;
    const next: Attachment[] = arr.map((f) => {
      const k = kind ?? (f.type.startsWith('image/') ? 'image' : 'file');
      // Pasted screenshots often have no filename — give them a sensible one.
      const name = f.name && f.name.trim() ? f.name : `pasted-${Date.now()}.${(f.type.split('/')[1] || 'png')}`;
      return { id: `a${uid++}`, kind: k, name, size: fmtSize(f.size), url: URL.createObjectURL(f), file: f };
    });
    setAtts((xs) => [...xs, ...next]);
  };

  const onDrop = (e: React.DragEvent) => {
    if (sending) return;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      e.preventDefault();
      setDragOver(false);
      addFiles(files);
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    if (sending) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const pasted: File[] = [];
    for (const it of Array.from(items)) {
      if (it.kind === 'file') {
        const f = it.getAsFile();
        if (f) pasted.push(f);
      }
    }
    if (pasted.length > 0) {
      // Files present (e.g. a screenshot) — attach them and let text paste proceed as normal.
      e.preventDefault();
      addFiles(pasted);
    }
    // No files: do nothing, let the browser paste text into the contentEditable.
  };

  const removeAtt = (id: string) =>
    setAtts((xs) => {
      const found = xs.find((a) => a.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return xs.filter((a) => a.id !== id);
    });

  const canSend = (!empty || atts.length > 0 || !!selectedProduct) && !sending;
  const getText = () => htmlToMarkdown(editorRef.current?.innerHTML || '');

  const submit = async () => {
    if (!canSend) return;
    const text = getText();
    const marker = selectedProduct ? buildProductMarker(selectedProduct) : '';
    const payload = text && marker ? `${text}\n\n${marker}` : (text || marker);
    const outgoing = atts;
    const hasAttachments = outgoing.length > 0;
    if (editorRef.current) editorRef.current.innerHTML = '';
    setEmpty(true);
    setAtts([]);
    setSelectedProduct(null);
    setMentionQuery(null);
    mentionRangeRef.current = null;
    // Always mark sending — not just when uploading attachments. A text-only send can still
    // take a while (e.g. an AI auto-reply turn) with nothing else disabling the button in the
    // meantime, which previously let a fast double-Enter/double-click submit the same message twice.
    setSending(true);
    if (hasAttachments) {
      setUploadLabel(outgoing.some((a) => a.kind === 'image') ? 'Uploading image…' : 'Uploading file…');
    }
    try {
      await onSend(payload, outgoing, showAnnouncementCategory ? { announcementCategory } : undefined);
    } finally {
      outgoing.forEach((a) => URL.revokeObjectURL(a.url));
      setSending(false);
      if (hasAttachments) setUploadLabel('');
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (mentionQuery != null && mentionResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionActiveIndex((i) => (i + 1) % mentionResults.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionActiveIndex((i) => (i - 1 + mentionResults.length) % mentionResults.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionResults[mentionActiveIndex]);
        return;
      }
    }
    if (mentionQuery != null && e.key === 'Escape') {
      e.preventDefault();
      setMentionQuery(null);
      return;
    }
    if (slashMenuOpen && e.key === 'Escape') {
      e.preventDefault();
      setSlashMenuOpen(false);
      return;
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
      return;
    }
    if (slashMenuOpen && e.key === 'Enter') {
      // Bare "/" + Enter runs the only/first available command rather than sending "/" as a message.
      e.preventDefault();
      if (showProductAttach) runSlashCommand('product');
      else if (onRequestPayment) runSlashCommand('payment');
      return;
    }
    // Slack/WhatsApp-style: "- " / "* " / "1. " + Space starts a list.
    if (e.key === ' ' && handleListShortcut(e, editorRef.current)) {
      syncEmpty();
      syncFmt();
      return;
    }
    // Space also finalizes a bare URL into a clickable link.
    if (e.key === ' ') {
      // Let the space land first, then linkify on the next tick.
      setTimeout(() => { handleAutoLink(editorRef.current); syncFmt(); }, 0);
    }
    if (handleListEnter(e, editorRef.current)) {
      syncEmpty();
      syncFmt();
    }
  };

  const detectMention = useCallback(() => {
    if (!onSearchMentions && !onPickFileTag) return;
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0 || !sel.isCollapsed) {
      setMentionQuery(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE || !editor.contains(node)) {
      setMentionQuery(null);
      return;
    }
    const textBefore = (node.textContent || '').slice(0, range.startOffset);
    const match = textBefore.match(/(?:^|\s)@([\w-]*)$/);
    if (!match) {
      setMentionQuery(null);
      return;
    }
    const markerRange = range.cloneRange();
    markerRange.setStart(node, textBefore.length - match[1].length - 1);
    mentionRangeRef.current = markerRange;
    setMentionQuery(match[1]);
    setMentionActiveIndex(0);
  }, [onSearchMentions, onPickFileTag]);

  useEffect(() => {
    if (mentionQuery == null || !onSearchMentions) {
      setMentionResults([]);
      return;
    }
    const seq = ++mentionSeqRef.current;
    if (!mentionQuery.trim()) {
      setMentionResults([]);
      setMentionLoading(false);
      return;
    }
    setMentionLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await onSearchMentions(mentionQuery);
        if (mentionSeqRef.current === seq) {
          setMentionResults(results);
          setMentionLoading(false);
        }
      } catch {
        if (mentionSeqRef.current === seq) setMentionLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [mentionQuery, onSearchMentions]);

  /** Inserts a non-editable chip span at the saved mention range — its underlying
   *  [[type:...]] marker text is read back out by htmlToMarkdown at submit time. */
  const insertMentionMarker = (marker: string, label: string) => {
    const editor = editorRef.current;
    const range = mentionRangeRef.current;
    if (!editor || !range) return;
    range.deleteContents();
    const span = document.createElement('span');
    span.setAttribute('data-project-marker', encodeURIComponent(marker));
    span.contentEditable = 'false';
    span.className = 'project-tag-chip';
    span.style.cssText = 'display:inline-flex;align-items:center;padding:1px 6px;border-radius:6px;font-weight:600;font-size:13px;background:rgba(0,103,106,0.14);color:var(--p-primary);';
    span.textContent = label;
    range.insertNode(span);
    const spaceNode = document.createTextNode(' ');
    span.after(spaceNode);
    editor.focus();
    const newRange = document.createRange();
    newRange.setStartAfter(spaceNode);
    newRange.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(newRange);
    setMentionQuery(null);
    mentionRangeRef.current = null;
    syncEmpty();
    syncFmt();
  };

  const insertMention = (r: MentionResult) => {
    insertMentionMarker(r.marker, r.label);
  };

  const pickFileTag = async () => {
    if (!onPickFileTag) return;
    const picked = await onPickFileTag();
    if (picked) insertMentionMarker(buildFileTagMarker(picked), picked.name);
  };

  const onInput = () => {
    // Inline markdown (**bold**, *italic*, `code`) formats the moment the closing char lands.
    handleInlineAutoFormat(editorRef.current);
    syncEmpty();
    syncFmt();
    // Slack-style slash command: bare "/" as the entire message opens the menu.
    setSlashMenuOpen((editorRef.current?.textContent || '') === '/');
    detectMention();
  };

  const clearEditor = () => {
    if (editorRef.current) editorRef.current.innerHTML = '';
    syncEmpty();
  };

  const runSlashCommand = (cmd: 'product' | 'payment') => {
    setSlashMenuOpen(false);
    clearEditor();
    focusEditor();
    if (cmd === 'product') setProductOpen(true);
    else onRequestPayment?.();
  };

  const toolbar = (
    <div className="px-2 py-1 flex items-center gap-0.5 border-b flex-wrap relative z-10" style={{ background: 'var(--p-surface-container-low)', borderColor: 'var(--p-outline-variant)' }}>
      <ToolbarBtn title="Bold (toggle)" disabled={sending} active={fmt.bold} onClick={() => runFormat('bold')}><span className="font-bold text-[14px]">B</span></ToolbarBtn>
      <ToolbarBtn title="Italic (toggle)" disabled={sending} active={fmt.italic} onClick={() => runFormat('italic')}><span className="italic text-[14px]">I</span></ToolbarBtn>
      <ToolbarBtn title="Underline (toggle)" disabled={sending} active={fmt.underline} onClick={() => runFormat('underline')}><span className="underline text-[14px]">U</span></ToolbarBtn>
      <ToolbarBtn title="Code" disabled={sending} onClick={() => { focusEditor(); wrapSelectionInCode(); syncEmpty(); syncFmt(); }}><Sym name="code" className="text-[17px]" style={{ color: 'var(--p-on-surface-variant)' }} /></ToolbarBtn>
      <ToolbarBtn title="Link" disabled={sending} onClick={addLink}><Sym name="link" className="text-[17px]" style={{ color: 'var(--p-on-surface-variant)' }} /></ToolbarBtn>
      <ToolbarBtn title="Bullet list" disabled={sending} active={fmt.unorderedList} onClick={() => runFormat('insertUnorderedList')}><Sym name="format_list_bulleted" className="text-[17px]" style={{ color: 'var(--p-on-surface-variant)' }} /></ToolbarBtn>
      <ToolbarBtn title="Numbered list" disabled={sending} active={fmt.orderedList} onClick={() => runFormat('insertOrderedList')}><Sym name="format_list_numbered" className="text-[17px]" style={{ color: 'var(--p-on-surface-variant)' }} /></ToolbarBtn>
      <button
        ref={emojiBtnRef}
        type="button"
        disabled={sending}
        title="Emoji"
        onClick={() => setEmojiOpen((v) => !v)}
        className="p-1.5 rounded-md hover:bg-black/6 transition-colors disabled:opacity-40 w-8 h-8 flex items-center justify-center"
      >
        <span className="text-[16px]">😊</span>
      </button>
      <EmojiPicker open={emojiOpen} anchorRef={emojiBtnRef} onClose={() => setEmojiOpen(false)} onPick={insertText} />
    </div>
  );

  return (
    <div
      className={`border rounded-xl slack-input-shadow focus-within:ring-2 focus-within:ring-offset-0 transition-all relative ${sending && uploadLabel ? 'opacity-90' : ''} ${dragOver ? 'ring-2' : ''}`}
      style={{ borderColor: dragOver ? 'var(--p-primary)' : 'var(--p-outline)', background: 'var(--p-surface-container-lowest)', ['--tw-ring-color' as string]: 'rgba(0,103,106,0.25)' }}
      onDragOver={(e) => { if (!sending && e.dataTransfer?.types?.includes('Files')) { e.preventDefault(); setDragOver(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
      onDrop={onDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl pointer-events-none" style={{ background: 'rgba(0,103,106,0.08)', border: '2px dashed var(--p-primary)' }}>
          <div className="flex items-center gap-2 text-[13px] font-bold px-3 py-1.5 rounded-lg" style={{ background: 'var(--p-surface-container-lowest)', color: 'var(--p-primary)' }}>
            <Sym name="upload_file" className="text-[18px]" />Drop to attach
          </div>
        </div>
      )}
      {mentionQuery != null && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMentionQuery(null)} />
          <div
            className="absolute left-2 bottom-full mb-1.5 w-72 border rounded-xl shadow-xl z-40 overflow-hidden animate-in fade-in duration-150 max-h-64 overflow-y-auto"
            style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
          >
            <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide sticky top-0 flex items-center gap-1" style={{ color: 'var(--p-on-surface-variant)', background: 'var(--p-surface-container-lowest)' }}>
              <Sym name="alternate_email" className="text-[12px]" /> Tag something
            </p>
            {onPickFileTag && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={pickFileTag}
                className="w-full text-left px-3 py-2.5 flex items-center gap-3 border-b"
                style={{ borderColor: 'var(--p-outline-variant)' }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--p-surface-container-high)' }}>
                  <Sym name="attach_file" className="text-[17px]" style={{ color: 'var(--p-primary)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">Files…</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>Browse and tag an uploaded file</p>
                </div>
              </button>
            )}
            {!mentionQuery.trim() ? (
              onSearchMentions && (
                <div className="px-3 py-3 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>Type a name to search projects, designs, invoices, quotes…</div>
              )
            ) : mentionLoading ? (
              <div className="px-3 py-3 flex items-center gap-2 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                <Sym name="progress_activity" className="text-[16px] animate-spin" /> Searching…
              </div>
            ) : mentionResults.length === 0 ? (
              <div className="px-3 py-3 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>No matches</div>
            ) : (
              mentionResults.map((r, i) => (
                <button
                  key={`${r.type}-${r.marker}`}
                  type="button"
                  onMouseEnter={() => setMentionActiveIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertMention(r)}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-3"
                  style={i === mentionActiveIndex ? { background: 'rgba(0,103,106,0.08)' } : undefined}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--p-surface-container-high)' }}>
                    <Sym name={MENTION_ICON[r.type]} className="text-[17px]" style={{ color: 'var(--p-primary)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate">{r.label}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{r.type}{r.sublabel ? ` · ${r.sublabel}` : ''}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
      {slashMenuOpen && (showProductAttach || onRequestPayment) && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setSlashMenuOpen(false)} />
          <div
            className="absolute left-2 bottom-full mb-1.5 w-64 border rounded-xl shadow-xl z-40 overflow-hidden animate-in fade-in duration-150"
            style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
          >
            <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Commands</p>
            {showProductAttach && (
              <button
                type="button"
                onClick={() => runSlashCommand('product')}
                className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-black/5"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--p-surface-container-high)' }}>
                  <Sym name="shopping_bag" className="text-[17px]" style={{ color: 'var(--p-primary)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">/product</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>Attach a product to this message</p>
                </div>
              </button>
            )}
            {onRequestPayment && (
              <button
                type="button"
                onClick={() => runSlashCommand('payment')}
                className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-black/5"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--p-surface-container-high)' }}>
                  <Sym name="payments" className="text-[17px]" style={{ color: 'var(--p-primary)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">/payment</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>Request a payment from the client</p>
                </div>
              </button>
            )}
          </div>
        </>
      )}
      {toolbar}
      {showAnnouncementCategory && (
        <div className="px-3 py-2 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
          <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>Announcement category</span>
          <select
            value={announcementCategory}
            onChange={(e) => setAnnouncementCategory(e.target.value)}
            className="text-[13px] rounded-lg border px-2 py-1"
            style={{ borderColor: 'var(--p-outline-variant)' }}
          >
            {ANNOUNCEMENT_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
      )}
      {/* Upload banner — gated on uploadLabel, not on `sending`. `sending` is now also true for
          a plain text send (it guards against double-submit), and showing a "cloud upload"
          banner with an empty label for every text message was wrong. Text sends get their
          feedback from the send button's spinner instead. */}
      {sending && uploadLabel && (
        <div className="px-3 py-2 flex items-center gap-2 text-[12px] font-semibold border-b animate-pulse" style={{ background: 'rgba(0,103,106,0.08)', borderColor: 'var(--p-outline-variant)', color: 'var(--p-primary)' }}>
          <Sym name="cloud_upload" className="text-[16px]" />{uploadLabel}
        </div>
      )}
      {atts.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {atts.map((a) =>
            a.kind === 'image' ? (
              <div key={a.id} className="relative w-16 h-16 rounded-lg overflow-hidden border group" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <img
                  src={a.url}
                  className="w-full h-full object-cover cursor-zoom-in"
                  alt={a.name}
                  onClick={() => setPreview({ url: a.url, name: a.name })}
                  title="Click to preview"
                />
                {!sending && (
                  <button type="button" onClick={() => removeAtt(a.id)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Sym name="close" className="text-[14px]" />
                  </button>
                )}
              </div>
            ) : (
              <div key={a.id} className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg border" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
                <button type="button" onClick={() => setPreview({ url: a.url, name: a.name })} title="Click to preview" className="flex items-center gap-2 min-w-0 text-left hover:opacity-80">
                  <Sym name="description" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
                  <div className="text-[12px] max-w-[120px]"><p className="truncate font-semibold">{a.name}</p><p style={{ color: 'var(--p-on-surface-variant)' }}>{a.size}</p></div>
                </button>
                {!sending && <button type="button" onClick={() => removeAtt(a.id)} className="p-0.5 rounded hover:bg-black/10"><Sym name="close" className="text-[14px]" /></button>}
              </div>
            ),
          )}
        </div>
      )}
      {selectedProduct && (
        <div className="px-3 pt-3">
          <div className="max-w-sm border rounded-xl overflow-hidden mb-2 flex" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
            <div className="w-20 h-20 shrink-0 flex items-center justify-center overflow-hidden" style={{ background: 'var(--p-surface-container-high)' }}>
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <Sym name="shopping_bag" className="text-[26px]" style={{ color: 'var(--p-on-surface-variant)' }} />
              )}
            </div>
            <div className="flex-1 min-w-0 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide mb-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>Product</p>
              <p className="font-semibold text-[14px] truncate">{selectedProduct.name}</p>
              {selectedProduct.price ? <p className="text-[13px] font-bold mt-1" style={{ color: 'var(--p-primary)' }}>{selectedProduct.price}</p> : null}
            </div>
            {!sending && (
              <button type="button" onClick={() => setSelectedProduct(null)} className="p-2 self-start m-1 rounded hover:bg-black/5" title="Remove product">
                <Sym name="close" className="text-[16px]" />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="relative">
        {empty && <div className="absolute left-4 top-2.5 text-[15px] pointer-events-none select-none" style={{ color: 'var(--p-on-surface-variant)', opacity: 0.65 }}>{placeholder}</div>}
        <div
          ref={editorRef}
          contentEditable={!sending}
          suppressContentEditableWarning
          onInput={onInput}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onClick={syncFmt}
          onKeyUp={syncFmt}
          className={`w-full px-4 py-2.5 bg-transparent border-none outline-none text-[15px] block ${compact ? 'min-h-[38px] max-h-[120px]' : 'min-h-[44px] max-h-[200px]'} overflow-y-auto composer-editor`}
          style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
        />
      </div>
      <div className="px-2.5 pb-2 flex justify-between items-center rounded-b-xl" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="flex items-center gap-0.5">
          <button type="button" disabled={sending} onClick={() => fileInput.current?.click()} title="Attach file" className="p-1.5 rounded-md hover:bg-black/6"><Sym name="attach_file" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} /></button>
          <button type="button" disabled={sending} onClick={() => imgInput.current?.click()} title="Add image" className="p-1.5 rounded-md hover:bg-black/6"><Sym name="image" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} /></button>
          {showProductAttach && (
            <button type="button" disabled={sending} onClick={() => setProductOpen(true)} title="Attach product" className="p-1.5 rounded-md hover:bg-black/6">
              <Sym name="shopping_bag" className="text-[20px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            </button>
          )}
          {showAskSara && (
            <button
              type="button"
              disabled={sending}
              onClick={() => insertText('@sara ')}
              title="Ask Sara AI (@sara)"
              className="p-1.5 rounded-md hover:bg-black/6 flex items-center gap-1"
            >
              <Sym name="smart_toy" className="text-[20px]" style={{ color: 'var(--p-tertiary)' }} />
              <span className="hidden sm:inline text-[12px] font-semibold pr-0.5" style={{ color: 'var(--p-tertiary)' }}>@sara</span>
            </button>
          )}
          <input ref={imgInput} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files, 'image'); e.target.value = ''; }} />
          <input ref={fileInput} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files, 'file'); e.target.value = ''; }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>⌘↵ send · Enter new line</span>
          <button type="button" onClick={submit} disabled={!canSend} className="p-2 rounded-lg flex items-center justify-center min-w-[40px]" style={canSend ? { background: 'var(--p-primary)', color: '#fff' } : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)', cursor: 'not-allowed' }}>
            {sending ? <Sym name="progress_activity" className="text-[18px] animate-spin" /> : <Sym name="send" className="text-[18px]" />}
          </button>
        </div>
      </div>
      <ProductPickerModal open={productOpen} onClose={() => setProductOpen(false)} onSelect={setSelectedProduct} />
      <FilePreviewModal open={!!preview} url={preview?.url ?? null} fileName={preview?.name} onClose={() => setPreview(null)} />
    </div>
  );
}
