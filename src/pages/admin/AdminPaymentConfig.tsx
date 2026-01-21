import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { paymentConfigApi } from '@/lib/api';

const AdminPaymentConfig = () => {
  const [formData, setFormData] = useState({
    razorpayKeyId: '',
    razorpayKeySecret: '',
    razorpayEnabled: false,
    stripePublicKey: '',
    stripeSecretKey: '',
    stripeEnabled: false,
    codEnabled: false,
    partialCodEnabled: false,
    partialCodAdvancePercentage: null as number | null,
  });
  
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch config with secrets for editing
  const { data: config, isLoading } = useQuery({
    queryKey: ['paymentConfig'],
    queryFn: () => paymentConfigApi.getConfigWithSecrets(),
  });
  
  // Update config mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => paymentConfigApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentConfig'] });
      queryClient.invalidateQueries({ queryKey: ['payment-config'] }); // For checkout page
      toast.success('Payment configuration saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save payment configuration');
    },
  });
  
  useEffect(() => {
    if (config) {
      setFormData({
        razorpayKeyId: config.razorpayKeyId || '',
        razorpayKeySecret: config.razorpayKeySecret === '***API_KEY_SET***' || !config.razorpayKeySecret ? '' : config.razorpayKeySecret,
        razorpayEnabled: config.razorpayEnabled || false,
        stripePublicKey: config.stripePublicKey || '',
        stripeSecretKey: config.stripeSecretKey === '***API_KEY_SET***' || !config.stripeSecretKey ? '' : config.stripeSecretKey,
        stripeEnabled: config.stripeEnabled || false,
        codEnabled: config.codEnabled || false,
        partialCodEnabled: config.partialCodEnabled || false,
        partialCodAdvancePercentage: config.partialCodAdvancePercentage || null,
      });
    }
  }, [config]);
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Validation Rule: COD & Partial COD Mutual Exclusivity
      if (field === 'partialCodEnabled' && value === true) {
        newData.codEnabled = false;
      }
      if (field === 'codEnabled' && value === true) {
        newData.partialCodEnabled = false;
      }
      
      return newData;
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Partial COD requires at least one gateway
    if (formData.partialCodEnabled && !formData.razorpayEnabled && !formData.stripeEnabled) {
      toast.error('Partial COD requires at least one online payment gateway (Razorpay or Stripe) to be enabled');
      return;
    }
    
    // Validation: Partial COD requires advance percentage
    if (formData.partialCodEnabled && (!formData.partialCodAdvancePercentage || formData.partialCodAdvancePercentage < 10 || formData.partialCodAdvancePercentage > 90)) {
      toast.error('Partial COD advance percentage must be between 10 and 90');
      return;
    }
    
    // Only send API keys if they've been changed (not empty and not placeholder)
    const submitData: any = { ...formData };
    
    // Handle API keys - only send if changed
    if (!submitData.razorpayKeyId || submitData.razorpayKeyId.trim() === '') {
      delete submitData.razorpayKeyId;
    }
    if (!submitData.razorpayKeySecret || submitData.razorpayKeySecret.trim() === '') {
      delete submitData.razorpayKeySecret;
    }
    if (!submitData.stripePublicKey || submitData.stripePublicKey.trim() === '') {
      delete submitData.stripePublicKey;
    }
    if (!submitData.stripeSecretKey || submitData.stripeSecretKey.trim() === '') {
      delete submitData.stripeSecretKey;
    }
    
    updateMutation.mutate(submitData);
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">Payment Configuration</h1>
          <p className="text-muted-foreground mb-6">
            Configure payment gateways and COD settings
          </p>
        </motion.div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Razorpay Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card p-6 rounded-lg border border-border"
          >
            <h2 className="text-xl font-semibold mb-4">Razorpay Configuration</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
                <Input
                  id="razorpayKeyId"
                  type="text"
                  value={formData.razorpayKeyId}
                  onChange={(e) => handleChange('razorpayKeyId', e.target.value)}
                  placeholder="Enter Razorpay Key ID"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="razorpayKeySecret">Razorpay Key Secret</Label>
                <div className="relative mt-1">
                  <Input
                    id="razorpayKeySecret"
                    type={showRazorpaySecret ? 'text' : 'password'}
                    value={formData.razorpayKeySecret}
                    onChange={(e) => handleChange('razorpayKeySecret', e.target.value)}
                    placeholder="Enter Razorpay Key Secret"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showRazorpaySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label htmlFor="razorpayEnabled" className="text-base font-medium">Enable Razorpay</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to pay via Razorpay (India only)</p>
                </div>
                <Switch
                  id="razorpayEnabled"
                  checked={formData.razorpayEnabled}
                  onCheckedChange={(checked) => handleChange('razorpayEnabled', checked)}
                />
              </div>
            </div>
          </motion.div>
          
          {/* Stripe Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card p-6 rounded-lg border border-border"
          >
            <h2 className="text-xl font-semibold mb-4">Stripe Configuration</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="stripePublicKey">Stripe Public Key</Label>
                <Input
                  id="stripePublicKey"
                  type="text"
                  value={formData.stripePublicKey}
                  onChange={(e) => handleChange('stripePublicKey', e.target.value)}
                  placeholder="Enter Stripe Public Key"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                <div className="relative mt-1">
                  <Input
                    id="stripeSecretKey"
                    type={showStripeSecret ? 'text' : 'password'}
                    value={formData.stripeSecretKey}
                    onChange={(e) => handleChange('stripeSecretKey', e.target.value)}
                    placeholder="Enter Stripe Secret Key"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStripeSecret(!showStripeSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showStripeSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label htmlFor="stripeEnabled" className="text-base font-medium">Enable Stripe</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to pay via Stripe (All countries)</p>
                </div>
                <Switch
                  id="stripeEnabled"
                  checked={formData.stripeEnabled}
                  onCheckedChange={(checked) => handleChange('stripeEnabled', checked)}
                />
              </div>
            </div>
          </motion.div>
          
          {/* COD Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-card p-6 rounded-lg border border-border"
          >
            <h2 className="text-xl font-semibold mb-4">Cash on Delivery (COD) Configuration</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label htmlFor="codEnabled" className="text-base font-medium">Enable Full COD</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to pay full amount on delivery (India only)</p>
                </div>
                <Switch
                  id="codEnabled"
                  checked={formData.codEnabled}
                  onCheckedChange={(checked) => handleChange('codEnabled', checked)}
                  disabled={formData.partialCodEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label htmlFor="partialCodEnabled" className="text-base font-medium">Enable Partial COD</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to pay advance online and rest on delivery</p>
                </div>
                <Switch
                  id="partialCodEnabled"
                  checked={formData.partialCodEnabled}
                  onCheckedChange={(checked) => handleChange('partialCodEnabled', checked)}
                  disabled={formData.codEnabled}
                />
              </div>
              
              {formData.partialCodEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <Label htmlFor="partialCodAdvancePercentage">Partial COD Advance Percentage (10-90%) *</Label>
                  <Input
                    id="partialCodAdvancePercentage"
                    type="number"
                    value={formData.partialCodAdvancePercentage || ''}
                    onChange={(e) => handleChange('partialCodAdvancePercentage', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="e.g., 20"
                    min={10}
                    max={90}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentage of total order value to be paid online as advance for Partial COD.
                  </p>
                  
                  {!formData.razorpayEnabled && !formData.stripeEnabled && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-md">
                      <p className="text-sm text-yellow-800 dark:text-yellow-400">
                        ⚠️ Partial COD requires at least one online payment gateway (Razorpay or Stripe) to be enabled.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
          
          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4"
          >
            <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">Important Notes:</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>COD and Partial COD cannot be enabled simultaneously</li>
              <li>Partial COD requires at least one online payment gateway (Razorpay or Stripe)</li>
              <li>Razorpay is only available for India orders</li>
              <li>Stripe is available for all countries</li>
              <li>Digital products always require online payment (COD/Partial COD not available)</li>
            </ul>
          </motion.div>
          
          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex justify-end"
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
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentConfig;
