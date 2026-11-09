import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background, BackgroundVariant, Controls, MiniMap, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow,
  type Connection, type IsValidConnection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, PanelRightClose, PanelRightOpen, Upload } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { botApi, BotFlowState, marketplaceApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { BotNodeView, NodeIssuesContext } from './nodes';
import { ChecksPanel } from './ChecksPanel';
import { Inspector } from './Inspector';
import { TestChat } from './TestChat';
import { sanitizeFlow } from './sanitize';
import { starterFlow } from './starter';
import { validateFlow } from './validate';
import { KIND_META, MAX_EVENTS, START_ID, newId, type BotEdge, type BotFlow, type BotNode, type BotNodeData, type NodeKind } from './types';

const DRAFT_KEY = 'sara-bot-flow-draft';
const nodeTypes = { bot: BotNodeView };

const loadLocal = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const { flow } = sanitizeFlow(JSON.parse(raw));
      if (flow) return flow;
    }
  } catch { /* fall through to the starter */ }
  return null;
};

const defaults = (kind: NodeKind): BotNodeData => {
  switch (kind) {
    case 'event': return { kind, title: 'New event', description: '', examples: [] };
    case 'outcome': return { kind, title: 'New outcome', outcomeId: 'open_app', appPage: '/ask' };
    case 'condition': return { kind, title: 'New check', conditionType: 'business_hours' };
    case 'end': return { kind, title: 'End' };
    default: return { kind: 'start', title: 'Customer sends a message' };
  }
};

type SaveState = 'saved' | 'saving' | 'unsaved' | 'offline';

