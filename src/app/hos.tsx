import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { C } from '@/lib/theme';
import { DUTY, HOS, fmtHrs, type DutyStatus } from '@/lib/hos';

function colorFor(s: DutyStatus) {
  return DUTY.find((d) => d.key === s)?.color ?? C.mutedForeground;
}

function Clock({ label, usedH, maxH, note }: { label: string; usedH: number; maxH: number; note?: string }) {
  const pct = Math.min(1, usedH / maxH);
  const remaining = Math.max(0, maxH - usedH);
  return (
    <View className="gap-2 bg-background px-4 py-3.5">
      <View className="flex-row items-baseline justify-between">
        <Text className="font-sans-medium text-base text-foreground">{label}</Text>
        <Text className="font-sans-medium text-base text-foreground">
          {fmtHrs(remaining)} <Text className="font-sans text-sm text-muted-foreground">left</Text>
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-accent">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct * 100}%`, backgroundColor: pct > 0.85 ? C.destructive : C.teal }}
        />
      </View>
      <Text className="font-sans text-xs text-muted-foreground">
        {note ?? `${fmtHrs(usedH)} of ${fmtHrs(maxH)} used`}
      </Text>
    </View>
  );
}

export default function Hos() {
  const [status, setStatus] = useState<DutyStatus>(HOS.current);
  const drive = HOS.clocks[0];
  const driveLeft = Math.max(0, drive.maxH - drive.usedH);

  return (
    <View className="flex-1 bg-accent">
      <SafeAreaView edges={['top']} className="border-b border-border bg-background">
        <View className="h-12 flex-row items-center px-4">
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back" className="flex-row items-center gap-1.5 active:opacity-60">
            <ArrowLeft size={20} color={C.foreground} />
            <Text className="font-sans-medium text-base text-foreground">Back</Text>
          </Pressable>
          <Text pointerEvents="none" className="absolute inset-x-0 text-center font-sans-semibold text-base text-foreground">
            Hours of Service
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerClassName="gap-5 p-4 pb-10" showsVerticalScrollIndicator={false}>
        {/* big remaining drive */}
        <View className="items-center gap-1 rounded-3xl bg-background p-6">
          <Text className="font-sans-medium text-sm text-muted-foreground">Drive time remaining</Text>
          <Text className="font-sans-bold text-foreground" style={{ fontSize: 44 }}>{fmtHrs(driveLeft)}</Text>
          <View className="mt-1 flex-row items-center gap-2 rounded-full px-3 py-1" style={{ backgroundColor: `${colorFor(status)}1A` }}>
            <View className="size-2 rounded-full" style={{ backgroundColor: colorFor(status) }} />
            <Text className="font-sans-medium text-sm" style={{ color: colorFor(status) }}>{status}</Text>
          </View>
        </View>

        {/* status selector */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">DUTY STATUS</Text>
          <View className="flex-row gap-2">
            {DUTY.map((d) => {
              const on = status === d.key;
              return (
                <Pressable
                  key={d.key}
                  onPress={() => setStatus(d.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Set status ${d.key}`}
                  className="flex-1 items-center gap-1 rounded-2xl py-3"
                  style={{ backgroundColor: on ? d.color : C.background }}
                >
                  <Text className="font-sans-bold text-base" style={{ color: on ? '#fff' : C.foreground }}>{d.short}</Text>
                  <Text className="font-sans text-[11px]" style={{ color: on ? 'rgba(255,255,255,0.85)' : C.mutedForeground }}>{d.key}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* clocks */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">CLOCKS</Text>
          <View className="gap-px overflow-hidden rounded-3xl bg-background">
            {HOS.clocks.map((c) => (
              <Clock key={c.label} {...c} />
            ))}
          </View>
        </View>

        {/* today log */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">TODAY'S LOG</Text>
          <View className="gap-px overflow-hidden rounded-3xl bg-background">
            {HOS.today.map((seg, i) => (
              <View key={i} className="flex-row items-center gap-3 bg-background px-4 py-3">
                <View className="size-3 rounded-full" style={{ backgroundColor: colorFor(seg.status) }} />
                <Text className="flex-1 font-sans-medium text-base text-foreground">{seg.status}</Text>
                <Text className="font-sans text-sm text-muted-foreground">
                  {seg.from} – {seg.to}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
