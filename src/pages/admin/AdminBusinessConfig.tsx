import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { businessConfigApi } from '@/lib/api';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep'
];

const AdminBusinessConfig = () => {
  const [formData, setFormData] = useState({
    businessGstin: '',
    businessName: '',
    businessAddress: '',
    businessState: '',
    businessCity: '',
    businessPincode: '',
    businessPhone: '',
    businessEmail: '',
    swipeApiKey: '',
    swipeEnabled: false,
    einvoiceEnabled: false,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch config
  const { data: config, isLoading } = useQuery({
    queryKey: ['businessConfig'],
    queryFn: () => businessConfigApi.getConfig(),
  });
  
  // Update config mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => businessConfigApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessConfig'] });
      toast.success('Business configuration saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save configuration');
    },
  });
  
  useEffect(() => {
    if (config) {
      setFormData({
        businessGstin: config.businessGstin || '',
        businessName: config.businessName || '',
        businessAddress: config.businessAddress || '',
        businessState: config.businessState || '',
        businessCity: config.businessCity || '',
        businessPincode: config.businessPincode || '',
        businessPhone: config.businessPhone || '',
        businessEmail: config.businessEmail || '',
        swipeApiKey: config.swipeApiKey === '***API_KEY_SET***' ? '' : (config.swipeApiKey || ''),
        swipeEnabled: config.swipeEnabled || false,
        einvoiceEnabled: config.einvoiceEnabled || false,
      });
    }
  }, [config]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only send API key if it's been changed (not empty and not placeholder)
    const submitData = { ...formData };
    if (!submitData.swipeApiKey || submitData.swipeApiKey.trim() === '') {
      // Don't send empty API key - backend will keep existing one
      delete submitData.swipeApiKey;
    }
    updateMutation.mutate(submitData);
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-semibold text-4xl lg:text-5xl font-bold mb-2">
            Business <span className="text-primary">Configuration</span>
          </h1>
          <p className="text-muted-foreground text-lg">Configure business details and Swipe GST billing integration</p>
        </motion.div>
        
        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6"
        >
          {/* Business Details Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Business Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessGstin">Business GSTIN *</Label>
                <Input
                  id="businessGstin"
                  value={formData.businessGstin}
                  onChange={(e) => handleChange('businessGstin', e.target.value)}
                  placeholder="27ABCDE1234F1Z5"
                  maxLength={15}
                  required
                />
                <p className="text-xs text-muted-foreground">15-digit GSTIN number</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  placeholder="Studio Sara"
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="businessAddress">Business Address *</Label>
                <Textarea
                  id="businessAddress"
                  value={formData.businessAddress}
                  onChange={(e) => handleChange('businessAddress', e.target.value)}
                  placeholder="Complete business address"
                  rows={3}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessState">State *</Label>
                <Select value={formData.businessState} onValueChange={(value) => handleChange('businessState', value)}>
                  <SelectTrigger id="businessState">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessCity">City *</Label>
                <Input
                  id="businessCity"
                  value={formData.businessCity}
                  onChange={(e) => handleChange('businessCity', e.target.value)}
                  placeholder="Mumbai"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessPincode">Pincode *</Label>
                <Input
                  id="businessPincode"
                  value={formData.businessPincode}
                  onChange={(e) => handleChange('businessPincode', e.target.value)}
                  placeholder="400001"
                  maxLength={6}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Phone *</Label>
                <Input
                  id="businessPhone"
                  value={formData.businessPhone}
                  onChange={(e) => handleChange('businessPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessEmail">Email *</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => handleChange('businessEmail', e.target.value)}
                  placeholder="hello@studiosara.in"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Swipe Configuration Section */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Swipe GST Billing Integration</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="swipeApiKey">
                  Swipe API Key {config?.swipeApiKey === '***API_KEY_SET***' ? '' : '*'}
                </Label>
                <div className="relative">
                  <Input
                    id="swipeApiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.swipeApiKey}
                    onChange={(e) => handleChange('swipeApiKey', e.target.value)}
                    placeholder={config?.swipeApiKey === '***API_KEY_SET***' ? 'API key is set (enter new key to update)' : 'Enter Swipe API key'}
                    required={config?.swipeApiKey !== '***API_KEY_SET***'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {config?.swipeApiKey === '***API_KEY_SET***' 
                    ? 'API key is configured. Enter a new key to update it.' 
                    : 'Get your API key from Swipe dashboard'}
                </p>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label htmlFor="swipeEnabled" className="text-base font-medium">Enable Swipe Integration</Label>
                  <p className="text-sm text-muted-foreground">Automatically create invoices when orders are confirmed</p>
                </div>
                <Switch
                  id="swipeEnabled"
                  checked={formData.swipeEnabled}
                  onCheckedChange={(checked) => handleChange('swipeEnabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label htmlFor="einvoiceEnabled" className="text-base font-medium">Enable E-Invoice Generation</Label>
                  <p className="text-sm text-muted-foreground">Generate IRN and QR code for GST compliance</p>
                </div>
                <Switch
                  id="einvoiceEnabled"
                  checked={formData.einvoiceEnabled}
                  onCheckedChange={(checked) => handleChange('einvoiceEnabled', checked)}
                />
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t">
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
          </div>
        </motion.form>
      </div>
    </AdminLayout>
  );
};

export default AdminBusinessConfig;
