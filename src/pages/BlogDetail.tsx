import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Share2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

// Mock blog data - in real app, fetch from API: GET /api/blogs/{id}
const getBlogData = (id: string) => {
  return {
    id: id,
    title: 'The Art of Floral Design in Indian Textiles',
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=1200&h=600&fit=crop',
    author: 'Studio Sara',
    publishedAt: '2024-01-15',
    category: 'Design',
    readTime: '5 min read',
    content: `
      <p>Indian textiles have a rich history of floral design that spans centuries. From the intricate patterns of Mughal era to modern interpretations, floral motifs have remained a cornerstone of Indian textile artistry.</p>
      
      <h2>The Historical Roots</h2>
      <p>Floral patterns in Indian textiles can be traced back to ancient times, where they were used to symbolize nature, fertility, and beauty. The Mughal period brought Persian influences, creating a unique fusion that continues to inspire designers today.</p>
      
      <h2>Modern Interpretations</h2>
      <p>Today, contemporary designers are reimagining traditional floral patterns for modern homes and fashion. At Studio Sara, we blend traditional techniques with contemporary aesthetics to create timeless pieces.</p>
      
      <h2>Design Techniques</h2>
      <p>Our artisans use various techniques including block printing, embroidery, and digital printing to bring floral designs to life. Each method offers unique textures and visual appeal.</p>
      
      <p>Whether you're looking for home decor or fashion pieces, floral designs offer versatility and timeless beauty that never goes out of style.</p>
    `
  };
};

const BlogDetail = () => {
  const { id } = useParams();
  const blog = getBlogData(id || '1');

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
                <div className="flex items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{blog.author}</span>
                  </div>
                  <span>{blog.readTime}</span>
                </div>
              </div>

              {/* Featured Image */}
              <div className="mb-10 rounded-2xl overflow-hidden">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-auto"
                />
              </div>

              {/* Content */}
              <div 
                className="prose prose-lg max-w-none mb-10"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

              {/* Share */}
              <div className="pt-8 border-t border-border flex items-center gap-4">
                <span className="text-sm font-medium">Share this post:</span>
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </article>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default BlogDetail;
