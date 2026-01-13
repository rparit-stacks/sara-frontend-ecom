import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Save, X, Upload, Image as ImageIcon, Calendar, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import RichTextEditor from '@/components/admin/RichTextEditor';
import { toast } from 'sonner';

// Mock blog posts
const mockBlogs = [
  { 
    id: 1, 
    title: 'The Art of Floral Design in Indian Textiles', 
    excerpt: 'Explore the rich tradition of floral patterns in Indian textile design...',
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&h=400&fit=crop',
    author: 'Studio Sara',
    publishedAt: '2024-01-15',
    status: 'active',
    views: 1250
  },
  { 
    id: 2, 
    title: 'Sustainable Fabric Choices for Modern Living', 
    excerpt: 'Learn about eco-friendly fabric options that combine style with sustainability...',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop',
    author: 'Studio Sara',
    publishedAt: '2024-01-20',
    status: 'active',
    views: 890
  },
  { 
    id: 3, 
    title: 'Custom Design Tips for Your Home', 
    excerpt: 'Discover how to create personalized home decor with our custom design tools...',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=400&fit=crop',
    author: 'Studio Sara',
    publishedAt: '2024-01-25',
    status: 'inactive',
    views: 450
  },
];

const AdminBlog = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [deleteBlogId, setDeleteBlogId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    image: '',
    author: 'Studio Sara',
    status: 'active' as 'active' | 'inactive',
  });

  const handleResetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      image: '',
      author: 'Studio Sara',
      status: 'active',
    });
  };

  const handleEdit = (blog: any) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content || '',
      image: blog.image,
      author: blog.author,
      status: blog.status,
    });
    setIsEditDialogOpen(true);
  };

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

    // TODO: Call API
    console.log('Blog Payload:', formData);
    toast.success(editingBlog ? 'Blog updated successfully!' : 'Blog created successfully!');
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    handleResetForm();
    setEditingBlog(null);
  };

  const handleDelete = (blogId: number) => {
    setDeleteBlogId(blogId);
  };

  const confirmDelete = () => {
    // TODO: Call API
    toast.success('Blog deleted successfully!');
    setDeleteBlogId(null);
  };

  const filteredBlogs = mockBlogs.filter(blog =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          {filteredBlogs.map((blog, index) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-video bg-muted">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge 
                    className={blog.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                  >
                    {blog.status}
                  </Badge>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{blog.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{blog.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-3 h-3" />
                    <span>{blog.views} views</span>
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
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
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
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-cursive text-3xl">
                {editingBlog ? 'Edit Blog Post' : 'Create Blog Post'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 mt-4">
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
                    {formData.status === 'active' ? 'Blog will be visible to visitors' : 'Blog will be hidden'}
                  </p>
                </div>
                <Switch
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                handleResetForm();
                setEditingBlog(null);
              }}>
                Cancel
              </Button>
              <Button className="btn-primary gap-2" onClick={handleSave}>
                <Save className="w-4 h-4" />
                {editingBlog ? 'Update Blog' : 'Create Blog'}
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
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminBlog;
