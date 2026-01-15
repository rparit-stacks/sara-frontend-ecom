import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Save, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
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
import { faqApi } from '@/lib/api';

const categories = ['All', 'Shipping', 'Returns', 'Payment', 'Customization', 'Products', 'General'];

const AdminFAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<any>(null);
  const [deleteFAQId, setDeleteFAQId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch FAQs from API
  const { data: faqs = [], isLoading, error } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => faqApi.getAllAdmin(),
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: faqApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ created successfully!');
      setIsAddDialogOpen(false);
      handleResetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create FAQ');
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => faqApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ updated successfully!');
      setIsEditDialogOpen(false);
      setEditingFAQ(null);
      handleResetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update FAQ');
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: faqApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast.success('FAQ deleted successfully!');
      setDeleteFAQId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete FAQ');
    },
  });
  
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

    const payload = {
      ...formData,
      status: formData.status.toUpperCase(),
    };

    if (editingFAQ) {
      updateMutation.mutate({ id: editingFAQ.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (faqId: number) => {
    setDeleteFAQId(faqId);
  };

  const confirmDelete = () => {
    if (deleteFAQId) {
      deleteMutation.mutate(deleteFAQId);
    }
  };

  const handleMoveUp = (faq: any) => {
    // Reorder mutation
    const newOrder = (faq.order || 0) - 1;
    if (newOrder >= 0) {
      updateMutation.mutate({ id: faq.id, data: { ...faq, order: newOrder } });
    }
  };

  const handleMoveDown = (faq: any) => {
    // Reorder mutation
    const newOrder = (faq.order || 0) + 1;
    updateMutation.mutate({ id: faq.id, data: { ...faq, order: newOrder } });
  };

  const filteredFAQs = faqs.filter((faq: any) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  
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
          <p className="text-destructive">Failed to load FAQs. Please try again.</p>
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
