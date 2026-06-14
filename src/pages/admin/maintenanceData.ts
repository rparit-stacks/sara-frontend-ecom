// ============================================================================
// Data for the (frontend-only) Maintenance Plan showcase page.
// No backend — purely presentational. The single maintenance plan is billed as
// a 6-month or 12-month pack and bundles every maintenance + AI feature.
// ============================================================================
import type { PlanFeature } from '@/lib/planFeatures';
import type { MaintAnim } from '@/components/admin/maintenanceDemos';

export interface BillingOption {
  key: 'sixMonth' | 'twelveMonth';
  months: number;
  total: number; // ₹ for the whole pack
  perMonth: number; // ₹ per month (display)
  label: string;
  badge?: string;
}

export const BILLING_OPTIONS: BillingOption[] = [
  { key: 'sixMonth', months: 6, total: 44999, perMonth: 7500, label: '6 Months' },
  { key: 'twelveMonth', months: 12, total: 71999, perMonth: 6000, label: '12 Months', badge: 'Best value' },
];

/** Every AI feature carries the same monthly credit allowance on this plan. */
export const AI_CREDITS_PER_MONTH = 20;

// ----- AI features (animated demos already exist in FeatureAnimation) -----
// `value` is the per-month allowance shown on each card. Credit-bearing
// features show "20/mo"; always-on features show "Included".
export type AiFeature = PlanFeature & { value: string };

