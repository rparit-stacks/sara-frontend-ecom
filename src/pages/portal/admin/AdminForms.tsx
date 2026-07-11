import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminShell, { AdminBtn } from '@/components/portal/AdminShell';
import { Pill } from '@/components/portal/Pill';
import { Sym } from '@/components/portal/Sym';
import { FORM_CATEGORIES } from '@/components/portal/formbuilder/registry';
import { manufacturingApi } from '@/lib/api';

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  published: { bg: 'var(--p-secondary-container)', fg: 'var(--p-on-secondary-container)' },
  draft: { bg: 'var(--p-surface-container-high)', fg: 'var(--p-on-surface-variant)' },
  archived: { bg: 'var(--p-error-container)', fg: 'var(--p-on-error-container)' },
};

function formatUpdated(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days}d ago`;
  return d.toLocaleDateString();
}

function normalizeStatus(status?: string): 'published' | 'draft' | 'archived' {
  const s = (status || 'DRAFT').toLowerCase();
  if (s === 'published') return 'published';
  if (s === 'archived') return 'archived';
  return 'draft';
}

export default function PortalAdminForms() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('All');
  const [status, setStatus] = useState<string>('All');
  const [menu, setMenu] = useState<string | null>(null);

  const { data: form, isLoading } = useQuery({
    queryKey: ['admin-inquiry-form'],
    queryFn: () => manufacturingApi.getInquiryForm(),
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: () => manufacturingApi.listInquiries(),
  });

  const forms = useMemo(() => {
    if (!form) return [];
    return [{
      id: String(form.id),
      name: form.name?.trim() || 'Manufacturing Inquiry',
      category: form.category || 'Inquiry',
      status: normalizeStatus(form.status),
      version: form.version ?? 1,
      purpose: form.purpose || 'INQUIRY',
      updatedAt: formatUpdated(form.updatedAt),
      submissions: inquiries.length,
    }];
  }, [form, inquiries.length]);

  const shown = forms.filter((f) =>
    (cat === 'All' || f.category === cat) &&
    (status === 'All' || f.status === status) &&
    (!q || f.name.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <AdminShell
      title="Forms"
      actions={
        <AdminBtn icon="edit" onClick={() => navigate('/portal-admin/inquiry-form')}>
          Edit inquiry form
        </AdminBtn>
      }
    >
      <div className="p-5 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-3 mb-5">
          <div className="flex items-center gap-2 border rounded-lg px-3 h-9 lg:max-w-xs flex-1" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
            <Sym name="search" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search forms…" className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[13px]" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['All', ...FORM_CATEGORIES].map((c) => (
              <button key={c} onClick={() => setCat(c)} className="px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap" style={c === cat ? { background: 'var(--p-primary)', color: '#fff' } : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}>{c}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {['All', 'published', 'draft', 'archived'].map((s) => (
              <button key={s} onClick={() => setStatus(s)} className="px-3 py-1.5 rounded-full text-[12px] font-semibold capitalize whitespace-nowrap" style={s === status ? { background: 'var(--p-on-surface)', color: '#fff' } : { border: '1px solid var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>{s}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Sym name="progress_activity" className="text-[32px] animate-spin" style={{ color: 'var(--p-primary)' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((f) => (
              <div key={f.id} className="border rounded-xl p-5 relative" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,103,106,0.1)', color: 'var(--p-primary)' }}>
                    <Sym name="dynamic_form" className="text-[22px]" />
                  </div>
                  <div className="relative">
                    <button onClick={() => setMenu(menu === f.id ? null : f.id)} className="p-1 rounded hover:bg-black/5">
                      <Sym name="more_vert" style={{ color: 'var(--p-on-surface-variant)' }} />
                    </button>
                    {menu === f.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />
                        <div className="absolute right-0 top-8 w-44 border rounded-lg py-1 z-20 shadow-lg" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
                          {[
                            { i: 'edit', l: 'Edit', a: () => navigate('/portal-admin/inquiry-form') },
                            { i: 'visibility', l: 'Preview', a: () => window.open('/inquiry', '_blank') },
                            { i: 'inbox', l: 'View submissions', a: () => navigate('/portal-admin/inquiries') },
                          ].map((m) => (
                            <button key={m.l} onClick={() => { setMenu(null); m.a(); }} className="w-full text-left px-3 py-1.5 text-[13px] flex items-center gap-2 hover:bg-black/5" style={{ color: 'var(--p-on-surface)' }}>
                              <Sym name={m.i} className="text-[16px]" /> {m.l}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button onClick={() => navigate('/portal-admin/inquiry-form')} className="text-left w-full">
                  <h3 className="font-bold text-[15px] mb-1">{f.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Pill label={f.status} tone={STATUS_TONE[f.status]} />
                    <span className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>{f.category} · v{f.version}</span>
                  </div>
                  <p className="text-[12px] mb-3" style={{ color: 'var(--p-on-surface-variant)' }}>
                    Public manufacturing inquiry form — used on the /inquiry page.
                  </p>
                  <div className="flex items-center gap-4 text-[12px] pt-3 border-t" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
                    <span className="flex items-center gap-1">
                      <Sym name="task_alt" className="text-[14px]" />
                      {f.submissions} submission{f.submissions === 1 ? '' : 's'}
                    </span>
                    <span className="ml-auto">{f.updatedAt}</span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        {!isLoading && shown.length === 0 && (
          <div className="text-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="dynamic_form" className="text-[40px] opacity-40" />
            <p className="mt-2 text-[14px] font-semibold">No forms found</p>
            <p className="text-[13px] mt-1">Set up your inquiry form to start collecting manufacturing requests.</p>
            <button
              type="button"
              onClick={() => navigate('/portal-admin/inquiry-form')}
              className="mt-4 px-4 py-2 rounded-lg text-[13px] font-semibold text-white"
              style={{ background: 'var(--p-primary)' }}
            >
              Open inquiry form editor
            </button>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
