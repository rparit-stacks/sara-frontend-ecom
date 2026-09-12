import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sym } from '@/components/portal/Sym';
import { manufacturingApi, type ProjectAiHandoverDto } from '@/lib/api';
import { getStoredAdminUser, isSuperAdmin } from '@/lib/adminAccess';

/** "3h ago" / "2d ago" from an ISO timestamp — matches AdminDashboard's own formatUpdated. */
function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const REQUEST_TYPE_LABEL: Record<string, string> = {
  GENERAL: 'wants to talk to an Admin',
  CALL: 'wants a call',
  APPOINTMENT: 'wants to schedule an appointment',
};

function requestLine(h: ProjectAiHandoverDto): string {
  const who = h.customerName || h.clientEmail;
  const what = REQUEST_TYPE_LABEL[h.requestType || 'GENERAL'] || REQUEST_TYPE_LABEL.GENERAL;
  const where = h.projectTitle ? ` regarding ${h.projectTitle}` : ' in General Chat';
  return `${who} ${what}${where}`;
}

function destinationFor(h: ProjectAiHandoverDto): string {
  return h.projectCode
    ? `/portal-admin/workspace-preview?project=${encodeURIComponent(h.projectCode)}`
    : `/portal-admin/workspace-preview?customer=${encodeURIComponent(h.clientEmail)}&tab=general`;
}

/**
 * "Your Tasks" (this admin's assigned requests) + "Pending Requests" (nobody was available
 * when these were created — super-admin only, so someone can hand-assign once an admin comes
 * online). Sits at the very top of the dashboard, above the stat tiles, since an open human
 * -help request is the single most time-sensitive thing an admin should see first.
 *
 * Renders nothing (not even a header) when both lists are empty, so a quiet day doesn't add
 * visual clutter to the top of the dashboard.
 */
