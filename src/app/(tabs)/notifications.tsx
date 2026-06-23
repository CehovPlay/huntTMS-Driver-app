import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BellOff } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { PressableScale } from '@/components/pressable-scale';
import { Appear } from '@/components/appear';
import { C } from '@/lib/theme';
import { useNotifications, notifIcon } from '@/lib/notifications';

// Root tab version of the notifications hub (no Back button — reached from the
// tab bar). Extra bottom padding clears the floating tab bar.
export default function NotificationsTab() {
  const { feed, unread, markAllRead } = useNotifications();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <View className="flex-1 bg-accent">
      <SafeAreaView edges={['top']} className="border-b border-border bg-background">
        <View className="h-12 flex-row items-center justify-between px-4">
          <Text className="font-sans-semibold text-base text-foreground">Notifications</Text>
          {unread > 0 ? (
            <Pressable onPress={markAllRead} hitSlop={8} accessibilityRole="button" accessibilityLabel="Mark all read" className="active:opacity-60">
              <Text className="font-sans-medium text-sm" style={{ color: C.foreground }}>
                Read all
              </Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>

      {feed.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2">
          <BellOff size={32} color={C.border} />
          <Text className="font-sans text-base text-muted-foreground">No notifications</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ gap: 8, padding: 16, paddingBottom: insets.bottom + 96 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.mutedForeground} colors={[C.foreground]} />}
        >
          {feed.map((n, i) => {
            const { icon: Icon, color } = notifIcon(n.type);
            return (
              <Appear key={n.id} index={i}>
                <PressableScale onPress={() => n.href && router.push(n.href as never)} className="flex-row gap-3 rounded-3xl bg-background p-4 active:opacity-90">
                  <View className="relative">
                    <View className="size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: C.accent }}>
                      <Icon size={20} color={color} />
                    </View>
                    {!n.read ? <View className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-background" style={{ backgroundColor: C.foreground }} /> : null}
                  </View>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-start gap-2">
                      <Text className="flex-1 font-sans-semibold text-[15px] leading-5 text-foreground" numberOfLines={1} style={{ opacity: n.read ? 0.85 : 1 }}>
                        {n.title}
                      </Text>
                      <Text className="font-sans text-xs text-muted-foreground" style={{ marginTop: 1 }}>
                        {n.time}
                      </Text>
                    </View>
                    {n.body ? (
                      <Text className="font-sans text-sm leading-5 text-muted-foreground" numberOfLines={2}>
                        {n.body}
                      </Text>
                    ) : null}
                  </View>
                </PressableScale>
              </Appear>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
