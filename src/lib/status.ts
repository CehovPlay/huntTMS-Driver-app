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

export type LoadVariant = 'offered' | 'scheduled' | 'current' | 'delivered' | 'tonu';
export type Badge = { label: string; bg: string; color: string };

// Muted pills — subtle tinted bg + readable text (no loud saturated fills).
// Only states that need attention carry hue; done/scheduled stay neutral grey.
export function loadBadge(v: LoadVariant): Badge {
  switch (v) {
    case 'offered':
      return { label: 'New offer', bg: C.accent, color: C.foreground };
    case 'scheduled':
      return { label: 'Scheduled', bg: C.accent, color: C.mutedForeground };
    case 'current':
      return { label: 'Current load', bg: `${C.amber}1F`, color: C.amberText };
    case 'delivered':
      return { label: 'Delivered', bg: C.accent, color: C.foreground };
    case 'tonu':
      return { label: 'Canceled', bg: `${C.destructive}1A`, color: C.destructive };
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
      return { label: 'Valid', color: C.foreground };
    case 'expiring':
      return { label: 'Expiring', color: C.amber };
    case 'expired':
      return { label: 'Expired', color: C.destructive };
    case 'missing':
      return { label: 'Missing', color: C.mutedForeground };
  }
}
