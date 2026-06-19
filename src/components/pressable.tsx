import { Pressable as RNPressable, type PressableProps } from 'react-native';
import { haptics } from '@/lib/haptics';

// Drop-in replacement for RN Pressable that fires a light haptic on every press.
// (Disabled pressables don't fire onPress, so no haptic when disabled.)
// Default hitSlop of 8 guarantees a ≥60px touch zone even for 48px icon buttons
// (48 + 8·2 = 64), per the app-wide touch-target rule. Override via the prop.
export function Pressable({ onPress, hitSlop = 8, ...props }: PressableProps) {
  const handlePress: PressableProps['onPress'] = (e) => {
    haptics.light();
    onPress?.(e);
  };
  return <RNPressable onPress={handlePress} hitSlop={hitSlop} {...props} />;
}
