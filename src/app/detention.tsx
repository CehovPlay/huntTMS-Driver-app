import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, MapPin, TimerReset } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { C } from '@/lib/theme';

// Free wait time before detention accrues, and the hourly rate after that.
const FREE_MIN = 120; // 2h
const RATE_PER_HOUR = 75;
const STOP_LABEL = 'Chicago, IL · 4200 Industrial Blvd';

function fmt(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Detention() {
  const [arrivedAt, setArrivedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (arrivedAt == null) return;
    timer.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [arrivedAt]);

  const elapsedSec = arrivedAt == null ? 0 : Math.max(0, Math.floor((now - arrivedAt) / 1000));
  const freeSec = FREE_MIN * 60;
  const detentionSec = Math.max(0, elapsedSec - freeSec);
  const accrued = (detentionSec / 3600) * RATE_PER_HOUR;
  const inDetention = detentionSec > 0;
  const freeLeftSec = Math.max(0, freeSec - elapsedSec);

  const start = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setArrivedAt(Date.now());
    setNow(Date.now());
  };
  const reset = () => {
    if (timer.current) clearInterval(timer.current);
    setArrivedAt(null);
    setNow(0);
  };

  return (
    <View className="flex-1 bg-accent">
      <SafeAreaView edges={['top']} className="border-b border-border bg-background">
        <View className="h-12 flex-row items-center px-4">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="flex-row items-center gap-1.5 active:opacity-60"
          >
            <ArrowLeft size={20} color={C.foreground} />
            <Text className="font-sans-medium text-base text-foreground">Back</Text>
          </Pressable>
          <Text pointerEvents="none" className="absolute inset-x-0 text-center font-sans-semibold text-base text-foreground">
            Detention
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerClassName="gap-5 p-4 pb-10" showsVerticalScrollIndicator={false}>
        {/* stop */}
        <View className="flex-row items-center gap-3 rounded-3xl bg-background p-4">
          <View className="size-10 items-center justify-center rounded-2xl bg-accent">
            <MapPin size={18} color={C.foreground} />
          </View>
          <View className="flex-1">
            <Text className="font-sans text-xs text-muted-foreground">At stop</Text>
            <Text className="font-sans-medium text-base text-foreground">{STOP_LABEL}</Text>
          </View>
        </View>

        {/* main timer */}
        <View
          className="items-center gap-2 rounded-3xl p-8"
          style={{ backgroundColor: inDetention ? `${C.destructive}12` : C.background }}
        >
          <Text className="font-sans-medium text-sm text-muted-foreground">
            {arrivedAt == null ? 'Not started' : inDetention ? 'Detention accruing' : 'Waiting (free time)'}
          </Text>
          <Text
            className="font-sans-bold"
            style={{ fontSize: 52, fontVariant: ['tabular-nums'], color: inDetention ? C.destructive : C.foreground }}
          >
            {fmt(elapsedSec)}
          </Text>
          {arrivedAt != null ? (
            <Text className="font-sans text-sm text-muted-foreground">
              {inDetention ? `${fmt(detentionSec)} over free time` : `${fmt(freeLeftSec)} of free time left`}
            </Text>
          ) : (
            <Text className="font-sans text-sm text-muted-foreground">
              {FREE_MIN / 60}h free, then ${RATE_PER_HOUR}/hr
            </Text>
          )}
        </View>

        {/* accrued */}
        <View className="flex-row gap-3">
          <View className="flex-1 items-center gap-1 rounded-3xl bg-background py-4">
            <Text className="font-sans-semibold text-xl" style={{ color: inDetention ? C.destructive : C.foreground }}>
              ${accrued.toFixed(2)}
            </Text>
            <Text className="font-sans text-xs text-muted-foreground">Detention accrued</Text>
          </View>
          <View className="flex-1 items-center gap-1 rounded-3xl bg-background py-4">
            <Text className="font-sans-semibold text-xl text-foreground">${RATE_PER_HOUR}</Text>
            <Text className="font-sans text-xs text-muted-foreground">Per hour after {FREE_MIN / 60}h</Text>
          </View>
        </View>

        <Text className="px-1 text-center font-sans text-xs text-muted-foreground">
          Detention is logged and sent to your dispatcher for the rate confirmation.
        </Text>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="bg-accent">
        <View className="gap-2 px-4 pb-2 pt-2">
          {arrivedAt == null ? (
            <Pressable
              onPress={start}
              accessibilityRole="button"
              accessibilityLabel="Mark arrival and start timer"
              className="h-16 items-center justify-center rounded-2xl bg-primary active:opacity-90"
            >
              <Text className="font-sans-medium text-base text-primary-foreground">Mark arrival</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={reset}
              accessibilityRole="button"
              accessibilityLabel="Stop and reset"
              className="h-16 flex-row items-center justify-center gap-2 rounded-2xl bg-background active:opacity-80"
            >
              <TimerReset size={18} color={C.foreground} />
              <Text className="font-sans-medium text-base text-foreground">Stop & reset</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
