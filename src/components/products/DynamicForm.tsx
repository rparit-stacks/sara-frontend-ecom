import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, Link as LinkIcon } from 'lucide-react';
import { FormField } from '@/components/admin/FormBuilder';
import { toast } from 'sonner';

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ fields, onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} is required`;
    }

    if (field.type === 'text' && value) {
      if (field.min && value.length < field.min) {
        return `${field.label} must be at least ${field.min} characters`;
      }
      if (field.max && value.length > field.max) {
        return `${field.label} must be at most ${field.max} characters`;
      }
    }

    if (field.type === 'link' && value && field.validation?.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        return field.validation.message || `${field.label} is invalid`;
      }
    }

    return null;
  };

  const handleChange = (fieldId: string, value: any) => {
    setFormData({ ...formData, [fieldId]: value });
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors({ ...errors, [fieldId]: '' });
    }
  };

  const handleImageUpload = (fieldId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      handleChange(fieldId, e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = formData[field.id];
      const error = validateField(field, value);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill all required fields correctly');
      return;
    }

    onSubmit(formData);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              value={value}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <select
              value={value}
              onChange={(e) => handleChange(field.id, e.target.value)}
              className={`w-full h-10 px-3 rounded-lg border ${error ? 'border-destructive' : 'border-input'} bg-transparent`}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.id}
              checked={value || false}
              onChange={(e) => handleChange(field.id, e.target.checked)}
              className="w-4 h-4 rounded border-input"
            />
            <Label htmlFor={field.id} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {error && <p className="text-sm text-destructive ml-2">{error}</p>}
          </div>
        );

      case 'image':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {value ? (
              <div className="relative">
                <img src={value} alt="Uploaded" className="w-full h-48 object-cover rounded-lg border" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => handleChange(field.id, '')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id={`image-${field.id}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(field.id, file);
                  }}
                />
                <label htmlFor={`image-${field.id}`} className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                </label>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'link':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="url"
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder || 'https://example.com'}
                className={`pl-10 ${error ? 'border-destructive' : ''}`}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {fields.map(renderField)}
      </div>
      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
};

export default DynamicForm;
