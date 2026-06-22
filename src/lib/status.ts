// Single source of truth for load / conversation / document status colors.
//
// Two rules keep these readable in both themes:
//   • Saturated "chip" fills (amber/teal/red/purple badges) are CONSTANT across
//     light & dark — a brand fill with fixed-contrast text reads identically in
//     both, exactly like the route blue. They must NOT follow surface tokens.
//   • Neutral and text-on-surface colors (the "Scheduled" pill, doc statuses)
//     DO follow the theme tokens so they flip. These read `C.*` at call time, so
//     always call these helpers during render — never cache the result at module
//     scope (that was the old bug: the pill froze on the boot-time theme).

import { C } from './theme';

const CHIP = {
  amber: '#fbbf24',
  teal: '#0d9488',
  red: '#ef4444',
  purple: '#7a5af8',
  onDark: '#171717', // text on the (light) amber chip
  onColor: '#ffffff', // text on saturated chips
} as const;

export type LoadVariant = 'offered' | 'scheduled' | 'current' | 'delivered' | 'tonu';
export type Badge = { label: string; bg: string; color: string };

export function loadBadge(v: LoadVariant): Badge {
  switch (v) {
    case 'offered':
      return { label: 'New offer', bg: CHIP.purple, color: CHIP.onColor };
    case 'scheduled':
      return { label: 'Scheduled', bg: C.accent, color: C.mutedForeground };
    case 'current':
      return { label: 'Current load', bg: CHIP.amber, color: CHIP.onDark };
    case 'delivered':
      return { label: 'Delivered', bg: CHIP.teal, color: CHIP.onColor };
    case 'tonu':
      return { label: 'Canceled', bg: CHIP.red, color: CHIP.onColor };
  }
}

// Conversation/load display status (chat + messages list) → badge.
const CONV_TO_VARIANT: Record<string, LoadVariant> = {
  'En route': 'current',
  Scheduled: 'scheduled',
  Delivered: 'delivered',
  TONU: 'tonu',
};
export function convBadge(status: string): Badge {
  return loadBadge(CONV_TO_VARIANT[status] ?? 'scheduled');
}

// Document status (profile). These are text-on-surface, so they use the theme
// tokens directly — teal/destructive/muted brighten in dark for contrast.
export type DocStatusKey = 'valid' | 'expiring' | 'expired' | 'missing';
export function docColor(s: DocStatusKey): { label: string; color: string } {
  switch (s) {
    case 'valid':
      return { label: 'Valid', color: C.teal };
    case 'expiring':
      return { label: 'Expiring', color: C.amber };
    case 'expired':
      return { label: 'Expired', color: C.destructive };
    case 'missing':
      return { label: 'Missing', color: C.mutedForeground };
  }
}
