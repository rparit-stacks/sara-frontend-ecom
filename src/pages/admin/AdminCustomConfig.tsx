import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Type, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import FormBuilder, { FormField } from '@/components/admin/FormBuilder';
import { toast } from 'sonner';

const AdminCustomConfig = () => {
  const [formFields, setFormFields] = useState<FormField[]>([
    {
      id: 'field-1',
      type: 'text',
      label: 'Product Name',
      placeholder: 'Enter a name for your custom product',
      required: true,
      min: 3,
      max: 50,
    },
    {
      id: 'field-2',
      type: 'dropdown',
      label: 'Product Category',
      required: true,
      options: ['Home Decor', 'Fashion', 'Accessories'],
    },
  ]);
  
  const [pageConfig, setPageConfig] = useState({
    title: 'Design Your Custom Piece',
    description: 'Upload your unique artwork and choose from our premium fabrics to create a one-of-a-kind Studio Sara product.',
    uploadLabel: 'Upload Design (PNG/JPG)',
  });

  const handleSave = () => {
    // TODO: Call API to save config
    console.log('Saving Custom Product Config:', {
      formFields,
      pageConfig
    });
    toast.success('Custom product configuration saved successfully!');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
              Custom Product <span className="text-primary">Config</span>
            </h1>
            <p className="text-muted-foreground text-lg">Configure the flow and options for user-uploaded designs</p>
          </div>
          <Button onClick={handleSave} className="btn-primary gap-2 h-11 px-8">
            <Save className="w-4 h-4" />
            Save Configuration
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Page Content Config */}
            <section className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Type className="w-5 h-5 text-primary" />
                Page Content & Labels
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Page Title</Label>
                  <Input 
                    value={pageConfig.title} 
                    onChange={(e) => setPageConfig({...pageConfig, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload Button Label</Label>
                  <Input 
                    value={pageConfig.uploadLabel} 
                    onChange={(e) => setPageConfig({...pageConfig, uploadLabel: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Page Description</Label>
                  <textarea 
                    className="w-full min-h-[80px] p-3 rounded-lg border border-input bg-transparent text-sm focus:ring-1 focus:ring-primary outline-none"
                    value={pageConfig.description} 
                    onChange={(e) => setPageConfig({...pageConfig, description: e.target.value})}
                  />
                </div>
              </div>
            </section>

            {/* Form Builder */}
            <section className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Custom Form Builder
              </h2>
              <p className="text-sm text-muted-foreground">
                Define the custom fields that users will fill after uploading their design. 
                These fields will appear on the product page along with fabric selection.
              </p>
              <FormBuilder 
                fields={formFields}
                onChange={setFormFields}
              />
            </section>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
              <h3 className="font-semibold text-primary mb-2">How it works</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When a user uploads a design, they'll go through the same flow as a Design Product:
              </p>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                  User uploads design
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                  Product page opens (same as Design Product)
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                  User selects fabric + variants
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                  Custom form appears for additional info
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                  Price = Design Price + Fabric Price
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomConfig;
