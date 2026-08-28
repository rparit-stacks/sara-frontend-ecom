import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseProductCard, stripProductMarker } from './ProductCard';
import LinkPreviewCard, { firstUrl } from './LinkPreviewCard';
import MessageLinkPreviewCard, { parseMessageLink } from './MessageLinkPreviewCard';
import EntityTagChip, { parseEntityTag, type ParsedEntityTag } from './EntityTagCard';
import { setPendingFilePreview } from './filePreviewBridge';

/** Navigate to a tagged entity's workspace pane, staying on whichever side (client/admin)
 *  is currently open. Design/invoice/quote all resolve to a resource pane on the tagged
 *  entity's own project — none of them have a dedicated per-item detail route yet. A file
 *  tag has no route at all; it opens the shared FilePreviewModal via a tiny pub/sub bridge
 *  (filePreviewBridge) since RichMessageBody can render deep inside a thread panel that has
 *  no direct access to the workspace page's preview-modal state. */
function goToTaggedEntity(navigate: ReturnType<typeof useNavigate>, tag: ParsedEntityTag) {
  const base = window.location.pathname.startsWith('/portal-admin') ? '/portal-admin' : '/portal';
  if (tag.type === 'file') {
    setPendingFilePreview({ url: tag.key, name: tag.title });
    return;
  }
  if (tag.type === 'project') {
    navigate(`${base}/workspace-preview?project=${encodeURIComponent(tag.key)}`);
    return;
  }
  if (tag.type === 'design') {
    if (tag.projectCode) navigate(`${base}/workspace-preview?project=${encodeURIComponent(tag.projectCode)}&tab=design&design=${encodeURIComponent(tag.key)}`);
    return;
  }
  if (tag.type === 'invoice') {
    if (tag.projectCode) navigate(`${base}/workspace-preview?project=${encodeURIComponent(tag.projectCode)}&tab=resource&resource=invoices`);
    return;
  }
  if (tag.type === 'quote') {
    if (tag.projectCode) navigate(`${base}/workspace-preview?project=${encodeURIComponent(tag.projectCode)}&tab=resource&resource=quotation`);
  }
}

/** Lightweight markdown: **bold**, *italic*, `code`, [links](url), bare URLs, bullets, numbered lists, @project tags.
 *  Link/chip colors come from the `.chat-bubble-body`/`.chat-bubble-mine` CSS context (portal.css) — callers don't
 *  need to pass a `mine` flag; wrap the "mine" bubble in a `chat-bubble-mine` ancestor and it flips automatically. */
export function RichMessageBody({ text, className = '', showLinkPreview = true }: { text: string; className?: string; showLinkPreview?: boolean }) {
  const navigate = useNavigate();
  const cleaned = stripProductMarker(text);
  const previewUrl = showLinkPreview ? firstUrl(cleaned) : null;
  const messageLink = previewUrl ? parseMessageLink(previewUrl) : null;
  const lines = cleaned.split('\n');
  const blocks: ReactNode[] = [];
  let bulletRun: string[] = [];
  let numberRun: { n: number; text: string }[] = [];

  const flushBullets = (key: string) => {
    if (!bulletRun.length) return;
    blocks.push(
      <ul key={key} className="list-disc pl-5 my-1 space-y-0.5">
        {bulletRun.map((line, i) => (
          <li key={i} className="text-[15px] leading-relaxed">{inlineFormat(line, navigate)}</li>
        ))}
      </ul>,
    );
    bulletRun = [];
  };

  const flushNumbers = (key: string) => {
    if (!numberRun.length) return;
    blocks.push(
      <ol key={key} className="list-decimal pl-5 my-1 space-y-0.5">
        {numberRun.map((item, i) => (
          <li key={i} className="text-[15px] leading-relaxed" value={item.n}>{inlineFormat(item.text, navigate)}</li>
        ))}
      </ol>,
    );
    numberRun = [];
  };

  lines.forEach((line, idx) => {
    const bullet = line.match(/^\s*[-•]\s+(.*)$/);
    const numbered = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (bullet) {
      flushNumbers(`n-${idx}`);
      bulletRun.push(bullet[1]);
      return;
    }
    if (numbered) {
      flushBullets(`b-${idx}`);
      numberRun.push({ n: parseInt(numbered[1], 10), text: numbered[2] });
      return;
    }
    flushBullets(`b-${idx}`);
    flushNumbers(`n-${idx}`);
    if (line.trim()) {
      blocks.push(
        <p key={`p-${idx}`} className="text-[15px] leading-relaxed mb-1 last:mb-0 whitespace-pre-wrap">
          {inlineFormat(line, navigate)}
        </p>,
      );
    } else if (idx < lines.length - 1) {
      blocks.push(<div key={`sp-${idx}`} className="h-2" />);
    }
  });
  flushBullets('b-end');
  flushNumbers('n-end');

  return (
    <div className={`chat-bubble-body ${className}`}>
      {blocks}
      {messageLink ? <MessageLinkPreviewCard link={messageLink} /> : previewUrl && <LinkPreviewCard url={previewUrl} />}
    </div>
  );
}

function inlineFormat(text: string, navigate: ReturnType<typeof useNavigate>): ReactNode[] {
  const parts: ReactNode[] = [];
  // Added a bare-URL token (http/https) and an entity-tag token (@project/@design/@invoice/
  // @quote/@file) so both render inline.
  const re = /(\[\[(?:project|design|invoice|quote|file):[^\]]+\]\]|\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|https?:\/\/[^\s<]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('[[')) {
      const tag = parseEntityTag(tok);
      if (tag) {
        parts.push(<EntityTagChip key={k++} data={tag} onClick={(t) => goToTaggedEntity(navigate, t)} />);
      }
    } else if (tok.startsWith('http://') || tok.startsWith('https://')) {
      // Trim trailing punctuation that's likely sentence punctuation, not part of the URL.
      const trail = tok.match(/[.,;:!?)\]]+$/);
      const href = trail ? tok.slice(0, -trail[0].length) : tok;
      parts.push(
        <a key={k++} href={href} target="_blank" rel="noreferrer" className="underline font-medium break-all">
          {href}
        </a>,
      );
      if (trail) parts.push(trail[0]);
    } else if (tok.startsWith('[')) {
      const link = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        parts.push(
          <a key={k++} href={link[2]} target="_blank" rel="noreferrer" className="underline font-medium break-all">
            {link[1]}
          </a>,
        );
      } else {
        parts.push(tok);
      }
    } else if (tok.startsWith('`')) {
      parts.push(
        <code key={k++} className="px-1 py-0.5 rounded text-[13px] font-mono" style={{ background: 'var(--p-surface-container-high)' }}>
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith('**') || tok.startsWith('__')) {
      parts.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}

/** Render body with optional embedded product card above text. */
export function MessageBodyContent({ body, className }: { body?: string; className?: string }) {
  if (!body || body === '(attachment)') return null;
  const product = parseProductCard(body);
  const text = stripProductMarker(body);
  return (
    <>
      {product ? <div className="mb-2">{/* ProductCard rendered by parent */}</div> : null}
      {text ? <RichMessageBody text={text} className={className} /> : null}
    </>
  );
}

export default RichMessageBody;
