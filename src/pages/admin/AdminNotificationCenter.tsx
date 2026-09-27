import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { notificationLogApi } from '@/lib/api';

const CHANNELS = ['EMAIL', 'WHATSAPP', 'PUSH', 'SMS'] as const;
const PAGE_SIZE = 50;

/**
 * Delivery-history tab of the admin Notification Center — every send attempt across every
 * channel (email/WhatsApp/push), automated or (once the broadcast composer tab exists)
 * admin-triggered, in one place. Shows exactly what was sent, to whom, whether it worked, and
 * the real reason when it didn't — reads sara-notification-service's notification_log table
 * via sara-backend-ecom's proxy (see AdminNotificationLogController on both sides).
 */
export default function AdminNotificationCenter() {
  const [channel, setChannel] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [recipient, setRecipient] = useState('');
  const [recipientInput, setRecipientInput] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['notificationLogs', channel, status, recipient, page],
    queryFn: () =>
      notificationLogApi.getLogs({
        channel: channel === 'all' ? undefined : channel,
        status: status === 'all' ? undefined : status,
        recipient: recipient || undefined,
        page,
        size: PAGE_SIZE,
      }),
  });

  const applyRecipientSearch = () => {
    setRecipient(recipientInput.trim());
    setPage(0);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-semibold text-4xl lg:text-5xl font-bold mb-2 flex items-center gap-3">
            <Bell className="w-9 h-9 text-primary" />
            Notification <span className="text-primary">Center</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Every notification sent across email, WhatsApp and push — whether it actually delivered, and why one
            didn't when it failed.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Channel</label>
              <Select
                value={channel}
                onValueChange={(v) => {
                  setChannel(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="SUCCESS">Sent</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[220px]">
              <label className="text-xs font-medium text-muted-foreground">Recipient (email / phone / token)</label>
              <div className="flex gap-2">
                <Input
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyRecipientSearch()}
                  placeholder="Search recipient…"
                />
                <Button variant="outline" onClick={applyRecipientSearch}>
                  Search
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto bg-background">
              <table className="w-full min-w-[960px] table-fixed">
                <colgroup>
                  <col className="w-[100px]" />
                  <col className="w-[200px]" />
                  <col />
                  <col className="w-[120px]" />
                  <col className="w-[90px]" />
                  <col className="w-[200px]" />
                  <col className="w-[160px]" />
                </colgroup>
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Channel</th>
                    <th className="p-3 text-left text-sm font-medium">Recipient</th>
                    <th className="p-3 text-left text-sm font-medium">Message</th>
                    <th className="p-3 text-left text-sm font-medium">Sender</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                    <th className="p-3 text-left text-sm font-medium">Fail reason</th>
                    <th className="p-3 text-left text-sm font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.content?.map((log) => (
                    <tr key={log.id} className="border-t align-top">
                      <td className="p-3 text-sm">
                        <Badge variant="secondary">{log.channel}</Badge>
                      </td>
                      <td className="p-3 font-mono text-xs truncate" title={log.recipient}>
                        {log.recipient}
                      </td>
                      <td className="p-3 text-sm min-w-0">
                        {log.title && <div className="font-medium truncate" title={log.title}>{log.title}</div>}
                        {log.body && <div className="text-muted-foreground truncate" title={log.body}>{log.body}</div>}
                        {!log.title && !log.body && <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground truncate">{log.senderApp || '—'}</td>
                      <td className="p-3 text-sm">
                        <Badge variant={log.status === 'SUCCESS' ? 'default' : 'destructive'}>
                          {log.status === 'SUCCESS' ? 'Sent' : 'Failed'}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground break-words" title={log.error ?? undefined}>
                        {log.error ? <span className="line-clamp-2">{log.error}</span> : '—'}
                      </td>
                      <td className="p-3 text-sm whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data?.content?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">No notifications found</div>
              )}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {data.number + 1} of {data.totalPages} · {data.totalElements} total
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0 || isFetching} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= data.totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </AdminLayout>
  );
}
