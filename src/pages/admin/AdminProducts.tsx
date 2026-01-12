import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Save, X, Upload, IndianRupee, Image as ImageIcon, FileJson, Package, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductTypeSelector, { ProductType } from '@/components/admin/ProductTypeSelector';
import RichTextEditor from '@/components/admin/RichTextEditor';
import VariantBuilder, { VariantType, VariantCombination } from '@/components/admin/VariantBuilder';
import FabricSelector, { Fabric } from '@/components/admin/FabricSelector';

// Mock data
const mockFabrics: Fabric[] = [
  { id: 'f1', name: 'Silk Pink', image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=200', status: 'active' },
  { id: 'f2', name: 'Cotton Blue', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200', status: 'active' },
  { id: 'f3', name: 'Linen Cream', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200', status: 'active' },
  { id: 'f4', name: 'Cotton White', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200', status: 'inactive' },
];

const mockCategories = [
  { id: '1', name: 'Clothing', subcategories: [{ id: '1-1', name: 'Menswear' }, { id: '1-2', name: 'Womenswear' }] },
  { id: '2', name: 'Home Decor', subcategories: [{ id: '2-1', name: 'Cushions' }, { id: '2-2', name: 'Bedding' }] },
];

const mockProducts = [
  { id: 1, name: 'Floral Block Print Quilt', type: 'DESIGNED', category: 'Bedding', status: 'active', createdAt: '2024-01-15' },
  { id: 2, name: 'Botanical Cushion Cover', type: 'DESIGNED', category: 'Cushions', status: 'active', createdAt: '2024-01-20' },
  { id: 3, name: 'Plain Silk Scarf', type: 'PLAIN', category: 'Scarves', status: 'inactive', createdAt: '2024-01-25' },
  { id: 4, name: 'Digital Scarf Pattern', type: 'DIGITAL', category: 'Templates', status: 'active', createdAt: '2024-02-01' },
];

const AdminProducts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeType, setActiveType] = useState<ProductType>('PLAIN');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    subcategoryId: '',
    description: '',
    basePrice: 0,
    images: [] as string[],
    digitalFile: null as File | null,
    selectedFabrics: [] as string[],
    variants: [] as VariantType[],
    combinations: [] as VariantCombination[]
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'DESIGNED': return <Badge className="bg-pink-100 text-pink-700 border-pink-200">Designed</Badge>;
      case 'DIGITAL': return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Digital</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Plain</Badge>;
    }
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      categoryId: '',
      subcategoryId: '',
      description: '',
      basePrice: 0,
      images: [],
      digitalFile: null,
      selectedFabrics: [],
      variants: [],
      combinations: []
    });
    setActiveType('PLAIN');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
              Product <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground text-lg">Create and manage physical and digital products</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) handleResetForm();
          }}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="btn-primary gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Product
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
              <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-border flex items-center justify-between">
                <DialogHeader>
                  <DialogTitle className="font-cursive text-3xl">Create Product</DialogTitle>
                </DialogHeader>
                <Button variant="ghost" size="icon" onClick={() => setIsAddDialogOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-10">
                {/* Step 1: Product Type */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">1</span>
                    Product Type
                  </div>
                  <ProductTypeSelector selected={activeType} onChange={setActiveType} />
                </section>

                {/* Step 2: Basic Info */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">2</span>
                    Basic Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="p-name">Product Name</Label>
                      <Input 
                        id="p-name" 
                        placeholder="e.g. Vintage Floral Scarf" 
                        className="h-11"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="p-price">Base Price (₹)</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="p-price" 
                          type="number" 
                          placeholder="0.00" 
                          className="h-11 pl-10"
                          value={formData.basePrice}
                          onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subcategory</Label>
                      <Select 
                        value={formData.subcategoryId} 
                        onValueChange={(v) => setFormData({ ...formData, subcategoryId: v })}
                        disabled={!formData.categoryId}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockCategories.find(c => c.id === formData.categoryId)?.subcategories.map(sub => (
                            <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Product Description</Label>
                    <RichTextEditor 
                      value={formData.description} 
                      onChange={(content) => setFormData({ ...formData, description: content })}
                      placeholder="Write rich description with details, care instructions, etc..."
                    />
                  </div>
                </section>

                {/* Type Specific Sections */}
                <AnimatePresence mode="wait">
                  {activeType === 'DESIGNED' && (
                    <motion.section
                      key="designed-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 pt-6 border-t border-border"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[10px]">3</span>
                        Design & Fabric Mapping
                      </div>
                      
                      <div className="space-y-4">
                        <Label>Available Fabrics for this Product</Label>
                        <FabricSelector 
                          fabrics={mockFabrics}
                          selectedFabricIds={formData.selectedFabrics}
                          onChange={(ids) => setFormData({ ...formData, selectedFabrics: ids })}
                        />
                      </div>

                      <div className="p-4 bg-pink-50 border border-pink-100 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <Palette className="w-6 h-6 text-pink-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-pink-900">Mockup System Active</h4>
                          <p className="text-xs text-pink-700">Customers will be able to preview this design on the selected fabrics.</p>
                        </div>
                      </div>
                    </motion.section>
                  )}

                  {activeType === 'DIGITAL' && (
                    <motion.section
                      key="digital-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 pt-6 border-t border-border"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px]">3</span>
                        Digital Asset
                      </div>
                      
                      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-4 hover:bg-muted/30 transition-colors group cursor-pointer">
                        <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold">Upload Digital File</p>
                          <p className="text-xs text-muted-foreground text-center max-w-[200px] mx-auto">
                            PDF, JPG, PNG, or ZIP files supported. Max size 50MB.
                          </p>
                        </div>
                        <input type="file" className="hidden" id="digital-upload" onChange={(e) => setFormData({ ...formData, digitalFile: e.target.files?.[0] || null })} />
                        <Button type="button" variant="outline" onClick={() => document.getElementById('digital-upload')?.click()}>
                          {formData.digitalFile ? formData.digitalFile.name : 'Choose File'}
                        </Button>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* Step 4: Variants */}
                <section className="space-y-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">{activeType === 'PLAIN' ? '3' : '4'}</span>
                    Product Variants
                  </div>
                  <VariantBuilder 
                    onChange={(variants, combos) => setFormData({ ...formData, variants, combinations: combos })}
                    initialVariants={formData.variants}
                    initialCombinations={formData.combinations}
                  />
                </section>

                {/* Step 5: Images */}
                <section className="space-y-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">{activeType === 'PLAIN' ? '4' : '5'}</span>
                    Product Gallery
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                    <button className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-muted/30 transition-colors group">
                      <ImageIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Add Image</span>
                    </button>
                  </div>
                </section>
              </div>

              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-border flex items-center justify-between shadow-up">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="gap-2 h-11 px-6">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button className="btn-primary gap-2 h-11 px-8">
                  <Save className="w-4 h-4" />
                  Create Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search products by name, category, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </motion.div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Product</th>
                  <th className="text-left p-4 font-semibold text-sm">Type</th>
                  <th className="text-left p-4 font-semibold text-sm">Category</th>
                  <th className="text-left p-4 font-semibold text-sm">Base Price</th>
                  <th className="text-left p-4 font-semibold text-sm">Status</th>
                  <th className="text-left p-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockProducts.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="border-t border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="font-semibold">{product.name}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      {getTypeBadge(product.type)}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{product.category}</Badge>
                    </td>
                    <td className="p-4 font-medium">
                      ₹{product.id === 1 ? '899' : '450'}
                    </td>
                    <td className="p-4">
                      <Badge 
                        className={product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                      >
                        {product.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
