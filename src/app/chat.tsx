import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Client } from '@stomp/stompjs';
import { ArrowLeft, FileText, ImageIcon, Pause, Play, Send } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import {
  getDriverChatAttachmentHeaders,
  getDriverChatAttachmentUrl,
  getDriverChatMessages,
  markDriverChatRead,
  notifyDriverChatUnreadChanged,
  sendDriverChatMessage,
  uploadDriverChatAttachment,
  useDriverChatConversations,
  useDriverChatThread,
  type ChatMessageView,
} from '@/lib/api/chat';
import { API_URL } from '@/lib/api/config';
import { getToken } from '@/lib/api/token-store';
import { useAuth } from '@/lib/auth/auth';
import { useNotifications } from '@/lib/notifications';
import { C } from '@/lib/theme';

const QUICK_REPLIES = ['On my way', 'Arrived', 'Loaded', 'Running ~30 min late', 'Delivered'];
const messageText = (message: ChatMessageView) =>
  message.body ?? (message.kind === 'SYSTEM' ? 'Message' : '');

const attachmentKind = (mime: string): 'IMAGE' | 'VOICE' | 'FILE' => {
  if (mime.startsWith('image/')) return 'IMAGE';
  if (mime.startsWith('audio/')) return 'VOICE';
  return 'FILE';
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

function VoiceAttachment({ message }: { message: ChatMessageView }) {
  const player = useAudioPlayer({
    uri: getDriverChatAttachmentUrl(message.loadId, message.fileId!),
    headers: getDriverChatAttachmentHeaders(),
    name: message.fileName ?? undefined,
  });
  const status = useAudioPlayerStatus(player);
  return (
    <Pressable
      onPress={() => (status.playing ? player.pause() : player.play())}
      className="min-w-48 flex-row items-center gap-3"
      accessibilityRole="button"
      accessibilityLabel={status.playing ? 'Pause voice attachment' : 'Play voice attachment'}
    >
      {status.playing ? <Pause size={20} color={C.foreground} /> : <Play size={20} color={C.foreground} />}
      <View className="flex-1">
        <Text className="font-sans-medium text-sm text-foreground">{message.fileName || 'Voice message'}</Text>
        <Text className="font-sans text-xs text-muted-foreground">{formatFileSize(message.fileSizeBytes)}</Text>
      </View>
    </Pressable>
  );
}

function AttachmentContent({ message }: { message: ChatMessageView }) {
  if (message.fileId === null) return <Text className="font-sans text-sm text-foreground">Attachment unavailable</Text>;
  if (message.kind === 'IMAGE') {
    return (
      <View className="gap-2">
        <Image
          source={{
            uri: getDriverChatAttachmentUrl(message.loadId, message.fileId),
            headers: getDriverChatAttachmentHeaders(),
          }}
          className="h-44 w-56 rounded-2xl bg-muted"
          resizeMode="contain"
        />
        {message.body ? <Text className="font-sans text-base text-foreground">{message.body}</Text> : null}
      </View>
    );
  }
  if (message.kind === 'VOICE') return <VoiceAttachment message={message} />;
  return (
    <View className="min-w-48 flex-row items-center gap-3">
      <FileText size={22} color={C.foreground} />
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-sans-medium text-sm text-foreground">{message.fileName || 'Attachment'}</Text>
        <Text className="font-sans text-xs text-muted-foreground">{formatFileSize(message.fileSizeBytes)}</Text>
        {message.body ? <Text className="mt-1 font-sans text-sm text-foreground">{message.body}</Text> : null}
      </View>
    </View>
  );
}

function MessageBubble({ message }: { message: ChatMessageView }) {
  const text = messageText(message);
  if (message.senderType === 'SYSTEM') {
    return (
      <View className="my-1 items-center">
        <View className="rounded-full bg-accent px-3 py-1">
          <Text className="font-sans text-xs text-muted-foreground">{text}</Text>
        </View>
      </View>
    );
  }
  return (
    <View className={`mb-2 max-w-[80%] ${message.mine ? 'self-end items-end' : 'self-start items-start'}`}>
      {!message.mine && message.senderName ? <Text className="mb-1 px-1 font-sans-medium text-xs text-muted-foreground">{message.senderName}</Text> : null}
      <View
        className="rounded-3xl px-4 py-2.5"
        style={{
          backgroundColor: message.mine ? C.primary : C.accent,
          borderBottomRightRadius: message.mine ? 6 : 24,
          borderBottomLeftRadius: message.mine ? 24 : 6,
        }}
      >
        {message.kind === 'TEXT' ? (
          <Text className="font-sans text-base" style={{ color: message.mine ? C.primaryForeground : C.foreground }}>{text}</Text>
        ) : (
          <AttachmentContent message={message} />
        )}
      </View>
      <Text className="mt-1 px-1 font-sans text-[11px] text-muted-foreground">
        {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </Text>
    </View>
  );
}

export default function Chat() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const parsedLoadId = Number(id);
  const loadId = Number.isFinite(parsedLoadId) && parsedLoadId > 0 ? parsedLoadId : null;
  const thread = useDriverChatThread(loadId);
  const conversations = useDriverChatConversations();
  const conversation = conversations.data?.find((item) => item.loadId === loadId);
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [hasEarlier, setHasEarlier] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const initializedLoadId = useRef<number | null>(null);
  const lastReadInboundId = useRef<number | null>(null);
  const skipNextAutoScroll = useRef(false);
  const { notify } = useNotifications();
  const { driver } = useAuth();
  const driverId = driver?.driverId ?? null;

  useEffect(() => {
    if (!thread.data || loadId === null) return;
    if (initializedLoadId.current !== loadId) {
      initializedLoadId.current = loadId;
      setMessages(thread.data);
      setHasEarlier(thread.data.length === 50);
      return;
    }
    setMessages((current) => {
      const merged = new Map(current.map((message) => [message.id, message]));
      thread.data?.forEach((message) => merged.set(message.id, message));
      return [...merged.values()].sort((a, b) => a.createdAt - b.createdAt);
    });
  }, [loadId, thread.data]);

  const scrollDown = () => requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  const markRead = useCallback(async () => {
    if (loadId === null) return false;
    try {
      await markDriverChatRead(loadId);
      notifyDriverChatUnreadChanged();
      conversations.refetch();
      return true;
    } catch {
      // Keep the thread usable; the next focus/poll retries the read cursor.
      return false;
    }
  }, [conversations.refetch, loadId]);

  useEffect(() => {
    const latestInboundId = messages.reduce<number | null>(
      (latest, message) => (!message.mine && (latest === null || message.id > latest) ? message.id : latest),
      null,
    );
    if (latestInboundId === null || latestInboundId === lastReadInboundId.current) return;
    void markRead().then((marked) => {
      if (marked) lastReadInboundId.current = latestInboundId;
    });
  }, [markRead, messages]);

  useEffect(() => {
    if (loadId === null || driverId === null) return;
    const token = getToken();
    if (!token) return;
    const auth = { Authorization: `Bearer ${token}` };
    const wsBase = API_URL.replace(/^http/, 'ws').replace(/\/$/, '');
    const client = new Client({
      webSocketFactory: () => new WebSocket(`${wsBase}/websocket-endpoint/websocket`),
      connectHeaders: auth,
      reconnectDelay: 5_000,
      onConnect: () => {
        client.subscribe(
          `/topic/chat/driver/${driverId}/${loadId}`,
          (frame) => {
            try {
              const incoming = JSON.parse(frame.body) as ChatMessageView;
              const message = {
                ...incoming,
                mine: incoming.senderType === 'DRIVER' && incoming.senderDriverId === driverId,
              };
              setMessages((current) => current.some((item) => item.id === message.id)
                ? current
                : [...current, message].sort((a, b) => a.createdAt - b.createdAt));
            } catch {
              console.error('[chat] Ignored malformed STOMP frame');
            }
          },
          auth,
        );
      },
      onStompError: (frame) => console.error('[chat] STOMP error', frame.headers.message),
    });
    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [driverId, loadId]);

  const send = async (value = text) => {
    const body = value.trim();
    if (!body || loadId === null || sending) return;
    setSending(true);
    try {
      const sent = await sendDriverChatMessage(loadId, { kind: 'TEXT', body });
      setMessages((items) => items.some((item) => item.id === sent.id) ? items : [...items, sent]);
      setText('');
      conversations.refetch();
      notifyDriverChatUnreadChanged();
      scrollDown();
    } catch {
      notify({ type: 'alert', title: 'Message not sent', body: 'Check your connection and try again.' });
    } finally {
      setSending(false);
    }
  };

  const sendAttachment = async (file: { uri: string; name: string; mime: string }) => {
    if (loadId === null || sending) return;
    setSending(true);
    try {
      const uploaded = await uploadDriverChatAttachment(loadId, file);
      const sent = await sendDriverChatMessage(loadId, {
        kind: attachmentKind(uploaded.mime),
        body: text.trim() || undefined,
        fileId: uploaded.fileId,
        fileName: uploaded.fileName,
        fileSizeBytes: uploaded.fileSizeBytes,
      });
      setMessages((items) => items.some((item) => item.id === sent.id) ? items : [...items, sent]);
      setText('');
      conversations.refetch();
      notifyDriverChatUnreadChanged();
      scrollDown();
    } catch {
      notify({ type: 'alert', title: 'Attachment not sent', body: 'Check your connection and try again.' });
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    await sendAttachment({
      uri: asset.uri,
      name: asset.fileName || `chat-image-${Date.now()}.jpg`,
      mime: asset.mimeType || 'image/jpeg',
    });
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    await sendAttachment({
      uri: asset.uri,
      name: asset.name,
      mime: asset.mimeType || 'application/octet-stream',
    });
  };

  const loadEarlier = async () => {
    const firstMessageId = messages[0]?.id;
    if (!firstMessageId || loadId === null || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      const earlier = await getDriverChatMessages(loadId, firstMessageId);
      skipNextAutoScroll.current = true;
      setMessages((current) => {
        const merged = new Map(current.map((message) => [message.id, message]));
        earlier.forEach((message) => merged.set(message.id, message));
        return [...merged.values()].sort((a, b) => a.createdAt - b.createdAt);
      });
      setHasEarlier(earlier.length === 50);
    } catch {
      notify({ type: 'alert', title: 'History not loaded', body: 'Check your connection and try again.' });
    } finally {
      setLoadingEarlier(false);
    }
  };

  const title = conversation?.counterpartName ?? 'Office';
  const loadLabel = conversation?.customerLoadId ?? (loadId ? String(loadId) : '—');

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={['top']} className="border-b border-border bg-background">
        <View className="h-14 flex-row items-center gap-3 px-3">
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back" className="size-12 items-center justify-center rounded-2xl active:bg-accent"><ArrowLeft size={20} color={C.foreground} /></Pressable>
          <View className="flex-1">
            <Text className="font-sans-semibold text-base text-foreground">{title}</Text>
            <Text className="font-sans text-xs text-muted-foreground">Load #{loadLabel}</Text>
          </View>
        </View>
      </SafeAreaView>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} className="flex-1" contentContainerClassName="px-4 py-3" onContentSizeChange={() => {
          if (skipNextAutoScroll.current) {
            skipNextAutoScroll.current = false;
            return;
          }
          scrollDown();
        }} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {thread.loading && !messages.length ? <Text className="py-8 text-center font-sans text-sm text-muted-foreground">Loading messages...</Text> : null}
          {thread.error && !messages.length ? <Pressable onPress={thread.refetch} className="py-8"><Text className="text-center font-sans text-sm text-muted-foreground">Could not load messages. Tap to retry.</Text></Pressable> : null}
          {!thread.loading && !thread.error && !messages.length ? <Text className="py-8 text-center font-sans text-sm text-muted-foreground">No messages yet</Text> : null}
          {!thread.loading && messages.length > 0 && hasEarlier ? <Pressable onPress={loadEarlier} disabled={loadingEarlier} className="mb-3 py-2"><Text className="text-center font-sans-medium text-xs text-muted-foreground">{loadingEarlier ? 'Loading...' : 'Load earlier messages'}</Text></Pressable> : null}
          {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
        </ScrollView>
        <View style={{ height: 44 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="items-center gap-2 px-4">
            {QUICK_REPLIES.map((reply) => <Pressable key={reply} onPress={() => setText(reply)} className="h-8 justify-center rounded-full border border-border bg-background px-3 active:bg-accent"><Text className="font-sans-medium text-sm text-foreground">{reply}</Text></Pressable>)}
          </ScrollView>
        </View>
        <SafeAreaView edges={['bottom']} className="bg-background">
          <View className="m-3 flex-row items-end gap-2">
            <Pressable onPress={pickImage} disabled={sending} accessibilityRole="button" accessibilityLabel="Attach image" className="size-12 items-center justify-center rounded-full border border-border bg-background"><ImageIcon size={20} color={C.foreground} /></Pressable>
            <Pressable onPress={pickFile} disabled={sending} accessibilityRole="button" accessibilityLabel="Attach file" className="size-12 items-center justify-center rounded-full border border-border bg-background"><FileText size={20} color={C.foreground} /></Pressable>
            <View className="min-h-11 flex-1 justify-center rounded-2xl bg-accent px-4 py-2">
              <TextInput className="font-sans text-base text-foreground" style={{ paddingVertical: 0 }} placeholder="Message" placeholderTextColor={C.mutedForeground} value={text} onChangeText={setText} multiline editable={!sending} />
            </View>
            <Pressable onPress={() => send()} disabled={!text.trim() || sending} accessibilityRole="button" accessibilityLabel="Send message" className="size-12 items-center justify-center rounded-full" style={{ backgroundColor: C.primary, opacity: !text.trim() || sending ? 0.45 : 1 }}><Send size={20} color={C.primaryForeground} /></Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
