import { useCallback, useEffect, useRef } from 'react';
import { AppState, Text, useWindowDimensions, View } from 'react-native';
import { usePathname } from 'expo-router';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Bell, Map, MessageCircle, Package } from 'lucide-react-native';

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
import { useDriverNotificationUnreadCount } from '@/lib/api/notifications';
import { useDriverChatUnreadCount } from '@/lib/api/chat';
import { refreshDriverLoads } from '@/lib/api/use-api-query';
import { haptics } from '@/lib/haptics';
import { C } from '@/lib/theme';

const ICONS: Record<string, typeof Map> = { loads: Package, map: Map, notifications: Bell, messages: MessageCircle };
const LABELS: Record<string, string> = { loads: 'Loads', map: 'Map', notifications: 'Alerts', messages: 'Messages' };

// Geometry of the floating bar.
const MARGIN = 14;
const BAR_H = 64;
const CR = 16; // corner radius — matches the app's rounded-3xl cards
const RAISE = 0;

function barPath(w: number) {
  const h = BAR_H;
  return [
    `M ${CR},0`,
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

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const notificationUnreadQuery = useDriverNotificationUnreadCount();
  const chatUnreadQuery = useDriverChatUnreadCount();
  const notificationUnread = notificationUnreadQuery.data ?? 0;
  const chatUnread = chatUnreadQuery.data ?? 0;
  const barW = width - MARGIN * 2;
  // The query hook already fetches on mount; suppress the tab effect's duplicate initial request.
  const lastUnreadRefreshAt = useRef(Date.now());
  const previousUnread = useRef<number | null>(null);

  const refreshBadges = useCallback(() => {
    if (Date.now() - lastUnreadRefreshAt.current < 1_500) return;
    lastUnreadRefreshAt.current = Date.now();
    notificationUnreadQuery.refetch();
    chatUnreadQuery.refetch();
  }, [chatUnreadQuery.refetch, notificationUnreadQuery.refetch]);

  useEffect(() => {
    refreshBadges();
  }, [pathname, refreshBadges]);

  useEffect(() => {
    let nativeActive = AppState.currentState === 'active';
    let webVisible = typeof document === 'undefined' || document.visibilityState === 'visible';
    let active = nativeActive && webVisible;
    const updateActive = () => {
      const next = nativeActive && webVisible;
      if (next && !active) refreshBadges();
      active = next;
    };
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      nativeActive = state === 'active';
      updateActive();
    });
    const onVisibilityChange = () => {
      webVisible = document.visibilityState === 'visible';
      updateActive();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }
    const poll = setInterval(() => {
      if (active) refreshBadges();
    }, 30_000);
    return () => {
      clearInterval(poll);
      appStateSubscription.remove();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, [refreshBadges]);

  useEffect(() => {
    if (previousUnread.current !== null && notificationUnread > previousUnread.current) {
      refreshDriverLoads().catch(() => undefined);
    }
    previousUnread.current = notificationUnread;
  }, [notificationUnread]);

  const press = (name: string, key: string, focused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) {
      haptics.selection();
      navigation.navigate(name);
    }
  };

  const visibleRoutes = state.routes.filter((r) => r.name !== 'copilot');
  const isFocused = (r: (typeof state.routes)[number]) => state.index === state.routes.indexOf(r);
  const badgeFor = (name: string) => {
    if (name === 'notifications') return notificationUnread;
    if (name === 'messages') return chatUnread;
    return 0;
  };

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingTop: RAISE, paddingBottom: Math.max(insets.bottom, 10) }}
    >
      <View style={{ width: barW, height: BAR_H }}>
        <Svg width={barW} height={BAR_H} style={{ position: 'absolute', top: 0, left: 0 }}>
          <Path d={barPath(barW)} fill={C.background} stroke={C.border} strokeWidth={1} />
        </Svg>
        <View style={{ flexDirection: 'row', height: BAR_H }}>
          {visibleRoutes.map((r) => (
            <TabItem key={r.key} focused={isFocused(r)} Icon={ICONS[r.name] ?? Map} label={LABELS[r.name] ?? r.name} badge={badgeFor(r.name)} onPress={() => press(r.name, r.key, isFocused(r))} />
          ))}
        </View>
      </View>
    </View>
  );
}
