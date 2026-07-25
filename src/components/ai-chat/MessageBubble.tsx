import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Sparkles, ExternalLink } from 'lucide-react';
import type { ChatMessage } from './types';

interface MessageBubbleProps {
  message: ChatMessage;
}

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

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (message.role === 'divider') {
    return (
      <div className="flex items-center gap-3 py-1 text-[11px] font-medium text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {message.text}
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex w-full gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/70 text-primary-foreground shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
      )}

      <div className={`flex max-w-[82%] flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {message.justLinkedToAccount && !isUser && (
          <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-primary">
            ✓ You're logged in — continuing where we left off
          </span>
        )}

        {message.imageUrls && message.imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.imageUrls.map((url, i) => (
              <img
                key={`${url}-${i}`}
                src={url}
                alt="Uploaded"
                className="h-24 w-24 rounded-xl object-cover shadow-soft ring-1 ring-black/[0.06]"
              />
            ))}
          </div>
        )}

        {message.text && (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 ${
              isUser
                ? 'rounded-br-md bg-primary text-primary-foreground'
                : 'rounded-bl-md bg-white text-foreground ring-1 ring-black/[0.06]'
            }`}
          >
            {isUser ? (
              <span className="whitespace-pre-wrap">{message.displayText || message.text}</span>
            ) : (
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => (
                    <a href={resolveChatHref(href)} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {stripStrayHtml(message.text)}
              </ReactMarkdown>
            )}
          </div>
        )}

        {message.visualCards && message.visualCards.length > 0 && (
          <div className="flex w-full flex-col gap-2">
            {message.visualCards.map((card, i) => (
              <a
                key={`${card.title}-${i}`}
                href={resolveChatHref(card.linkUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-soft ring-1 ring-black/[0.06] transition-all hover:-translate-y-0.5 hover:shadow-medium"
              >
                {card.imageUrl && (
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{card.title}</p>
                  {card.subtitle && (
                    <p className="truncate text-xs text-muted-foreground">{card.subtitle}</p>
                  )}
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}

        {message.table && message.table.columns.length > 0 && (
          <div className="w-full overflow-x-auto rounded-xl bg-white shadow-soft ring-1 ring-black/[0.06]">
            {message.table.title && (
              <p className="border-b border-black/[0.06] px-3 py-2 text-xs font-semibold text-foreground">
                {message.table.title}
              </p>
            )}
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black/[0.06] bg-secondary/40">
                  {message.table.columns.map((col, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-muted-foreground">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {message.table.rows.map((row, i) => (
                  <tr key={i} className="border-b border-black/[0.04] last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-foreground">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {message.portalRedirect && (
          <a
            href={resolveChatHref(message.portalRedirect.route)}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-secondary/70"
          >
            {message.portalRedirect.label}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </motion.div>
  );
}
