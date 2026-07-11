import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminShell from '@/components/portal/AdminShell';
import { Pill } from '@/components/portal/Pill';
import { Sym } from '@/components/portal/Sym';
import FieldRenderer from '@/components/portal/formbuilder/FieldRenderer';
import FieldSettings from '@/components/portal/formbuilder/FieldSettings';
import { makeField, isLayout } from '@/components/portal/formbuilder/registry';
import { FormField, FieldType, FieldWidth, FormSettings } from '@/components/portal/formbuilder/types';
import { manufacturingApi } from '@/lib/api';
import { parseFormFromDto, buildSchemaPayload } from '@/components/inquiry/inquiryUtils';
import { ensureSystemFields, isLockedField } from '@/components/inquiry/systemFields';
import InquiryFormWidget from '@/components/inquiry/InquiryFormWidget';
import { toast } from 'sonner';
import '@/pages/portal/portal.css';

const WIDTH_CLASS: Record<string, string> = {
  '25': 'w-full sm:w-[calc(25%-9px)]',
  '50': 'w-full sm:w-[calc(50%-6px)]',
  '75': 'w-full sm:w-[calc(75%-3px)]',
  '100': 'w-full',
};

const WIDTHS: FieldWidth[] = ['25', '50', '75', '100'];

/** Curated palette — only fields that work end-to-end on the public form. Row (horizontal group) on top. */
interface PaletteItem { type: FieldType; label: string; icon: string }
const INQUIRY_PALETTE: { group: string; items: PaletteItem[] }[] = [
  {
    group: 'Layout',
    items: [{ type: 'columns', label: 'Row (horizontal)', icon: 'view_column' }],
  },
  {
    group: 'Basic',
    items: [
      { type: 'short_text', label: 'Short Text', icon: 'short_text' },
      { type: 'long_text', label: 'Long Text', icon: 'notes' },
      { type: 'number', label: 'Number', icon: 'pin' },
      { type: 'email', label: 'Email', icon: 'mail' },
      { type: 'phone', label: 'Phone', icon: 'call' },
      { type: 'url', label: 'URL', icon: 'link' },
    ],
  },
  {
    group: 'Choice',
    items: [
      { type: 'dropdown', label: 'Dropdown', icon: 'arrow_drop_down_circle' },
      { type: 'radio', label: 'Radio', icon: 'radio_button_checked' },
      { type: 'checkbox', label: 'Checkbox', icon: 'check_box' },
      { type: 'multi_select', label: 'Multi Select', icon: 'checklist' },
      { type: 'toggle', label: 'Toggle', icon: 'toggle_on' },
    ],
  },
  {
    group: 'Date & Time',
    items: [
      { type: 'date', label: 'Date', icon: 'calendar_today' },
      { type: 'time', label: 'Time', icon: 'schedule' },
      { type: 'datetime', label: 'Date & Time', icon: 'event' },
    ],
  },
  {
    group: 'Upload',
    items: [
      { type: 'file', label: 'File', icon: 'upload_file' },
      { type: 'multi_file', label: 'Multiple Files', icon: 'attach_file' },
      { type: 'image', label: 'Image', icon: 'image' },
    ],
  },
  {
    group: 'Extra',
    items: [
      { type: 'rating', label: 'Rating', icon: 'star' },
      { type: 'slider', label: 'Slider', icon: 'tune' },
      { type: 'address', label: 'Address', icon: 'home' },
      { type: 'pincode', label: 'Pincode', icon: 'pin_drop' },
    ],
  },
  {
    group: 'Display',
    items: [
      { type: 'heading', label: 'Heading', icon: 'title' },
      { type: 'paragraph', label: 'Paragraph', icon: 'subject' },
      { type: 'divider', label: 'Divider', icon: 'horizontal_rule' },
    ],
  },
];