export default function TasksAndRequestsPanel() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const admin = getStoredAdminUser();
  const superAdmin = isSuperAdmin(admin);

  const { data: myTasks = [], isLoading: tasksLoading, isError: tasksErrored, error: tasksError, refetch: refetchTasks } = useQuery({
    queryKey: ['admin-my-tasks'],
    queryFn: () => manufacturingApi.myTasks(),
    refetchInterval: 30_000,
    // A failed fetch must not read the same as "no tasks" — React Query's `isLoading` goes
    // back to false on error, and `data` stays the destructured [] default, so without this
    // the panel silently vanished on any failed request (401, network blip, 500) exactly
    // like it had genuinely found zero tasks. retry:false so a real error surfaces promptly
    // instead of looking like an extended loading spinner for 3 retries first.
    retry: false,
  });

  const { data: pending = [], isLoading: pendingLoading, isError: pendingErrored, error: pendingError, refetch: refetchPending } = useQuery({
    queryKey: ['admin-pending-handover-requests'],
    queryFn: () => manufacturingApi.pendingHandoverRequests(),
    enabled: superAdmin,
    refetchInterval: 30_000,
    retry: false,
  });

  const claimPending = async (h: ProjectAiHandoverDto) => {
    if (!admin?.id) {
      toast.error('Could not identify your admin account.');
      return;
    }
    try {
      await manufacturingApi.assignHandoverRequest(h.id, admin.id);
      toast.success('Assigned to you.');
      void qc.invalidateQueries({ queryKey: ['admin-my-tasks'] });
      void qc.invalidateQueries({ queryKey: ['admin-pending-handover-requests'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not assign this request.');
    }
  };

  const loading = tasksLoading || (superAdmin && pendingLoading);
  const errored = tasksErrored || (superAdmin && pendingErrored);
  // Only actually hide the panel on a confirmed, error-free empty result — a failed fetch
  // must stay visible (as an error state below) rather than silently disappearing, which is
  // exactly what "the task loads and then vanishes" was: a request that failed read as "zero
  // tasks" because data defaults to [] on error too.
  if (!loading && !errored && myTasks.length === 0 && pending.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
      <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[15px]">Your Tasks</h3>
            <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>Customer requests assigned to you</p>
          </div>
          {myTasks.length > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: 'var(--p-primary-container)', color: 'var(--p-on-primary)' }}>
              {myTasks.length}
            </span>
          )}
        </div>
        {tasksLoading ? (
          <div className="px-5 pb-6"><Sym name="progress_activity" className="text-[20px] animate-spin opacity-50" /></div>
        ) : tasksErrored ? (
          <div className="px-5 pb-6">
            <p className="text-[13px]" style={{ color: 'var(--p-error, #b42318)' }}>
              Couldn't load your tasks{tasksError instanceof Error ? `: ${tasksError.message}` : '.'}
            </p>
            <button type="button" onClick={() => void refetchTasks()} className="text-[12px] font-semibold mt-1" style={{ color: 'var(--p-primary)' }}>
              Retry
            </button>
          </div>
        ) : myTasks.length === 0 ? (
          <div className="px-5 pb-6 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>Nothing needs your attention right now.</div>
        ) : (
          <div className="border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
            {myTasks.map((h, i) => (
              <button
                key={h.id}
                type="button"
                onClick={() => navigate(destinationFor(h))}
                className="w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-black/[0.02]"
                style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--p-primary-container)', color: 'var(--p-on-primary)' }}>
                  <Sym name="support_agent" className="text-[17px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px]">{requestLine(h)}</p>
                  {h.requirementSummary && (
                    <p className="text-[12px] mt-0.5 line-clamp-2" style={{ color: 'var(--p-on-surface-variant)' }}>{h.requirementSummary}</p>
                  )}
                  <p className="text-[11px] mt-1" style={{ color: 'var(--p-on-surface-variant)' }}>
                    {h.status === 'CLAIMED' ? 'Claimed by you' : 'Review request'}
                    {h.preferredTime ? ` · Preferred: ${h.preferredTime}` : ''}
                    {h.createdAt ? ` · ${timeAgo(h.createdAt)}` : ''}
                  </p>
                </div>
                <Sym name="chevron_right" className="text-[16px] shrink-0 mt-1" style={{ color: 'var(--p-on-surface-variant)' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {superAdmin && (
        <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[15px]">Pending Requests</h3>
              <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>Nobody was online when these came in</p>
            </div>
            {pending.length > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: 'var(--p-error-container)', color: 'var(--p-on-error-container)' }}>
                {pending.length}
              </span>
            )}
          </div>
          {pendingLoading ? (
            <div className="px-5 pb-6"><Sym name="progress_activity" className="text-[20px] animate-spin opacity-50" /></div>
          ) : pendingErrored ? (
            <div className="px-5 pb-6">
              <p className="text-[13px]" style={{ color: 'var(--p-error, #b42318)' }}>
                Couldn't load pending requests{pendingError instanceof Error ? `: ${pendingError.message}` : '.'}
              </p>
              <button type="button" onClick={() => void refetchPending()} className="text-[12px] font-semibold mt-1" style={{ color: 'var(--p-primary)' }}>
                Retry
              </button>
            </div>
          ) : pending.length === 0 ? (
            <div className="px-5 pb-6 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>None right now.</div>
          ) : (
            <div className="border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
              {pending.map((h, i) => (
                <div
                  key={h.id}
                  className="px-5 py-3.5 flex items-start gap-3"
                  style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--p-error-container)', color: 'var(--p-on-error-container)' }}>
                    <Sym name="schedule" className="text-[17px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px]">{requestLine(h)}</p>
                    {h.requirementSummary && (
                      <p className="text-[12px] mt-0.5 line-clamp-2" style={{ color: 'var(--p-on-surface-variant)' }}>{h.requirementSummary}</p>
                    )}
                    <p className="text-[11px] mt-1" style={{ color: 'var(--p-on-surface-variant)' }}>
                      {h.preferredTime ? `Preferred: ${h.preferredTime} · ` : ''}
                      {h.createdAt ? timeAgo(h.createdAt) : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void claimPending(h)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold shrink-0"
                    style={{ background: 'var(--p-primary)', color: 'var(--p-on-primary)' }}
                  >
                    Assign to me
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
