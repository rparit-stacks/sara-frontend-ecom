import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SuperAdminLayout } from '@/components/superadmin/SuperAdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { superAdminApi } from '@/lib/api';
import {
  statusLabel,
  statusVariant,
  formatMoney,
  formatDate,
  durationLabel,
  gatewayLabel,
  formatRemaining,
} from '@/lib/subscriptionUtils';

type Action = 'extend' | 'reduce' | 'renew';

const SuperAdminSubscriptions = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<number | null>(null);

  const [dialog, setDialog] = useState<{ action: Action; sub: any } | null>(null);
  const [days, setDays] = useState('30');

  const { data = [], isLoading } = useQuery({
    queryKey: ['sa-subscriptions', filter],
    queryFn: () => superAdminApi.listSubscriptions(filter === 'all' ? undefined : filter),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sa-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
  };

  const run = async (id: number, fn: () => Promise<any>, msg: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(msg);
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const submitDialog = async () => {
    if (!dialog) return;
    const { action, sub } = dialog;
    const payload = { days: Number(days) || undefined };
    await run(
      sub.id,
      () =>
        action === 'extend'
          ? superAdminApi.extend(sub.id, payload)
          : action === 'reduce'
            ? superAdminApi.reduce(sub.id, payload)
            : superAdminApi.renew(sub.id, payload),
      action === 'extend' ? 'Validity extended' : action === 'reduce' ? 'Validity reduced' : 'Renewed',
    );
    setDialog(null);
  };

  const list = data as any[];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Manage every subscription with full master controls.</p>
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="expired">Expired/Inactive</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type / Plan</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      No subscriptions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">
                          {s.type === 'MAINTENANCE'
                            ? `Maintenance · ${s.maintenancePlan || ''}`
                            : `Gateways`}
                        </div>
                        {s.type !== 'MAINTENANCE' && (
                          <div className="text-xs text-muted-foreground">
                            {(s.selectedGateways || []).map(gatewayLabel).join(', ')}
                          </div>
                        )}
                        {s.grantType && s.grantType !== 'PAID' && (
                          <Badge variant="outline" className="mt-1">
                            {s.offerLabel || s.grantType}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{durationLabel(s.duration)}</TableCell>
                      <TableCell>{formatMoney(s.amount, s.currency)}</TableCell>
                      <TableCell>{s.endDate ? formatDate(s.endDate) : 'Lifetime'}</TableCell>
                      <TableCell>{formatRemaining(s.remainingDays, s.endDate)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(s.status)}>{statusLabel(s.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {busyId === s.id ? (
                          <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => run(s.id, () => superAdminApi.activate(s.id), 'Activated')}>
                                Activate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => run(s.id, () => superAdminApi.suspend(s.id), 'Suspended')}>
                                Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => run(s.id, () => superAdminApi.deactivate(s.id), 'Deactivated')}>
                                Deactivate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setDays('30'); setDialog({ action: 'extend', sub: s }); }}>
                                Extend validity…
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setDays('30'); setDialog({ action: 'reduce', sub: s }); }}>
                                Reduce validity…
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setDays('365'); setDialog({ action: 'renew', sub: s }); }}>
                                Renew…
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => run(s.id, () => superAdminApi.extend(s.id, { lifetime: true }), 'Lifetime granted')}>
                                Grant lifetime
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.action === 'extend' ? 'Extend validity' : dialog?.action === 'reduce' ? 'Reduce validity' : 'Renew'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.action === 'renew' ? 'Set a fresh validity window starting today.' : 'Adjust the end date by a number of days.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="adjust-days">Days</Label>
            <Input id="adjust-days" type="number" value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={submitDialog}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
};

export default SuperAdminSubscriptions;
