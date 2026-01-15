import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, EyeOff, Mail, Calendar, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { adminUsersApi } from '@/lib/api';

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  
  // Fetch users from API
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminUsersApi.getAll(),
  });
  
  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ email, status }: { email: string; status: string }) => 
      adminUsersApi.updateStatus(email, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User status updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user status');
    },
  });
  
  const toggleUserStatus = (user: any) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateStatusMutation.mutate({ email: user.email, status: newStatus });
  };
  
  // Filter users
  const filteredUsers = users.filter((user: any) =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-destructive">Failed to load users. Please try again.</p>
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
        >
          <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
            User <span className="text-primary">Management</span>
          </h1>
          <p className="text-muted-foreground text-lg">Manage user accounts and activity</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </motion.div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">User</th>
                  <th className="text-left p-4 font-semibold text-sm">Email</th>
                  <th className="text-left p-4 font-semibold text-sm">Mockups</th>
                  <th className="text-left p-4 font-semibold text-sm">Joined</th>
                  <th className="text-left p-4 font-semibold text-sm">Status</th>
                  <th className="text-left p-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user: any, index: number) => (
                    <motion.tr
                      key={user.email}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.3 }}
                      className="border-t border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: Math.min(index * 0.05, 0.5) + 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
                          >
                            <span className="text-primary font-semibold">
                              {(user.firstName || user.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </motion.div>
                          <div>
                            <p className="font-semibold">
                              {user.firstName || user.lastName 
                                ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
                                : user.email}
                            </p>
                          </div>
                        </motion.div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{user.authProvider || '-'}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge 
                          className={user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                        >
                          {user.status?.toLowerCase() || 'active'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="flex items-center gap-2"
                        >
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9"
                            onClick={() => toggleUserStatus(user)}
                            disabled={updateStatusMutation.isPending}
                          >
                            {user.status === 'ACTIVE' ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </motion.div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
