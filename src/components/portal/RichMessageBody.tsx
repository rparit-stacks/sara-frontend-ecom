import type { ReactNode } from 'react';

/** Lightweight markdown: **bold**, *italic*, `code`, [links](url), bullet lines (- or •). */
export function RichMessageBody({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let bulletRun: string[] = [];

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

  lines.forEach((line, idx) => {
    const bullet = line.match(/^\s*[-•]\s+(.*)$/);
    if (bullet) {
      bulletRun.push(bullet[1]);
      return;
    }
    flushBullets(`b-${idx}`);
    if (line.trim()) {
      blocks.push(
        <p key={`p-${idx}`} className="text-[15px] leading-relaxed mb-1 last:mb-0">
          {inlineFormat(line)}
        </p>,
      );
    } else if (idx < lines.length - 1) {
      blocks.push(<div key={`sp-${idx}`} className="h-2" />);
    }
  });
  flushBullets('b-end');

  return <div className={className}>{blocks}</div>;
}

function inlineFormat(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('[')) {
      const link = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        parts.push(
          <a key={k++} href={link[2]} target="_blank" rel="noreferrer" className="underline font-medium" style={{ color: 'var(--p-primary)' }}>
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

export default RichMessageBody;
