import { useCallback, useState } from 'react';
import { Pressable as RNPressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, Package, Search, X } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { PressableScale } from '@/components/pressable-scale';
import { Skeleton } from '@/components/skeleton';
import { ErrorState } from '@/components/error-state';
import { haptics } from '@/lib/haptics';
import { useSettings } from '@/lib/settings';
import { fmtMi } from '@/lib/units';
import { Logo } from '@/components/logo';
import { EmptyState } from '@/components/empty-state';
import { C, shadowXs, tnum } from '@/lib/theme';
import { loadBadge } from '@/lib/status';
import { Appear } from '@/components/appear';
import { type Trip, type TripStop } from '@/lib/mock';
import { useDriverLoads } from '@/lib/api/use-api-query';

function StopRow({ stop, isFirst, isLast }: { stop: TripStop; isFirst: boolean; isLast: boolean }) {
  return (
    <View className="w-full flex-row items-stretch gap-3">
      {/* timeline column */}
      <View className="w-5 items-center">
        <View className={`w-px flex-1 ${isFirst ? '' : 'border-l border-dashed border-border'}`} />
        <View
          className="items-center justify-center rounded-full bg-background"
          style={{ width: 18, height: 18, borderWidth: 5, borderColor: `${C.mutedForeground}66` }}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.mutedForeground }} />
        </View>
        <View className={`w-px flex-1 ${isLast ? '' : 'border-l border-dashed border-border'}`} />
      </View>

      {/* date + place pill */}
      <View className="flex-1 py-2">
        <View className="flex-row items-center gap-3 rounded-2xl bg-accent px-4 py-2">
          <View className="items-center justify-center">
            <Text className="font-sans-medium text-2xl leading-none text-foreground">{stop.day}</Text>
            <Text className="font-sans-medium text-xs leading-4 text-foreground">{stop.month}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-sans-medium text-lg leading-7 text-foreground">{stop.city}</Text>
            <View className="mt-0.5 self-start rounded-full bg-background px-2.5 py-0.5">
              <Text className="font-sans-medium text-xs text-foreground">
                {stop.time}
                {stop.timeEnd ? ` – ${stop.timeEnd}` : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  // Scheduled trips show no status badge in the list.
  const badge = trip.status === 'scheduled' ? null : loadBadge(trip.status);
  const { units } = useSettings();
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/load/[id]', params: { id: String(trip.loadId ?? trip.id), variant: trip.status } })}
      className="w-full gap-2 rounded-3xl bg-background p-4 active:opacity-90"
    >
      {/* title — single stable row; partial indicator drops to its own line */}
      <View className="gap-1">
        <View className="flex-row items-center gap-2">
          <Package size={20} color={C.foreground} />
          <Text numberOfLines={1} className="flex-1 font-sans-medium text-base text-foreground">
            {trip.id}
          </Text>
          {badge ? (
            <View className="rounded-full px-3 py-1" style={{ backgroundColor: badge.bg }}>
              <Text numberOfLines={1} className="font-sans-medium text-xs" style={{ color: badge.color }}>
                {badge.label}
              </Text>
            </View>
          ) : null}
          <ChevronRight size={20} color={C.mutedForeground} />
        </View>
        {trip.partial ? (
          <Text numberOfLines={1} className="font-sans-medium text-sm text-muted-foreground">
            {trip.partial}
          </Text>
        ) : null}
      </View>

      {/* stops timeline */}
      <View>
        {trip.stops.map((stop, i) => (
          <StopRow key={i} stop={stop} isFirst={i === 0} isLast={i === trip.stops.length - 1} />
        ))}
      </View>

      {/* footer: broker + distance */}
      {trip.broker || trip.miles ? (
        <View className="mt-1 flex-row border-t border-border pt-3">
          <View className="flex-1">
            <Text className="font-sans text-xs text-muted-foreground">Broker</Text>
            <Text className="font-sans-medium text-sm text-foreground">{trip.broker ?? '—'}</Text>
          </View>
          {trip.miles ? (
            <View className="items-end">
              <Text className="font-sans text-xs text-muted-foreground">Distance</Text>
              <Text className="font-sans-medium text-sm text-foreground">{fmtMi(trip.miles, units)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </PressableScale>
  );
}

function TripCardSkeleton() {
  return (
    <View className="w-full gap-3 rounded-3xl bg-background p-4">
      <View className="flex-row items-center gap-2">
        <Skeleton width={20} height={20} radius={6} />
        <Skeleton width={120} height={16} />
        <View className="flex-1" />
        <Skeleton width={20} height={20} radius={10} />
      </View>
      <View className="gap-3 pl-2">
        <View className="flex-row items-center gap-3">
          <Skeleton width={18} height={18} radius={9} />
          <Skeleton width="70%" height={44} radius={16} />
        </View>
        <View className="flex-row items-center gap-3">
          <Skeleton width={18} height={18} radius={9} />
          <Skeleton width="55%" height={44} radius={16} />
        </View>
      </View>
      <View className="mt-1 flex-row justify-between border-t border-border pt-3">
        <Skeleton width={90} height={28} radius={6} />
        <Skeleton width={60} height={28} radius={6} />
      </View>
    </View>
  );
}

const MONTHS: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};
function tripDate(t: Trip) {
  const s = t.stops[0];
  if (!s) return new Date();
  return new Date(2026, MONTHS[s.month] ?? 0, parseInt(s.day, 10) || 1);
}
const BUCKETS = ['Today', 'Tomorrow', 'This week', 'Later'] as const;
const EMPTY_TRIP: Trip = { id: '', status: 'scheduled', stops: [] };
function bucketOf(anchorMs: number, t: Trip) {
  const diff = Math.round((tripDate(t).getTime() - anchorMs) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 7) return 'This week';
  return 'Later';
}

function matchesQuery(t: Trip, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    t.id.toLowerCase().includes(s) ||
    (t.broker ?? '').toLowerCase().includes(s) ||
    t.stops.some((st) => st.city.toLowerCase().includes(s))
  );
}

export default function LoadsScreen() {
  const [tab, setTab] = useState<'scheduled' | 'completed'>('scheduled');
  const [query, setQuery] = useState('');
  const q = useDriverLoads();
  const { units } = useSettings();

  useFocusEffect(
    useCallback(() => {
      q.refetch();
    }, [q.refetch]),
  );

  const scheduledTrips = q.data?.scheduledTrips ?? [];
  const completedTrips = q.data?.completedTrips ?? [];

  const completed = completedTrips.filter((t) => matchesQuery(t, query));

  // Scheduled is grouped by pickup day; anchored to the current load so it reads as "Today".
  const anchorMs = tripDate(
    scheduledTrips.find((t) => t.status === 'current') ?? scheduledTrips[0] ?? completedTrips[0] ?? EMPTY_TRIP,
  ).getTime();
  const groups = BUCKETS.map((label) => ({
    label,
    trips: scheduledTrips.filter((t) => bucketOf(anchorMs, t) === label && matchesQuery(t, query)),
  })).filter((g) => g.trips.length > 0);

  const empty = tab === 'completed' ? completed.length === 0 : groups.length === 0;

  return (
    <View className="flex-1 bg-accent">
      {/* Pinned brand row only — the tabs + search scroll with the list below */}
      <SafeAreaView edges={['top']} className="bg-background">
        <View className="flex-row items-center gap-3 px-5 pb-2 pt-3 pl-6">
          <View className="flex-1">
            <Logo height={24} />
          </View>
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            className="size-12 items-center justify-center rounded-full active:opacity-70"
            style={{ backgroundColor: C.border }}
          >
            <Text className="font-sans-semibold text-xs text-foreground">DC</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Body — plain views, no layout animations (avoids the device-only reanimated crash) */}
      <ScrollView
        contentContainerStyle={[{ paddingBottom: 110 }, q.error || (!q.loading && empty) ? { flexGrow: 1 } : null]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={q.refreshing} onRefresh={q.refetch} tintColor={C.mutedForeground} colors={[C.foreground]} />
        }
      >
        {/* tabs + search — now part of the scroll content */}
        <View className="gap-4 rounded-b-3xl border-b border-border bg-background px-5 pb-5 pt-1">
          {/* segmented tabs — raw RN Pressable + inline styles (no className / css-interop on this dynamic re-render path) */}
          <View
            style={{
              height: 44,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 12,
              backgroundColor: C.accent,
              padding: 4,
            }}
          >
            {(['scheduled', 'completed'] as const).map((t) => {
              const on = tab === t;
              return (
                <RNPressable
                  key={t}
                  onPress={() => {
                    haptics.selection();
                    setTab(t);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  hitSlop={8}
                  style={{
                    flex: 1,
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: on ? C.background : 'transparent',
                    ...(on ? shadowXs : null),
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Geist_500Medium',
                      fontSize: 14,
                      color: on ? C.foreground : C.mutedForeground,
                    }}
                  >
                    {t === 'scheduled' ? 'Scheduled' : 'Completed'}
                  </Text>
                </RNPressable>
              );
            })}
          </View>

          {/* search */}
          <View className="h-12 flex-row items-center gap-2 rounded-2xl bg-accent px-3.5">
            <Search size={18} color={C.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search loads, city, broker"
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

        {/* list */}
        {q.loading ? (
          <View className="gap-3 p-4">
            {[0, 1, 2].map((i) => (
              <TripCardSkeleton key={i} />
            ))}
          </View>
        ) : q.error ? (
          <ErrorState onRetry={q.refetch} />
        ) : empty ? (
          <EmptyState
            icon={Package}
            title={query ? `No loads match “${query}”` : `No ${tab} loads`}
            subtitle={query ? 'Try a different search.' : tab === 'scheduled' ? 'New offers from dispatch will appear here.' : 'Delivered loads will show up here.'}
          />
        ) : (
          <View className="gap-3 p-4">
            {tab === 'scheduled'
              ? (() => {
                  let k = 0;
                  return groups.map((g) => (
                    <View key={g.label} className="gap-3">
                      <Text className="px-1 font-sans-medium text-sm text-muted-foreground">{g.label}</Text>
                      {g.trips.map((trip) => (
                        <Appear key={String(trip.loadId ?? trip.id)} index={k++}>
                          <TripCard trip={trip} />
                        </Appear>
                      ))}
                    </View>
                  ));
                })()
              : completed.map((trip, i) => (
                  <Appear key={String(trip.loadId ?? trip.id)} index={i}>
                    <TripCard trip={trip} />
                  </Appear>
                ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
