// Document model for the full-page quotation editor.
// A quote is a multi-page document: page 1 shows the branding header, every
// page shares the abstract background + footer, and the body is a list of
// sections each with an optional title + alignment.
//
// Section types: text / image / table / summary / fields / signature.
// The editor is FORM-FIRST (a structured form on the left mutates this doc),
// while the right pane renders the doc onto an A4 page for live preview + PDF.

import type { CompanyProfile } from '@/lib/api';

export type QuoteAlign = 'left' | 'center' | 'right';
export type QuoteBlockType = 'items' | 'text' | 'image' | 'table' | 'summary' | 'fields' | 'signature';

/** Role of a table column — drives auto Qty×Rate→Amount + subtotal maths. */
export type ColumnRole = 'text' | 'qty' | 'rate' | 'amount';

interface QuoteBlockBase {
  id: string;
  type: QuoteBlockType;
  title?: string;
  align?: QuoteAlign;
  /** Per-section show/hide toggle. undefined/false = visible. */
  hidden?: boolean;
}

/** A single priced line item. Amount is always derived (qty × rate). */
export interface LineItem { id: string; description: string; qty: number; rate: number; }
export interface ItemsBlock extends QuoteBlockBase {
  type: 'items';
  items: LineItem[];
  qtyLabel?: string;   // default "Qty"
  rateLabel?: string;  // default "Rate"
  amountLabel?: string; // default "Amount"
  showSubtotal?: boolean; // per-block subtotal row (default true)
}

export interface TextBlock extends QuoteBlockBase {
  type: 'text';
  text: string;
}
export interface ImageBlock extends QuoteBlockBase {
  type: 'image';
  url: string;
  caption?: string;
  width: 'full' | 'half';
  /** Optional explicit width percentage (10–100). Overrides `width` when set. */
  widthPercent?: number;
}
export interface TableBlock extends QuoteBlockBase {
  type: 'table';
  columns: string[];
  rows: string[][];
  /** Parallel to columns[]; role of each column. Inferred for legacy docs. */
  roles?: ColumnRole[];
  /** When true, the amount column is computed as qty×rate. */
  autoAmount?: boolean;
  /** Render a per-table subtotal row. */
  showSubtotal?: boolean;
}

export interface SummaryBlock extends QuoteBlockBase {
  type: 'summary';
  showSubtotal?: boolean;
  showGst?: boolean;
  showDiscount?: boolean;
  showGrandTotal?: boolean;
  subtotalLabel?: string;
  gstLabel?: string;
  discountLabel?: string;
  grandTotalLabel?: string;
}

export interface FieldRow { id: string; label: string; value: string; }
export interface FieldsBlock extends QuoteBlockBase {
  type: 'fields';
  fields: FieldRow[];
}

export interface SignatureBlock extends QuoteBlockBase {
  type: 'signature';
  signerName?: string;
  signerTitle?: string;
  place?: string;
  dateLabel?: string;
  imageUrl?: string;
}

export type QuoteBlock =
  | ItemsBlock | TextBlock | ImageBlock | TableBlock
  | SummaryBlock | FieldsBlock | SignatureBlock;

export interface QuotePage {
  id: string;
  blocks: QuoteBlock[];
}

export interface QuoteBranding {
  showHeader: boolean;
  name: string;
  tagline?: string;
  logoUrl?: string;
  addressLines: string[];
  phone?: string;
  email?: string;
  website?: string;
  gstin?: string;
}

export interface QuoteMeta {
  quoteTitle: string;
  quoteNumber: string;
  date: string;
  validityDays: number;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
}

/** Doc-level calculation settings used by computeTotals + the summary block. */
export interface QuoteCalc {
  gstPercent: number;
  discount: number;
  /** When true, `discount` is a percentage of subtotal; else an absolute amount. */
  discountIsPercent?: boolean;
}

export interface QuoteDoc {
  branding: QuoteBranding;
  meta: QuoteMeta;
  pages: QuotePage[];
  footerText: string;
  accent: string;
  calc?: QuoteCalc;
  /** Saved revision history (appended on each save). */
  revisions?: QuoteRevision[];
}

export interface QuoteRevision {
  version: number;
  savedAt: string;
  total: number;
  status: string;
}

