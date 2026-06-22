// Web/Telegram Mini App init. Loads the Telegram WebApp SDK and expands the
// app to full screen so it doesn't open as a small bottom sheet in Telegram.
// Outside Telegram (plain browser) every call no-ops gracefully.

import { getThemeScheme } from './theme';

type TgHaptic = {
  impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  notificationOccurred?: (type: 'error' | 'success' | 'warning') => void;
  selectionChanged?: () => void;
};

type TgBackButton = {
  show?: () => void;
  hide?: () => void;
  onClick?: (cb: () => void) => void;
  offClick?: (cb: () => void) => void;
};

type TgInset = { top?: number; bottom?: number; left?: number; right?: number };

type TgWebApp = {
  ready?: () => void;
  expand?: () => void;
  requestFullscreen?: () => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  disableVerticalSwipes?: () => void;
  onEvent?: (event: string, cb: () => void) => void;
  safeAreaInset?: TgInset;
  contentSafeAreaInset?: TgInset;
  HapticFeedback?: TgHaptic;
  BackButton?: TgBackButton;
};

// In fullscreen, Telegram floats ⌄/⋯ controls over the top of the webview.
// Pad the app below them using the device safe area + Telegram's content inset,
// so our header is never obscured. (Insets arrive async, hence the listeners.)
function applyInsets() {
  const tg = getTelegramWebApp();
  if (!tg) return;
  const sa = tg.safeAreaInset || {};
  const ca = tg.contentSafeAreaInset || {};
  const top = (sa.top || 0) + (ca.top || 0);
  const bottom = (sa.bottom || 0) + (ca.bottom || 0);
  const root = document.getElementById('root');
  if (root) {
    root.style.boxSizing = 'border-box';
    root.style.paddingTop = `${top}px`;
    root.style.paddingBottom = `${bottom}px`;
  }
}

let started = false;

export function getTelegramWebApp(): TgWebApp | undefined {
  return (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;
}

function applyTelegram() {
  const tg = getTelegramWebApp();
  if (!tg) return;
  try { tg.ready?.(); } catch {}
  try { tg.expand?.(); } catch {}
  // Full screen edge-to-edge; we pad content below the floating ⌄/⋯ via insets.
  try { tg.requestFullscreen?.(); } catch {}
  // We use the app's own in-screen back buttons; hide Telegram's native one.
  try { tg.BackButton?.hide?.(); } catch {}
  // Match Telegram's chrome to the resolved theme (settings.tsx keeps it in sync
  // afterwards on every theme change; this just avoids a white flash at startup).
  const chrome = getThemeScheme() === 'dark' ? '#0a0a0b' : '#ffffff';
  try { tg.setHeaderColor?.(chrome); } catch {}
  try { tg.setBackgroundColor?.(chrome); } catch {}
  // A swipe-down shouldn't close the app while the driver is mid-task
  try { tg.disableVerticalSwipes?.(); } catch {}

  // Track Telegram's safe-area / content insets so nothing hides under its UI.
  applyInsets();
  try {
    tg.onEvent?.('safeAreaChanged', applyInsets);
    tg.onEvent?.('contentSafeAreaChanged', applyInsets);
    tg.onEvent?.('fullscreenChanged', applyInsets);
    tg.onEvent?.('viewportChanged', applyInsets);
  } catch {}
}

export function initTelegram(): void {
  if (started || typeof document === 'undefined') return;
  started = true;

  // App-like viewport: cover the notch, no pinch-zoom
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp) {
    vp.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
    );
  }
  // Kill the browser's overscroll bounce so it feels native inside Telegram
  document.documentElement.style.overscrollBehavior = 'none';
  if (document.body) document.body.style.overscrollBehavior = 'none';

  // Already injected (e.g. by a host page)?
  if ((window as unknown as { Telegram?: unknown }).Telegram) {
    applyTelegram();
    return;
  }

  const s = document.createElement('script');
  s.src = 'https://telegram.org/js/telegram-web-app.js';
  s.async = false;
  s.onload = applyTelegram;
  document.head.appendChild(s);
}

// --- Telegram BackButton, synced with the router -------------------------
// We keep a single handler registered so navigation owns the native back arrow.
let backHandler: (() => void) | null = null;

export function syncTelegramBackButton(visible: boolean, onBack: () => void): void {
  const tg = getTelegramWebApp();
  const bb = tg?.BackButton;
  if (!bb) return;
  try {
    if (backHandler) bb.offClick?.(backHandler);
    backHandler = onBack;
    bb.onClick?.(backHandler);
    if (visible) bb.show?.();
    else bb.hide?.();
  } catch {}
}
