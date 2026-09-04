import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Loader2, ArrowUp, ArrowDown, Sparkles, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { aiContextApi, type AiPromptDirectiveDto } from '@/lib/api';

/**
 * "AI Context" — extra prompt points the business maintains for each AI, without a deploy.
 *
 * The hardcoded system prompt in the backend stays the primary definition of each assistant's
 * behaviour; these points are layered on top and, per the client's requirement, take precedence
 * wherever the two conflict. Each AI is configured independently.
 */
const AdminAiContext = () => {
  const queryClient = useQueryClient();
  const [personaId, setPersonaId] = useState<string>('');
  const [draft, setDraft] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const { data: personas = [], isLoading: personasLoading } = useQuery({
    queryKey: ['ai-context-personas'],
    queryFn: () => aiContextApi.listPersonas(),
  });

  // Land on the first persona once the list arrives, so the page is never in a blank state.
  useEffect(() => {
    if (!personaId && personas.length > 0) setPersonaId(personas[0].id);
  }, [personas, personaId]);

  const { data: directives = [], isLoading } = useQuery({
    queryKey: ['ai-context', personaId],
    queryFn: () => aiContextApi.list(personaId),
    enabled: !!personaId,
  });

  const { data: preview } = useQuery({
    queryKey: ['ai-context-preview', personaId],
    queryFn: () => aiContextApi.preview(personaId),
    enabled: !!personaId && showPreview,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ai-context', personaId] });
    queryClient.invalidateQueries({ queryKey: ['ai-context-preview', personaId] });
  };

  const createMut = useMutation({
    mutationFn: (body: string) => aiContextApi.create(personaId, body),
    onSuccess: () => {
      setDraft('');
      invalidate();
      toast.success('Point added');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not add that point'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: { body?: string; sortOrder?: number; active?: boolean } }) =>
      aiContextApi.update(personaId, id, patch),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message || 'Could not save that change'),
  });

  const removeMut = useMutation({
    mutationFn: (id: number) => aiContextApi.remove(personaId, id),
    onSuccess: () => {
      invalidate();
      toast.success('Point removed');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not remove that point'),
  });

  /** Swaps this row's sortOrder with its neighbour's — the list is already sorted by it. */
  const move = (index: number, direction: -1 | 1) => {
    const target = directives[index + direction];
    const current = directives[index];
    if (!target || !current) return;
    updateMut.mutate({ id: current.id, patch: { sortOrder: target.sortOrder } });
    updateMut.mutate({ id: target.id, patch: { sortOrder: current.sortOrder } });
  };

  const activeCount = directives.filter((d) => d.active).length;

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" /> AI Context
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Extra guidance for each AI, on top of its built-in instructions. Where a point here
            conflicts with the built-in behaviour, the point here wins. Keep it to a handful of
            short, clear rules.
          </p>
        </div>

        {personasLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <>
            {/* Persona tabs — each AI is configured separately. */}
            <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
              {personas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersonaId(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    p.id === personaId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="e.g. Always mention that bulk orders above 500 units get a dedicated account manager."
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <Button
                  onClick={() => draft.trim() && createMut.mutate(draft.trim())}
                  disabled={!draft.trim() || createMut.isPending}
                >
                  {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span className="ml-1">Add point</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {activeCount} active {activeCount === 1 ? 'point' : 'points'} for this AI
                {directives.length !== activeCount ? ` · ${directives.length - activeCount} turned off` : ''}
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : directives.length === 0 ? (
              <div className="border-2 border-dashed rounded-xl p-10 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto opacity-40" />
                <p className="mt-2 font-medium">No extra context yet</p>
                <p className="text-sm">This AI is running on its built-in instructions only.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {directives.map((d: AiPromptDirectiveDto, i: number) => (
                  <div
                    key={d.id}
                    className={`border rounded-xl p-3 flex items-start gap-3 ${d.active ? '' : 'opacity-60'}`}
                  >
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                        title="Move up (earlier = higher priority)"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === directives.length - 1}
                        className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <Textarea
                      defaultValue={d.body}
                      rows={2}
                      className="flex-1 resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-sm"
                      onBlur={(e) => {
                        const next = e.target.value.trim();
                        if (next && next !== d.body) updateMut.mutate({ id: d.id, patch: { body: next } });
                      }}
                    />

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={d.active}
                        onCheckedChange={(checked) => updateMut.mutate({ id: d.id, patch: { active: checked } })}
                        title={d.active ? 'Active — sent to the AI' : 'Turned off — kept but not sent'}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Remove this point?')) removeMut.mutate(d.id);
                        }}
                        className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Shows the literal text appended to the prompt, so what the AI receives is never
                a guess — including the precedence preamble the backend adds. */}
            <div className="mt-8 border-t pt-4">
              <Button variant="ghost" size="sm" onClick={() => setShowPreview((v) => !v)}>
                <Eye className="h-4 w-4 mr-1.5" />
                {showPreview ? 'Hide' : 'Show'} what the AI receives
              </Button>
              {showPreview && (
                <pre className="mt-3 p-4 rounded-lg bg-muted text-xs whitespace-pre-wrap font-mono">
                  {preview?.rendered?.trim() || 'Nothing extra is being sent for this AI.'}
                </pre>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAiContext;
