import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell from '@/components/portal/AdminShell';
import { Pill } from '@/components/portal/Pill';
import { Sym } from '@/components/portal/Sym';
import { PaAvatar } from '@/components/portal/LedgerList';
import { manufacturingApi } from '@/lib/api';
import { formatInquiryDate, statusLabel } from '@/components/inquiry/inquiryUtils';
import StageStepper from '@/components/manufacturing/StageStepper';
import { defaultStatusFor, type StageKey } from '@/components/manufacturing/stages';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { P } from '@/lib/adminPermissionCodes';
import { AskAdminAiButton } from '@/components/admin-ai-chat';

const humanize = (k: string) => k.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const isImageUrl = (v: unknown): v is string =>
  typeof v === 'string' &&
  (/^data:image\//.test(v) ||
    (/^(https?:)?\/\//.test(v) &&
      (/\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i.test(v) || v.includes('cloudinary.com'))));

const isFileUrl = (v: unknown): v is string =>
  typeof v === 'string' && /^(https?:)?\/\//.test(v) && !isImageUrl(v);

/** Some upload flows (e.g. custom design requests) store multiple URLs joined into one comma-separated string rather than an array — split those back out before classifying. */
function expandValues(value: unknown): unknown[] {
  const arr = Array.isArray(value) ? value : [value];
  return arr.flatMap((v) =>
    typeof v === 'string' && v.includes(',') && v.split(',').filter((s) => isImageUrl(s.trim()) || isFileUrl(s.trim())).length > 1
      ? v.split(',').map((s) => s.trim()).filter(Boolean)
      : [v],
  );
}

/** Field keys expected to hold an uploaded file/image — a non-URL value under one of these
 *  is never genuine free text, it's a pre-fix AI-chat submission that stored a hallucinated
 *  placeholder instead of the real URL (see InquiryCreationTool.attachUploadedImages on the
 *  backend). Showing that raw string reads as a confusing internal id, so it's replaced with
 *  a plain "unavailable" note instead. */
const MEDIA_FIELD_KEYS = new Set(['reference image', 'reference images']);

