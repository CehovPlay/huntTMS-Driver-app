import { useEffect, type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

// Lightweight mount-in animation (fade + small rise). Uses an imperative shared
// value (NOT the declarative entering=/Layout API, which crashes on device here),
// so it's safe on native and web. Stagger lists by passing index.
export function Appear({
  children,
  delay = 0,
  index,
  step = 55,
  distance = 12,
  duration = 380,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  index?: number;
  step?: number;
  distance?: number;
  duration?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  // Cap the stagger so long lists don't trail off with huge delays.
  const wait = index != null ? Math.min(index, 6) * step : delay;

  useEffect(() => {
    if (reduce) {
      p.value = 1;
      return;
    }
    p.value = withDelay(wait, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
  }, [p, wait, duration, reduce]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * distance }],
  }));

  return (
    <Animated.View className={className} style={[style, animStyle]}>
      {children}
    </Animated.View>
  );
}
