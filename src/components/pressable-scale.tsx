import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Pressable as RNPressable, type PressableProps } from 'react-native';
import { haptics } from '@/lib/haptics';

const SPRING = { damping: 18, stiffness: 320, mass: 0.5 };

type Props = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  className?: string;
  scaleTo?: number;
  wrapperStyle?: StyleProp<ViewStyle>; // e.g. { flex: 1 } for row buttons
};

// Tactile press: spring-scales the whole element on touch (transform only — no layout
// work, so it's cheap and crash-safe) and fires a light haptic. The animated scale lives
// on an outer Animated.View so NativeWind `className` on the inner Pressable keeps working.
export function PressableScale({ children, onPress, scaleTo = 0.97, wrapperStyle, ...props }: Props) {
  const s = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  const handlePress: PressableProps['onPress'] = (e) => {
    haptics.light();
    onPress?.(e);
  };

  return (
    <Animated.View style={[{ width: '100%' }, wrapperStyle, aStyle]}>
      <RNPressable
        onPress={handlePress}
        onPressIn={() => {
          s.value = withSpring(scaleTo, SPRING);
        }}
        onPressOut={() => {
          s.value = withSpring(1, SPRING);
        }}
        {...props}
      >
        {children}
      </RNPressable>
    </Animated.View>
  );
}
