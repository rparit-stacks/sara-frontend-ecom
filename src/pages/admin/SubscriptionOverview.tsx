import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Wrench, AlertTriangle, ShieldCheck } from 'lucide-react';
import { subscriptionApi } from '@/lib/api';
import {
  statusLabel,
  statusVariant,
  planLabel,
  formatDate,
  formatRemaining,
  gatewayLabel,
} from '@/lib/subscriptionUtils';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

const SubscriptionOverview = () => {
  const { data: status, isLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => subscriptionApi.getStatus(),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const s: any = status || {};
  const gateways: string[] = s.unlockedGateways || [];
  const gatewayStatus: string = s.gatewayStatus || 'EXPIRED';
  const maintStatus: string = s.maintenanceStatus || 'EXPIRED';

  const gatewayExpiringOrExpired = gatewayStatus === 'EXPIRING_SOON' || gatewayStatus === 'EXPIRED';
  const maintExpiringOrExpired = maintStatus === 'EXPIRING_SOON' || maintStatus === 'EXPIRED';

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Your maintenance status at a glance.</p>
        </div>

        {/* Banners */}
        {maintExpiringOrExpired && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              {maintStatus === 'EXPIRED'
                ? 'Your maintenance subscription has expired. Please renew to continue receiving support, updates, monitoring, and maintenance services.'
                : `Your maintenance subscription expires in ${formatRemaining(s.maintenanceRemainingDays, s.maintenanceEndDate)}.`}
            </div>
          </div>
        )}

        <div className="mx-auto grid max-w-xl gap-6">
          {/* Maintenance Status */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <Wrench className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Maintenance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Row
                label="State"
                value={
                  s.maintenanceActive ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <ShieldCheck className="h-4 w-4" /> Active
                    </span>
                  ) : (
                    'Inactive'
                  )
                }
              />
              <Row label="Plan" value={s.maintenancePlan || '—'} />
              <Row label="Start Date" value={formatDate(s.maintenanceStartDate)} />
              <Row
                label="Expiry Date"
                value={s.maintenanceEndDate ? formatDate(s.maintenanceEndDate) : s.maintenanceActive ? 'Lifetime' : '—'}
              />
              <Row
                label="Remaining Days"
                value={formatRemaining(s.maintenanceRemainingDays, s.maintenanceEndDate)}
              />
              <Row
                label="Status"
                value={<Badge variant={statusVariant(maintStatus)}>{statusLabel(maintStatus)}</Badge>}
              />
              <Button asChild className="mt-4 w-full" variant={s.maintenanceActive ? 'outline' : 'default'}>
                <Link to="/admin-sara/subscriptions/maintenance">{s.maintenanceActive ? 'Renew' : 'Subscribe'}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SubscriptionOverview;
