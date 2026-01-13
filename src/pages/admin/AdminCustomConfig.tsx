import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Palette, Settings2, IndianRupee, Type, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import FabricSelector, { Fabric } from '@/components/admin/FabricSelector';
import VariantBuilder, { VariantType, VariantCombination } from '@/components/admin/VariantBuilder';
import { toast } from 'sonner';

// Mock fabrics for selection
const mockFabrics: Fabric[] = [
  { id: 'f1', name: 'Silk Pink', image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=200', status: 'active' },
  { id: 'f2', name: 'Cotton Blue', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200', status: 'active' },
  { id: 'f3', name: 'Linen Cream', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200', status: 'active' },
  { id: 'f4', name: 'Cotton White', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200', status: 'inactive' },
];

const AdminCustomConfig = () => {
  const [selectedFabricIds, setSelectedFabricIds] = useState<string[]>(['f1', 'f2']);
  const [variants, setVariants] = useState<VariantType[]>([
    {
      id: 'v1',
      name: 'Size',
      values: [
        { id: 's1', value: '45x45 cm' },
        { id: 's2', value: '90x90 cm' }
      ]
    }
  ]);
  const [combinations, setCombinations] = useState<VariantCombination[]>([]);
  
  const [pageConfig, setPageConfig] = useState({
    title: 'Design Your Custom Piece',
    description: 'Upload your unique artwork and choose from our premium fabrics to create a one-of-a-kind Studio Sara product.',
    uploadLabel: 'Upload Design (PNG/JPG)',
    fabricLabel: 'Select Premium Fabric',
    quantityLabel: 'Quantity (Pieces)',
    basePrice: 1499
  });

  const handleSave = () => {
    // Conceptual save logic
    console.log('Saving Custom Product Config:', {
      selectedFabricIds,
      variants,
      combinations,
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
                <div className="space-y-2">
                  <Label>Fabric Selection Label</Label>
                  <Input 
                    value={pageConfig.fabricLabel} 
                    onChange={(e) => setPageConfig({...pageConfig, fabricLabel: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base Price (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="number"
                      className="pl-10"
                      value={pageConfig.basePrice} 
                      onChange={(e) => setPageConfig({...pageConfig, basePrice: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Fabrics Selection */}
            <section className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Available Fabrics
              </h2>
              <p className="text-sm text-muted-foreground italic">
                Select which fabrics should be available for custom designs.
              </p>
              <FabricSelector 
                fabrics={mockFabrics}
                selectedFabricIds={selectedFabricIds}
                onChange={setSelectedFabricIds}
              />
            </section>

            {/* Variant Builder */}
            <section className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Custom Product Variants
              </h2>
              <p className="text-sm text-muted-foreground italic">
                Define the options users can choose after uploading their design.
              </p>
              <VariantBuilder 
                initialVariants={variants}
                initialCombinations={combinations}
                onChange={(v, c) => {
                  setVariants(v);
                  setCombinations(c);
                }}
              />
            </section>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
              <h3 className="font-semibold text-primary mb-2">How it works</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When a user uploads a design on the Custom page, we create a temporary product session. 
                This session uses the configurations defined here.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                  Only selected fabrics will appear.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                  Variants define the final price.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5" />
                  Labels update dynamically on the user page.
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
