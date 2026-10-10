import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Edit, Trash2, User, Mail, Calendar, Loader2, Mail as MailIcon, Phone, KeyRound, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { adminManagementApi, adminRolesApi, type AdminRoleDto } from '@/lib/api';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { cn } from '@/lib/utils';

const TEMPLATE_ORDER = ['store_ops', 'portal_sales', 'readonly_support'] as const;

const AdminAdmins = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteReadOnly, setInviteReadOnly] = useState(false);
  /** Empty string = no role on invite (optional). */
  const [inviteRoleId, setInviteRoleId] = useState<string>('');
  const [editRoleId, setEditRoleId] = useState<string>('');
  const queryClient = useQueryClient();
  const { isMainAdmin: mainAdmin } = useAdminPermissions();

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    whatsappNumber: '',
    status: 'ACTIVE',
    readOnly: false,
  });
  
  const { data: admins = [], isLoading, error } = useQuery({
    queryKey: ['adminAdmins'],
    queryFn: () => adminManagementApi.getAll(),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['adminRoles'],
    queryFn: () => adminRolesApi.list(),
    enabled: isInviteDialogOpen || isEditDialogOpen || !!mainAdmin,
  });
  const activeRoles = roles.filter((r) => r.active);

  const templateRoles = useMemo(() => {
    const byKey = new Map(
      activeRoles.filter((r) => r.templateKey).map((r) => [r.templateKey as string, r]),
    );
    return TEMPLATE_ORDER.map((key) => byKey.get(key)).filter(Boolean) as AdminRoleDto[];
  }, [activeRoles]);

  const { data: waitingPayload } = useQuery({
    queryKey: ['adminsWaitingForRole'],
    queryFn: () => adminRolesApi.waitingForRole(),
    enabled: !!mainAdmin,
    refetchInterval: 60_000,
  });
  const waitingAdmins = waitingPayload?.admins ?? [];
  
  const sendInviteMutation = useMutation({
    mutationFn: ({
      email,
      readOnly,
      roleId,
    }: {
      email: string;
      readOnly: boolean;
      roleId: number | null;
    }) => adminManagementApi.sendInvite(email, readOnly, roleId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['adminAdmins'] });
      queryClient.invalidateQueries({ queryKey: ['adminsWaitingForRole'] });
      queryClient.invalidateQueries({ queryKey: ['adminRbacAudit'] });
      toast.success(
        vars.roleId == null
          ? 'Invitation sent. Assign a role after they join.'
          : 'Invitation sent successfully!',
      );
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteReadOnly(false);
      setInviteRoleId('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, data, roleId }: { id: number; data: any; roleId: number | null }) => {
      await adminManagementApi.update(id, data);
      const isMain = editingAdmin?.mainAdmin || editingAdmin?.username === 'admin';
      if (!isMain) {
        await adminRolesApi.setAssignment(id, roleId);
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['adminAdmins'] });
      queryClient.invalidateQueries({ queryKey: ['adminsWaitingForRole'] });
      queryClient.invalidateQueries({ queryKey: ['adminRbacAudit'] });
      toast.success('Admin updated successfully!');
      try {
        const stored = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (editingAdmin?.id === stored.id) {
          localStorage.setItem(
            'adminUser',
            JSON.stringify({ ...stored, readOnly: formData.readOnly }),
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
      whatsappNumber: '',
      status: 'ACTIVE',
      readOnly: false,
    });
    setEditRoleId('');
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    sendInviteMutation.mutate({
      email: inviteEmail.trim(),
      readOnly: inviteReadOnly,
      roleId: inviteRoleId ? Number(inviteRoleId) : null,
    });
  };
  
  const handleUpdate = () => {
    if (editingAdmin) {
      updateMutation.mutate({
        id: editingAdmin.id,
        data: {
          name: formData.name,
          email: formData.email,
          whatsappNumber: formData.whatsappNumber.trim(),
          status: formData.status,
          readOnly: formData.readOnly,
        },
        roleId: editRoleId ? Number(editRoleId) : null,
      });
    }
  };
  
  const handleEdit = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      name: admin.name || '',
      email: admin.email || '',
      whatsappNumber: admin.whatsappNumber || '',
      status: admin.status || 'ACTIVE',
      readOnly: admin.readOnly === true,
    });
    setEditRoleId(admin.role?.id != null ? String(admin.role.id) : '');
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
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/admin-sara/roles">
                <KeyRound className="w-4 h-4" />
                Roles & Permissions
              </Link>
            </Button>
          <Dialog
            open={isInviteDialogOpen}
            onOpenChange={(open) => {
              setIsInviteDialogOpen(open);
              if (!open) {
                setInviteEmail('');
                setInviteReadOnly(false);
                setInviteRoleId('');
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
                  Email them an invite link. Role is optional — you can assign it after they join.
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
                {templateRoles.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Quick templates</Label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {templateRoles.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          disabled={sendInviteMutation.isPending}
                          onClick={() => {
                            setInviteRoleId(String(role.id));
                            if (role.templateKey === 'readonly_support') {
                              setInviteReadOnly(true);
                            }
                          }}
                          className={cn(
                            'rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors',
                            inviteRoleId === String(role.id)
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border hover:border-primary/40 text-muted-foreground',
                          )}
                        >
                          <span className="font-medium text-foreground block">{role.name}</span>
                          <span className="line-clamp-1 opacity-80">{role.permissionCount} permissions</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Label>Role <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Select
                    value={inviteRoleId || 'none'}
                    onValueChange={(v) => setInviteRoleId(v === 'none' ? '' : v)}
                    disabled={sendInviteMutation.isPending}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="No role yet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No role yet — assign later</SelectItem>
                      {activeRoles.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                          {role.name}
                          {role.templateKey ? ' · template' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Without a role they can accept the invite but stay locked until you assign one.
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <Label htmlFor="invite-read-only">Read-only access</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Can view pages their role allows, but cannot create, edit, or delete anything.
                    </p>
                  </div>
                  <Switch
                    id="invite-read-only"
                    checked={inviteReadOnly}
                    onCheckedChange={setInviteReadOnly}
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
                      setInviteReadOnly(false);
                      setInviteRoleId('');
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
        </div>

        {mainAdmin && waitingAdmins.length > 0 && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/8 px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {waitingAdmins.length === 1
                  ? `${waitingAdmins[0].name || waitingAdmins[0].email || waitingAdmins[0].username} waiting for role`
                  : `${waitingAdmins.length} admins waiting for a role`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                They can sign in but see a locked screen until you assign a role.
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {waitingAdmins.map((a) => (
                  <li key={a.id}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        const full = admins.find((x: any) => x.id === a.id);
                        if (full) handleEdit(full);
                      }}
                    >
                      Assign · {a.name || a.email || a.username}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0 self-start">
              <Link to="/admin-sara/roles">Open roles</Link>
            </Button>
          </div>
        )}
        
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
                      <div className="relative w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
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
                      {admin.whatsappNumber && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{admin.whatsappNumber}</span>
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
                    {admin.readOnly && <Badge variant="secondary">Read-only</Badge>}
                    {admin.mainAdmin || admin.username === 'admin' ? (
                      <Badge variant="default">Main admin</Badge>
                    ) : admin.role?.name ? (
                      <Badge variant="outline">{admin.role.name}</Badge>
                    ) : (
                      <Badge variant="secondary">No role</Badge>
                    )}
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Admin</DialogTitle>
              <DialogDescription>
                Profile, role, and read-only. Portal access comes from any PORTAL_* permission on the role.
              </DialogDescription>
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
                <Label>WhatsApp number</Label>
                <Input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="e.g. 919810167696"
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
              {editingAdmin?.username !== 'admin' && !editingAdmin?.mainAdmin && (
                <div>
                  <Label>Role</Label>
                  <Select value={editRoleId || 'none'} onValueChange={(v) => setEditRoleId(v === 'none' ? '' : v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="No role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No role</SelectItem>
                      {activeRoles.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can also assign roles from Roles &amp; Permissions.
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label htmlFor="edit-read-only">Read-only access</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Can view pages their role allows, but cannot create, edit, or delete anything.
                  </p>
                </div>
                <Switch
                  id="edit-read-only"
                  checked={formData.readOnly}
                  onCheckedChange={(checked) => setFormData({ ...formData, readOnly: checked })}
                  disabled={editingAdmin?.username === 'admin'}
                />
              </div>
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
