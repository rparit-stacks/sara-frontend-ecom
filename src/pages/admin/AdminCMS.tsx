import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Save, Image as ImageIcon, FileText, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const AdminCMS = () => {
  const [landingPageContent, setLandingPageContent] = useState({
    heroTitle: 'Exquisite Handcrafted Textiles',
    heroSubtitle: 'Made in Jaipur, For the World',
    heroDescription: 'Discover timeless artistry in every thread.',
  });

  const [contactPageContent, setContactPageContent] = useState({
    email: 'contact@studiosara.com',
    phone: '+91 9876543210',
    address: '123 Artisan Street, Jaipur, Rajasthan',
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
            Content <span className="text-primary">Management</span>
          </h1>
          <p className="text-muted-foreground text-lg">Edit website content and pages</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Tabs defaultValue="landing" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="landing" className="gap-2">
              <Globe className="w-4 h-4" />
              Landing Page
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <FileText className="w-4 h-4" />
              Contact Page
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Media Library
            </TabsTrigger>
            <TabsTrigger value="banners" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Banners
            </TabsTrigger>
          </TabsList>

          {/* Landing Page Editor */}
          <TabsContent value="landing" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
            >
              <div>
                <label className="text-sm font-medium mb-2 block">Hero Title</label>
                <Input
                  value={landingPageContent.heroTitle}
                  onChange={(e) => setLandingPageContent({ ...landingPageContent, heroTitle: e.target.value })}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Hero Subtitle</label>
                <Input
                  value={landingPageContent.heroSubtitle}
                  onChange={(e) => setLandingPageContent({ ...landingPageContent, heroSubtitle: e.target.value })}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Hero Description</label>
                <textarea
                  value={landingPageContent.heroDescription}
                  onChange={(e) => setLandingPageContent({ ...landingPageContent, heroDescription: e.target.value })}
                  className="w-full min-h-[120px] px-3 py-2 border border-border rounded-lg resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Hero Image</label>
                <Input type="file" accept="image/*" className="h-11" />
              </div>
              <Button className="btn-primary gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </motion.div>
          </TabsContent>

          {/* Contact Page Editor */}
          <TabsContent value="contact" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
            >
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  type="email"
                  value={contactPageContent.email}
                  onChange={(e) => setContactPageContent({ ...contactPageContent, email: e.target.value })}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone</label>
                <Input
                  value={contactPageContent.phone}
                  onChange={(e) => setContactPageContent({ ...contactPageContent, phone: e.target.value })}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Address</label>
                <textarea
                  value={contactPageContent.address}
                  onChange={(e) => setContactPageContent({ ...contactPageContent, address: e.target.value })}
                  className="w-full min-h-[100px] px-3 py-2 border border-border rounded-lg resize-none"
                />
              </div>
              <Button className="btn-primary gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </motion.div>
          </TabsContent>

          {/* Media Library */}
          <TabsContent value="media" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl border border-border shadow-sm p-6"
            >
              <div className="mb-6">
                <Input type="file" accept="image/*" multiple className="h-11" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.05, zIndex: 10 }}
                    className="aspect-square rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=200&h=200&fit=crop`}
                      alt={`Media ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Banner Management */}
          <TabsContent value="banners" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
            >
              <div>
                <label className="text-sm font-medium mb-2 block">Banner Image</label>
                <Input type="file" accept="image/*" className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <Input type="datetime-local" className="h-11" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input type="datetime-local" className="h-11" />
                </div>
              </div>
              <Button className="btn-primary gap-2">
                <Save className="w-4 h-4" />
                Save Banner
              </Button>
            </motion.div>
          </TabsContent>
        </Tabs>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminCMS;
