import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi, type AdminNotificationCounts } from '@/lib/api';

const QUERY_KEY = ['admin-notification-counts'];

/** Sidebar unread badge counts (Inquiries, Orders, Payment Links, Payment History), polled while an admin is logged in. */
export function useAdminNotificationCounts() {
  const { data } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => notificationApi.counts(),
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('adminToken'),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
  return (data ?? { inquiries: 0, orders: 0, paymentLinks: 0, paymentHistory: 0 }) as AdminNotificationCounts;
}

/** Marks a section read for the current admin and clears its badge immediately. */
export function useMarkNavRead(section: 'inquiries' | 'orders' | 'payment_links' | 'payment_history') {
  const qc = useQueryClient();
  return () => {
    notificationApi.markRead(section).then(() => qc.invalidateQueries({ queryKey: QUERY_KEY }));
  };
}
