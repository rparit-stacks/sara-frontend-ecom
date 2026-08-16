import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/portal/formbuilder/types';
import { isDisplay } from '@/components/portal/formbuilder/registry';
import { mediaApi } from '@/lib/api';
import { COUNTRY_CODES } from '@/lib/countryCodes';

interface Props {
  field: FormField;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  error?: string;
}

export default function WebsiteInquiryField({ field, value, onChange, error }: Props) {
  if (field.hidden) return null;

  const label = (
    <label className="block text-sm font-medium mb-1.5">
      {field.label}
      {field.required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );

  const desc = field.description ? (
    <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
  ) : null;

  const err = error ? <p className="text-xs text-destructive mt-1">{error}</p> : null;

  if (isDisplay(field.type)) {
    switch (field.type) {
      case 'heading':
        return (
          <h3 className="font-cursive text-2xl sm:text-3xl text-foreground col-span-full">
            {field.content || field.label}
          </h3>
        );
      case 'paragraph':
        return (
          <p className="text-sm text-muted-foreground col-span-full">{field.content}</p>
        );
      case 'divider':
        return <hr className="border-border col-span-full my-2" />;
      case 'spacer':
        return <div className="h-4 col-span-full" />;
      default:
        return null;
    }
  }

  const strVal = value == null ? '' : String(value);

  const wrap = (inner: React.ReactNode) => (
    <div>
      {label}
      {inner}
      {desc}
      {err}
    </div>
  );

  switch (field.type) {
    case 'short_text':
    case 'password':
    case 'url':
    case 'pincode':
      return wrap(
        <Input
          type={field.type === 'password' ? 'password' : 'text'}
          placeholder={field.placeholder}
          value={strVal}
          disabled={field.disabled}
          readOnly={field.readOnly}
          onChange={(e) => onChange(field.key, e.target.value)}
        />,
      );
    case 'email':
      return wrap(
        <Input
          type="email"
          placeholder={field.placeholder || 'you@company.com'}
          value={strVal}
          onChange={(e) => onChange(field.key, e.target.value)}
        />,
      );
    case 'phone':
      return wrap(
        <PhoneField
          value={strVal}
          placeholder={field.placeholder}
          onChange={(v) => onChange(field.key, v)}
        />,
      );
    case 'number':
      return wrap(
        <Input
          type="number"
          placeholder={field.placeholder}
          value={strVal}
          onChange={(e) => onChange(field.key, e.target.value)}
        />,
      );
    case 'long_text':
    case 'rich_text':
    case 'html':
    case 'address':
      return wrap(
        <Textarea
          rows={4}
          placeholder={field.placeholder}
          value={strVal}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="resize-none"
        />,
      );
    case 'date':
    case 'time':
    case 'datetime':
      return wrap(
        <Input
          type={field.type === 'datetime' ? 'datetime-local' : field.type}
          value={strVal}
          onChange={(e) => onChange(field.key, e.target.value)}
        />,
      );
    case 'dropdown':
    case 'country':
    case 'state':
    case 'city':
      return wrap(
        <Select value={strVal || undefined} onValueChange={(v) => onChange(field.key, v)}>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || 'Select…'} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
      );
    case 'radio':
      return wrap(
        <div className="space-y-2">
          {(field.options || []).map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name={field.key}
                checked={strVal === o.value}
                onChange={() => onChange(field.key, o.value)}
                className="accent-primary"
              />
              {o.label}
            </label>
          ))}
        </div>,
      );
    case 'checkbox':
    case 'multi_select':
      return wrap(
        <div className={field.type === 'multi_select' ? 'flex flex-wrap gap-2' : 'space-y-2'}>
          {(field.options || []).map((o) => {
            const selected = Array.isArray(value) ? (value as string[]) : [];
            const checked = selected.includes(o.value);
            const toggle = () => {
              const next = checked ? selected.filter((v) => v !== o.value) : [...selected, o.value];
              onChange(field.key, next);
            };
            if (field.type === 'multi_select') {
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={toggle}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                  style={
                    checked
                      ? { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderColor: 'hsl(var(--primary))' }
                      : { borderColor: 'hsl(var(--border))' }
                  }
                >
                  {o.label}
                </button>
              );
            }
            return (
              <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={checked} onChange={toggle} className="accent-primary" />
                {o.label}
              </label>
            );
          })}
        </div>,
      );
    case 'toggle':
      return wrap(
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(field.key, e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          <span className="text-sm text-muted-foreground">{field.placeholder || 'Yes'}</span>
        </label>,
      );
    case 'file':
    case 'multi_file':
    case 'image':
    case 'camera': {
      const multiple = field.type === 'multi_file';
      const accept =
        field.type === 'image' || field.type === 'camera'
          ? 'image/*'
          : field.validation?.allowedExtensions || undefined;
      const urls = Array.isArray(value)
        ? (value as string[])
        : value
          ? [String(value)]
          : [];
      return wrap(
        <UploadField
          field={field}
          multiple={multiple}
          accept={accept}
          urls={urls}
          onChange={onChange}
        />,
      );
    }
    case 'rating': {
      const rating = typeof value === 'number' ? value : 0;
      return wrap(
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(field.key, n)}
              className="text-2xl transition-colors"
              style={{ color: n <= rating ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)' }}
            >
              ★
            </button>
          ))}
        </div>,
      );
    }
    case 'slider': {
      const slider = typeof value === 'number' ? value : 50;
      return wrap(
        <div>
          <input
            type="range"
            min={field.validation?.min ?? 0}
            max={field.validation?.max ?? 100}
            value={slider}
            onChange={(e) => onChange(field.key, Number(e.target.value))}
            className="w-full accent-primary"
          />
          <span className="text-xs text-muted-foreground">{slider}</span>
        </div>,
      );
    }
    default:
      return wrap(
        <Input
          placeholder={field.placeholder}
          value={strVal}
          onChange={(e) => onChange(field.key, e.target.value)}
        />,
      );
  }
}

