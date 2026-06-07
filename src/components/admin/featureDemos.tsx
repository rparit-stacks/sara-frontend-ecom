import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUpload, faWandMagicSparkles, faImage, faHashtag, faShareNodes, faCartArrowDown,
  faPaperPlane, faHeartPulse, faMagnifyingGlassChart, faStamp, faCloudArrowUp, faFile,
  faLink, faQrcode, faHeadset, faRobot, faRulerCombined, faPenToSquare, faPalette,
  faChartLine, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

/**
 * Static, realistic-looking mockups of each premium feature's actual screen.
 * Everything here is INERT — buttons call the page's `onLockedAction`, inputs are
 * disabled. The goal is to *show* what the feature looks like, not run it.
 */

// shared bits ---------------------------------------------------------------
function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>{children}</div>;
}
function FakeInput({ placeholder, value }: { placeholder?: string; value?: string }) {
  return (
    <div className="flex h-10 items-center rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
      {value ?? placeholder}
    </div>
  );
}
function LockBtn({ label, onClick, icon }: { label: string; onClick: () => void; icon?: any }) {
  // Looks enabled, but firing it just opens the paid-plan dialog.
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-tr from-rose-600 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:opacity-95"
    >
      {icon && <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />} {label}
    </button>
  );
}
function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">{children}</span>;
}
function ChatBubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  return (
    <div className={`flex gap-2.5 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {role === 'assistant' && (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-red-600 text-white">
          <FontAwesomeIcon icon={faRobot} className="h-3.5 w-3.5" />
        </span>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
        role === 'user'
          ? 'rounded-br-md bg-rose-600 text-white'
          : 'rounded-bl-md bg-white text-zinc-900 ring-1 ring-black/[0.06] dark:bg-zinc-800 dark:text-zinc-100'
      }`}>
        {children}
      </div>
    </div>
  );
}

type DemoProps = { onLockedAction: () => void };

