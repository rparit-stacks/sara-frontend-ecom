import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Save, X, Upload, Calendar, Eye, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { toast } from 'sonner';
import { blogApi } from '@/lib/api';

const AdminBlog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [deleteBlogId, setDeleteBlogId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    image: '',
    author: 'Studio Sara',
    category: '',
    status: 'ACTIVE',
  });
  
  // Fetch blogs from API
  const { data: blogs = [], isLoading, error } = useQuery({
    queryKey: ['blogs-admin'],
    queryFn: () => blogApi.getAllAdmin(),
  });
  
  // Fetch blog categories
  const { data: categories = [] } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => blogApi.getCategories(),
  });
  
  // Fetch full blog data when editing
  const { data: fullBlogData, isLoading: isLoadingBlog } = useQuery({
    queryKey: ['blog-admin', editingBlog?.id],
    queryFn: () => blogApi.getByIdAdmin(editingBlog.id),
    enabled: !!editingBlog?.id && isEditDialogOpen,
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: blogApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blogs-admin'] });
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast.success('Blog created successfully!');
      setIsAddDialogOpen(false);
      handleResetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create blog');
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => blogApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blogs-admin'] });
      queryClient.invalidateQueries({ queryKey: ['blog'] });
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast.success('Blog updated successfully!');
      setIsEditDialogOpen(false);
      setEditingBlog(null);
      handleResetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update blog');
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: blogApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blogs-admin'] });
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast.success('Blog deleted successfully!');
      setDeleteBlogId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete blog');
    },
  });

  const handleResetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      image: '',
      author: 'Studio Sara',
      category: '',
      status: 'ACTIVE',
    });
  };

  const handleEdit = (blog: any) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      image: blog.image || '',
      author: blog.author || 'Studio Sara',
      category: blog.category || '',
      status: blog.status || 'ACTIVE',
    });
    setIsEditDialogOpen(true);
  };
  
  // Update form when full blog data is loaded
  useEffect(() => {
    if (fullBlogData && isEditDialogOpen && editingBlog) {
      setFormData({
        title: fullBlogData.title || '',
        excerpt: fullBlogData.excerpt || '',
        content: fullBlogData.content || '',
        image: fullBlogData.image || '',
        author: fullBlogData.author || 'Studio Sara',
        category: fullBlogData.category || '',
        status: fullBlogData.status || 'ACTIVE',
      });
    }
  }, [fullBlogData, isEditDialogOpen, editingBlog]);

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Blog title is required');
      return;
    }
    if (!formData.excerpt.trim()) {
      toast.error('Blog excerpt is required');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Blog content is required');
      return;
    }

    if (editingBlog) {
      updateMutation.mutate({ id: editingBlog.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (blogId: number) => {
    setDeleteBlogId(blogId);
  };

  const confirmDelete = () => {
    if (deleteBlogId) {
      deleteMutation.mutate(deleteBlogId);
    }
  };

  const filteredBlogs = blogs.filter((blog: any) =>
    blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <p className="text-destructive">Failed to load blogs. Please try again.</p>
        </div>
      </AdminLayout>
    );
  }

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
              Blog <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground text-lg">Create and manage blog posts</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="btn-primary gap-2" onClick={() => {
              handleResetForm();
              setIsAddDialogOpen(true);
            }}>
              <Plus className="w-4 h-4" />
              Add New Blog
            </Button>
          </motion.div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search blogs by title or excerpt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </motion.div>

        {/* Blogs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No blog posts found. Create your first blog!
            </div>
          ) : (
            filteredBlogs.map((blog: any, index: number) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.4 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-video bg-muted">
                  {blog.image ? (
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge 
                      className={blog.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    >
                      {blog.status?.toLowerCase() || 'active'}
                    </Badge>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{blog.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{blog.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3" />
                      <span>{blog.views || 0} views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(blog)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(blog.id)}
                        className="text-destructive hover:text-destructive"
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            handleResetForm();
            setEditingBlog(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="font-semibold text-2xl">
                {editingBlog ? 'Edit Blog Post' : 'Create Blog Post'}
              </DialogTitle>
            </DialogHeader>
            
            {isLoadingBlog && isEditDialogOpen ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
            <div className="space-y-6 mt-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <Label>Blog Title</Label>
                <Input
                  placeholder="Enter blog title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Excerpt (Short Description)</Label>
                <Textarea
                  placeholder="Enter a short excerpt that will appear in blog listings"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Featured Image</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-4 hover:bg-muted/30 transition-colors group cursor-pointer">
                  {formData.image ? (
                    <div className="relative">
                      <img src={formData.image} alt="Blog" className="w-full h-64 object-cover rounded-lg" />
                      <button
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute top-2 right-2 w-8 h-8 bg-destructive text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold">Upload Featured Image</p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG files supported. Recommended size: 1200x800px
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        id="blog-image-upload" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setFormData({ ...formData, image: event.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => document.getElementById('blog-image-upload')?.click()}
                      >
                        Choose Image
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Blog Content</Label>
                <RichTextEditor 
                  value={formData.content} 
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Write your blog post content here..."
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="h-11 flex-1">
                      <SelectValue placeholder="Select or enter category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: string) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Or enter new category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="h-11 flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Select from existing categories or enter a new one
                </p>
              </div>

              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  placeholder="Author name"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Publish Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.status === 'ACTIVE' ? 'Blog will be visible to visitors' : 'Blog will be hidden'}
                  </p>
                </div>
                <Switch
                  checked={formData.status === 'ACTIVE'}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'ACTIVE' : 'INACTIVE' })}
                />
              </div>
            </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                  handleResetForm();
                  setEditingBlog(null);
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                className="btn-primary gap-2" 
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingBlog ? 'Update Blog' : 'Create Blog'}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteBlogId !== null} onOpenChange={(open) => !open && setDeleteBlogId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this blog post? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground gap-2"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminBlog;
