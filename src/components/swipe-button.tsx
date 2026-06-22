import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ArrowRight } from 'lucide-react-native';
import { haptics } from '@/lib/haptics';
import { C } from '@/lib/theme';

const TRACK_H = 62;
const PAD = 5;
const THUMB = TRACK_H - PAD * 2; // 52 — equilateral square thumb
const SPRING = { damping: 20, stiffness: 220, mass: 0.6 };

// `primary` follows the theme tokens (dark track in light theme, light track in
// dark theme — the same ink/surface flip as every other primary CTA); `teal` is
// a constant brand confirm. Resolved at render so it tracks theme changes.
type Variant = 'primary' | 'teal';
const TEAL = { track: '#6f19da', thumb: '#ffffff', text: '#ffffff', icon: '#6f19da' } as const;
const variantColors = (variant: Variant) =>
  variant === 'teal'
    ? TEAL
    : { track: C.primary, thumb: C.background, text: C.primaryForeground, icon: C.primary };

type Props = {
  label: string;
  onConfirm: () => void;
  variant?: Variant;
  disabled?: boolean;
};

export function SwipeButton({ label, onConfirm, variant = 'primary', disabled = false }: Props) {
  const x = useSharedValue(0);
  const startX = useSharedValue(0);
  const maxX = useSharedValue(0);
  const c = variantColors(variant);

  const onLayout = (e: LayoutChangeEvent) => {
    maxX.value = Math.max(0, e.nativeEvent.layout.width - THUMB - PAD * 2);
  };

  const confirmWithHaptic = () => {
    haptics.success();
    onConfirm();
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onBegin(() => {
      startX.value = x.value;
    })
    .onUpdate((e) => {
      x.value = Math.min(Math.max(0, startX.value + e.translationX), maxX.value);
    })
    .onEnd(() => {
      if (x.value > maxX.value * 0.85) {
        // snap to end, fire action, then spring home so the control is reusable
        x.value = withTiming(maxX.value, { duration: 110 }, (done) => {
          if (done) {
            runOnJS(confirmWithHaptic)();
            x.value = withDelay(180, withSpring(0, SPRING));
          }
        });
      } else {
        x.value = withSpring(0, SPRING);
      }
    })
    .onFinalize(() => {
      // safety: if the gesture was cancelled before onEnd, return home
      if (x.value < maxX.value * 0.85) {
        x.value = withSpring(0, SPRING);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, maxX.value * 0.6], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      accessibilityHint={disabled ? undefined : 'Swipe right, or double tap to confirm'}
      onAccessibilityTap={disabled ? undefined : confirmWithHaptic}
      className="justify-center overflow-hidden rounded-2xl"
      style={{ position: 'relative', backgroundColor: c.track, height: TRACK_H, opacity: disabled ? 0.45 : 1 }}
    >
      {/* centered label (offset right of thumb so it isn't covered at rest) */}
      <Animated.Text
        style={[labelStyle, { paddingLeft: THUMB, color: c.text }]}
        className="text-center font-sans-medium text-base"
      >
        {label}
      </Animated.Text>

      {/* draggable thumb */}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            { position: 'absolute', left: PAD, top: PAD, width: THUMB, height: THUMB, backgroundColor: c.thumb },
            thumbStyle,
          ]}
          className="items-center justify-center rounded-xl"
        >
          <ArrowRight size={20} color={c.icon} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
