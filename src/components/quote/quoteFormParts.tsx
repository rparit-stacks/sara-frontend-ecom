import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { mediaApi } from '@/lib/api';
import { RichTextEditor } from './RichText';
import type {
  QuoteDoc, QuoteBlock, QuoteBlockType, QuoteCalc, ItemsBlock, TextBlock, ImageBlock,
  TableBlock, SummaryBlock, FieldsBlock, SignatureBlock, QuotePage,
} from './quoteDoc';
import { newId } from './quoteDoc';

export const BLOCK_META: Record<QuoteBlockType, { label: string; icon: string; hint: string }> = {
  items: { label: 'Line items', icon: 'fa-list-check', hint: 'Priced items — Amount = Qty × Rate (auto). Feeds the grand total.' },
  text: { label: 'Rich text', icon: 'fa-align-left', hint: 'Headings, bold, lists, links — formatted paragraph.' },
  image: { label: 'Image', icon: 'fa-image', hint: 'Upload a photo, diagram or logo with a caption.' },
  table: { label: 'Table (free-form)', icon: 'fa-table', hint: 'Plain data grid for specs/notes. No calculations.' },
  summary: { label: 'Summary / totals', icon: 'fa-calculator', hint: 'Subtotal, GST and grand total — from your line items.' },
  fields: { label: 'Custom fields', icon: 'fa-list', hint: 'Label-value rows, e.g. “Lead time: 3 weeks”.' },
  signature: { label: 'Signature', icon: 'fa-signature', hint: 'Sign-off line with name, title and date.' },
};

export const inputCls = 'w-full h-9 px-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#924623]/20';
export const labelCls = 'block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1';

/* ---------- collapsible group ---------- */
export function Group({ title, icon, defaultOpen = true, accent, children }: { title: string; icon: string; defaultOpen?: boolean; accent: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50">
        <i className={`fa-solid ${icon} text-[13px]`} style={{ color: accent }} />
        <span className="font-semibold text-[13px] flex-1">{title}</span>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} text-[11px] text-gray-400`} />
      </button>
      {open && <div className="px-3 pb-3 pt-1 space-y-2.5">{children}</div>}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button onClick={() => onChange(!on)} className="flex items-center gap-2 text-[12px] text-gray-600" type="button">
      <span className={`relative w-9 h-5 rounded-full transition-colors ${on ? 'bg-[#924623]' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-4' : ''}`} />
      </span>
      {label}
    </button>
  );
}

