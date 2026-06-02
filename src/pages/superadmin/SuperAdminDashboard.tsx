import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SuperAdminLayout } from '@/components/superadmin/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { superAdminApi } from '@/lib/api';
import { statusLabel, statusVariant, formatMoney, formatDate } from '@/lib/subscriptionUtils';

const SuperAdminDashboard = () => {
  const { data: all = [], isLoading } = useQuery({
    queryKey: ['sa-subscriptions', 'all'],
    queryFn: () => superAdminApi.listSubscriptions(),
  });

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SuperAdminLayout>
    );
  }

  const list = all as any[];
  const pending = list.filter((s) => s.status === 'PENDING_APPROVAL');
  const active = list.filter((s) => ['ACTIVE', 'TRIAL_ACTIVE', 'EXPIRING_SOON', 'LIFETIME'].includes(s.status));
  const expired = list.filter((s) => ['EXPIRED', 'REJECTED', 'SUSPENDED'].includes(s.status));

  const stats = [
    { label: 'Pending approvals', value: pending.length, icon: Clock, color: 'text-amber-500' },
    { label: 'Active', value: active.length, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Expired / inactive', value: expired.length, icon: XCircle, color: 'text-destructive' },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of subscriptions across the store.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pending approvals</CardTitle>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/super-admin/approvals">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending approvals.</p>
            ) : (
              <ul className="divide-y divide-border">
                {pending.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">
                        {s.type === 'MAINTENANCE' ? `Maintenance · ${s.maintenancePlan || ''}` : `Gateways · ${(s.selectedGateways || []).join(', ')}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatMoney(s.amount, s.currency)} · {formatDate(s.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusVariant(s.status)}>{statusLabel(s.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
