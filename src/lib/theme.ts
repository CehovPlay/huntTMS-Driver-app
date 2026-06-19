// Single source of truth for colors + shadows (Figma tokens).
// Use these with inline `style` for color/shadow props — some NativeWind
// color classes (bg-foreground, arbitrary [#hex] border/text, token/opacity)
// silently don't render in this setup, so accents go through here.

export const C = {
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
} as const;

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