/* ---------- branding form ---------- */
export function BrandingForm({ doc, onPatchBranding, accent }: { doc: QuoteDoc; onPatchBranding: (p: Partial<QuoteDoc['branding']>) => void; accent: string }) {
  const [uploading, setUploading] = useState(false);
  const uploadLogo = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try { onPatchBranding({ logoUrl: await mediaApi.upload(file, 'quotes') }); }
    catch (e) { toast.error((e as Error).message || 'Upload failed'); }
    finally { setUploading(false); }
  };
  return (
    <>
      <Toggle on={doc.branding.showHeader} onChange={(v) => onPatchBranding({ showHeader: v })} label="Show header on page 1" />
      <div><label className={labelCls}>Company name</label><input className={inputCls} value={doc.branding.name} onChange={(e) => onPatchBranding({ name: e.target.value })} /></div>
      <div><label className={labelCls}>Tagline</label><input className={inputCls} value={doc.branding.tagline || ''} onChange={(e) => onPatchBranding({ tagline: e.target.value })} /></div>
      <div>
        <label className={labelCls}>Logo</label>
        <div className="flex items-center gap-2">
          {doc.branding.logoUrl ? <img src={doc.branding.logoUrl} alt="logo" className="h-8 w-auto object-contain rounded border border-gray-200" /> : null}
          <label className="text-[12px] cursor-pointer text-gray-600 hover:text-[#924623]">
            <i className="fa-solid fa-cloud-arrow-up" /> {uploading ? 'Uploading…' : doc.branding.logoUrl ? 'Replace' : 'Upload'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0])} />
          </label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={labelCls}>Phone</label><input className={inputCls} value={doc.branding.phone || ''} onChange={(e) => onPatchBranding({ phone: e.target.value })} /></div>
        <div><label className={labelCls}>Email</label><input className={inputCls} value={doc.branding.email || ''} onChange={(e) => onPatchBranding({ email: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={labelCls}>Website</label><input className={inputCls} value={doc.branding.website || ''} onChange={(e) => onPatchBranding({ website: e.target.value })} /></div>
        <div><label className={labelCls}>GSTIN</label><input className={inputCls} value={doc.branding.gstin || ''} onChange={(e) => onPatchBranding({ gstin: e.target.value })} /></div>
      </div>
      <div>
        <label className={labelCls}>Address lines</label>
        {doc.branding.addressLines.map((line, i) => (
          <div key={i} className="flex gap-1 mb-1">
            <input className={inputCls} value={line} onChange={(e) => { const lines = [...doc.branding.addressLines]; lines[i] = e.target.value; onPatchBranding({ addressLines: lines }); }} />
            <button onClick={() => onPatchBranding({ addressLines: doc.branding.addressLines.filter((_, idx) => idx !== i) })} className="px-2 text-red-400 hover:text-red-600"><i className="fa-solid fa-xmark" /></button>
          </div>
        ))}
        <button onClick={() => onPatchBranding({ addressLines: [...doc.branding.addressLines, ''] })} className="text-[12px]" style={{ color: accent }}>+ address line</button>
      </div>
    </>
  );
}

/* ---------- client & meta form ---------- */
export function MetaForm({ doc, onPatchMeta }: { doc: QuoteDoc; onPatchMeta: (p: Partial<QuoteDoc['meta']>) => void }) {
  return (
    <>
      <div><label className={labelCls}>Quote title</label><input className={inputCls} value={doc.meta.quoteTitle} onChange={(e) => onPatchMeta({ quoteTitle: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={labelCls}>Date</label><input type="date" className={inputCls} value={doc.meta.date} onChange={(e) => onPatchMeta({ date: e.target.value })} /></div>
        <div><label className={labelCls}>Valid (days)</label><input type="number" className={inputCls} value={doc.meta.validityDays} onChange={(e) => onPatchMeta({ validityDays: +e.target.value })} /></div>
      </div>
      <div><label className={labelCls}>Client name</label><input className={inputCls} value={doc.meta.clientName} onChange={(e) => onPatchMeta({ clientName: e.target.value })} /></div>
      <div><label className={labelCls}>Client email</label><input className={inputCls} value={doc.meta.clientEmail} onChange={(e) => onPatchMeta({ clientEmail: e.target.value })} /></div>
      <div><label className={labelCls}>Client address</label><input className={inputCls} value={doc.meta.clientAddress} onChange={(e) => onPatchMeta({ clientAddress: e.target.value })} /></div>
    </>
  );
}

/* ---------- tax & discount form ---------- */
export function CalcForm({ calc, currency, onPatchCalc }: { calc: QuoteCalc; currency: string; onPatchCalc: (p: Partial<QuoteCalc>) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={labelCls}>GST %</label><input type="number" className={inputCls} value={calc.gstPercent} onChange={(e) => onPatchCalc({ gstPercent: +e.target.value })} /></div>
        <div><label className={labelCls}>Discount {calc.discountIsPercent ? '%' : `(${currency})`}</label><input type="number" className={inputCls} value={calc.discount} onChange={(e) => onPatchCalc({ discount: +e.target.value })} /></div>
      </div>
      <Toggle on={!!calc.discountIsPercent} onChange={(v) => onPatchCalc({ discountIsPercent: v })} label="Discount is a percentage" />
    </>
  );
}

/* ---------- sortable sections editor (used by both panel & wizard) ---------- */
export function SectionsEditor({
  page, accent, currency, pageIdx, removablePage, focusBlockId,
  onPatchBlock, onAddBlock, onRemoveBlock, onReorder, onToggle, onRemovePage,
}: {
  page: QuotePage; accent: string; currency: string; pageIdx: number; removablePage: boolean; focusBlockId?: string | null;
  onPatchBlock: (blockId: string, p: Partial<QuoteBlock>) => void;
  onAddBlock: (t: QuoteBlockType) => void;
  onRemoveBlock: (blockId: string) => void;
  onReorder: (from: number, to: number) => void;
  onToggle: (blockId: string) => void;
  onRemovePage?: () => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Page {pageIdx + 1} · sections</span>
        {removablePage && onRemovePage && <button onClick={onRemovePage} className="text-[11px] text-red-500 hover:underline">Remove page</button>}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e: DragEndEvent) => {
          const { active, over } = e;
          if (!over || active.id === over.id) return;
          const from = page.blocks.findIndex((b) => b.id === active.id);
          const to = page.blocks.findIndex((b) => b.id === over.id);
          if (from >= 0 && to >= 0) onReorder(from, to);
        }}
      >
        <SortableContext items={page.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {page.blocks.map((block) => (
              <SectionRow
                key={block.id}
                block={block}
                accent={accent}
                currency={currency}
                focus={focusBlockId === block.id}
                onPatch={(p) => onPatchBlock(block.id, p)}
                onRemove={() => onRemoveBlock(block.id)}
                onToggle={() => onToggle(block.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <AddSection onAdd={onAddBlock} accent={accent} />
    </div>
  );
}

/* ---------- sortable section row ---------- */
export function SectionRow({ block, accent, currency, onPatch, onRemove, onToggle, defaultOpen = false, focus = false }: {
  block: QuoteBlock; accent: string; currency: string;
  onPatch: (p: Partial<QuoteBlock>) => void; onRemove: () => void; onToggle: () => void; defaultOpen?: boolean; focus?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [open, setOpen] = useState(defaultOpen);
  const rowRef = useRef<HTMLDivElement>(null);
  const meta = BLOCK_META[block.type];
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  // When the page double-click targets this block, open it and scroll into view.
  useEffect(() => {
    if (focus) {
      setOpen(true);
      rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focus]);

  const setRefs = (el: HTMLDivElement | null) => { setNodeRef(el); rowRef.current = el; };

  return (
    <div ref={setRefs} style={style} className={`border rounded-xl bg-white shadow-sm ${block.hidden ? 'border-gray-200 opacity-60' : 'border-gray-200'} ${open ? 'ring-1 ring-[#924623]/20' : ''} ${focus ? 'ring-2 ring-[#924623]/50' : ''}`}>
      {/* rich card header */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 px-0.5" title="Drag to reorder"><i className="fa-solid fa-grip-vertical text-[15px]" /></button>
        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}14`, color: accent }}><i className={`fa-solid ${meta.icon} text-[15px]`} /></span>
        <button onClick={() => setOpen((o) => !o)} className="flex-1 text-left min-w-0">
          <div className="text-[14px] font-semibold text-gray-800 truncate">{block.title || meta.label}</div>
          <div className="text-[11px] text-gray-400 truncate">{meta.label}{block.hidden ? ' · hidden' : ''}</div>
        </button>
        <button onClick={onToggle} title={block.hidden ? 'Show in quote' : 'Hide from quote'} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"><i className={`fa-solid fa-${block.hidden ? 'eye-slash' : 'eye'} text-[13px]`} /></button>
        <button onClick={() => setOpen((o) => !o)} className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100"><i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} text-[12px]`} /></button>
        <button onClick={onRemove} title="Delete section" className="w-8 h-8 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500"><i className="fa-solid fa-trash text-[13px]" /></button>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100">
          <p className="text-[12px] text-gray-400 -mt-0.5">{meta.hint}</p>
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className={labelCls}>Section name</label>
              <input className={inputCls} value={block.title || ''} placeholder={meta.label} onChange={(e) => onPatch({ title: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Alignment</label>
              <div className="flex items-center gap-1">
                {(['left', 'center', 'right'] as const).map((a) => (
                  <button key={a} onClick={() => onPatch({ align: a })} title={`Align ${a}`} className={`w-9 h-9 rounded-lg border ${block.align === a ? 'text-white' : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`} style={block.align === a ? { background: accent, borderColor: accent } : undefined}><i className={`fa-solid fa-align-${a === 'center' ? 'center' : a} text-[12px]`} /></button>
                ))}
              </div>
            </div>
          </div>
          <BlockForm block={block} accent={accent} currency={currency} onPatch={onPatch} />
        </div>
      )}
    </div>
  );
}

/* ---------- per-type block form ---------- */
export function BlockForm({ block, accent, currency, onPatch }: { block: QuoteBlock; accent: string; currency: string; onPatch: (p: Partial<QuoteBlock>) => void }) {
  if (block.type === 'items') return <ItemsForm block={block as ItemsBlock} accent={accent} currency={currency} onPatch={onPatch} />;
  if (block.type === 'text') {
    return <div><label className={labelCls}>Content</label><RichTextEditor html={(block as TextBlock).text} accent={accent} onChange={(v) => onPatch({ text: v } as Partial<QuoteBlock>)} /></div>;
  }
  if (block.type === 'image') return <ImageForm block={block as ImageBlock} accent={accent} onPatch={onPatch} />;
  if (block.type === 'table') return <TableForm block={block as TableBlock} accent={accent} onPatch={onPatch} />;
  if (block.type === 'summary') return <SummaryForm block={block as SummaryBlock} onPatch={onPatch} />;
  if (block.type === 'fields') return <FieldsForm block={block as FieldsBlock} accent={accent} onPatch={onPatch} />;
  if (block.type === 'signature') return <SignatureForm block={block as SignatureBlock} onPatch={onPatch} />;
  return null;
}

function ImageForm({ block, accent, onPatch }: { block: ImageBlock; accent: string; onPatch: (p: Partial<QuoteBlock>) => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
    setUploading(true);
    try { onPatch({ url: await mediaApi.upload(file, 'quotes') } as Partial<QuoteBlock>); }
    catch (e) { toast.error((e as Error).message || 'Upload failed'); }
    finally { setUploading(false); }
  };
  const widthPct = block.widthPercent ?? (block.width === 'half' ? 50 : 100);

  return (
    <div className="space-y-3">
      {!block.url ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files?.[0]); }}
          className={`flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${dragOver ? 'border-[#924623] bg-[#924623]/5' : 'border-gray-300 hover:border-[#924623]'}`}
        >
          <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'} text-2xl`} style={{ color: accent }} />
          <span className="text-[13px] font-semibold text-gray-600">{uploading ? 'Uploading…' : 'Drag & drop an image, or click to browse'}</span>
          <span className="text-[11px] text-gray-400">PNG, JPG, SVG · up to 10MB</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 p-3 flex items-center justify-center">
            <img src={block.url} alt={block.caption || ''} className="max-h-48 w-auto rounded shadow-sm" />
          </div>
          <div className="flex items-center gap-3 px-3 py-2 border-t border-gray-100">
            <label className="text-[12px] font-semibold cursor-pointer flex items-center gap-1.5" style={{ color: accent }}>
              <i className="fa-solid fa-rotate" /> Replace
              <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
            </label>
            <button onClick={() => onPatch({ url: '' } as Partial<QuoteBlock>)} className="text-[12px] font-semibold text-red-500 flex items-center gap-1.5"><i className="fa-solid fa-trash" /> Remove</button>
          </div>
        </div>
      )}

      <div><label className={labelCls}>Caption</label><input className={inputCls} placeholder="e.g. Reference sample (optional)" value={block.caption || ''} onChange={(e) => onPatch({ caption: e.target.value } as Partial<QuoteBlock>)} /></div>

      <div>
        <label className={labelCls}>Width — {widthPct}%</label>
        <div className="flex items-center gap-2">
          <button onClick={() => onPatch({ width: 'half', widthPercent: 50 } as Partial<QuoteBlock>)} className={`h-8 px-3 rounded-lg text-[12px] font-semibold border ${widthPct === 50 ? 'text-white' : 'border-gray-200 text-gray-600'}`} style={widthPct === 50 ? { background: accent, borderColor: accent } : undefined}>Half</button>
          <button onClick={() => onPatch({ width: 'full', widthPercent: 100 } as Partial<QuoteBlock>)} className={`h-8 px-3 rounded-lg text-[12px] font-semibold border ${widthPct === 100 ? 'text-white' : 'border-gray-200 text-gray-600'}`} style={widthPct === 100 ? { background: accent, borderColor: accent } : undefined}>Full</button>
          <input type="range" min={10} max={100} step={5} value={widthPct} onChange={(e) => onPatch({ widthPercent: +e.target.value, width: +e.target.value <= 50 ? 'half' : 'full' } as Partial<QuoteBlock>)} className="flex-1 accent-[#924623]" />
        </div>
      </div>
    </div>
  );
}

/* ---------- priced line items (Amount = Qty × Rate, always auto) ---------- */
function ItemsForm({ block, accent, currency, onPatch }: { block: ItemsBlock; accent: string; currency: string; onPatch: (p: Partial<QuoteBlock>) => void }) {
  const sym = ({ INR: '₹', USD: '$', EUR: '€', GBP: '£' } as Record<string, string>)[currency] ?? '';
  const setItem = (i: number, p: Partial<{ description: string; qty: number; rate: number }>) => {
    const items = block.items.map((it, idx) => idx === i ? { ...it, ...p } : it);
    onPatch({ items } as Partial<QuoteBlock>);
  };
  const addItem = () => onPatch({ items: [...block.items, { id: newId('i'), description: '', qty: 1, rate: 0 }] } as Partial<QuoteBlock>);
  const removeItem = (i: number) => onPatch({ items: block.items.filter((_, idx) => idx !== i) } as Partial<QuoteBlock>);
  const subtotal = block.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);

  return (
    <div className="space-y-3">
      <Toggle on={block.showSubtotal !== false} onChange={(v) => onPatch({ showSubtotal: v } as Partial<QuoteBlock>)} label="Show subtotal row" />
      <div className="rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-400">
              <th className="w-9 border-b border-gray-200" />
              <th className="border-b border-gray-200 p-2 text-left font-bold min-w-[220px]">Description</th>
              <th className="border-b border-l border-gray-200 p-2 text-right font-bold w-20">Qty</th>
              <th className="border-b border-l border-gray-200 p-2 text-right font-bold w-28">Rate</th>
              <th className="border-b border-l border-gray-200 p-2 text-right font-bold w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            {block.items.map((it, i) => (
              <tr key={it.id} className="group/row hover:bg-gray-50/50">
                <td className="text-center border-t border-gray-100">
                  <button onClick={() => removeItem(i)} title="Delete item" className="w-7 h-7 rounded-md text-gray-200 group-hover/row:text-gray-400 hover:!text-red-500 hover:bg-red-50"><i className="fa-solid fa-xmark text-[12px]" /></button>
                </td>
                <td className="border-t border-gray-100 p-1.5"><input value={it.description} placeholder="Item description" onChange={(e) => setItem(i, { description: e.target.value })} className="w-full h-8 px-2 rounded-md border border-gray-200 bg-white" /></td>
                <td className="border-t border-l border-gray-100 p-1.5"><input type="number" value={it.qty} onChange={(e) => setItem(i, { qty: +e.target.value })} className="w-full h-8 px-2 rounded-md border border-gray-200 bg-white text-right" /></td>
                <td className="border-t border-l border-gray-100 p-1.5"><input type="number" value={it.rate} onChange={(e) => setItem(i, { rate: +e.target.value })} className="w-full h-8 px-2 rounded-md border border-gray-200 bg-white text-right" /></td>
                <td className="border-t border-l border-gray-100 p-1.5 text-right font-medium text-gray-700 pr-3">{sym}{((Number(it.qty) || 0) * (Number(it.rate) || 0)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          {block.showSubtotal !== false && (
            <tfoot>
              <tr>
                <td colSpan={4} className="p-2 text-right font-semibold text-gray-600 border-t border-gray-200">Subtotal</td>
                <td className="p-2 text-right font-bold border-t border-gray-200 pr-3" style={{ color: accent }}>{sym}{subtotal.toLocaleString()}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <button onClick={addItem} className="h-9 px-4 rounded-lg border border-dashed border-gray-300 text-[13px] font-semibold text-gray-500 hover:border-[#924623] hover:text-[#924623] flex items-center gap-2"><i className="fa-solid fa-plus text-[12px]" /> Add item</button>
    </div>
  );
}

/* ---------- free-form table (no calculations) ---------- */
function TableForm({ block, accent, onPatch }: { block: TableBlock; accent: string; onPatch: (p: Partial<QuoteBlock>) => void }) {
  const setCell = (r: number, c: number, v: string) => { const rows = block.rows.map((row) => [...row]); rows[r][c] = v; onPatch({ rows } as Partial<QuoteBlock>); };
  const setHeader = (c: number, v: string) => { const columns = [...block.columns]; columns[c] = v; onPatch({ columns } as Partial<QuoteBlock>); };
  const addRow = () => onPatch({ rows: [...block.rows, block.columns.map(() => '')] } as Partial<QuoteBlock>);
  const removeRow = (r: number) => onPatch({ rows: block.rows.filter((_, i) => i !== r) } as Partial<QuoteBlock>);
  const addCol = () => onPatch({ columns: [...block.columns, 'Column'], rows: block.rows.map((row) => [...row, '']) } as Partial<QuoteBlock>);
  const removeCol = (c: number) => onPatch({ columns: block.columns.filter((_, i) => i !== c), rows: block.rows.map((row) => row.filter((_, i) => i !== c)) } as Partial<QuoteBlock>);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="w-9 border-b border-gray-200" />
              {block.columns.map((col, c) => (
                <th key={c} className="border-b border-l border-gray-200 p-2 min-w-[160px]">
                  <div className="flex items-center gap-1">
                    <input value={col} placeholder="Column name" onChange={(e) => setHeader(c, e.target.value)} className="w-full h-8 px-2 rounded-md border border-gray-200 font-semibold bg-white" style={{ color: accent }} />
                    {block.columns.length > 1 && <button onClick={() => removeCol(c)} title="Delete column" className="w-7 h-7 shrink-0 rounded-md text-gray-300 hover:bg-red-50 hover:text-red-500"><i className="fa-solid fa-xmark text-[12px]" /></button>}
                  </div>
                </th>
              ))}
              <th className="border-b border-l border-gray-200 px-2 w-12">
                <button onClick={addCol} title="Add column" className="w-8 h-8 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-[#924623] hover:text-[#924623]"><i className="fa-solid fa-plus text-[12px]" /></button>
              </th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r} className="group/row hover:bg-gray-50/50">
                <td className="text-center border-t border-gray-100">
                  <button onClick={() => removeRow(r)} title="Delete row" className="w-7 h-7 rounded-md text-gray-200 group-hover/row:text-gray-400 hover:!text-red-500 hover:bg-red-50"><i className="fa-solid fa-xmark text-[12px]" /></button>
                </td>
                {row.map((cell, c) => (
                  <td key={c} className="border-t border-l border-gray-100 p-1.5">
                    <input value={cell} onChange={(e) => setCell(r, c, e.target.value)} className="w-full h-8 px-2 rounded-md border border-gray-200 bg-white" />
                  </td>
                ))}
                <td className="border-t border-l border-gray-100" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="h-9 px-4 rounded-lg border border-dashed border-gray-300 text-[13px] font-semibold text-gray-500 hover:border-[#924623] hover:text-[#924623] flex items-center gap-2"><i className="fa-solid fa-plus text-[12px]" /> Add row</button>
    </div>
  );
}

function SummaryForm({ block, onPatch }: { block: SummaryBlock; onPatch: (p: Partial<QuoteBlock>) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-gray-400">Numbers come from the line-item tables + Tax & discount settings.</p>
      <Toggle on={block.showSubtotal !== false} onChange={(v) => onPatch({ showSubtotal: v } as Partial<QuoteBlock>)} label="Show subtotal" />
      <Toggle on={block.showDiscount !== false} onChange={(v) => onPatch({ showDiscount: v } as Partial<QuoteBlock>)} label="Show discount" />
      <Toggle on={block.showGst !== false} onChange={(v) => onPatch({ showGst: v } as Partial<QuoteBlock>)} label="Show GST" />
      <Toggle on={block.showGrandTotal !== false} onChange={(v) => onPatch({ showGrandTotal: v } as Partial<QuoteBlock>)} label="Show grand total" />
    </div>
  );
}

function FieldsForm({ block, accent, onPatch }: { block: FieldsBlock; accent: string; onPatch: (p: Partial<QuoteBlock>) => void }) {
  const setRow = (i: number, p: Partial<{ label: string; value: string }>) => { const fields = block.fields.map((f, idx) => idx === i ? { ...f, ...p } : f); onPatch({ fields } as Partial<QuoteBlock>); };
  return (
    <>
      {block.fields.map((f, i) => (
        <div key={f.id} className="flex gap-1">
          <input className={inputCls} placeholder="Label" value={f.label} onChange={(e) => setRow(i, { label: e.target.value })} />
          <input className={inputCls} placeholder="Value" value={f.value} onChange={(e) => setRow(i, { value: e.target.value })} />
          <button onClick={() => onPatch({ fields: block.fields.filter((_, idx) => idx !== i) } as Partial<QuoteBlock>)} className="px-2 text-red-400"><i className="fa-solid fa-xmark" /></button>
        </div>
      ))}
      <button onClick={() => onPatch({ fields: [...block.fields, { id: newId('f'), label: '', value: '' }] } as Partial<QuoteBlock>)} className="text-[12px] font-semibold" style={{ color: accent }}><i className="fa-solid fa-plus" /> Add field</button>
    </>
  );
}

function SignatureForm({ block, onPatch }: { block: SignatureBlock; onPatch: (p: Partial<QuoteBlock>) => void }) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try { onPatch({ imageUrl: await mediaApi.upload(file, 'quotes') } as Partial<QuoteBlock>); }
    catch (e) { toast.error((e as Error).message || 'Upload failed'); }
    finally { setUploading(false); }
  };
  return (
    <>
      <div><label className={labelCls}>Signer name</label><input className={inputCls} value={block.signerName || ''} onChange={(e) => onPatch({ signerName: e.target.value } as Partial<QuoteBlock>)} /></div>
      <div><label className={labelCls}>Signer title</label><input className={inputCls} value={block.signerTitle || ''} onChange={(e) => onPatch({ signerTitle: e.target.value } as Partial<QuoteBlock>)} /></div>
      <div><label className={labelCls}>Place</label><input className={inputCls} value={block.place || ''} onChange={(e) => onPatch({ place: e.target.value } as Partial<QuoteBlock>)} /></div>
      <label className="flex items-center gap-2 text-[12px] cursor-pointer text-gray-600 hover:text-[#924623]">
        <i className="fa-solid fa-cloud-arrow-up" /> {uploading ? 'Uploading…' : block.imageUrl ? 'Replace signature image' : 'Upload signature image'}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      </label>
    </>
  );
}

/* ---------- add section ---------- */
export function AddSection({ onAdd, accent }: { onAdd: (t: QuoteBlockType) => void; accent: string }) {
  const [open, setOpen] = useState(false);
  const types: QuoteBlockType[] = ['items', 'text', 'image', 'table', 'summary', 'fields', 'signature'];
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="w-full py-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#924623] hover:text-[#924623] text-[13px] font-semibold flex items-center justify-center gap-2">
        <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-plus'}`} /> Add section
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {types.map((t) => (
            <button key={t} onClick={() => { onAdd(t); setOpen(false); }} className="rounded-lg border border-gray-200 p-2.5 hover:border-[#924623] hover:shadow-sm flex flex-col items-center gap-1.5 text-gray-700">
              <i className={`fa-solid ${BLOCK_META[t].icon} text-[16px]`} style={{ color: accent }} />
              <span className="text-[11px] font-semibold text-center leading-tight">{BLOCK_META[t].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
