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

const TRACK_H = 62;
const PAD = 5;
const THUMB = TRACK_H - PAD * 2; // 52 — equilateral square thumb
const SPRING = { damping: 20, stiffness: 220, mass: 0.6 };

type Variant = 'dark' | 'teal' | 'light';

const VARIANTS: Record<Variant, { track: string; thumb: string; text: string; icon: string }> = {
  dark: { track: '#171717', thumb: '#ffffff', text: '#fafafa', icon: '#171717' },
  teal: { track: '#0d9488', thumb: '#ffffff', text: '#ffffff', icon: '#0d9488' },
  light: { track: '#f5f5f5', thumb: '#171717', text: '#171717', icon: '#ffffff' },
};

type Props = {
  label: string;
  onConfirm: () => void;
  variant?: Variant;
  disabled?: boolean;
};

export function SwipeButton({ label, onConfirm, variant = 'dark', disabled = false }: Props) {
  const x = useSharedValue(0);
  const startX = useSharedValue(0);
  const maxX = useSharedValue(0);
  const c = VARIANTS[variant];

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
