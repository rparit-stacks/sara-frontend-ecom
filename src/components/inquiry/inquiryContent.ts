// CMS content model for the public /inquiry page.
// The whole page (hero, ordered sections, cta) is stored as a single JSON blob
// in the backend (manufacturing_page_content). The admin can edit text and
// add/remove/reorder sections from a set of pre-built section types.

export type InquirySectionType = 'steps' | 'cards' | 'form' | 'richtext';

export interface InquiryItem {
  title: string;
  description: string;
  icon: string; // FontAwesome class, e.g. "fa-shirt"
}

interface SectionBase {
  id: string;
  type: InquirySectionType;
  visible: boolean;
}

export interface StepsSection extends SectionBase {
  type: 'steps';
  heading: string;
  subheading: string;
  items: InquiryItem[];
}

export interface CardsSection extends SectionBase {
  type: 'cards';
  heading: string;
  subheading: string;
  items: InquiryItem[];
}

export interface FormSection extends SectionBase {
  type: 'form';
  heading: string;
  subheading: string;
}

export interface RichTextSection extends SectionBase {
  type: 'richtext';
  heading: string;
  body: string;
}

export type InquirySection = StepsSection | CardsSection | FormSection | RichTextSection;

export interface InquiryHero {
  title: string;
  subtitleLine1: string;
  subtitleLine2: string;
  buttonText: string;
}

export interface InquiryCta {
  heading: string;
  subheading: string;
  buttonText: string;
}

export interface InquiryPageContent {
  hero: InquiryHero;
  sections: InquirySection[];
  cta: InquiryCta;
}

/** Pre-built section templates the admin can add from the CMS. */
export const SECTION_TEMPLATES: {
  type: InquirySectionType;
  label: string;
  description: string;
  icon: string;
  create: () => InquirySection;
}[] = [
  {
    type: 'steps',
    label: 'Steps',
    description: 'Numbered step cards (e.g. how it works)',
    icon: 'fa-list-ol',
    create: () => ({
      id: newId(),
      type: 'steps',
      visible: true,
      heading: 'How It Works',
      subheading: 'From inquiry to delivery — simple, transparent, reliable',
      items: [
        { title: 'Share Your Brief', description: 'Tell us your product, fabric, quantity and timelines.', icon: 'fa-paper-plane' },
        { title: 'We Review & Quote', description: 'Our team prepares a tailored quotation.', icon: 'fa-file-invoice-dollar' },
        { title: 'Sampling & Production', description: 'Approve the sample, and we manufacture and deliver.', icon: 'fa-truck-fast' },
      ],
    }),
  },
  {
    type: 'cards',
    label: 'Cards',
    description: 'Icon feature cards in a grid',
    icon: 'fa-table-cells-large',
    create: () => ({
      id: newId(),
      type: 'cards',
      visible: true,
      heading: 'What We Make',
      subheading: 'Manufacturing capabilities across categories',
      items: [
        { title: 'Apparel Manufacturing', description: 'End-to-end garment production at scale.', icon: 'fa-shirt' },
        { title: 'Custom Fabrics & Prints', description: 'Bespoke fabrics, prints and embroideries.', icon: 'fa-scroll' },
        { title: 'Private Label', description: 'Build your own brand with white-label manufacturing.', icon: 'fa-tag' },
        { title: 'Bulk Orders', description: 'Flexible MOQs and reliable timelines.', icon: 'fa-boxes-stacked' },
      ],
    }),
  },
  {
    type: 'form',
    label: 'Inquiry Form',
    description: 'The live inquiry form (published in the form builder)',
    icon: 'fa-clipboard-list',
    create: () => ({
      id: newId(),
      type: 'form',
      visible: true,
      heading: 'Share Your Inquiry',
      subheading: "Tell us what you'd like to manufacture and we'll get back with a quote",
    }),
  },
  {
    type: 'richtext',
    label: 'Text Banner',
    description: 'A heading with a paragraph of text',
    icon: 'fa-align-left',
    create: () => ({
      id: newId(),
      type: 'richtext',
      visible: true,
      heading: 'Our Promise',
      body: 'We partner with brands of every size to manufacture products they are proud of.',
    }),
  },
];

