import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Users,
  Search,
  UserCheck,
  X,
  History,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RolePermissionPicker } from '@/components/admin/RolePermissionPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  adminManagementApi,
  adminPermissionsApi,
  adminRolesApi,
  type AdminRoleDto,
} from '@/lib/api';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { cn } from '@/lib/utils';

const AUDIT_LABELS: Record<string, string> = {
  ROLE_CREATED: 'Role created',
  ROLE_UPDATED: 'Role updated',
  ROLE_DELETED: 'Role deleted',
  ROLE_ASSIGNED: 'Role assigned',
  ROLE_CLEARED: 'Role cleared',
  INVITE_SENT: 'Invite sent',
};

type EditorMode = 'create' | 'edit';

const emptyForm = {
  name: '',
  description: '',
  active: true,
};

const AdminRoles = () => {
  const queryClient = useQueryClient();
  const [, setSidebarCollapsed] = useSidebarCollapsed();

  // Shrink sidebar on this page (still expandable via the sidebar toggle).
  useEffect(() => {
    setSidebarCollapsed(true);
  }, [setSidebarCollapsed]);

  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [editingRole, setEditingRole] = useState<AdminRoleDto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loadingRole, setLoadingRole] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignAdminId, setAssignAdminId] = useState<number | null>(null);
  const [assignRoleId, setAssignRoleId] = useState<number | null>(null);
  const [adminSearch, setAdminSearch] = useState('');

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['adminRoles'],
    queryFn: () => adminRolesApi.list(),
  });

  const { data: permissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ['adminPermissions'],
    queryFn: () => adminPermissionsApi.list(),
  });

  const { data: admins = [] } = useQuery({
    queryKey: ['adminAdmins'],
    queryFn: () => adminManagementApi.getAll(),
  });

  const { data: auditRows = [], isLoading: auditLoading } = useQuery({
    queryKey: ['adminRbacAudit'],
    queryFn: () => adminRolesApi.audit(40),
  });

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.templateKey || '').toLowerCase().includes(q),
    );
  }, [roles, search]);

  const templateRoles = useMemo(
    () => roles.filter((r) => r.templateKey && r.active),
    [roles],
  );

  const assignableAdmins = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    return admins
      .filter((a: any) => !a.mainAdmin && a.username !== 'admin')
      .filter((a: any) => {
        if (!q) return true;
        return (
          (a.name || '').toLowerCase().includes(q) ||
          (a.email || '').toLowerCase().includes(q) ||
          (a.username || '').toLowerCase().includes(q)
        );
      });
  }, [admins, adminSearch]);

  const selectedAdmin = useMemo(
    () => admins.find((a: any) => a.id === assignAdminId) || null,
    [admins, assignAdminId],
  );

  useEffect(() => {
    if (!assignOpen || assignAdminId == null) return;
    const admin = admins.find((a: any) => a.id === assignAdminId);
    setAssignRoleId(admin?.role?.id ?? null);
  }, [assignOpen, assignAdminId, admins]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        active: form.active,
        permissionIds: [...selectedIds],
      };
      if (editorMode === 'edit' && editingRole) {
        return adminRolesApi.update(editingRole.id, payload);
      }
      return adminRolesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      queryClient.invalidateQueries({ queryKey: ['adminRbacAudit'] });
      toast.success(editorMode === 'edit' ? 'Role updated' : 'Role created');
      closeEditor();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to save role'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminRolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
      queryClient.invalidateQueries({ queryKey: ['adminRbacAudit'] });
      toast.success('Role deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete role'),
  });

  const assignMutation = useMutation({
    mutationFn: () => {
      if (assignAdminId == null) throw new Error('Select an admin');
      return adminRolesApi.setAssignment(assignAdminId, assignRoleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAdmins'] });
      queryClient.invalidateQueries({ queryKey: ['adminsWaitingForRole'] });
      queryClient.invalidateQueries({ queryKey: ['adminRbacAudit'] });
      toast.success(assignRoleId == null ? 'Role cleared' : 'Role assigned');
      setAssignOpen(false);
      setAssignAdminId(null);
      setAssignRoleId(null);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to assign role'),
  });

  const openCreate = () => {
    setEditorMode('create');
    setEditingRole(null);
    setForm(emptyForm);
    setSelectedIds(new Set());
    setView('editor');
  };

  const openEdit = async (role: AdminRoleDto) => {
    setEditorMode('edit');
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description || '',
      active: role.active,
    });
    setSelectedIds(new Set(role.permissionIds || []));
    setView('editor');
    setLoadingRole(true);
    try {
      const full = await adminRolesApi.get(role.id);
      setEditingRole(full);
      setForm({
        name: full.name,
        description: full.description || '',
        active: full.active,
      });
      setSelectedIds(new Set(full.permissionIds || []));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load role');
      setView('list');
    } finally {
      setLoadingRole(false);
    }
  };

  const closeEditor = () => {
    setView('list');
    setEditingRole(null);
    setForm(emptyForm);
    setSelectedIds(new Set());
    setLoadingRole(false);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    saveMutation.mutate();
  };

  return (
    <AdminLayout>
      {view === 'list' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Roles</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Bundle permissions into a role, then assign one role per admin. Main admin is never limited by roles.
                Prebuilt templates (Store ops, Portal sales, Read-only support) are ready for 1-click invite.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
                <UserCheck className="w-4 h-4 mr-1.5" />
                Assign
              </Button>
              <Button size="sm" onClick={openCreate} className="btn-primary">
                <Plus className="w-4 h-4 mr-1.5" />
                New role
              </Button>
            </div>
          </div>

          {templateRoles.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Prebuilt templates
              </div>
              <div className="flex flex-wrap gap-2">
                {templateRoles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => openEdit(r)}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-left text-sm hover:border-primary/40 transition-colors"
                  >
                    <span className="font-medium block">{r.name}</span>
                    <span className="text-xs text-muted-foreground">{r.permissionCount} permissions</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles…"
              className="pl-9 h-9"
            />
          </div>

          {rolesLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
              <Shield className="w-9 h-9 mx-auto text-muted-foreground/70 mb-3" />
              <p className="font-medium mb-1">No roles yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a role and select features from the permission list.
              </p>
              <Button size="sm" onClick={openCreate} className="btn-primary">
                <Plus className="w-4 h-4 mr-1.5" />
                Create role
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-semibold truncate">{role.name}</h3>
                        {role.templateKey && (
                          <Badge variant="outline" className="shrink-0 text-[10px] px-1.5">
                            Template
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
                        {role.description || '—'}
                      </p>
                    </div>
                    <Badge variant={role.active ? 'default' : 'secondary'} className="shrink-0">
                      {role.active ? 'Active' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      {role.permissionCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {role.assignedAdminCount}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-border/60">
                    <Button variant="ghost" size="sm" className="flex-1 h-8" onClick={() => openEdit(role)}>
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete “${role.name}”?`)) deleteMutation.mutate(role.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <div>
                <h2 className="text-sm font-semibold">Permission audit</h2>
                <p className="text-xs text-muted-foreground">
                  Who changed roles or assignments — not API request logs.
                </p>
              </div>
            </div>
            {auditLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : auditRows.length === 0 ? (
              <p className="text-sm text-muted-foreground px-4 py-8 text-center">
                No role changes recorded yet.
              </p>
            ) : (
              <ul className="divide-y divide-border max-h-80 overflow-y-auto">
                {auditRows.map((row) => (
                  <li key={row.id} className="px-4 py-2.5 text-sm flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0 sm:w-36">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">
                        {AUDIT_LABELS[row.action] || row.action}
                      </span>
                      {row.roleName && (
                        <span className="text-muted-foreground"> · {row.roleName}</span>
                      )}
                      {(row.targetAdminEmail || row.targetAdminId) && (
                        <span className="text-muted-foreground">
                          {' '}
                          → {row.targetAdminEmail || `admin #${row.targetAdminId}`}
                        </span>
                      )}
                      {row.details && (
                        <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                          {row.details}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[12rem]">
                      {row.actorEmail || '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        /* Main-plane editor — no popup */
        <div className="flex flex-col gap-4 min-h-[calc(100vh-4rem)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Button type="button" variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={closeEditor}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
                  {editorMode === 'edit' ? 'Edit role' : 'New role'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a feature to grant all its actions, or pick actions one by one.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">
                {selectedIds.size} selected
              </span>
              <Button variant="outline" size="sm" onClick={closeEditor} disabled={saveMutation.isPending}>
                Cancel
              </Button>
              <Button size="sm" className="btn-primary min-w-[100px]" onClick={handleSave} disabled={saveMutation.isPending || loadingRole}>
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>

          {loadingRole ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4">
              <aside className="rounded-xl border border-border bg-card p-4 space-y-4 h-fit lg:sticky lg:top-6">
                <div>
                  <Label htmlFor="role-name" className="text-xs">Name *</Label>
                  <Input
                    id="role-name"
                    className="mt-1.5 h-9"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Catalog Manager"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="role-desc" className="text-xs">Description</Label>
                  <Textarea
                    id="role-desc"
                    className="mt-1.5 min-h-[72px] text-sm"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <Label htmlFor="role-active" className="text-sm font-normal">Active</Label>
                  <Switch
                    id="role-active"
                    checked={form.active}
                    onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
                  />
                </div>
              </aside>

              <div className="min-h-[420px] lg:min-h-[calc(100vh-10rem)] flex flex-col">
                {permsLoading ? (
                  <div className="flex-1 flex items-center justify-center rounded-xl border border-border bg-card">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <RolePermissionPicker
                    permissions={permissions}
                    selectedIds={selectedIds}
                    onChange={setSelectedIds}
                    className="flex-1 min-h-[420px]"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compact assign dialog only */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 pr-12">
            <DialogTitle className="text-lg">Assign role</DialogTitle>
            <DialogDescription className="text-xs">
              Each admin gets exactly one role. Permissions live on the role.
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 pb-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label className="text-xs">Admin</Label>
              <Input
                className="mt-1.5 h-9 mb-2"
                placeholder="Search…"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
              />
              <div className="rounded-lg border border-border max-h-36 overflow-y-auto">
                {assignableAdmins.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3">No admins</p>
                ) : (
                  assignableAdmins.map((a: any) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAssignAdminId(a.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm border-b border-border last:border-0 hover:bg-muted/50',
                        assignAdminId === a.id && 'bg-primary/8',
                      )}
                    >
                      <span className="font-medium block truncate">{a.name || a.username}</span>
                      <span className="text-xs text-muted-foreground truncate block">{a.email}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {selectedAdmin && (
              <div>
                <Label className="text-xs mb-1.5 block">Role</Label>
                <div className="rounded-lg border border-border max-h-44 overflow-y-auto divide-y">
                  <label className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/40">
                    <input
                      type="radio"
                      name="assign-role"
                      className="accent-primary"
                      checked={assignRoleId == null}
                      onChange={() => setAssignRoleId(null)}
                    />
                    <span className="text-sm text-muted-foreground">No role</span>
                  </label>
                  {roles.filter((r) => r.active).length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3">Create an active role first.</p>
                  ) : (
                    roles
                      .filter((r) => r.active)
                      .map((role) => (
                        <label
                          key={role.id}
                          className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/40"
                        >
                          <input
                            type="radio"
                            name="assign-role"
                            className="accent-primary"
                            checked={assignRoleId === role.id}
                            onChange={() => setAssignRoleId(role.id)}
                          />
                          <span className="text-sm">{role.name}</span>
                        </label>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-5 py-3 border-t border-border bg-muted/20">
            <Button variant="ghost" size="sm" onClick={() => setAssignOpen(false)}>
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              className="btn-primary"
              disabled={assignAdminId == null || assignMutation.isPending}
              onClick={() => assignMutation.mutate()}
            >
              {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRoles;
