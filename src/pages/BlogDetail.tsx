import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, User, ArrowLeft, Share2, Loader2, Eye, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { blogApi } from '@/lib/api';
import { toast } from 'sonner';

const BlogDetail = () => {
  const { id } = useParams();
  
  // Fetch blog from API
  const { data: blog, isLoading, error } = useQuery({
    queryKey: ['blog', id],
    queryFn: () => blogApi.getById(Number(id!)),
    enabled: !!id,
  });
  
  // Fetch related blogs (same category)
  const { data: relatedBlogs = [] } = useQuery({
    queryKey: ['blogs', blog?.category],
    queryFn: () => blogApi.getAll(blog?.category),
    enabled: !!blog?.category,
    select: (data) => data.filter((b: any) => b.id !== blog?.id).slice(0, 3),
  });
  
  const handleShare = () => {
    if (navigator.share && blog) {
      navigator.share({
        title: blog.title,
        text: blog.excerpt,
        url: window.location.href,
      }).catch(() => {
        // Fallback to copy
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      });
    } else {
      // Fallback to copy
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !blog) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-destructive text-lg font-semibold mb-2">Error loading blog</p>
          <p className="text-muted-foreground mb-4">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link to="/blog">
            <Button variant="outline" className="mt-4">Back to Blog</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <section className="w-full bg-secondary/30 py-5">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <nav className="flex items-center text-sm text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0" />
            <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0" />
            <span className="text-foreground truncate">{blog.title}</span>
          </nav>
        </div>
      </section>

      {/* Blog Content */}
      <section className="w-full py-14 lg:py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <ScrollReveal>
            <Link to="/blog">
              <Button variant="ghost" className="mb-8 gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Button>
            </Link>

            <article>
              {/* Header */}
              <div className="mb-8">
                <Badge className="mb-4">{blog.category}</Badge>
                <h1 className="font-cursive text-4xl md:text-5xl lg:text-6xl mb-6">{blog.title}</h1>
                <div className="flex items-center gap-6 text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {blog.publishedAt 
                        ? new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Not published'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{blog.author || 'Studio Sara'}</span>
                  </div>
                  {blog.readTime && <span>{blog.readTime}</span>}
                  {blog.views !== undefined && (
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{blog.views} views</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Featured Image */}
              {blog.image && (
                <div className="mb-10 rounded-2xl overflow-hidden">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Excerpt */}
              {blog.excerpt && (
                <div className="mb-8 p-6 bg-muted/30 rounded-xl border-l-4 border-primary">
                  <p className="text-lg text-muted-foreground italic">{blog.excerpt}</p>
                </div>
              )}

              {/* Content */}
              {blog.content && (
                <div 
                  className="prose prose-lg max-w-none mb-10 prose-headings:font-cursive prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
              )}

              {/* Share */}
              <div className="pt-8 border-t border-border flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium">Share this post:</span>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </article>
          </ScrollReveal>
        </div>
      </section>

      {/* Related Blogs */}
      {relatedBlogs.length > 0 && (
        <section className="w-full py-14 lg:py-20 bg-secondary/30">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <ScrollReveal>
              <h2 className="font-cursive font-semibold text-4xl lg:text-5xl mb-12">Related Posts</h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedBlogs.map((relatedBlog: any, index: number) => (
                <ScrollReveal key={relatedBlog.id} delay={index * 0.1}>
                  <Link to={`/blog/${relatedBlog.id}`}>
                    <article className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col group">
                      {relatedBlog.image && (
                        <div className="relative aspect-video overflow-hidden">
                          <img
                            src={relatedBlog.image}
                            alt={relatedBlog.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                      )}
                      <div className="p-6 flex-1 flex flex-col">
                        <Badge className="mb-3 w-fit">{relatedBlog.category}</Badge>
                        <h3 className="font-semibold text-xl mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {relatedBlog.title}
                        </h3>
                        {relatedBlog.excerpt && (
                          <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                            {relatedBlog.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-sm text-muted-foreground">
                            {relatedBlog.publishedAt 
                              ? new Date(relatedBlog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                              : ''}
                          </span>
                          <Button variant="ghost" className="gap-2 group-hover:text-primary">
                            Read More
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                          </Button>
                        </div>
                      </div>
                    </article>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default BlogDetail;
