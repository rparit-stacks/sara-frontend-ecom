import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Mail, Phone, MessageSquare, Calendar, Eye, Trash2, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { contactApi } from '@/lib/api';

const AdminContactSubmissions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  
  const queryClient = useQueryClient();
  
  // Fetch contact submissions
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['contact-submissions', statusFilter],
    queryFn: () => contactApi.getAllSubmissions(statusFilter === 'all' ? undefined : statusFilter),
  });
  
  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) => 
      contactApi.updateStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      toast.success('Status updated successfully!');
      setIsDetailDialogOpen(false);
      setSelectedSubmission(null);
      setAdminNotes('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => contactApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      toast.success('Submission deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete submission');
    },
  });
  
  const handleViewDetails = (submission: any) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.adminNotes || '');
    setIsDetailDialogOpen(true);
  };
  
  const handleUpdateStatus = (status: string) => {
    if (selectedSubmission) {
      updateStatusMutation.mutate({
        id: selectedSubmission.id,
        status,
        notes: adminNotes || undefined,
      });
    }
  };
  
  const filteredSubmissions = submissions.filter((submission: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      submission.firstName?.toLowerCase().includes(searchLower) ||
      submission.lastName?.toLowerCase().includes(searchLower) ||
      submission.email?.toLowerCase().includes(searchLower) ||
      submission.subject?.toLowerCase().includes(searchLower) ||
      submission.message?.toLowerCase().includes(searchLower)
    );
  });
  
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      NEW: { label: 'New', className: 'bg-blue-100 text-blue-700' },
      READ: { label: 'Read', className: 'bg-yellow-100 text-yellow-700' },
      REPLIED: { label: 'Replied', className: 'bg-green-100 text-green-700' },
      ARCHIVED: { label: 'Archived', className: 'bg-gray-100 text-gray-700' },
    };
    const config = statusConfig[status] || statusConfig.NEW;
    return <Badge className={config.className}>{config.label}</Badge>;
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <h1 className="font-semibold text-4xl lg:text-5xl font-bold mb-2">
              Contact <span className="text-primary">Submissions</span>
            </h1>
            <p className="text-muted-foreground text-lg">View and manage contact form submissions</p>
          </div>
        </motion.div>
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, subject, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-11">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="READ">Read</SelectItem>
              <SelectItem value="REPLIED">Replied</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
        
        {/* Submissions List */}
        <div className="space-y-4">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No contact submissions found.
            </div>
          ) : (
            filteredSubmissions.map((submission: any, index: number) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="bg-white rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-lg">
                        {submission.firstName} {submission.lastName}
                      </h3>
                      {getStatusBadge(submission.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{submission.email}</span>
                      </div>
                      {(submission.countryCode || submission.phoneNumber) && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>
                            {submission.countryCode} {submission.phoneNumber}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {submission.createdAt 
                            ? new Date(submission.createdAt).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-1">Subject: {submission.subject}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {submission.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 lg:flex-col">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(submission)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(submission.id)}
                      disabled={deleteMutation.isPending}
                      className="text-destructive hover:text-destructive gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Contact Submission Details</DialogTitle>
            </DialogHeader>
            
            {selectedSubmission && (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">First Name</label>
                    <p className="text-base font-medium">{selectedSubmission.firstName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                    <p className="text-base font-medium">{selectedSubmission.lastName}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base">{selectedSubmission.email}</p>
                </div>
                
                {(selectedSubmission.countryCode || selectedSubmission.phoneNumber) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-base">
                      {selectedSubmission.countryCode} {selectedSubmission.phoneNumber}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <p className="text-base font-medium">{selectedSubmission.subject}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Message</label>
                  <p className="text-base whitespace-pre-wrap">{selectedSubmission.message}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Submitted On</label>
                  <p className="text-base">
                    {selectedSubmission.createdAt 
                      ? new Date(selectedSubmission.createdAt).toLocaleString('en-IN', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this submission..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('READ')}
                    disabled={updateStatusMutation.isPending || selectedSubmission.status === 'READ'}
                  >
                    Mark as Read
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('REPLIED')}
                    disabled={updateStatusMutation.isPending || selectedSubmission.status === 'REPLIED'}
                  >
                    Mark as Replied
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('ARCHIVED')}
                    disabled={updateStatusMutation.isPending || selectedSubmission.status === 'ARCHIVED'}
                  >
                    Archive
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      setSelectedSubmission(null);
                      setAdminNotes('');
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminContactSubmissions;
