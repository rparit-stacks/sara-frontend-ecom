import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, RotateCw, Sparkles, X } from 'lucide-react';
import { polishApi } from '@/lib/api';

const SEEN_KEY = 'polishIntroSeen';
const MIN_CHARS = 3;

// ---- First-time intro: shown once per visitor. The server remembers it by IP address (not account); localStorage just saves a round trip. ----
type IntroState = 'unknown' | 'checking' | 'seen' | 'pending' | 'active';
let introState: IntroState = (() => {
  try { return localStorage.getItem(SEEN_KEY) === '1' ? 'seen' : 'unknown'; } catch { return 'unknown'; }
})();
const listeners = new Set<() => void>();
const setIntro = (s: IntroState) => { introState = s; listeners.forEach((l) => l()); };

const checkIntro = async () => {
  if (introState !== 'unknown') return;
  setIntro('checking');
  try {
    const { seen } = await polishApi.introSeen();
    if (seen) { try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ } setIntro('seen'); }
    else setIntro('pending');
  } catch {
    setIntro('seen'); // if the server cannot say, do not nag
  }
};

const finishIntro = () => {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
  setIntro('seen');
  polishApi.introDone().catch(() => undefined);
};

const useIntroState = () => {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return introState;
};

const STEPS = [
  { title: 'Write it your way', body: 'Type normally, in English, Hindi or any language. Tap Polish and AI fixes the spelling and grammar, in the same language you wrote.' },
  { title: 'Clear points, you decide', body: 'If you listed several things, they become neat bullet points. You always see the result first, then choose "Use this" or "Keep mine".' },
];

const Spotlight = ({ target, onDone }: { target: HTMLElement | null; onDone: () => void }) => {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const update = () => setRect(target ? target.getBoundingClientRect() : null);
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [target]);

  if (!rect) return null;
  const pad = 6;
  const cardW = Math.min(300, window.innerWidth - 24);
  const left = Math.min(Math.max(12, rect.right - cardW), window.innerWidth - cardW - 12);
  const below = rect.top < 220;
  const top = below ? rect.bottom + 14 : undefined;
  const bottom = below ? undefined : window.innerHeight - rect.top + 14;
  const last = step === STEPS.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[120]" role="dialog" aria-label="What Polish does">
      <div className="absolute rounded-xl ring-2 ring-amber-400 transition-all"
        style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: '0 0 0 9999px rgba(15,23,42,0.6)' }} />
      <div className="absolute rounded-2xl bg-white p-4 shadow-2xl" style={{ left, top, bottom, width: cardW }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">New · Step {step + 1} of {STEPS.length}</p>
        <p className="mt-1 text-base font-semibold text-slate-900">{STEPS[step].title}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{STEPS[step].body}</p>
        <div className="mt-3 flex items-center justify-between">
          <button type="button" onClick={onDone} className="text-sm text-slate-500 hover:text-slate-800">Skip</button>
          <button type="button" onClick={() => (last ? onDone() : setStep(step + 1))}
            className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-600">{last ? 'Got it' : 'Next'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// ---- The button and the preview ----
interface Props {
  /** The text typed so far. */
  value: string;
  /** For editors that are not React-controlled (contenteditable): read the current text at click time. */
  getValue?: () => string;
  /** Called with the polished text when the person taps "Use this". */
  onApply: (text: string) => void;
  /** A few words on where this is being written, for example "contact form message". */
  context?: string;
  disabled?: boolean;
  className?: string;
}

export const PolishAssist = ({ value, getValue, onApply, context, disabled, className = '' }: Props) => {
  const intro = useIntroState();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [original, setOriginal] = useState('');
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const text = value.trim();
  const typed = text.length > 0;

  // The first time anyone types, find out whether this visitor has seen the intro, then show it once.
  useEffect(() => { if (typed) void checkIntro(); }, [typed]);
  useEffect(() => {
    if (typed && introState === 'pending') { setTarget(btnRef.current); setIntro('active'); }
  }, [typed, intro]);

  const run = useCallback(async () => {
    const current = (getValue ? getValue() : value).trim();
    setOriginal(current);
    if (current.length < MIN_CHARS) { setError('Write a little more first.'); setOpen(true); setResult(null); return; }
    setBusy(true); setError(null); setOpen(true); setResult(null);
    try {
      const r = await polishApi.polish(current, context);
      setResult(r.text);
    } catch (e) {
      setError((e as Error)?.message || 'Could not polish that. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [value, getValue, context]);

  const close = () => { setOpen(false); setResult(null); setError(null); };

  if (!typed) return null;

  return (
    <>
      <button ref={btnRef} type="button" disabled={disabled || busy} onClick={run}
        title="Polish with AI: fix grammar and arrange into points"
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 transition hover:bg-amber-100 disabled:opacity-50 ${className}`}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Polish
      </button>

      {intro === 'active' && <Spotlight target={target} onDone={finishIntro} />}

      {open && createPortal(
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-900/40 p-3 sm:items-center" onClick={close}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Polished text">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-base font-semibold text-slate-900"><Sparkles className="h-4 w-4 text-amber-500" /> Polished text</p>
              <button type="button" onClick={close} aria-label="Close" className="rounded p-1 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            {busy && <p className="mt-6 flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" /> Polishing…</p>}
            {error && !busy && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
            {result && !busy && (
              <>
                <p className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">{result}</p>
                <details className="mt-2 text-xs text-slate-500">
                  <summary className="cursor-pointer">Show what you wrote</summary>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-slate-600">{original}</p>
                </details>
              </>
            )}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={close} className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">Keep mine</button>
              {(error || result) && !busy && (
                <button type="button" onClick={run} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"><RotateCw className="h-3.5 w-3.5" /> Try again</button>
              )}
              {result && !busy && (
                <button type="button" onClick={() => { onApply(result); close(); }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-600"><Check className="h-3.5 w-3.5" /> Use this</button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};
