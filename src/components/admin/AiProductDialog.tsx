import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles,
  faPaperPlane,
  faSpinner,
  faImage,
  faCheck,
  faXmark,
  faRobot,
  faTags,
} from '@fortawesome/free-solid-svg-icons';
import { aiProductApi, categoriesApi, mediaApi } from '@/lib/api';

type ChatMsg = { role: 'user' | 'assistant'; content: string; imageUrls?: string[] };

function HeroAvatar({ active }: { active: boolean }) {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-rose-500/10"
          style={{ width: `${100 - i * 26}%`, height: `${100 - i * 26}%` }}
          animate={{ scale: active ? [1, 1.12, 1] : [1, 1.05, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
        />
      ))}
      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30">
        <FontAwesomeIcon icon={faRobot} className="h-6 w-6" />
      </span>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-rose-400"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export function AiProductDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [inputMode, setInputMode] = useState<'options' | 'text' | 'number' | 'upload'>('text');
  const [expectsImage, setExpectsImage] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState<any | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['leaf-categories'],
    queryFn: () => categoriesApi.getLeafCategories(),
    enabled: open,
  });
  const catOptions = (categories as any[]).map((c) => ({ id: c.id, name: c.name }));

  useEffect(() => {
    if (open && messages.length === 0 && !thinking) void send('', true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking, draft, options]);

  const reset = () => {
    setMessages([]); setInput(''); setOptions([]); setExpectsImage(false);
    setPendingImages([]); setDraft(null); setSummary(null); setInputMode('text');
  };

  async function send(text: string, isOpening = false) {
    const trimmed = text.trim();
    if (!isOpening && !trimmed && pendingImages.length === 0) return;

    const next: ChatMsg[] = [...messages];
    if (!isOpening) {
      next.push({
        role: 'user',
        content: trimmed || (pendingImages.length ? '(photos added)' : ''),
        imageUrls: pendingImages.length ? pendingImages : undefined,
      });
      setMessages(next);
    }
    setInput(''); setPendingImages([]); setOptions([]); setExpectsImage(false); setThinking(true);
    try {
      const res = await aiProductApi.chat({ messages: next, categories: catOptions });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.assistantMessage }]);
      setOptions(res.options || []);
      const mode = res.inputMode || (res.expectsImage ? 'upload' : res.options?.length ? 'options' : 'text');
      setInputMode(mode);
      setExpectsImage(!!res.expectsImage || mode === 'upload');
      if ((mode === 'number' || mode === 'text') && res.inputDefault) setInput(res.inputDefault);
      if (res.ready && res.draftProduct) {
        setDraft(res.draftProduct);
        setSummary(res.summary || null);
      }
    } catch (err: any) {
      const msg = extractError(err);
      toast.error(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }]);
    } finally {
      setThinking(false);
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await mediaApi.upload(f, 'products'));
      setPendingImages((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} image(s) ready`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const createProduct = async () => {
    if (!draft) return;
    setCreating(true);
    try {
      const created = await aiProductApi.create(draft);
      toast.success('Product created!');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onOpenChange(false);
      reset();
      if (created?.id) navigate(`/admin-sara/products/edit/${created.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Could not create product');
    } finally {
      setCreating(false);
    }
  };

  const catName = (id: any) => (categories as any[]).find((c) => String(c.id) === String(id))?.name || id;
  const isEmpty = messages.filter((m) => m.role === 'assistant').length === 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="w-[94vw] max-w-2xl gap-0 overflow-hidden rounded-3xl border-0 p-0 shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Create product with AI</DialogTitle>

        <div className="flex h-[80vh] max-h-[760px] flex-col bg-gradient-to-b from-slate-50 via-white to-rose-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-red-950/30">
          {/* Header */}
          <header className="flex shrink-0 items-center gap-3 border-b border-black/[0.06] bg-white/70 px-5 py-3.5 backdrop-blur dark:border-white/10 dark:bg-zinc-900/70">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-none">AI product assistant</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {thinking ? 'Thinking…' : 'Pick options — you confirm numbers & photos.'}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => { onOpenChange(false); reset(); }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
            </button>
          </header>

          {/* Transcript */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
            {isEmpty && !thinking && options.length === 0 ? (
              <div className="flex flex-col items-center pt-6 text-center">
                <HeroAvatar active={thinking} />
                <h2 className="mt-3 text-2xl font-bold tracking-tight">Let’s create your product</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Answer a few quick prompts — the assistant handles price, GST, variants and the description.
                </p>
              </div>
            ) : null}

            <div className="mx-auto max-w-xl space-y-3.5">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2.5`}>
                  {m.role === 'assistant' && (
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-red-600 text-white">
                      <FontAwesomeIcon icon={faRobot} className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                      m.role === 'user'
                        ? 'rounded-br-md bg-rose-600 text-white'
                        : 'rounded-bl-md bg-white text-zinc-900 ring-1 ring-black/[0.06] dark:bg-zinc-800 dark:text-zinc-100'
                    }`}
                  >
                    {m.content}
                    {m.imageUrls && m.imageUrls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.imageUrls.map((u) => (
                          <img key={u} src={u} alt="" className="h-14 w-14 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {thinking && (
                <div className="flex justify-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-red-600 text-white">
                    <FontAwesomeIcon icon={faRobot} className="h-3.5 w-3.5" />
                  </span>
                  <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-black/[0.05] dark:bg-white/10">
                    <TypingDots />
                  </div>
                </div>
              )}

              {/* Option chips */}
              {!thinking && options.length > 0 && !draft && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 pl-9">
                  {options.map((o) => (
                    <button
                      key={o.value + o.label}
                      onClick={() => send(o.value)}
                      className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm ring-1 ring-black/[0.08] transition-all hover:-translate-y-0.5 hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-300 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      {o.label}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Pending images */}
              {pendingImages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-9">
                  {pendingImages.map((u) => (
                    <div key={u} className="relative">
                      <img src={u} alt="" className="h-16 w-16 rounded-lg object-cover" />
                      <button
                        className="absolute -right-1.5 -top-1.5 rounded-full bg-rose-500 p-1 text-white shadow"
                        onClick={() => setPendingImages((p) => p.filter((x) => x !== u))}
                      >
                        <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Ready -> preview */}
              <AnimatePresence>
                {draft && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-white p-5 text-zinc-900 shadow-md ring-1 ring-rose-100 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faTags} className="h-4 w-4 text-rose-500" />
                      <p className="text-sm font-bold">Product preview</p>
                    </div>
                    {summary && <p className="mb-3 text-xs text-muted-foreground">{summary}</p>}
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <Field label="Name" value={draft.name} />
                      <Field label="Category" value={catName(draft.categoryId)} />
                      <Field label="Price" value={draft.price != null ? `₹${draft.price}` : '—'} />
                      {draft.originalPrice != null && <Field label="MRP" value={`₹${draft.originalPrice}`} />}
                      {draft.gstRate != null && <Field label="GST" value={`${draft.gstRate}%`} />}
                      {draft.hsnCode && <Field label="HSN" value={draft.hsnCode} />}
                    </dl>
                    {draft.description && <p className="mt-3 text-xs text-muted-foreground">{draft.description}</p>}

                    {Array.isArray(draft.detailSections) && draft.detailSections.length > 0 && (
                      <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-black/[0.06]">
                        {draft.detailSections.map((d: any, i: number) => (
                          <div key={i} className="flex border-b border-black/[0.05] text-xs last:border-0">
                            <div className="w-1/3 bg-black/[0.03] px-3 py-1.5 font-medium">{d.title}</div>
                            <div className="flex-1 px-3 py-1.5 text-muted-foreground">{d.content}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {Array.isArray(draft.variants) && draft.variants.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {draft.variants.map((v: any) => (
                          <div key={v.name} className="text-xs">
                            <span className="font-medium">{v.name}: </span>
                            {(v.options || []).map((o: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="mr-1">
                                {o.value}
                                {Number(o.priceModifier) > 0 ? ` (+₹${o.priceModifier})` : ''}
                              </Badge>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {Array.isArray(draft.customFields) && draft.customFields.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {draft.customFields.map((c: any, i: number) => (
                          <Badge key={i} variant="outline">
                            {c.label}{c.isRequired ? ' *' : ''} · {c.fieldType || 'text'}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {Array.isArray(draft.media) && draft.media.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {draft.media.map((m: any) => (
                          <img key={m.url} src={m.url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button className="flex-1 gap-2 rounded-full bg-gradient-to-tr from-rose-600 to-red-600" onClick={createProduct} disabled={creating}>
                        <FontAwesomeIcon icon={creating ? faSpinner : faCheck} className={creating ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                        Create product
                      </Button>
                      <Button variant="outline" className="rounded-full" onClick={() => setDraft(null)}>
                        Keep editing
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Input area */}
          {!draft && (
            <div className="shrink-0 border-t border-black/[0.06] bg-white/60 p-3 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleUpload} />
              {inputMode === 'upload' || expectsImage ? (
                <div className="mx-auto flex max-w-xl items-center justify-center gap-2">
                  <Button onClick={() => fileRef.current?.click()} disabled={uploading || thinking} className="gap-2 rounded-full bg-gradient-to-tr from-rose-600 to-red-600 px-6">
                    <FontAwesomeIcon icon={uploading ? faSpinner : faImage} className={uploading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                    {pendingImages.length ? `Add more (${pendingImages.length})` : 'Upload photos'}
                  </Button>
                  {pendingImages.length > 0 && (
                    <Button variant="outline" className="rounded-full" disabled={thinking} onClick={() => send('')}>Continue</Button>
                  )}
                  <Button variant="ghost" className="rounded-full text-muted-foreground" disabled={thinking} onClick={() => send('skip photos')}>Skip</Button>
                </div>
              ) : (
                <div className="mx-auto flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 pl-4 shadow-sm ring-1 ring-black/[0.08] dark:bg-zinc-800">
                  {inputMode === 'number' && <span className="text-sm font-medium text-zinc-500">#</span>}
                  <Input
                    value={input}
                    onChange={(e) => setInput(inputMode === 'number' ? e.target.value.replace(/[^\d.]/g, '') : e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !thinking && send(input)}
                    inputMode={inputMode === 'number' ? 'decimal' : 'text'}
                    placeholder={inputMode === 'number' ? 'Enter a number…' : options.length ? 'Pick above, or type…' : 'Type your answer…'}
                    disabled={thinking}
                    className="border-0 bg-transparent px-1 text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:ring-0 dark:text-zinc-100"
                  />
                  <Button size="icon" className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-rose-600 to-red-600" onClick={() => send(input)} disabled={thinking || !input.trim()}>
                    <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Pull a clean message out of an error whose message may be raw JSON like {"error":"..."}. */
function extractError(err: any): string {
  const raw = err?.message || (typeof err === 'string' ? err : '') || 'AI is unavailable right now';
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.error === 'string') return parsed.error;
  } catch {
    // not JSON
  }
  return raw;
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value ?? '—'}</dd>
    </>
  );
}
