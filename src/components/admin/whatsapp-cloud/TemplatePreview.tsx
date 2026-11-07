import { FileText, Image as ImageIcon, Link2, Phone, Reply, Copy, Video } from 'lucide-react';
import { TemplateParts, fillText } from '@/lib/waTemplateRules';
import { cn } from '@/lib/utils';

/** Renders text with *bold*, _italic_ and ~strike~ the way WhatsApp shows it. */
const formatted = (text: string) => {
  const nodes: (string | JSX.Element)[] = [];
  const pattern = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index! > last) nodes.push(text.slice(last, m.index));
    const inner = m[0].slice(1, -1);
    const c = m[0][0];
    nodes.push(c === '*' ? <strong key={i++}>{inner}</strong> : c === '_' ? <em key={i++}>{inner}</em> : <s key={i++}>{inner}</s>);
    last = m.index! + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

const MediaBlock = ({ format }: { format: string }) => {
  const Icon = format === 'VIDEO' ? Video : format === 'DOCUMENT' ? FileText : ImageIcon;
  return (
    <div className="mb-2 flex h-28 items-center justify-center rounded-md bg-slate-200 text-slate-500">
      <Icon className="h-8 w-8" />
      <span className="ml-2 text-xs capitalize">{format.toLowerCase()}</span>
    </div>
  );
};

export const TemplatePreview = ({
  parts, values = {}, headerValue = '', className,
}: { parts: TemplateParts; values?: Record<string, string>; headerValue?: string; className?: string }) => {
  const headerText = parts.header?.format === 'TEXT' ? fillText(parts.header.text, { '1': headerValue }) : '';
  return (
    <div className={cn('rounded-xl bg-[#e7ddd3] p-3', className)}>
      <div className="mx-auto max-w-sm">
        <div className="rounded-lg rounded-tl-none bg-white p-3 text-sm">
          {parts.header && parts.header.format !== 'TEXT' && <MediaBlock format={parts.header.format} />}
          {headerText && <p className="mb-1 font-semibold">{headerText}</p>}
          <p className="whitespace-pre-wrap break-words">{formatted(fillText(parts.body || '…', values))}</p>
          {parts.footer && <p className="mt-2 text-xs text-slate-500">{parts.footer}</p>}
        </div>
        {parts.buttons.length > 0 && (
          <div className="mt-1 space-y-1">
            {parts.buttons.map((b) => {
              const Icon = b.type === 'URL' ? Link2 : b.type === 'PHONE_NUMBER' ? Phone : b.type === 'COPY_CODE' || b.type === 'OTP' ? Copy : Reply;
              return (
                <div key={`${b.index}-${b.text}`} className="flex items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-sm font-medium text-sky-600">
                  <Icon className="h-3.5 w-3.5" /> {b.text || 'Button'}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
