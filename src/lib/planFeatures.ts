// ============================================================================
// Plan + feature catalog for the Studio Sara subscription "Plans" page.
//
// Three monthly plans (billed as a 6- or 12-month pack). Each feature carries
// its own "how it works" content + an animation key so the info popup can play
// a small visual demo. Per-plan values can be a boolean, a string (e.g. "50/mo",
// "Weekly", "25 GB") or `false` for "not included".
// ============================================================================

export type PlanCode = 'SPARK' | 'IGNITE' | 'ORBIT';

export interface Plan {
  code: PlanCode;
  name: string;       // marketing name
  emoji: string;
  /** Per-month price in INR (₹). Billed as a 6/12-month pack on checkout. */
  pricePerMonth: number;
  tagline: string;
  recommended?: boolean;
  accent: string;     // tailwind gradient classes for the header
}

export const PLANS: Plan[] = [
  {
    code: 'SPARK',
    name: 'Spark',
    emoji: '🌱',
    pricePerMonth: 2499,
    tagline: 'Get your store moving with everyday AI.',
    accent: 'from-emerald-500 to-green-600',
  },
  {
    code: 'IGNITE',
    name: 'Ignite',
    emoji: '🔥',
    pricePerMonth: 3499,
    tagline: 'Grow faster — more AI, more reach, more sales.',
    accent: 'from-orange-500 to-red-600',
  },
  {
    code: 'ORBIT',
    name: 'Orbit',
    emoji: '🚀',
    pricePerMonth: 3999,
    tagline: 'Everything unlocked — the full Studio Sara engine.',
    recommended: true,
    accent: 'from-violet-500 to-fuchsia-600',
  },
];

// Billing pack options. 12-month carries a small saving message.
export interface BillingOption {
  months: number;
  label: string;
  /** % off the per-month price for committing to this pack (display + math). */
  discountPercent: number;
  badge?: string;
}

export const BILLING_OPTIONS: BillingOption[] = [
  { months: 6, label: '6 months', discountPercent: 0 },
  { months: 12, label: '12 months', discountPercent: 10, badge: 'Save 10%' },
];

// Animation keys the FeatureInfoDialog knows how to render.
export type FeatureAnim =
  | 'product-listing'
  | 'mockup'
  | 'social-post'
  | 'cart-recovery'
  | 'fault-check'
  | 'seo'
  | 'watermark'
  | 'storage'
  | 'payment-link'
  | 'chatbot'
  | 'size-fit'
  | 'product-editor'
  | 'store-themes';

