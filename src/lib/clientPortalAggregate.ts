import { clientProjectApi, type PortalAggregateDto } from '@/lib/api';
import { formatMessagePreview } from '@/components/portal/PaymentCard';

export interface ThreadWithProject {
  messageId: number;
  designId?: number | null;
  designName?: string;
  rootAuthorName?: string;
  snippet?: string;
  replyCount: number;
  lastReplyBy?: string;
  unread: boolean;
  createdAt?: string;
  lastReplyAt?: string;
  projectCode: string;
  projectTitle: string;
}

export interface PortalFileItem {
  id: string;
  url: string;
  name: string;
  projectCode: string;
  projectTitle: string;
  authorName?: string;
  createdAt?: string;
}

export interface PortalInvoiceItem {
  id: number;
  reference: string;
  title?: string;
  amount?: number;
  currency?: string;
  status: string;
  quoteReference?: string;
  projectCode: string;
  projectTitle: string;
}

export interface PortalQuoteItem {
  id: number;
  reference: string;
  title?: string;
  total?: number;
  currency?: string;
  status: string;
  projectCode: string;
  projectTitle: string;
}

export type ActivityTone = 'approval' | 'message' | 'stage' | 'payment' | 'file';

export interface PortalActivityItem {
  id: string;
  tone: ActivityTone;
  title: string;
  body: string;
  projectCode: string;
  projectTitle: string;
  time: string;
  sortAt: number;
  unread: boolean;
  to: string;
}

function relTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days}d ago`;
  return d.toLocaleDateString();
}

function fileNameFromUrl(url: string) {
  try {
    const part = url.split('/').pop() || 'file';
    return decodeURIComponent(part.split('?')[0]);
  } catch {
    return 'attachment';
  }
}

function fileKind(url: string): 'pdf' | 'image' | 'doc' | 'video' | 'other' {
  const lower = url.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i.test(lower)) return 'image';
  if (/\.pdf(\?|#|$)/i.test(lower)) return 'pdf';
  if (/\.(mp4|mov|webm)(\?|#|$)/i.test(lower)) return 'video';
  if (/\.(docx?|xlsx?|pptx?)(\?|#|$)/i.test(lower)) return 'doc';
  return 'other';
}

function buildFromAggregate(data: PortalAggregateDto): {
  threads: ThreadWithProject[];
  files: PortalFileItem[];
  invoices: PortalInvoiceItem[];
  quotes: PortalQuoteItem[];
  activities: PortalActivityItem[];
} {
  const threads: ThreadWithProject[] = data.threads.map((t) => ({
    messageId: t.messageId,
    designId: t.designId,
    designName: t.designName,
    rootAuthorName: t.rootAuthorName,
    snippet: t.snippet,
    replyCount: t.replyCount,
    lastReplyBy: t.lastReplyBy,
    unread: t.unread,
    createdAt: t.createdAt,
    lastReplyAt: t.lastReplyAt,
    projectCode: t.projectCode,
    projectTitle: t.projectTitle,
  }));

  const files: PortalFileItem[] = data.attachments.map((a) => ({
    id: `${a.projectCode}-${a.id}`,
    url: a.attachmentUrl,
    name: fileNameFromUrl(a.attachmentUrl),
    projectCode: a.projectCode,
    projectTitle: a.projectTitle,
    authorName: a.authorName,
    createdAt: a.createdAt,
  }));

  const quotes: PortalQuoteItem[] = data.quotes.map((q) => ({
    id: q.id,
    reference: q.reference,
    title: q.title,
    total: q.total,
    currency: q.currency,
    status: q.status,
    projectCode: q.projectCode,
    projectTitle: q.projectTitle,
  }));

  const invoices: PortalInvoiceItem[] = data.invoices.map((inv) => ({
    id: inv.id,
    reference: inv.reference,
    title: inv.title,
    amount: inv.amount,
    currency: inv.currency,
    status: inv.status,
    quoteReference: inv.quoteReference,
    projectCode: inv.projectCode,
    projectTitle: inv.projectTitle,
  }));

  const activities: PortalActivityItem[] = [];

  threads.forEach((t) => {
    if (!t.unread) return;
    activities.push({
      id: `thread-${t.projectCode}-${t.messageId}`,
      tone: 'message',
      title: 'New reply in thread',
      body: `${t.rootAuthorName || 'Team'}: ${formatMessagePreview(t.snippet)}`,
      projectCode: t.projectCode,
      projectTitle: t.projectTitle,
      time: relTime(t.lastReplyAt || t.createdAt),
      sortAt: new Date(t.lastReplyAt || t.createdAt || 0).getTime(),
      unread: true,
      to: `/portal/projects/${encodeURIComponent(t.projectCode)}`,
    });
  });

  quotes.forEach((q) => {
    const st = (q.status || '').toUpperCase();
    if (!st.includes('AWAITING') && !st.includes('SENT') && st !== 'DRAFT') return;
    const project = data.projects.find((p) => p.code === q.projectCode);
    activities.push({
      id: `quote-${q.id}`,
      tone: 'approval',
      title: 'Quotation update',
      body: `${q.reference} — ${q.title || 'Quotation'} (${q.status})`,
      projectCode: q.projectCode,
      projectTitle: q.projectTitle,
      time: relTime(project?.updatedAt),
      sortAt: new Date(project?.updatedAt || 0).getTime(),
      unread: st.includes('AWAITING'),
      to: `/portal/projects/${encodeURIComponent(q.projectCode)}`,
    });
  });

  invoices.forEach((inv) => {
    if ((inv.status || '').toUpperCase() !== 'PENDING') return;
    const project = data.projects.find((p) => p.code === inv.projectCode);
    activities.push({
      id: `inv-${inv.id}`,
      tone: 'payment',
      title: 'Invoice pending',
      body: `${inv.reference} — ${inv.title || 'Invoice'}`,
      projectCode: inv.projectCode,
      projectTitle: inv.projectTitle,
      time: relTime(project?.updatedAt),
      sortAt: new Date(project?.updatedAt || 0).getTime(),
      unread: true,
      to: `/portal/projects/${encodeURIComponent(inv.projectCode)}`,
    });
  });

  files.forEach((f) => {
    activities.push({
      id: f.id,
      tone: 'file',
      title: 'File shared',
      body: f.name,
      projectCode: f.projectCode,
      projectTitle: f.projectTitle,
      time: relTime(f.createdAt),
      sortAt: new Date(f.createdAt || 0).getTime(),
      unread: false,
      to: `/portal/projects/${encodeURIComponent(f.projectCode)}`,
    });
  });

  data.projects.forEach((p) => {
    if (!p.updatedAt) return;
    const title = p.title?.trim() || 'Untitled project';
    activities.push({
      id: `stage-${p.code}-${p.updatedAt}`,
      tone: 'stage',
      title: `Project at ${p.currentStage?.replace(/_/g, ' ') || 'Inquiry'}`,
      body: title,
      projectCode: p.code,
      projectTitle: title,
      time: relTime(p.updatedAt),
      sortAt: new Date(p.updatedAt).getTime(),
      unread: false,
      to: `/portal/projects/${encodeURIComponent(p.code)}`,
    });
  });

  threads.sort((a, b) => {
    const ta = new Date(a.lastReplyAt || a.createdAt || 0).getTime();
    const tb = new Date(b.lastReplyAt || b.createdAt || 0).getTime();
    return tb - ta;
  });
  files.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  activities.sort((a, b) => b.sortAt - a.sortAt);

  return { threads, files, invoices, quotes, activities };
}

/** Single API call — server batches all owned projects. */
export async function loadClientPortalAggregate() {
  const data = await clientProjectApi.aggregate();
  return {
    projects: data.projects,
    ...buildFromAggregate(data),
  };
}

export { fileKind, relTime };
