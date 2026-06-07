// ============================================================================
// Single maintenance plan: done-for-you maintenance + multi-server hosting +
// EVERYTHING in the Orbit plan included. Base price is annual.
//
// The buyer also picks a "feature base": Orbit (full price) or Ignite (a bit
// cheaper) — but either way they get Orbit-level feature value. The Ignite
// choice is purely a small discount hook ("Ignite price, Orbit value").
// ============================================================================

export type MaintBase = 'ORBIT' | 'IGNITE';

/** Annual base price (12 months) per feature-base choice, in INR. */
export const MAINT_ANNUAL_BASE: Record<MaintBase, number> = {
  ORBIT: 100000,
  IGNITE: 94000,
};

export const MAINT_BASE_CHOICES: { code: MaintBase; label: string; emoji: string; note: string }[] = [
  { code: 'ORBIT', emoji: '🚀', label: 'Orbit', note: 'Full Orbit plan included' },
  { code: 'IGNITE', emoji: '🔥', label: 'Ignite', note: 'Save a little — still Orbit-level value' },
];

// Billing packs. Discount is applied to the per-month rate, then × months.
export interface MaintBilling {
  months: number;
  label: string;
  discountPercent: number;
  badge?: string;
}

export const MAINT_BILLING: MaintBilling[] = [
  { months: 3, label: '3 months', discountPercent: 0 },
  { months: 6, label: '6 months', discountPercent: 0 },
  { months: 12, label: '12 months', discountPercent: 0 },
];

/** Base monthly rate = annual ÷ 12 (e.g. ₹100000 → ₹8,333/mo). */
export const maintMonthlyBase = (base: MaintBase) => Math.round(MAINT_ANNUAL_BASE[base] / 12);

// What the maintenance plan covers, grouped into sections.
export interface MaintGroup {
  title: string;
  icon: string; // fontawesome name
  items: { label: string; desc?: string }[];
}

export const MAINT_GROUPS: MaintGroup[] = [
  {
    title: 'Core Maintenance',
    icon: 'screwdriver-wrench',
    items: [
      { label: 'Bug Fixes', desc: 'Any error or glitch fixed promptly.' },
      { label: 'Security Updates', desc: 'Regular patches & vulnerability fixes.' },
      { label: 'Advanced Security', desc: 'Firewall, malware scan, brute-force protection.' },
      { label: 'Database Maintenance', desc: 'Optimisation, cleanup & indexing.' },
      { label: 'Performance Optimization', desc: 'Speed & load-time tuning.' },
      { label: 'Backup Monitoring', desc: 'Daily auto-backups, verified.' },
    ],
  },
  {
    title: 'Server & Infrastructure',
    icon: 'server',
    items: [
      { label: 'Multi-Server Hosting', desc: 'Load split across servers — handles spikes, no single point of failure.' },
      { label: 'Server / VPS Renewal Included', desc: 'Hosting renewal cost covered — nothing extra to pay.' },
      { label: '24×7 Server Monitoring', desc: 'Uptime alerts the moment anything dips.' },
      { label: 'Auto Scaling & Failover', desc: 'Spin up capacity on spikes; failover if a server drops.' },
      { label: 'SSL Certificate Renewal', desc: 'HTTPS always valid, auto-renewed.' },
      { label: 'CDN / Fast Delivery', desc: 'Images & pages served fast, globally.' },
    ],
  },
  {
    title: 'Support',
    icon: 'headset',
    items: [
      { label: 'Priority Support', desc: 'Fast response on a dedicated channel.' },
      { label: 'Emergency Fixes', desc: 'Site down? Immediate fix, even off-hours.' },
      { label: 'Monthly Health Report', desc: 'A full site health report every month.' },
    ],
  },
  {
    title: 'Everything in Orbit — included',
    icon: 'rocket',
    items: [
      { label: 'All 13 AI / premium features', desc: 'Full Orbit credits & unlocks — AI listing, mockups, social posts, SEO, watermark, 50 GB storage, payment links, chatbot, size-fit, product editor, store themes & more.' },
      { label: 'Razorpay gateway — free', desc: 'No gateway subscription fee while maintenance is active.' },
      { label: 'Free minor feature additions', desc: 'Small new features & tweaks included as we ship them.' },
    ],
  },
];
