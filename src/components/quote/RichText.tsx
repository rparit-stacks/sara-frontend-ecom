import { useEffect, useRef, useState, type ElementType } from 'react';
import type { QuoteAlign } from './quoteDoc';

export const alignClass = (a?: QuoteAlign) =>
  a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left';

/* ---------- inline editable plain text ---------- */
export function EditableText({
  value, onChange, as: As = 'div', className, placeholder, style,
}: {
  value: string; onChange: (v: string) => void; as?: ElementType;
  className?: string; placeholder?: string; style?: React.CSSProperties;
}) {
  return (
    <As
      className={`${className ?? ''} outline-none focus:ring-2 focus:ring-[#924623]/30 rounded transition-shadow ${!value ? 'text-gray-300' : ''}`}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      style={style}
      onBlur={(e: React.FocusEvent<HTMLElement>) => onChange((e.currentTarget.textContent || '').trim())}
    >
      {value || placeholder}
    </As>
  );
}

/* ---------- compact inline rich text (used in the live page preview) ---------- */
export function RichText({
  html, onChange, align, accent,
}: {
  html: string; onChange: (html: string) => void; align?: QuoteAlign; accent: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html) ref.current.innerHTML = html || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = () => onChange(ref.current?.innerHTML || '');
  const exec = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); commit(); };
  const addLink = () => {
    const url = window.prompt('Link URL (https://…)');
    if (!url) return;
    const sel = window.getSelection();
    if (sel && sel.toString()) document.execCommand('createLink', false, url);
    else document.execCommand('insertHTML', false, `<a href="${url}">${url}</a>`);
    commit();
  };
  const tBtn = 'w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100';

  return (
    <div className="relative">
      <div className={`no-print absolute -top-9 left-0 z-20 ${focused ? 'flex' : 'hidden'} items-center gap-0.5 bg-white rounded-lg shadow border border-gray-200 p-1`}>
        <button className={tBtn} onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} title="Bold"><i className="fa-solid fa-bold text-[12px]" /></button>
        <button className={tBtn} onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} title="Italic"><i className="fa-solid fa-italic text-[12px]" /></button>
        <button className={tBtn} onMouseDown={(e) => { e.preventDefault(); exec('underline'); }} title="Underline"><i className="fa-solid fa-underline text-[12px]" /></button>
        <button className={tBtn} onMouseDown={(e) => { e.preventDefault(); addLink(); }} title="Link"><i className="fa-solid fa-link text-[12px]" /></button>
        <button className={tBtn} onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }} title="Bullet list"><i className="fa-solid fa-list-ul text-[12px]" /></button>
        <button className={tBtn} onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }} title="Clear formatting"><i className="fa-solid fa-text-slash text-[12px]" /></button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); commit(); }}
        className={`rt text-[13px] text-gray-700 leading-relaxed outline-none focus:ring-2 focus:ring-[#924623]/20 rounded min-h-[1.5em] ${alignClass(align)}`}
        style={{ ['--rt-accent' as string]: accent }}
      />
    </div>
  );
}

/* =====================================================================
   Full rich text editor — always-visible toolbar, large editing area.
   Used inside the section forms (wizard + split panel).
   ===================================================================== */

const SWATCHES = ['#111827', '#924623', '#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#6b7280'];

