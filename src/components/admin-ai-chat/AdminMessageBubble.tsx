import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ExternalLink, Terminal } from 'lucide-react';
import type { AdminChatMessage } from './types';

function stripStrayHtml(text: string): string {
  if (!/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .replace(/<\/(li|p|div)>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function resolveHref(href: string | null | undefined): string | undefined {
  if (!href) return undefined;
  const trimmed = href.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (typeof window === 'undefined') return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${window.location.origin}${path}`;
}

interface Props {
  message: AdminChatMessage;
}

export function AdminMessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`flex w-full gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 ring-1 ring-amber-200">
          <Terminal className="h-3.5 w-3.5" />
        </span>
      )}

      <div className={`flex max-w-[85%] flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {message.imageUrls && message.imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.imageUrls.map((url, i) => (
              <img
                key={`${url}-${i}`}
                src={url}
                alt="Upload"
                className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200"
              />
            ))}
          </div>
        )}

        {message.text && (
          <div
            className={`rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 ${
              isUser
                ? 'rounded-br-sm bg-amber-500 text-white'
                : 'rounded-bl-sm bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/80'
            }`}
          >
            {isUser ? (
              <span className="whitespace-pre-wrap">{message.text}</span>
            ) : (
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={resolveHref(href)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 underline decoration-amber-300 underline-offset-2"
                    >
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
            {message.visualCards.map((card, i) => {
              const href = resolveHref(card.linkUrl);
              const inner = (
                <>
                  {card.imageUrl && (
                    <img
                      src={card.imageUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-md object-cover ring-1 ring-slate-200"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{card.title}</p>
                    {card.subtitle && (
                      <p className="truncate text-xs text-slate-400">{card.subtitle}</p>
                    )}
                  </div>
                  {href && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-amber-600" />}
                </>
              );
              return href ? (
                <a
                  key={`${card.title}-${i}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-200 transition hover:ring-amber-300"
                >
                  {inner}
                </a>
              ) : (
                <div
                  key={`${card.title}-${i}`}
                  className="flex items-center gap-3 rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-200"
                >
                  {inner}
                </div>
              );
            })}
          </div>
        )}

        {message.table && message.table.columns?.length > 0 && (
          <div className="w-full max-w-full overflow-x-auto rounded-lg ring-1 ring-slate-200">
            {message.table.title && (
              <p className="bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
                {message.table.title}
              </p>
            )}
            <table className="w-full text-left text-[11px] text-slate-700">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {message.table.columns.map((col) => (
                    <th key={col} className="whitespace-nowrap px-2.5 py-1.5 font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {message.table.rows.map((row, ri) => (
                  <tr key={ri} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/70">
                    {row.map((cell, ci) => (
                      <td key={ci} className="whitespace-nowrap px-2.5 py-1.5">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
