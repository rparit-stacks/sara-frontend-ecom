import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, User, Mail, Calendar, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { adminManagementApi } from '@/lib/api';

const AdminAdmins = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    status: 'ACTIVE',
  });
  
  // Fetch admins from API
  const { data: admins = [], isLoading, error } = useQuery({
    queryKey: ['adminAdmins'],
    queryFn: () => adminManagementApi.getAll(),
  });
  
  // Create admin mutation
  const createMutation = useMutation({
    mutationFn: adminManagementApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAdmins'] });
      toast.success('Admin created successfully!');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create admin');
    },
  });
  
  // Update admin mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      adminManagementApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAdmins'] });
      toast.success('Admin updated successfully!');
      setIsEditDialogOpen(false);
      setEditingAdmin(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update admin');
    },
  });
  
  // Update status mutation
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
  
  // Delete admin mutation
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
      password: '',
      name: '',
      email: '',
      status: 'ACTIVE',
    });
  };
  
  const handleCreate = () => {
    createMutation.mutate(formData);
  };
  
  const handleUpdate = () => {
    if (editingAdmin) {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        status: formData.status,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      updateMutation.mutate({ id: editingAdmin.id, data: updateData });
    }
  };
  
  const handleEdit = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      password: '',
      name: admin.name || '',
      email: admin.email || '',
      status: admin.status || 'ACTIVE',
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
  
  // Filter admins
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-cursive text-3xl sm:text-4xl">Admin Users</h1>
            <p className="text-muted-foreground mt-1">Manage admin accounts and permissions</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary gap-2">
                <Plus className="w-4 h-4" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Username *</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <Label>Password *</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
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
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search admins by username, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Admins List */}
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
        
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Username</Label>
                <Input
                  value={formData.username}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>New Password (leave blank to keep current)</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                  className="flex-1"
                >
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
