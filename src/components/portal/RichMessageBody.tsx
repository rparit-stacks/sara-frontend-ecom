import type { ReactNode } from 'react';
import { parseProductCard, stripProductMarker } from './ProductCard';
import LinkPreviewCard, { firstUrl } from './LinkPreviewCard';

/** Lightweight markdown: **bold**, *italic*, `code`, [links](url), bare URLs, bullets, numbered lists. */
export function RichMessageBody({ text, className = '', showLinkPreview = true }: { text: string; className?: string; showLinkPreview?: boolean }) {
  const cleaned = stripProductMarker(text);
  const previewUrl = showLinkPreview ? firstUrl(cleaned) : null;
  const lines = cleaned.split('\n');
  const blocks: ReactNode[] = [];
  let bulletRun: string[] = [];
  let numberRun: { n: number; text: string }[] = [];

  const flushBullets = (key: string) => {
    if (!bulletRun.length) return;
    blocks.push(
      <ul key={key} className="list-disc pl-5 my-1 space-y-0.5">
        {bulletRun.map((line, i) => (
          <li key={i} className="text-[15px] leading-relaxed">{inlineFormat(line)}</li>
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
          <li key={i} className="text-[15px] leading-relaxed" value={item.n}>{inlineFormat(item.text)}</li>
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
          {inlineFormat(line)}
        </p>,
      );
    } else if (idx < lines.length - 1) {
      blocks.push(<div key={`sp-${idx}`} className="h-2" />);
    }
  });
  flushBullets('b-end');
  flushNumbers('n-end');

  return (
    <div className={className}>
      {blocks}
      {previewUrl && <LinkPreviewCard url={previewUrl} />}
    </div>
  );
}

function inlineFormat(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // Added a bare-URL token (http/https) so raw links become clickable too.
  const re = /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|https?:\/\/[^\s<]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('http://') || tok.startsWith('https://')) {
      // Trim trailing punctuation that's likely sentence punctuation, not part of the URL.
      const trail = tok.match(/[.,;:!?)\]]+$/);
      const href = trail ? tok.slice(0, -trail[0].length) : tok;
      parts.push(
        <a key={k++} href={href} target="_blank" rel="noreferrer" className="underline font-medium break-all" style={{ color: 'var(--p-primary)' }}>
          {href}
        </a>,
      );
      if (trail) parts.push(trail[0]);
    } else if (tok.startsWith('[')) {
      const link = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        parts.push(
          <a key={k++} href={link[2]} target="_blank" rel="noreferrer" className="underline font-medium break-all" style={{ color: 'var(--p-primary)' }}>
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
