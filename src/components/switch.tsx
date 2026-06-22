import { useEffect } from 'react';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Pressable } from '@/components/pressable';
import { C, shadowXs } from '@/lib/theme';

const SPRING = { damping: 18, stiffness: 260, mass: 0.5 };
const TRAVEL = 18; // 44 width - 3 pad*2 - 20 thumb

// shadcn-style switch — fully token-driven, consistent across web/native. The
// thumb springs left/right and the track colour cross-fades between off (input)
// and on (primary) as it moves.
export function Switch({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const p = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    p.value = withSpring(value ? 1 : 0, SPRING);
  }, [value, p]);

  // Read tokens at render so they track the theme; pass to the worklet via deps.
  const off = C.input;
  const on = C.primary;
  const thumbColor = C.background;

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], [off, on]),
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(p.value, [0, 1], [0, TRAVEL]) }],
  }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      hitSlop={8}
    >
      <Animated.View
        style={[
          {
            width: 44,
            height: 26,
            borderRadius: 13,
            padding: 3,
            justifyContent: 'center',
            opacity: disabled ? 0.5 : 1,
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            { width: 20, height: 20, borderRadius: 10, backgroundColor: thumbColor, ...shadowXs },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
