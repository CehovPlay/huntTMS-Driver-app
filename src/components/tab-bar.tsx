import { useEffect } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Bell, Map, MessageCircle, Package, Sparkles } from 'lucide-react-native';

// Minimal local typing for the tabBar render prop (@react-navigation/bottom-tabs
// isn't a direct dependency, so we don't import its types).
type TabRoute = { key: string; name: string };
type TabBarProps = {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

import { Pressable } from '@/components/pressable';
import { CONV_UNREAD } from '@/lib/chat';
import { useNotifications } from '@/lib/notifications';
import { haptics } from '@/lib/haptics';
import { C } from '@/lib/theme';

const ICONS: Record<string, typeof Map> = { loads: Package, map: Map, messages: MessageCircle, notifications: Bell };
const LABELS: Record<string, string> = { loads: 'Loads', map: 'Map', messages: 'Chat', notifications: 'Alerts' };

// Geometry of the floating bar + center notch.
const MARGIN = 14;
const BAR_H = 64;
const CR = 16; // corner radius — matches the app's rounded-3xl cards
const DIP_HALF = 48; // half-width of the center notch opening
const DIP_DEPTH = 26; // how far the notch dips into the bar
const BOT = 62; // raised bot button diameter
const RAISE = BOT / 2 + 12; // top padding so the raised bot is reserved inside the bar (doesn't overlap screen content)

// SVG path: rounded rectangle (16px corners) with a smooth concave dip in the top-center.
function barPath(w: number) {
  const cx = w / 2;
  const h = BAR_H;
  return [
    `M ${CR},0`,
    `L ${cx - DIP_HALF},0`,
    `C ${cx - DIP_HALF + 16},0 ${cx - 28},${DIP_DEPTH} ${cx},${DIP_DEPTH}`,
    `C ${cx + 28},${DIP_DEPTH} ${cx + DIP_HALF - 16},0 ${cx + DIP_HALF},0`,
    `L ${w - CR},0`,
    `A ${CR},${CR} 0 0 1 ${w},${CR}`,
    `L ${w},${h - CR}`,
    `A ${CR},${CR} 0 0 1 ${w - CR},${h}`,
    `L ${CR},${h}`,
    `A ${CR},${CR} 0 0 1 0,${h - CR}`,
    `L 0,${CR}`,
    `A ${CR},${CR} 0 0 1 ${CR},0`,
    'Z',
  ].join(' ');
}

function TabItem({ focused, Icon, label, badge, onPress }: { focused: boolean; Icon: typeof Map; label: string; badge: number; onPress: () => void }) {
  const reduce = useReducedMotion();
  const s = useSharedValue(1);
  const p = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    if (reduce) {
      p.value = focused ? 1 : 0;
      return;
    }
    p.value = withTiming(focused ? 1 : 0, { duration: 200 });
    if (focused) s.value = withSpring(1.14, { damping: 9, stiffness: 320 }, () => (s.value = withSpring(1, { damping: 16, stiffness: 220 })));
  }, [focused, p, s, reduce]);
  const pill = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.8 + p.value * 0.2 }] }));
  const icon = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: focused }} className="flex-1 items-center justify-center" style={{ height: BAR_H }}>
      <Animated.View pointerEvents="none" className="absolute size-10 rounded-full bg-accent" style={pill} />
      <Animated.View style={icon}>
        <Icon size={22} color={focused ? C.foreground : C.mutedForeground} strokeWidth={2} />
        {badge > 0 ? (
          <View className="absolute -right-2 -top-1.5 min-w-4 items-center justify-center rounded-full px-1" style={{ height: 16, backgroundColor: C.destructive }}>
            <Text className="font-sans-semibold text-[10px] text-white">{badge}</Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function BotButton({ focused, onPress }: { focused: boolean; onPress: () => void }) {
  const reduce = useReducedMotion();
  const s = useSharedValue(1);
  useEffect(() => {
    if (!reduce && focused) s.value = withSpring(1.08, { damping: 8, stiffness: 300 }, () => (s.value = withSpring(1, { damping: 14, stiffness: 200 })));
  }, [focused, s, reduce]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[{ position: 'absolute', top: -BOT / 2 + 4, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }, style]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="HuntBot"
        accessibilityState={{ selected: focused }}
        style={{
          width: BOT,
          height: BOT,
          borderRadius: BOT / 2,
          backgroundColor: C.teal,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        <Sparkles size={28} color="#fff" strokeWidth={2.2} />
      </Pressable>
    </Animated.View>
  );
}

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { unread } = useNotifications();
  const barW = width - MARGIN * 2;

  const press = (name: string, key: string, focused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) {
      haptics.selection();
      navigation.navigate(name);
    }
  };

  const side = state.routes.filter((r) => r.name !== 'copilot');
  const copilot = state.routes.find((r) => r.name === 'copilot');
  const copilotFocused = copilot ? state.index === state.routes.indexOf(copilot) : false;
  const isFocused = (r: (typeof state.routes)[number]) => state.index === state.routes.indexOf(r);
  const badgeFor = (name: string) => (name === 'notifications' ? unread : name === 'messages' ? CONV_UNREAD : 0);

  const left = side.slice(0, 2);
  const right = side.slice(2);

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingTop: RAISE, paddingBottom: Math.max(insets.bottom, 10) }}
    >
      <View style={{ width: barW, height: BAR_H }}>
        <Svg width={barW} height={BAR_H} style={{ position: 'absolute', top: 0, left: 0 }}>
          <Path d={barPath(barW)} fill={C.background} stroke={C.border} strokeWidth={1} />
        </Svg>
        {/* icon row with a gap in the middle for the notch */}
        <View style={{ flexDirection: 'row', height: BAR_H }}>
          {left.map((r) => (
            <TabItem key={r.key} focused={isFocused(r)} Icon={ICONS[r.name] ?? Map} label={LABELS[r.name] ?? r.name} badge={badgeFor(r.name)} onPress={() => press(r.name, r.key, isFocused(r))} />
          ))}
          <View style={{ width: DIP_HALF * 2 }} />
          {right.map((r) => (
            <TabItem key={r.key} focused={isFocused(r)} Icon={ICONS[r.name] ?? Map} label={LABELS[r.name] ?? r.name} badge={badgeFor(r.name)} onPress={() => press(r.name, r.key, isFocused(r))} />
          ))}
        </View>
        {copilot ? <BotButton focused={copilotFocused} onPress={() => press('copilot', copilot.key, copilotFocused)} /> : null}
      </View>
    </View>
  );
}
