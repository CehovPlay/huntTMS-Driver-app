import { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ArrowUp, Camera, Paperclip, Sparkles, Volume2, VolumeX } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { Appear } from '@/components/appear';
import { AssistantMic } from '@/components/assistant-mic';
import { useCopilot, type CopilotMessage } from '@/lib/use-assistant';
import { C } from '@/lib/theme';

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="rounded-full border border-border bg-accent px-3.5 py-2 active:opacity-70">
      <Text className="font-sans-medium text-sm text-foreground">{label}</Text>
    </Pressable>
  );
}

function Bubble({ msg, onChip }: { msg: CopilotMessage; onChip: (s: string) => void }) {
  const mine = msg.role === 'user';
  return (
    <Appear className={mine ? 'items-end' : 'items-start'}>
      <View
        className={mine ? 'max-w-[82%] rounded-2xl bg-primary px-3.5 py-2.5' : 'max-w-[88%] rounded-2xl bg-accent px-3.5 py-2.5'}
        style={mine ? undefined : { borderWidth: 1, borderColor: C.border }}
      >
        {msg.image ? (
          <Image source={{ uri: msg.image }} style={{ width: 180, height: 120, borderRadius: 12, marginBottom: msg.text ? 8 : 0 }} resizeMode="cover" />
        ) : null}
        {msg.text ? (
          <Text className={mine ? 'font-sans text-[15px] text-primary-foreground' : 'font-sans text-[15px] text-foreground'}>{msg.text}</Text>
        ) : null}
      </View>
      {!mine && msg.chips?.length ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {msg.chips.map((c) => (
            <Chip key={c} label={c} onPress={() => onChip(c)} />
          ))}
        </View>
      ) : null}
    </Appear>
  );
}

export default function CopilotScreen() {
  const {
    status,
    muted,
    messages,
    voiceSupported,
    voiceOn,
    voiceMode,
    partial,
    voiceError,
    toggleMuted,
    send,
    attachDocument,
    enableVoice,
    disableVoice,
  } = useCopilot();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const pickFromLibrary = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      if (!r.canceled && r.assets[0]?.uri) {
        attachDocument(r.assets[0].uri, draft);
        setDraft('');
      }
    } catch {}
  };

  const captureScan = async () => {
    try {
      const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!r.canceled && r.assets[0]?.uri) {
        attachDocument(r.assets[0].uri, draft);
        setDraft('');
      }
    } catch {}
  };

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages, status, voiceMode, partial]);

  const submit = (text: string) => {
    send(text);
    setDraft('');
  };

  const micStatus =
    status === 'thinking' || voiceMode === 'speaking'
      ? 'thinking'
      : voiceMode === 'command'
      ? 'listening'
      : voiceMode === 'wake'
      ? 'wake'
      : 'idle';

  const micPress = () => {
    if (!voiceOn) enableVoice();
    else disableVoice();
  };

  const statusLabel = !voiceSupported
    ? 'Voice runs on the web / Telegram build'
    : !voiceOn
    ? 'Tap the mic to enable hands-free'
    : voiceMode === 'command'
    ? partial
      ? `“${partial}”`
      : 'Listening…'
    : voiceMode === 'speaking'
    ? 'Speaking…'
    : status === 'thinking'
    ? 'Thinking…'
    : 'Listening for “Hey Bot”';

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* header */}
        <View className="flex-row items-center gap-2.5 px-4 pb-2 pt-2">
          <View className="size-9 items-center justify-center rounded-full" style={{ backgroundColor: `${C.primary}1A` }}>
            <Sparkles size={18} color={C.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-sans-semibold text-xl text-foreground">HuntBot</Text>
            <Text className="font-sans text-xs text-muted-foreground">Hands-free driving assistant</Text>
          </View>
          <Pressable
            onPress={toggleMuted}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={muted ? 'Unmute voice' : 'Mute voice'}
            className="size-10 items-center justify-center rounded-full active:opacity-60"
          >
            {muted ? <VolumeX size={22} color={C.mutedForeground} /> : <Volume2 size={22} color={C.foreground} />}
          </Pressable>
        </View>

        {/* transcript */}
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{ gap: 12, paddingVertical: 8, paddingBottom: 12 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} onChip={submit} />
          ))}
          {voiceMode === 'command' && partial ? (
            <View className="items-end">
              <View className="max-w-[82%] rounded-2xl px-3.5 py-2.5" style={{ backgroundColor: C.primary, opacity: 0.6 }}>
                <Text className="font-sans text-[15px] text-primary-foreground">{partial}</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* mic + status */}
        <View className="items-center" style={{ paddingTop: 2 }}>
          <AssistantMic status={micStatus} onPress={micPress} />
          <Text className="mt-1 px-6 text-center font-sans text-sm text-muted-foreground">{statusLabel}</Text>
          {voiceError ? <Text className="mt-0.5 px-6 text-center font-sans text-xs text-destructive">{voiceError}</Text> : null}
        </View>

        {/* text fallback input + file upload / scan */}
        <View className="flex-row items-center gap-2 px-4 pt-3" style={{ paddingBottom: insets.bottom + 124 }}>
          <Pressable
            onPress={pickFromLibrary}
            accessibilityRole="button"
            accessibilityLabel="Upload a document"
            className="size-12 items-center justify-center rounded-2xl bg-accent active:opacity-70"
            style={{ borderWidth: 1, borderColor: C.border }}
          >
            <Paperclip size={20} color={C.foreground} />
          </Pressable>
          <Pressable
            onPress={captureScan}
            accessibilityRole="button"
            accessibilityLabel="Scan a document"
            className="size-12 items-center justify-center rounded-2xl bg-accent active:opacity-70"
            style={{ borderWidth: 1, borderColor: C.border }}
          >
            <Camera size={20} color={C.foreground} />
          </Pressable>
          <View className="h-12 flex-1 flex-row items-center rounded-2xl bg-accent px-4" style={{ borderWidth: 1, borderColor: C.border }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a command…"
              placeholderTextColor={C.mutedForeground}
              className="flex-1 font-sans text-base text-foreground"
              style={{ paddingVertical: 0 }}
              returnKeyType="send"
              onSubmitEditing={() => draft.trim() && submit(draft)}
            />
          </View>
          <Pressable
            onPress={() => draft.trim() && submit(draft)}
            disabled={!draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send"
            className="size-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: draft.trim() ? C.primary : C.border }}
          >
            <ArrowUp size={22} color={draft.trim() ? C.primaryForeground : C.mutedForeground} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
