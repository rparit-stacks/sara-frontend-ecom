import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Package, Palette, Image, Users, Activity, TrendingUp, ShoppingBag, Loader2, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import { dashboardApi } from '@/lib/api';

const AdminDashboard = () => {
  // Fetch dashboard stats from API
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardApi.getStats(),
  });
  
  // Build stats from API data
  const stats = [
    { 
      icon: Users, 
      label: 'Total Users', 
      value: statsData?.totalUsers?.toLocaleString() || '0', 
      change: `${statsData?.activeUsers || 0} active`, 
      color: 'text-blue-600' 
    },
    { 
      icon: ShoppingBag, 
      label: 'Total Orders', 
      value: statsData?.totalOrders?.toLocaleString() || '0', 
      change: `${statsData?.pendingOrders || 0} pending`, 
      color: 'text-green-600' 
    },
    { 
      icon: IndianRupee, 
      label: 'Total Revenue', 
      value: `₹${(statsData?.totalRevenue || 0).toLocaleString('en-IN')}`, 
      change: 'Paid orders', 
      color: 'text-primary' 
    },
    { 
      icon: Package, 
      label: 'Total Products', 
      value: statsData?.totalProducts?.toLocaleString() || '0', 
      change: '', 
      color: 'text-pink-600' 
    },
    { 
      icon: Palette, 
      label: 'Total Categories', 
      value: statsData?.totalCategories?.toLocaleString() || '0', 
      change: '', 
      color: 'text-purple-600' 
    },
  ];

  const recentOrders = statsData?.recentOrders || [];
  
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
          <p className="text-destructive">Failed to load dashboard stats. Please try again.</p>
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
            Admin <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-lg">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-green-600">{stat.change}</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="bg-white rounded-xl p-6 border border-border shadow-sm"
          >
            <h2 className="font-cursive text-2xl font-bold mb-4">Recent Orders</h2>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No recent orders</p>
              ) : (
                recentOrders.map((order: any, index: number) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{order.userName || order.userEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        Order #{order.orderNumber} • ₹{order.total?.toLocaleString('en-IN') || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.status} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="bg-white rounded-xl p-6 border border-border shadow-sm"
          >
            <h2 className="font-cursive text-2xl font-bold mb-4">System Health</h2>
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">API Response Time</span>
                  <span className="text-sm font-semibold text-green-600">45ms</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '90%' }}
                    transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                    className="bg-green-600 h-2 rounded-full"
                  />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Server Load</span>
                  <span className="text-sm font-semibold text-green-600">32%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '32%' }}
                    transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
                    className="bg-green-600 h-2 rounded-full"
                  />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Error Rate</span>
                  <span className="text-sm font-semibold text-green-600">0.02%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '98%' }}
                    transition={{ delay: 1.0, duration: 0.8, ease: "easeOut" }}
                    className="bg-green-600 h-2 rounded-full"
                  />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.3 }}
                className="pt-4 border-t border-border"
              >
                <div className="flex items-center gap-2 text-sm">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-2 h-2 rounded-full bg-green-600"
                  />
                  <span className="text-muted-foreground">All systems operational</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
