import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MessageSquare, Lock, Check, Clock, ShieldCheck, KeyRound, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionApi } from '@/lib/api';

const PERKS = [
  { icon: KeyRound, text: 'Send login OTPs over WhatsApp instead of SMS/email' },
  { icon: Bell, text: 'Automatic message to the customer on every order & status update' },
  { icon: ShieldCheck, text: 'Delivery, payment, and abandoned-cart alerts on WhatsApp' },
  { icon: MessageSquare, text: 'Branded templates from your own WhatsApp Business number' },
];

/**
 * Gates WhatsApp features behind a WHATSAPP subscription. When unlocked, renders {children}.
 * When not, shows the perk card + an enquiry form (or a "waiting for approval" state).
 */
export function WhatsAppLockGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: status, isLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => subscriptionApi.getStatus(),
  });

  const [number, setNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [useCase, setUseCase] = useState('');
  const [volume, setVolume] = useState('LT_500');
  const [submitting, setSubmitting] = useState(false);

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
  if (s.whatsappActive) {
    return <>{children}</>;
  }

  const pending = s.whatsappStatus === 'PENDING_APPROVAL';

  const submit = async () => {
    if (!number.trim()) {
      toast.error('Enter your WhatsApp business number');
      return;
    }
    setSubmitting(true);
    try {
      await subscriptionApi.submitWhatsappEnquiry({
        whatsappNumber: number.trim(),
        whatsappBrand: brand.trim() || undefined,
        whatsappUseCase: useCase.trim() || undefined,
        whatsappVolume: volume,
      });
      toast.success('Enquiry submitted — the super admin will review it shortly.');
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    } catch (err: any) {
      toast.error(err.message || 'Could not submit enquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              WhatsApp <Lock className="h-5 w-5 text-muted-foreground" />
            </h1>
            <p className="text-muted-foreground">This feature is locked. Request access to enable WhatsApp messaging.</p>
          </div>
        </div>

        {/* Perks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What you get with WhatsApp</CardTitle>
            <CardDescription>Reach customers where they already are.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PERKS.map((p) => (
                <li key={p.text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950">
                    <p.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm">{p.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {pending ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <Clock className="h-10 w-10 text-amber-500" />
              <p className="font-medium">Enquiry submitted — waiting for approval</p>
              <p className="text-sm text-muted-foreground">
                The super admin is reviewing your request{s.whatsappNumber ? ` for ${s.whatsappNumber}` : ''}. WhatsApp will
                unlock automatically once approved.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request WhatsApp access</CardTitle>
              <CardDescription>Fill this form — the super admin will review and enable it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>WhatsApp business number *</Label>
                  <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+91XXXXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label>Business / brand name</Label>
                  <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Your Brand" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expected monthly messages</Label>
                <Select value={volume} onValueChange={setVolume}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LT_500">Less than 500</SelectItem>
                    <SelectItem value="500_2000">500 – 2,000</SelectItem>
                    <SelectItem value="GT_2000">2,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Use-case / message</Label>
                <Textarea
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  placeholder="Tell us how you'll use WhatsApp (e.g. order updates, OTP, offers)"
                  rows={3}
                />
              </div>
              <Button className="w-full" onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Submit enquiry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
