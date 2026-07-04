import PortalShell from '@/components/portal/PortalShell';
import ProjectSidebar from '@/components/portal/ProjectSidebar';
import { Sym } from '@/components/portal/Sym';

const LINES = [
  { desc: 'Initial Sampling Cost', detail: 'Per prototype iteration', cost: '$150.00' },
  { desc: 'Unit Manufacturing Cost', detail: 'Labor & Sourcing', cost: '$45.00' },
  { desc: 'Minimum Order Quantity (MOQ)', detail: 'Volume commitment', cost: '500 units' },
];

const VERSIONS = [
  { v: 'Version 2.0 (Active)', note: 'Adjusted fabric surcharge for eco-silk blend. Updated MOQ based on production capacity.', date: 'Oct 24, 2026', active: true },
  { v: 'Version 1.0', note: 'Initial quote generation based on preliminary tech pack.', date: 'Oct 18, 2026', active: false },
];

export default function PortalQuotation() {
  return (
    <PortalShell active="home">
      <ProjectSidebar active="quotation" />

      {/* ---- Main: financial breakdown ---- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative" style={{ background: 'var(--p-surface-container-lowest)' }}>
        <div className="h-14 px-6 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <div className="flex items-center gap-3">
            <Sym name="lock" className="text-[18px]" />
            <h2 className="font-display text-[18px]">SS-2026-0001 · Quotation</h2>
          </div>
          <div className="flex items-center gap-3">
            <Sym name="info" className="cursor-pointer" style={{ color: 'var(--p-on-surface-variant)' }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10">
          {/* status + headline */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--p-secondary)' }} />
              <span className="text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--p-secondary)' }}>Quotation Sent — Awaiting Approval</span>
            </div>
            <h1 className="font-display text-[44px] leading-tight" style={{ color: 'var(--p-on-surface)' }}>Financial Breakdown</h1>
            <p className="text-[18px] max-w-2xl" style={{ color: 'var(--p-on-surface-variant)' }}>
              Comprehensive production estimate for the Spring/Summer 2026 tailored collection. Pricing reflects premium textile sourcing and artisan craftsmanship.
            </p>
            <div className="flex gap-4 pt-2">
              <button className="px-8 py-3 text-white text-[12px] font-semibold uppercase tracking-widest transition-all hover:shadow-lg active:scale-[0.98] rounded" style={{ background: 'var(--p-primary)' }}>
                Approve Quotation
              </button>
              <button className="px-8 py-3 border text-[12px] font-semibold uppercase tracking-widest transition-colors rounded" style={{ borderColor: 'var(--p-outline)', color: 'var(--p-on-surface)' }}>
                Request Revision
              </button>
            </div>
          </div>

          {/* breakdown card */}
          <div className="border overflow-hidden max-w-4xl luxury-shadow rounded" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
            <div className="px-8 py-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--p-outline-variant)', background: 'var(--p-surface-bright)' }}>
              <h3 className="font-bold text-[20px]">Unit Analysis</h3>
              <span className="text-[12px] font-semibold" style={{ color: 'var(--p-on-surface-variant)' }}>CURRENCY: USD</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--p-outline-variant)' }}>
                  <th className="px-8 py-5 text-[12px] font-semibold uppercase tracking-widest" style={{ color: 'var(--p-on-surface-variant)' }}>Description</th>
                  <th className="px-8 py-5 text-[12px] font-semibold uppercase tracking-widest text-right" style={{ color: 'var(--p-on-surface-variant)' }}>Details</th>
                  <th className="px-8 py-5 text-[12px] font-semibold uppercase tracking-widest text-right" style={{ color: 'var(--p-on-surface-variant)' }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {LINES.map((l) => (
                  <tr key={l.desc} className="border-b" style={{ borderColor: 'rgba(218,193,184,0.3)' }}>
                    <td className="px-8 py-6 text-[16px]">{l.desc}</td>
                    <td className="px-8 py-6 text-[14px] text-right italic" style={{ color: 'var(--p-on-surface-variant)' }}>{l.detail}</td>
                    <td className="px-8 py-6 text-[20px] font-semibold text-right">{l.cost}</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--p-surface-container-low)' }}>
                  <td className="px-8 py-8 text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--p-primary)' }}>Total Project Estimate</td>
                  <td />
                  <td className="px-8 py-8 font-display text-[24px] text-right" style={{ color: 'var(--p-primary)' }}>$22,650.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* docs + advisory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl pb-12">
            <div className="space-y-4">
              <h3 className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: 'var(--p-on-surface-variant)' }}>Official Documentation</h3>
              <div className="border p-6 flex items-center justify-between group cursor-pointer transition-colors rounded" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-14 border flex items-center justify-center" style={{ background: 'var(--p-surface-container-high)', borderColor: 'var(--p-outline-variant)', color: 'var(--p-primary)' }}>
                    <Sym name="description" className="text-[24px]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[14px]">SS-2026-0001_Official_Quote_v2.pdf</p>
                    <p className="text-[12px]" style={{ color: 'var(--p-on-surface-variant)' }}>2.4 MB</p>
                  </div>
                </div>
                <Sym name="download" style={{ color: 'var(--p-on-surface-variant)' }} />
              </div>
            </div>
            <div className="border p-6 flex flex-col justify-between rounded" style={{ background: 'rgba(224,229,204,0.3)', borderColor: 'rgba(92,97,77,0.2)' }}>
              <div>
                <h4 className="text-[12px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--p-on-secondary-fixed-variant)' }}>Finance Advisory</h4>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--p-on-secondary-fixed-variant)' }}>
                  Valid for 15 calendar days. Pricing subject to market fluctuations if approval is delayed.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[14px]" style={{ color: 'var(--p-on-secondary-fixed-variant)' }}>
                <Sym name="info" className="text-[16px]" />
                <span className="underline cursor-pointer font-semibold">Terms & Conditions</span>
              </div>
            </div>
          </div>
        </div>

        {/* composer */}
        <div className="px-6 pb-6 pt-2">
          <div className="border rounded-lg overflow-hidden shadow-sm focus-within:border-current transition-all" style={{ borderColor: 'var(--p-outline)', background: 'var(--p-surface-container-lowest)' }}>
            <div className="px-2 py-1 flex items-center gap-1 border-b" style={{ background: 'var(--p-surface-container-low)', borderColor: 'var(--p-outline-variant)' }}>
              {['format_bold', 'format_italic', 'link'].map((i) => (
                <button key={i} className="p-1.5 rounded hover:bg-black/5"><Sym name={i} style={{ color: 'var(--p-on-surface-variant)' }} /></button>
              ))}
            </div>
            <textarea className="w-full px-4 py-3 bg-transparent border-none outline-none focus:ring-0 resize-none text-[15px] h-12" placeholder="Send a message regarding this quote…" />
            <div className="px-3 pb-2 flex justify-end">
              <button className="text-white p-2 rounded hover:brightness-110" style={{ background: 'var(--p-primary)' }}><Sym name="send" /></button>
            </div>
          </div>
        </div>
      </main>

      {/* ---- Right: revision history ---- */}
      <aside className="hidden xl:flex flex-col w-80 border-l shrink-0" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)' }}>
        <div className="h-14 px-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--p-outline-variant)' }}>
          <h3 className="font-bold text-[16px]">Revision History</h3>
          <Sym name="close" className="cursor-pointer" style={{ color: 'var(--p-on-surface-variant)' }} />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {VERSIONS.map((v) => (
            <div key={v.v} className="relative pl-6 border-l-2" style={{ borderColor: v.active ? 'var(--p-primary)' : 'var(--p-outline-variant)' }}>
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-white" style={{ background: v.active ? 'var(--p-primary)' : 'var(--p-outline-variant)' }} />
              <div className="p-4 border rounded-lg" style={{ background: 'var(--p-surface-container-lowest)', borderColor: 'var(--p-outline-variant)', opacity: v.active ? 1 : 0.6 }}>
                <span className="text-[12px] font-semibold" style={{ color: v.active ? 'var(--p-primary)' : 'var(--p-on-surface-variant)' }}>{v.v}</span>
                <p className={`text-[12px] mt-1 leading-relaxed ${v.active ? '' : 'italic'}`} style={{ color: v.active ? 'var(--p-on-surface)' : 'var(--p-on-surface-variant)' }}>{v.note}</p>
                <p className="mt-2 text-[10px]" style={{ color: 'var(--p-on-surface-variant)' }}>{v.date}</p>
                {!v.active && <button className="mt-2 text-[10px] font-bold uppercase hover:underline" style={{ color: 'var(--p-primary)' }}>View Archive</button>}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </PortalShell>
  );
}