export const AI_FEATURES: AiFeature[] = [
  {
    key: 'advanced-analytics',
    label: 'Advanced Analytics Dashboard',
    icon: 'chart-line',
    anim: 'fault-check',
    value: 'Included',
    short: 'A live, 3D-powered command centre — sales, customers, products & traffic at a glance.',
    how: 'Unlock a full advanced dashboard on top of your store: real-time revenue trends, a 3D customer globe, top products, conversion funnel, cart abandonment, coupon ROI, sales heatmaps and 15+ more widgets — all driven by your live data.',
    steps: [
      'Switch to the Advanced dashboard in one click',
      'See sales, orders, visitors & revenue trends live',
      'Drill into top products, categories & customer geography',
      'Track conversion, cart abandonment & coupon performance',
    ],
  },
  {
    key: 'product-listing',
    label: 'AI Product Listing',
    icon: 'box-open',
    anim: 'product-listing',
    value: '20/mo',
    short: 'AI writes price, GST, variants & description — a ready-to-sell product in seconds.',
    how: 'Drop a photo or a few words about the item. The AI assistant fills in a sales-ready title, description, suggested price, GST slab and variants — then you just review and publish.',
    steps: [
      'Upload an image or type the product name',
      'AI drafts title, description, price, GST & variants',
      'Edit anything you like, then publish',
      '20 fresh product credits every month',
    ],
  },
  {
    key: 'mockup',
    label: 'AI Mockup Generator',
    icon: 'wand-magic-sparkles',
    anim: 'mockup',
    value: '20/mo',
    short: 'Design + fabric name → a studio-quality, on-brand product mockup.',
    how: 'Give a design and a fabric name (cotton, silk, linen…) and get a photo-realistic, branded product mockup in seconds. No designer, no Photoshop.',
    steps: [
      'Pick a design and type the fabric',
      'AI renders a studio-quality mockup',
      'Use it on product pages, ads & social',
      '20 mockup credits every month',
    ],
  },
  {
    key: 'social-post',
    label: 'AI Social Post Generator',
    icon: 'hashtag',
    anim: 'social-post',
    value: '20/mo',
    short: 'Turn any product into an Instagram / Facebook creative with caption + hashtags.',
    how: 'Pick a product and the AI builds a ready-to-post creative — a styled image, a catchy caption and smart hashtags. Market your store daily without a social media team.',
    steps: [
      'Select a product',
      'AI styles an image + writes caption & hashtags',
      'Tweak the tone if you want',
      '20 post credits every month',
    ],
  },
  {
    key: 'cart-recovery',
    label: 'AI Abandoned Cart Recovery',
    icon: 'cart-arrow-down',
    anim: 'cart-recovery',
    value: 'Advanced AI Recovery',
    short: 'AI brings back customers who left — auto WhatsApp / email + a smart discount.',
    how: 'When a shopper fills a cart and leaves, the AI automatically reaches out on WhatsApp/email — “your [product] is waiting” — with a smart, just-enough discount to win the sale back.',
    steps: [
      'Shopper adds items, then leaves',
      'AI waits, then sends a personalised nudge',
      'Includes a smart discount when needed',
      'Customer returns and checks out',
    ],
  },
  {
    key: 'fault-check',
    label: 'AI Website Fault Check',
    icon: 'heart-pulse',
    anim: 'fault-check',
    value: 'Weekly',
    short: 'AI scans your live store for broken pages, slow loads & checkout errors.',
    how: 'The AI continuously checks your live store for broken pages, slow loads, checkout errors and SEO issues — and flags them before customers ever notice.',
    steps: [
      'AI crawls your live store on a schedule',
      'Finds broken links, slow pages, checkout errors',
      'Flags issues with a clear fix list',
      'Weekly scans on this plan',
    ],
  },
  {
    key: 'seo',
    label: 'AI SEO Optimization',
    icon: 'magnifying-glass-chart',
    anim: 'seo',
    value: 'Included',
    short: 'Rank #1 — on Google and inside ChatGPT / Gemini AI search.',
    how: 'The AI optimises your titles, descriptions and metadata so your store gets found first — not just on Google, but inside ChatGPT, Gemini and other AI browsers.',
    steps: [
      'AI analyses every product & page',
      'Rewrites titles, descriptions & metadata',
      'Optimised for Google + AI search engines',
      'Rankings climb over time',
    ],
  },
  {
    key: 'watermark',
    label: 'AI Auto-Watermark & Branding',
    icon: 'stamp',
    anim: 'watermark',
    value: 'Included',
    short: 'Every uploaded image is auto-stamped with your branding.',
    how: 'The moment you upload a product image, the AI automatically stamps it with your brand watermark — so every photo is protected and on-brand, with zero manual editing.',
    steps: [
      'Upload any product image',
      'AI applies your watermark & branding instantly',
      'Photos stay protected and consistent',
      'No Photoshop, no manual work',
    ],
  },
  {
    key: 'storage',
    label: 'Customer Dashboard Storage',
    icon: 'cloud-arrow-up',
    anim: 'storage',
    value: '50 GB',
    short: 'Customers store their files & designs and reuse them across the site.',
    how: 'Each customer gets a personal dashboard to upload and store their files and designs securely. They can reuse those designs anywhere on your website — perfect for custom orders.',
    steps: [
      'Customer uploads files & designs',
      'Stored safely in their private dashboard',
      'Reuse a design on any product or order',
      '50 GB storage included',
    ],
  },
  {
    key: 'payment-link',
    label: 'Payment Collector Link Maker',
    icon: 'link',
    anim: 'payment-link',
    value: 'Included',
    short: 'Create branded UPI / Razorpay payment links — collect money anywhere.',
    how: 'Generate branded payment collection links across UPI, Razorpay and your other gateways. Share them on WhatsApp, social or invoices and collect money instantly.',
    steps: [
      'Enter an amount & note',
      'Pick UPI / Razorpay / any gateway',
      'Get a branded shareable link or QR',
      'Customer pays, you get notified instantly',
    ],
  },
  {
    key: 'chatbot',
    label: 'Customer Chatbot / Helpdesk',
    icon: 'headset',
    anim: 'chatbot',
    value: 'Included',
    short: 'Customers chat to manage orders & get help — right on your site.',
    how: 'A built-in chatbot + helpdesk page lets customers track and manage their orders, ask questions and chat with your store directly — cutting support load while keeping shoppers happy.',
    steps: [
      'Customer opens the chat / helpdesk page',
      'Asks about an order or a product',
      'Bot handles common questions instantly',
      'Hands off to you when needed',
    ],
  },
  {
    key: 'size-fit',
    label: 'AI Size & Fit Recommender',
    icon: 'ruler-combined',
    anim: 'size-fit',
    value: 'Included',
    short: 'Suggests the right size from a few details — fewer returns.',
    how: 'Buyers get the right size suggested from a few quick details. Fewer wrong-size orders means far fewer returns and happier customers.',
    steps: [
      'Buyer enters a few quick details',
      'AI recommends the best-fit size',
      'Confidence shown so they trust it',
      'Wrong-size returns drop',
    ],
  },
  {
    key: 'product-editor',
    label: 'AI Product Editor',
    icon: 'pen-to-square',
    anim: 'product-editor',
    value: 'Beta soon',
    short: 'Edit products just by chatting — bulk price changes, rewrites, restyling.',
    how: 'Edit any product just by chatting — bulk price changes, description rewrites, restyling and more. The AI does the heavy lifting across your whole catalog.',
    steps: [
      'Type what you want changed',
      'AI applies it across the catalog',
      'Bulk price edits, rewrites, restyling',
      'Review & confirm before it saves',
    ],
    beta: true,
  },
  {
    key: 'store-themes',
    label: 'AI Store Themes',
    icon: 'palette',
    anim: 'store-themes',
    value: 'Beta soon',
    short: 'Generate fresh, on-brand store themes with AI in seconds.',
    how: 'Generate fresh, on-brand store themes with AI in seconds — switch the whole look of your store without a designer.',
    steps: [
      'Describe the vibe you want',
      'AI generates on-brand theme options',
      'Preview them live on your store',
      'Apply your favourite in one click',
    ],
    beta: true,
  },
];

