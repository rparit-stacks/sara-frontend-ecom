import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, ChevronRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Mock blog posts - in real app, fetch from API: GET /api/blogs
const mockBlogs = [
  { 
    id: 1, 
    title: 'The Art of Floral Design in Indian Textiles', 
    excerpt: 'Explore the rich tradition of floral patterns in Indian textile design and how they continue to inspire modern fashion.',
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=500&fit=crop',
    author: 'Studio Sara',
    publishedAt: '2024-01-15',
    category: 'Design',
    readTime: '5 min read'
  },
  { 
    id: 2, 
    title: 'Sustainable Fabric Choices for Modern Living', 
    excerpt: 'Learn about eco-friendly fabric options that combine style with sustainability for your home and wardrobe.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=500&fit=crop',
    author: 'Studio Sara',
    publishedAt: '2024-01-20',
    category: 'Sustainability',
    readTime: '7 min read'
  },
  { 
    id: 3, 
    title: 'Custom Design Tips for Your Home', 
    excerpt: 'Discover how to create personalized home decor with our custom design tools and expert tips.',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=500&fit=crop',
    author: 'Studio Sara',
    publishedAt: '2024-01-25',
    category: 'Tips',
    readTime: '6 min read'
  },
  { 
    id: 4, 
    title: 'Traditional Patterns Meet Modern Aesthetics', 
    excerpt: 'How traditional Indian patterns are being reimagined for contemporary interior design.',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=500&fit=crop',
    author: 'Studio Sara',
    publishedAt: '2024-02-01',
    category: 'Design',
    readTime: '8 min read'
  },
  { 
    id: 5, 
    title: 'Caring for Your Handcrafted Textiles', 
    excerpt: 'Essential care instructions to keep your handcrafted textiles looking beautiful for years to come.',
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=500&fit=crop',
    author: 'Studio Sara',
    publishedAt: '2024-02-05',
    category: 'Care',
    readTime: '4 min read'
  },
  { 
    id: 6, 
    title: 'The Story Behind Our Artisan Collection', 
    excerpt: 'Meet the skilled artisans who bring our designs to life and learn about their craft traditions.',
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&h=500&fit=crop',
    author: 'Studio Sara',
    publishedAt: '2024-02-10',
    category: 'Story',
    readTime: '10 min read'
  },
];

const Blog = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Design', 'Sustainability', 'Tips', 'Care', 'Story'];
  
  const filteredBlogs = mockBlogs.filter(blog => {
    const matchesCategory = !category || category === 'All' || blog.category === category;
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog, index) => (
              <ScrollReveal key={blog.id} delay={index * 0.1}>
                <Link to={`/blog/${blog.id}`}>
                  <motion.article
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col group"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 text-foreground">{blog.category}</Badge>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{blog.author}</span>
                        </div>
                      </div>
                      <h2 className="font-semibold text-xl mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {blog.title}
                      </h2>
                      <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                        {blog.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{blog.readTime}</span>
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

          {filteredBlogs.length === 0 && (
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