const Inner = ({ initial, server }: { initial: BotFlow; server: BotFlowState | null }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<BotNode>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<BotEdge>(initial.edges);
  const [name, setName] = useState(initial.name);
  const flow = useReactFlow();
  const wrap = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'edit' | 'test' | 'checks'>('edit');
  const [panelOpen, setPanelOpen] = useState(true);
  const [save, setSave] = useState<SaveState>(server ? 'saved' : 'offline');
  const [live, setLive] = useState(!!server?.live);
  const [version, setVersion] = useState(server?.publishedVersion ?? 0);
  const [publishing, setPublishing] = useState(false);
  const qc = useQueryClient();
  const { data: licence } = useQuery({ queryKey: ['bot-licence'], queryFn: () => marketplaceApi.get('bot-whatsapp'), retry: 1, refetchOnWindowFocus: false });
  const [licensing, setLicensing] = useState(false);
  const licenceAction = licence && !licence.live
    ? (licence.status === 'AVAILABLE' ? 'trial' : (licence.status === 'TRIAL' || licence.status === 'OWNED') && !licence.enabled ? 'enable' : null)
    : null;
  const turnOnBot = async () => {
    setLicensing(true);
    try {
      let state = licence!;
      if (licenceAction === 'trial') state = await marketplaceApi.startTrial('bot-whatsapp');
      if (!state.enabled) state = await marketplaceApi.setEnabled('bot-whatsapp', true);
      qc.setQueryData(['bot-licence'], state);
      setLive(state.live && version > 0);
      toast.success(state.live ? 'The bot is on.' : 'Licence updated.');
    } catch (e: any) {
      toast.error(e?.message || 'Could not turn the bot on.');
    } finally {
      setLicensing(false);
    }
  };
  const firstRun = useRef(true);
  const selected = nodes.find((n) => n.selected);

  const issues = useMemo(() => validateFlow(nodes, edges), [nodes, edges]);
  const issueMap = useMemo(() => {
    const m = new Map<string, 'error' | 'warning'>();
    issues.forEach((i) => { if (i.nodeId && m.get(i.nodeId) !== 'error') m.set(i.nodeId, i.level); });
    return m;
  }, [issues]);

  // Keep the draft safe as you work: on the server when it is reachable, and always in this browser as a copy.
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setSave('unsaved');
    const t = window.setTimeout(async () => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, nodes, edges })); } catch { /* storage full or blocked */ }
      try {
        setSave('saving');
        await botApi.saveDraft({ name, nodes, edges });
        setSave('saved');
      } catch {
        setSave('offline');
      }
    }, 1200);
    return () => window.clearTimeout(t);
  }, [name, nodes, edges]);

  const isValidConnection: IsValidConnection = useCallback((c) => {
    const src = nodes.find((n) => n.id === c.source);
    const tgt = nodes.find((n) => n.id === c.target);
    if (!src || !tgt || src.id === tgt.id || tgt.id === START_ID) return false;
    if (tgt.data.kind === 'event') return src.id === START_ID;
    if (src.id === START_ID) return false; // the starting point connects only to events (handled above)
    return true;
  }, [nodes]);

  const onConnect = useCallback((c: Connection) => {
    setEdges((eds) => {
      // One line per connection point, except the starting point, which fans out to every event.
      const kept = c.source === START_ID ? eds.filter((e) => !(e.source === c.source && e.target === c.target)) : eds.filter((e) => !(e.source === c.source && (e.sourceHandle ?? 'out') === (c.sourceHandle ?? 'out')));
      return [...kept, { id: `e_${c.source}_${c.sourceHandle ?? 'out'}_${c.target}`, source: c.source!, target: c.target!, sourceHandle: c.sourceHandle ?? 'out', type: 'smoothstep' }];
    });
  }, [setEdges]);

  const add = useCallback((kind: NodeKind, at?: { x: number; y: number }) => {
    if (kind === 'event' && nodes.filter((n) => n.data.kind === 'event').length >= MAX_EVENTS) {
      toast.error(`The limit is ${MAX_EVENTS} events, so the AI can choose reliably.`);
      return;
    }
    const box = wrap.current?.getBoundingClientRect();
    const pos = at ?? flow.screenToFlowPosition({ x: (box?.left ?? 0) + (box?.width ?? 600) / 2, y: (box?.top ?? 0) + (box?.height ?? 400) / 2 });
    const id = newId(kind.slice(0, 2));
    setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), { id, type: 'bot', position: pos, data: defaults(kind), selected: true }]);
  }, [flow, nodes, setNodes]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData('application/sara-bot') as NodeKind;
    if (kind) add(kind, flow.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
  }, [add, flow]);

  const patchSelected = (patch: Partial<BotNodeData>) =>
    setNodes((ns) => ns.map((n) => (n.selected ? { ...n, data: { ...n.data, ...patch } } : n)));
  const deleteSelected = () => {
    const sel = nodes.find((n) => n.selected);
    if (!sel || sel.id === START_ID) return;
    setNodes((ns) => ns.filter((n) => n.id !== sel.id));
    setEdges((es) => es.filter((e) => e.source !== sel.id && e.target !== sel.id));
  };
  const pickIssue = (id: string) => {
    setNodes((ns) => ns.map((n) => ({ ...n, selected: n.id === id })));
    const n = nodes.find((x) => x.id === id);
    if (n) flow.setCenter(n.position.x + 135, n.position.y + 60, { zoom: 0.9, duration: 400 });
    setTab('edit');
  };
  const exportFlow = () => {
    const blob = new Blob([JSON.stringify({ name, nodes, edges }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'bot-flow'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importFlow = async (file?: File) => {
    if (!file) return;
    try {
      const { flow: f, dropped } = sanitizeFlow(JSON.parse(await file.text()));
      if (!f) { toast.error(dropped[0] ?? 'That file is not a flow.'); return; }
      setNodes(f.nodes); setEdges(f.edges); setName(f.name);
      window.setTimeout(() => flow.fitView({ padding: 0.15 }), 50);
      if (dropped.length) toast.warning(`Imported. Removed: ${dropped.join(' ')}`);
      else toast.success('Flow imported');
    } catch { toast.error('That file could not be read.'); }
    if (fileRef.current) fileRef.current.value = '';
  };
  const hasErrors = issues.some((i) => i.level === 'error');
  const publish = async () => {
    if (hasErrors) { toast.error('Fix the errors in Checks before publishing.'); setTab('checks'); return; }
    setPublishing(true);
    try {
      // Save the latest first, then ask the server to check it again and publish it.
      await botApi.saveDraft({ name, nodes, edges });
      const r = await botApi.publish();
      setVersion(r.publishedVersion);
      setLive(r.live);
      setSave('saved');
      toast.success(r.live ? `Published (version ${r.publishedVersion}). The bot is answering customers.` : `Published (version ${r.publishedVersion}). The bot starts answering once its Marketplace trial or purchase is on.`);
    } catch (e: any) {
      toast.error(e?.message || 'Could not publish. Nothing changed.');
    } finally {
      setPublishing(false);
    }
  };

  const loadStarter = () => {
    const s = starterFlow();
    setNodes(s.nodes);
    setEdges(s.edges);
    setName(s.name);
    window.setTimeout(() => flow.fitView({ padding: 0.15 }), 50);
    toast.success('Starter flow loaded');
  };

  return (
    <NodeIssuesContext.Provider value={issueMap}>
      <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b bg-white px-4 py-2.5">
        <Link to="/admin-sara/whatsapp" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> WhatsApp
        </Link>
        <span className="h-5 w-px bg-slate-200" />
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} aria-label="Flow name" className="min-w-[10rem] flex-1 bg-transparent text-base font-semibold outline-none" />
        <span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-medium xl:inline ${live ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {live ? `Live · version ${version}` : version ? `Published v${version} · bot is off until its licence is on` : 'Not published yet'}
        </span>
        <span className={`text-[11px] ${save === 'offline' ? 'text-amber-600' : 'text-slate-400'}`}>
          {save === 'saving' ? 'Saving…' : save === 'saved' ? 'Saved' : save === 'unsaved' ? 'Unsaved changes' : 'Saved in this browser only'}
        </span>
        <span className="text-xs text-muted-foreground">{issues.filter((i) => i.level === 'error').length} errors · {issues.filter((i) => i.level === 'warning').length} warnings</span>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importFlow(e.target.files?.[0])} />
        <Button variant="outline" size="sm" onClick={loadStarter}>Starter flow</Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5" /> Import</Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={exportFlow}><Download className="h-3.5 w-3.5" /> Export</Button>
        {licenceAction && (
          <Button size="sm" variant="secondary" onClick={turnOnBot} disabled={licensing} className="gap-1.5">
            {licensing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{licenceAction === 'trial' ? 'Start 10-day trial' : 'Turn bot on'}
          </Button>
        )}
        <Button size="sm" onClick={publish} disabled={publishing} className="gap-1.5">{publishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Publish</Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPanelOpen((o) => !o)} aria-label={panelOpen ? 'Hide side panels' : 'Show side panels'} title={panelOpen ? 'Hide side panels' : 'Show side panels'}>
          {panelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className={`${panelOpen ? 'hidden md:block' : 'hidden'} w-52 shrink-0 space-y-2 overflow-y-auto border-r bg-slate-50/60 p-3`}>
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Drag onto the canvas</p>
          {(['event', 'outcome', 'condition', 'end'] as NodeKind[]).map((k) => (
            <div
              key={k}
              draggable
              onDragStart={(e) => { e.dataTransfer.setData('application/sara-bot', k); e.dataTransfer.effectAllowed = 'move'; }}
              onClick={() => add(k)}
              className="cursor-grab rounded-lg border bg-white p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
              style={{ borderLeft: `4px solid ${KIND_META[k].color}` }}
            >
              <p className="text-sm font-medium">{KIND_META[k].label}</p>
              <p className="text-[11px] text-slate-500">{KIND_META[k].hint}</p>
            </div>
          ))}
        </aside>
        <div ref={wrap} className="min-w-0 flex-1" onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.2}
            maxZoom={1.5}
            deleteKeyCode={['Backspace', 'Delete']}
            defaultEdgeOptions={{ type: 'smoothstep', style: { strokeWidth: 2 } }}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor={(n) => KIND_META[(n.data as BotNodeData).kind]?.color ?? '#94a3b8'} />
          </ReactFlow>
        </div>
        <aside className={`${panelOpen ? 'flex' : 'hidden'} w-[340px] shrink-0 flex-col border-l bg-white max-md:hidden`}>
          <div className="flex border-b text-sm">
            {([['edit', 'Edit'], ['test', 'Test chat'], ['checks', `Checks${issues.length ? ` (${issues.length})` : ''}`]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`flex-1 px-3 py-2.5 font-medium transition-colors ${tab === k ? 'border-b-2 border-primary text-foreground' : 'text-slate-400 hover:text-slate-700'}`}>{l}</button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === 'edit' && <Inspector node={selected} onChange={patchSelected} onDelete={deleteSelected} />}
            {tab === 'test' && <TestChat nodes={nodes} edges={edges} />}
            {tab === 'checks' && <ChecksPanel issues={issues} onPick={pickIssue} />}
          </div>
        </aside>
      </div>
    </NodeIssuesContext.Provider>
  );
};

/** Loads the flow from the server (falling back to this browser's copy, then the starter) and shows the full-screen editor. */
const Loader = () => {
  const { data, isLoading } = useQuery({ queryKey: ['bot-flow'], queryFn: () => botApi.getFlow(), retry: 1, refetchOnWindowFocus: false, staleTime: Infinity });
  const initial = useMemo<BotFlow | null>(() => {
    if (isLoading) return null;
    const fromServer = data?.draft ? sanitizeFlow(data.draft).flow : null;
    return fromServer ?? loadLocal() ?? starterFlow();
  }, [data, isLoading]);

  if (!initial) {
    return <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }
  return <Inner initial={initial} server={data ?? null} />;
};

/** A full-screen editor: it covers the whole page, with its own top bar, so the canvas has room to breathe. */
export const BotBuilder = () => (
  <ReactFlowProvider>
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      <Loader />
    </div>
  </ReactFlowProvider>
);