// ----- Maintenance features (grouped) -----
export interface MaintFeature {
  key: string;
  title: string;
  icon: string; // lucide-react icon name (resolved in the page/dialog)
  anim: MaintAnim;
  short: string;
  how: string;
  steps: string[];
}

export interface MaintGroup {
  title: string;
  icon: string;
  items: MaintFeature[];
}

export const MAINTENANCE_GROUPS: MaintGroup[] = [
  {
    title: 'Core Maintenance',
    icon: 'wrench',
    items: [
      {
        key: 'bug-fixes',
        title: 'Bug Fixes',
        icon: 'bug',
        anim: 'bug-fix',
        short: 'Any error or glitch fixed promptly.',
        how: 'Whenever something breaks — a broken button, a layout glitch, a checkout error — we fix it quickly so your store keeps running smoothly.',
        steps: ['You report (or we detect) an issue', 'We reproduce & diagnose it', 'Fix is shipped to your live site', 'You get a confirmation'],
      },
      {
        key: 'security-updates',
        title: 'Security Updates',
        icon: 'shield',
        anim: 'security',
        short: 'Regular patches & vulnerability fixes.',
        how: 'We keep your platform, libraries and dependencies patched against the latest vulnerabilities — so attackers never get an easy way in.',
        steps: ['Monitor for new vulnerabilities', 'Test patches safely', 'Apply updates to your site', 'Verify nothing breaks'],
      },
      {
        key: 'advanced-security',
        title: 'Advanced Security',
        icon: 'shield-check',
        anim: 'advanced-security',
        short: 'Firewall, malware scan, brute-force protection.',
        how: 'A web application firewall, regular malware scans and brute-force/login protection guard your store around the clock.',
        steps: ['Firewall filters malicious traffic', 'Scheduled malware scans run', 'Brute-force login attempts blocked', 'Threats flagged & neutralised'],
      },
      {
        key: 'database-maintenance',
        title: 'Database Maintenance',
        icon: 'database',
        anim: 'database',
        short: 'Optimisation, cleanup & indexing.',
        how: 'We keep your database lean and fast — clearing junk, optimising tables and adding the right indexes so queries stay quick as you grow.',
        steps: ['Clean up stale & orphaned data', 'Optimise & defragment tables', 'Add/repair indexes', 'Queries run faster'],
      },
      {
        key: 'performance-optimization',
        title: 'Performance Optimization',
        icon: 'gauge',
        anim: 'performance',
        short: 'Speed & load-time tuning.',
        how: 'We continually tune caching, assets and queries so your pages load fast — better experience, better conversions, better SEO.',
        steps: ['Measure load times', 'Optimise images, caching & code', 'Reduce render-blocking assets', 'Faster pages, happier shoppers'],
      },
      {
        key: 'backup-monitoring',
        title: 'Backup Monitoring',
        icon: 'save',
        anim: 'backups',
        short: 'Daily auto-backups, verified.',
        how: 'Automatic daily backups are taken and verified, so your store and data can always be restored — no matter what happens.',
        steps: ['Daily automatic backup runs', 'Backup integrity verified', 'Stored safely off-site', 'One-click restore if ever needed'],
      },
    ],
  },
  {
    title: 'Server & Infrastructure',
    icon: 'server',
    items: [
      {
        key: 'multi-server',
        title: 'Multi-Server Hosting',
        icon: 'server',
        anim: 'multi-server',
        short: 'Load split across servers — handles spikes, no single point of failure.',
        how: 'Your traffic is balanced across multiple servers, so big spikes are handled smoothly and no single server going down can take your store offline.',
        steps: ['Traffic balanced across servers', 'Spikes absorbed automatically', 'No single point of failure', 'Consistent speed under load'],
      },
      {
        key: 'server-renewal',
        title: 'Server / VPS Renewal Included',
        icon: 'hard-drive',
        anim: 'renewal',
        short: 'Hosting renewal cost covered — nothing extra to pay.',
        how: 'Your hosting / VPS renewal is included in this plan — no surprise bills, no separate hosting invoices to track.',
        steps: ['Hosting renewal tracked for you', 'Renewed before it expires', 'Cost included in the plan', 'Zero downtime from lapses'],
      },
      {
        key: 'monitoring',
        title: '24×7 Server Monitoring',
        icon: 'activity',
        anim: 'monitoring',
        short: 'Uptime alerts the moment anything dips.',
        how: 'We watch your servers around the clock. The instant uptime or response time dips, our team is alerted and acts — often before you notice.',
        steps: ['Servers pinged continuously', 'Anomaly detected instantly', 'Team alerted in real time', 'Issue handled fast'],
      },
      {
        key: 'auto-scaling',
        title: 'Auto Scaling & Failover',
        icon: 'scaling',
        anim: 'scaling',
        short: 'Spin up capacity on spikes; failover if a server drops.',
        how: 'When traffic surges, extra capacity spins up automatically. If a server fails, traffic instantly fails over to a healthy one — your store stays up.',
        steps: ['Spike detected', 'Extra capacity added automatically', 'Failed server bypassed instantly', 'Store stays online & fast'],
      },
      {
        key: 'ssl-renewal',
        title: 'SSL Certificate Renewal',
        icon: 'lock',
        anim: 'ssl',
        short: 'HTTPS always valid, auto-renewed.',
        how: 'Your SSL certificate is auto-renewed before it expires, so your site always shows the secure padlock and never scares customers away.',
        steps: ['Certificate expiry tracked', 'Auto-renewed ahead of time', 'HTTPS padlock stays valid', 'No “not secure” warnings'],
      },
      {
        key: 'cdn',
        title: 'CDN / Fast Delivery',
        icon: 'globe',
        anim: 'cdn',
        short: 'Images & pages served fast, globally.',
        how: 'Your images and pages are served from servers close to each visitor via a global CDN — so the store feels fast everywhere in the world.',
        steps: ['Assets cached on edge servers', 'Visitor served from nearest node', 'Pages load fast globally', 'Less load on your origin server'],
      },
    ],
  },
  {
    title: 'Support',
    icon: 'headset',
    items: [
      {
        key: 'priority-support',
        title: 'Priority Support',
        icon: 'headset',
        anim: 'support',
        short: 'Fast response on a dedicated channel.',
        how: 'You get a dedicated support channel with priority response — your messages jump the queue and get answered fast.',
        steps: ['Message us on your dedicated channel', 'Priority queue — answered fast', 'Tracked to resolution', 'Follow-up to confirm'],
      },
      {
        key: 'emergency-fixes',
        title: 'Emergency Fixes',
        icon: 'siren',
        anim: 'emergency',
        short: 'Site down? Immediate fix, even off-hours.',
        how: 'If your site goes down, we treat it as an emergency and jump on it immediately — even outside business hours.',
        steps: ['Outage detected or reported', 'Immediate response — any hour', 'Root cause fixed', 'Store back online'],
      },
      {
        key: 'health-report',
        title: 'Monthly Health Report',
        icon: 'clipboard-list',
        anim: 'health-report',
        short: 'A full site health report every month.',
        how: 'Every month you get a clear report on your site’s health — uptime, speed, security, backups and what we did — so you always know things are handled.',
        steps: ['We compile the month’s metrics', 'Uptime, speed, security, backups', 'Plus what we fixed & improved', 'Delivered to you monthly'],
      },
    ],
  },
];
