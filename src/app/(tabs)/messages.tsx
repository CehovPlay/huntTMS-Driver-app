import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, Check, CheckCheck, FileText, Image as ImageIcon, MapPin, Mic, Package, Search, X } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { PressableScale } from '@/components/pressable-scale';
import { Logo } from '@/components/logo';
import { useNotifications } from '@/lib/notifications';
import { C } from '@/lib/theme';
import { CONVERSATIONS, type Conversation, type ConvStatus } from '@/lib/chat';

const STATUS_PILL: Record<ConvStatus, { bg: string; color: string }> = {
  'En route': { bg: '#fbbf24', color: '#171717' },
  Scheduled: { bg: '#f5f5f5', color: '#737373' },
  Delivered: { bg: '#0d9488', color: '#ffffff' },
  TONU: { bg: '#ef4444', color: '#ffffff' },
};

const KIND_ICON = {
  text: null,
  image: ImageIcon,
  file: FileText,
  voice: Mic,
} as const;

function ConvCard({ conv }: { conv: Conversation }) {
  const pill = STATUS_PILL[conv.load.status];
  const KindIcon = KIND_ICON[conv.lastKind];
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/chat', params: { id: conv.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${conv.dispatcher.name}, load ${conv.load.id}${conv.unread ? `, ${conv.unread} unread` : ''}`}
      className="flex-row gap-3 rounded-3xl bg-background p-4 active:opacity-90"
    >
      {/* avatar + online dot */}
      <View>
        <View className="size-12 items-center justify-center rounded-full" style={{ backgroundColor: C.primary }}>
          <Text className="font-sans-semibold text-base text-primary-foreground">{conv.dispatcher.initials}</Text>
        </View>
        {conv.dispatcher.online ? (
          <View
            className="absolute size-4 rounded-full border-[3px] border-background"
            style={{ backgroundColor: C.teal, bottom: -1, right: -1 }}
          />
        ) : null}
      </View>

      <View className="flex-1 gap-2">
        {/* name + time */}
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 font-sans-semibold text-base text-foreground" numberOfLines={1}>
            {conv.dispatcher.name}
          </Text>
          <Text className="font-sans text-xs text-muted-foreground">{conv.time}</Text>
        </View>

        {/* load id + status */}
        <View className="flex-row items-center gap-2">
          <Package size={15} color={C.mutedForeground} />
          <Text className="font-sans-medium text-sm text-foreground">{conv.load.id}</Text>
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: pill.bg }}>
            <Text className="font-sans-medium text-xs" style={{ color: pill.color }}>
              {conv.load.status}
            </Text>
          </View>
        </View>

        {/* route */}
        <View className="flex-row items-center gap-2">
          <MapPin size={15} color={C.mutedForeground} />
          <Text className="flex-1 font-sans text-sm text-muted-foreground" numberOfLines={1}>
            {conv.load.route}
          </Text>
        </View>

        {/* last message preview + unread */}
        <View className="flex-row items-center gap-2">
          {conv.mineLast ? (
            conv.unread === 0 ? (
              <CheckCheck size={15} color={C.teal} />
            ) : (
              <Check size={15} color={C.mutedForeground} />
            )
          ) : null}
          {KindIcon ? <KindIcon size={15} color={C.mutedForeground} /> : null}
          <Text
            className={`flex-1 text-sm ${conv.unread ? 'font-sans-medium text-foreground' : 'font-sans text-muted-foreground'}`}
            numberOfLines={1}
          >
            {conv.preview}
          </Text>
          {conv.unread ? (
            <View className="size-6 items-center justify-center rounded-full" style={{ backgroundColor: C.primary }}>
              <Text className="font-sans-semibold text-xs text-primary-foreground">{conv.unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

export default function MessagesScreen() {
  const { unread } = useNotifications();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const q = query.trim().toLowerCase();
  const list = CONVERSATIONS.filter(
    (c) =>
      !q ||
      c.dispatcher.name.toLowerCase().includes(q) ||
      c.load.id.toLowerCase().includes(q) ||
      c.load.route.toLowerCase().includes(q),
  );

  return (
    <View className="flex-1 bg-accent">
      {/* Header — matches Loads */}
      <SafeAreaView edges={['top']} className="rounded-b-3xl border-b border-border bg-background">
        <View className="gap-4 px-5 pb-5 pt-3">
          <View className="flex-row items-center gap-3 pl-1">
            <View className="flex-1">
              <Logo height={24} />
            </View>
            <Pressable
              onPress={() => router.push('/notifications')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
              className="size-12 items-center justify-center rounded-full active:opacity-70"
            >
              <Bell size={20} color={C.foreground} />
              {unread > 0 ? (
                <View
                  className="absolute right-1 top-1 size-4 items-center justify-center rounded-full"
                  style={{ backgroundColor: C.destructive }}
                >
                  <Text className="font-sans-semibold text-[10px] text-white">{unread}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => router.push('/profile')}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              className="size-12 items-center justify-center rounded-full active:opacity-70"
              style={{ backgroundColor: C.primary }}
            >
              <Text className="font-sans-semibold text-xs text-primary-foreground">DC</Text>
            </Pressable>
          </View>

          <Text className="px-1 font-sans-semibold text-2xl text-foreground">Chats</Text>

          {/* search */}
          <View className="h-12 flex-row items-center gap-2 rounded-2xl bg-accent px-3.5">
            <Search size={18} color={C.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by dispatcher, load, route"
              placeholderTextColor={C.mutedForeground}
              className="flex-1 font-sans text-base text-foreground"
              style={{ paddingVertical: 0 }}
              returnKeyType="search"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
                <X size={16} color={C.mutedForeground} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerClassName="gap-3 p-4"
        contentContainerStyle={list.length === 0 ? { flex: 1 } : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.mutedForeground} colors={[C.foreground]} />
        }
      >
        {list.length === 0 ? (
          <View className="flex-1 items-center justify-center gap-2 pb-24">
            <Search size={32} color="#d4d4d4" />
            <Text className="font-sans text-base text-muted-foreground">
              {query ? `No chats match “${query}”` : 'No chats yet'}
            </Text>
          </View>
        ) : (
          list.map((conv) => <ConvCard key={conv.id} conv={conv} />)
        )}
      </ScrollView>
    </View>
  );
}
