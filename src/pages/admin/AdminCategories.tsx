import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Category, CategoryTree } from '@/components/admin/CategoryTree';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FolderTree, Search, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Clothing',
    parentId: null,
    status: 'active',
    subcategories: [
      { id: '1-1', name: 'Menswear', parentId: '1', status: 'active' },
      { id: '1-2', name: 'Womenswear', parentId: '1', status: 'active' },
      { id: '1-3', name: 'Kids', parentId: '1', status: 'active' },
    ]
  },
  {
    id: '2',
    name: 'Home Decor',
    parentId: null,
    status: 'active',
    subcategories: [
      { id: '2-1', name: 'Cushions', parentId: '2', status: 'active' },
      { id: '2-2', name: 'Bedding', parentId: '2', status: 'active' },
      { id: '2-3', name: 'Table Linens', parentId: '2', status: 'active' },
    ]
  },
  {
    id: '3',
    name: 'Accessories',
    parentId: null,
    status: 'active',
    subcategories: [
      { id: '3-1', name: 'Bags', parentId: '3', status: 'active' },
      { id: '3-2', name: 'Scarves', parentId: '3', status: 'active' },
      { id: '3-3', name: 'Jewelry', parentId: '3', status: 'inactive' },
    ]
  }
];

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    parentId: string | 'none';
    status: 'active' | 'inactive';
  }>({
    name: '',
    parentId: 'none',
    status: 'active'
  });

  const handleAddMain = () => {
    setEditingCategory(null);
    setFormData({ name: '', parentId: 'none', status: 'active' });
    setIsAddDialogOpen(true);
  };

  const handleAddSub = (parentId: string) => {
    setEditingCategory(null);
    setFormData({ name: '', parentId, status: 'active' });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name, 
      parentId: category.parentId || 'none', 
      status: category.status 
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category? This will not affect products assigned to it.')) {
      // Logic to delete category
      const removeCategory = (list: Category[]): Category[] => {
        return list
          .filter(c => c.id !== id)
          .map(c => ({
            ...c,
            subcategories: c.subcategories ? removeCategory(c.subcategories) : []
          }));
      };
      setCategories(removeCategory(categories));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCategory) {
      // Update logic
      const updateCategory = (list: Category[]): Category[] => {
        return list.map(c => {
          if (c.id === editingCategory.id) {
            return { ...c, name: formData.name, status: formData.status };
          }
          return {
            ...c,
            subcategories: c.subcategories ? updateCategory(c.subcategories) : []
          };
        });
      };
      setCategories(updateCategory(categories));
    } else {
      // Add logic
      const newCategory: Category = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        parentId: formData.parentId === 'none' ? null : formData.parentId,
        status: formData.status,
        subcategories: []
      };

      if (newCategory.parentId === null) {
        setCategories([...categories, newCategory]);
      } else {
        const addSub = (list: Category[]): Category[] => {
          return list.map(c => {
            if (c.id === newCategory.parentId) {
              return {
                ...c,
                subcategories: [...(c.subcategories || []), newCategory]
              };
            }
            return {
              ...c,
              subcategories: c.subcategories ? addSub(c.subcategories) : []
            };
          });
        };
        setCategories(addSub(categories));
      }
    }

    setIsAddDialogOpen(false);
  };

  const getAllParentOptions = () => {
    const options: { id: string, name: string }[] = [];
    const flatten = (list: Category[], level = 0) => {
      list.forEach(c => {
        options.push({ id: c.id, name: `${'— '.repeat(level)}${c.name}` });
        if (c.subcategories) flatten(c.subcategories, level + 1);
      });
    };
    flatten(categories);
    return options;
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subcategories && c.subcategories.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
              Category <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground text-lg">Organize your products with hierarchical categories</p>
          </div>
          <Button onClick={handleAddMain} className="btn-primary gap-2 self-start sm:self-center">
            <Plus className="w-4 h-4" />
            Add Main Category
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="relative max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-primary" />
                Category Hierarchy
              </h2>
              <CategoryTree 
                categories={filteredCategories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddSubcategory={handleAddSub}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
              <h3 className="font-semibold text-primary mb-2">Quick Tip</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You can create up to 3 levels of nested categories. 
                Keep your category structure simple for the best customer experience.
                Changes here will reflect instantly on the storefront.
              </p>
            </div>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-cursive text-2xl">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Silk Scarves"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Category</Label>
                <Select 
                  value={formData.parentId} 
                  onValueChange={(val) => setFormData({ ...formData, parentId: val })}
                  disabled={!!editingCategory}
                >
                  <SelectTrigger id="parentId">
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Main Category)</SelectItem>
                    {getAllParentOptions().map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingCategory && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Parent category cannot be changed after creation.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="status">Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive categories won't show on the store
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
                  }
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary gap-2">
                  <Save className="w-4 h-4" />
                  {editingCategory ? 'Update' : 'Create'} Category
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;
