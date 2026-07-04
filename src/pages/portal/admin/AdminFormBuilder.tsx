import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Sym } from '@/components/portal/Sym';
import { Pill } from '@/components/portal/Pill';
import FieldRenderer from '@/components/portal/formbuilder/FieldRenderer';
import FieldSettings from '@/components/portal/formbuilder/FieldSettings';
import { PALETTE, makeField, isDisplay, isLayout } from '@/components/portal/formbuilder/registry';
import { FormField, FieldType } from '@/components/portal/formbuilder/types';
import '@/pages/portal/portal.css';

type Tab = 'build' | 'logic' | 'steps' | 'settings' | 'workflow' | 'notifications' | 'permissions' | 'preview' | 'responses' | 'analytics';
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'build', label: 'Build', icon: 'dashboard_customize' },
  { key: 'logic', label: 'Logic', icon: 'account_tree' },
  { key: 'steps', label: 'Steps', icon: 'linear_scale' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
  { key: 'workflow', label: 'Workflow', icon: 'conveyor_belt' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications' },
  { key: 'permissions', label: 'Permissions', icon: 'lock' },
  { key: 'preview', label: 'Preview', icon: 'visibility' },
  { key: 'responses', label: 'Responses', icon: 'table_rows' },
  { key: 'analytics', label: 'Analytics', icon: 'bar_chart' },
];

const WIDTH_CLASS: Record<string, string> = { '25': 'w-full sm:w-[calc(25%-9px)]', '50': 'w-full sm:w-[calc(50%-6px)]', '75': 'w-full sm:w-[calc(75%-3px)]', '100': 'w-full' };

export default function PortalAdminFormBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sp] = useSearchParams();
  const isNew = !id || id === 'new';

  const [name, setName] = useState(isNew ? 'Untitled form' : 'Manufacturing Inquiry');
  const [tab, setTab] = useState<Tab>((sp.get('tab') as Tab) || 'build');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragType, setDragType] = useState<FieldType | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false); // palette collapse
  const [steps, setSteps] = useState([{ id: 's1', title: 'Page 1' }]);

  const sel = fields.find((f) => f.id === selected) || null;
  const patch = (p: Partial<FormField>) => setFields((xs) => xs.map((f) => (f.id === selected ? { ...f, ...p } : f)));

  const addField = (type: FieldType, at?: number) => {
    const nf = makeField(type);
    setFields((xs) => {
      const next = [...xs];
      next.splice(at ?? xs.length, 0, nf);
      return next;
    });
    setSelected(nf.id);
  };

  const removeField = (fid: string) => { setFields((xs) => xs.filter((f) => f.id !== fid)); if (selected === fid) setSelected(null); };
  const dupField = (fid: string) => setFields((xs) => { const i = xs.findIndex((f) => f.id === fid); if (i < 0) return xs; const copy = { ...xs[i], id: `${xs[i].id}_c${Date.now() % 1000}`, key: `${xs[i].key}_copy` }; const n = [...xs]; n.splice(i + 1, 0, copy); return n; });
  const move = (from: number, to: number) => setFields((xs) => { const n = [...xs]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n; });

  return (
    <div className="portal-root">
      {/* top bar */}
      <header className="h-12 flex items-center justify-between px-4 shrink-0 z-40 gap-3" style={{ background: 'var(--p-primary)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => navigate('/portal-admin/forms')} className="msym text-white/80 hover:text-white">arrow_back</button>
          <input value={name} onChange={(e) => setName(e.target.value)} className="bg-transparent border-none outline-none text-white font-semibold text-[15px] min-w-0 max-w-[40vw]" />
          <Pill label="Draft" tone={{ bg: 'rgba(255,255,255,0.2)', fg: '#fff' }} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab('preview')} className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white/90 border border-white/30 hover:bg-white/10 flex items-center gap-1.5"><span className="msym text-[16px]">visibility</span><span className="hidden sm:inline">Preview</span></button>
          <button className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-white hover:bg-white/90 flex items-center gap-1.5" style={{ color: 'var(--p-primary)' }}><span className="msym text-[16px]">save</span><span className="hidden sm:inline">Save</span></button>
          <button className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border border-white/30 text-white hover:bg-white/10 hidden sm:flex items-center gap-1.5"><span className="msym text-[16px]">publish</span>Publish</button>
        </div>
      </header>

      {/* tabs */}
      <div className="border-b flex items-center gap-1 px-2 overflow-x-auto shrink-0" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="px-3 py-2.5 text-[13px] font-semibold flex items-center gap-1.5 border-b-2 -mb-px whitespace-nowrap" style={t.key === tab ? { borderColor: 'var(--p-primary)', color: 'var(--p-primary)' } : { borderColor: 'transparent', color: 'var(--p-on-surface-variant)' }}>
            <Sym name={t.icon} className="text-[16px]" /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {tab === 'build' && (
          <>
            {/* palette */}
            <aside className={`${collapsed ? 'w-12' : 'w-56'} border-r flex flex-col shrink-0 transition-[width] hidden md:flex`} style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
              <button onClick={() => setCollapsed((c) => !c)} className="h-10 flex items-center justify-center border-b shrink-0" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
                <Sym name={collapsed ? 'chevron_right' : 'chevron_left'} />
              </button>
              <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {PALETTE.map((g) => (
                  <div key={g.group}>
                    {!collapsed && <p className="px-1 mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{g.group}</p>}
                    <div className={collapsed ? 'space-y-1' : 'grid grid-cols-2 gap-1'}>
                      {g.items.map((it) => (
                        <button
                          key={it.type}
                          draggable
                          onDragStart={() => setDragType(it.type)}
                          onDragEnd={() => setDragType(null)}
                          onClick={() => addField(it.type)}
                          title={it.label}
                          className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-center hover:border-current transition-colors cursor-grab"
                          style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}
                        >
                          <Sym name={it.icon} className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
                          {!collapsed && <span className="text-[10px] leading-tight">{it.label}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* canvas */}
            <main
              className="flex-1 overflow-y-auto p-4 sm:p-8"
              style={{ background: 'var(--p-surface-container-lowest)' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragType) { addField(dragType); setDragType(null); } }}
            >
              <div className="max-w-2xl mx-auto">
                <div className="border rounded-xl p-5 sm:p-8 min-h-[60vh]" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
                  {fields.length === 0 ? (
                    <div className="h-72 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
                      <Sym name="drag_pan" className="text-[40px]" />
                      <p className="mt-2 text-[14px] font-semibold">Drag fields here</p>
                      <p className="text-[12px]">or click a field in the palette</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {fields.map((f, i) => (
                        <div
                          key={f.id}
                          draggable
                          onDragStart={() => setDragIndex(i)}
                          onDragOver={(e) => { e.preventDefault(); }}
                          onDrop={(e) => { e.preventDefault(); if (dragIndex !== null && dragIndex !== i) move(dragIndex, i); setDragIndex(null); }}
                          onClick={() => setSelected(f.id)}
                          className={`${WIDTH_CLASS[f.width]} group relative rounded-lg border-2 p-3 cursor-pointer transition-all`}
                          style={{ borderColor: selected === f.id ? 'var(--p-primary)' : 'transparent', background: selected === f.id ? 'rgba(146,70,35,0.04)' : 'transparent' }}
                        >
                          <div className="pointer-events-none">
                            <FieldRenderer field={f} />
                          </div>
                          {/* hover toolbar */}
                          <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 border rounded-lg px-1 py-0.5 shadow-sm" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
                            <span className="msym text-[16px] cursor-grab p-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>drag_indicator</span>
                            <button onClick={(e) => { e.stopPropagation(); dupField(f.id); }} className="p-0.5 hover:bg-black/5 rounded"><Sym name="content_copy" className="text-[15px]" style={{ color: 'var(--p-on-surface-variant)' }} /></button>
                            <button onClick={(e) => { e.stopPropagation(); removeField(f.id); }} className="p-0.5 hover:bg-black/5 rounded"><Sym name="delete" className="text-[15px]" style={{ color: 'var(--p-error)' }} /></button>
                          </div>
                          {f.required && <span className="absolute top-1 left-2 text-[9px] font-bold" style={{ color: 'var(--p-error)' }}>required</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </main>

            {/* settings */}
            <aside className="w-80 border-l shrink-0 hidden lg:block" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
              {sel ? (
                <FieldSettings field={sel} allFields={fields} onChange={patch} onClose={() => setSelected(null)} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center" style={{ color: 'var(--p-on-surface-variant)' }}>
                  <Sym name="tune" className="text-[36px]" />
                  <p className="mt-2 text-[13px]">Select a field to edit its label, validation, conditional logic & more.</p>
                </div>
              )}
            </aside>
          </>
        )}

        {tab === 'preview' && <PreviewTab fields={fields} name={name} />}
        {tab === 'logic' && <LogicTab fields={fields} />}
        {tab === 'steps' && <StepsTab steps={steps} setSteps={setSteps} />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'workflow' && <WorkflowTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'permissions' && <PermissionsTab />}
        {tab === 'responses' && <ResponsesTab fields={fields} />}
        {tab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  );
}

/* ---------------- sub-tabs ---------------- */

const card = 'border rounded-xl p-5';
const cardStyle = { borderColor: 'var(--p-outline-variant)' } as React.CSSProperties;
const Wrap = ({ children }: { children: React.ReactNode }) => <div className="flex-1 overflow-y-auto p-5 sm:p-8" style={{ background: 'var(--p-surface-container-lowest)' }}><div className="max-w-3xl mx-auto space-y-5">{children}</div></div>;

function PreviewTab({ fields, name }: { fields: FormField[]; name: string }) {
  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-8" style={{ background: 'var(--p-surface-container)' }}>
      <div className="max-w-2xl mx-auto border rounded-xl p-6 sm:p-8" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}>
        <h1 className="font-display text-[28px] mb-6">{name}</h1>
        {fields.length === 0 ? <p className="text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>Add fields in the Build tab to preview them here.</p> : (
          <div className="flex flex-wrap gap-4">
            {fields.map((f) => <div key={f.id} className={WIDTH_CLASS[f.width]}><FieldRenderer field={f} /></div>)}
            <button className="mt-2 px-6 py-2.5 rounded-lg text-[14px] font-semibold text-white" style={{ background: 'var(--p-primary)' }}>Submit</button>
          </div>
        )}
      </div>
    </div>
  );
}

function LogicTab({ fields }: { fields: FormField[] }) {
  const withLogic = fields.filter((f) => f.conditional?.enabled || f.calculation);
  return (
    <Wrap>
      <h2 className="font-display text-[20px]">Logic & calculations</h2>
      <p className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>Conditional rules and formulas are set per-field in the Build tab. This is the overview.</p>
      {withLogic.length === 0 ? <div className={card} style={cardStyle}><p className="text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>No logic yet. Select a field → enable “Conditional logic” or add a “Calculated value”.</p></div> : withLogic.map((f) => (
        <div key={f.id} className={card} style={cardStyle}>
          <p className="font-bold text-[14px] mb-1">{f.label}</p>
          {f.conditional?.enabled && <p className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}><b style={{ color: 'var(--p-primary)' }}>{f.conditional.action}</b> if {f.conditional.match} of {f.conditional.conditions.length} condition(s)</p>}
          {f.calculation && <p className="text-[13px] mt-1">= <code>{f.calculation}</code></p>}
        </div>
      ))}
    </Wrap>
  );
}

function StepsTab({ steps, setSteps }: { steps: { id: string; title: string }[]; setSteps: (s: any) => void }) {
  return (
    <Wrap>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px]">Multi-step pages</h2>
        <button onClick={() => setSteps([...steps, { id: `s${steps.length + 1}`, title: `Page ${steps.length + 1}` }])} className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white flex items-center gap-1" style={{ background: 'var(--p-primary)' }}><Sym name="add" className="text-[16px]" /> Add page</button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        {steps.map((s, i) => (<div key={s.id} className="flex items-center gap-2"><div className="px-3 py-1.5 rounded-full text-[12px] font-bold" style={{ background: 'var(--p-primary)', color: '#fff' }}>{i + 1}</div>{i < steps.length - 1 && <div className="w-6 h-px" style={{ background: 'var(--p-outline-variant)' }} />}</div>))}
      </div>
      {steps.map((s, i) => (
        <div key={s.id} className={`${card} flex items-center gap-3`} style={cardStyle}>
          <span className="font-bold text-[13px] w-6">{i + 1}</span>
          <input value={s.title} onChange={(e) => { const n = [...steps]; n[i] = { ...s, title: e.target.value }; setSteps(n); }} className="flex-1 px-2 py-1.5 rounded border text-[13px] bg-transparent" style={cardStyle} />
          {steps.length > 1 && <button onClick={() => setSteps(steps.filter((_, j) => j !== i))}><Sym name="delete" style={{ color: 'var(--p-error)' }} /></button>}
        </div>
      ))}
      <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" defaultChecked style={{ accentColor: 'var(--p-primary)' }} /> Show progress bar</label>
      <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" defaultChecked style={{ accentColor: 'var(--p-primary)' }} /> Allow “Save draft & resume later”</label>
    </Wrap>
  );
}

function SettingsTab() {
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <div><label className="text-[12px] font-semibold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>{label}</label>{children}</div>;
  const inp = 'w-full mt-1 px-3 py-2 rounded-lg border outline-none text-[14px] bg-transparent';
  return (
    <Wrap>
      <h2 className="font-display text-[20px]">Form settings</h2>
      <div className={card + ' space-y-4'} style={cardStyle}>
        <Field label="Description"><textarea rows={2} className={`${inp} resize-none`} style={cardStyle} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Logo URL"><input className={inp} style={cardStyle} /></Field>
          <Field label="Banner URL"><input className={inp} style={cardStyle} /></Field>
        </div>
        <Field label="Theme color"><input type="color" defaultValue="#924623" className="mt-1 w-12 h-9 rounded border" style={cardStyle} /></Field>
      </div>
      <div className={card + ' space-y-3'} style={cardStyle}>
        <p className="font-bold text-[14px]">Access</p>
        {['Public', 'Private', 'Password protected', 'Login required'].map((x) => <label key={x} className="flex items-center gap-2 text-[14px]"><input type="checkbox" style={{ accentColor: 'var(--p-primary)' }} /> {x}</label>)}
      </div>
      <div className={card + ' grid grid-cols-2 gap-4'} style={cardStyle}>
        <Field label="Start date"><input type="date" className={inp} style={cardStyle} /></Field>
        <Field label="End date"><input type="date" className={inp} style={cardStyle} /></Field>
        <Field label="Submission limit"><input type="number" className={inp} style={cardStyle} /></Field>
        <Field label="Redirect URL"><input className={inp} style={cardStyle} /></Field>
        <div className="col-span-2"><Field label="Success message"><input defaultValue="Thanks! We’ll be in touch." className={inp} style={cardStyle} /></Field></div>
      </div>
      <div className={card + ' space-y-3'} style={cardStyle}>
        <Field label="Custom CSS"><textarea rows={2} className={`${inp} resize-none font-mono text-[12px]`} style={cardStyle} /></Field>
        <Field label="Custom JS"><textarea rows={2} className={`${inp} resize-none font-mono text-[12px]`} style={cardStyle} /></Field>
      </div>
    </Wrap>
  );
}

function WorkflowTab() {
  const stages = [{ n: 'Submitted', c: 'var(--p-surface-container-high)' }, { n: 'Pending Review', c: 'var(--p-primary-fixed)' }, { n: 'Approved', c: 'var(--p-secondary-container)' }, { n: 'Completed', c: 'var(--p-secondary-container)' }, { n: 'Rejected', c: 'var(--p-error-container)' }];
  return (
    <Wrap>
      <div className="flex items-center justify-between"><h2 className="font-display text-[20px]">Workflow</h2><button className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white flex items-center gap-1" style={{ background: 'var(--p-primary)' }}><Sym name="add" className="text-[16px]" /> Add stage</button></div>
      <div className="flex flex-wrap items-center gap-2">
        {stages.map((s, i) => (<div key={s.n} className="flex items-center gap-2"><div className="px-4 py-2 rounded-lg text-[13px] font-bold" style={{ background: s.c }}>{s.n}</div>{i < stages.length - 1 && <Sym name="arrow_forward" style={{ color: 'var(--p-on-surface-variant)' }} />}</div>))}
      </div>
      <div className={card} style={cardStyle}><p className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>Drag stages to reorder. Each submission moves through these stages; approvers get notified at “Pending Review”.</p></div>
    </Wrap>
  );
}

function NotificationsTab() {
  const ch = [{ i: 'mail', l: 'Email' }, { i: 'sms', l: 'SMS' }, { i: 'chat', l: 'WhatsApp' }, { i: 'notifications', l: 'Push' }, { i: 'webhook', l: 'Webhook' }];
  return (
    <Wrap>
      <h2 className="font-display text-[20px]">Notifications on submission</h2>
      {ch.map((c) => (
        <div key={c.l} className={card + ' flex items-center justify-between'} style={cardStyle}>
          <span className="flex items-center gap-3 text-[14px] font-semibold"><Sym name={c.i} style={{ color: 'var(--p-primary)' }} /> {c.l}</span>
          <input type="checkbox" style={{ accentColor: 'var(--p-primary)' }} />
        </div>
      ))}
      <div className={card} style={cardStyle}>
        <p className="font-bold text-[14px] mb-2">Template</p>
        <textarea rows={3} defaultValue={'Hi {{name}},\nWe received your submission {{application_id}}. Thank you!'} className="w-full px-3 py-2 rounded-lg border outline-none text-[13px] font-mono resize-none bg-transparent" style={cardStyle} />
        <p className="text-[11px] mt-2" style={{ color: 'var(--p-on-surface-variant)' }}>Placeholders: {'{{name}}'} {'{{email}}'} {'{{application_id}}'}</p>
      </div>
    </Wrap>
  );
}

function PermissionsTab() {
  const roles = ['Admin', 'Manager', 'Client', 'Viewer'];
  const perms = ['View', 'Fill', 'Edit', 'Delete', 'Approve'];
  return (
    <Wrap>
      <h2 className="font-display text-[20px]">Permissions</h2>
      <div className="border rounded-xl overflow-hidden overflow-x-auto" style={cardStyle}>
        <table className="w-full text-left border-collapse min-w-[480px]">
          <thead><tr style={{ background: 'var(--p-surface-container-low)' }}><th className="px-4 py-3 text-[11px] font-bold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>Role</th>{perms.map((p) => <th key={p} className="px-4 py-3 text-[11px] font-bold uppercase text-center" style={{ color: 'var(--p-on-surface-variant)' }}>{p}</th>)}</tr></thead>
          <tbody>{roles.map((r, i) => (<tr key={r} style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}><td className="px-4 py-3 font-semibold text-[13px]">{r}</td>{perms.map((p) => <td key={p} className="px-4 py-3 text-center"><input type="checkbox" defaultChecked={r === 'Admin' || (r === 'Client' && (p === 'Fill' || p === 'View'))} style={{ accentColor: 'var(--p-primary)' }} /></td>)}</tr>))}</tbody>
        </table>
      </div>
    </Wrap>
  );
}

function ResponsesTab({ fields }: { fields: FormField[] }) {
  const cols = fields.filter((f) => !isDisplay(f.type) && !isLayout(f.type)).slice(0, 4);
  const rows = [
    { id: 'R-001', when: '2h ago', status: 'Approved' },
    { id: 'R-002', when: '5h ago', status: 'Pending Review' },
    { id: 'R-003', when: '1d ago', status: 'Submitted' },
  ];
  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-8" style={{ background: 'var(--p-surface-container-lowest)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-[20px]">Responses</h2>
        <div className="flex gap-2">
          {[['file_download', 'CSV'], ['table_view', 'Excel'], ['picture_as_pdf', 'PDF']].map(([i, l]) => <button key={l} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border flex items-center gap-1" style={cardStyle}><Sym name={i} className="text-[16px]" /> {l}</button>)}
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="flex items-center gap-2 border rounded-lg px-3 h-9 max-w-xs flex-1" style={cardStyle}><Sym name="search" className="text-[18px]" style={{ color: 'var(--p-on-surface-variant)' }} /><input placeholder="Search responses…" className="flex-1 bg-transparent outline-none text-[13px]" /></div>
        <button className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border" style={cardStyle}>Bulk approve</button>
        <button className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border" style={{ ...cardStyle, color: 'var(--p-error)' }}>Bulk delete</button>
      </div>
      <div className="border rounded-xl overflow-hidden overflow-x-auto" style={cardStyle}>
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead><tr style={{ background: 'var(--p-surface-container-low)' }}><th className="px-4 py-3"><input type="checkbox" style={{ accentColor: 'var(--p-primary)' }} /></th><th className="px-4 py-3 text-[11px] font-bold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>ID</th>{cols.map((c) => <th key={c.id} className="px-4 py-3 text-[11px] font-bold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>{c.label}</th>)}<th className="px-4 py-3 text-[11px] font-bold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>Status</th><th className="px-4 py-3 text-[11px] font-bold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>When</th></tr></thead>
          <tbody>{rows.map((r, i) => (<tr key={r.id} style={{ borderTop: i ? '1px solid var(--p-outline-variant)' : undefined }}><td className="px-4 py-3"><input type="checkbox" style={{ accentColor: 'var(--p-primary)' }} /></td><td className="px-4 py-3 font-semibold text-[13px]">{r.id}</td>{cols.map((c) => <td key={c.id} className="px-4 py-3 text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>—</td>)}<td className="px-4 py-3"><Pill label={r.status} /></td><td className="px-4 py-3 text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{r.when}</td></tr>))}</tbody>
        </table>
      </div>
      {cols.length === 0 && <p className="text-[13px] mt-3" style={{ color: 'var(--p-on-surface-variant)' }}>Add fields to see response columns.</p>}
    </div>
  );
}

function AnalyticsTab() {
  const stats = [['Total views', '1,240'], ['Starts', '410'], ['Submissions', '96'], ['Conversion', '23%'], ['Drop-off', '77%'], ['Avg. time', '2m 14s']];
  const devices = [['Mobile', 62], ['Desktop', 31], ['Tablet', 7]];
  return (
    <Wrap>
      <h2 className="font-display text-[20px]">Analytics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(([l, v]) => (<div key={l} className={card} style={cardStyle}><p className="text-[11px] font-bold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>{l}</p><p className="font-display text-[28px] mt-1" style={{ color: 'var(--p-primary)' }}>{v}</p></div>))}
      </div>
      <div className={card} style={cardStyle}>
        <p className="font-bold text-[14px] mb-3">Device breakdown</p>
        {devices.map(([l, n]) => (<div key={l as string} className="mb-2"><div className="flex justify-between text-[12px] mb-1"><span style={{ color: 'var(--p-on-surface-variant)' }}>{l}</span><span className="font-bold">{n}%</span></div><div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--p-surface-container-high)' }}><div className="h-full rounded-full" style={{ width: `${n}%`, background: 'var(--p-primary)' }} /></div></div>))}
      </div>
    </Wrap>
  );
}
