import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SuperAdminLayout } from '@/components/superadmin/SuperAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { superAdminApi } from '@/lib/api';
import { gatewayLabel } from '@/lib/subscriptionUtils';

const GATEWAYS = ['RAZORPAY', 'PAYU', 'STRIPE', 'PARTIAL_COD'];
const QUICK_DAYS = [1, 3, 7, 15, 30, 45, 60, 90, 180, 365];

const SuperAdminGrants = () => {
  const queryClient = useQueryClient();
  const [type, setType] = useState<'PAYMENT_GATEWAY' | 'MAINTENANCE'>('MAINTENANCE');
  const [grantType, setGrantType] = useState<'FREE' | 'PROMOTIONAL' | 'LIFETIME'>('FREE');
  const [gateways, setGateways] = useState<Record<string, boolean>>({ RAZORPAY: true });
  const [maintenancePlan, setMaintenancePlan] = useState<'STANDARD' | 'PREMIUM'>('STANDARD');
  const [days, setDays] = useState('7');
  const [endDate, setEndDate] = useState('');
  const [offerLabel, setOfferLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedGateways = Object.keys(gateways).filter((g) => gateways[g]);

  const submit = async () => {
    if (type === 'PAYMENT_GATEWAY' && selectedGateways.length === 0) {
      toast.error('Select at least one gateway');
      return;
    }
    setBusy(true);
    try {
      await superAdminApi.grant({
        type,
        grantType,
        selectedGateways: type === 'PAYMENT_GATEWAY' ? selectedGateways : undefined,
        maintenancePlan: type === 'MAINTENANCE' ? maintenancePlan : undefined,
        days: grantType === 'LIFETIME' || endDate ? undefined : Number(days) || undefined,
        endDate: grantType === 'LIFETIME' ? undefined : endDate || undefined,
        offerLabel: offerLabel || undefined,
        notes: notes || undefined,
      });
      toast.success('Access granted');
      queryClient.invalidateQueries({ queryKey: ['sa-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      setOfferLabel('');
      setNotes('');
    } catch (err: any) {
      toast.error(err.message || 'Could not grant access');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Grants</h1>
          <p className="text-muted-foreground">
            Assign free, promotional, lifetime, or custom-duration access without payment.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New grant</CardTitle>
            <CardDescription>Configure and assign access instantly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Subscription type</Label>
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grant kind</Label>
                <Select value={grantType} onValueChange={(v) => setGrantType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free access</SelectItem>
                    <SelectItem value="PROMOTIONAL">Promotional offer</SelectItem>
                    <SelectItem value="LIFETIME">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {type === 'PAYMENT_GATEWAY' ? (
              <div className="space-y-2">
                <Label>Gateways</Label>
                <div className="space-y-2">
                  {GATEWAYS.map((g) => (
                    <div key={g} className="flex items-center justify-between rounded-md bg-muted/30 p-3">
                      <span className="text-sm font-medium">{gatewayLabel(g)}</span>
                      <Switch
                        checked={!!gateways[g]}
                        onCheckedChange={(v) => setGateways((prev) => ({ ...prev, [g]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Maintenance plan</Label>
                <Select value={maintenancePlan} onValueChange={(v) => setMaintenancePlan(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {grantType !== 'LIFETIME' && (
              <>
                <div className="space-y-2">
                  <Label>Duration (days)</Label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_DAYS.map((d) => (
                      <Button
                        key={d}
                        type="button"
                        size="sm"
                        variant={days === String(d) && !endDate ? 'default' : 'outline'}
                        onClick={() => {
                          setDays(String(d));
                          setEndDate('');
                        }}
                      >
                        {d}d
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    value={days}
                    onChange={(e) => {
                      setDays(e.target.value);
                      setEndDate('');
                    }}
                    placeholder="Custom days"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Or custom end date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}

            {grantType === 'PROMOTIONAL' && (
              <div className="space-y-2">
                <Label>Offer label</Label>
                <Input
                  value={offerLabel}
                  onChange={(e) => setOfferLabel(e.target.value)}
                  placeholder="e.g. Launch Offer 15 Days"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal note" />
            </div>

            <Button className="w-full" onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
              Grant access
            </Button>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminGrants;
