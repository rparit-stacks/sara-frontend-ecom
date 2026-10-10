import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { logsApi, HealthAlertRecipient } from '@/lib/api';

const QUERY_KEY = ['health-alert-recipients'];

/** Main-admin-only: who gets 5xx / downtime alerts and the daily health summary. */
export const HealthAlertRecipients = () => {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const { data = [], isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: logsApi.getAlertRecipients });

  const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : 'Something went wrong');
  const refresh = () => qc.invalidateQueries({ queryKey: QUERY_KEY });

  const add = useMutation({
    mutationFn: () =>
      logsApi.createAlertRecipient({
        name,
        email,
        phone,
        notifyEmail: !!email.trim(),
        notifyWhatsapp: !!phone.trim() && !email.trim(),
      }),
    onSuccess: () => {
      setName(''); setEmail(''); setPhone('');
      refresh();
      toast.success('Recipient added');
    },
    onError,
  });
  const update = useMutation({
    mutationFn: ({ r, patch }: { r: HealthAlertRecipient; patch: Partial<HealthAlertRecipient> }) =>
      logsApi.updateAlertRecipient(r.id, { ...r, ...patch }),
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: number) => logsApi.deleteAlertRecipient(id),
    onSuccess: refresh,
    onError,
  });

  const toggle = (r: HealthAlertRecipient, key: 'notifyEmail' | 'notifyWhatsapp' | 'dailyDigest' | 'enabled', label: string) => (
    <label className="flex items-center gap-1.5 text-xs">
      <Switch
        checked={r[key]}
        disabled={(key === 'notifyEmail' && !r.email) || (key === 'notifyWhatsapp' && !r.phone)}
        onCheckedChange={(v) => update.mutate({ r, patch: { [key]: v } })}
      />
      {label}
    </label>
  );

  return (
    <div className="border-t pt-4 space-y-3">
      <div className="text-sm font-medium flex items-center gap-1">
        <BellRing className="w-4 h-4 text-primary" /> Alert recipients
        <span className="text-xs font-normal text-muted-foreground ml-1">
          (5xx spike, downtime, recovery · only you as main admin can edit)
        </span>
      </div>

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No recipients yet — alerts currently go to the super-admin's WhatsApp only.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.map((r) => (
            <li key={r.id} className="rounded-lg border p-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1 basis-48">
                <div className="text-sm font-medium truncate">{r.name || r.email || r.phone}</div>
                <div className="text-xs text-muted-foreground truncate">{[r.email, r.phone].filter(Boolean).join(' · ')}</div>
              </div>
              {toggle(r, 'notifyEmail', 'Email')}
              {toggle(r, 'notifyWhatsapp', 'WhatsApp')}
              {toggle(r, 'dailyDigest', 'Daily summary')}
              {toggle(r, 'enabled', 'Active')}
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(r.id)} aria-label="Remove recipient">
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-col sm:flex-row gap-2"
        onSubmit={(e) => { e.preventDefault(); add.mutate(); }}
      >
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="WhatsApp (91XXXXXXXXXX)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Button type="submit" disabled={add.isPending || (!email.trim() && !phone.trim())}>
          Add
        </Button>
      </form>
    </div>
  );
};