export function RichTextEditor({
  html, onChange, accent, minHeight = 160,
}: {
  html: string; onChange: (html: string) => void; accent: string; minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkText, setLinkText] = useState('');
  const [colorOpen, setColorOpen] = useState(false);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html) ref.current.innerHTML = html || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = () => onChange(ref.current?.innerHTML || '');
  const exec = (cmd: string, val?: string) => { ref.current?.focus(); document.execCommand(cmd, false, val); commit(); };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  };

  const openLink = () => {
    saveSelection();
    const sel = window.getSelection();
    setLinkText(sel?.toString() || '');
    setLinkUrl('https://');
    setLinkOpen(true);
  };
  const applyLink = () => {
    ref.current?.focus();
    restoreSelection();
    const sel = window.getSelection();
    const url = linkUrl.trim();
    if (!url) { setLinkOpen(false); return; }
    if (sel && sel.toString()) {
      document.execCommand('createLink', false, url);
    } else {
      const text = linkText.trim() || url;
      document.execCommand('insertHTML', false, `<a href="${url}">${text}</a>`);
    }
    commit();
    setLinkOpen(false);
  };

  const Btn = ({ cmd, val, icon, title, text }: { cmd?: string; val?: string; icon?: string; title: string; text?: string; }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); if (cmd) exec(cmd, val); }}
      className="min-w-[30px] h-8 px-1.5 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-[13px]"
    >
      {icon ? <i className={`fa-solid ${icon}`} /> : <span className="font-semibold">{text}</span>}
    </button>
  );
  const Sep = () => <span className="w-px h-5 bg-gray-200 mx-0.5" />;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/70 relative">
        <Btn cmd="bold" icon="fa-bold" title="Bold" />
        <Btn cmd="italic" icon="fa-italic" title="Italic" />
        <Btn cmd="underline" icon="fa-underline" title="Underline" />
        <Btn cmd="strikeThrough" icon="fa-strikethrough" title="Strikethrough" />
        <Sep />
        <Btn cmd="formatBlock" val="<h2>" text="H1" title="Heading" />
        <Btn cmd="formatBlock" val="<h3>" text="H2" title="Subheading" />
        <Btn cmd="formatBlock" val="<p>" text="P" title="Paragraph" />
        <Sep />
        <Btn cmd="insertUnorderedList" icon="fa-list-ul" title="Bullet list" />
        <Btn cmd="insertOrderedList" icon="fa-list-ol" title="Numbered list" />
        <Sep />
        <Btn cmd="justifyLeft" icon="fa-align-left" title="Align left" />
        <Btn cmd="justifyCenter" icon="fa-align-center" title="Align center" />
        <Btn cmd="justifyRight" icon="fa-align-right" title="Align right" />
        <Sep />
        <button type="button" title="Link" onMouseDown={(e) => { e.preventDefault(); openLink(); }} className="min-w-[30px] h-8 px-1.5 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-100"><i className="fa-solid fa-link" /></button>
        <Btn cmd="unlink" icon="fa-link-slash" title="Remove link" />

        {/* color */}
        <div className="relative">
          <button type="button" title="Text color" onMouseDown={(e) => { e.preventDefault(); saveSelection(); setColorOpen((o) => !o); }} className="min-w-[30px] h-8 px-1.5 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-100"><i className="fa-solid fa-palette" /></button>
          {colorOpen && (
            <div className="absolute z-30 top-9 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 grid grid-cols-4 gap-1.5 w-32">
              {SWATCHES.map((c) => (
                <button key={c} type="button" className="w-5 h-5 rounded-full border border-gray-200" style={{ background: c }} onMouseDown={(e) => { e.preventDefault(); ref.current?.focus(); restoreSelection(); document.execCommand('foreColor', false, c); commit(); setColorOpen(false); }} />
              ))}
            </div>
          )}
        </div>
        <Sep />
        <Btn cmd="removeFormat" icon="fa-text-slash" title="Clear formatting" />

        {/* link dialog */}
        {linkOpen && (
          <div className="absolute z-40 top-10 right-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-3 space-y-2">
            <p className="text-[12px] font-semibold text-gray-700">Insert link</p>
            <input autoFocus value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" className="w-full h-9 px-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#924623]/20" />
            <input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Link text (optional)" className="w-full h-9 px-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#924623]/20" />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setLinkOpen(false)} className="h-8 px-3 rounded-lg text-[12px] font-semibold border border-gray-200">Cancel</button>
              <button type="button" onClick={applyLink} className="h-8 px-3 rounded-lg text-[12px] font-semibold text-white" style={{ background: accent }}>Add link</button>
            </div>
          </div>
        )}
      </div>

      {/* editing area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onBlur={commit}
        onInput={commit}
        className="rt rt-editor text-[13.5px] text-gray-800 leading-relaxed outline-none px-3 py-2.5 overflow-y-auto"
        style={{ minHeight }}
        data-placeholder="Type your content here…"
      />
    </div>
  );
}
