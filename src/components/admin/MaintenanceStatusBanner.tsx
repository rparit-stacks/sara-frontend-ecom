import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWrench, faServer, faScrewdriverWrench, faRocket, faArrowTrendUp,
  faListCheck, faPlus, faTrash, faXmark, faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { maintenanceLogApi, type MaintenanceLogDto } from '@/lib/api';

// Free maintenance window: today (4 Jul 2026) → 4 Sep 2026.
const START = new Date('2026-07-04T00:00:00+05:30');
const END = new Date('2026-09-04T23:59:59+05:30');

const CATEGORY: Record<string, { label: string; icon: typeof faWrench; color: string; bg: string }> = {
  CRASH: { label: 'Server crash', icon: faServer, color: '#b42318', bg: 'rgba(180,35,24,.1)' },
  FIX: { label: 'Fix', icon: faScrewdriverWrench, color: '#175cd3', bg: 'rgba(23,92,211,.1)' },
  IMPROVEMENT: { label: 'Improvement', icon: faArrowTrendUp, color: '#067647', bg: 'rgba(6,118,71,.1)' },
  DEPLOY: { label: 'Deploy', icon: faRocket, color: '#6941c6', bg: 'rgba(105,65,198,.1)' },
  OTHER: { label: 'Note', icon: faWrench, color: '#667085', bg: 'rgba(102,112,133,.1)' },
};

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, done: diff === 0 };
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function MaintenanceStatusBanner() {
  const cd = useCountdown(END);
  const [logOpen, setLogOpen] = useState(false);

  const startLabel = START.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const endLabel = END.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="mb-6">
      {/* Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-7 text-white"
        style={{ background: 'linear-gradient(135deg,#924623 0%,#b5602f 55%,#c9743b 100%)' }}
      >
        <div className="absolute -right-8 -top-8 opacity-10">
          <FontAwesomeIcon icon={faWrench} className="text-[140px]" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <span className="text-[12px] font-bold uppercase tracking-widest opacity-90">Free maintenance is going on</span>
          </div>
          <h2 className="text-[22px] sm:text-[26px] font-bold leading-tight">
            Your store is under free maintenance & support
          </h2>
          <p className="text-[13px] sm:text-[14px] opacity-90 mt-1.5">
            From <b>{startLabel}</b> to <b>{endLabel}</b> — bug fixes, crash recovery, performance & security, all covered at no cost.
          </p>

          {/* Countdown */}
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            {cd.done ? (
              <span className="text-[15px] font-semibold">Maintenance window has ended.</span>
            ) : (
              [
                { v: cd.days, l: 'Days' },
                { v: cd.hours, l: 'Hours' },
                { v: cd.mins, l: 'Min' },
                { v: cd.secs, l: 'Sec' },
              ].map((u) => (
                <div key={u.l} className="rounded-xl bg-white/15 backdrop-blur px-4 py-2.5 min-w-[68px] text-center">
                  <div className="text-[26px] font-bold leading-none tabular-nums">{String(u.v).padStart(2, '0')}</div>
                  <div className="text-[10px] uppercase tracking-wider opacity-80 mt-1">{u.l}</div>
                </div>
              ))
            )}
            <span className="text-[12px] opacity-80">left in the free maintenance period</span>
          </div>

          <button
            onClick={() => setLogOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white text-[#924623] px-4 py-2.5 text-[13px] font-bold hover:bg-white/90 transition-colors"
          >
            <FontAwesomeIcon icon={faListCheck} /> What we've done in maintenance
          </button>
        </div>
      </div>

      {logOpen && <MaintenanceLogModal onClose={() => setLogOpen(false)} />}
    </div>
  );
}

function MaintenanceLogModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', detail: '', category: 'FIX', occurredAt: '' });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['maintenance-logs'],
    queryFn: () => maintenanceLogApi.list(),
  });

  const createMut = useMutation({
    mutationFn: () =>
      maintenanceLogApi.create({
        title: form.title,
        detail: form.detail || undefined,
        category: form.category,
        occurredAt: form.occurredAt ? new Date(form.occurredAt).toISOString().slice(0, 19) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-logs'] });
      setForm({ title: '', detail: '', category: 'FIX', occurredAt: '' });
      setAdding(false);
      toast.success('Log entry added');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to add'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => maintenanceLogApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-logs'] });
      toast.success('Removed');
    },
  });

  const crashes = logs.filter((l) => l.category === 'CRASH').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faListCheck} className="text-[#924623]" /> Maintenance log
            </h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
              {crashes > 0 && <> · <span className="text-red-600 font-semibold">{crashes} crash{crashes !== 1 ? 'es' : ''} resolved</span></>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdding((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#924623] text-white px-3 py-1.5 text-[13px] font-semibold hover:bg-[#7d3c1e]"
            >
              <FontAwesomeIcon icon={faPlus} /> Add entry
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>

        {/* add form */}
        {adding && (
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title (e.g. Server crash resolved)"
                className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-[14px] outline-none focus:border-[#924623]"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 text-[14px] outline-none focus:border-[#924623] bg-white"
              >
                {Object.entries(CATEGORY).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={form.occurredAt}
                onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 text-[14px] outline-none focus:border-[#924623]"
              />
              <textarea
                value={form.detail}
                onChange={(e) => setForm({ ...form, detail: e.target.value })}
                placeholder="Details (what happened + how it was solved)"
                rows={2}
                className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-[14px] outline-none focus:border-[#924623]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-[13px] text-gray-600 hover:bg-gray-100">Cancel</button>
              <button
                onClick={() => form.title.trim() ? createMut.mutate() : toast.error('Enter a title')}
                disabled={createMut.isPending}
                className="px-4 py-1.5 rounded-lg bg-[#924623] text-white text-[13px] font-semibold disabled:opacity-50"
              >
                {createMut.isPending ? 'Saving…' : 'Save entry'}
              </button>
            </div>
          </div>
        )}

        {/* timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FontAwesomeIcon icon={faCircleCheck} className="text-[36px] mb-2" />
              <p className="text-sm">No maintenance activity logged yet.</p>
              <p className="text-[12px]">Click “Add entry” to record what was done (crashes fixed, improvements, deploys…).</p>
            </div>
          ) : (
            <ol className="relative border-l-2 border-gray-100 ml-2 space-y-5">
              {logs.map((l) => {
                const c = CATEGORY[l.category] || CATEGORY.OTHER;
                return (
                  <li key={l.id} className="ml-5 group">
                    <span
                      className="absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full"
                      style={{ background: c.bg, color: c.color }}
                    >
                      <FontAwesomeIcon icon={c.icon} className="text-[10px]" />
                    </span>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: c.bg, color: c.color }}>{c.label}</span>
                          <span className="text-[11px] text-gray-400">{fmt(l.occurredAt)}</span>
                        </div>
                        <p className="text-[14px] font-semibold text-gray-900 mt-1">{l.title}</p>
                        {l.detail && <p className="text-[13px] text-gray-600 mt-0.5 whitespace-pre-wrap">{l.detail}</p>}
                      </div>
                      <button
                        onClick={() => confirm('Delete this entry?') && deleteMut.mutate(l.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 shrink-0"
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-[13px]" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
