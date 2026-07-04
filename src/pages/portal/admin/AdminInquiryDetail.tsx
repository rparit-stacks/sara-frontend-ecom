import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminShell from '@/components/portal/AdminShell';
import { Pill } from '@/components/portal/Pill';
import { Sym } from '@/components/portal/Sym';
import { manufacturingApi } from '@/lib/api';
import { formatInquiryDate, statusLabel } from '@/components/inquiry/inquiryUtils';
import StageStepper from '@/components/manufacturing/StageStepper';
import { defaultStatusFor, type StageKey } from '@/components/manufacturing/stages';

const humanize = (k: string) => k.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const isImageUrl = (v: unknown): v is string =>
  typeof v === 'string' &&
  (/^data:image\//.test(v) || (/^(https?:)?\/\//.test(v) && /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i.test(v)));

const isFileUrl = (v: unknown): v is string =>
  typeof v === 'string' && /^(https?:)?\/\//.test(v) && !isImageUrl(v);

function ValueDisplay({ value }: { value: unknown }) {
  const arr = Array.isArray(value) ? value : [value];
  const images = arr.filter(isImageUrl);
  const files = arr.filter((v) => isFileUrl(v));
  const text = arr.filter((v) => !isImageUrl(v) && !isFileUrl(v) && v != null && v !== '');

  return (
    <div className="space-y-2">
      {text.length > 0 && (
        <p className="text-[14px] text-foreground whitespace-pre-wrap">{text.map((v) => String(v)).join(', ')}</p>
      )}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <a key={i} href={src} target="_blank" rel="noreferrer" className="block">
              <img src={src} alt="" className="w-28 h-28 object-cover rounded-lg border" style={{ borderColor: 'var(--p-outline-variant)' }} />
            </a>
          ))}
        </div>
      )}
      {files.map((src, i) => (
        <a key={i} href={src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] underline" style={{ color: 'var(--p-primary)' }}>
          <Sym name="attach_file" className="text-[16px]" /> {String(src).split('/').pop()}
        </a>
      ))}
    </div>
  );
}

