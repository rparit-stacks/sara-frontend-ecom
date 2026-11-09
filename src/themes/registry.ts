import type { ThemePlugin } from './types';

/**
 * Finds every installed theme plugin: any src/themes/<id>/index.ts that default-exports a ThemePlugin.
 * Deleting a folder uninstalls the theme; no import elsewhere refers to it.
 */
const modules = import.meta.glob<{ default: ThemePlugin }>('./*/index.ts', { eager: true });

export const THEMES: ThemePlugin[] = Object.values(modules)
  .map((m) => m.default)
  .filter((t): t is ThemePlugin => !!t && typeof t.id === 'string');

export const findTheme = (id: string | null | undefined): ThemePlugin | null =>
  THEMES.find((t) => t.id === id) ?? null;
