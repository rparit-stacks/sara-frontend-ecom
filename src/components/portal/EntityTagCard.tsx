import { Sym } from './Sym';

/** All chat @-mention entity tag types share one `[[type:field=val|field=val]]` bracket-pipe
 *  marker convention (same as the existing [[product:...]] / [[payment:...]] markers) and one
 *  chip renderer — adding a new taggable entity means adding one entry to ENTITY_META plus a
 *  builder/parser pair, not a whole new component. */
export type EntityTagType = 'project' | 'design' | 'invoice' | 'quote' | 'file';

export interface ParsedEntityTag {
  type: EntityTagType;
  key: string; // the id used to navigate: project code, design id, invoice/quote id, or file url
  title: string;
  subtitle?: string;
  /** Design tags only — the project the design lives in, needed to navigate there. */
  projectCode?: string;
}

const ENTITY_META: Record<EntityTagType, { icon: string; label: string }> = {
  project: { icon: 'folder', label: 'Project' },
  design: { icon: 'palette', label: 'Design' },
  invoice: { icon: 'receipt_long', label: 'Invoice' },
  quote: { icon: 'request_quote', label: 'Quote' },
  file: { icon: 'attach_file', label: 'File' },
};

function extractField(payload: string, key: string): string {
  const re = new RegExp(`(?:^|\\|)${key}=([^|\\]]+)`);
  const m = payload.match(re);
  return m ? decodeURIComponent(m[1].trim()) : '';
}

function buildMarker(type: EntityTagType, fields: Record<string, string | undefined>): string {
  const parts = Object.entries(fields)
    .filter((entry): entry is [string, string] => !!entry[1])
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  return `[[${type}:${parts.join('|')}]]`;
}

export function buildProjectTagMarker(p: { code: string; title: string; stage?: string }): string {
  return buildMarker('project', { code: p.code, title: p.title, stage: p.stage });
}

export function buildDesignTagMarker(d: { id: number | string; name: string; stage?: string; projectCode?: string }): string {
  return buildMarker('design', { id: String(d.id), name: d.name, stage: d.stage, projectCode: d.projectCode });
}

export function buildInvoiceTagMarker(i: { id: number | string; reference: string; title?: string; amount?: string; status?: string; projectCode?: string }): string {
  return buildMarker('invoice', { id: String(i.id), reference: i.reference, title: i.title, amount: i.amount, status: i.status, projectCode: i.projectCode });
}

export function buildQuoteTagMarker(q: { id: number | string; reference: string; title?: string; total?: string; status?: string; projectCode?: string }): string {
  return buildMarker('quote', { id: String(q.id), reference: q.reference, title: q.title, total: q.total, status: q.status, projectCode: q.projectCode });
}

export function buildFileTagMarker(f: { url: string; name: string }): string {
  return buildMarker('file', { url: f.url, name: f.name });
}

/** Matches any `[[type:...]]` entity marker — used both by RichMessageBody's inline tokenizer
 *  and by stripping helpers that need every marker type recognized in one pass. */
export const ENTITY_MARKER_RE = /\[\[(?:project|design|invoice|quote|file):[^\]]+\]\]/g;

export function parseEntityTag(token: string): ParsedEntityTag | null {
  const m = token.match(/^\[\[(project|design|invoice|quote|file):([^\]]+)\]\]$/);
  if (!m) return null;
  const type = m[1] as EntityTagType;
  const payload = m[2];
  switch (type) {
    case 'project': {
      const code = extractField(payload, 'code');
      if (!code) return null;
      const title = extractField(payload, 'title') || code;
      const stage = extractField(payload, 'stage');
      return { type, key: code, title, subtitle: stage || undefined };
    }
    case 'design': {
      const id = extractField(payload, 'id');
      if (!id) return null;
      const name = extractField(payload, 'name') || `Design ${id}`;
      const projectCode = extractField(payload, 'projectCode');
      const stage = extractField(payload, 'stage');
      return { type, key: id, title: name, subtitle: [projectCode, stage].filter(Boolean).join(' · ') || undefined, projectCode: projectCode || undefined };
    }
    case 'invoice': {
      const id = extractField(payload, 'id');
      if (!id) return null;
      const reference = extractField(payload, 'reference') || `#${id}`;
      const amount = extractField(payload, 'amount');
      const status = extractField(payload, 'status');
      const projectCode = extractField(payload, 'projectCode');
      return { type, key: id, title: reference, subtitle: [amount, status].filter(Boolean).join(' · ') || undefined, projectCode: projectCode || undefined };
    }
    case 'quote': {
      const id = extractField(payload, 'id');
      if (!id) return null;
      const reference = extractField(payload, 'reference') || `#${id}`;
      const total = extractField(payload, 'total');
      const status = extractField(payload, 'status');
      const projectCode = extractField(payload, 'projectCode');
      return { type, key: id, title: reference, subtitle: [total, status].filter(Boolean).join(' · ') || undefined, projectCode: projectCode || undefined };
    }
    case 'file': {
      const url = extractField(payload, 'url');
      if (!url) return null;
      const name = extractField(payload, 'name') || url.split('/').pop() || 'File';
      return { type, key: url, title: name };
    }
    default:
      return null;
  }
}

export function parseEntityTags(body?: string): ParsedEntityTag[] {
  if (!body) return [];
  const matches = body.match(ENTITY_MARKER_RE);
  if (!matches) return [];
  return matches.map(parseEntityTag).filter((t): t is ParsedEntityTag => t != null);
}

export function stripEntityTagMarkers(body?: string): string {
  if (!body) return '';
  return body.replace(ENTITY_MARKER_RE, '').trim();
}

/** Inline chip — renders wherever any @entity mention lands in running text. Colors come from
 *  the `.chat-tag-chip` CSS rule (portal.css), which reads --bubble-fg/--bubble-chip-bg from
 *  whichever `.chat-bubble-body`/`.chat-bubble-mine` ancestor it's rendered inside. */
export default function EntityTagChip({ data, onClick }: { data: ParsedEntityTag; onClick?: (tag: ParsedEntityTag) => void }) {
  const meta = ENTITY_META[data.type];
  return (
    <button
      type="button"
      onClick={() => onClick?.(data)}
      title={`Open ${meta.label.toLowerCase()}: ${data.title}`}
      className="chat-tag-chip inline-flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-md text-[13px] font-semibold align-middle border border-dashed"
    >
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm shrink-0 chat-tag-chip-icon">
        <Sym name={meta.icon} className="text-[11px]" />
      </span>
      <span className="text-[9px] font-bold uppercase tracking-wide opacity-70">{meta.label}</span>
      <span>{data.title}</span>
      {data.subtitle && <span className="opacity-70 text-[11px]">· {data.subtitle}</span>}
    </button>
  );
}
