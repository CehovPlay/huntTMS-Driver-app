import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Map, MessageCircle, Package } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { CONV_UNREAD } from '@/lib/chat';
import { C } from '@/lib/theme';

const ICONS: Record<string, typeof Map> = {
  loads: Package,
  map: Map,
  messages: MessageCircle,
};

const LABELS: Record<string, string> = {
  loads: 'Loads',
  map: 'Map',
  messages: 'Chats',
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row bg-background"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const Icon = ICONS[route.name] ?? Map;
        const label = LABELS[route.name] ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            className="flex-1 border-t border-border px-5 pb-1 pt-[9px]"
          >
            <View
              className={`h-[62px] items-center justify-center gap-1 rounded-xl px-4 ${
                focused ? 'bg-accent' : ''
              }`}
            >
              <View>
                <Icon size={20} color={focused ? '#171717' : '#737373'} strokeWidth={2} />
                {route.name === 'messages' && CONV_UNREAD > 0 ? (
                  <View
                    className="absolute -right-2 -top-1 size-4 items-center justify-center rounded-full"
                    style={{ backgroundColor: C.destructive }}
                  >
                    <Text className="font-sans-semibold text-[10px] text-white">{CONV_UNREAD}</Text>
                  </View>
                ) : null}
              </View>
              <Text
                className={`text-xs font-sans-medium ${
                  focused ? 'text-accent-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
