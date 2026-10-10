import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Info, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { AdminPermissionDto } from '@/lib/api';
import {
  applyPermissionDeselect,
  applyPermissionSelect,
  type AutoSelectReason,
} from '@/lib/permissionDependencies';

const MODULE_LABELS: Record<string, string> = {
  STORE: 'Store Admin',
  PORTAL: 'Manufacturing Portal',
  SYSTEM: 'System',
};

const MODULE_ORDER = ['STORE', 'PORTAL', 'SYSTEM'];

function featureLabel(feature: string): string {
  return feature
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

type FeatureGroup = {
  feature: string;
  label: string;
  permissions: AdminPermissionDto[];
};

type ModuleGroup = {
  module: string;
  label: string;
  features: FeatureGroup[];
};

function buildTree(permissions: AdminPermissionDto[]): ModuleGroup[] {
  const byModule = new Map<string, Map<string, AdminPermissionDto[]>>();

  for (const p of permissions) {
    if (!byModule.has(p.module)) byModule.set(p.module, new Map());
    const feats = byModule.get(p.module)!;
    if (!feats.has(p.feature)) feats.set(p.feature, []);
    feats.get(p.feature)!.push(p);
  }

  const modules = [...byModule.keys()].sort((a, b) => {
    const ia = MODULE_ORDER.indexOf(a);
    const ib = MODULE_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return modules.map((module) => {
    const feats = byModule.get(module)!;
    const features = [...feats.entries()].map(([feature, perms]) => ({
      feature,
      label: featureLabel(feature),
      permissions: [...perms].sort((a, b) => a.sortOrder - b.sortOrder),
    }));
    return {
      module,
      label: MODULE_LABELS[module] || module,
      features,
    };
  });
}

function checkState(ids: number[], selected: Set<number>): boolean | 'indeterminate' {
  if (ids.length === 0) return false;
  const n = ids.filter((id) => selected.has(id)).length;
  if (n === 0) return false;
  if (n === ids.length) return true;
  return 'indeterminate';
}

type Props = {
  permissions: AdminPermissionDto[];
  selectedIds: Set<number>;
  onChange: (next: Set<number>) => void;
  className?: string;
};

/**
 * MD-style hierarchy: Module → Feature → actions.
 * Selecting a write/action permission auto-selects required view parents
 * (see permissionDependencies.ts) and shows a short explanation dialog.
 */
export function RolePermissionPicker({ permissions, selectedIds, onChange, className }: Props) {
  const tree = useMemo(() => buildTree(permissions), [permissions]);
  const [query, setQuery] = useState('');
  const [openModules, setOpenModules] = useState<Set<string>>(() => new Set(MODULE_ORDER));
  const [openFeatures, setOpenFeatures] = useState<Set<string>>(() => new Set());
  const [autoDialog, setAutoDialog] = useState<AutoSelectReason[] | null>(null);

  const idToCode = useMemo(() => new Map(permissions.map((p) => [p.id, p.code])), [permissions]);
  const codeToId = useMemo(() => new Map(permissions.map((p) => [p.code, p.id])), [permissions]);
  const codeToName = useMemo(() => new Map(permissions.map((p) => [p.code, p.name])), [permissions]);

  const allIds = useMemo(() => permissions.map((p) => p.id), [permissions]);
  const filteredTree = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tree;
    return tree
      .map((mod) => ({
        ...mod,
        features: mod.features
          .map((feat) => ({
            ...feat,
            permissions: feat.permissions.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.code.toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q) ||
                feat.label.toLowerCase().includes(q) ||
                mod.label.toLowerCase().includes(q),
            ),
          }))
          .filter((f) => f.permissions.length > 0),
      }))
      .filter((m) => m.features.length > 0);
  }, [tree, query]);

  const setSelected = (ids: number[], on: boolean) => {
    if (on) {
      const { nextIds, reasons } = applyPermissionSelect({
        selectedIds,
        turnedOnIds: ids,
        idToCode,
        codeToId,
        codeToName,
      });
      onChange(nextIds);
      if (reasons.length > 0) setAutoDialog(reasons);
    } else {
      onChange(
        applyPermissionDeselect({
          selectedIds,
          turnedOffIds: ids,
          idToCode,
          codeToId,
        }),
      );
    }
  };

  const toggleFeatureOpen = (key: string) => {
    setOpenFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleModuleOpen = (module: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const globalState = checkState(allIds, selectedIds);

  // Group dialog rows: becauseOf → list of auto names
  const dialogGroups = useMemo(() => {
    if (!autoDialog?.length) return [];
    const map = new Map<string, { because: string; autos: string[] }>();
    for (const r of autoDialog) {
      const key = r.becauseOfCode;
      if (!map.has(key)) map.set(key, { because: r.becauseOfName, autos: [] });
      const g = map.get(key)!;
      if (!g.autos.includes(r.autoName)) g.autos.push(r.autoName);
    }
    return [...map.values()];
  }, [autoDialog]);

  return (
    <div className={cn('flex flex-col min-h-0 border border-border rounded-xl bg-card overflow-hidden', className)}>
      <div className="shrink-0 border-b border-border px-3 py-2.5 sm:px-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">
            Permissions
            <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
              {selectedIds.size}/{allIds.length}
            </span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelected(allIds, true)}
              disabled={globalState === true}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onChange(new Set())}
              disabled={selectedIds.size === 0}
            >
              Clear
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="pl-8 h-8 text-sm bg-background"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 space-y-2">
        {filteredTree.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No permissions match.</p>
        ) : (
          filteredTree.map((mod) => {
            const moduleIds = mod.features.flatMap((f) => f.permissions.map((p) => p.id));
            const modState = checkState(moduleIds, selectedIds);
            const modOpen = openModules.has(mod.module) || !!query.trim();

            return (
              <div key={mod.module} className="rounded-lg border border-border bg-background overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50">
                  <button
                    type="button"
                    className="p-0.5 rounded hover:bg-muted"
                    onClick={() => toggleModuleOpen(mod.module)}
                    aria-label={modOpen ? 'Collapse module' : 'Expand module'}
                  >
                    {modOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <Checkbox
                    checked={modState === 'indeterminate' ? 'indeterminate' : modState}
                    onCheckedChange={(v) => setSelected(moduleIds, v === true)}
                    id={`mod-${mod.module}`}
                  />
                  <label htmlFor={`mod-${mod.module}`} className="flex-1 cursor-pointer select-none">
                    <span className="font-semibold text-sm">{mod.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {moduleIds.filter((id) => selectedIds.has(id)).length}/{moduleIds.length}
                    </span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSelected(moduleIds, true)}
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSelected(moduleIds, false)}
                  >
                    None
                  </Button>
                </div>

                {modOpen && (
                  <div className="divide-y divide-border">
                    {mod.features.map((feat) => {
                      const featKey = `${mod.module}:${feat.feature}`;
                      const featIds = feat.permissions.map((p) => p.id);
                      const featState = checkState(featIds, selectedIds);
                      const featOpen = openFeatures.has(featKey) || featState !== false || !!query.trim();

                      return (
                        <div key={featKey} className="bg-card">
                          <div className="flex items-center gap-2 px-3 py-2 pl-8 hover:bg-muted/30">
                            <button
                              type="button"
                              className="p-0.5 rounded hover:bg-muted"
                              onClick={() => toggleFeatureOpen(featKey)}
                              aria-label={featOpen ? 'Collapse feature' : 'Expand feature'}
                            >
                              {featOpen ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <Checkbox
                              id={`feat-${featKey}`}
                              checked={featState === 'indeterminate' ? ('indeterminate' as const) : featState}
                              onCheckedChange={(v) => setSelected(featIds, v === true)}
                            />
                            <label htmlFor={`feat-${featKey}`} className="flex-1 cursor-pointer select-none min-w-0">
                              <span className="text-sm font-medium">{feat.label}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {featIds.filter((id) => selectedIds.has(id)).length}/{featIds.length} actions
                              </span>
                            </label>
                          </div>

                          {featOpen && (
                            <ul className="pb-2 pl-16 pr-3 space-y-1">
                              {feat.permissions.map((p) => {
                                const on = selectedIds.has(p.id);
                                return (
                                  <li key={p.id}>
                                    <label
                                      className={cn(
                                        'flex items-start gap-2.5 rounded-md px-2 py-1.5 cursor-pointer hover:bg-muted/40',
                                        on && 'bg-primary/5',
                                      )}
                                    >
                                      <Checkbox
                                        checked={on}
                                        onCheckedChange={(v) => setSelected([p.id], v === true)}
                                        className="mt-0.5"
                                      />
                                      <span className="min-w-0">
                                        <span className="block text-sm leading-snug">{p.name}</span>
                                        {p.description && (
                                          <span className="block text-xs text-muted-foreground mt-0.5">
                                            {p.description}
                                          </span>
                                        )}
                                      </span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!autoDialog?.length} onOpenChange={(open) => !open && setAutoDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Info className="w-4 h-4 text-primary shrink-0" />
              Related permissions selected
            </DialogTitle>
            <DialogDescription className="text-sm">
              Some actions need other permissions to work. We turned those on automatically so the
              role stays consistent (for example, create needs view).
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-3 text-sm">
            {dialogGroups.map((g) => (
              <div key={g.because} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <p className="font-medium text-foreground">You selected: {g.because}</p>
                <p className="text-xs text-muted-foreground mt-1.5 mb-1">Also selected because it depends on this:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  {g.autos.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button size="sm" className="btn-primary" onClick={() => setAutoDialog(null)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
