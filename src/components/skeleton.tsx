import { useEffect, useRef } from 'react';
import { Animated, type DimensionValue, type ViewStyle } from 'react-native';

import { C } from '@/lib/theme';

// Pulsing placeholder block. Uses inline style (NativeWind className doesn't
// apply to Animated.View on web) + the JS driver (native opacity driver isn't
// supported on react-native-web).
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const op = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1, duration: 650, useNativeDriver: false }),
        Animated.timing(op, { toValue: 0.5, duration: 650, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [op]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: C.border, opacity: op }, style]}
    />
  );
}
