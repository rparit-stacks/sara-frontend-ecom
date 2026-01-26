import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, EyeOff, Mail, Calendar, Loader2, User, Phone, MapPin, Building, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { adminUsersApi } from '@/lib/api';

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch users from API
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminUsersApi.getAll(),
  });
  
  // Fetch detailed user data when dialog opens
  const { data: userDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['adminUserDetails', selectedUser?.email],
    queryFn: () => adminUsersApi.getByEmail(selectedUser.email),
    enabled: !!selectedUser?.email && isDetailDialogOpen,
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
  
  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setIsDetailDialogOpen(true);
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
                            onClick={() => handleViewDetails(user)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9"
                            onClick={() => toggleUserStatus(user)}
                            disabled={updateStatusMutation.isPending}
                            title={user.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
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
        
        {/* User Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">User Details</DialogTitle>
              <DialogDescription>
                Complete information about the user account
              </DialogDescription>
            </DialogHeader>
            
            {detailsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : userDetails ? (
              <div className="space-y-6 mt-4">
                {/* Basic Information */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{userDetails.email || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="font-medium mt-1">
                        {userDetails.firstName || userDetails.lastName 
                          ? `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim() 
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">First Name</label>
                      <p className="font-medium mt-1">{userDetails.firstName || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                      <p className="font-medium mt-1">{userDetails.lastName || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{userDetails.phoneNumber || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Auth Provider</label>
                      <Badge className="mt-1" variant="outline">
                        {userDetails.authProvider || '-'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
                      <div className="flex items-center gap-2 mt-1">
                        {userDetails.emailVerified ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600 font-medium">Not Verified</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Badge 
                        className={`mt-1 ${
                          userDetails.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {userDetails.status?.toLowerCase() || 'active'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">OAuth Provider ID</label>
                      <p className="font-medium mt-1 text-sm break-all">{userDetails.oauthProviderId || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">
                          {userDetails.createdAt 
                            ? new Date(userDetails.createdAt).toLocaleString() 
                            : '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">
                          {userDetails.updatedAt 
                            ? new Date(userDetails.updatedAt).toLocaleString() 
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legacy Address (if exists) */}
                {(userDetails.address || userDetails.city || userDetails.state) && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Legacy Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                        <p className="font-medium mt-1">{userDetails.address || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">City</label>
                        <p className="font-medium mt-1">{userDetails.city || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">State</label>
                        <p className="font-medium mt-1">{userDetails.state || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Zip Code</label>
                        <p className="font-medium mt-1">{userDetails.zipCode || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Country</label>
                        <p className="font-medium mt-1">{userDetails.country || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Saved Addresses */}
                {userDetails.addresses && userDetails.addresses.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5 text-primary" />
                      Saved Addresses ({userDetails.addresses.length})
                    </h3>
                    <div className="space-y-4">
                      {userDetails.addresses.map((addr: any, index: number) => (
                        <div key={addr.id} className="bg-white rounded-lg p-4 border border-border">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">
                                  {addr.firstName} {addr.lastName}
                                </h4>
                                {addr.isDefault && (
                                  <Badge className="bg-primary text-white">Default</Badge>
                                )}
                                {addr.addressType && (
                                  <Badge variant="outline">{addr.addressType}</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {addr.phoneNumber}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">{addr.address}</p>
                            {addr.landmark && (
                              <p className="text-muted-foreground">Landmark: {addr.landmark}</p>
                            )}
                            <p className="text-muted-foreground">
                              {addr.city}, {addr.state} {addr.zipCode}
                            </p>
                            <p className="text-muted-foreground">{addr.country}</p>
                            {addr.gstin && (
                              <p className="text-muted-foreground">GSTIN: {addr.gstin}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                              <Calendar className="w-3 h-3" />
                              Created: {addr.createdAt ? new Date(addr.createdAt).toLocaleDateString() : '-'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Failed to load user details
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