/** Field types that can be dropped inside a Row (everything except layout). */
const ROW_ADD_ITEMS: PaletteItem[] = INQUIRY_PALETTE
  .flatMap((g) => g.items)
  .filter((it) => it.type !== 'columns');

type Tab = 'build' | 'preview';

export default function AdminInquiryForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [name, setName] = useState('Manufacturing Inquiry');
  const [fields, setFields] = useState<FormField[]>([]);
  const [settings, setSettings] = useState<FormSettings>({
    visibility: 'public',
    successMessage: "Thank you! We'll review your inquiry and get back to you soon.",
  });
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [selected, setSelected] = useState<string | null>(null);
  const [dragType, setDragType] = useState<FieldType | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [rowAddMenu, setRowAddMenu] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('build');

  /** Select a field and make sure the settings panel (options editor) is visible. */
  const choose = (id: string | null) => {
    setSelected(id);
    if (id) setSettingsCollapsed(false);
  };

  const { data: formDto, isLoading } = useQuery({
    queryKey: ['admin-inquiry-form'],
    queryFn: () => manufacturingApi.getInquiryForm(),
  });

  useEffect(() => {
    const parsed = parseFormFromDto(formDto);
    if (parsed) {
      setName(parsed.name);
      setFields(ensureSystemFields(parsed.fields));
      setSettings(parsed.settings);
      setStatus(parsed.status);
    } else {
      // Brand-new form (nothing saved yet) — start with the three locked fields.
      setFields((xs) => (xs.length === 0 ? ensureSystemFields([]) : xs));
    }
  }, [formDto]);

  const saveMutation = useMutation({
    mutationFn: (nextStatus: 'DRAFT' | 'PUBLISHED') =>
      manufacturingApi.saveInquiryForm({
        name,
        category: 'Inquiry',
        purpose: 'INQUIRY',
        status: nextStatus,
        schema: buildSchemaPayload(ensureSystemFields(fields), name, settings),
      }),
    onSuccess: (dto, nextStatus) => {
      setStatus(dto.status);
      qc.invalidateQueries({ queryKey: ['admin-inquiry-form'] });
      qc.invalidateQueries({ queryKey: ['manufacturing-inquiry-form-public'] });
      toast.success(nextStatus === 'PUBLISHED' ? 'Form published — live on your website!' : 'Draft saved');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save form'),
  });

  const isRow = (f?: FormField | null) => f?.type === 'columns';

  /** Find a field by id at the top level or inside a row. */
  const findField = (id: string | null): FormField | null => {
    if (!id) return null;
    for (const f of fields) {
      if (f.id === id) return f;
      if (f.children) {
        const c = f.children.find((ch) => ch.id === id);
        if (c) return c;
      }
    }
    return null;
  };
  /** The row that directly contains the given child id (or null). */
  const parentRowOf = (childId: string | null): FormField | null => {
    if (!childId) return null;
    return fields.find((f) => f.children?.some((c) => c.id === childId)) || null;
  };

  const sel = findField(selected);

  /** Apply an update to a field by id, searching top level + row children. */
  const updateById = (id: string, updater: (f: FormField) => FormField) =>
    setFields((xs) =>
      xs.map((f) => {
        if (f.id === id) return updater(f);
        if (f.children) return { ...f, children: f.children.map((c) => (c.id === id ? updater(c) : c)) };
        return f;
      }),
    );

  const patch = (p: Partial<FormField>) => {
    if (!selected) return;
    updateById(selected, (f) => {
      // Locked system fields stay required and keep their type — ignore attempts
      // to change those, but allow label/placeholder/etc. tweaks.
      if (isLockedField(f)) {
        const { required: _r, ...rest } = p;
        return { ...f, ...rest, required: true, locked: true };
      }
      return { ...f, ...p };
    });
  };
  const setWidth = (fid: string, width: FieldWidth) => updateById(fid, (f) => ({ ...f, width }));

  const addField = (type: FieldType) => {
    const nf = makeField(type);
    // Layout containers (rows) always go at the top level.
    if (!isLayout(type)) {
      const targetRow = isRow(sel) ? sel : parentRowOf(selected);
      if (targetRow) {
        setFields((xs) =>
          xs.map((f) => (f.id === targetRow.id ? { ...f, children: [...(f.children || []), nf] } : f)),
        );
        choose(nf.id);
        return;
      }
    }
    setFields((xs) => [...xs, nf]);
    choose(nf.id);
  };

  const removeField = (fid: string) => {
    const target = findField(fid);
    if (target && isLockedField(target)) return; // name/email/phone can't be deleted
    setFields((xs) =>
      xs
        .filter((f) => f.id !== fid)
        .map((f) => (f.children ? { ...f, children: f.children.filter((c) => c.id !== fid) } : f)),
    );
    if (selected === fid) setSelected(null);
  };

  const dupField = (fid: string) => {
    const target = findField(fid);
    if (target && isLockedField(target)) return; // don't duplicate the locked contact fields
    const stamp = Date.now() % 1000;
    const clone = (f: FormField): FormField => ({ ...f, id: `${f.id}_c${stamp}`, key: `${f.key}_copy` });
    setFields((xs) => {
      const ti = xs.findIndex((f) => f.id === fid);
      if (ti >= 0) {
        const n = [...xs];
        n.splice(ti + 1, 0, clone(xs[ti]));
        return n;
      }
      return xs.map((f) => {
        if (!f.children) return f;
        const ci = f.children.findIndex((c) => c.id === fid);
        if (ci < 0) return f;
        const kids = [...f.children];
        kids.splice(ci + 1, 0, clone(f.children[ci]));
        return { ...f, children: kids };
      });
    });
  };

  const move = (from: number, to: number) =>
    setFields((xs) => {
      const n = [...xs];
      const [m] = n.splice(from, 1);
      n.splice(to, 0, m);
      return n;
    });

  /** Move a palette field type directly into a specific row. */
  const addToRow = (rowId: string, type: FieldType) => {
    if (isLayout(type)) return;
    const nf = makeField(type);
    setFields((xs) => xs.map((f) => (f.id === rowId ? { ...f, children: [...(f.children || []), nf] } : f)));
    choose(nf.id);
    setRowAddMenu(null);
  };

  const previewForm = {
    formId: formDto?.id,
    name,
    status,
    version: formDto?.version ?? 1,
    fields,
    steps: [{ id: 's1', title: 'Details' }],
    settings,
  };

  /** A single non-layout field card. `inRow` hides the width toggle (row children are equal width). */
  const LeafCard = ({ f, inRow, index }: { f: FormField; inRow?: boolean; index?: number }) => (
    <div
      onClick={(e) => { e.stopPropagation(); choose(f.id); }}
      onDragOver={index !== undefined ? (e) => e.preventDefault() : undefined}
      onDrop={
        index !== undefined
          ? (e) => {
              e.preventDefault();
              if (dragType && !isLayout(dragType)) { addField(dragType); setDragType(null); return; }
              if (dragIndex !== null && dragIndex !== index) move(dragIndex, index);
              setDragIndex(null);
            }
          : undefined
      }
      className={`${inRow ? 'flex-1 min-w-[120px]' : WIDTH_CLASS[f.width]} group/leaf relative rounded-lg border-2 p-3 pt-7 cursor-pointer transition-all`}
      style={{
        borderColor: selected === f.id ? 'var(--p-primary)' : 'var(--p-outline-variant)',
        background: selected === f.id ? 'rgba(0,103,106,0.04)' : 'var(--p-surface-container-lowest)',
      }}
    >
      <div className="absolute top-1 left-2 right-2 flex items-center justify-between gap-2">
        <span
          draggable={index !== undefined}
          onDragStart={index !== undefined ? (e) => { e.stopPropagation(); setDragIndex(index); } : undefined}
          onDragEnd={() => setDragIndex(null)}
          className={`msym text-[18px] ${index !== undefined ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{ color: 'var(--p-outline)' }}
          title={index !== undefined ? 'Drag to reorder' : undefined}
        >
          drag_indicator
        </span>
        <div className="flex items-center gap-1">
          {!inRow && (
            <div className="flex items-center rounded-md overflow-hidden border opacity-0 group-hover/leaf:opacity-100 transition-opacity" style={{ borderColor: 'var(--p-outline-variant)' }}>
              {WIDTHS.map((w) => (
                <button
                  key={w}
                  onClick={(e) => { e.stopPropagation(); setWidth(f.id, w); }}
                  className="px-1.5 py-0.5 text-[10px] font-bold leading-none"
                  style={f.width === w ? { background: 'var(--p-primary)', color: '#fff' } : { background: 'transparent', color: 'var(--p-on-surface-variant)' }}
                  title={`${w}% width`}
                >
                  {w === '25' ? '¼' : w === '50' ? '½' : w === '75' ? '¾' : '1'}
                </button>
              ))}
            </div>
          )}
          {isLockedField(f) ? (
            <span
              title="Required contact field — always collected & auto-filled into the quote. Can't be removed."
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
            >
              <Sym name="lock" className="text-[13px]" /> Required
            </span>
          ) : (
            <>
              <button onClick={(e) => { e.stopPropagation(); dupField(f.id); }} className="p-0.5 hover:bg-black/5 rounded opacity-0 group-hover/leaf:opacity-100 transition-opacity">
                <Sym name="content_copy" className="text-[15px]" style={{ color: 'var(--p-on-surface-variant)' }} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); removeField(f.id); }} className="p-0.5 hover:bg-black/5 rounded opacity-0 group-hover/leaf:opacity-100 transition-opacity">
                <Sym name="delete" className="text-[15px]" style={{ color: 'var(--p-error)' }} />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="pointer-events-none">
        <FieldRenderer field={f} />
      </div>
      {f.required && !isLockedField(f) && (
        <span className="absolute -bottom-2 left-2 text-[9px] font-bold px-1 rounded" style={{ color: 'var(--p-error)', background: 'var(--p-surface-container-lowest)' }}>
          required
        </span>
      )}
    </div>
  );

  const actions = (
    <>
      <button
        onClick={() => navigate('/portal-admin/inquiries')}
        className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border flex items-center gap-1.5"
        style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}
      >
        <Sym name="inbox" className="text-[16px]" /> Inquiries
      </button>
      <button
        onClick={() => saveMutation.mutate('DRAFT')}
        disabled={saveMutation.isPending}
        className="px-3 py-1.5 rounded-lg text-[13px] font-semibold border flex items-center gap-1.5 disabled:opacity-50"
        style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}
      >
        <Sym name="save" className="text-[16px]" /> Save draft
      </button>
      <button
        onClick={() => saveMutation.mutate('PUBLISHED')}
        disabled={saveMutation.isPending || fields.length === 0}
        className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white flex items-center gap-1.5 hover:brightness-110 disabled:opacity-50"
        style={{ background: 'var(--p-primary)' }}
      >
        <Sym name="publish" className="text-[16px]" /> Publish
      </button>
    </>
  );

  return (
    <AdminShell title="Inquiry Form" actions={actions}>
      <div>
        {/* live banner */}
        <div
          className="px-5 sm:px-8 py-3 flex flex-wrap items-center gap-3 border-b"
          style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}
        >
          <Pill label={status === 'PUBLISHED' ? 'Live' : status === 'DRAFT' ? 'Draft' : 'Archived'} />
          <span className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>
            {status === 'PUBLISHED'
              ? 'This form is live on your website at /inquiry'
              : 'Publish to make this form live on your website.'}
          </span>
          <button
            onClick={() => window.open('/inquiry', '_blank')}
            className="ml-auto px-3 py-1.5 rounded-lg text-[13px] font-semibold border flex items-center gap-1.5"
            style={{ borderColor: 'var(--p-outline)', color: 'var(--p-primary)' }}
          >
            <Sym name="open_in_new" className="text-[16px]" /> Open public page
          </button>
        </div>

        {/* form name + tabs */}
        <div
          className="px-5 sm:px-8 py-3 flex items-center gap-3 border-b"
          style={{ borderColor: 'var(--p-outline-variant)' }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-semibold text-[15px] bg-transparent border-none outline-none flex-1 min-w-0"
            placeholder="Form name"
          />
          <div className="flex gap-1">
            {(['build', 'preview'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-1.5 rounded-lg text-[13px] font-semibold capitalize"
                style={
                  t === tab
                    ? { background: 'var(--p-primary)', color: '#fff' }
                    : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="progress_activity" className="text-[28px] animate-spin" />
          </div>
        ) : tab === 'preview' ? (
          <div className="p-5 sm:p-8" style={{ background: 'var(--p-surface-container)' }}>
            <div
              className="max-w-2xl mx-auto rounded-xl border p-6 sm:p-8 bg-white"
              style={{ borderColor: 'var(--p-outline-variant)' }}
            >
              <InquiryFormWidget published={false} previewForm={previewForm} />
            </div>
          </div>
        ) : (
          <div className="flex" style={{ minHeight: '60vh' }}>
            {/* palette */}
            <aside
              className={`${collapsed ? 'w-12' : 'w-56'} border-r flex flex-col shrink-0 transition-[width] hidden md:flex`}
              style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}
            >
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="h-10 flex items-center justify-center border-b shrink-0"
                style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}
              >
                <Sym name={collapsed ? 'chevron_right' : 'chevron_left'} />
              </button>
              <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {INQUIRY_PALETTE.map((g) => (
                  <div key={g.group}>
                    {!collapsed && (
                      <p
                        className="px-1 mb-1 text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: 'var(--p-on-surface-variant)' }}
                      >
                        {g.group}
                      </p>
                    )}
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
              onDrop={() => {
                if (dragType) {
                  addField(dragType);
                  setDragType(null);
                }
              }}
            >
              <div className="max-w-3xl mx-auto">
                <div
                  className="border rounded-xl p-5 sm:p-8 min-h-[55vh]"
                  style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
                >
                  {fields.length === 0 ? (
                    <div
                      className="h-72 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center"
                      style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}
                    >
                      <Sym name="drag_pan" className="text-[40px]" />
                      <p className="mt-2 text-[14px] font-semibold">Drag fields here</p>
                      <p className="text-[12px]">or click a field in the palette to add it to your inquiry form</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start gap-3">
                      {fields.map((f, i) =>
                        isRow(f) ? (
                          /* ---- horizontal Row container ---- */
                          <div
                            key={f.id}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (dragType && !isLayout(dragType)) { addToRow(f.id, dragType); setDragType(null); return; }
                              if (dragIndex !== null && dragIndex !== i) move(dragIndex, i);
                              setDragIndex(null);
                            }}
                            onClick={() => choose(f.id)}
                            className="w-full relative rounded-lg border-2 border-dashed p-3 pt-8 transition-all"
                            style={{
                              borderColor: selected === f.id ? 'var(--p-primary)' : 'var(--p-outline-variant)',
                              background: selected === f.id ? 'rgba(0,103,106,0.03)' : 'var(--p-surface-container-low)',
                            }}
                          >
                            <div className="absolute top-1.5 left-3 right-2 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--p-on-surface-variant)' }}>
                                <Sym name="view_column" className="text-[15px]" /> Row · {(f.children || []).length} field{(f.children || []).length === 1 ? '' : 's'}
                              </span>
                              <div className="flex items-center gap-1">
                                {/* + Add field into this row */}
                                <div className="relative">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setRowAddMenu((m) => (m === f.id ? null : f.id)); }}
                                    className="px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 text-white"
                                    style={{ background: 'var(--p-primary)' }}
                                    title="Add a field inside this row"
                                  >
                                    <Sym name="add" className="text-[14px]" /> Add field
                                  </button>
                                  {rowAddMenu === f.id && (
                                    <>
                                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setRowAddMenu(null); }} />
                                      <div
                                        className="absolute right-0 top-7 z-50 w-44 max-h-72 overflow-y-auto rounded-lg border py-1 shadow-xl"
                                        style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {ROW_ADD_ITEMS.map((it) => (
                                          <button
                                            key={it.type}
                                            onClick={() => addToRow(f.id, it.type)}
                                            className="w-full text-left px-3 py-1.5 text-[12px] flex items-center gap-2 hover:bg-black/5"
                                            style={{ color: 'var(--p-on-surface)' }}
                                          >
                                            <Sym name={it.icon} className="text-[16px]" style={{ color: 'var(--p-primary)' }} /> {it.label}
                                          </button>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                                <span
                                  draggable
                                  onDragStart={(e) => { e.stopPropagation(); setDragIndex(i); }}
                                  onDragEnd={() => setDragIndex(null)}
                                  className="msym text-[18px] cursor-grab active:cursor-grabbing"
                                  style={{ color: 'var(--p-on-surface-variant)' }}
                                  title="Drag to reorder row"
                                >
                                  drag_indicator
                                </span>
                                <button onClick={(e) => { e.stopPropagation(); removeField(f.id); }} className="p-0.5 hover:bg-black/5 rounded">
                                  <Sym name="delete" className="text-[15px]" style={{ color: 'var(--p-error)' }} />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-3">
                              {(f.children || []).map((ch) => (
                                <LeafCard key={ch.id} f={ch} inRow />
                              ))}
                              {/* + drop/add tile */}
                              <button
                                onClick={(e) => { e.stopPropagation(); setRowAddMenu((m) => (m === f.id ? null : f.id)); }}
                                className="flex-1 min-w-[120px] min-h-[80px] flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed hover:border-current transition-colors"
                                style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}
                                title="Add a field inside this row"
                              >
                                <Sym name="add_circle" className="text-[24px]" style={{ color: 'var(--p-primary)' }} />
                                <span className="text-[11px] font-semibold">Add / drop field here</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <LeafCard key={f.id} f={f} index={i} />
                        ),
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[12px] mt-3 text-center" style={{ color: 'var(--p-on-surface-variant)' }}>
                  Tip: add a <b>Row</b> (Layout → Columns) for a horizontal group — select it, then click fields to drop them inside side-by-side. Or set any field's width with ¼ ½ ¾ 1.
                </p>
              </div>
            </main>

            {/* settings */}
            <aside
              className={`${settingsCollapsed ? 'w-12' : 'w-80'} border-l shrink-0 hidden lg:flex flex-col transition-[width] overflow-hidden`}
              style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
            >
              <button
                onClick={() => setSettingsCollapsed((c) => !c)}
                className="h-10 flex items-center justify-center gap-1.5 border-b shrink-0 text-[12px] font-semibold"
                style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}
                title={settingsCollapsed ? 'Open field settings' : 'Hide field settings'}
              >
                <Sym name={settingsCollapsed ? 'chevron_left' : 'chevron_right'} />
                {!settingsCollapsed && <span>Field settings</span>}
              </button>
              {!settingsCollapsed && (
                <div className="flex-1 overflow-y-auto">
                  {sel ? (
                    <FieldSettings field={sel} allFields={fields} onChange={patch} onClose={() => setSelected(null)} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center" style={{ color: 'var(--p-on-surface-variant)' }}>
                      <Sym name="tune" className="text-[36px]" />
                      <p className="mt-2 text-[13px]">
                        Select a field to edit its label, key, placeholder, validation & whether it's required.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
