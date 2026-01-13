import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, X, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';

export interface FormField {
  id: string;
  type: 'text' | 'dropdown' | 'checkbox' | 'image' | 'link';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For dropdown
  min?: number; // For text (min length)
  max?: number; // For text (max length)
  validation?: {
    pattern?: string; // Regex pattern
    message?: string; // Error message
  };
}

interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ fields, onChange }) => {
  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: '',
      required: false,
    };
    onChange([...fields, newField]);
  };

  const removeField = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const addOption = (fieldId: string) => {
    onChange(fields.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          options: [...(f.options || []), '']
        };
      }
      return f;
    }));
  };

  const updateOption = (fieldId: string, index: number, value: string) => {
    onChange(fields.map(f => {
      if (f.id === fieldId && f.options) {
        const newOptions = [...f.options];
        newOptions[index] = value;
        return { ...f, options: newOptions };
      }
      return f;
    }));
  };

  const removeOption = (fieldId: string, index: number) => {
    onChange(fields.map(f => {
      if (f.id === fieldId && f.options) {
        return { ...f, options: f.options.filter((_, i) => i !== index) };
      }
      return f;
    }));
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <motion.div
          key={field.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border border-border rounded-lg space-y-4 bg-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Field {index + 1}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeField(field.id)}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select
                value={field.type}
                onValueChange={(value: FormField['type']) => {
                  const updates: Partial<FormField> = { type: value };
                  // Reset options if not dropdown
                  if (value !== 'dropdown') {
                    updates.options = undefined;
                  } else if (!field.options) {
                    updates.options = [''];
                  }
                  updateField(field.id, updates);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Input</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="image">Image Upload</SelectItem>
                  <SelectItem value="link">Link Input</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Field Label</Label>
              <Input
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
                placeholder="e.g. Product Name"
              />
            </div>
          </div>

          {field.type === 'text' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={field.placeholder || ''}
                  onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                  placeholder="Enter placeholder text"
                />
              </div>
              <div className="space-y-2">
                <Label>Min Length</Label>
                <Input
                  type="number"
                  value={field.min || ''}
                  onChange={(e) => updateField(field.id, { min: parseInt(e.target.value) || undefined })}
                  placeholder="Optional"
                />
              </div>
            </div>
          )}

          {field.type === 'link' && (
            <div className="space-y-2">
              <Label>Link Validation Pattern (Regex)</Label>
              <Input
                value={field.validation?.pattern || ''}
                onChange={(e) => updateField(field.id, {
                  validation: {
                    ...field.validation,
                    pattern: e.target.value,
                  }
                })}
                placeholder="e.g. ^https?://"
              />
              <Input
                value={field.validation?.message || ''}
                onChange={(e) => updateField(field.id, {
                  validation: {
                    ...field.validation,
                    message: e.target.value,
                  }
                })}
                placeholder="Error message (optional)"
                className="mt-2"
              />
            </div>
          )}

          {field.type === 'dropdown' && (
            <div className="space-y-2">
              <Label>Dropdown Options</Label>
              <div className="space-y-2">
                {field.options?.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(field.id, optIndex, e.target.value)}
                      placeholder={`Option ${optIndex + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(field.id, optIndex)}
                      className="text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(field.id)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Label className="text-sm">Required Field</Label>
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => updateField(field.id, { required: checked })}
            />
          </div>
        </motion.div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addField}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Field
      </Button>

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No fields added yet.</p>
          <p className="text-sm mt-1">Click "Add Field" to create a custom form field.</p>
        </div>
      )}
    </div>
  );
};

export default FormBuilder;
