// Color palette for inline `style`/icon usage. The className tokens
// (bg-background, text-foreground…) flip via CSS variables (see global.css);
// this object mirrors them for the cases where we pass a color string directly.
//
// `C` is a live proxy: reading `C.foreground` returns the value for the current
// theme. Components re-render on theme change (NativeWind re-renders className'd
// trees + the SettingsProvider remounts on scheme change), so icon colors track
// the theme without per-call-site hooks.

import type { TextStyle } from 'react-native';
import { vars } from 'nativewind';

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
  amber: string; // warning FILL / icon (light yellow)
  amberText: string; // warning TEXT on light surfaces (darkened for contrast)
  white: string;
  route: string; // map/route accent (blue line + nav progress) — fixed in both themes
};

export const lightColors: Palette = {
  background: '#ffffff',
  foreground: '#171717',
  primary: '#26262c', // soft graphite ink — calmer than pure black on CTAs/surfaces
  primaryForeground: '#fafafa',
  accent: '#f5f5f5',
  accentForeground: '#171717',
  mutedForeground: '#737373',
  border: '#e5e5e5',
  input: '#e5e5e5',
  teal: '#6f19da', // accent (violet) — single brand accent used app-wide
  purple: '#6f19da', // unified to the violet accent (offer banner, partial-load badges)
  destructive: '#ef4444',
  amber: '#fbbf24',
  amberText: '#b45309', // amber-700 — readable on light
  white: '#ffffff',
  route: '#1e9df1',
};

export const darkColors: Palette = {
  background: '#18181b',
  foreground: '#fafafa',
  primary: '#fafafa', // neutral ink (light on dark)
  primaryForeground: '#18181b',
  accent: '#0a0a0b',
  accentForeground: '#fafafa',
  mutedForeground: '#a1a1aa',
  border: '#27272a',
  input: '#27272a',
  teal: '#8b4df0', // accent (violet) — lighter for dark bg legibility
  purple: '#8b4df0', // unified to the violet accent
  destructive: '#f87171',
  amber: '#fbbf24',
  amberText: '#fcd34d', // bright — readable on dark
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

// NativeWind className tokens (bg-background, text-foreground…) read these CSS
// variables. On web the `.dark` class on <html> flips them; on NATIVE the `.dark`
// selector is never applied, so we set the variables explicitly on a root View
// via vars() (see _layout ThemedShell). Channel values mirror global.css exactly
// so className tokens render identically on both platforms.
export const lightVars = vars({
  '--background': '255 255 255',
  '--foreground': '23 23 23',
  '--primary': '38 38 44',
  '--primary-foreground': '250 250 250',
  '--accent': '245 245 245',
  '--accent-foreground': '23 23 23',
  '--muted': '245 245 245',
  '--muted-foreground': '115 115 115',
  '--border': '229 229 229',
  '--input': '229 229 229',
  '--teal': '111 25 218',
  '--purple': '111 25 218',
  '--destructive': '239 68 68',
});
export const darkVars = vars({
  '--background': '24 24 27',
  '--foreground': '250 250 250',
  '--primary': '250 250 250',
  '--primary-foreground': '24 24 27',
  '--accent': '10 10 11',
  '--accent-foreground': '250 250 250',
  '--muted': '39 39 42',
  '--muted-foreground': '161 161 170',
  '--border': '39 39 42',
  '--input': '39 39 42',
  '--teal': '139 77 240',
  '--purple': '139 77 240',
  '--destructive': '248 113 113',
});
export function themeVars(scheme: 'light' | 'dark') {
  return scheme === 'dark' ? darkVars : lightVars;
}

// Tabular (monospaced) figures — apply to money/ETA/HOS/miles so digits don't
// jitter as they change. style={tnum} on any number Text. Reads as "pro".
export const tnum: TextStyle = { fontVariant: ['tabular-nums'] };

// Shared sizing tokens for consistency (Refero scale). Use these for new/edited
// surfaces so radii and control heights stay uniform app-wide.
export const radii = { sm: 6, md: 10, lg: 12, xl: 16 } as const;
export const sizes = { button: 56, input: 48, control: 48 } as const;

// Motion — one set of durations + a default spring. ease-out on enter,
// ease-in on exit. Keeps every transition coherent.
export const motion = {
  fast: 140,
  base: 220,
  slow: 360,
  spring: { damping: 16, stiffness: 240, mass: 0.6 },
} as const;

// Elevation — L0 = hairline border (static cards); L1 = soft shadow, no border
// (floating/overlay: tab bar, toast, sheet, FAB, success overlay).
export const elevation = {
  float: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
} as const;

// Status surfaces — resolve at render (reads the live palette via C). Returns a
// foreground (for text/icon) + a subtle tinted background + border. For SOLID
// status fills, use `on` for legible text (amber/teal/route need dark ink).
export function statusColors(kind: 'success' | 'warning' | 'danger' | 'info') {
  const fg = kind === 'success' ? C.foreground : kind === 'warning' ? C.amber : kind === 'danger' ? C.destructive : C.route;
  // Dark ink reads on amber/teal/route fills; white reads on red.
  const on = kind === 'danger' ? '#ffffff' : '#171717';
  return { fg, on, bg: `${fg}1A`, border: `${fg}33` };
}

// Subtle neutral surface for chips/active tints.
export const accentSubtle = () => `${C.foreground}1A`;

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
