import { useRef, useState } from 'react';
import { Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { haptics } from '@/lib/haptics';

const TRACK_H = 62;
const PAD = 5;
const THUMB = TRACK_H - PAD * 2; // 52 — equilateral square thumb

type Variant = 'dark' | 'teal' | 'light';
const VARIANTS: Record<Variant, { track: string; thumb: string; text: string; icon: string }> = {
  dark: { track: '#171717', thumb: '#ffffff', text: '#fafafa', icon: '#171717' },
  teal: { track: '#0d9488', thumb: '#ffffff', text: '#ffffff', icon: '#0d9488' },
  light: { track: '#f5f5f5', thumb: '#171717', text: '#171717', icon: '#ffffff' },
};

type Props = { label: string; onConfirm: () => void; variant?: Variant; disabled?: boolean };

// Web slider: real drag via RNW's responder system (works with mouse & touch in
// the browser / Telegram webview). The native file uses gesture-handler + reanimated.
export function SwipeButton({ label, onConfirm, variant = 'dark', disabled = false }: Props) {
  const c = VARIANTS[variant];
  const [width, setWidth] = useState(0);
  const [x, setX] = useState(0);
  const startX = useRef(0);
  const startPage = useRef(0);
  const maxX = Math.max(0, width - THUMB - PAD * 2);

  const onGrant = (e: GestureResponderEvent) => {
    if (disabled) return;
    startX.current = x;
    startPage.current = e.nativeEvent.pageX;
  };
  const onMove = (e: GestureResponderEvent) => {
    if (disabled) return;
    const dx = e.nativeEvent.pageX - startPage.current;
    setX(Math.min(Math.max(0, startX.current + dx), maxX));
  };
  const onRelease = () => {
    if (disabled) return;
    if (maxX > 0 && x > maxX * 0.85) {
      setX(maxX);
      haptics.success();
      onConfirm();
      setTimeout(() => setX(0), 240);
    } else {
      setX(0);
    }
  };

  const labelOpacity = maxX > 0 ? Math.max(0, 1 - x / (maxX * 0.6)) : 1;

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className="justify-center overflow-hidden rounded-2xl"
      style={{ position: 'relative', backgroundColor: c.track, height: TRACK_H, opacity: disabled ? 0.45 : 1 }}
    >
      <Text
        style={{ paddingLeft: THUMB, color: c.text, opacity: labelOpacity }}
        className="text-center font-sans-medium text-base"
      >
        {label}
      </Text>
      <View
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        onResponderGrant={onGrant}
        onResponderMove={onMove}
        onResponderRelease={onRelease}
        onResponderTerminate={onRelease}
        style={{ position: 'absolute', left: PAD, top: PAD, width: THUMB, height: THUMB, backgroundColor: c.thumb, transform: [{ translateX: x }] }}
        className="items-center justify-center rounded-xl"
      >
        <ArrowRight size={20} color={c.icon} />
      </View>
    </View>
  );
}