/** File/image/camera field — uploads to Cloudinary on selection and stores the real URL(s), not just the local filename. */
function UploadField({
  field, multiple, accept, urls, onChange,
}: {
  field: FormField;
  multiple: boolean;
  accept?: string;
  urls: string[];
  onChange: (key: string, value: unknown) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map((f) => mediaApi.upload(f, 'inquiries')));
      onChange(field.key, multiple ? [...urls, ...uploaded] : uploaded[0]);
    } catch (e) {
      toast.error((e as Error).message || 'Upload failed — please try again');
    } finally {
      setUploading(false);
    }
  };

  return (
    <label
      className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-lg p-5 transition-colors ${uploading ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-primary'}`}
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      <input
        type="file"
        multiple={multiple}
        accept={accept}
        capture={field.type === 'camera' ? 'environment' : undefined}
        className="hidden"
        disabled={uploading}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
      <i
        className={`fa-solid ${
          uploading ? 'fa-spinner fa-spin' : field.type === 'camera' ? 'fa-camera' : field.type === 'image' ? 'fa-image' : 'fa-cloud-arrow-up'
        } text-xl text-primary`}
      />
      {uploading ? (
        <p className="text-xs text-muted-foreground">Uploading…</p>
      ) : urls.length > 0 ? (
        field.type === 'image' || field.type === 'camera' ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {urls.map((url, i) => (
              <img key={i} src={url} alt="" className="w-14 h-14 object-cover rounded border" />
            ))}
          </div>
        ) : (
          <p className="text-xs text-foreground font-medium text-center break-all">
            {urls.map((u) => u.split('/').pop()).join(', ')}
          </p>
        )
      ) : (
        <p className="text-xs text-muted-foreground">
          {field.placeholder || (multiple ? 'Click to upload files' : 'Click to upload a file')}
        </p>
      )}
    </label>
  );
}

// Longest dial codes first, so e.g. "+1268" (Antigua) matches before "+1" (US/Canada).
const SORTED_CODES = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

/** Split a combined "+<code><digits>" string into its country code + local digits. Defaults to +91 (India). */
function splitPhone(value: string): { code: string; digits: string } {
  const match = SORTED_CODES.find((c) => value.startsWith(c.code));
  if (match) return { code: match.code, digits: value.slice(match.code.length).replace(/\D/g, '') };
  return { code: '+91', digits: value.replace(/\D/g, '') };
}

/** Phone field with a country-code dropdown (defaults to +91) — submits one combined "+<code><digits>" string. */
function PhoneField({
  value, placeholder, onChange,
}: {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const { code, digits } = splitPhone(value);

  const commit = (nextCode: string, nextDigits: string) => {
    onChange(nextDigits ? `${nextCode}${nextDigits}` : '');
  };

  return (
    <div className="flex gap-2">
      <Select value={code} onValueChange={(v) => commit(v, digits)}>
        <SelectTrigger className="w-[110px] shrink-0">
          <SelectValue placeholder="Code" />
        </SelectTrigger>
        <SelectContent className="max-h-[280px] overflow-y-auto">
          {COUNTRY_CODES.map((c) => (
            <SelectItem key={c.code + c.country} value={c.code}>
              {c.code} {c.country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        className="flex-1"
        placeholder={placeholder || '98765 43210'}
        value={digits}
        onChange={(e) => commit(code, e.target.value.replace(/\D/g, '').slice(0, 15))}
      />
    </div>
  );
}
