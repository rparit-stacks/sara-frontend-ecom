import { Sym } from '../Sym';
import { FormField, FieldWidth, ConditionOp } from './types';
import { isSelection, isDisplay, isLayout } from './registry';
import { isLockedField } from '@/components/inquiry/systemFields';

const lbl = 'text-[11px] font-bold uppercase tracking-wide';
const lblStyle = { color: 'var(--p-on-surface-variant)' } as React.CSSProperties;
const inp = 'w-full mt-1 px-2.5 py-1.5 rounded-lg border outline-none text-[13px] bg-transparent';
const inpStyle = { borderColor: 'var(--p-outline-variant)' } as React.CSSProperties;

const WIDTHS: FieldWidth[] = ['25', '50', '75', '100'];
const OPS: { v: ConditionOp; l: string }[] = [
  { v: 'equals', l: '=' }, { v: 'not_equals', l: '≠' }, { v: 'contains', l: 'contains' },
  { v: 'greater_than', l: '>' }, { v: 'less_than', l: '<' }, { v: 'starts_with', l: 'starts' }, { v: 'ends_with', l: 'ends' },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className={lbl} style={lblStyle}>{label}</label>{children}</div>);
}
function Check({ label, checked, onChange }: { label: string; checked?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[13px] cursor-pointer">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: 'var(--p-primary)' }} /> {label}
    </label>
  );
}

