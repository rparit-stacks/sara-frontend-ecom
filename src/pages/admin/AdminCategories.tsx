import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Category, CategoryTree } from '@/components/admin/CategoryTree';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FolderTree, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { categoriesApi } from '@/lib/api';

const AdminCategories = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Fetch categories from admin API (includes personalised categories; uses admin token)
  const { data: apiCategories = [], isLoading, error } = useQuery({
    queryKey: ['categories', 'admin'],
    queryFn: () => categoriesApi.getAllAdmin(),
  });
  
  // Transform API response to Category[] format for CategoryTree
  const transformCategories = (cats: any[]): Category[] => {
    return cats.map((c: any) => ({
      id: String(c.id),
      name: c.name,
      parentId: c.parentId ? String(c.parentId) : null,
      status: c.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
      subcategories: c.subcategories ? transformCategories(c.subcategories) : [],
      image: c.image || '',
    } as Category & { image?: string }));
  };
  
  const categories = transformCategories(apiCategories);
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category? This will not affect products assigned to it.')) {
      deleteMutation.mutate(Number(id));
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subcategories && c.subcategories.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())))
  );
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-destructive">Failed to load categories. Please try again.</p>
        </div>
      </AdminLayout>
    );
  }

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
          <Link to="/admin-sara/categories/new">
            <Button className="btn-primary gap-2 self-start sm:self-center">
              <Plus className="w-4 h-4" />
              Add Main Category
            </Button>
          </Link>
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
                onEdit={(cat) => navigate('/admin-sara/categories/edit/' + cat.id)}
                onDelete={handleDelete}
                onAddSubcategory={(parentId) => navigate('/admin-sara/categories/new/' + parentId)}
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
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;
