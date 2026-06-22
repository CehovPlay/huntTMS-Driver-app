import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Map, MessageCircle, Package } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { CONV_UNREAD } from '@/lib/chat';
import { haptics } from '@/lib/haptics';
import { C } from '@/lib/theme';

const ICONS: Record<string, typeof Map> = { loads: Package, map: Map, messages: MessageCircle };
const LABELS: Record<string, string> = { loads: 'Loads', map: 'Map', messages: 'Chats' };
const PILL_SPRING = { damping: 16, stiffness: 220, mass: 0.6 };

function TabItem({
  focused,
  Icon,
  label,
  unread,
  onPress,
}: {
  focused: boolean;
  Icon: typeof Map;
  label: string;
  unread: number;
  onPress: () => void;
}) {
  const p = useSharedValue(focused ? 1 : 0); // pill fill
  const s = useSharedValue(1); // icon bounce

  useEffect(() => {
    p.value = withTiming(focused ? 1 : 0, { duration: 200 });
    if (focused) {
      s.value = withSpring(1.12, { damping: 9, stiffness: 320 }, () => {
        s.value = withSpring(1, PILL_SPRING);
      });
    }
  }, [focused, p, s]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: 0.9 + p.value * 0.1 }],
  }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      className="flex-1 border-t border-border px-5 pb-1 pt-[9px]"
    >
      <View className="h-[62px] items-center justify-center gap-1 px-4">
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0 rounded-xl bg-accent"
          style={pillStyle}
        />
        <Animated.View style={iconStyle}>
          <Icon size={20} color={focused ? C.foreground : C.mutedForeground} strokeWidth={2} />
          {label === 'Chats' && unread > 0 ? (
            <View
              className="absolute -right-2 -top-1 size-4 items-center justify-center rounded-full"
              style={{ backgroundColor: C.destructive }}
            >
              <Text className="font-sans-semibold text-[10px] text-white">{unread}</Text>
            </View>
          ) : null}
        </Animated.View>
        <Text
          className={`text-xs font-sans-medium ${focused ? 'text-accent-foreground' : 'text-muted-foreground'}`}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-row bg-background" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            haptics.selection();
            navigation.navigate(route.name);
          }
        };
        return (
          <TabItem
            key={route.key}
            focused={focused}
            Icon={ICONS[route.name] ?? Map}
            label={LABELS[route.name] ?? route.name}
            unread={CONV_UNREAD}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}
