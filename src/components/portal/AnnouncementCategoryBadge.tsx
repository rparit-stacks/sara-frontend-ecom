import { announcementCategoryLabel } from '@/lib/portalChatConstants';

const COLORS: Record<string, string> = {
  INQUIRY: '#0d6e8a',
  QUOTATION: '#6b4c9a',
  INVOICE: '#b45309',
  DESIGN: '#00676a',
  SAMPLING: '#7c3aed',
  PRODUCTION: '#c2410c',
  DELIVERY: '#15803d',
};

export default function AnnouncementCategoryBadge({ category }: { category?: string | null }) {
  if (!category) return null;
  const label = announcementCategoryLabel(category);
  const bg = COLORS[category] || 'var(--p-primary)';
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white shrink-0"
      style={{ background: bg }}
    >
      {label}
    </span>
  );
}
