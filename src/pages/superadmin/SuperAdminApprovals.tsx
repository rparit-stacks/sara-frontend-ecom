import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SuperAdminLayout } from '@/components/superadmin/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { superAdminApi } from '@/lib/api';
import { formatMoney, formatDate, gatewayLabel } from '@/lib/subscriptionUtils';

const SuperAdminApprovals = () => {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['sa-subscriptions', 'pending'],
    queryFn: () => superAdminApi.listSubscriptions('pending'),
  });

  const [approving, setApproving] = useState<any | null>(null);
  const [days, setDays] = useState<string>('365');
  const [lifetime, setLifetime] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sa-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
  };

  const submitApprove = async () => {
    if (!approving) return;
    setBusy(true);
    try {
      await superAdminApi.approve(approving.id, {
        lifetime,
        days: lifetime ? undefined : Number(days) || undefined,
      });
      toast.success('Subscription activated');
      setApproving(null);
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Could not approve');
    } finally {
      setBusy(false);
    }
  };

  const reject = async (id: number) => {
    setBusy(true);
    try {
      await superAdminApi.reject(id);
      toast.success('Payment rejected');
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Could not reject');
    } finally {
      setBusy(false);
    }
  };

  const openApprove = (s: any) => {
    setApproving(s);
    setLifetime(false);
    setDays(s.type === 'MAINTENANCE' ? '365' : s.duration === 'SIX_MONTH' ? '180' : s.duration === 'LIFETIME' ? '' : '365');
  };

  const list = data as any[];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Approvals</h1>
          <p className="text-muted-foreground">Verify manual payments and activate subscriptions.</p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments awaiting approval.</p>
        ) : (
          <div className="grid gap-4">
            {list.map((s) => (
              <Card key={s.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">
                      {s.type === 'MAINTENANCE'
                        ? `Maintenance · ${s.maintenancePlan || ''}`
                        : `Gateways · ${(s.selectedGateways || []).map(gatewayLabel).join(', ')}`}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatMoney(s.amount, s.currency)} · requested {formatDate(s.createdAt)}
                    </p>
                  </div>
                  <Badge variant="secondary">{s.paymentStatus || 'PENDING'}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    {s.transactionRef && (
                      <span>
                        <span className="text-muted-foreground">Ref:</span> {s.transactionRef}
                      </span>
                    )}
                    {s.transactionScreenshotUrl ? (
                      <a
                        href={s.transactionScreenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        View screenshot <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">No screenshot submitted</span>
                    )}
                  </div>
                  {s.transactionScreenshotUrl && (
                    <img
                      src={s.transactionScreenshotUrl}
                      alt="Payment screenshot"
                      className="max-h-48 rounded-md border border-border"
                    />
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => openApprove(s)} disabled={busy}>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve &amp; activate
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => reject(s.id)} disabled={busy}>
                      <XCircle className="mr-1.5 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!approving} onOpenChange={(v) => !v && setApproving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set validity</DialogTitle>
            <DialogDescription>Choose how long this subscription should remain active.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={lifetime} onChange={(e) => setLifetime(e.target.checked)} />
              Lifetime (never expires)
            </label>
            {!lifetime && (
              <div className="space-y-2">
                <Label htmlFor="days">Valid for (days)</Label>
                <Input id="days" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submitApprove} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
};

export default SuperAdminApprovals;