// per-feature demos ---------------------------------------------------------
export const FEATURE_DEMOS: Record<string, (p: DemoProps) => JSX.Element> = {
  'product-listing': ({ onLockedAction }) => (
    <Panel className="mx-auto max-w-xl !p-0 overflow-hidden">
      {/* Chat header — matches the real AI product assistant */}
      <header className="flex items-center gap-3 border-b border-black/[0.06] bg-white/70 px-5 py-3.5 dark:border-white/10 dark:bg-zinc-900/70">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white">
          <FontAwesomeIcon icon={faWandMagicSparkles} className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-none">AI product assistant</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Answers a few prompts → ready product</p>
        </div>
      </header>

      {/* Conversation */}
      <div className="space-y-3.5 bg-gradient-to-b from-slate-50 via-white to-rose-50 px-5 py-4 dark:from-zinc-900 dark:via-zinc-900 dark:to-red-950/30">
        <ChatBubble role="assistant">Hi! Let’s create your product. What are you selling?</ChatBubble>
        <ChatBubble role="user">Handwoven cotton saree, indigo</ChatBubble>
        <ChatBubble role="assistant">Lovely! I’ve drafted a title, description, price, GST and sizes — review below 👇</ChatBubble>

        {/* AI draft card */}
        <div className="ml-9 rounded-2xl bg-white p-3 text-sm shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-800">
          <p className="font-semibold">Handwoven Cotton Saree — Indigo</p>
          <p className="mt-1 text-xs text-muted-foreground">A breathable handwoven cotton saree in deep indigo with a contrast border…</p>
          <div className="mt-2 flex flex-wrap gap-1.5"><Tag>₹2,499</Tag><Tag>GST 5%</Tag><Tag>S</Tag><Tag>M</Tag><Tag>L</Tag><Tag>XL</Tag></div>
        </div>

        {/* Option chips (inert) */}
        <div className="flex flex-wrap gap-2 pl-9">
          {['Publish', 'Edit price', 'Regenerate'].map((o) => (
            <button key={o} onClick={onLockedAction} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm ring-1 ring-black/[0.08] transition-all hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-700 dark:bg-zinc-800 dark:text-zinc-100">
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 border-t border-black/[0.06] bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-900">
        <div className="flex-1"><FakeInput placeholder="Type a message…" /></div>
        <LockBtn label="Send" icon={faPaperPlane} onClick={onLockedAction} />
      </div>
    </Panel>
  ),

  mockup: ({ onLockedAction }) => (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel>
        <p className="mb-3 text-sm font-semibold">Generate a mockup</p>
        <FakeInput placeholder="Design name (e.g. Floral block print)" />
        <div className="mt-2"><FakeInput placeholder="Fabric (cotton, silk, linen…)" /></div>
        <div className="mt-4"><LockBtn label="Create mockup" icon={faImage} onClick={onLockedAction} /></div>
      </Panel>
      <Panel className="flex items-center justify-center">
        <div className="flex h-44 w-full items-center justify-center rounded-xl bg-gradient-to-tr from-rose-100 to-fuchsia-100 text-rose-400">
          <FontAwesomeIcon icon={faImage} className="h-12 w-12" />
        </div>
      </Panel>
    </div>
  ),

  'social-post': ({ onLockedAction }) => (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel>
        <p className="mb-3 text-sm font-semibold">Post generator</p>
        <FakeInput placeholder="Pick a product…" />
        <div className="mt-2 flex gap-2 text-xs">
          <Tag>Instagram</Tag><Tag>Facebook</Tag>
        </div>
        <div className="mt-4"><LockBtn label="Generate post" icon={faShareNodes} onClick={onLockedAction} /></div>
      </Panel>
      <Panel>
        <div className="h-28 rounded-lg bg-gradient-to-tr from-pink-300 to-orange-300" />
        <p className="mt-2 text-sm">✨ New arrival alert! Handwoven elegance you’ll love.</p>
        <p className="mt-1 text-xs text-pink-600"><FontAwesomeIcon icon={faHashtag} className="mr-1" />saree #handloom #newdrop #ootd</p>
      </Panel>
    </div>
  ),

  'cart-recovery': ({ onLockedAction }) => (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel>
        <p className="mb-3 text-sm font-semibold">Abandoned carts</p>
        {['Riya · ₹3,200 · 2h ago', 'Aman · ₹1,150 · 5h ago', 'Sara · ₹4,799 · 1d ago'].map((c) => (
          <div key={c} className="mb-2 flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <span className="flex items-center gap-2"><FontAwesomeIcon icon={faCartArrowDown} className="h-3.5 w-3.5 text-amber-500" />{c}</span>
          </div>
        ))}
        <div className="mt-3"><LockBtn label="Send recovery messages" icon={faPaperPlane} onClick={onLockedAction} /></div>
      </Panel>
      <Panel>
        <p className="mb-2 text-sm font-semibold">AI message preview</p>
        <div className="rounded-2xl bg-emerald-500 px-3 py-2 text-sm text-white">Hi Riya! Your indigo saree is still waiting 🛒 Here’s 10% off to complete your order →</div>
      </Panel>
    </div>
  ),

  'fault-check': ({ onLockedAction }) => (
    <Panel>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold"><FontAwesomeIcon icon={faHeartPulse} className="mr-1.5 text-emerald-500" />Site health</p>
        <LockBtn label="Run scan" onClick={onLockedAction} />
      </div>
      <div className="mt-4 space-y-2 text-sm">
        {[
          { t: 'Checkout flow', ok: true },
          { t: 'Broken links (2 found)', ok: false },
          { t: 'Page load speed', ok: true },
          { t: 'SEO meta tags (1 missing)', ok: false },
        ].map((r) => (
          <div key={r.t} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span>{r.t}</span>
            <FontAwesomeIcon icon={r.ok ? faHeartPulse : faTriangleExclamation} className={r.ok ? 'text-emerald-500' : 'text-amber-500'} />
          </div>
        ))}
      </div>
    </Panel>
  ),

  seo: ({ onLockedAction }) => (
    <Panel>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold"><FontAwesomeIcon icon={faMagnifyingGlassChart} className="mr-1.5 text-indigo-500" />SEO optimiser</p>
        <LockBtn label="Optimise store" onClick={onLockedAction} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[{ k: 'Google rank', v: '#1', d: 'cotton saree' }, { k: 'AI search', v: 'Cited', d: 'ChatGPT / Gemini' }, { k: 'Meta score', v: '92/100', d: 'optimised' }].map((c) => (
          <div key={c.k} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{c.v}</p>
            <p className="text-xs font-medium">{c.k}</p>
            <p className="text-[11px] text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>
    </Panel>
  ),

  watermark: ({ onLockedAction }) => (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel>
        <p className="mb-3 text-sm font-semibold">Auto-watermark settings</p>
        <FakeInput value="Brand text: STUDIO SARA" />
        <div className="mt-2 flex gap-2 text-xs"><Tag>Bottom-right</Tag><Tag>60% opacity</Tag></div>
        <div className="mt-4"><LockBtn label="Apply to all images" icon={faStamp} onClick={onLockedAction} /></div>
      </Panel>
      <Panel className="flex items-center justify-center">
        <div className="relative h-40 w-40 rounded-xl bg-gradient-to-tr from-zinc-200 to-zinc-100">
          <span className="absolute bottom-2 right-2 text-xs font-black text-zinc-600">STUDIO SARA</span>
        </div>
      </Panel>
    </div>
  ),

  storage: ({ onLockedAction }) => (
    <Panel>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold"><FontAwesomeIcon icon={faCloudArrowUp} className="mr-1.5 text-sky-500" />Customer design storage</p>
        <LockBtn label="Upload file" icon={faUpload} onClick={onLockedAction} />
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-muted"><div className="h-2 w-1/3 rounded-full bg-sky-500" /></div>
      <p className="mt-1 text-xs text-muted-foreground">8.2 GB of 25 GB used</p>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {['saree-design.ai', 'logo.png', 'pattern.pdf', 'mockup.jpg'].map((f) => (
          <div key={f} className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/30 p-3 text-center">
            <FontAwesomeIcon icon={faFile} className="h-5 w-5 text-sky-500" />
            <span className="truncate text-[11px]">{f}</span>
          </div>
        ))}
      </div>
    </Panel>
  ),

  'payment-link': ({ onLockedAction }) => (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel>
        <p className="mb-3 text-sm font-semibold">Create a payment link</p>
        <FakeInput placeholder="Amount (₹)" />
        <div className="mt-2"><FakeInput placeholder="Note (e.g. Custom order advance)" /></div>
        <div className="mt-2 flex gap-2 text-xs"><Tag>UPI</Tag><Tag>Cards</Tag><Tag>Razorpay</Tag></div>
        <div className="mt-4"><LockBtn label="Generate link" icon={faLink} onClick={onLockedAction} /></div>
      </Panel>
      <Panel className="flex flex-col items-center justify-center gap-2">
        <FontAwesomeIcon icon={faQrcode} className="h-20 w-20 text-zinc-700" />
        <p className="text-xs text-muted-foreground">pay.studiosara.in/abc123</p>
      </Panel>
    </div>
  ),

  chatbot: ({ onLockedAction }) => (
    <Panel className="mx-auto max-w-md">
      <p className="mb-3 text-sm font-semibold"><FontAwesomeIcon icon={faHeadset} className="mr-1.5 text-violet-500" />Helpdesk chat</p>
      <div className="space-y-2">
        <div className="mr-auto max-w-[80%] rounded-2xl bg-muted px-3 py-2 text-sm"><FontAwesomeIcon icon={faRobot} className="mr-1.5 text-violet-500" />Hi! How can I help with your order?</div>
        <div className="ml-auto max-w-[80%] rounded-2xl bg-violet-500 px-3 py-2 text-sm text-white">Where is order #1042?</div>
        <div className="mr-auto max-w-[80%] rounded-2xl bg-muted px-3 py-2 text-sm">It’s out for delivery, arriving today 🚚</div>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="flex-1"><FakeInput placeholder="Type a message…" /></div>
        <LockBtn label="Send" icon={faPaperPlane} onClick={onLockedAction} />
      </div>
    </Panel>
  ),

  'size-fit': ({ onLockedAction }) => (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel>
        <p className="mb-3 text-sm font-semibold"><FontAwesomeIcon icon={faRulerCombined} className="mr-1.5 text-teal-500" />Find my size</p>
        <div className="flex gap-2"><div className="flex-1"><FakeInput placeholder="Height" /></div><div className="flex-1"><FakeInput placeholder="Weight" /></div></div>
        <div className="mt-2"><FakeInput placeholder="Usual fit (slim / regular)" /></div>
        <div className="mt-4"><LockBtn label="Recommend size" onClick={onLockedAction} /></div>
      </Panel>
      <Panel className="flex flex-col items-center justify-center">
        <p className="text-sm text-muted-foreground">Recommended</p>
        <p className="text-5xl font-bold text-teal-600">M</p>
        <p className="text-xs text-muted-foreground">94% confidence</p>
      </Panel>
    </div>
  ),

  'product-editor': ({ onLockedAction }) => (
    <Panel className="mx-auto max-w-md">
      <p className="mb-3 text-sm font-semibold"><FontAwesomeIcon icon={faPenToSquare} className="mr-1.5 text-rose-500" />Chat to edit your catalog</p>
      <div className="space-y-2">
        <div className="ml-auto max-w-[80%] rounded-2xl bg-rose-500 px-3 py-2 text-sm text-white">Increase all saree prices by 8%</div>
        <div className="mr-auto max-w-[80%] rounded-2xl bg-muted px-3 py-2 text-sm">Done — updated 128 products ✅</div>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="flex-1"><FakeInput placeholder="Tell the AI what to change…" /></div>
        <LockBtn label="Run" icon={faPaperPlane} onClick={onLockedAction} />
      </div>
    </Panel>
  ),

  'store-themes': ({ onLockedAction }) => (
    <Panel>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold"><FontAwesomeIcon icon={faPalette} className="mr-1.5 text-fuchsia-500" />AI store themes</p>
        <LockBtn label="Generate themes" icon={faWandMagicSparkles} onClick={onLockedAction} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {['from-rose-400 to-pink-500', 'from-indigo-400 to-violet-500', 'from-amber-400 to-orange-500'].map((g, i) => (
          <button key={g} onClick={onLockedAction} className={`h-28 rounded-xl bg-gradient-to-b ${g} shadow transition hover:scale-[1.02]`}>
            <span className="mt-2 inline-block rounded bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">Theme {i + 1}</span>
          </button>
        ))}
      </div>
    </Panel>
  ),
};

// A generic fallback (shouldn't normally be hit).
export function GenericDemo({ onLockedAction }: DemoProps) {
  return (
    <Panel className="flex flex-col items-center gap-3 py-10 text-center">
      <FontAwesomeIcon icon={faChartLine} className="h-10 w-10 text-rose-400" />
      <p className="text-sm text-muted-foreground">Preview of this feature.</p>
      <LockBtn label="Try it" onClick={onLockedAction} />
    </Panel>
  );
}
