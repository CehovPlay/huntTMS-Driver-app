// Color palette for inline `style`/icon usage. The className tokens
// (bg-background, text-foreground…) flip via CSS variables (see global.css);
// this object mirrors them for the cases where we pass a color string directly.
//
// `C` is a live proxy: reading `C.foreground` returns the value for the current
// theme. Components re-render on theme change (NativeWind re-renders className'd
// trees + the SettingsProvider remounts on scheme change), so icon colors track
// the theme without per-call-site hooks.

export type Palette = {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  mutedForeground: string;
  border: string;
  input: string;
  teal: string;
  purple: string;
  destructive: string;
  amber: string;
  white: string;
  route: string; // map/route accent (blue line + nav progress) — fixed in both themes
};

export const lightColors: Palette = {
  background: '#ffffff',
  foreground: '#171717',
  primary: '#171717',
  primaryForeground: '#fafafa',
  accent: '#f5f5f5',
  accentForeground: '#171717',
  mutedForeground: '#737373',
  border: '#e5e5e5',
  input: '#e5e5e5',
  teal: '#0d9488',
  purple: '#7a5af8',
  destructive: '#ef4444',
  amber: '#fbbf24',
  white: '#ffffff',
  route: '#1e9df1',
};

export const darkColors: Palette = {
  background: '#18181b',
  foreground: '#fafafa',
  primary: '#fafafa',
  primaryForeground: '#18181b',
  accent: '#0a0a0b',
  accentForeground: '#fafafa',
  mutedForeground: '#a1a1aa',
  border: '#27272a',
  input: '#27272a',
  teal: '#2dd4bf',
  purple: '#a78bfa',
  destructive: '#f87171',
  amber: '#fbbf24',
  white: '#ffffff',
  route: '#1e9df1',
};

let _scheme: 'light' | 'dark' = 'light';
export function setThemeScheme(scheme: 'light' | 'dark') {
  _scheme = scheme;
}
export function getThemeScheme() {
  return _scheme;
}
export function activePalette(): Palette {
  return _scheme === 'dark' ? darkColors : lightColors;
}

// Proxy so existing `C.foreground` reads resolve against the active palette.
export const C: Palette = new Proxy({} as Palette, {
  get(_t, prop: string) {
    return activePalette()[prop as keyof Palette];
  },
}) as Palette;

// shadow/xs — Figma: 0 1 2 rgba(0,0,0,0.05)
export const shadowXs = {
  shadowColor: '#000000',
  shadowOpacity: 0.05,
  shadowRadius: 2,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
} as const;

// shadow/sm — slightly stronger (segment trigger, floating card)
export const shadowSm = {
  shadowColor: '#000000',
  shadowOpacity: 0.1,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 3,
} as const;