export function createSection(type: InquirySectionType): InquirySection {
  const tpl = SECTION_TEMPLATES.find((t) => t.type === type);
  return tpl ? tpl.create() : SECTION_TEMPLATES[0].create();
}

export function newId(): string {
  return `sec_${Math.random().toString(36).slice(2, 9)}`;
}

/** Default content used when the admin has never saved CMS content. Mirrors the original static page. */
export const DEFAULT_INQUIRY_CONTENT: InquiryPageContent = {
  hero: {
    title: 'Request a Quote',
    subtitleLine1: 'Manufacturing & bulk orders,',
    subtitleLine2: 'crafted to your brief.',
    buttonText: 'Start your inquiry',
  },
  sections: [
    {
      id: 'sec_how',
      type: 'steps',
      visible: true,
      heading: 'How It Works',
      subheading: 'From inquiry to delivery — simple, transparent, reliable',
      items: [
        { title: 'Share Your Brief', description: 'Fill in the inquiry form with your product, fabric, quantity and timelines.', icon: 'fa-paper-plane' },
        { title: 'We Review & Quote', description: 'Our team studies your requirement and prepares a tailored quotation.', icon: 'fa-file-invoice-dollar' },
        { title: 'Sampling & Production', description: 'Approve the sample, and we manufacture and deliver with full transparency.', icon: 'fa-truck-fast' },
      ],
    },
    {
      id: 'sec_form',
      type: 'form',
      visible: true,
      heading: 'Share Your Inquiry',
      subheading: "Tell us what you'd like to manufacture and we'll get back with a quote",
    },
    {
      id: 'sec_make',
      type: 'cards',
      visible: true,
      heading: 'What We Make',
      subheading: 'Manufacturing capabilities across categories',
      items: [
        { title: 'Apparel Manufacturing', description: 'End-to-end production of garments at scale, stitched to spec.', icon: 'fa-shirt' },
        { title: 'Custom Fabrics & Prints', description: 'Bespoke fabrics, prints and embroideries for your label.', icon: 'fa-scroll' },
        { title: 'Private Label', description: 'Build your own brand with our white-label manufacturing.', icon: 'fa-tag' },
        { title: 'Bulk Orders', description: 'Flexible MOQs and reliable timelines for large quantities.', icon: 'fa-boxes-stacked' },
      ],
    },
    {
      id: 'sec_why',
      type: 'cards',
      visible: true,
      heading: 'Why Choose Us',
      subheading: 'A manufacturing partner you can rely on',
      items: [
        { title: 'Flexible MOQs', description: 'Start small or scale big — quantities that suit your business.', icon: 'fa-layer-group' },
        { title: 'Premium Quality', description: 'Carefully sourced materials and rigorous quality checks.', icon: 'fa-medal' },
        { title: 'Transparent Pricing', description: 'Clear, itemised quotations with no hidden costs.', icon: 'fa-hand-holding-dollar' },
        { title: 'On-time Delivery', description: 'Dependable production schedules and worldwide shipping.', icon: 'fa-truck' },
      ],
    },
  ],
  cta: {
    heading: 'Have a Project in Mind?',
    subheading: 'Send us your requirement and our team will prepare a tailored quotation for you.',
    buttonText: 'Request a Quote Now',
  },
};

/** Merge stored content with defaults so missing keys never break the page. */
export function normalizeInquiryContent(raw: unknown): InquiryPageContent {
  if (!raw || typeof raw !== 'object') return DEFAULT_INQUIRY_CONTENT;
  const data = raw as Partial<InquiryPageContent>;
  const sections = Array.isArray(data.sections) && data.sections.length
    ? (data.sections as InquirySection[])
    : DEFAULT_INQUIRY_CONTENT.sections;
  return {
    hero: { ...DEFAULT_INQUIRY_CONTENT.hero, ...(data.hero || {}) },
    sections,
    cta: { ...DEFAULT_INQUIRY_CONTENT.cta, ...(data.cta || {}) },
  };
}