/** Right-hand inspector for the selected field. Edits patch the field in place. */
export default function FieldSettings({
  field,
  allFields,
  onChange,
  onClose,
}: {
  field: FormField;
  allFields: FormField[];
  onChange: (patch: Partial<FormField>) => void;
  onClose: () => void;
}) {
  const v = field.validation || {};
  const locked = isLockedField(field);
  const c = field.conditional || { enabled: false, match: 'AND' as const, action: 'show' as const, conditions: [] };
  const setV = (patch: Partial<typeof v>) => onChange({ validation: { ...v, ...patch } });
  const setC = (patch: Partial<typeof c>) => onChange({ conditional: { ...c, ...patch } });

  return (
    <div className="w-full h-full flex flex-col">
      <div className="h-12 px-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <Sym name={field.icon || 'tune'} className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
          <h3 className="font-bold text-[14px] truncate">{field.label || 'Field'}</h3>
        </div>
        <button onClick={onClose} className="md:hidden"><Sym name="close" style={{ color: 'var(--p-on-surface-variant)' }} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {locked && (
          <div className="flex items-start gap-2 rounded-lg p-2.5 text-[12px]" style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}>
            <Sym name="lock" className="text-[16px] shrink-0 mt-0.5" style={{ color: 'var(--p-primary)' }} />
            <span>Required contact field. It's always collected and auto-filled into the quotation — the key & required flag can't be changed, and it can't be deleted. You can still edit its label and placeholder.</span>
          </div>
        )}
        {/* basics */}
        <div className="space-y-3">
          {isDisplay(field.type) && (field.type === 'heading' || field.type === 'paragraph') && (
            <Row label="Content"><textarea rows={2} value={field.content || ''} onChange={(e) => onChange({ content: e.target.value })} className={`${inp} resize-none`} style={inpStyle} /></Row>
          )}
          {!isDisplay(field.type) && (
            <>
              <Row label="Label"><input value={field.label} onChange={(e) => onChange({ label: e.target.value })} className={inp} style={inpStyle} /></Row>
              <Row label="Database key"><input value={field.key} disabled={locked} onChange={(e) => onChange({ key: e.target.value.replace(/\s+/g, '_').toLowerCase() })} className={`${inp} ${locked ? 'opacity-60 cursor-not-allowed' : ''}`} style={inpStyle} /></Row>
              <Row label="Placeholder"><input value={field.placeholder || ''} onChange={(e) => onChange({ placeholder: e.target.value })} className={inp} style={inpStyle} /></Row>
              <Row label="Description"><input value={field.description || ''} onChange={(e) => onChange({ description: e.target.value })} className={inp} style={inpStyle} /></Row>
              <Row label="Tooltip"><input value={field.tooltip || ''} onChange={(e) => onChange({ tooltip: e.target.value })} className={inp} style={inpStyle} /></Row>
              <Row label="Default value"><input value={field.defaultValue || ''} onChange={(e) => onChange({ defaultValue: e.target.value })} className={inp} style={inpStyle} /></Row>
            </>
          )}
          <Row label="Width">
            <div className="flex gap-1 mt-1">
              {WIDTHS.map((w) => (
                <button key={w} onClick={() => onChange({ width: w })} className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold" style={field.width === w ? { background: 'var(--p-primary)', color: '#fff' } : { border: '1px solid var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>{w}%</button>
              ))}
            </div>
          </Row>
        </div>

        {/* options for selection types */}
        {isSelection(field.type) && (
          <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <label className={lbl} style={lblStyle}>Options</label>
            {(field.options || []).map((o, i) => (
              <div key={i} className="flex gap-1 items-center">
                <input value={o.label} onChange={(e) => { const opts = [...(field.options || [])]; opts[i] = { ...o, label: e.target.value, value: e.target.value.replace(/\s+/g, '_').toLowerCase() }; onChange({ options: opts }); }} className={`${inp} mt-0`} style={inpStyle} />
                <button onClick={() => onChange({ options: (field.options || []).filter((_, j) => j !== i) })} className="p-1.5 rounded hover:bg-black/5"><Sym name="close" className="text-[16px]" style={{ color: 'var(--p-on-surface-variant)' }} /></button>
              </div>
            ))}
            <button onClick={() => onChange({ options: [...(field.options || []), { label: `Option ${(field.options?.length || 0) + 1}`, value: `opt${(field.options?.length || 0) + 1}` }] })} className="text-[12px] font-bold flex items-center gap-1" style={{ color: 'var(--p-primary)' }}><Sym name="add" className="text-[15px]" /> Add option</button>
            {/* dynamic data source */}
            <Row label="Data source">
              <select value={field.dataSource?.kind || 'static'} onChange={(e) => onChange({ dataSource: { ...(field.dataSource || {}), kind: e.target.value as any } })} className={inp} style={inpStyle}>
                {['static', 'api', 'db_table', 'sql', 'json', 'csv'].map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </Row>
            {field.dataSource && field.dataSource.kind !== 'static' && (
              <input placeholder="Endpoint / table / query…" value={field.dataSource.endpoint || ''} onChange={(e) => onChange({ dataSource: { ...field.dataSource!, endpoint: e.target.value } })} className={inp} style={inpStyle} />
            )}
            <Row label="Depends on (cascade)">
              <select value={field.dataSource?.dependsOn || ''} onChange={(e) => onChange({ dataSource: { ...(field.dataSource || { kind: 'static' }), dependsOn: e.target.value } })} className={inp} style={inpStyle}>
                <option value="">— none —</option>
                {allFields.filter((f) => f.id !== field.id && isSelection(f.type)).map((f) => <option key={f.id} value={f.key}>{f.label}</option>)}
              </select>
            </Row>
          </div>
        )}

        {/* flags */}
        {!isDisplay(field.type) && !isLayout(field.type) && (
          <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <label className={lbl} style={lblStyle}>Behaviour</label>
            {locked ? (
              <label className="flex items-center gap-2 text-[13px] opacity-70 cursor-not-allowed"><input type="checkbox" checked readOnly disabled style={{ accentColor: 'var(--p-primary)' }} /> Required <Sym name="lock" className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }} /></label>
            ) : (
              <Check label="Required" checked={field.required} onChange={(x) => onChange({ required: x })} />
            )}
            <Check label="Read only" checked={field.readOnly} onChange={(x) => onChange({ readOnly: x })} />
            <Check label="Hidden" checked={field.hidden} onChange={(x) => onChange({ hidden: x })} />
            <Check label="Disabled" checked={field.disabled} onChange={(x) => onChange({ disabled: x })} />
            <Check label="Repeatable group" checked={field.repeatable} onChange={(x) => onChange({ repeatable: x })} />
          </div>
        )}

        {/* validation */}
        {!isDisplay(field.type) && !isLayout(field.type) && (
          <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <label className={lbl} style={lblStyle}>Validation</label>
            {(field.type === 'short_text' || field.type === 'long_text') && (
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Min length" value={v.minLength ?? ''} onChange={(e) => setV({ minLength: +e.target.value })} className={inp} style={inpStyle} />
                <input type="number" placeholder="Max length" value={v.maxLength ?? ''} onChange={(e) => setV({ maxLength: +e.target.value })} className={inp} style={inpStyle} />
              </div>
            )}
            {field.type === 'number' && (
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Min" value={v.min ?? ''} onChange={(e) => setV({ min: +e.target.value })} className={inp} style={inpStyle} />
                <input type="number" placeholder="Max" value={v.max ?? ''} onChange={(e) => setV({ max: +e.target.value })} className={inp} style={inpStyle} />
              </div>
            )}
            {(field.type === 'file' || field.type === 'multi_file' || field.type === 'image') && (
              <>
                <input placeholder="Allowed ext (.pdf,.jpg)" value={v.allowedExtensions || ''} onChange={(e) => setV({ allowedExtensions: e.target.value })} className={inp} style={inpStyle} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Max MB" value={v.maxFileSize ?? ''} onChange={(e) => setV({ maxFileSize: +e.target.value })} className={inp} style={inpStyle} />
                  <input type="number" placeholder="Max files" value={v.maxFiles ?? ''} onChange={(e) => setV({ maxFiles: +e.target.value })} className={inp} style={inpStyle} />
                </div>
              </>
            )}
            <input placeholder="Regex pattern" value={v.regex || ''} onChange={(e) => setV({ regex: e.target.value })} className={inp} style={inpStyle} />
            <input placeholder="Custom error message" value={v.errorMessage || ''} onChange={(e) => setV({ errorMessage: e.target.value })} className={inp} style={inpStyle} />
          </div>
        )}

        {/* calculated field */}
        {(field.type === 'number' || field.type === 'short_text') && (
          <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <label className={lbl} style={lblStyle}>Calculated value</label>
            <input placeholder="e.g. {price} * {qty}" value={field.calculation || ''} onChange={(e) => onChange({ calculation: e.target.value })} className={inp} style={inpStyle} />
            <p className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>Reference any field by {'{key}'}. Supports + − × ÷ %.</p>
          </div>
        )}

        {/* conditional logic */}
        <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <Check label="Conditional logic" checked={c.enabled} onChange={(x) => setC({ enabled: x })} />
          {c.enabled && (
            <div className="space-y-2 pl-1">
              <div className="flex items-center gap-1.5 text-[13px]">
                <select value={c.action} onChange={(e) => setC({ action: e.target.value as any })} className="px-2 py-1 rounded border text-[12px] bg-transparent" style={inpStyle}><option value="show">Show</option><option value="hide">Hide</option></select>
                <span>this field if</span>
                <select value={c.match} onChange={(e) => setC({ match: e.target.value as any })} className="px-2 py-1 rounded border text-[12px] bg-transparent" style={inpStyle}><option>AND</option><option>OR</option></select>
              </div>
              {c.conditions.map((cond, i) => (
                <div key={i} className="flex gap-1 items-center">
                  <select value={cond.field} onChange={(e) => { const cs = [...c.conditions]; cs[i] = { ...cond, field: e.target.value }; setC({ conditions: cs }); }} className="px-1.5 py-1 rounded border text-[11px] bg-transparent flex-1 min-w-0" style={inpStyle}>
                    <option value="">field…</option>
                    {allFields.filter((f) => f.id !== field.id && !isDisplay(f.type) && !isLayout(f.type)).map((f) => <option key={f.id} value={f.key}>{f.label}</option>)}
                  </select>
                  <select value={cond.op} onChange={(e) => { const cs = [...c.conditions]; cs[i] = { ...cond, op: e.target.value as ConditionOp }; setC({ conditions: cs }); }} className="px-1 py-1 rounded border text-[11px] bg-transparent" style={inpStyle}>{OPS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
                  <input value={cond.value} onChange={(e) => { const cs = [...c.conditions]; cs[i] = { ...cond, value: e.target.value }; setC({ conditions: cs }); }} placeholder="value" className="px-1.5 py-1 rounded border text-[11px] bg-transparent w-16" style={inpStyle} />
                  <button onClick={() => setC({ conditions: c.conditions.filter((_, j) => j !== i) })}><Sym name="close" className="text-[15px]" style={{ color: 'var(--p-on-surface-variant)' }} /></button>
                </div>
              ))}
              <button onClick={() => setC({ conditions: [...c.conditions, { field: '', op: 'equals', value: '' }] })} className="text-[12px] font-bold flex items-center gap-1" style={{ color: 'var(--p-primary)' }}><Sym name="add" className="text-[15px]" /> Add condition</button>
            </div>
          )}
        </div>

        {/* advanced */}
        <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <label className={lbl} style={lblStyle}>Advanced</label>
          <Row label="CSS class"><input value={field.cssClass || ''} onChange={(e) => onChange({ cssClass: e.target.value })} className={inp} style={inpStyle} /></Row>
          <Row label="Field ID"><input value={field.id} readOnly className={`${inp} opacity-60`} style={inpStyle} /></Row>
        </div>
      </div>
    </div>
  );
}
