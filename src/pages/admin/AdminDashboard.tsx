import { AdminLayout } from '@/components/admin/AdminLayout';
import { Package, Palette, Image, Users, Activity, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { 
    icon: Package, 
    label: 'Total Products', 
    value: '48', 
    change: '+12%', 
    color: 'text-primary' 
  },
  { 
    icon: Palette, 
    label: 'Total Fabrics', 
    value: '156', 
    change: '+8%', 
    color: 'text-pink-600' 
  },
  { 
    icon: Image, 
    label: 'Total Designs', 
    value: '324', 
    change: '+15%', 
    color: 'text-purple-600' 
  },
  { 
    icon: Users, 
    label: 'Total Users', 
    value: '1,234', 
    change: '+23%', 
    color: 'text-blue-600' 
  },
  { 
    icon: Activity, 
    label: 'Mockups Created', 
    value: '5,678', 
    change: '+18%', 
    color: 'text-green-600' 
  },
  { 
    icon: TrendingUp, 
    label: 'Active Sessions', 
    value: '89', 
    change: '+5%', 
    color: 'text-orange-600' 
  },
];

const recentMockups = [
  { id: 1, user: 'Priya Sharma', product: 'Floral Scarf', fabric: 'Silk Pink', design: 'Rose Pattern', time: '2 mins ago' },
  { id: 2, user: 'Rajesh Kumar', product: 'Cushion Cover', fabric: 'Cotton Blue', design: 'Custom Upload', time: '15 mins ago' },
  { id: 3, user: 'Anita Reddy', product: 'Table Runner', fabric: 'Linen Cream', design: 'Paisley', time: '32 mins ago' },
  { id: 4, user: 'Meera Kapoor', product: 'Bedspread', fabric: 'Cotton White', design: 'Floral', time: '1 hour ago' },
  { id: 5, user: 'Vikram Singh', product: 'Scarf', fabric: 'Silk Indigo', design: 'Geometric', time: '2 hours ago' },
];

const AdminDashboard = () => {
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
          {/* Recent Mockups */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="bg-white rounded-xl p-6 border border-border shadow-sm"
          >
            <h2 className="font-cursive text-2xl font-bold mb-4">Recent Mockups</h2>
            <div className="space-y-4">
              {recentMockups.map((mockup, index) => (
                <motion.div
                  key={mockup.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                  whileHover={{ x: 5, scale: 1.02 }}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{mockup.user}</p>
                    <p className="text-xs text-muted-foreground">
                      {mockup.product} • {mockup.fabric} • {mockup.design}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{mockup.time}</p>
                  </div>
                </motion.div>
              ))}
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
