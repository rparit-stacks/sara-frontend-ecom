import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, Link as LinkIcon, Loader2 } from 'lucide-react';
import { FormField } from '@/components/admin/FormBuilder';
import { toast } from 'sonner';
import { customProductsApi } from '@/lib/api';

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  onUploadingChange?: (uploading: boolean) => void;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  initialData = {},
  onUploadingChange,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

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

  const setFieldUploading = (fieldId: string, uploading: boolean) => {
    setUploadingFields((prev) => {
      const next = { ...prev, [fieldId]: uploading };
      const anyUploading = Object.values(next).some(Boolean);
      onUploadingChange?.(anyUploading);
      return next;
    });
  };

  const handleImageUpload = async (fieldId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }
    
    // Check file size (10MB limit for Cloudinary)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 10MB limit');
      return;
    }
    
    setFieldUploading(fieldId, true);
    
    try {
      // Upload to Cloudinary via API
      const uploadedFiles = await customProductsApi.uploadMedia([file], 'custom-form-uploads');
      if (uploadedFiles && uploadedFiles.length > 0) {
        const cloudinaryUrl = uploadedFiles[0].url || uploadedFiles[0];
        handleChange(fieldId, cloudinaryUrl);
        toast.success('File uploaded successfully');
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setFieldUploading(fieldId, false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Block submit while any image is still uploading
    if (Object.values(uploadingFields).some(Boolean)) {
      toast.error('Please wait for uploads to finish');
      return;
    }

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
        const isUploading = uploadingFields[field.id];
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
                  className="absolute top-2 right-2 bg-background/80"
                  onClick={() => handleChange(field.id, '')}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className={`border-2 border-dashed rounded-lg p-8 text-center ${isUploading ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id={`image-${field.id}`}
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(field.id, file);
                  }}
                />
                <label htmlFor={`image-${field.id}`} className={isUploading ? 'cursor-wait' : 'cursor-pointer'}>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
                      <p className="text-sm text-primary">Uploading to cloud...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload image</p>
                    </>
                  )}
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

  const isAnyUploading = Object.values(uploadingFields).some(Boolean);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {fields.map(renderField)}
      </div>
      <Button type="submit" className="w-full" disabled={isAnyUploading}>
        {isAnyUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving…
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </form>
  );
};

export default DynamicForm;
