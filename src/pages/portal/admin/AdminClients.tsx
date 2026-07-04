import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminShell from '@/components/portal/AdminShell';
import { Sym } from '@/components/portal/Sym';
import { manufacturingApi, projectApi } from '@/lib/api';

interface ClientRow {
  id: string;
  name: string;
  brand?: string;
  email: string;
  phone?: string;
  projects: number;
  projectCodes: string[];
  since?: string;
}

function formatSince(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function buildClients(
  projects: Awaited<ReturnType<typeof projectApi.list>>,
  inquiries: Awaited<ReturnType<typeof manufacturingApi.listInquiries>>,
): ClientRow[] {
  const map = new Map<string, ClientRow>();

  const upsert = (email: string, patch: Partial<ClientRow> & { projectCode?: string }) => {
    const key = email.trim().toLowerCase();
    if (!key) return;
    const existing = map.get(key);
    if (existing) {
      if (patch.name && (!existing.name || existing.name === key.split('@')[0])) existing.name = patch.name;
      if (patch.brand && !existing.brand) existing.brand = patch.brand;
      if (patch.phone && !existing.phone) existing.phone = patch.phone;
      if (patch.projectCode && !existing.projectCodes.includes(patch.projectCode)) {
        existing.projectCodes.push(patch.projectCode);
        existing.projects = existing.projectCodes.length;
      }
      if (patch.since && (!existing.since || new Date(patch.since) < new Date(existing.since))) {
        existing.since = patch.since;
      }
      return;
    }
    map.set(key, {
      id: key,
      name: patch.name || key.split('@')[0].replace(/[._]/g, ' '),
      brand: patch.brand,
      email: email.trim(),
      phone: patch.phone,
      projects: patch.projectCode ? 1 : 0,
      projectCodes: patch.projectCode ? [patch.projectCode] : [],
      since: patch.since,
    });
  };

  for (const p of projects) {
    if (!p.clientEmail) continue;
    upsert(p.clientEmail, {
      name: p.clientName || undefined,
      brand: p.brand,
      projectCode: p.code,
      since: p.createdAt,
    });
  }

  for (const inq of inquiries) {
    const email = inq.clientEmail || inq.accountEmail;
    if (!email) continue;
    upsert(email, {
      name: inq.clientName || inq.accountName,
      brand: inq.brand,
      phone: inq.clientPhone || inq.accountPhone,
      since: inq.createdAt,
    });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export default function PortalAdminClients() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<ClientRow | null>(null);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: () => projectApi.list(),
  });

  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: () => manufacturingApi.listInquiries(),
  });

  const clients = useMemo(() => buildClients(projects, inquiries), [projects, inquiries]);
  const isLoading = projectsLoading || inquiriesLoading;

  const shown = clients.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.brand || '').toLowerCase().includes(q.toLowerCase()) ||
      c.email.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AdminShell title="Clients">
      <div className="p-5 sm:p-8">
        <div className="flex items-center gap-2 border rounded-lg px-3 h-9 max-w-xs mb-5" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
          <Sym name="search" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[13px]" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Sym name="progress_activity" className="text-[32px] animate-spin" style={{ color: 'var(--p-primary)' }} />
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
            <Sym name="groups" className="text-[40px] opacity-40" />
            <p className="mt-2 text-[15px] font-semibold">No clients yet</p>
            <p className="text-[13px] mt-1">Clients appear here when inquiries are submitted or projects are created.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setOpen(c)}
                className="border rounded-xl p-5 text-left card-hover"
                style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold uppercase" style={{ background: 'var(--p-primary)' }}>
                    {c.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[15px] truncate capitalize">{c.name}</p>
                    <p className="text-[12px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>{c.brand || c.email}</p>
                  </div>
                </div>
                <div className="flex justify-between text-[13px]">
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-60" style={{ color: 'var(--p-on-surface-variant)' }}>Projects</p>
                    <p className="font-semibold">{c.projects}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase opacity-60" style={{ color: 'var(--p-on-surface-variant)' }}>Since</p>
                    <p className="font-semibold">{formatSince(c.since)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(null)}>
          <div className="w-full max-w-md rounded-xl" style={{ background: 'var(--p-surface-container-lowest)' }} onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b flex items-center gap-4" style={{ borderColor: 'var(--p-outline-variant)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[20px] font-bold uppercase" style={{ background: 'var(--p-primary)' }}>
                {open.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-[20px] truncate capitalize">{open.name}</h3>
                <p className="text-[13px] truncate" style={{ color: 'var(--p-on-surface-variant)' }}>
                  {open.brand ? `${open.brand} · ` : ''}since {formatSince(open.since)}
                </p>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {[
                ['Email', open.email, 'mail'],
                ['Phone', open.phone || '—', 'call'],
                ['Projects', String(open.projects), 'folder'],
              ].map(([k, v, icon]) => (
                <div key={k} className="flex items-center gap-3 text-[14px]">
                  <Sym name={icon} className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
                  <span className="flex-1" style={{ color: 'var(--p-on-surface-variant)' }}>{k}</span>
                  <span className="font-semibold truncate max-w-[200px]">{v}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button type="button" onClick={() => setOpen(null)} className="flex-1 px-4 py-2.5 rounded-lg text-[14px] font-semibold border" style={{ borderColor: 'var(--p-outline)' }}>
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const code = open.projectCodes[0];
                  if (code) navigate(`/portal-admin/projects/${encodeURIComponent(code)}`);
                  else setOpen(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg text-[14px] font-semibold text-white hover:brightness-110"
                style={{ background: 'var(--p-primary)' }}
              >
                {open.projectCodes[0] ? 'Open project' : 'No project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
