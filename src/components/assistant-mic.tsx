import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Loader2, Mic } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { C } from '@/lib/theme';

// One pulsing ring that expands and fades. Driven by a looping shared value so it
// only animates while `active`. Color is passed in as a plain string (resolved at
// render via the C proxy) — never read inside the worklet.
function Ring({ active, size, color, delay }: { active: boolean; size: number; color: string; delay: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (active) {
      p.value = 0;
      p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) }), -1, false));
    } else {
      cancelAnimation(p);
      p.value = withTiming(0, { duration: 160 });
    }
  }, [active, delay, p]);
  const style = useAnimatedStyle(() => ({ opacity: (1 - p.value) * 0.4, transform: [{ scale: 0.7 + p.value * 1.1 }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]}
    />
  );
}

// Five-bar voice waveform; each bar scales on its own loop while listening.
function Waveform({ active, color }: { active: boolean; color: string }) {
  const bars = [0, 1, 2, 3, 4];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 22 }}>
      {bars.map((i) => (
        <Bar key={i} active={active} color={color} delay={i * 90} />
      ))}
    </View>
  );
}

function Bar({ active, color, delay }: { active: boolean; color: string; delay: number }) {
  const v = useSharedValue(0.3);
  useEffect(() => {
    if (active) {
      v.value = withDelay(delay, withRepeat(withTiming(1, { duration: 360, easing: Easing.inOut(Easing.quad) }), -1, true));
    } else {
      cancelAnimation(v);
      v.value = withTiming(0.3, { duration: 160 });
    }
  }, [active, delay, v]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: v.value }] }));
  return <Animated.View style={[{ width: 4, height: 22, borderRadius: 2, backgroundColor: color }, style]} />;
}

// Spinner that rotates while the assistant is "thinking".
function Spinner({ color }: { color: string }) {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(r);
  }, [r]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value * 360}deg` }] }));
  return (
    <Animated.View style={style}>
      <Loader2 size={30} color={color} strokeWidth={2.5} />
    </Animated.View>
  );
}

// The hero mic control. States: idle (tap to enable), wake (listening for the
// wake word — pulsing rings + mic glyph), listening (capturing a command —
// rings + live waveform), thinking (spinner). Glyph uses the primary accent.
export function AssistantMic({
  status,
  onPress,
}: {
  status: 'idle' | 'wake' | 'listening' | 'thinking';
  onPress: () => void;
}) {
  const listening = status === 'listening';
  // Animate (rings + button pulse) while the mic is working — unless the user
  // prefers reduced motion (accessibility).
  const reduce = useReducedMotion();
  const active = status === 'wake' || status === 'listening';
  const animate = active && !reduce;
  const accent = C.teal;
  const fg = '#fff';
  const SIZE = 84;

  // Gentle breathing pulse on the button itself while active.
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (animate) {
      pulse.value = withRepeat(withTiming(1, { duration: 950, easing: Easing.inOut(Easing.quad) }), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 160 });
    }
  }, [animate, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.06 }] }));

  return (
    <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
      {/* expanding wave rings */}
      <Ring active={animate} size={128} color={accent} delay={0} />
      <Ring active={animate} size={128} color={accent} delay={450} />
      <Ring active={animate} size={128} color={accent} delay={900} />
      <Ring active={animate} size={128} color={accent} delay={1350} />
      <Animated.View style={pulseStyle}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={active ? 'Stop listening' : 'Enable hands-free'}
          disabled={status === 'thinking'}
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            backgroundColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          {status === 'thinking' ? <Spinner color={fg} /> : listening ? <Waveform active={!reduce} color={fg} /> : <Mic size={34} color={fg} />}
        </Pressable>
      </Animated.View>
    </View>
  );
}
