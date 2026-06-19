import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, Clock, Package, TrendingUp, Wallet } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { C } from '@/lib/theme';
import { EARNINGS, money } from '@/lib/earnings';
import { useSettings } from '@/lib/settings';
import { fmtMi } from '@/lib/units';

export default function Earnings() {
  const { units } = useSettings();
  const maxDay = Math.max(...EARNINGS.byDay.map((d) => d.v), 1);
  const maxIdx = EARNINGS.byDay.reduce((best, d, i, a) => (d.v > a[best].v ? i : best), 0);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <View className="flex-1 bg-accent">
      <SafeAreaView edges={['top']} className="border-b border-border bg-background">
        <View className="h-12 flex-row items-center px-4">
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back" className="flex-row items-center gap-1.5 active:opacity-60">
            <ArrowLeft size={20} color={C.foreground} />
            <Text className="font-sans-medium text-base text-foreground">Back</Text>
          </Pressable>
          <Text pointerEvents="none" className="absolute inset-x-0 text-center font-sans-semibold text-base text-foreground">
            Earnings
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerClassName="gap-5 p-4 pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.mutedForeground} colors={[C.foreground]} />
        }
      >
        {/* this week */}
        <View className="gap-3 rounded-3xl bg-background p-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-medium text-sm text-muted-foreground">This week · {EARNINGS.week}</Text>
            <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: `${C.teal}1A` }}>
              <TrendingUp size={13} color={C.teal} />
              <Text className="font-sans-medium text-xs" style={{ color: C.teal }}>+{EARNINGS.trendPct}%</Text>
            </View>
          </View>
          <Text className="font-sans-bold text-foreground" style={{ fontSize: 44 }}>{money(EARNINGS.gross)}</Text>

          {/* cash out */}
          <Pressable
            onPress={() => router.push('/cash-out')}
            accessibilityRole="button"
            accessibilityLabel={`Cash out ${money(EARNINGS.available)}`}
            className="h-16 flex-row items-center justify-center gap-2 rounded-2xl bg-accent active:opacity-80"
          >
            <Wallet size={16} color={C.foreground} />
            <Text className="font-sans-medium text-base text-foreground">Cash out {money(EARNINGS.available)}</Text>
            <ChevronRight size={16} color={C.mutedForeground} />
          </Pressable>

          {/* weekly bar chart (tooltip on best day) */}
          <View className="mt-1 h-28 flex-row items-end justify-between">
            {EARNINGS.byDay.map((d, i) => {
              const isMax = i === maxIdx && d.v > 0;
              return (
                <View key={i} className="flex-1 items-center justify-end gap-1.5">
                  {isMax ? (
                    <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: C.primary }}>
                      <Text className="font-sans-semibold text-[10px] text-primary-foreground">{money(d.v)}</Text>
                    </View>
                  ) : null}
                  <View
                    style={{ width: 18, height: Math.max(4, (d.v / maxDay) * 64), backgroundColor: isMax ? C.teal : d.v ? C.foreground : C.border }}
                    className="rounded-md"
                  />
                  <Text className="font-sans text-xs text-muted-foreground">{d.d}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* active time + deliveries */}
        <View className="flex-row gap-3">
          <View className="flex-1 flex-row items-center gap-3 rounded-3xl bg-background p-4">
            <View className="size-10 items-center justify-center rounded-2xl bg-accent">
              <Clock size={18} color={C.foreground} />
            </View>
            <View>
              <Text className="font-sans-semibold text-xl text-foreground">{EARNINGS.activeHours}h</Text>
              <Text className="font-sans text-xs text-muted-foreground">Active time</Text>
            </View>
          </View>
          <View className="flex-1 flex-row items-center gap-3 rounded-3xl bg-background p-4">
            <View className="size-10 items-center justify-center rounded-2xl bg-accent">
              <Package size={18} color={C.foreground} />
            </View>
            <View>
              <Text className="font-sans-semibold text-xl text-foreground">{EARNINGS.deliveries}</Text>
              <Text className="font-sans text-xs text-muted-foreground">Deliveries</Text>
            </View>
          </View>
        </View>

        {/* stats */}
        <View className="flex-row gap-3">
          {[
            {
              label: units === 'km' ? 'Km' : 'Miles',
              value: (units === 'km' ? Math.round(EARNINGS.miles * 1.60934) : EARNINGS.miles).toLocaleString('en-US'),
            },
            {
              label: units === 'km' ? '$ / km' : '$ / mile',
              value: `$${units === 'km' ? (EARNINGS.perMile / 1.60934).toFixed(2) : EARNINGS.perMile}`,
            },
            { label: 'Loads', value: String(EARNINGS.loads) },
          ].map((s) => (
            <View key={s.label} className="flex-1 items-center gap-1 rounded-3xl bg-background py-4">
              <Text className="font-sans-semibold text-xl text-foreground">{s.value}</Text>
              <Text className="font-sans text-xs text-muted-foreground">{s.label}</Text>
            </View>
          ))}
        </View>

        {/* paid loads */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">PAID LOADS</Text>
          <View className="gap-px overflow-hidden rounded-3xl bg-background">
            {EARNINGS.paid.map((p) => (
              <View key={p.id} className="flex-row items-center gap-3 bg-background px-4 py-3.5">
                <View className="size-10 items-center justify-center rounded-2xl bg-accent">
                  <Package size={18} color={C.foreground} />
                </View>
                <View className="flex-1">
                  <Text className="font-sans-medium text-base text-foreground">{p.id}</Text>
                  <Text className="font-sans text-sm text-muted-foreground" numberOfLines={1}>
                    {p.route}
                  </Text>
                  <Text className="font-sans text-xs text-muted-foreground">{fmtMi(p.miles, units)} · {p.date}</Text>
                </View>
                <Text className="font-sans-semibold text-base text-foreground">{money(p.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
