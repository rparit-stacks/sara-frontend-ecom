import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Shared "real markdown" rendering for AI-generated chat messages — extracted from the
 * site-wide homepage AI widget's `MessageBubble` (src/components/ai-chat/MessageBubble.tsx),
 * which already handles bold/italic/lists/tables/code/headings/blockquotes/hr correctly via
 * ReactMarkdown's standard remark pipeline (+ remark-gfm for table support). The Portal's AI
 * messages (General Chat + design/announcement channels, both client and admin) previously ran
 * through `RichMessageBody`'s hand-rolled regex parser, which has no table support and shows
 * raw asterisks/etc. for anything beyond its narrow bullet/bold/italic/code/link coverage.
 *
 * Human-sent chat messages keep using `RichMessageBody` (entity tags, link/product previews,
 * @-mention chips) — this component is for AI-authored message bodies only.
 */

/**
 * Defensive net: the model is instructed never to emit raw HTML, but if it slips through
 * anyway, showing literal "<ul><li>" text reads as broken far worse than just stripping tags —
 * so strip rather than trust the prompt alone. Common list/paragraph tags become newlines
 * first so stripping doesn't glue words together; anything else just vanishes.
 */
function stripStrayHtml(text: string): string {
  if (!/<[a-z][\s\S]*>/i.test(text)) return text; // fast path: no tags at all
  return text
    .replace(/<\/(li|p|div)>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Keep chat links on the host the user is actually browsing (localhost or live). */
function resolveChatHref(href: string | null | undefined): string | undefined {
  if (!href) return undefined;
  const trimmed = href.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (typeof window === 'undefined') return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${window.location.origin}${path}`;
}

/**
 * Very cheap "is this markdown safe-ish to render mid-stream" check. Partial markdown can look
 * genuinely broken while only half-received — an open ``` code fence or an open table row with
 * no closing pipe renders as a garbled mess until the rest arrives. Rather than build an
 * incremental-markdown-AST-patcher, we take the common, reasonable trade-off: while a chunk
 * looks structurally incomplete, fall back to plain preformatted text (still updates live, still
 * shows every token as it streams in) and only switch to full ReactMarkdown once the accumulated
 * text no longer has an unterminated fenced code block or an obviously-open table. It snaps to
 * fully-correct rendering the moment `ai-done` fires (final text is always structurally complete).
 */
function looksStreamSafe(text: string): boolean {
  const fenceMatches = text.match(/```/g);
  if (fenceMatches && fenceMatches.length % 2 !== 0) return false; // open code fence
  const lines = text.split('\n');
  const lastLine = lines[lines.length - 1] ?? '';
  // A table row that's still being typed (starts with | but hasn't reached a newline yet).
  if (/^\s*\|/.test(lastLine) && !lastLine.trim().endsWith('|')) return false;
  return true;
}

export interface MarkdownMessageBodyProps {
  text: string;
  className?: string;
  /** True while this text is still growing via streaming deltas (not yet the final persisted
   *  message) — enables the lenient partial-markdown fallback described above. */
  streaming?: boolean;
}

/** Renders AI message text as real markdown (bold/italic/headings/lists/tables/code/links/
 *  blockquotes/hr) via react-markdown + remark-gfm, matching the homepage widget's rendering. */
export function MarkdownMessageBody({ text, className = '', streaming = false }: MarkdownMessageBodyProps) {
  const cleaned = stripStrayHtml(text);

  if (streaming && !looksStreamSafe(cleaned)) {
    return (
      <div className={`whitespace-pre-wrap text-[15px] leading-relaxed ${className}`}>{cleaned}</div>
    );
  }

  return (
    <div
      className={`markdown-message-body text-[15px] leading-relaxed [&_blockquote]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:opacity-80 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:font-mono [&_h1]:my-1.5 [&_h1]:text-[1.15em] [&_h1]:font-bold [&_h2]:my-1.5 [&_h2]:text-[1.08em] [&_h2]:font-bold [&_h3]:my-1 [&_h3]:font-semibold [&_hr]:my-2 [&_hr]:opacity-30 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_pre]:my-1.5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-2.5 [&_strong]:font-semibold [&_table]:my-1.5 [&_table]:w-full [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_th]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={resolveChatHref(href)} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownMessageBody;
