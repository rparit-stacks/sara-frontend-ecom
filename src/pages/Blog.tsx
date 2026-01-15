import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { blogApi } from '@/lib/api';

const Blog = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch blogs from API
  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ['blogs', category],
    queryFn: () => blogApi.getAll(category && category !== 'All' ? category : undefined),
  });

  // Fetch categories from API
  const { data: categoriesFromApi = [] } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => blogApi.getCategories(),
  });

  const categories = ['All', ...categoriesFromApi];
  
  const filteredBlogs = blogs.filter((blog: any) => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <Layout>
      {/* Breadcrumb */}
      <section className="w-full bg-secondary/30 py-5">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <nav className="flex items-center text-sm text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0" />
            <span className="text-foreground">Blog</span>
          </nav>
        </div>
      </section>

      {/* Header */}
      <section className="w-full py-14 lg:py-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <ScrollReveal>
              <span className="text-primary uppercase tracking-[0.2em] text-sm font-medium">Our Stories</span>
              <h1 className="font-cursive text-5xl md:text-6xl lg:text-7xl mt-4 mb-6">Blog & Insights</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover design inspiration, care tips, and stories from our artisan community
              </p>
            </ScrollReveal>
          </div>

          {/* Search & Categories */}
          <div className="max-w-4xl mx-auto space-y-6 mb-12">
            <div className="relative">
              <Input
                placeholder="Search blog posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 text-base pl-12"
              />
              <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  to={cat === 'All' ? '/blog' : `/blog?category=${cat}`}
                >
                  <Button
                    variant={(!category && cat === 'All') || category === cat ? 'default' : 'outline'}
                    className="rounded-full"
                  >
                    {cat}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Blog Grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog: any, index: number) => (
              <ScrollReveal key={blog.id} delay={index * 0.1}>
                <Link to={`/blog/${blog.id}`}>
                  <motion.article
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col group"
                  >
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {blog.image ? (
                        <img
                          src={blog.image}
                          alt={blog.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                      {blog.category && (
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-white/90 text-foreground">{blog.category}</Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {blog.publishedAt 
                              ? new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : blog.createdAt 
                                ? new Date(blog.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : 'Recently'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{blog.author || 'Studio Sara'}</span>
                        </div>
                      </div>
                      <h2 className="font-semibold text-xl mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {blog.title}
                      </h2>
                      <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                        {blog.excerpt || 'No excerpt available'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{blog.readTime || '1 min read'}</span>
                        <Button variant="ghost" className="gap-2 group-hover:text-primary">
                          Read More
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.article>
                </Link>
              </ScrollReveal>
            ))}
          </div>

          )}

          {!isLoading && filteredBlogs.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg text-muted-foreground">No blog posts found</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
