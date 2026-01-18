import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Eye, EyeOff, CreditCard, DollarSign, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { businessConfigApi } from '@/lib/api';

const AdminPaymentConfig = () => {
  const [formData, setFormData] = useState({
    razorpayKeyId: '',
    razorpayKeySecret: '',
    razorpayEnabled: false,
    stripePublicKey: '',
    stripeSecretKey: '',
    stripeEnabled: false,
    currencyApiKey: '',
    currencyApiProvider: 'exchangerate-api',
  });
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showCurrencyKey, setShowCurrencyKey] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch config
  const { data: config, isLoading } = useQuery({
    queryKey: ['businessConfig'],
    queryFn: () => businessConfigApi.getConfigWithApiKey(),
  });
  
  // Update config mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => businessConfigApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessConfig'] });
      toast.success('Payment configuration saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save configuration');
    },
  });
  
  useEffect(() => {
    if (config) {
      setFormData({
        razorpayKeyId: config.razorpayKeyId || '',
        razorpayKeySecret: '', // Don't populate for security
        razorpayEnabled: config.razorpayEnabled || false,
        stripePublicKey: config.stripePublicKey || '',
        stripeSecretKey: '', // Don't populate for security
        stripeEnabled: config.stripeEnabled || false,
        currencyApiKey: config.currencyApiKey || '', // Show API key for admin
        currencyApiProvider: config.currencyApiProvider || 'exchangerate-api',
      });
    }
  }, [config]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Merge with existing config
    const updateData = {
      ...config,
      ...formData,
    };
    updateMutation.mutate(updateData);
  };
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-cursive text-4xl lg:text-5xl font-bold mb-2">
            Payment <span className="text-primary">Configuration</span>
          </h1>
          <p className="text-muted-foreground text-lg">Manage payment gateways and currency API settings</p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Razorpay Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-border p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Razorpay</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="razorpayEnabled" className="text-base">Enable Razorpay</Label>
                  <Switch
                    id="razorpayEnabled"
                    checked={formData.razorpayEnabled}
                    onCheckedChange={(checked) => handleChange('razorpayEnabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="razorpayKeyId">Key ID</Label>
                  <Input
                    id="razorpayKeyId"
                    value={formData.razorpayKeyId}
                    onChange={(e) => handleChange('razorpayKeyId', e.target.value)}
                    placeholder="rzp_test_..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="razorpayKeySecret">Key Secret</Label>
                  <div className="relative">
                    <Input
                      id="razorpayKeySecret"
                      type={showRazorpaySecret ? 'text' : 'password'}
                      value={formData.razorpayKeySecret}
                      onChange={(e) => handleChange('razorpayKeySecret', e.target.value)}
                      placeholder="Enter key secret to update"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                    >
                      {showRazorpaySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Leave empty to keep existing secret</p>
                </div>
              </div>
            </motion.div>

            {/* Stripe Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-border p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Stripe</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stripeEnabled" className="text-base">Enable Stripe</Label>
                  <Switch
                    id="stripeEnabled"
                    checked={formData.stripeEnabled}
                    onCheckedChange={(checked) => handleChange('stripeEnabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stripePublicKey">Public Key</Label>
                  <Input
                    id="stripePublicKey"
                    value={formData.stripePublicKey}
                    onChange={(e) => handleChange('stripePublicKey', e.target.value)}
                    placeholder="pk_test_..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stripeSecretKey">Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="stripeSecretKey"
                      type={showStripeSecret ? 'text' : 'password'}
                      value={formData.stripeSecretKey}
                      onChange={(e) => handleChange('stripeSecretKey', e.target.value)}
                      placeholder="Enter secret key to update"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowStripeSecret(!showStripeSecret)}
                    >
                      {showStripeSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Leave empty to keep existing secret</p>
                </div>
              </div>
            </motion.div>

            {/* Currency API Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-border p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Currency API</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currencyApiProvider">API Provider</Label>
                  <Select
                    value={formData.currencyApiProvider}
                    onValueChange={(value) => handleChange('currencyApiProvider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exchangerate-api">ExchangeRate-API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currencyApiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="currencyApiKey"
                      type={showCurrencyKey ? 'text' : 'password'}
                      value={formData.currencyApiKey}
                      onChange={(e) => handleChange('currencyApiKey', e.target.value)}
                      placeholder="Enter API key to update"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowCurrencyKey(!showCurrencyKey)}
                    >
                      {showCurrencyKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Leave empty to keep existing key</p>
                </div>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-end gap-4"
            >
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="min-w-[120px]"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentConfig;
