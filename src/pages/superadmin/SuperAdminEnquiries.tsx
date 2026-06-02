import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SuperAdminLayout } from '@/components/superadmin/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { superAdminApi } from '@/lib/api';
import { statusLabel, statusVariant, formatDate } from '@/lib/subscriptionUtils';

const VOLUME_LABEL: Record<string, string> = {
  LT_500: 'Less than 500 / month',
  '500_2000': '500 – 2,000 / month',
  GT_2000: '2,000+ / month',
};

const SuperAdminEnquiries = () => {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['sa-subscriptions', 'all'],
    queryFn: () => superAdminApi.listSubscriptions(),
  });

  const [approving, setApproving] = useState<any | null>(null);
  const [days, setDays] = useState('365');
  const [lifetime, setLifetime] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sa-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
  };

  // Only WhatsApp enquiries that still need a decision.
  const enquiries = (data as any[]).filter(
    (s) => s.type === 'WHATSAPP' && s.status === 'PENDING_APPROVAL',
  );

  const submitApprove = async () => {
    if (!approving) return;
    setBusy(true);
    try {
      await superAdminApi.approve(approving.id, { lifetime, days: lifetime ? undefined : Number(days) || undefined });
      toast.success('WhatsApp access approved');
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
      toast.success('Enquiry rejected');
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Could not reject');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Enquiries</h1>
          <p className="text-muted-foreground">WhatsApp access requests from store admins.</p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : enquiries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending WhatsApp enquiries.</p>
        ) : (
          <div className="grid gap-4">
            {enquiries.map((s) => (
              <Card key={s.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    {s.whatsappBrand || 'WhatsApp request'}
                  </CardTitle>
                  <Badge variant={statusVariant(s.status)}>{statusLabel(s.status)}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">WhatsApp number</dt>
                      <dd className="font-medium">{s.whatsappNumber || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Brand</dt>
                      <dd className="font-medium">{s.whatsappBrand || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Expected volume</dt>
                      <dd className="font-medium">{VOLUME_LABEL[s.whatsappVolume] || s.whatsappVolume || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Requested on</dt>
                      <dd className="font-medium">{formatDate(s.createdAt)}</dd>
                    </div>
                  </dl>
                  {s.whatsappUseCase && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Use-case: </span>
                      {s.whatsappUseCase}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setLifetime(false); setDays('365'); setApproving(s); }} disabled={busy}>
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve &amp; unlock
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
            <DialogTitle>Approve WhatsApp access</DialogTitle>
            <DialogDescription>Set how long WhatsApp should stay unlocked for this store.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={lifetime} onChange={(e) => setLifetime(e.target.checked)} />
              Lifetime (never expires)
            </label>
            {!lifetime && (
              <div className="space-y-2">
                <Label htmlFor="wa-days">Valid for (days)</Label>
                <Input id="wa-days" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
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

export default SuperAdminEnquiries;
