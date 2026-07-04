import { useState, type ElementType } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ScrollReveal from '@/components/animations/ScrollReveal';
import InquiryFormWidget from '@/components/inquiry/InquiryFormWidget';
import {
  SECTION_TEMPLATES,
  createSection,
  type CardsSection,
  type FormSection,
  type InquiryItem,
  type InquiryPageContent,
  type InquirySection,
  type InquirySectionType,
  type RichTextSection,
  type StepsSection,
} from '@/components/inquiry/inquiryContent';

const SECTION_BG = [
  '/bg_images/powder-pastel-with-hand-drawn-elements-background.png',
  '/bg_images/4014404.jpg',
  '/bg_images/9598237.jpg',
  '/bg_images/9595043.jpg',
];

export interface InquiryPageViewProps {
  content: InquiryPageContent;
  editable?: boolean;
  onChange?: (next: InquiryPageContent) => void;
}

/* ---------- inline editing primitives ---------- */

function EditableText({
  value,
  onChange,
  editable,
  className,
  as: As = 'span',
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  editable?: boolean;
  className?: string;
  as?: ElementType;
  placeholder?: string;
}) {
  if (!editable) {
    return <As className={className}>{value}</As>;
  }
  return (
    <As
      className={`${className ?? ''} outline-none rounded px-1 -mx-1 cursor-text transition-colors hover:bg-primary/10 focus:bg-primary/10 focus:ring-2 focus:ring-primary/40`}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-ph={placeholder}
      onBlur={(e) => onChange((e.currentTarget.textContent || '').trim())}
    >
      {value}
    </As>
  );
}

