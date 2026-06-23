import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';

import { haptics } from '@/lib/haptics';
import { C } from '@/lib/theme';

// Celebratory success badge: a ring pulses out, the filled circle springs in,
// then the check pops. Fires a success haptic on mount.
export function SuccessCheck({ size = 72, color = C.foreground, iconColor = C.background }: { size?: number; color?: string; iconColor?: string }) {
  const reduce = useReducedMotion();
  const circle = useSharedValue(0);
  const check = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    haptics.success();
    if (reduce) {
      circle.value = 1;
      check.value = 1;
      ring.value = 1; // fully expanded → ring is invisible, no pulse
      return;
    }
    circle.value = withSpring(1, { damping: 12, stiffness: 200 });
    check.value = withDelay(120, withSpring(1, { damping: 11, stiffness: 260 }));
    ring.value = withTiming(1, { duration: 700 });
  }, [circle, check, ring, reduce]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circle.value }],
    opacity: circle.value,
  }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: check.value }],
    opacity: check.value,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.5,
    transform: [{ scale: 1 + ring.value * 0.6 }],
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          { position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' },
          circleStyle,
        ]}
      >
        <Animated.View style={checkStyle}>
          <Check size={size * 0.5} color={iconColor} strokeWidth={3} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}
