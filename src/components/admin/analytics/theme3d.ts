/**
 * Hex versions of the StudioSara theme colors for use in WebGL (Three.js) and
 * Recharts, which can't read CSS `hsl(var(--x))` variables at runtime.
 * Keep these in sync with src/index.css if the theme HSL values change.
 *
 *  --primary:    171 56% 39%  (teal)
 *  --foreground:  197 72% 15%
 *  --muted:        0  0% 96%
 */
export const THEME_3D = {
  primary: '#2b9e8f',
  primaryLight: '#5cc4b6',
  primaryDark: '#1f7368',
  foreground: '#0a3848',
  muted: '#f5f5f5',
  // A small accent palette derived from the teal primary for multi-series charts
  // (donut slices, country bars). Ordered light -> dark so the donut reads well.
  palette: [
    '#2b9e8f',
    '#5cc4b6',
    '#1f7368',
    '#7fd6c9',
    '#13524a',
    '#a8e3da',
  ],
} as const;

/** Pick a palette color by index, wrapping around. */
export function paletteColor(i: number): string {
  return THEME_3D.palette[i % THEME_3D.palette.length];
}
