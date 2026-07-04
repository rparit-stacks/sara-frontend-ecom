import { FieldType, FormField, FormSchema } from './types';

export interface FieldMeta { type: FieldType; label: string; icon: string }
export interface PaletteGroup { group: string; items: FieldMeta[] }

export const PALETTE: PaletteGroup[] = [
  {
    group: 'Basic',
    items: [
      { type: 'short_text', label: 'Short Text', icon: 'short_text' },
      { type: 'long_text', label: 'Long Text', icon: 'notes' },
      { type: 'number', label: 'Number', icon: 'pin' },
      { type: 'email', label: 'Email', icon: 'mail' },
      { type: 'phone', label: 'Phone', icon: 'call' },
      { type: 'password', label: 'Password', icon: 'password' },
      { type: 'url', label: 'URL', icon: 'link' },
    ],
  },
  {
    group: 'Selection',
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
      { type: 'file', label: 'File Upload', icon: 'upload_file' },
      { type: 'multi_file', label: 'Multiple Files', icon: 'attach_file' },
      { type: 'image', label: 'Image Upload', icon: 'image' },
      { type: 'camera', label: 'Camera', icon: 'photo_camera' },
    ],
  },
  {
    group: 'Advanced',
    items: [
      { type: 'signature', label: 'Signature', icon: 'draw' },
      { type: 'rating', label: 'Rating', icon: 'star' },
      { type: 'slider', label: 'Slider', icon: 'tune' },
      { type: 'rich_text', label: 'Rich Text', icon: 'format_color_text' },
      { type: 'color', label: 'Color Picker', icon: 'palette' },
      { type: 'qr', label: 'QR Scanner', icon: 'qr_code_scanner' },
      { type: 'barcode', label: 'Barcode', icon: 'barcode' },
      { type: 'address', label: 'Address', icon: 'home' },
      { type: 'country', label: 'Country', icon: 'public' },
      { type: 'state', label: 'State', icon: 'map' },
      { type: 'city', label: 'City', icon: 'location_city' },
      { type: 'pincode', label: 'Pincode', icon: 'pin_drop' },
      { type: 'map', label: 'Map Location', icon: 'location_on' },
    ],
  },
  {
    group: 'Display',
    items: [
      { type: 'heading', label: 'Heading', icon: 'title' },
      { type: 'paragraph', label: 'Paragraph', icon: 'subject' },
      { type: 'divider', label: 'Divider', icon: 'horizontal_rule' },
      { type: 'image_display', label: 'Image', icon: 'photo' },
      { type: 'video', label: 'Video', icon: 'movie' },
      { type: 'html', label: 'HTML Block', icon: 'code' },
    ],
  },
  {
    group: 'Layout',
    items: [
      { type: 'section', label: 'Section', icon: 'space_dashboard' },
      { type: 'columns', label: 'Columns', icon: 'view_column' },
      { type: 'tabs', label: 'Tabs', icon: 'tab' },
      { type: 'accordion', label: 'Accordion', icon: 'expand_more' },
      { type: 'spacer', label: 'Spacer', icon: 'height' },
    ],
  },
];

export const META: Record<FieldType, FieldMeta> = PALETTE.reduce((acc, g) => {
  g.items.forEach((it) => (acc[it.type] = it));
  return acc;
}, {} as Record<FieldType, FieldMeta>);

const LAYOUT_TYPES: FieldType[] = ['section', 'columns', 'tabs', 'accordion'];
const SELECTION_TYPES: FieldType[] = ['dropdown', 'radio', 'checkbox', 'multi_select'];
export const isLayout = (t: FieldType) => LAYOUT_TYPES.includes(t);
export const isSelection = (t: FieldType) => SELECTION_TYPES.includes(t);
export const isDisplay = (t: FieldType) => ['heading', 'paragraph', 'divider', 'image_display', 'video', 'html', 'spacer'].includes(t);

let counter = 0;
export function makeField(type: FieldType, step = 1): FormField {
  counter += 1;
  const meta = META[type];
  const base: FormField = {
    id: `f_${counter}_${type}`,
    type,
    key: `${type}_${counter}`,
    label: meta.label,
    width: '100',
    icon: meta.icon,
    step,
  };
  if (isSelection(type)) base.options = [{ label: 'Option 1', value: 'opt1' }, { label: 'Option 2', value: 'opt2' }];
  if (isLayout(type)) base.children = [];
  if (type === 'heading') base.content = 'Section heading';
  if (type === 'paragraph') base.content = 'Some descriptive text for the user.';
  return base;
}

export const FORM_CATEGORIES = ['Inquiry', 'Production', 'Clients', 'Feedback', 'Internal'];
