// Web/Telegram haptics — routes through Telegram's native HapticFeedback when
// running inside the Mini App; no-ops in a plain browser (no vibration API use).
import { getTelegramWebApp } from './telegram.web';

const hf = () => getTelegramWebApp()?.HapticFeedback;

export const haptics = {
  light: () => { try { hf()?.impactOccurred?.('light'); } catch {} },
  medium: () => { try { hf()?.impactOccurred?.('medium'); } catch {} },
  heavy: () => { try { hf()?.impactOccurred?.('heavy'); } catch {} },
  selection: () => { try { hf()?.selectionChanged?.(); } catch {} },
  success: () => { try { hf()?.notificationOccurred?.('success'); } catch {} },
  warning: () => { try { hf()?.notificationOccurred?.('warning'); } catch {} },
  error: () => { try { hf()?.notificationOccurred?.('error'); } catch {} },
};
