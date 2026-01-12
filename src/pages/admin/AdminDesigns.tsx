import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Upload, Edit, Trash2, Eye, EyeOff, Save, X, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import FabricSelector, { Fabric } from '@/components/admin/FabricSelector';

// Mock data
const mockFabrics: Fabric[] = [
  { id: 'f1', name: 'Silk Pink', image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=200', status: 'active' },
  { id: 'f2', name: 'Cotton Blue', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200', status: 'active' },
  { id: 'f3', name: 'Linen Cream', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200', status: 'active' },
  { id: 'f4', name: 'Cotton White', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200', status: 'inactive' },
];

const mockDesigns = [
  { id: 1, name: 'Rose Pattern', category: 'Floral', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200', status: 'active', fabricCount: 12 },
  { id: 2, name: 'Paisley', category: 'Traditional', image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=200', status: 'active', fabricCount: 8 },
  { id: 3, name: 'Geometric', category: 'Modern', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200', status: 'active', fabricCount: 5 },
  { id: 4, name: 'Abstract', category: 'Modern', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200', status: 'inactive', fabricCount: 0 },
];

const AdminDesigns = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    image: null as File | null,
    selectedFabricIds: [] as string[]
  });

  const handleResetForm = () => {
    setFormData({
      name: '',
      category: '',
      image: null,
      selectedFabricIds: []
    });
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
              Design <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground text-lg">Manage design library and assign available fabrics</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) handleResetForm();
          }}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="btn-primary gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Design
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
              <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-border flex items-center justify-between">
                <DialogHeader>
                  <DialogTitle className="font-cursive text-3xl">Create Design</DialogTitle>
                </DialogHeader>
                <Button variant="ghost" size="icon" onClick={() => setIsAddDialogOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="d-name">Design Name</Label>
                    <Input 
                      id="d-name" 
                      placeholder="e.g. Traditional Paisley" 
                      className="h-11"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="floral">Floral</SelectItem>
                        <SelectItem value="traditional">Traditional</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="geometric">Geometric</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Design Image (Source)</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-4 hover:bg-muted/30 transition-colors group cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-primary/5 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold">Upload Design File</p>
                      <p className="text-xs text-muted-foreground">High-resolution transparent PNG recommended</p>
                    </div>
                    <input type="file" className="hidden" id="design-upload" onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })} />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('design-upload')?.click()}>
                      {formData.image ? formData.image.name : 'Choose File'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-bold flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      Available Fabrics
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {formData.selectedFabricIds.length} Selected
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Select fabrics that are suitable for this design. These will be available for customers to choose from.
                  </p>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <FabricSelector 
                      fabrics={mockFabrics}
                      selectedFabricIds={formData.selectedFabricIds}
                      onChange={(ids) => setFormData({ ...formData, selectedFabricIds: ids })}
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-border flex items-center justify-between">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="gap-2 h-11 px-6">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button className="btn-primary gap-2 h-11 px-8">
                  <Save className="w-4 h-4" />
                  Create Design
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px] h-11">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="floral">Floral</SelectItem>
              <SelectItem value="traditional">Traditional</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="geometric">Geometric</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Designs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockDesigns.map((design, index) => (
            <motion.div
              key={design.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="relative aspect-square bg-muted">
                <img
                  src={design.image}
                  alt={design.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge 
                    className={design.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                  >
                    {design.status}
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Design
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{design.name}</h3>
                  <Badge variant="secondary" className="text-[10px] uppercase">{design.category}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Palette className="w-3 h-3" />
                  <span>{design.fabricCount} Fabrics Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      {design.status === 'active' ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive ml-auto">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDesigns;