/** Append a revision entry before persisting an updated quote. */
export function appendQuoteRevision(doc: QuoteDoc, total: number, status: string): QuoteDoc {
  const revisions = [...(doc.revisions || [])];
  revisions.push({
    version: revisions.length + 1,
    savedAt: new Date().toISOString(),
    total,
    status,
  });
  return { ...doc, revisions };
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: 'Studio Sara',
  tagline: 'Bespoke manufacturing & private label',
  logoUrl: '',
  addressLines: ['123 Atelier Lane, Design District', 'Jaipur, Rajasthan 302001', 'India'],
  phone: '+91 98290 00000',
  email: 'hello@studiosara.cloud',
  website: 'studiosara.cloud',
  gstin: '08ABCDE1234F1Z5',
};

export function newId(prefix = 'b'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Infer ColumnRole[] from header names. Mirrors the legacy /amount|total/i
 * policy so that quotes saved before column-roles existed total identically.
 */
export function inferColumnRoles(columns: string[]): ColumnRole[] {
  return columns.map((c) => {
    if (/qty|quantity|units?/i.test(c)) return 'qty';
    if (/rate|price|unit\s*cost/i.test(c)) return 'rate';
    if (/amount|total|sub\s*total/i.test(c)) return 'amount';
    return 'text';
  });
}

export function createBlock(type: QuoteBlockType): QuoteBlock {
  switch (type) {
    case 'items':
      return {
        id: newId(), type: 'items', title: 'Line items', align: 'left',
        showSubtotal: true,
        items: [
          { id: newId('i'), description: 'Item one', qty: 1, rate: 0 },
          { id: newId('i'), description: 'Item two', qty: 1, rate: 0 },
        ],
      };
    case 'text':
      return { id: newId(), type: 'text', title: '', align: 'left', text: 'Write your content here…' };
    case 'image':
      return { id: newId(), type: 'image', title: '', align: 'center', url: '', caption: '', width: 'full' };
    case 'table':
      // Free-form data grid. NO auto-calc, NO totals — for specs/notes/etc.
      return {
        id: newId(),
        type: 'table',
        title: '',
        align: 'left',
        columns: ['Specification', 'Detail'],
        roles: ['text', 'text'],
        autoAmount: false,
        showSubtotal: false,
        rows: [
          ['Material', 'Oak veneer'],
          ['Finish', 'Matte'],
        ],
      };
    case 'summary':
      return {
        id: newId(), type: 'summary', title: 'Summary', align: 'right',
        showSubtotal: true, showGst: true, showDiscount: true, showGrandTotal: true,
      };
    case 'fields':
      return {
        id: newId(), type: 'fields', title: '', align: 'left',
        fields: [{ id: newId('f'), label: 'Lead time', value: '3 weeks' }],
      };
    case 'signature':
      return {
        id: newId(), type: 'signature', title: '', align: 'right',
        signerTitle: 'Authorised Signatory', dateLabel: 'Date',
      };
    default:
      return { id: newId(), type: 'text', title: '', align: 'left', text: '' };
  }
}

/** Map the store-wide business config (/admin-sara/business-config) to branding. */
export function businessConfigToProfile(cfg: Record<string, unknown> | null | undefined): CompanyProfile | null {
  if (!cfg) return null;
  const get = (k: string) => (typeof cfg[k] === 'string' ? (cfg[k] as string).trim() : '');
  const cityLine = [get('businessCity'), get('businessState'), get('businessPincode')].filter(Boolean).join(', ');
  const addressLines = [get('businessAddress'), cityLine].filter((s) => s.length > 0);
  return {
    name: get('businessName') || DEFAULT_COMPANY_PROFILE.name,
    tagline: get('businessTagline'),
    logoUrl: get('businessLogo') || get('logoUrl'),
    addressLines: addressLines.length ? addressLines : DEFAULT_COMPANY_PROFILE.addressLines,
    phone: get('businessPhone'),
    email: get('businessEmail'),
    website: get('businessWebsite') || get('website'),
    gstin: get('businessGstin'),
  };
}

export function companyToBranding(profile: CompanyProfile | null): QuoteBranding {
  const p = profile ?? DEFAULT_COMPANY_PROFILE;
  return {
    showHeader: true,
    name: p.name || DEFAULT_COMPANY_PROFILE.name,
    tagline: p.tagline,
    logoUrl: p.logoUrl,
    addressLines: p.addressLines?.length ? p.addressLines : DEFAULT_COMPANY_PROFILE.addressLines,
    phone: p.phone,
    email: p.email,
    website: p.website,
    gstin: p.gstin,
  };
}

export function defaultQuoteDoc(profile: CompanyProfile | null): QuoteDoc {
  const today = new Date().toISOString().slice(0, 10);
  return {
    branding: companyToBranding(profile),
    meta: {
      quoteTitle: 'Quotation',
      quoteNumber: '',
      date: today,
      validityDays: 15,
      clientName: '',
      clientEmail: '',
      clientAddress: '',
    },
    pages: [
      {
        id: newId('p'),
        blocks: [
          { id: newId(), type: 'text', title: 'Introduction', align: 'left', text: 'Thank you for your inquiry. Please find our proposed quotation below.' },
          {
            id: newId(),
            type: 'items',
            title: 'Line items',
            align: 'left',
            showSubtotal: true,
            items: [
              { id: newId('i'), description: 'Sampling cost', qty: 1, rate: 0 },
              { id: newId('i'), description: 'Unit manufacturing', qty: 1, rate: 0 },
            ],
          },
          {
            id: newId(),
            type: 'summary',
            title: 'Summary',
            align: 'right',
            showSubtotal: true, showGst: true, showDiscount: true, showGrandTotal: true,
          },
          { id: newId(), type: 'text', title: 'Terms', align: 'left', text: '50% advance, balance before dispatch. Prices valid for 15 days.' },
        ],
      },
    ],
    footerText: 'Thank you for choosing Studio Sara · This quotation is confidential.',
    accent: '#924623',
    calc: { gstPercent: 18, discount: 0 },
  };
}

/* ---------- normalization (back-compat keystone) ---------- */

function normalizeBlock(b: QuoteBlock): QuoteBlock {
  if (b.type === 'items') {
    const it = b as ItemsBlock;
    return {
      ...it,
      showSubtotal: it.showSubtotal ?? true,
      items: (it.items || []).map((x) => ({
        id: x.id || newId('i'),
        description: x.description || '',
        qty: Number(x.qty) || 0,
        rate: Number(x.rate) || 0,
      })),
    };
  }
  if (b.type === 'table') {
    const t = b as TableBlock;
    const roles = (Array.isArray(t.roles) && t.roles.length === t.columns.length)
      ? t.roles
      : inferColumnRoles(t.columns);
    // autoAmount defaults FALSE for legacy tables so a load never silently
    // rewrites manually-typed amounts; createBlock seeds it true for new ones.
    return { ...t, roles, autoAmount: t.autoAmount ?? false, showSubtotal: t.showSubtotal ?? false };
  }
  if (b.type === 'fields') {
    const f = b as FieldsBlock;
    return { ...f, fields: (f.fields || []).map((row) => ({ id: row.id || newId('f'), label: row.label || '', value: row.value || '' })) };
  }
  return b; // text / image / summary / signature pass through unchanged
}

function normalizePage(pg: QuotePage): QuotePage {
  return { id: pg.id || newId('p'), blocks: (pg.blocks || []).map(normalizeBlock) };
}

/** Merge a stored doc with a fresh default so missing keys never break the editor. */
export function normalizeQuoteDoc(raw: unknown, profile: CompanyProfile | null): QuoteDoc {
  const base = defaultQuoteDoc(profile);
  if (!raw || typeof raw !== 'object') return base;
  const d = raw as Partial<QuoteDoc>;
  const pages = Array.isArray(d.pages) && d.pages.length
    ? (d.pages as QuotePage[]).map(normalizePage)
    : base.pages;
  return {
    branding: { ...base.branding, ...(d.branding || {}) },
    meta: { ...base.meta, ...(d.meta || {}) },
    pages,
    footerText: d.footerText ?? base.footerText,
    accent: d.accent ?? base.accent,
    calc: { gstPercent: 0, discount: 0, ...(d.calc || {}) },
  };
}
