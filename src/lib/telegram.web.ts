// Web/Telegram Mini App init. Loads the Telegram WebApp SDK and expands the
// app to full screen so it doesn't open as a small bottom sheet in Telegram.
// Outside Telegram (plain browser) every call no-ops gracefully.

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

type TgWebApp = {
  ready?: () => void;
  expand?: () => void;
  requestFullscreen?: () => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  disableVerticalSwipes?: () => void;
  HapticFeedback?: TgHaptic;
  BackButton?: TgBackButton;
};

let started = false;

export function getTelegramWebApp(): TgWebApp | undefined {
  return (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;
}

function applyTelegram() {
  const tg = getTelegramWebApp();
  if (!tg) return;
  try { tg.ready?.(); } catch {}
  // Expand to full height, but NOT requestFullscreen — fullscreen makes Telegram
  // overlay floating ⌄/⋯ controls on top of our header. expand() gives the height
  // without the overlapping chrome.
  try { tg.expand?.(); } catch {}
  // We use the app's own in-screen back buttons; hide Telegram's native one.
  try { tg.BackButton?.hide?.(); } catch {}
  // Keep Telegram's chrome matching the app's light theme
  try { tg.setHeaderColor?.('#ffffff'); } catch {}
  try { tg.setBackgroundColor?.('#ffffff'); } catch {}
  // A swipe-down shouldn't close the app while the driver is mid-task
  try { tg.disableVerticalSwipes?.(); } catch {}
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
