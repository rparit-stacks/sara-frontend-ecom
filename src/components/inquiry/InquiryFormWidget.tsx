import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { manufacturingApi } from '@/lib/api';
import { FormField } from '@/components/portal/formbuilder/types';
import { isDisplay, isLayout } from '@/components/portal/formbuilder/registry';
import { parseFormFromDto, WIDTH_CLASS } from './inquiryUtils';
import WebsiteInquiryField from './WebsiteInquiryField';
import { toast } from 'sonner';

interface Props {
  /** When true, fetches the live published form. When false, uses admin preview data. */
  published?: boolean;
  previewForm?: ReturnType<typeof parseFormFromDto>;
  compact?: boolean;
}

function isInputField(field: FormField) {
  return !isDisplay(field.type) && !isLayout(field.type);
}

/** All fillable fields, expanding row (layout) containers into their children. */
function collectInputFields(fields: FormField[]): FormField[] {
  const out: FormField[] = [];
  for (const f of fields) {
    if (isLayout(f.type)) out.push(...(f.children || []).filter(isInputField));
    else if (isInputField(f)) out.push(f);
  }
  return out;
}

export default function InquiryFormWidget({ published = true, previewForm, compact }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<{ reference: string } | null>(null);

  const { data: publishedDto, isLoading, isError } = useQuery({
    queryKey: ['manufacturing-inquiry-form-public'],
    queryFn: () => manufacturingApi.getPublishedInquiryForm(),
    enabled: published && !previewForm,
    staleTime: 60_000,
  });

  const form = previewForm ?? parseFormFromDto(publishedDto);
  const fields = form?.fields || [];
  const inputFields = collectInputFields(fields);

  const submitMutation = useMutation({
    mutationFn: (payload: { formId?: number; values: Record<string, unknown> }) =>
      manufacturingApi.submitInquiry(payload),
    onSuccess: (res) => {
      setSubmitted({ reference: res.reference });
      setValues({});
      setErrors({});
      toast.success(form?.settings.successMessage || 'Inquiry submitted successfully!');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to submit inquiry. Please try again.');
    },
  });

  const handleChange = (key: string, value: unknown) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    for (const f of inputFields) {
      if (!f.required) continue;
      const v = values[f.key];
      const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
      if (empty) next[f.key] = `${f.label} is required`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }
    submitMutation.mutate({ formId: form?.formId, values });
  };

  if (published && !previewForm && isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (published && !previewForm && (isError || !form || inputFields.length === 0)) {
    return (
      <div className="text-center py-12 px-4 rounded-xl border border-border bg-muted/30">
        <p className="text-muted-foreground text-sm">
          Our manufacturing inquiry form is being set up. Please check back soon or{' '}
          <a href="/contact" className="text-primary underline">contact us</a> directly.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-12 px-6 rounded-xl border border-primary/20 bg-primary/5">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-check text-2xl text-primary" />
        </div>
        <h3 className="font-cursive text-2xl sm:text-3xl mb-2">Inquiry Received</h3>
        <p className="text-muted-foreground text-sm mb-1">
          {form?.settings.successMessage || "Thank you! We'll be in touch soon."}
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Reference: <span className="font-semibold text-foreground">{submitted.reference}</span>
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => setSubmitted(null)}
        >
          Submit another inquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-4' : 'space-y-5'}>
      {!compact && form?.name && (
        <h3 className="font-cursive text-2xl sm:text-3xl mb-2">{form.name}</h3>
      )}
      {form?.settings.description && (
        <p className="text-sm text-muted-foreground mb-4">{form.settings.description}</p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-5">
        {fields.map((field) =>
          isLayout(field.type) ? (
            /* horizontal Row: children sit side-by-side at equal widths */
            <div key={field.id} className="w-full flex flex-col sm:flex-row gap-x-4 gap-y-5">
              {(field.children || []).map((child) => (
                <div key={child.id} className="flex-1 min-w-0">
                  <WebsiteInquiryField
                    field={child}
                    value={values[child.key]}
                    onChange={handleChange}
                    error={errors[child.key]}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div key={field.id} className={WIDTH_CLASS[field.width] || 'w-full'}>
              <WebsiteInquiryField
                field={field}
                value={values[field.key]}
                onChange={handleChange}
                error={errors[field.key]}
              />
            </div>
          ),
        )}
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto mt-2"
        disabled={submitMutation.isPending}
      >
        {submitMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting…
          </>
        ) : (
          'Submit Inquiry'
        )}
      </Button>
    </form>
  );
}
