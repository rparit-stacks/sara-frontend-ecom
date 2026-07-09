import { useNavigate } from 'react-router-dom';
import { Sym } from '@/components/portal/Sym';
import { Pill } from '@/components/portal/Pill';
import type { ManufacturingProjectDetailDto } from '@/lib/api';

// Detect image / file values inside submitted form answers.
const isImageUrl = (v: unknown): v is string =>
  typeof v === 'string' &&
  (/^data:image\//.test(v) || (/^(https?:)?\/\//.test(v) && /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i.test(v)));
const isFileUrl = (v: unknown): v is string =>
  typeof v === 'string' && /^(https?:)?\/\//.test(v) && !isImageUrl(v);

/** Render one form answer: text, image thumbnails (new tab), or file links. */
function AnswerValue({ value }: { value: unknown }) {
  const arr = Array.isArray(value) ? value : [value];
  const images = arr.filter(isImageUrl);
  const files = arr.filter((v) => isFileUrl(v));
  const text = arr.filter((v) => !isImageUrl(v) && !isFileUrl(v) && v != null && v !== '');
  return (
    <div className="space-y-2">
      {text.length > 0 && (
        <p className="text-[14px] whitespace-pre-wrap break-words">{text.map((v) => String(v)).join(', ')}</p>
      )}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block" title="Open in new tab">
              <img src={src} alt="" className="w-24 h-24 object-cover rounded-lg border" style={{ borderColor: 'var(--p-outline-variant)' }} />
            </a>
          ))}
        </div>
      )}
      {files.map((src, i) => (
        <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] underline" style={{ color: 'var(--p-primary)' }}>
          <Sym name="attach_file" className="text-[16px]" /> {String(src).split('/').pop()}
        </a>
      ))}
    </div>
  );
}

/** Row in the "client details" card. */
function Detail({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 p-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--p-surface-container-high)' }}>
        <Sym name={icon} className="text-[17px]" style={{ color: 'var(--p-primary)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-on-surface-variant)' }}>{label}</p>
        <p className="text-[14px] font-semibold mt-0.5 break-words">{value?.trim() || <span style={{ color: 'var(--p-on-surface-variant)', fontWeight: 400 }}>—</span>}</p>
      </div>
    </div>
  );
}

/**
 * In-workspace Project Brief. Shows who the client is — a registered Studio Sara
 * account (accountEmail present) is shown as "verified", otherwise we show exactly
 * what they typed into the inquiry form. "Open full inquiry" jumps to the raw
 * submission for the complete field-by-field answers.
 */
export default function ProjectBriefPanel({ project, clientMode }: { project: ManufacturingProjectDetailDto; clientMode?: boolean }) {
  const navigate = useNavigate();
  const isRegistered = !!project.accountEmail;

  // The client's original form answers come from the project detail itself
  // (briefValues) — served by BOTH the admin and client project endpoints, so
  // no admin-only call and no 401 on the client side.
  const answers = project.briefValues
    ? Object.entries(project.briefValues).filter(
        ([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0),
      )
    : [];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="max-w-3xl space-y-6">
        {/* header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--p-on-surface-variant)' }}>{project.code}</span>
            <h2 className="font-display text-[26px] leading-tight mt-1">{project.title || project.brand || 'Project brief'}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Pill label={project.currentStage?.replace(/_/g, ' ') || 'Inquiry'} />
              {project.valueDisplay && <span className="text-[13px] font-semibold" style={{ color: 'var(--p-on-surface-variant)' }}>{project.valueDisplay}</span>}
            </div>
          </div>
          {!clientMode && (
            <button
              type="button"
              onClick={() => navigate(`/portal-admin/inquiries/${project.inquiryId}`)}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold border flex items-center gap-1.5"
              style={{ borderColor: 'var(--p-outline)', color: 'var(--p-primary)' }}
            >
              <Sym name="open_in_new" className="text-[16px]" /> Open full inquiry
            </button>
          )}
        </div>

        {/* client card */}
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
            <div className="flex items-center gap-2">
              <Sym name="account_circle" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
              <h3 className="font-bold text-[14px]">Client details</h3>
            </div>
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={isRegistered
                ? { background: 'var(--p-secondary-container)', color: 'var(--p-on-secondary-container)' }
                : { background: 'var(--p-surface-container-high)', color: 'var(--p-on-surface-variant)' }}
              title={isRegistered
                ? 'This client is signed in with a Studio Sara account — details are verified.'
                : 'Guest inquiry — details are exactly what the visitor typed on the form.'}
            >
              <Sym name={isRegistered ? 'verified' : 'draft'} className="text-[13px]" />
              {isRegistered ? 'Studio Sara account' : 'Guest inquiry'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ background: 'var(--p-outline-variant)' }}>
            {[
              <Detail key="n" icon="person" label="Full name" value={project.clientName} />,
              <Detail key="e" icon="mail" label="Email" value={project.clientEmail} />,
              <Detail key="p" icon="call" label="Phone" value={project.clientPhone} />,
              <Detail key="b" icon="storefront" label="Brand / company" value={project.brand} />,
            ].map((el, i) => (
              <div key={i} style={{ background: 'var(--p-surface-container-lowest)' }}>{el}</div>
            ))}
          </div>
          {isRegistered && project.accountEmail && project.accountEmail !== project.clientEmail && (
            <div className="px-4 py-2.5 text-[12px] border-t flex items-center gap-2" style={{ borderColor: 'var(--p-outline-variant)', color: 'var(--p-on-surface-variant)' }}>
              <Sym name="badge" className="text-[15px]" />
              Signed in as <b className="font-semibold" style={{ color: 'var(--p-on-surface)' }}>{project.accountEmail}</b>
            </div>
          )}
        </div>

        {/* Submitted form answers — shown to admin AND client, from project.briefValues */}
        {answers.length > 0 && (
          <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--p-outline-variant)' }}>
            <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-container-low)' }}>
              <Sym name="assignment" className="text-[18px]" style={{ color: 'var(--p-primary)' }} />
              <h3 className="font-bold text-[14px]">{clientMode ? 'Your brief' : 'Submitted brief'}</h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--p-outline-variant)' }}>
              {answers.map(([key, val]) => (
                <div key={key} className="px-4 py-3" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--p-on-surface-variant)' }}>{key}</p>
                  <AnswerValue value={val} />
                </div>
              ))}
            </div>
          </div>
        )}

        {!clientMode && (
          <p className="text-[12px] flex items-center gap-1.5" style={{ color: 'var(--p-on-surface-variant)' }}>
            <Sym name="info" className="text-[15px]" />
            Uploaded files also appear under the Files tab. Use “Open full inquiry” for the raw submission &amp; timeline.
          </p>
        )}
      </div>
    </div>
  );
}
