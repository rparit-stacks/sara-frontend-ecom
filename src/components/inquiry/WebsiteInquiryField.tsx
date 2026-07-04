import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/portal/formbuilder/types';
import { isDisplay } from '@/components/portal/formbuilder/registry';

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
        <Input
          type="tel"
          placeholder={field.placeholder || '+91 98765 43210'}
          value={strVal}
          onChange={(e) => onChange(field.key, e.target.value)}
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
      const names = Array.isArray(value)
        ? (value as string[])
        : value
          ? [String(value)]
          : [];
      return wrap(
        <label
          className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-lg p-5 cursor-pointer hover:border-primary transition-colors"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <input
            type="file"
            multiple={multiple}
            accept={accept}
            capture={field.type === 'camera' ? 'environment' : undefined}
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []).map((f) => f.name);
              onChange(field.key, multiple ? files : files[0] ?? '');
            }}
          />
          <i
            className={`fa-solid ${
              field.type === 'camera' ? 'fa-camera' : field.type === 'image' ? 'fa-image' : 'fa-cloud-arrow-up'
            } text-xl text-primary`}
          />
          {names.length > 0 ? (
            <p className="text-xs text-foreground font-medium text-center break-all">
              {names.join(', ')}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {field.placeholder || (multiple ? 'Click to upload files' : 'Click to upload a file')}
            </p>
          )}
        </label>,
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