export default function PortalAdminInquiryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const inquiryId = Number(id);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState('');

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
    if (inq.status === 'NEW') statusMutation.mutate({ status: 'REVIEWING' });
    navigate(`/portal-admin/quote-editor/new?${params.toString()}`);
  };

  const replyEmail = () => {
    if (!inq?.clientEmail) { toast.error('No client email on this inquiry'); return; }
    const subject = `Re: Your inquiry ${inq.reference}`;
    const body = `Hi ${inq.clientName || ''},\n\nThank you for your inquiry (${inq.reference}).\n\n`;
    window.location.href = `mailto:${inq.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const valueEntries = inq ? Object.entries(inq.values || {}).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0)) : [];

  return (
    <AdminShell title="Inquiry">
      {isLoading || !inq ? (
        <div className="flex items-center justify-center py-20" style={{ color: 'var(--p-on-surface-variant)' }}>
          <Sym name="progress_activity" className="text-[28px] animate-spin" />
        </div>
      ) : (
        <div className="p-5 sm:p-8 max-w-5xl mx-auto">
          <button onClick={() => navigate('/portal-admin/inquiries')} className="text-[13px] font-semibold flex items-center gap-1.5 mb-4" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="arrow_back" className="text-[18px]" /> All inquiries
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border rounded-xl p-6" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold opacity-60">{inq.reference}</span>
                      <Pill label={statusLabel(inq.status)} />
                      {inq.source === 'CUSTOM_DESIGN' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#924623]/10 text-[#924623]">
                          Custom Design
                        </span>
                      )}
                    </div>
                    <h2 className="font-bold text-[22px] mt-1">{inq.brand || inq.clientName || inq.reference}</h2>
                    <p className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>
                      Received {formatInquiryDate(inq.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mt-5 pt-5 border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <Info label="Contact" value={inq.clientName || '—'} icon="person" />
                  <Info label="Email" value={inq.clientEmail || '—'} icon="mail" />
                  <Info label="Phone" value={inq.clientPhone || '—'} icon="call" />
                </div>

                {inq.accountEmail && (
                  <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sym name="verified_user" className="text-[18px]" style={{ color: '#924623' }} />
                      <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>Account holder (signed-in)</span>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <Info label="Account name" value={inq.accountName || '—'} icon="badge" />
                      <Info label="Account email" value={inq.accountEmail} icon="alternate_email" />
                      <Info label="Account phone" value={inq.accountPhone || '—'} icon="smartphone" />
                    </div>
                  </div>
                )}
              </div>

              {/* Project stage */}
              <div className="border rounded-xl p-6" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <h3 className="font-bold text-[15px] mb-5">Project stage</h3>
                <StageStepper
                  stage={inq.currentStage}
                  status={inq.currentStatus}
                  editable
                  onStageChange={(stage: StageKey) => stageMutation.mutate({ stage, status: defaultStatusFor(stage) })}
                  onStatusChange={(status) => stageMutation.mutate({ status })}
                />
              </div>

              {/* Submitted details */}
              <div className="border rounded-xl p-6" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <h3 className="font-bold text-[15px] mb-4">Submitted details</h3>
                {valueEntries.length === 0 ? (
                  <p className="text-[13px]" style={{ color: 'var(--p-on-surface-variant)' }}>No field values submitted.</p>
                ) : (
                  <div className="space-y-4">
                    {valueEntries.map(([key, val]) => (
                      <div key={key} className="grid sm:grid-cols-[180px_1fr] gap-1 sm:gap-4">
                        <label className="text-[12px] font-semibold uppercase pt-0.5" style={{ color: 'var(--p-on-surface-variant)' }}>{humanize(key)}</label>
                        <ValueDisplay value={val} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {inq.adminNote && (
                <div className="border rounded-xl p-5" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
                  <h3 className="font-bold text-[13px] mb-1 flex items-center gap-1.5"><Sym name="sticky_note_2" className="text-[16px]" /> Internal note</h3>
                  <p className="text-[13px] whitespace-pre-wrap">{inq.adminNote}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="border rounded-xl p-5 sticky top-4" style={{ borderColor: 'var(--p-outline-variant)' }}>
                <h3 className="font-bold text-[14px] mb-3">Actions</h3>
                <div className="space-y-2">
                  <button onClick={readyQuote} className="w-full py-2.5 rounded-lg text-[14px] font-semibold text-white flex items-center justify-center gap-2 hover:brightness-110" style={{ background: 'var(--p-primary)' }}>
                    <Sym name="request_quote" className="text-[18px]" /> Ready a quotation
                  </button>
                  <button onClick={replyEmail} className="w-full py-2.5 rounded-lg text-[14px] font-semibold border flex items-center justify-center gap-2" style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}>
                    <Sym name="mail" className="text-[18px]" /> Reply by email
                  </button>
                  {inq.status === 'NEW' && (
                    <button onClick={() => statusMutation.mutate({ status: 'REVIEWING' })} className="w-full py-2.5 rounded-lg text-[14px] font-semibold border flex items-center justify-center gap-2" style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}>
                      <Sym name="visibility" className="text-[18px]" /> Mark as reviewing
                    </button>
                  )}
                  <button onClick={() => { setReason(inq.adminNote || ''); setDeclineOpen((o) => !o); }} className="w-full py-2.5 rounded-lg text-[14px] font-semibold border flex items-center justify-center gap-2" style={{ borderColor: 'var(--p-outline)', color: 'var(--p-error)' }}>
                    <Sym name="block" className="text-[18px]" /> Decline with answer
                  </button>
                </div>

                {declineOpen && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--p-outline-variant)' }}>
                    <label className="text-[12px] font-semibold uppercase" style={{ color: 'var(--p-on-surface-variant)' }}>Reason for the client</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                      placeholder="Explain why this inquiry can't be taken up…"
                      className="w-full mt-1 px-3 py-2 rounded-lg border text-[13px] outline-none resize-none"
                      style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-lowest)' }}
                    />
                    <button
                      onClick={() => statusMutation.mutate({ status: 'DECLINED', note: reason })}
                      disabled={statusMutation.isPending}
                      className="w-full mt-2 py-2.5 rounded-lg text-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background: 'var(--p-error)' }}
                    >
                      Confirm decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase flex items-center gap-1" style={{ color: 'var(--p-on-surface-variant)' }}>
        <Sym name={icon} className="text-[14px]" /> {label}
      </label>
      <p className="text-[14px] mt-0.5 break-words">{value}</p>
    </div>
  );
}
