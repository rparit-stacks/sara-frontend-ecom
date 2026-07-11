import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { ManufacturingInquiryDto } from '@/lib/api';
import type { QuoteDoc, QuoteBlock, FieldRow, LineItem } from './quoteDoc';
import { newId } from './quoteDoc';

/** A single Cloudinary/http(s) image URL, or a bare data:image URI — never a filename string. */
function isImageUrl(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  if (/^data:image\//.test(v)) return true;
  if (!/^https?:\/\//i.test(v)) return false;
  return /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i.test(v) || v.includes('cloudinary.com');
}

/** Flatten the inquiry's JSONB values into label/value rows for display + import. Image-valued fields (single URL or array of URLs) are separated out so they render as thumbnails instead of raw link text. */
function valueRows(inq: ManufacturingInquiryDto): { key: string; label: string; value: string; images: string[] }[] {
  const out: { key: string; label: string; value: string; images: string[] }[] = [];
  const vals = (inq.values || {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(vals)) {
    if (v == null || v === '') continue;
    const items = Array.isArray(v) ? v : [v];
    const images = items.filter(isImageUrl);
    const rest = items.filter((x) => !isImageUrl(x));
    const value = rest.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(', ');
    if (!value.trim() && images.length === 0) continue;
    const label = k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    out.push({ key: k, label, value, images });
  }
  return out;
}

/**
 * Panel shown in the quote builder when the quote came from an inquiry (or the
 * admin picked one). Lets the admin pull the inquiry's contact + form answers
 * into the quote — as client details, a Custom fields section, or line items.
 */
export default function InquiryImport({
  inquiry, doc, accent, onPatchMeta, onAddBlockFull,
}: {
  inquiry: ManufacturingInquiryDto;
  doc: QuoteDoc;
  accent: string;
  onPatchMeta: (p: Partial<QuoteDoc['meta']>) => void;
  /** Append a fully-formed block to the first page. */
  onAddBlockFull: (block: QuoteBlock) => void;
}) {
  const rows = useMemo(() => valueRows(inquiry), [inquiry]);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(rows.map((r) => r.key)));

  const toggle = (k: string) => setPicked((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const selected = rows.filter((r) => picked.has(r.key));

  const fillClient = () => {
    onPatchMeta({
      clientName: inquiry.clientName || inquiry.brand || doc.meta.clientName,
      clientEmail: inquiry.clientEmail || doc.meta.clientEmail,
      clientAddress: doc.meta.clientAddress,
    });
    toast.success('Client details filled from inquiry');
  };

  const addAsFields = () => {
    if (!selected.length) { toast.error('Select at least one field'); return; }
    const fields: FieldRow[] = selected.map((r) => ({ id: newId('f'), label: r.label, value: r.value }));
    onAddBlockFull({ id: newId(), type: 'fields', title: `From inquiry ${inquiry.reference}`, align: 'left', fields });
    toast.success(`Added ${fields.length} field(s) as a section`);
  };

  const addAsItems = () => {
    if (!selected.length) { toast.error('Select at least one field'); return; }
    const items: LineItem[] = selected.map((r) => ({ id: newId('i'), description: `${r.label}: ${r.value}`, qty: 1, rate: 0 }));
    onAddBlockFull({ id: newId(), type: 'items', title: 'Line items', align: 'left', showSubtotal: true, items });
    toast.success(`Added ${items.length} line item(s)`);
  };

  const insertImage = (url: string, label: string) => {
    onAddBlockFull({ id: newId(), type: 'image', title: label, align: 'left', url, width: 'half' });
    toast.success('Image added to the quote');
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100" style={{ background: `${accent}0a` }}>
        <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: accent }}><i className="fa-solid fa-inbox" /></span>
        <div className="min-w-0">
          <p className="font-semibold text-[14px]">From inquiry · {inquiry.reference}</p>
          <p className="text-[12px] text-gray-500 truncate">{inquiry.clientName || inquiry.brand || 'Unknown'}{inquiry.clientEmail ? ` · ${inquiry.clientEmail}` : ''}</p>
        </div>
        <button onClick={fillClient} className="ml-auto h-8 px-3 rounded-lg text-[12px] font-semibold text-white shrink-0" style={{ background: accent }}>
          <i className="fa-solid fa-user-pen text-[11px] mr-1.5" /> Fill client
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-3 text-[12px] text-gray-400">This inquiry has no extra form answers to import.</p>
      ) : (
        <>
          <div className="px-4 py-3 max-h-72 overflow-y-auto space-y-2">
            {rows.map((r) => (
              <div key={r.key} className="space-y-1.5">
                {r.value.trim() && (
                  <label className="flex items-start gap-2.5 py-1 cursor-pointer">
                    <input type="checkbox" checked={picked.has(r.key)} onChange={() => toggle(r.key)} className="mt-0.5 accent-[#00676a]" />
                    <span className="text-[12px] min-w-[120px] font-semibold text-gray-600">{r.label}</span>
                    <span className="text-[12px] text-gray-500 break-words">{r.value}</span>
                  </label>
                )}
                {r.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-6">
                    {r.images.map((url, i) => (
                      <div key={i} className="relative group">
                        <a href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt={r.label} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                        </a>
                        <button
                          onClick={() => insertImage(url, r.label)}
                          title="Insert into quote"
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-white flex items-center justify-center shadow"
                          style={{ background: accent }}
                        >
                          <i className="fa-solid fa-plus text-[10px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/60">
            <span className="text-[11px] text-gray-400 mr-auto">{selected.length} of {rows.length} selected</span>
            <button onClick={addAsFields} className="h-8 px-3 rounded-lg text-[12px] font-semibold border border-gray-200 hover:border-[#00676a] flex items-center gap-1.5"><i className="fa-solid fa-list text-[11px]" /> Add as fields</button>
            <button onClick={addAsItems} className="h-8 px-3 rounded-lg text-[12px] font-semibold border border-gray-200 hover:border-[#00676a] flex items-center gap-1.5"><i className="fa-solid fa-list-check text-[11px]" /> Add as items</button>
          </div>
        </>
      )}
    </div>
  );
}
