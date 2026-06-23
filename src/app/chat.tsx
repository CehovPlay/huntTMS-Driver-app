import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  FileText,
  MapPin,
  Mic,
  Package,
  Phone,
  Play,
  Plus,
  Send,
  Trash2,
  Video,
  X,
} from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { CHAT_MESSAGES, QUICK_REPLIES, REACTIONS, getConversation, type ChatMessage } from '@/lib/chat';
import { C } from '@/lib/theme';
import { convBadge } from '@/lib/status';

const BARS = [8, 14, 10, 18, 12, 20, 9, 16, 11, 14, 8, 17, 10]; // static waveform

function VoiceBubble({ mine, duration }: { mine: boolean; duration?: string }) {
  const tint = mine ? C.primaryForeground : C.foreground;
  return (
    <View className="flex-row items-center gap-3">
      <Play size={20} color={tint} fill={tint} />
      <View className="flex-row items-end gap-[3px]">
        {BARS.map((h, i) => (
          <View key={i} style={{ width: 3, height: h, borderRadius: 2, backgroundColor: tint, opacity: 0.7 }} />
        ))}
      </View>
      <Text className="font-sans text-xs" style={{ color: tint, opacity: 0.8 }}>
        {duration}
      </Text>
    </View>
  );
}

function Bubble({ m, onLongPress }: { m: ChatMessage; onLongPress: () => void }) {
  if (m.kind === 'system') {
    return (
      <View className="my-1 items-center">
        <View className="rounded-full bg-accent px-3 py-1">
          <Text className="font-sans text-xs text-muted-foreground">{m.text}</Text>
        </View>
      </View>
    );
  }

  const mine = m.mine;
  return (
    <View className={`mb-2 max-w-[80%] ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={250}
        className="overflow-hidden rounded-3xl"
        style={{
          backgroundColor: mine ? C.primary : C.accent,
          borderBottomRightRadius: mine ? 6 : 24,
          borderBottomLeftRadius: mine ? 24 : 6,
        }}
      >
        {/* reply quote */}
        {m.replyTo ? (
          <View
            className="mx-2 mt-2 gap-0.5 rounded-xl px-3 py-1.5"
            style={{ backgroundColor: mine ? `${C.primaryForeground}1F` : `${C.foreground}0D` }}
          >
            <Text className="font-sans-medium text-xs" style={{ color: mine ? C.primaryForeground : C.foreground }}>
              {m.replyTo.name}
            </Text>
            <Text className="font-sans text-xs" style={{ color: mine ? `${C.primaryForeground}B3` : C.mutedForeground }} numberOfLines={1}>
              {m.replyTo.text}
            </Text>
          </View>
        ) : null}

        {m.kind === 'image' ? (
          <Image source={{ uri: m.imageUrl }} style={{ width: 220, height: 280 }} contentFit="cover" />
        ) : null}

        <View className={m.kind === 'voice' ? 'px-4 py-3' : 'px-4 py-2.5'}>
          {m.kind === 'file' ? (
            <View className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-xl" style={{ backgroundColor: mine ? `${C.primaryForeground}26` : C.background }}>
                <FileText size={20} color={mine ? C.primaryForeground : C.foreground} />
              </View>
              <View>
                <Text className="font-sans-medium text-sm" style={{ color: mine ? C.primaryForeground : C.foreground }}>
                  {m.fileName}
                </Text>
                <Text className="font-sans text-xs" style={{ color: mine ? `${C.primaryForeground}B3` : C.mutedForeground }}>
                  {m.fileSize}
                </Text>
              </View>
            </View>
          ) : m.kind === 'voice' ? (
            <VoiceBubble mine={mine} duration={m.duration} />
          ) : m.text ? (
            <Text className="font-sans text-base" style={{ color: mine ? C.primaryForeground : C.foreground }}>
              {m.text}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {/* reactions */}
      {m.reactions && m.reactions.length > 0 ? (
        <View className="-mt-2 flex-row gap-1 rounded-full border border-border bg-background px-2 py-0.5">
          {m.reactions.map((r, i) => (
            <Text key={i} className="text-xs">
              {r}
            </Text>
          ))}
        </View>
      ) : null}

      {/* time + read */}
      <View className="mt-1 flex-row items-center gap-1 px-1">
        <Text className="font-sans text-[11px] text-muted-foreground">{m.time}</Text>
        {mine ? (
          m.read ? <CheckCheck size={13} color={C.foreground} /> : <Check size={13} color={C.mutedForeground} />
        ) : null}
      </View>
    </View>
  );
}

export default function Chat() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const conv = getConversation(id);
  const dispatcher = conv.dispatcher;
  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_MESSAGES);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [reactingTo, setReactingTo] = useState<ChatMessage | null>(null);
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const scrollDown = () => requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

  const pushMsg = (m: Omit<ChatMessage, 'id' | 'time' | 'mine'>) => {
    const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { id: `x${prev.length}`, mine: true, read: false, time, ...m } as ChatMessage,
    ]);
    scrollDown();
  };

  const send = () => {
    if (!text.trim()) return;
    pushMsg({
      kind: 'text',
      text: text.trim(),
      replyTo: replyingTo ? { name: replyingTo.mine ? 'You' : dispatcher.name, text: replyingTo.text ?? replyingTo.fileName ?? 'Attachment' } : undefined,
    });
    setText('');
    setReplyingTo(null);
  };

  const attachImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!res.canceled && res.assets[0]?.uri) {
      pushMsg({ kind: 'image', imageUrl: res.assets[0].uri });
    }
  };

  const startRec = () => {
    setRecording(true);
    setRecSec(0);
    recTimer.current = setInterval(() => setRecSec((s) => s + 1), 1000);
  };
  const stopRec = (sendIt: boolean) => {
    if (recTimer.current) clearInterval(recTimer.current);
    const secs = recSec;
    setRecording(false);
    setRecSec(0);
    if (sendIt && secs > 0) {
      pushMsg({ kind: 'voice', duration: `0:${String(secs).padStart(2, '0')}` });
    }
  };

  const addReaction = (emoji: string) => {
    if (!reactingTo) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === reactingTo.id ? { ...m, reactions: [...(m.reactions ?? []), emoji] } : m)),
    );
    setReactingTo(null);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <SafeAreaView edges={['top']} className="border-b border-border bg-background">
        <View className="h-14 flex-row items-center gap-3 px-3">
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back" className="size-12 items-center justify-center rounded-2xl active:bg-accent">
            <ArrowLeft size={20} color={C.foreground} />
          </Pressable>
          <View className="size-10 items-center justify-center rounded-full" style={{ backgroundColor: C.border }}>
            <Text className="font-sans-semibold text-sm text-foreground">{dispatcher.initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-sans-semibold text-base text-foreground">{dispatcher.name}</Text>
            <View className="flex-row items-center gap-1.5">
              {dispatcher.online ? <View className="size-2 rounded-full" style={{ backgroundColor: C.foreground }} /> : null}
              <Text className="font-sans text-xs text-muted-foreground">
                {dispatcher.role} · {dispatcher.online ? 'online' : 'offline'}
              </Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/call')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Call dispatcher" className="size-12 items-center justify-center rounded-full active:bg-accent">
            <Phone size={20} color={C.foreground} />
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/call', params: { video: '1' } })} hitSlop={8} accessibilityRole="button" accessibilityLabel="Video call" className="size-12 items-center justify-center rounded-full active:bg-accent">
            <Video size={20} color={C.foreground} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Load context strip */}
      <Pressable
        onPress={() => router.push({ pathname: '/load/[id]', params: { id: conv.load.id.replace('#', ''), variant: conv.load.status === 'En route' ? 'current' : conv.load.status === 'Delivered' ? 'delivered' : 'scheduled' } })}
        accessibilityRole="button"
        accessibilityLabel={`Open load ${conv.load.id}`}
        className="flex-row items-center gap-2 border-b border-border bg-accent px-4 py-2.5 active:opacity-80"
      >
        <Package size={14} color={C.mutedForeground} />
        <Text className="font-sans-medium text-sm text-foreground">{conv.load.id}</Text>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: convBadge(conv.load.status).bg }}>
          <Text className="font-sans-medium text-[11px]" style={{ color: convBadge(conv.load.status).color }}>
            {conv.load.status}
          </Text>
        </View>
        <MapPin size={13} color={C.mutedForeground} />
        <Text className="flex-1 font-sans text-xs text-muted-foreground" numberOfLines={1}>
          {conv.load.route}
        </Text>
      </Pressable>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="px-4 py-3"
          onContentSizeChange={scrollDown}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => (
            <Bubble key={m.id} m={m} onLongPress={() => setReactingTo(m)} />
          ))}
          {/* typing indicator */}
          <View className="mb-2 max-w-[80%] self-start rounded-3xl bg-accent px-4 py-3" style={{ borderBottomLeftRadius: 6 }}>
            <View className="flex-row gap-1">
              {[0, 1, 2].map((i) => (
                <View key={i} className="size-2 rounded-full" style={{ backgroundColor: 'rgba(115,115,115,0.5)' }} />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Quick replies */}
        <View style={{ height: 44 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="items-center gap-2 px-4"
          >
            {QUICK_REPLIES.map((q) => (
              <Pressable
                key={q}
                onPress={() => pushMsg({ kind: 'text', text: q })}
                className="h-8 justify-center rounded-full border border-border bg-background px-3 active:bg-accent"
              >
                <Text className="font-sans-medium text-sm text-foreground">{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* reply preview */}
        {replyingTo ? (
          <View className="mx-3 mb-1 flex-row items-center gap-2 rounded-2xl bg-accent px-3 py-2">
            <View className="w-0.5 self-stretch rounded-full" style={{ backgroundColor: C.border }} />
            <View className="flex-1">
              <Text className="font-sans-medium text-xs" style={{ color: C.foreground }}>
                {replyingTo.mine ? 'You' : dispatcher.name}
              </Text>
              <Text className="font-sans text-sm text-muted-foreground" numberOfLines={1}>
                {replyingTo.text ?? replyingTo.fileName ?? 'Attachment'}
              </Text>
            </View>
            <Pressable onPress={() => setReplyingTo(null)} accessibilityRole="button" accessibilityLabel="Cancel reply" hitSlop={8} className="size-6 items-center justify-center">
              <X size={16} color={C.mutedForeground} />
            </Pressable>
          </View>
        ) : null}

        {/* Input bar */}
        <SafeAreaView edges={['bottom']} className="bg-background">
          {recording ? (
            <View className="m-3 h-12 flex-row items-center gap-3 rounded-2xl bg-accent px-4">
              <Pressable onPress={() => stopRec(false)} accessibilityRole="button" accessibilityLabel="Cancel recording" hitSlop={8}>
                <Trash2 size={20} color={C.destructive} />
              </Pressable>
              <View className="size-2.5 rounded-full" style={{ backgroundColor: C.destructive }} />
              <Text className="flex-1 font-sans-medium text-base text-foreground">
                Recording… 0:{String(recSec).padStart(2, '0')}
              </Text>
              <Pressable onPress={() => stopRec(true)} accessibilityRole="button" accessibilityLabel="Send voice message" className="size-12 items-center justify-center rounded-full" style={{ backgroundColor: C.primary }}>
                <Send size={16} color={C.primaryForeground} />
              </Pressable>
            </View>
          ) : (
            <View className="m-3 flex-row items-end gap-2">
              <Pressable onPress={attachImage} accessibilityRole="button" accessibilityLabel="Attach image" className="size-12 items-center justify-center rounded-full bg-accent active:opacity-80">
                <Plus size={22} color={C.foreground} />
              </Pressable>
              <View className="min-h-11 flex-1 justify-center rounded-2xl bg-accent px-4 py-2">
                <TextInput
                  className="font-sans text-base text-foreground"
                  style={{ paddingVertical: 0 }}
                  placeholder="Message"
                  placeholderTextColor={C.mutedForeground}
                  value={text}
                  onChangeText={setText}
                  multiline
                />
              </View>
              {text.trim() ? (
                <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send message" className="size-12 items-center justify-center rounded-full" style={{ backgroundColor: C.primary }}>
                  <Send size={20} color={C.primaryForeground} />
                </Pressable>
              ) : (
                <Pressable onPress={startRec} accessibilityRole="button" accessibilityLabel="Record voice message" className="size-12 items-center justify-center rounded-full bg-accent active:opacity-80">
                  <Mic size={22} color={C.foreground} />
                </Pressable>
              )}
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Reaction picker */}
      <Modal visible={!!reactingTo} transparent animationType="fade" onRequestClose={() => setReactingTo(null)}>
        <Pressable className="flex-1 items-center justify-center bg-black/40" onPress={() => setReactingTo(null)}>
          <View className="flex-row gap-2 rounded-full bg-background px-3 py-2" style={{ elevation: 6 }}>
            {REACTIONS.map((r) => (
              <Pressable key={r} onPress={() => addReaction(r)} accessibilityRole="button" accessibilityLabel={`React with ${r}`} className="size-12 items-center justify-center rounded-full active:bg-accent">
                <Text className="text-2xl">{r}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => {
              const t = reactingTo;
              setReactingTo(null);
              setReplyingTo(t);
            }}
            className="mt-3 flex-row items-center gap-2 rounded-full bg-background px-4 py-2"
          >
            <Text className="font-sans-medium text-sm text-foreground">↩︎ Reply</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
