import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SuperAdminLayout } from '@/components/superadmin/SuperAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { superAdminApi } from '@/lib/api';

const SuperAdminSettings = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['sa-settings'],
    queryFn: () => superAdminApi.getSettings(),
  });

  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [manualMode, setManualMode] = useState(true);
  const [supportContact, setSupportContact] = useState('');
  const [saving, setSaving] = useState(false);

  // Razorpay (subscription auto-checkout)
  const [rzpEnabled, setRzpEnabled] = useState(false);
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpKeySecret, setRzpKeySecret] = useState('');
  const [surcharge, setSurcharge] = useState('2');

  useEffect(() => {
    if (settings) {
      const s = settings as any;
      setUpiId(s.upiId ?? '');
      setPayeeName(s.payeeName ?? '');
      setManualMode(s.manualApprovalMode !== false);
      setSupportContact(s.supportContact ?? '');
      setRzpEnabled(s.razorpayEnabled ?? false);
      setRzpKeyId(s.razorpayKeyId ?? '');
      setRzpKeySecret(s.razorpayKeySecret ?? ''); // "***SET***" if already saved
      setSurcharge(String(s.razorpaySurchargePercent ?? 2));
    }
  }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      await superAdminApi.updateSettings({
        upiId,
        payeeName,
        manualApprovalMode: manualMode,
        supportContact,
        razorpayEnabled: rzpEnabled,
        razorpayKeyId: rzpKeyId,
        // Only send secret if the admin typed a new one (not the mask).
        razorpayKeySecret: rzpKeySecret && rzpKeySecret !== '***SET***' ? rzpKeySecret : undefined,
        razorpaySurchargePercent: Number(surcharge) || 0,
      });
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['sa-settings'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    } catch (err: any) {
      toast.error(err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure UPI payment target and the purchase flow.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment &amp; flow</CardTitle>
            <CardDescription>The UPI ID is embedded in the QR shown to store admins.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <div className="space-y-2">
                  <Label>UPI ID (VPA)</Label>
                  <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="merchant@upi" />
                </div>
                <div className="space-y-2">
                  <Label>Payee name</Label>
                  <Input value={payeeName} onChange={(e) => setPayeeName(e.target.value)} placeholder="Your Business" />
                </div>
                <div className="space-y-2">
                  <Label>Support contact</Label>
                  <Input
                    value={supportContact}
                    onChange={(e) => setSupportContact(e.target.value)}
                    placeholder="email or phone"
                  />
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/30 p-3">
                  <div>
                    <Label className="text-base">Manual approval mode</Label>
                    <p className="text-xs text-muted-foreground">
                      When on, store admins pay by QR and you approve manually. When off, the legacy live-checkout flow is used.
                    </p>
                  </div>
                  <Switch checked={manualMode} onCheckedChange={setManualMode} />
                </div>

                {/* Razorpay auto-checkout for subscriptions */}
                <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Razorpay auto-checkout</Label>
                      <p className="text-xs text-muted-foreground">
                        Let store admins pay subscriptions instantly via Razorpay (a surcharge is added). QR stays free.
                      </p>
                    </div>
                    <Switch checked={rzpEnabled} onCheckedChange={setRzpEnabled} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Razorpay Key ID</Label>
                      <Input value={rzpKeyId} onChange={(e) => setRzpKeyId(e.target.value)} placeholder="rzp_live_xxx" />
                    </div>
                    <div className="space-y-2">
                      <Label>Razorpay Key Secret</Label>
                      <Input
                        type="password"
                        value={rzpKeySecret}
                        onChange={(e) => setRzpKeySecret(e.target.value)}
                        placeholder={rzpKeySecret === '***SET***' ? '•••••• (saved)' : 'secret'}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:max-w-[200px]">
                    <Label>Surcharge (%)</Label>
                    <Input
                      type="number"
                      value={surcharge}
                      onChange={(e) => setSurcharge(e.target.value.replace(/[^\d.]/g, ''))}
                      placeholder="2"
                    />
                  </div>
                </div>

                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save settings
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSettings;
