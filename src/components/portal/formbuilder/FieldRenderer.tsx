import { useState } from 'react';
import { Sym } from '../Sym';
import { FormField } from './types';
import { isLayout } from './registry';

const inputCls = 'w-full px-3 py-2 rounded-lg border outline-none text-[14px] bg-transparent';
const inputStyle = { borderColor: 'var(--p-outline-variant)' } as React.CSSProperties;

/** Renders an actual interactive field (used in live preview + public fill). */
export default function FieldRenderer({ field }: { field: FormField }) {
  const [rating, setRating] = useState(0);
  const [slider, setSlider] = useState(50);
  const [toggle, setToggle] = useState(false);

  if (field.hidden) return null;

  const Label = () =>
    field.label ? (
      <label className="block text-[13px] font-semibold mb-1">
        {field.label}
        {field.required && <span style={{ color: 'var(--p-error)' }}> *</span>}
        {field.tooltip && <Sym name="info" className="text-[14px] ml-1" style={{ color: 'var(--p-on-surface-variant)' }} />}
      </label>
    ) : null;

  const Desc = () => (field.description ? <p className="text-[12px] mt-1" style={{ color: 'var(--p-on-surface-variant)' }}>{field.description}</p> : null);

  const wrap = (inner: React.ReactNode) => (
    <div>
      <Label />
      {inner}
      <Desc />
    </div>
  );

  switch (field.type) {
    case 'short_text': case 'email': case 'phone': case 'password': case 'url': case 'pincode':
      return wrap(<input type={field.type === 'password' ? 'password' : 'text'} placeholder={field.placeholder} disabled={field.disabled} readOnly={field.readOnly} className={inputCls} style={inputStyle} />);
    case 'number':
      return wrap(<input type="number" placeholder={field.placeholder} className={inputCls} style={inputStyle} />);
    case 'long_text': case 'rich_text': case 'html':
      return wrap(<textarea rows={3} placeholder={field.placeholder} className={`${inputCls} resize-none`} style={inputStyle} />);
    case 'date': case 'time': case 'datetime':
      return wrap(<input type={field.type === 'datetime' ? 'datetime-local' : field.type} className={inputCls} style={inputStyle} />);
    case 'dropdown': case 'country': case 'state': case 'city':
      return wrap(<select className={inputCls} style={inputStyle}><option value="">{field.placeholder || 'Select…'}</option>{(field.options || []).map((o) => <option key={o.value}>{o.label}</option>)}</select>);
    case 'multi_select':
      return wrap(<div className="flex flex-wrap gap-2">{(field.options || []).map((o) => <span key={o.value} className="px-2.5 py-1 rounded-full text-[12px] border" style={{ borderColor: 'var(--p-outline-variant)' }}>{o.label}</span>)}</div>);
    case 'radio':
      return wrap(<div className="space-y-1.5">{(field.options || []).map((o) => <label key={o.value} className="flex items-center gap-2 text-[14px]"><input type="radio" name={field.id} /> {o.label}</label>)}</div>);
    case 'checkbox':
      return wrap(<div className="space-y-1.5">{(field.options || []).map((o) => <label key={o.value} className="flex items-center gap-2 text-[14px]"><input type="checkbox" /> {o.label}</label>)}</div>);
    case 'toggle':
      return wrap(<button onClick={() => setToggle((t) => !t)} className="w-11 h-6 rounded-full relative transition-colors" style={{ background: toggle ? 'var(--p-primary)' : 'var(--p-outline-variant)' }}><span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: toggle ? 'translateX(20px)' : 'none' }} /></button>);
    case 'file': case 'multi_file': case 'image': case 'camera':
      return wrap(
        <div className="border-2 border-dashed rounded-lg p-5 flex flex-col items-center gap-1.5 cursor-pointer" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <Sym name={field.type === 'camera' ? 'photo_camera' : field.type === 'image' ? 'image' : 'upload_file'} className="text-[26px]" style={{ color: 'var(--p-primary)' }} />
          <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>{field.type === 'multi_file' ? 'Drop files or click' : 'Drop file or click'}</p>
        </div>
      );
    case 'rating':
      return wrap(<div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)}><Sym name="star" fill={n <= rating} className="text-[24px]" style={{ color: n <= rating ? 'var(--p-primary)' : 'var(--p-outline-variant)' }} /></button>)}</div>);
    case 'slider':
      return wrap(<div><input type="range" value={slider} onChange={(e) => setSlider(+e.target.value)} className="w-full" style={{ accentColor: 'var(--p-primary)' }} /><span className="text-[12px]">{slider}</span></div>);
    case 'color':
      return wrap(<input type="color" className="w-12 h-9 rounded border" style={inputStyle} />);
    case 'signature':
      return wrap(<div className="h-24 rounded-lg border flex items-center justify-center" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}><span className="text-[13px] flex items-center gap-2"><Sym name="draw" /> Sign here</span></div>);
    case 'qr': case 'barcode':
      return wrap(<button className="px-4 py-2 rounded-lg border text-[13px] font-semibold flex items-center gap-2" style={inputStyle}><Sym name={field.type === 'qr' ? 'qr_code_scanner' : 'barcode'} /> Scan {field.type === 'qr' ? 'QR' : 'barcode'}</button>);
    case 'address':
      return wrap(<div className="space-y-2"><input placeholder="Street address" className={inputCls} style={inputStyle} /><div className="grid grid-cols-2 gap-2"><input placeholder="City" className={inputCls} style={inputStyle} /><input placeholder="Pincode" className={inputCls} style={inputStyle} /></div></div>);
    case 'map':
      return wrap(<div className="h-32 rounded-lg border flex items-center justify-center" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container)' }}><Sym name="location_on" className="text-[28px]" style={{ color: 'var(--p-primary)' }} /></div>);
    // display
    case 'heading':
      return <h3 className="font-display text-[22px]" style={{ color: 'var(--p-on-surface)' }}>{field.content || field.label}</h3>;
    case 'paragraph':
      return <p className="text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>{field.content}</p>;
    case 'divider':
      return <hr style={{ borderColor: 'var(--p-outline-variant)' }} />;
    case 'spacer':
      return <div className="h-6" />;
    case 'image_display':
      return <div className="h-32 rounded-lg border flex items-center justify-center" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container)' }}><Sym name="photo" className="text-[28px]" style={{ color: 'var(--p-on-surface-variant)' }} /></div>;
    case 'video':
      return <div className="aspect-video rounded-lg border flex items-center justify-center" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container)' }}><Sym name="play_circle" className="text-[36px]" style={{ color: 'var(--p-on-surface-variant)' }} /></div>;
    default:
      if (isLayout(field.type)) return null;
      return wrap(<input className={inputCls} style={inputStyle} placeholder={field.placeholder} />);
  }
}