export interface PlanFeature {
  key: string;
  label: string;
  icon: string;            // fontawesome icon name (faXxx -> 'wand-magic-sparkles')
  anim: FeatureAnim;
  /** Short one-liner shown under the ⓘ tooltip / popup header. */
  short: string;
  /** Longer "how it works" paragraph for the popup body. */
  how: string;
  /** Step-by-step bullets for the popup. */
  steps: string[];
  /** Per-plan availability. boolean | string label | false. */
  values: Record<PlanCode, boolean | string>;
  beta?: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  {
    key: 'product-listing',
    label: 'AI Product Listing',
    icon: 'box-open',
    anim: 'product-listing',
    short: 'AI writes price, GST, variants & description — a ready-to-sell product in seconds.',
    how: 'Drop a photo or a few words about the item. The AI assistant fills in a sales-ready title, description, suggested price, GST slab and variants — then you just review and publish. Monthly credits refresh automatically.',
    steps: [
      'Upload an image or type the product name',
      'AI drafts title, description, price, GST & variants',
      'Edit anything you like, then publish',
      'Credits refresh every month',
    ],
    values: { SPARK: '10/mo', IGNITE: '35/mo', ORBIT: '50/mo' },
  },
  {
    key: 'mockup',
    label: 'AI Mockup Generator',
    icon: 'wand-magic-sparkles',
    anim: 'mockup',
    short: 'Design + fabric name → a studio-quality, on-brand product mockup.',
    how: 'Give a design and a fabric name (cotton, silk, linen…) and get a photo-realistic, branded product mockup in seconds. No designer, no Photoshop — perfect for listing pages and ads.',
    steps: [
      'Pick a design and type the fabric',
      'AI renders a studio-quality mockup',
      'Use it on product pages, ads & social',
      'Fresh credits every month',
    ],
    values: { SPARK: '15/mo', IGNITE: '35/mo', ORBIT: '50/mo' },
  },
  {
    key: 'social-post',
    label: 'AI Social Post Generator',
    icon: 'hashtag',
    anim: 'social-post',
    short: 'Turn any product into an Instagram / Facebook creative with caption + hashtags.',
    how: 'Pick a product and the AI builds a ready-to-post creative — a styled image, a catchy caption and smart hashtags. Market your store daily without a social media team.',
    steps: [
      'Select a product',
      'AI styles an image + writes caption & hashtags',
      'Tweak the tone if you want',
      'Post to Instagram / Facebook',
    ],
    values: { SPARK: '10/mo', IGNITE: '35/mo', ORBIT: '50/mo' },
  },
  {
    key: 'cart-recovery',
    label: 'AI Abandoned Cart Recovery',
    icon: 'cart-arrow-down',
    anim: 'cart-recovery',
    short: 'AI brings back customers who left — auto WhatsApp / email + a smart discount.',
    how: 'When a shopper fills a cart and leaves, the AI automatically reaches out on WhatsApp/email — “your [product] is waiting” — with a smart, just-enough discount to win the sale back. Pure recovered revenue, zero effort.',
    steps: [
      'Shopper adds items, then leaves',
      'AI waits, then sends a personalised nudge',
      'Includes a smart discount when needed',
      'Customer returns and checks out',
    ],
    values: { SPARK: true, IGNITE: true, ORBIT: 'Advanced AI Recovery' },
  },
  {
    key: 'fault-check',
    label: 'AI Website Fault Check',
    icon: 'heart-pulse',
    anim: 'fault-check',
    short: 'AI scans your live store for broken pages, slow loads & checkout errors.',
    how: 'The AI continuously checks your live store for broken pages, slow loads, checkout errors and SEO issues — and flags them before customers ever notice. Higher plans scan more often.',
    steps: [
      'AI crawls your live store on a schedule',
      'Finds broken links, slow pages, checkout errors',
      'Flags issues with a clear fix list',
      'Scans monthly → bi-weekly → weekly by plan',
    ],
    values: { SPARK: 'Monthly', IGNITE: 'Bi-Weekly', ORBIT: 'Weekly' },
  },
  {
    key: 'seo',
    label: 'AI SEO Optimization',
    icon: 'magnifying-glass-chart',
    anim: 'seo',
    short: 'Rank #1 — on Google and inside ChatGPT / Gemini AI search.',
    how: 'The AI optimises your titles, descriptions and metadata so your store gets found first — not just on Google, but inside ChatGPT, Gemini and other AI browsers. Your brand value compounds over time.',
    steps: [
      'AI analyses every product & page',
      'Rewrites titles, descriptions & metadata',
      'Optimised for Google + AI search engines',
      'Rankings climb over time',
    ],
    values: { SPARK: false, IGNITE: true, ORBIT: true },
  },
  {
    key: 'watermark',
    label: 'AI Auto-Watermark & Branding',
    icon: 'stamp',
    anim: 'watermark',
    short: 'Every uploaded image is auto-stamped with your branding.',
    how: 'The moment you upload a product image, the AI automatically stamps it with your brand watermark — so every photo is protected and on-brand, with zero manual editing.',
    steps: [
      'Upload any product image',
      'AI applies your watermark & branding instantly',
      'Photos stay protected and consistent',
      'No Photoshop, no manual work',
    ],
    values: { SPARK: false, IGNITE: false, ORBIT: true },
  },
  {
    key: 'storage',
    label: 'Customer Dashboard Storage',
    icon: 'cloud-arrow-up',
    anim: 'storage',
    short: 'Customers store their files & designs and reuse them across the site.',
    how: 'Each customer gets a personal dashboard to upload and store their files and designs (securely on cloud storage). They can reuse those designs anywhere on your website — perfect for custom orders.',
    steps: [
      'Customer uploads files & designs',
      'Stored safely in their private dashboard',
      'Reuse a design on any product or order',
      'Storage scales with your plan',
    ],
    values: { SPARK: false, IGNITE: '10 GB', ORBIT: '50 GB' },
  },
  {
    key: 'payment-link',
    label: 'Payment Collector Link Maker',
    icon: 'link',
    anim: 'payment-link',
    short: 'Create branded UPI / Razorpay payment links — collect money anywhere.',
    how: 'Generate branded payment collection links across UPI, Razorpay and your other gateways. Share them on WhatsApp, social or invoices and collect money instantly — all under your own brand.',
    steps: [
      'Enter an amount & note',
      'Pick UPI / Razorpay / any gateway',
      'Get a branded shareable link or QR',
      'Customer pays, you get notified instantly',
    ],
    values: { SPARK: false, IGNITE: false, ORBIT: true },
  },
  {
    key: 'chatbot',
    label: 'Customer Chatbot / Helpdesk',
    icon: 'headset',
    anim: 'chatbot',
    short: 'Customers chat to manage orders & get help — right on your site.',
    how: 'A built-in chatbot + helpdesk page lets customers track and manage their orders, ask questions and chat with your store directly — cutting support load while keeping shoppers happy.',
    steps: [
      'Customer opens the chat / helpdesk page',
      'Asks about an order or a product',
      'Bot handles common questions instantly',
      'Hands off to you when needed',
    ],
    values: { SPARK: false, IGNITE: false, ORBIT: true },
  },
  {
    key: 'size-fit',
    label: 'AI Size & Fit Recommender',
    icon: 'ruler-combined',
    anim: 'size-fit',
    short: 'Suggests the right size from a few details — fewer returns.',
    how: 'Buyers get the right size suggested from a few quick details. Fewer wrong-size orders means far fewer returns and happier customers.',
    steps: [
      'Buyer enters a few quick details',
      'AI recommends the best-fit size',
      'Confidence shown so they trust it',
      'Wrong-size returns drop',
    ],
    values: { SPARK: false, IGNITE: false, ORBIT: true },
  },
  {
    key: 'product-editor',
    label: 'AI Product Editor',
    icon: 'pen-to-square',
    anim: 'product-editor',
    short: 'Edit products just by chatting — bulk price changes, rewrites, restyling.',
    how: 'Edit any product just by chatting — bulk price changes, description rewrites, restyling and more. The AI does the heavy lifting across your whole catalog.',
    steps: [
      'Type what you want changed',
      'AI applies it across the catalog',
      'Bulk price edits, rewrites, restyling',
      'Review & confirm before it saves',
    ],
    values: { SPARK: false, IGNITE: false, ORBIT: true },
    beta: true,
  },
  {
    key: 'store-themes',
    label: 'AI Store Themes',
    icon: 'palette',
    anim: 'store-themes',
    short: 'Generate fresh, on-brand store themes with AI in seconds.',
    how: 'Generate fresh, on-brand store themes with AI in seconds — switch the whole look of your store without a designer.',
    steps: [
      'Describe the vibe you want',
      'AI generates on-brand theme options',
      'Preview them live on your store',
      'Apply your favourite in one click',
    ],
    values: { SPARK: false, IGNITE: false, ORBIT: true },
    beta: true,
  },
];
