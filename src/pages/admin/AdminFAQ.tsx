import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
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

// Mock FAQ data - in real app, fetch from API: GET /api/admin/faqs
const mockFAQs = [
  { 
    id: 1, 
    question: 'What is the return policy?', 
    answer: 'We offer a 30-day return policy for unused items in original packaging. Items must be in their original condition.',
    category: 'Returns',
    order: 1,
    status: 'active'
  },
  { 
    id: 2, 
    question: 'How long does shipping take?', 
    answer: 'Standard shipping takes 5-7 business days. Express shipping is available and takes 2-3 business days.',
    category: 'Shipping',
    order: 2,
    status: 'active'
  },
  { 
    id: 3, 
    question: 'Can I customize my order?', 
    answer: 'Yes! You can upload your own design through our "Make Your Own" feature and create custom products.',
    category: 'Customization',
    order: 3,
    status: 'active'
  },
  { 
    id: 4, 
    question: 'What payment methods do you accept?', 
    answer: 'We accept all major credit cards, debit cards, UPI, and cash on delivery.',
    category: 'Payment',
    order: 4,
    status: 'inactive'
  },
];

const categories = ['All', 'Shipping', 'Returns', 'Payment', 'Customization', 'Products', 'General'];

const AdminFAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<any>(null);
  const [deleteFAQId, setDeleteFAQId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    order: 0,
    status: 'active' as 'active' | 'inactive',
  });

  const handleResetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'General',
      order: 0,
      status: 'active',
    });
  };

  const handleEdit = (faq: any) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      status: faq.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.question.trim()) {
      toast.error('Question is required');
      return;
    }
    if (!formData.answer.trim()) {
      toast.error('Answer is required');
      return;
    }

    // TODO: Call API
    console.log('FAQ Payload:', formData);
    toast.success(editingFAQ ? 'FAQ updated successfully!' : 'FAQ created successfully!');
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    handleResetForm();
    setEditingFAQ(null);
  };

  const handleDelete = (faqId: number) => {
    setDeleteFAQId(faqId);
  };

  const confirmDelete = () => {
    // TODO: Call API
    toast.success('FAQ deleted successfully!');
    setDeleteFAQId(null);
  };

  const handleMoveUp = (faq: any) => {
    // TODO: Call API to update order
    toast.success('Order updated');
  };

  const handleMoveDown = (faq: any) => {
    // TODO: Call API to update order
    toast.success('Order updated');
  };

  const filteredFAQs = mockFAQs.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => a.order - b.order);

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
              FAQ <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground text-lg">Create and manage frequently asked questions</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="btn-primary gap-2" onClick={() => {
              handleResetForm();
              setIsAddDialogOpen(true);
            }}>
              <Plus className="w-4 h-4" />
              Add New FAQ
            </Button>
          </motion.div>
        </motion.div>

        {/* Search & Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search FAQs by question or answer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="rounded-full"
              >
                {cat}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* FAQs List */}
        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {faq.category}
                      </Badge>
                      <Badge 
                        className={faq.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                      >
                        {faq.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Order: {faq.order}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{faq.question}</h3>
                    <p className="text-muted-foreground line-clamp-2">{faq.answer}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveUp(faq)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveDown(faq)}
                        disabled={index === filteredFAQs.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(faq)}
                        className="h-9 w-9"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(faq.id)}
                        className="h-9 w-9 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-border">
            <p className="text-lg text-muted-foreground">No FAQs found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery || selectedCategory !== 'All' 
                ? 'Try adjusting your search or filter' 
                : 'Click "Add New FAQ" to create your first FAQ'}
            </p>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            handleResetForm();
            setEditingFAQ(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-cursive text-3xl">
                {editingFAQ ? 'Edit FAQ' : 'Create FAQ'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label>Question</Label>
                <Input
                  placeholder="Enter the question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Answer</Label>
                <RichTextEditor 
                  value={formData.answer} 
                  onChange={(content) => setFormData({ ...formData, answer: content })}
                  placeholder="Enter the answer..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-11 px-3 rounded-lg border border-input bg-transparent"
                  >
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.status === 'active' ? 'FAQ will be visible to visitors' : 'FAQ will be hidden'}
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
                setEditingFAQ(null);
              }}>
                Cancel
              </Button>
              <Button className="btn-primary gap-2" onClick={handleSave}>
                <Save className="w-4 h-4" />
                {editingFAQ ? 'Update FAQ' : 'Create FAQ'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteFAQId !== null} onOpenChange={(open) => !open && setDeleteFAQId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this FAQ? This action cannot be undone.
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

export default AdminFAQ;
