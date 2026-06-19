// Native (iOS/Android) build: Telegram is web-only, so these are no-ops.
// The web implementations live in `telegram.web.ts`.
export function initTelegram(): void {}
export function getTelegramWebApp(): undefined {
  return undefined;
}
export function syncTelegramBackButton(_visible: boolean, _onBack: () => void): void {}
