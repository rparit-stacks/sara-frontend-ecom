import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Edit, Trash2, User, Mail, Calendar, Loader2, Mail as MailIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { adminManagementApi, projectApi } from '@/lib/api';

const AdminAdmins = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePortalAccess, setInvitePortalAccess] = useState(false);
  const [assignedProjectIds, setAssignedProjectIds] = useState<number[]>([]);
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    status: 'ACTIVE',
    portalAdminAccess: false,
  });
  
  const { data: admins = [], isLoading, error } = useQuery({
    queryKey: ['adminAdmins'],
    queryFn: () => adminManagementApi.getAll(),
  });
  
  const { data: allProjects = [] } = useQuery({
    queryKey: ['admin-projects-all'],
    queryFn: () => projectApi.list(),
    enabled: isEditDialogOpen && !!editingAdmin && editingAdmin.username !== 'admin' && formData.portalAdminAccess,
  });

  useEffect(() => {
    if (!isEditDialogOpen || !editingAdmin?.id || editingAdmin.username === 'admin') {
      setAssignedProjectIds([]);
      return;
    }
    adminManagementApi.getProjectAssignments(editingAdmin.id)
      .then((r) => setAssignedProjectIds(r.projectIds || []))
      .catch(() => setAssignedProjectIds([]));
  }, [isEditDialogOpen, editingAdmin?.id, editingAdmin?.username]);
  
  const sendInviteMutation = useMutation({
    mutationFn: ({ email, portalAdminAccess }: { email: string; portalAdminAccess: boolean }) =>
      adminManagementApi.sendInvite(email, portalAdminAccess),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAdmins'] });
      toast.success('Invitation sent successfully!');
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInvitePortalAccess(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      adminManagementApi.update(id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['adminAdmins'] });
      toast.success('Admin updated successfully!');
      if (editingAdmin?.username !== 'admin' && formData.portalAdminAccess) {
        try {
          await adminManagementApi.setProjectAssignments(editingAdmin.id, assignedProjectIds);
        } catch (e: any) {
          toast.error(e?.message || 'Admin saved but project assignments failed');
        }
      }
      try {
        const stored = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (editingAdmin?.id === stored.id) {
          localStorage.setItem(
            'adminUser',
            JSON.stringify({ ...stored, portalAdminAccess: formData.portalAdminAccess }),
          );
        }
      } catch { /* ignore */ }
      setIsEditDialogOpen(false);
      setEditingAdmin(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update admin');
    },
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      adminManagementApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAdmins'] });
      toast.success('Admin status updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update admin status');
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: adminManagementApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAdmins'] });
      toast.success('Admin deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete admin');
    },
  });
  
  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      email: '',
      status: 'ACTIVE',
      portalAdminAccess: false,
    });
  };
  
  const handleSendInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    sendInviteMutation.mutate({
      email: inviteEmail.trim(),
      portalAdminAccess: invitePortalAccess,
    });
  };
  
  const handleUpdate = () => {
    if (editingAdmin) {
      updateMutation.mutate({
        id: editingAdmin.id,
        data: {
          name: formData.name,
          email: formData.email,
          status: formData.status,
          portalAdminAccess: formData.portalAdminAccess,
        },
      });
    }
  };
  
  const handleEdit = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      name: admin.name || '',
      email: admin.email || '',
      status: admin.status || 'ACTIVE',
      portalAdminAccess: admin.portalAdminAccess === true,
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      deleteMutation.mutate(id);
    }
  };
  
  const toggleAdminStatus = (admin: any) => {
    const newStatus = admin.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateStatusMutation.mutate({ id: admin.id, status: newStatus });
  };
  
  const filteredAdmins = admins.filter((admin: any) =>
    admin.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
        <div className="text-center py-12">
          <p className="text-destructive">Error loading admins</p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-cursive text-3xl sm:text-4xl">Admin Users</h1>
            <p className="text-muted-foreground mt-1">Manage admin accounts and permissions</p>
          </div>
          <Dialog
            open={isInviteDialogOpen}
            onOpenChange={(open) => {
              setIsInviteDialogOpen(open);
              if (!open) {
                setInviteEmail('');
                setInvitePortalAccess(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="btn-primary gap-2">
                <MailIcon className="w-4 h-4" />
                Send Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send Admin Invitation</DialogTitle>
                <DialogDescription>
                  Enter the email address to send an admin invitation. The recipient will set their own password when accepting the invite.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1"
                    required
                    disabled={sendInviteMutation.isPending}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <Label htmlFor="invite-portal-access">Manufacturing Portal access</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Grant access to /portal-admin when they accept the invite.
                    </p>
                  </div>
                  <Switch
                    id="invite-portal-access"
                    checked={invitePortalAccess}
                    onCheckedChange={setInvitePortalAccess}
                    disabled={sendInviteMutation.isPending}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSendInvite}
                    disabled={sendInviteMutation.isPending || !inviteEmail.trim()}
                    className="flex-1"
                  >
                    {sendInviteMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <MailIcon className="w-4 h-4 mr-2" /> Send Invitation
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsInviteDialogOpen(false);
                      setInviteEmail('');
                      setInvitePortalAccess(false);
                    }}
                    disabled={sendInviteMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search admins by username, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="grid gap-4">
          {filteredAdmins.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No admins found
            </div>
          ) : (
            filteredAdmins.map((admin: any, index: number) => (
              <motion.div
                key={admin.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{admin.name || admin.username}</h3>
                        <p className="text-sm text-muted-foreground">@{admin.username}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                      {admin.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span>{admin.email}</span>
                        </div>
                      )}
                      {admin.lastLogin && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Last login: {new Date(admin.lastLogin).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={admin.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {admin.status}
                    </Badge>
                    <Badge variant={admin.portalAdminAccess ? 'outline' : 'secondary'}>
                      {admin.portalAdminAccess ? 'Portal access' : 'Store only'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAdminStatus(admin)}
                      disabled={updateStatusMutation.isPending || admin.username === 'admin'}
                    >
                      {admin.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(admin)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(admin.id)}
                      disabled={deleteMutation.isPending || admin.username === 'admin'}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Username</Label>
                <Input value={formData.username} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={editingAdmin?.username === 'admin'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label htmlFor="portal-admin-access">Manufacturing Portal access</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Allow this admin to open /portal-admin (inquiries, quotes, projects).
                  </p>
                </div>
                <Switch
                  id="portal-admin-access"
                  checked={formData.portalAdminAccess}
                  onCheckedChange={(checked) => setFormData({ ...formData, portalAdminAccess: checked })}
                  disabled={editingAdmin?.username === 'admin'}
                />
              </div>
              {editingAdmin?.username !== 'admin' && formData.portalAdminAccess && (
                <div className="rounded-lg border border-border p-3 space-y-2 max-h-48 overflow-y-auto">
                  <Label>Assigned manufacturing projects</Label>
                  <p className="text-xs text-muted-foreground">
                    This admin will only see inquiries, quotes, and data for the selected projects.
                  </p>
                  {allProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No projects available</p>
                  ) : (
                    allProjects.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignedProjectIds.includes(p.id)}
                          onChange={(e) => {
                            setAssignedProjectIds((ids) =>
                              e.target.checked ? [...ids, p.id] : ids.filter((id) => id !== p.id),
                            );
                          }}
                        />
                        <span className="truncate">{p.code} — {p.title || p.clientName || 'Project'}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="flex-1">
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingAdmin(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminAdmins;
