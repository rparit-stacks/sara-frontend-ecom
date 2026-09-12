import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { acquireStomp, releaseStomp, subscribeTopic } from '@/lib/stompClient';

type AdminActivityPayload = {
  projectCode?: string;
  projectTitle?: string;
  designId?: number;
  customerEmail?: string;
  customerName?: string;
  preview?: string;
  isGeneralChat?: boolean;
};

/**
 * Global "new customer message" toast, live across the whole admin portal — not just while
 * viewing that project's own chat page. Subscribes once (mounted from AdminShell, so every
 * admin screen gets it) to /topic/admin/activity, the fan-out ProjectMessagingService /
 * CustomerChatService publish on every CLIENT message (see
 * ProjectRealtimeBroadcaster#publishAdminActivity).
 *
 * Clicking the toast deep-links straight into that conversation — a project's design channel,
 * or General Chat for a customer with no single project. This is deliberately separate from
 * the "Your Tasks"/"Pending Requests" panel (TasksAndRequestsPanel): that's for explicit
 * human-help requests; this is ambient awareness of ALL chat activity, admin- or AI-handled.
 */
export function useAdminActivityToast() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const client = acquireStomp('admin');
    const unsubscribe = subscribeTopic(client, '/topic/admin/activity', (frame) => {
      let data: AdminActivityPayload | null = null;
      try {
        const parsed = JSON.parse(frame.body) as { event?: string; data?: unknown };
        if (parsed.event !== 'message') return;
        data = (parsed.data ?? null) as AdminActivityPayload | null;
      } catch {
        return;
      }
      if (!data) return;

      const who = data.customerName || data.customerEmail || 'A customer';
      const where = data.isGeneralChat ? 'General Chat' : data.projectTitle || data.projectCode || 'a project';
      const destination = data.isGeneralChat
        ? `/portal-admin/workspace-preview?customer=${encodeURIComponent(data.customerEmail || '')}&tab=general`
        : `/portal-admin/workspace-preview?project=${encodeURIComponent(data.projectCode || '')}`;

      toast(`${who} — ${where}`, {
        description: data.preview || 'New message',
        duration: 10_000,
        action: {
          label: 'Open',
          onClick: () => navigate(destination),
        },
      });
    });

    return () => {
      unsubscribe();
      releaseStomp();
    };
    // Subscribed once for the lifetime of the admin portal shell — no deps that should
    // re-trigger it (navigate is stable from react-router).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
