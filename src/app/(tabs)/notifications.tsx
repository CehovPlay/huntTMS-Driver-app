import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { BellOff } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { PressableScale } from '@/components/pressable-scale';
import { Appear } from '@/components/appear';
import { C } from '@/lib/theme';
import { notifIcon, type NotifType } from '@/lib/notifications';
import {
  markDriverNotificationRead,
  notifyDriverNotificationUnreadChanged,
  useDriverNotifications,
  useDriverNotificationUnreadCount,
  type DriverNotification,
} from '@/lib/api/notifications';

function isUnread(n: DriverNotification): boolean {
  return n.read === false || (!n.read && !n.readAt);
}

function displayType(n: DriverNotification): NotifType {
  const t = String(n.type ?? n.entityType ?? '').toLowerCase();
  if (t.includes('load')) return 'load';
  if (t.includes('message')) return 'message';
  if (t.includes('success')) return 'success';
  return 'alert';
}

function notificationTime(n: DriverNotification): string {
  if (!n.createdAt) return '';
  const d = new Date(n.createdAt);
  if (Number.isNaN(d.getTime())) return String(n.createdAt);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function loadHref(n: DriverNotification): never | null {
  if (String(n.entityType ?? n.type ?? '').toUpperCase() !== 'LOAD') return null;
  if (n.entityId === null || n.entityId === undefined) return null;
  return { pathname: '/load/[id]', params: { id: String(n.entityId), variant: 'current' } } as never;
}

// Root tab version of the notifications hub (no Back button — reached from the
// tab bar). Extra bottom padding clears the floating tab bar.
export default function NotificationsTab() {
  const q = useDriverNotifications();
  const count = useDriverNotificationUnreadCount();
  const insets = useSafeAreaInsets();
  const [marking, setMarking] = useState(false);
  const feed = q.data ?? [];
  const unread = count.data ?? feed.filter(isUnread).length;

  const onRefresh = useCallback(() => {
    q.refetch();
    count.refetch();
  }, [count.refetch, q.refetch]);

  useFocusEffect(onRefresh);

  const markAllRead = async () => {
    if (marking) return;
    setMarking(true);
    try {
      await Promise.all(feed.filter(isUnread).map((n) => markDriverNotificationRead(n.id)));
      notifyDriverNotificationUnreadChanged();
      await Promise.all([q.refetch(), count.refetch()]);
    } finally {
      setMarking(false);
    }
  };

  const openNotification = async (n: DriverNotification) => {
    if (isUnread(n)) {
      await markDriverNotificationRead(n.id);
      notifyDriverNotificationUnreadChanged();
      await Promise.all([q.refetch(), count.refetch()]);
    }
    const href = loadHref(n);
    if (href) router.push(href);
  };

  return (
    <View className="flex-1 bg-accent">
      <SafeAreaView edges={['top']} className="border-b border-border bg-background">
        <View className="h-12 flex-row items-center justify-between px-4">
          <Text className="font-sans-semibold text-base text-foreground">Notifications</Text>
          {unread > 0 ? (
            <Pressable onPress={markAllRead} disabled={marking} hitSlop={8} accessibilityRole="button" accessibilityLabel="Mark all read" className="active:opacity-60">
              <Text className="font-sans-medium text-sm" style={{ color: C.foreground }}>
                {marking ? 'Reading...' : 'Read all'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>

      {q.loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="font-sans text-base text-muted-foreground">Loading notifications...</Text>
        </View>
      ) : q.error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Pressable onPress={onRefresh} className="rounded-3xl bg-background p-5 active:opacity-70">
            <Text className="text-center font-sans text-base text-muted-foreground">Could not load notifications. Tap to retry.</Text>
          </Pressable>
        </View>
      ) : feed.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-2">
          <BellOff size={32} color={C.border} />
          <Text className="font-sans text-base text-muted-foreground">No notifications</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ gap: 8, padding: 16, paddingBottom: insets.bottom + 96 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={q.refreshing || count.refreshing} onRefresh={onRefresh} tintColor={C.mutedForeground} colors={[C.foreground]} />}
        >
          {feed.map((n, i) => {
            const unreadItem = isUnread(n);
            const { icon: Icon, color } = notifIcon(displayType(n));
            return (
              <Appear key={n.id} index={i}>
                <PressableScale onPress={() => openNotification(n)} className="flex-row gap-3 rounded-3xl bg-background p-4 active:opacity-90">
                  <View className="relative">
                    <View className="size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: C.accent }}>
                      <Icon size={20} color={color} />
                    </View>
                    {unreadItem ? <View className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-background" style={{ backgroundColor: C.foreground }} /> : null}
                  </View>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-start gap-2">
                      <Text className="flex-1 font-sans-semibold text-[15px] leading-5 text-foreground" numberOfLines={1} style={{ opacity: unreadItem ? 1 : 0.85 }}>
                        {n.title}
                      </Text>
                      <Text className="font-sans text-xs text-muted-foreground" style={{ marginTop: 1 }}>
                        {notificationTime(n)}
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