function IconBadge({
  icon,
  editable,
  onChange,
  wrapperClass,
  iconClass,
}: {
  icon: string;
  editable?: boolean;
  onChange: (v: string) => void;
  wrapperClass: string;
  iconClass: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative ${wrapperClass}`}>
      <i className={`fa-solid ${icon || 'fa-circle'} ${iconClass}`} />
      {editable && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center shadow"
            title="Change icon"
          >
            <i className="fa-solid fa-pen" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-primary/20 p-2 w-44">
                <input
                  autoFocus
                  defaultValue={icon}
                  placeholder="fa-shirt"
                  onBlur={(e) => { onChange(e.target.value.trim()); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { onChange((e.target as HTMLInputElement).value.trim()); setOpen(false); } }}
                  className="w-full text-[12px] border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
                <p className="text-[10px] text-muted-foreground mt-1">FontAwesome class</p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function SectionToolbar({
  index,
  total,
  visible,
  onMove,
  onToggle,
  onDelete,
}: {
  index: number;
  total: number;
  visible: boolean;
  onMove: (dir: -1 | 1) => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const btn = 'w-8 h-8 rounded-md flex items-center justify-center bg-white shadow border border-primary/15 text-foreground hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-foreground transition-colors';
  return (
    <div className="absolute top-3 right-3 z-30 flex items-center gap-1">
      <button className={btn} title="Move up" disabled={index === 0} onClick={() => onMove(-1)}><i className="fa-solid fa-arrow-up text-[12px]" /></button>
      <button className={btn} title="Move down" disabled={index === total - 1} onClick={() => onMove(1)}><i className="fa-solid fa-arrow-down text-[12px]" /></button>
      <button className={btn} title={visible ? 'Hide' : 'Show'} onClick={onToggle}><i className={`fa-solid ${visible ? 'fa-eye' : 'fa-eye-slash'} text-[12px]`} /></button>
      <button className={`${btn} hover:bg-red-500`} title="Delete section" onClick={onDelete}><i className="fa-solid fa-trash text-[12px]" /></button>
    </div>
  );
}

function SectionDivider({
  open,
  onToggle,
  onPick,
}: {
  open: boolean;
  onToggle: () => void;
  onPick: (type: InquirySectionType) => void;
}) {
  return (
    <div className="relative bg-white">
      <div className="group/divider flex items-center gap-3 px-4 py-2 max-w-3xl mx-auto">
        <span className="flex-1 h-px bg-primary/15 group-hover/divider:bg-primary/40 transition-colors" />
        <button
          type="button"
          onClick={onToggle}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition-all ${
            open
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-primary border-primary/30 opacity-60 group-hover/divider:opacity-100 hover:border-primary'
          }`}
          title="Add a section here"
        >
          <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-plus'}`} /> Add section
        </button>
        <span className="flex-1 h-px bg-primary/15 group-hover/divider:bg-primary/40 transition-colors" />
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute left-1/2 -translate-x-1/2 z-50 mt-1 w-[20rem] max-w-[90vw] bg-white rounded-xl shadow-2xl border border-primary/15 p-2">
            <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Which section?
            </p>
            {SECTION_TEMPLATES.map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => onPick(t.type)}
                className="w-full text-left rounded-lg p-2.5 flex items-start gap-3 hover:bg-primary/5 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <i className={`fa-solid ${t.icon} text-[14px] text-primary`} />
                </div>
                <span>
                  <span className="block text-[13px] font-semibold text-foreground">{t.label}</span>
                  <span className="block text-[12px] leading-snug text-muted-foreground">{t.description}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- section blocks ---------- */

const Reveal = ({ editable, delay, children }: { editable?: boolean; delay?: number; children: React.ReactNode }) =>
  editable ? <>{children}</> : <ScrollReveal delay={delay}>{children}</ScrollReveal>;

function Header({
  section,
  editable,
  onPatch,
}: {
  section: StepsSection | CardsSection | FormSection;
  editable?: boolean;
  onPatch: (patch: Partial<InquirySection>) => void;
}) {
  return (
    <Reveal editable={editable}>
      <div className="text-center mb-8 xs:mb-10 sm:mb-12">
        <EditableText
          as="h2"
          editable={editable}
          value={section.heading}
          onChange={(v) => onPatch({ heading: v })}
          className="font-cursive text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-primary mb-3 xs:mb-4 px-2 inline-block"
        />
        <EditableText
          as="p"
          editable={editable}
          value={section.subheading}
          onChange={(v) => onPatch({ subheading: v } as Partial<InquirySection>)}
          className="text-muted-foreground text-base xs:text-lg sm:text-xl max-w-xl mx-auto px-2"
        />
      </div>
    </Reveal>
  );
}

function ItemRemoveBtn({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
      title="Remove item"
    >
      <i className="fa-solid fa-xmark" />
    </button>
  );
}

function AddItemTile({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="rounded-xl sm:rounded-2xl border-2 border-dashed border-primary/30 text-primary/70 hover:text-primary hover:border-primary/60 transition-colors flex flex-col items-center justify-center gap-2 p-6 min-h-[140px]"
    >
      <i className="fa-solid fa-plus text-2xl" />
      <span className="text-sm font-semibold">Add item</span>
    </button>
  );
}

function StepsBlock({ section, editable, onPatch, onItem, onAddItem, onRemoveItem }: {
  section: StepsSection; editable?: boolean;
  onPatch: (p: Partial<InquirySection>) => void;
  onItem: (i: number, next: InquiryItem) => void;
  onAddItem: () => void; onRemoveItem: (i: number) => void;
}) {
  return (
    <div className="container-custom relative z-10">
      <Header section={section} editable={editable} onPatch={onPatch} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xs:gap-6 sm:gap-8">
        {section.items.map((step, index) => (
          <Reveal editable={editable} key={index} delay={index * 0.15}>
            <div className="group relative text-center p-5 xs:p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-b from-warm to-white border border-primary/10 hover:shadow-xl transition-all duration-300 h-full">
              {editable && <ItemRemoveBtn onRemove={() => onRemoveItem(index)} />}
              <div className="absolute -top-3 xs:-top-4 left-1/2 -translate-x-1/2 w-10 h-10 xs:w-12 xs:h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm xs:text-base lg:text-lg">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="mt-3 xs:mt-4 mb-3 xs:mb-4">
                <IconBadge
                  icon={step.icon}
                  editable={editable}
                  onChange={(v) => onItem(index, { ...step, icon: v })}
                  wrapperClass="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-3 xs:mb-4"
                  iconClass="text-lg xs:text-xl sm:text-2xl text-accent"
                />
                <EditableText as="h3" editable={editable} value={step.title} onChange={(v) => onItem(index, { ...step, title: v })} className="text-lg xs:text-xl font-semibold text-foreground mb-1.5 xs:mb-2 px-2 inline-block" />
                <EditableText as="p" editable={editable} value={step.description} onChange={(v) => onItem(index, { ...step, description: v })} className="text-sm xs:text-base text-muted-foreground px-2" />
              </div>
            </div>
          </Reveal>
        ))}
        {editable && <AddItemTile onAdd={onAddItem} />}
      </div>
    </div>
  );
}

function CardsBlock({ section, editable, onPatch, onItem, onAddItem, onRemoveItem }: {
  section: CardsSection; editable?: boolean;
  onPatch: (p: Partial<InquirySection>) => void;
  onItem: (i: number, next: InquiryItem) => void;
  onAddItem: () => void; onRemoveItem: (i: number) => void;
}) {
  return (
    <div className="container-custom relative z-10">
      <Header section={section} editable={editable} onPatch={onPatch} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xs:gap-5 sm:gap-6">
        {section.items.map((item, index) => (
          <Reveal editable={editable} key={index} delay={index * 0.1}>
            <div className="group relative p-4 xs:p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-b from-warm to-white border border-primary/10 hover:shadow-xl hover:border-primary/30 transition-all text-center h-full">
              {editable && <ItemRemoveBtn onRemove={() => onRemoveItem(index)} />}
              <IconBadge
                icon={item.icon}
                editable={editable}
                onChange={(v) => onItem(index, { ...item, icon: v })}
                wrapperClass="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3 xs:mb-4"
                iconClass="text-lg xs:text-xl sm:text-2xl text-primary"
              />
              <EditableText as="h3" editable={editable} value={item.title} onChange={(v) => onItem(index, { ...item, title: v })} className="text-lg xs:text-xl font-semibold text-foreground mb-1.5 xs:mb-2 px-2 inline-block" />
              <EditableText as="p" editable={editable} value={item.description} onChange={(v) => onItem(index, { ...item, description: v })} className="text-sm xs:text-base text-muted-foreground px-2" />
            </div>
          </Reveal>
        ))}
        {editable && <AddItemTile onAdd={onAddItem} />}
      </div>
    </div>
  );
}

function FormBlock({ section, editable, onPatch }: {
  section: FormSection; editable?: boolean; onPatch: (p: Partial<InquirySection>) => void;
}) {
  return (
    <div className="container-custom relative z-10">
      <Header section={section} editable={editable} onPatch={onPatch} />
      <div className="max-w-2xl mx-auto px-2 xs:px-3 sm:px-4">
        <div className="bg-white/95 backdrop-blur-sm p-4 xs:p-5 sm:p-6 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl shadow-xl border border-primary/10">
          {editable ? (
            <div className="text-center text-muted-foreground py-8">
              <i className="fa-solid fa-clipboard-list text-3xl text-primary/50 mb-3" />
              <p className="text-sm font-semibold">Live inquiry form</p>
              <p className="text-xs mb-4">The fields below come from the published form. Place this section anywhere on the page.</p>
              <a
                href="/portal-admin/inquiry-form"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-white text-[13px] font-semibold px-4 py-2 hover:brightness-110 transition-all"
              >
                <i className="fa-solid fa-pen-to-square" /> Edit form fields
              </a>
              <div className="mt-6 pt-6 border-t border-primary/10 pointer-events-none opacity-90">
                <InquiryFormWidget published compact />
              </div>
            </div>
          ) : (
            <InquiryFormWidget published compact />
          )}
        </div>
      </div>
    </div>
  );
}

function RichTextBlock({ section, editable, onPatch }: {
  section: RichTextSection; editable?: boolean; onPatch: (p: Partial<InquirySection>) => void;
}) {
  return (
    <div className="container-custom relative z-10">
      <Reveal editable={editable}>
        <div className="text-center mb-8 xs:mb-10 sm:mb-12">
          <EditableText as="h2" editable={editable} value={section.heading} onChange={(v) => onPatch({ heading: v })} className="font-cursive text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-primary mb-3 xs:mb-4 px-2 inline-block" />
        </div>
        <EditableText as="p" editable={editable} value={section.body} onChange={(v) => onPatch({ body: v })} className="block text-center text-muted-foreground text-base xs:text-lg sm:text-xl max-w-3xl mx-auto px-2 whitespace-pre-line" />
      </Reveal>
    </div>
  );
}

/* ---------- main view ---------- */

export default function InquiryPageView({ content, editable, onChange }: InquiryPageViewProps) {
  const { hero, cta } = content;
  const [openDivider, setOpenDivider] = useState<number | null>(null);
  const sections = editable ? content.sections : content.sections.filter((s) => s.visible !== false);
  const scrollToForm = () => {
    if (editable) return;
    document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const update = (next: InquiryPageContent) => onChange?.(next);
  const patchHero = (patch: Partial<InquiryPageContent['hero']>) => update({ ...content, hero: { ...hero, ...patch } });
  const patchCta = (patch: Partial<InquiryPageContent['cta']>) => update({ ...content, cta: { ...cta, ...patch } });

  const patchSection = (id: string, patch: Partial<InquirySection>) =>
    update({ ...content, sections: content.sections.map((s) => (s.id === id ? ({ ...s, ...patch } as InquirySection) : s)) });
  const patchItem = (id: string, idx: number, next: InquiryItem) =>
    update({
      ...content,
      sections: content.sections.map((s) => {
        if (s.id !== id || !('items' in s)) return s;
        const items = [...s.items]; items[idx] = next; return { ...s, items } as InquirySection;
      }),
    });
  const addItem = (id: string) =>
    update({
      ...content,
      sections: content.sections.map((s) =>
        s.id === id && 'items' in s ? ({ ...s, items: [...s.items, { title: 'New item', description: 'Describe this item.', icon: 'fa-star' }] } as InquirySection) : s),
    });
  const removeItem = (id: string, idx: number) =>
    update({
      ...content,
      sections: content.sections.map((s) =>
        s.id === id && 'items' in s ? ({ ...s, items: s.items.filter((_, i) => i !== idx) } as InquirySection) : s),
    });
  const moveSection = (id: string, dir: -1 | 1) => {
    const idx = content.sections.findIndex((s) => s.id === id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= content.sections.length) return;
    const arr = [...content.sections];
    const [m] = arr.splice(idx, 1); arr.splice(to, 0, m);
    update({ ...content, sections: arr });
  };
  const deleteSection = (id: string) => update({ ...content, sections: content.sections.filter((s) => s.id !== id) });
  const insertSection = (index: number, type: InquirySectionType) => {
    const arr = [...content.sections];
    arr.splice(index, 0, createSection(type));
    update({ ...content, sections: arr });
    setOpenDivider(null);
  };

  const renderBody = (section: InquirySection) => {
    const onPatch = (p: Partial<InquirySection>) => patchSection(section.id, p);
    switch (section.type) {
      case 'steps':
        return <StepsBlock section={section} editable={editable} onPatch={onPatch} onItem={(i, n) => patchItem(section.id, i, n)} onAddItem={() => addItem(section.id)} onRemoveItem={(i) => removeItem(section.id, i)} />;
      case 'cards':
        return <CardsBlock section={section} editable={editable} onPatch={onPatch} onItem={(i, n) => patchItem(section.id, i, n)} onAddItem={() => addItem(section.id)} onRemoveItem={(i) => removeItem(section.id, i)} />;
      case 'form':
        return <FormBlock section={section} editable={editable} onPatch={onPatch} />;
      case 'richtext':
        return <RichTextBlock section={section} editable={editable} onPatch={onPatch} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-white/80 backdrop-blur-sm py-6 sm:py-8 lg:py-12 z-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.12]" style={{ backgroundImage: 'url(/bg_images/watercolor-wallpaper-with-hand-drawn-elements.png)', backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }} />
        <div className="relative mx-auto max-w-6xl px-3 xs:px-4 sm:px-6 lg:px-12">
          <div className="relative w-full py-10 xs:py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 overflow-hidden" style={{ backgroundImage: 'url(/bg_images/hand_painted_watercolour_winter_floral_background_1111.jpg)', backgroundPosition: 'center', backgroundSize: 'cover' }}>
            <div className="absolute inset-0 bg-white/40 pointer-events-none" />
            <div className="relative z-20 flex items-center justify-center px-2 xs:px-3 sm:px-4">
              <div className="bg-white/95 backdrop-blur-sm p-4 xs:p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12 shadow-xl max-w-[300px] xs:max-w-sm sm:max-w-md lg:max-w-lg mx-auto text-center">
                <EditableText as="h1" editable={editable} value={hero.title} onChange={(v) => patchHero({ title: v })} className="font-cursive text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-primary mb-2 xs:mb-3 md:mb-4 inline-block" />
                <EditableText as="p" editable={editable} value={hero.subtitleLine1} onChange={(v) => patchHero({ subtitleLine1: v })} className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-foreground font-medium mb-1" />
                <EditableText as="p" editable={editable} value={hero.subtitleLine2} onChange={(v) => patchHero({ subtitleLine2: v })} className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-foreground font-medium mb-3 xs:mb-4 md:mb-6" />
                <Button
                  variant="outline"
                  className="px-3 xs:px-4 sm:px-6 md:px-8 py-2 xs:py-2.5 sm:py-3 md:py-4 lg:py-5 text-sm xs:text-base sm:text-lg md:text-xl border-2 border-[#d4a84b] text-[#d4a84b] hover:bg-[#d4a84b] hover:text-white rounded-none uppercase tracking-wider font-medium transition-all w-full sm:w-auto"
                  onClick={scrollToForm}
                >
                  <EditableText editable={editable} value={hero.buttonText} onChange={(v) => patchHero({ buttonText: v })} className="truncate" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      {editable && (
        <SectionDivider
          open={openDivider === 0}
          onToggle={() => setOpenDivider((d) => (d === 0 ? null : 0))}
          onPick={(type) => insertSection(0, type)}
        />
      )}
      {sections.map((section, index) => {
        const isForm = section.type === 'form';
        const bg = SECTION_BG[index % SECTION_BG.length];
        const altBg = index % 2 === 0 ? 'bg-white/90 backdrop-blur-sm' : 'bg-gradient-to-b from-warm to-white/90 backdrop-blur-sm';
        const hidden = section.visible === false;
        return (
          <div key={section.id}>
            <section
              id={!editable && isForm ? 'inquiry-form' : undefined}
              className={`py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 ${altBg} relative z-10 overflow-hidden ${editable ? 'group/section ring-1 ring-transparent hover:ring-primary/30' : ''} ${hidden ? 'opacity-50' : ''}`}
            >
              <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: `url(${bg})`, backgroundPosition: 'center', backgroundSize: 'cover' }} />
              {editable && (
                <SectionToolbar
                  index={index}
                  total={sections.length}
                  visible={!hidden}
                  onMove={(d) => moveSection(section.id, d)}
                  onToggle={() => patchSection(section.id, { visible: hidden })}
                  onDelete={() => deleteSection(section.id)}
                />
              )}
              {renderBody(section)}
            </section>
            {editable && (
              <SectionDivider
                open={openDivider === index + 1}
                onToggle={() => setOpenDivider((d) => (d === index + 1 ? null : index + 1))}
                onPick={(type) => insertSection(index + 1, type)}
              />
            )}
          </div>
        );
      })}

      {/* Final CTA */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-r from-primary/90 to-primary relative overflow-hidden z-10">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-4 xs:left-6 sm:left-10 w-24 h-24 xs:w-32 xs:h-32 sm:w-40 sm:h-40 bg-white rounded-full" />
          <div className="absolute bottom-0 right-4 xs:right-6 sm:right-10 w-32 h-32 xs:w-40 xs:h-40 sm:w-60 sm:h-60 bg-white rounded-full" />
        </div>
        <div className="container-custom relative z-10 text-center">
          <EditableText as="h2" editable={editable} value={cta.heading} onChange={(v) => patchCta({ heading: v })} className="font-cursive text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white mb-3 xs:mb-4 px-2 inline-block" />
          <EditableText as="p" editable={editable} value={cta.subheading} onChange={(v) => patchCta({ subheading: v })} className="text-white/90 text-base xs:text-lg sm:text-xl mb-6 xs:mb-7 sm:mb-8 max-w-xl mx-auto px-2" />
          <div>
            <Button className="bg-white text-primary hover:bg-white/90 px-4 xs:px-6 sm:px-8 py-4 xs:py-5 sm:py-6 text-sm xs:text-base sm:text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all" onClick={scrollToForm}>
              <i className="fa-solid fa-paper-plane mr-1.5 xs:mr-2" />
              <EditableText editable={editable} value={cta.buttonText} onChange={(v) => patchCta({ buttonText: v })} className="truncate" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
