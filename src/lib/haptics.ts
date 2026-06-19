// Unified haptics — native build uses expo-haptics. (Web override in haptics.web.ts
// routes through Telegram's native HapticFeedback.)
import * as Haptics from 'expo-haptics';

const swallow = () => {};

export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(swallow),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(swallow),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(swallow),
  selection: () => Haptics.selectionAsync().catch(swallow),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(swallow),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(swallow),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(swallow),
};
