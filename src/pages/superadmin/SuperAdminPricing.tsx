import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SuperAdminLayout } from '@/components/superadmin/SuperAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { superAdminApi } from '@/lib/api';
import { durationLabel, planLabel } from '@/lib/subscriptionUtils';

const SuperAdminPricing = () => {
  const queryClient = useQueryClient();
  const { data: prices = [], isLoading } = useQuery({
    queryKey: ['sa-prices'],
    queryFn: () => superAdminApi.listPrices(),
  });
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['sa-settings'],
    queryFn: () => superAdminApi.getSettings(),
  });

  const { data: aiPlans = [] } = useQuery({
    queryKey: ['sa-ai-plans'],
    queryFn: () => superAdminApi.listAiCreditPlans(),
  });
  const { data: aiBalance } = useQuery({
    queryKey: ['sa-ai-balance'],
    queryFn: () => superAdminApi.aiCreditBalance(),
  });

  const [grantAmount, setGrantAmount] = useState('5');
  const [granting, setGranting] = useState(false);

  const grantFreeCredits = async () => {
    const n = Number(grantAmount);
    if (!n || n <= 0) { toast.error('Enter a positive number'); return; }
    setGranting(true);
    try {
      const res = await superAdminApi.grantAiCredits(n);
      toast.success(`Granted ${res.granted} credits. Balance: ${res.balance}`);
      queryClient.invalidateQueries({ queryKey: ['sa-ai-balance'] });
      queryClient.invalidateQueries({ queryKey: ['ai-status'] });
    } catch (e: any) {
      toast.error(e?.message || 'Could not grant');
    } finally {
      setGranting(false);
    }
  };

  const forfeitCredits = async () => {
    if (!window.confirm('Forfeit all AI credits? This sets the balance to 0.')) return;
    setGranting(true);
    try {
      const res = await superAdminApi.forfeitAiCredits();
      toast.success(`All credits forfeited. Balance: ${res.balance}`);
      queryClient.invalidateQueries({ queryKey: ['sa-ai-balance'] });
      queryClient.invalidateQueries({ queryKey: ['ai-status'] });
    } catch (e: any) {
      toast.error(e?.message || 'Could not forfeit');
    } finally {
      setGranting(false);
    }
  };

  const [rows, setRows] = useState<any[]>([]);
  const [aiRows, setAiRows] = useState<any[]>([]);
  const [standard, setStandard] = useState('');
  const [premium, setPremium] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingMaint, setSavingMaint] = useState(false);
  const [savingAiId, setSavingAiId] = useState<string | null>(null);

  useEffect(() => {
    setRows(prices as any[]);
  }, [prices]);

  useEffect(() => {
    setAiRows(aiPlans as any[]);
  }, [aiPlans]);

  const updateAiRow = (i: number, patch: any) =>
    setAiRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const saveAiPlan = async (row: any) => {
    const key = String(row.id ?? `new-${row.credits}`);
    setSavingAiId(key);
    try {
      await superAdminApi.upsertAiCreditPlan({
        id: row.id,
        label: row.label,
        credits: Number(row.credits),
        pricePerProduct: Number(row.pricePerProduct),
        totalPrice: Number(row.totalPrice),
        active: row.active !== false,
        sortOrder: Number(row.sortOrder) || 0,
      });
      toast.success('AI plan saved');
      queryClient.invalidateQueries({ queryKey: ['sa-ai-plans'] });
      queryClient.invalidateQueries({ queryKey: ['ai-status'] });
    } catch (e: any) {
      toast.error(e?.message || 'Could not save');
    } finally {
      setSavingAiId(null);
    }
  };

  useEffect(() => {
    if (settings) {
      setStandard(String((settings as any).standardMaintenancePrice ?? ''));
      setPremium(String((settings as any).premiumMaintenancePrice ?? ''));
    }
  }, [settings]);

  const updateRow = (i: number, patch: any) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const saveRow = async (row: any) => {
    const key = `${row.serviceCount}-${row.duration}`;
    setSavingId(key);
    try {
      await superAdminApi.upsertPrice({
        serviceCount: row.serviceCount,
        duration: row.duration,
        price: Number(row.price),
        currency: row.currency,
        active: row.active,
      });
      toast.success('Price saved');
      queryClient.invalidateQueries({ queryKey: ['sa-prices'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    } catch (err: any) {
      toast.error(err.message || 'Could not save');
    } finally {
      setSavingId(null);
    }
  };

  const saveMaintenance = async () => {
    setSavingMaint(true);
    try {
      await superAdminApi.updateSettings({
        standardMaintenancePrice: Number(standard),
        premiumMaintenancePrice: Number(premium),
      });
      toast.success('Maintenance prices saved');
      queryClient.invalidateQueries({ queryKey: ['sa-settings'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    } catch (err: any) {
      toast.error(err.message || 'Could not save');
    } finally {
      setSavingMaint(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pricing</h1>
          <p className="text-muted-foreground">Edit the gateway pricing matrix and maintenance prices anytime.</p>
        </div>

        {/* Gateway pricing matrix removed for Studio Sara — payments are free here. */}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Maintenance prices (per year)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Standard (₹)</Label>
                    <Input type="number" value={standard} onChange={(e) => setStandard(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Premium (₹)</Label>
                    <Input type="number" value={premium} onChange={(e) => setPremium(e.target.value)} />
                  </div>
                </div>
                <Button onClick={saveMaintenance} disabled={savingMaint}>
                  {savingMaint ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save maintenance prices
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* AI credit plans */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <CardTitle className="text-lg">AI credit plans</CardTitle>
                <p className="text-sm text-muted-foreground">1 credit = 1 product the AI can create. Edit prices/credits anytime.</p>
              </div>
              {/* Grant free credits — no purchase needed */}
              <div className="flex items-end gap-2 rounded-xl bg-green-50 p-3 ring-1 ring-green-200 dark:bg-green-950/20">
                <div>
                  <Label className="text-xs">Grant free credits</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Current balance: <span className="font-semibold">{(aiBalance as any)?.balance ?? 0}</span>
                  </p>
                  <Input
                    type="number"
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value.replace(/[^\d]/g, ''))}
                    className="mt-1 h-9 w-24"
                  />
                </div>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={grantFreeCredits} disabled={granting}>
                  {granting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                  Grant
                </Button>
                <Button size="sm" variant="destructive" onClick={forfeitCredits} disabled={granting}>
                  Forfeit all
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>₹/product</TableHead>
                  <TableHead>Total ₹</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Save</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aiRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">No AI plans.</TableCell>
                  </TableRow>
                ) : (
                  aiRows.map((row, i) => {
                    const key = String(row.id ?? `new-${i}`);
                    return (
                      <TableRow key={key}>
                        <TableCell>
                          <Input value={row.label ?? ''} onChange={(e) => updateAiRow(i, { label: e.target.value })} className="w-28" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={row.credits ?? ''} onChange={(e) => updateAiRow(i, { credits: e.target.value })} className="w-20" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={row.pricePerProduct ?? ''} onChange={(e) => updateAiRow(i, { pricePerProduct: e.target.value })} className="w-24" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={row.totalPrice ?? ''} onChange={(e) => updateAiRow(i, { totalPrice: e.target.value })} className="w-28" />
                        </TableCell>
                        <TableCell>
                          <Switch checked={row.active !== false} onCheckedChange={(v) => updateAiRow(i, { active: v })} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => saveAiPlan(row)} disabled={savingAiId === key}>
                            {savingAiId === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminPricing;
