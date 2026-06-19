import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Mic, MicOff, PhoneOff, Video, Volume2 } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { DISPATCHER } from '@/lib/chat';
import { C } from '@/lib/theme';

export default function Call() {
  const { video } = useLocalSearchParams<{ video?: string }>();
  const isVideo = video === '1';
  const [secs, setSecs] = useState(0);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  useEffect(() => {
    const c = setTimeout(() => setConnected(true), 2000);
    return () => clearTimeout(c);
  }, []);

  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);

  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <View className="flex-1" style={{ backgroundColor: '#0c0c0c' }}>
      <StatusBar style="light" />
      <SafeAreaView className="flex-1 items-center justify-between py-8">
        {/* caller */}
        <View className="mt-12 items-center gap-5">
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 112, height: 112, backgroundColor: '#262626' }}
          >
            <Text className="font-sans-semibold text-white" style={{ fontSize: 36 }}>
              {DISPATCHER.initials}
            </Text>
          </View>
          <View className="items-center gap-1">
            <Text className="font-sans-semibold text-2xl text-white">{DISPATCHER.name}</Text>
            <Text className="font-sans text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {isVideo ? 'Video call' : 'huntTMS call'} · {connected ? mmss : 'Calling…'}
            </Text>
          </View>
        </View>

        {/* controls */}
        <View className="gap-6 px-8" style={{ width: '100%' }}>
          <View className="flex-row">
            <CallBtn active={muted} onPress={() => setMuted((m) => !m)} icon={muted ? MicOff : Mic} label="Mute" />
            <CallBtn active={speaker} onPress={() => setSpeaker((s) => !s)} icon={Volume2} label="Speaker" />
            <CallBtn active={isVideo} onPress={() => {}} icon={Video} label="Video" />
          </View>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="End call"
            className="h-16 flex-row items-center justify-center rounded-full"
            style={{ backgroundColor: C.destructive }}
          >
            <PhoneOff size={26} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function CallBtn({
  icon: Icon,
  label,
  active,
  onPress,
}: {
  icon: typeof Mic;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
      className="flex-1 items-center gap-2"
    >
      <View
        className="size-16 items-center justify-center rounded-full"
        style={{ backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.15)' }}
      >
        <Icon size={26} color={active ? '#0c0c0c' : '#fff'} />
      </View>
      <Text className="font-sans text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {label}
      </Text>
    </Pressable>
  );
}