export default function PortalAdminInquiryDetail() {
  const { hasAny } = useAdminPermissions();
  const canUpdateStatus = hasAny(P.PORTAL_INQUIRIES_UPDATE_STATUS);
  const canUpdateStage = hasAny(P.PORTAL_INQUIRIES_UPDATE_STAGE);
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const inquiryId = Number(id);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const { data: inq, isLoading } = useQuery({
    queryKey: ['admin-inquiry', inquiryId],
    queryFn: () => manufacturingApi.getInquiry(inquiryId),
    enabled: !!inquiryId,
  });

  const stageMutation = useMutation({
    mutationFn: ({ stage, status }: { stage?: string; status?: string }) =>
      manufacturingApi.updateInquiryStage(inquiryId, stage, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-inquiry', inquiryId] });
      qc.invalidateQueries({ queryKey: ['admin-inquiries'] });
      toast.success('Stage updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update stage'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: string; note?: string }) =>
      manufacturingApi.updateInquiryStatus(inquiryId, status, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-inquiry', inquiryId] });
      qc.invalidateQueries({ queryKey: ['admin-inquiries'] });
      setDeclineOpen(false);
      toast.success('Inquiry updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update'),
  });

  const readyQuote = () => {
    if (!inq) return;
    const params = new URLSearchParams({
      inquiry: String(inq.id),
      inquiryRef: inq.reference,
      clientName: inq.clientName || inq.brand || '',
      clientEmail: inq.clientEmail || '',
    });
    if (inq.status === 'NEW' && canUpdateStatus) statusMutation.mutate({ status: 'REVIEWING' });
    navigate(`/portal-admin/quote-editor/new?${params.toString()}`);
  };

  const replyEmail = () => {
    if (!inq?.clientEmail) { toast.error('No client email on this inquiry'); return; }
    const subject = `Re: Your inquiry ${inq.reference}`;
    const body = `Hi ${inq.clientName || ''},\n\nThank you for your inquiry (${inq.reference}).\n\n`;
    window.location.href = `mailto:${inq.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const { texts, images, files, missingMedia } = useMemo(() => {
    const texts: { key: string; value: string }[] = [];
    const images: { src: string; label: string }[] = [];
    const files: { src: string; label: string }[] = [];
    let missingMedia = false;
    const known = new Set([inq?.clientName, inq?.clientEmail, inq?.clientPhone, inq?.accountName, inq?.accountEmail, inq?.accountPhone, inq?.brand].filter(Boolean).map((v) => String(v).trim().toLowerCase()));
    const seen = new Set<string>();
    for (const [key, val] of Object.entries(inq?.values || {})) {
      if (val == null || val === '' || (Array.isArray(val) && val.length === 0)) continue;
      const arr = expandValues(val);
      const isMedia = MEDIA_FIELD_KEYS.has(key.trim().toLowerCase());
      const txt = arr.filter((v) => !isImageUrl(v) && !isFileUrl(v) && v != null && v !== '');
      arr.filter(isImageUrl).forEach((src) => images.push({ src, label: humanize(key) }));
      arr.filter(isFileUrl).forEach((src) => files.push({ src, label: String(src).split('/').pop() || 'File' }));
      if (txt.length) {
        if (isMedia) missingMedia = true;
        else {
          const value = txt.map((v) => String(v)).join(', ');
          const norm = value.trim().toLowerCase();
          // Skip what the Contact card already shows, and exact repeats of the same value.
          if (!known.has(norm) && !seen.has(norm)) { seen.add(norm); texts.push({ key, value }); }
        }
      }
    }
    return { texts, images, files, missingMedia };
  }, [inq]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, images.length]);

  const copy = (v: string) => { void navigator.clipboard?.writeText(v); toast.success('Copied'); };
  const GALLERY_LIMIT = 12;
  const visibleImages = showAll ? images : images.slice(0, GALLERY_LIMIT);


  const name = inq ? inq.brand || inq.clientName || inq.reference : '';
  const btn = 'px-3.5 py-2 rounded-lg text-[13px] font-semibold border inline-flex items-center gap-1.5 transition active:scale-[0.97]';

  return (
    <AdminShell title="Inquiry">
      {isLoading || !inq ? (
        <div className="flex items-center justify-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
          <Sym name="progress_activity" className="text-[28px] animate-spin" />
        </div>
      ) : (
        <div className="p-5 sm:p-8 max-w-6xl mx-auto">
          <button onClick={() => navigate('/portal-admin/inquiries')} className="text-[13px] font-semibold flex items-center gap-1.5 mb-3" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="arrow_back" className="text-[18px]" /> All inquiries
          </button>

          {/* Header: who, status and every action in one place */}
          <div className="pa-card" style={{ padding: 20 }}>
            <div className="flex flex-wrap items-center gap-4">
              <PaAvatar name={name} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display font-bold text-[26px] leading-tight truncate">{name}</h2>
                  <Pill label={statusLabel(inq.status)} />
                  {inq.source === 'CUSTOM_DESIGN' && <span className="pa-chip">Custom design</span>}
                </div>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>
                  {inq.reference} · Received {formatInquiryDate(inq.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AskAdminAiButton
                  size="sm"
                  variant="outline"
                  label="Ask AI"
                  entity={{
                    kind: 'inquiry',
                    id: inq.id,
                    name,
                    pageKey: 'portal.inquiry-detail',
                    userEmail: inq.clientEmail,
                    extra: `Reference=${inq.reference}, status=${inq.status}. Summarize this inquiry and suggest next ops steps.`,
                  }}
                />
                <button onClick={replyEmail} className={btn} style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}>
                  <Sym name="mail" className="text-[16px]" /> Reply
                </button>
                {canUpdateStatus && inq.status === 'NEW' && (
                  <button onClick={() => statusMutation.mutate({ status: 'REVIEWING' })} className={btn} style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}>
                    <Sym name="visibility" className="text-[16px]" /> Start review
                  </button>
                )}
                {canUpdateStatus && (
                  <button onClick={() => { setReason(inq.adminNote || ''); setDeclineOpen((o) => !o); }} className={btn} style={{ borderColor: 'var(--p-outline)', color: 'var(--p-error)' }}>
                    <Sym name="block" className="text-[16px]" /> Decline
                  </button>
                )}
                <button onClick={readyQuote} className={`${btn} text-white hover:brightness-110`} style={{ background: 'var(--p-primary)', borderColor: 'var(--p-primary)' }}>
                  <Sym name="request_quote" className="text-[16px]" /> Ready a quotation
                </button>
              </div>
            </div>

            {canUpdateStatus && declineOpen && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <label className="text-[12px] font-semibold" style={{ color: 'var(--p-on-surface-variant)' }}>Reason shown to the client</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this inquiry can't be taken up…"
                  className="pa-field mt-1 resize-none"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setDeclineOpen(false)} className={btn} style={{ borderColor: 'var(--p-outline)' }}>Cancel</button>
                  <button
                    onClick={() => statusMutation.mutate({ status: 'DECLINED', note: reason })}
                    disabled={statusMutation.isPending}
                    className={`${btn} text-white disabled:opacity-50`}
                    style={{ background: 'var(--p-error)', borderColor: 'var(--p-error)' }}
                  >
                    Confirm decline
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 mt-4 items-start">
            {/* Work area */}
            <div className="space-y-4 min-w-0">
              <div className="pa-card pa-stage" data-ghost="timeline" style={{ padding: 20 }}>
                <h3 className="pa-card-title mb-4">Project stage</h3>
                <StageStepper
                  stage={inq.currentStage}
                  status={inq.currentStatus}
                  editable={canUpdateStage}
                  onStageChange={(stage: StageKey) => stageMutation.mutate({ stage, status: defaultStatusFor(stage) })}
                  onStatusChange={(status) => stageMutation.mutate({ status })}
                />
              </div>

              <div className="pa-card" data-ghost="description" style={{ padding: 20 }}>
                <h3 className="pa-card-title mb-2">Request details</h3>
                {texts.length === 0 ? (
                  <p className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>No written details were submitted.</p>
                ) : (
                  <div className="pa-kv">
                    {texts.map(({ key, value }) => (
                      <div key={key} style={value.length > 70 || value.includes('\n') ? { gridColumn: '1 / -1' } : undefined}>
                        <div className="pa-kv-k">{humanize(key)}</div>
                        <div className="pa-kv-v">{value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {missingMedia && images.length === 0 && (
                  <p className="text-[13px] italic mt-4" style={{ color: 'var(--p-on-surface-variant)' }}>
                    Reference image unavailable: it was submitted before this could be captured correctly.
                  </p>
                )}
              </div>

              {(images.length > 0 || files.length > 0) && (
                <div className="pa-card" data-ghost="photo_library" style={{ padding: 20 }}>
                  <div className="flex items-baseline justify-between mb-4">
                    <h3 className="pa-card-title">
                      Reference files <span className="pa-seg-count">{images.length + files.length}</span>
                    </h3>
                    {images.length > GALLERY_LIMIT && (
                      <button onClick={() => setShowAll((v) => !v)} className="text-[13px] font-semibold" style={{ color: 'var(--p-primary)' }}>
                        {showAll ? 'Show fewer' : `Show all ${images.length}`}
                      </button>
                    )}
                  </div>
                  {images.length > 0 && (
                    <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))' }}>
                      {visibleImages.map((im, i) => {
                        const remaining = images.length - GALLERY_LIMIT;
                        const isLastShown = !showAll && i === GALLERY_LIMIT - 1 && remaining > 0;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => (isLastShown ? setShowAll(true) : setLightbox(i))}
                            className="relative aspect-square rounded-lg overflow-hidden border group transition active:scale-[0.97]"
                            style={{ borderColor: 'var(--p-outline-variant)' }}
                            title={im.label}
                          >
                            <img src={im.src} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            {isLastShown && (
                              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-[18px]" style={{ background: 'rgba(0,0,0,.55)' }}>
                                +{remaining + 1}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {files.length > 0 && (
                    <div className={`flex flex-wrap gap-2 ${images.length ? 'mt-4' : ''}`}>
                      {files.map((f, i) => (
                        <a key={i} href={f.src} target="_blank" rel="noreferrer" className="pa-chip" style={{ textDecoration: 'none' }}>
                          <Sym name="attach_file" className="text-[14px]" /> {f.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Who this is: contact, account, note */}
            <div className="space-y-5 lg:sticky lg:top-4">
              <div className="pa-card" data-ghost="contacts" style={{ padding: 20 }}>
                <h3 className="pa-card-title mb-3">Contact</h3>
                <ContactRow label="Name" value={inq.clientName} />
                <ContactRow label="Email" value={inq.clientEmail} href={inq.clientEmail ? `mailto:${inq.clientEmail}` : undefined} onCopy={copy} />
                <ContactRow label="Phone" value={inq.clientPhone} href={inq.clientPhone ? `tel:${inq.clientPhone}` : undefined} onCopy={copy} />
                {inq.accountEmail && (
                  <>
                    <div className="text-[12px] font-bold mt-4 mb-1 pt-3 border-t" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-primary)' }}>
                      Signed-in account
                    </div>
                    <ContactRow label="Name" value={inq.accountName} />
                    <ContactRow label="Email" value={inq.accountEmail} href={`mailto:${inq.accountEmail}`} onCopy={copy} />
                    <ContactRow label="Phone" value={inq.accountPhone} href={inq.accountPhone ? `tel:${inq.accountPhone}` : undefined} onCopy={copy} />
                  </>
                )}
              </div>

              {inq.adminNote && (
                <div className="pa-card" data-ghost="sticky_note_2" style={{ padding: 20, background: 'var(--p-surface-container-low)' }}>
                  <h3 className="pa-card-title mb-1">Internal note</h3>
                  <p className="text-[13px] whitespace-pre-wrap">{inq.adminNote}</p>
                </div>
              )}
            </div>
          </div>

          {lightbox !== null && images[lightbox] && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.88)' }} onClick={() => setLightbox(null)}>
              <button className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,.15)' }} onClick={() => setLightbox(null)} aria-label="Close">
                <Sym name="close" className="text-[22px]" />
              </button>
              {images.length > 1 && (
                <>
                  <button className="absolute left-4 w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,.15)' }} onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + images.length) % images.length); }} aria-label="Previous">
                    <Sym name="chevron_left" className="text-[26px]" />
                  </button>
                  <button className="absolute right-4 w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,.15)' }} onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % images.length); }} aria-label="Next">
                    <Sym name="chevron_right" className="text-[26px]" />
                  </button>
                </>
              )}
              <img src={images[lightbox].src} alt="" className="max-w-[90vw] max-h-[84vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-[13px]">
                {lightbox + 1} / {images.length} · {images[lightbox].label} ·{' '}
                <a href={images[lightbox].src} target="_blank" rel="noreferrer" className="underline" onClick={(e) => e.stopPropagation()}>Open original</a>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}

function ContactRow({ label, value, href, onCopy }: { label: string; value?: string | null; href?: string; onCopy?: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <div className="text-[11px]" style={{ color: 'var(--p-on-surface-variant)' }}>{label}</div>
        {value ? (
          href ? <a href={href} className="text-[14px] break-all hover:underline" style={{ color: 'var(--p-on-surface)' }}>{value}</a>
            : <div className="text-[14px] break-words">{value}</div>
        ) : <div className="text-[14px]" style={{ color: 'var(--p-on-surface-variant)' }}>—</div>}
      </div>
      {value && onCopy && (
        <button type="button" onClick={() => onCopy(value)} className="shrink-0 p-1.5 rounded-md hover:bg-black/5 active:scale-90 transition" aria-label={`Copy ${label}`}>
          <Sym name="content_copy" className="text-[16px]" />
        </button>
      )}
    </div>
  );
}
