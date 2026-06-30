import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Bell, Check, CheckCheck, MessageCircle, Package, Search, X } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { PressableScale } from '@/components/pressable-scale';
import { Skeleton } from '@/components/skeleton';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { Logo } from '@/components/logo';
import { C } from '@/lib/theme';
import {
  useDriverChatConversations,
  type ChatConversationView,
} from '@/lib/api/chat';
import { Appear } from '@/components/appear';

const messagePreview = (conversation: ChatConversationView) =>
  conversation.lastMessageKind === 'TEXT' || conversation.lastMessageKind === 'SYSTEM'
    ? conversation.lastMessagePreview ?? 'Message'
    : conversation.lastMessageKind === 'IMAGE'
      ? 'Image'
      : conversation.lastMessageKind === 'VOICE'
        ? 'Voice message'
        : 'File';

const displayTime = (epochMs: number) => {
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

function ConversationCard({ conversation }: { conversation: ChatConversationView }) {
  const name = conversation.counterpartName ?? 'Office';
  const loadLabel = conversation.customerLoadId ?? String(conversation.loadId);
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/chat', params: { id: String(conversation.loadId) } })}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${name}, load ${loadLabel}${conversation.unread ? `, ${conversation.unread} unread` : ''}`}
      className="flex-row gap-3 rounded-3xl bg-background p-4 active:opacity-90"
    >
      <View className="size-12 items-center justify-center rounded-full" style={{ backgroundColor: C.border }}>
        <Text className="font-sans-semibold text-base text-foreground">{initials(name)}</Text>
      </View>
      <View className="flex-1 gap-2">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 font-sans-semibold text-base text-foreground" numberOfLines={1}>{name}</Text>
          <Text className="font-sans text-xs text-muted-foreground">{displayTime(conversation.lastMessageTime)}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Package size={15} color={C.mutedForeground} />
          <Text className="font-sans-medium text-sm text-foreground">#{loadLabel}</Text>
          {conversation.status ? (
            <View className="rounded-full bg-accent px-2.5 py-1">
              <Text className="font-sans-medium text-xs text-muted-foreground">
                {conversation.status.replaceAll('_', ' ')}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2">
          {conversation.mineLast ? (
            conversation.unread === 0 ? <CheckCheck size={15} color={C.foreground} /> : <Check size={15} color={C.mutedForeground} />
          ) : (
            <MessageCircle size={15} color={C.mutedForeground} />
          )}
          <Text className={`flex-1 text-sm ${conversation.unread ? 'font-sans-medium text-foreground' : 'font-sans text-muted-foreground'}`} numberOfLines={1}>
            {messagePreview(conversation)}
          </Text>
          {conversation.unread > 0 ? (
            <View className="min-w-6 items-center justify-center rounded-full px-1.5" style={{ height: 24, backgroundColor: C.primary }}>
              <Text className="font-sans-semibold text-xs text-primary-foreground">{conversation.unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

function ConversationSkeleton() {
  return (
    <View className="flex-row gap-3 rounded-3xl bg-background p-4">
      <Skeleton width={48} height={48} radius={24} />
      <View className="flex-1 gap-2">
        <Skeleton width="60%" height={16} />
        <Skeleton width="70%" height={14} />
        <Skeleton width="90%" height={14} />
      </View>
    </View>
  );
}

export default function MessagesScreen() {
  const [query, setQuery] = useState('');
  const conversations = useDriverChatConversations();

  useFocusEffect(
    useCallback(() => {
      conversations.refetch();
      const poll = setInterval(conversations.refetch, 30_000);
      return () => clearInterval(poll);
    }, [conversations.refetch]),
  );

  const search = query.trim().toLowerCase();
  const list = (conversations.data ?? []).filter((conversation) => {
    const name = conversation.counterpartName ?? '';
    const load = conversation.customerLoadId ?? String(conversation.loadId);
    return !search || name.toLowerCase().includes(search) || load.toLowerCase().includes(search);
  });

  return (
    <View className="flex-1 bg-accent">
      <SafeAreaView edges={['top']} className="rounded-b-3xl border-b border-border bg-background">
        <View className="gap-4 px-5 pb-5 pt-3">
          <View className="flex-row items-center gap-3 pl-1">
            <View className="flex-1"><Logo height={24} /></View>
            <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="Profile" className="size-12 items-center justify-center rounded-full active:opacity-70" style={{ backgroundColor: C.border }}>
              <Text className="font-sans-semibold text-xs text-foreground">DC</Text>
            </Pressable>
          </View>
          <Text className="px-1 font-sans-semibold text-2xl text-foreground">Chats</Text>
          <View className="h-12 flex-row items-center gap-2 rounded-2xl bg-accent px-3.5">
            <Search size={18} color={C.mutedForeground} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Search by office or load" placeholderTextColor={C.mutedForeground} className="flex-1 font-sans text-base text-foreground" style={{ paddingVertical: 0 }} returnKeyType="search" />
            {query ? <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search"><X size={16} color={C.mutedForeground} /></Pressable> : null}
          </View>
        </View>
      </SafeAreaView>
      <ScrollView
        contentContainerClassName="gap-3"
        contentContainerStyle={[{ padding: 16, paddingBottom: 110 }, conversations.error || (!conversations.loading && list.length === 0) ? { flex: 1 } : null]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={conversations.refreshing} onRefresh={conversations.refetch} tintColor={C.mutedForeground} colors={[C.foreground]} />}
      >
        {conversations.loading ? [0, 1, 2, 3].map((index) => <ConversationSkeleton key={index} />) : conversations.error ? (
          <ErrorState onRetry={conversations.refetch} />
        ) : list.length === 0 ? (
          query ? <EmptyState icon={Search} title={`No chats match “${query}”`} subtitle="Try a different office or load." /> : <EmptyState icon={Bell} title="No chats yet" subtitle="Load messages from the office will appear here." />
        ) : list.map((conversation, index) => (
          <Appear key={conversation.loadId} index={index}><ConversationCard conversation={conversation} /></Appear>
        ))}
      </ScrollView>
    </View>
  );
}
