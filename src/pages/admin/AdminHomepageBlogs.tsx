import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { blogApi } from '@/lib/api';

const AdminHomepageBlogs = () => {
  const [selectedBlogIds, setSelectedBlogIds] = useState<number[]>([]);
  const queryClient = useQueryClient();

  // Fetch all blogs
  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: () => blogApi.getAllAdmin(),
  });

  // Fetch current homepage blogs
  const { data: homepageBlogs = [] } = useQuery({
    queryKey: ['homepage-blogs'],
    queryFn: () => blogApi.getHomepageBlogs(),
  });

  // Initialize selected blogs from homepage blogs
  useEffect(() => {
    if (homepageBlogs.length > 0 && selectedBlogIds.length === 0) {
      setSelectedBlogIds(homepageBlogs.map((blog: any) => blog.id));
    }
  }, [homepageBlogs]);

  const setHomepageBlogsMutation = useMutation({
    mutationFn: (blogIds: number[]) => blogApi.setHomepageBlogs(blogIds),
    onSuccess: () => {
      toast.success('Homepage blogs updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['homepage-blogs'] });
      queryClient.invalidateQueries({ queryKey: ['cmsHomepage'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update homepage blogs');
    },
  });

  const handleBlogToggle = (blogId: number) => {
    setSelectedBlogIds(prev => {
      if (prev.includes(blogId)) {
        // Remove if already selected
        return prev.filter(id => id !== blogId);
      } else {
        // Add if not selected, but max 4
        if (prev.length >= 4) {
          toast.error('You can select maximum 4 blogs for homepage');
          return prev;
        }
        return [...prev, blogId];
      }
    });
  };

  const handleSave = () => {
    if (selectedBlogIds.length !== 4) {
      toast.error('Please select exactly 4 blogs for homepage');
      return;
    }
    setHomepageBlogsMutation.mutate(selectedBlogIds);
  };

  const getBlogPosition = (blogId: number) => {
    const index = selectedBlogIds.indexOf(blogId);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-cursive">Homepage Blog Configuration</h1>
            <p className="text-muted-foreground mt-2">
              Select exactly 4 blogs to display on the homepage
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={selectedBlogIds.length !== 4 || setHomepageBlogsMutation.isPending}
            className="gap-2"
          >
            {setHomepageBlogsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Selection
              </>
            )}
          </Button>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Selected: {selectedBlogIds.length} / 4 blogs
            </p>
            {selectedBlogIds.length !== 4 && (
              <p className="text-sm text-destructive mt-1">
                Please select exactly 4 blogs
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blogs.map((blog: any) => {
                const isSelected = selectedBlogIds.includes(blog.id);
                const position = getBlogPosition(blog.id);
                
                return (
                  <div
                    key={blog.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleBlogToggle(blog.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleBlogToggle(blog.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        {position && (
                          <div className="mb-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                              {position}
                            </span>
                          </div>
                        )}
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                          {blog.title}
                        </h3>
                        {blog.excerpt && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {blog.excerpt}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          {blog.category && (
                            <span className="px-2 py-0.5 bg-muted rounded">
                              {blog.category}
                            </span>
                          )}
                          <span className={blog.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-500'}>
                            {blog.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHomepageBlogs;
