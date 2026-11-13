import { ReactNode, useState } from 'react';
import { Sym } from './Sym';

export type ToolbarTab = { key: string; label: string; count?: number };

/**
 * The one row above every list: counted tabs on the left, search and extra controls on the right.
 * Tabs show how many items each view holds, so nobody opens a view to find it empty.
 */
export default function ListToolbar({
  tabs,
  tab,
  onTab,
  search,
  onSearch,
  placeholder = 'Search…',
  children,
}: {
  tabs?: ToolbarTab[];
  tab?: string;
  onTab?: (key: string) => void;
  search?: string;
  onSearch?: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <div className="pa-toolbar">
      {tabs && tabs.length > 0 && (
        <div className="pa-seg" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={tab === t.key ? 'on' : ''}
              onClick={() => onTab?.(t.key)}
            >
              {t.label}
              {t.count !== undefined && <span className="pa-seg-count">{t.count}</span>}
            </button>
          ))}
        </div>
      )}
      <div className="pa-toolbar-right">
        {onSearch && (
          <div className="pa-searchbox">
            <Sym name="search" className="text-[18px]" />
            <input value={search ?? ''} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} />
            {search ? (
              <button type="button" onClick={() => onSearch('')} aria-label="Clear search"><Sym name="close" className="text-[16px]" /></button>
            ) : null}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export type ListView = 'list' | 'grid-2' | 'grid-3';
const VIEWS: { key: ListView; icon: string; label: string }[] = [
  { key: 'list', icon: 'view_list', label: 'List' },
  { key: 'grid-2', icon: 'grid_view', label: '2 columns' },
  { key: 'grid-3', icon: 'view_module', label: '3 columns' },
];

/** Remembers the chosen layout per page (browser only; falls back silently). */
export function useListView(storageKey: string, initial: ListView = 'list'): [ListView, (v: ListView) => void] {
  const k = `pa-view:${storageKey}`;
  const [view, setView] = useState<ListView>(() => {
    try { const v = localStorage.getItem(k) as ListView | null; if (v && VIEWS.some((x) => x.key === v)) return v; } catch { /* ignore */ }
    return initial;
  });
  return [view, (v) => { setView(v); try { localStorage.setItem(k, v); } catch { /* ignore */ } }];
}

export function ViewToggle({ view, onChange }: { view: ListView; onChange: (v: ListView) => void }) {
  return (
    <div className="pa-seg pa-viewtoggle" role="group" aria-label="Layout">
      {VIEWS.map((v) => (
        <button key={v.key} type="button" className={view === v.key ? 'on' : ''} onClick={() => onChange(v.key)} title={v.label} aria-label={v.label} aria-pressed={view === v.key}>
          <Sym name={v.icon} className="text-[18px]" />
        </button>
      ))}
    </div>
  );
}
