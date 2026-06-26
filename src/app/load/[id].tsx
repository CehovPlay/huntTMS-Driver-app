import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Ban,
  Calendar,
  DollarSign,
  Hash,
  Layers,
  MapPin,
  Maximize2,
  MessageSquare,
  Navigation2,
  Package,
  Route,
  Ruler,
  Scale,
  Thermometer,
  Truck,
  User,
} from 'lucide-react-native';

import { StopMiniMap } from '@/components/stop-mini-map';
import { Pressable } from '@/components/pressable';
import { QuickActions } from '@/components/quick-actions';
import { RouteTimeline } from '@/components/route-timeline';
import { SwipeButton } from '@/components/swipe-button';
import { Skeleton } from '@/components/skeleton';
import { ErrorState } from '@/components/error-state';
import { useDriverLoads } from '@/lib/api/use-api-query';
import { C, shadowSm, tnum } from '@/lib/theme';
import { loadBadge, type LoadVariant } from '@/lib/status';

type Variant = LoadVariant;

function Spec({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return (
    <View className="flex-1 flex-row items-center gap-3">
      <Icon size={20} color={C.mutedForeground} />
      <View className="flex-1">
        <Text className="font-sans text-xs text-muted-foreground" numberOfLines={1}>
          {label}
        </Text>
        <Text className="font-sans-medium text-base text-foreground" numberOfLines={1} style={tnum}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View className="gap-3 p-4">
      <View className="gap-4 rounded-3xl bg-background p-4">
        <View className="flex-row items-center gap-3">
          <Skeleton width={48} height={48} radius={16} />
          <View className="flex-1 gap-2">
            <Skeleton width={50} height={12} />
            <Skeleton width="70%" height={18} />
          </View>
          <Skeleton width={70} height={24} radius={12} />
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} className="flex-row gap-3 border-t border-border pt-3.5">
            <Skeleton width="45%" height={36} />
            <Skeleton width="45%" height={36} />
          </View>
        ))}
      </View>
      <View className="gap-4 rounded-3xl bg-background p-4">
        <Skeleton width={120} height={16} />
        <Skeleton width="100%" height={48} radius={12} />
        <Skeleton width="100%" height={48} radius={12} />
        <Skeleton width="100%" height={150} radius={16} />
      </View>
    </View>
  );
}

export default function LoadDetailScreen() {
  const { id, variant: variantParam } = useLocalSearchParams<{ id: string; variant?: string }>();
  const q = useDriverLoads();
  const load = id ? q.data?.details.get(id) : undefined;
  const derivedVariant: Variant =
    load?.status === 'En route'
      ? 'current'
      : load?.status === 'Delivered'
        ? 'delivered'
        : load?.status === 'TONU'
          ? 'tonu'
          : 'scheduled';
  const variant: Variant =
    variantParam === 'current' ||
    variantParam === 'delivered' ||
    variantParam === 'tonu' ||
    variantParam === 'offered'
      ? variantParam
      : derivedVariant;
  const status = loadBadge(variant);
  const d = load?.details;
  const done = variant === 'delivered';

  return (
    <View className="flex-1 bg-accent">
      {/* Header */}
      <SafeAreaView edges={['top']} className="border-b border-border bg-background">
        <View className="h-12 flex-row items-center px-4">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            className="flex-row items-center gap-1.5 active:opacity-60"
          >
            <ArrowLeft size={20} color={C.foreground} />
            <Text className="font-sans-medium text-base text-foreground">Back</Text>
          </Pressable>
          <View pointerEvents="none" className="absolute inset-x-0 flex-row items-center justify-center gap-2">
            <Package size={18} color={C.foreground} />
            <Text className="font-sans-medium text-base text-foreground">{load?.id ?? id ?? 'Load'}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Body */}
      {q.loading && !load ? (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <DetailSkeleton />
        </ScrollView>
      ) : q.error ? (
        <ErrorState onRetry={q.refetch} />
      ) : !load || !d ? (
        <ErrorState onRetry={q.refetch} />
      ) : (
      <ScrollView className="flex-1" contentContainerClassName="gap-3 p-4 pb-4" showsVerticalScrollIndicator={false}>
        {/* TONU — canceled load: cancellation summary + the no-use fee owed to the driver */}
        {variant === 'tonu' && load.tonu ? (
          <View className="gap-3 rounded-3xl bg-background p-4">
            <View className="flex-row items-center gap-3">
              <View className="size-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${C.destructive}1A` }}>
                <Ban size={22} color={C.destructive} />
              </View>
              <View className="flex-1">
                <Text className="font-sans-semibold text-lg text-foreground">Load canceled</Text>
                <Text className="font-sans text-sm text-muted-foreground">{load.tonu.reason}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2 rounded-2xl bg-accent px-4 py-3">
              <Calendar size={15} color={C.mutedForeground} />
              <Text className="flex-1 font-sans text-sm text-muted-foreground">Canceled</Text>
              <Text className="font-sans-medium text-sm text-foreground">{load.tonu.canceledAt}</Text>
            </View>
            <View
              className="flex-row items-center gap-3 rounded-2xl px-4 py-3"
              style={{ backgroundColor: C.accent, borderWidth: 1, borderColor: C.border }}
            >
              <View className="size-10 items-center justify-center rounded-full" style={{ backgroundColor: C.background }}>
                <DollarSign size={18} color={C.foreground} />
              </View>
              <View className="flex-1">
                <Text className="font-sans-medium text-base text-foreground">TONU fee</Text>
                <Text className="font-sans text-sm text-muted-foreground">Paid for the canceled trip</Text>
              </View>
              <Text className="font-sans-semibold text-lg" style={{ color: C.foreground }}>
                {load.tonu.fee}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Shipment / order spec */}
        <View className="rounded-3xl bg-background p-4">
          <View className="flex-row items-center gap-3 pb-4">
            <View className="size-12 items-center justify-center rounded-2xl bg-accent">
              <Package size={22} color={C.foreground} />
            </View>
            <View className="flex-1">
              <Text className="font-sans text-xs text-muted-foreground">Order</Text>
              <Text className="font-sans-semibold text-lg leading-6 text-foreground">{d.commodity}</Text>
            </View>
            <View className="self-start rounded-full px-3 py-1" style={{ backgroundColor: status.bg }}>
              <Text className="font-sans-medium text-xs" style={{ color: status.color }}>
                {status.label}
              </Text>
            </View>
          </View>

          <View>
            <View className="flex-row border-t border-border py-3.5">
              <Spec icon={Hash} label="Order number" value={d.orderNo} />
            </View>
            <View className="flex-row gap-3 border-t border-border py-3.5">
              <Spec icon={Scale} label="Weight" value={d.weight} />
              <Spec icon={Layers} label="Quantity" value={d.quantity} />
            </View>
            <View className="flex-row gap-3 border-t border-border py-3.5">
              <Spec icon={DollarSign} label="Rate" value={d.rate} />
              <Spec icon={Route} label="Distance" value={load.miles ?? '—'} />
            </View>
            <View className="flex-row gap-3 border-t border-border py-3.5">
              <Spec icon={Hash} label="Reference" value={d.reference} />
              <Spec icon={Thermometer} label="Temperature" value={d.temp} />
            </View>
            <View className="flex-row gap-3 border-t border-border py-3.5">
              <Spec icon={Truck} label="Plate" value={d.plate} />
              <Spec icon={User} label="Co-driver" value={d.coDriver} />
            </View>
            <View className="flex-row border-t border-border py-3.5">
              <Spec icon={Ruler} label="Equipment" value={d.equipment} />
            </View>

            {/* accessorials + hazmat */}
            {d.accessorials.length > 0 || d.hazmat ? (
              <View className="gap-2 border-t border-border pt-3.5">
                <Text className="font-sans text-xs text-muted-foreground">Accessorials</Text>
                <View className="flex-row flex-wrap gap-2">
                  {d.hazmat ? (
                    <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${C.destructive}1A` }}>
                      <Text className="font-sans-medium text-xs" style={{ color: C.destructive }}>Hazmat</Text>
                    </View>
                  ) : null}
                  {d.accessorials.map((a) => (
                    <View key={a} className="rounded-full bg-accent px-3 py-1">
                      <Text className="font-sans-medium text-xs text-foreground">{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Quick actions — active trip only (report breakdown / add expense) */}
        {variant === 'current' ? <QuickActions variant="inline" /> : null}

        {/* Dispatcher comment — highlighted amber callout */}
        {d.comment ? (
          <View
            className="flex-row items-start gap-3 rounded-3xl p-4"
            style={{ backgroundColor: `${C.amber}14`, borderWidth: 1, borderColor: `${C.amber}33` }}
          >
            <View className="size-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${C.amber}26` }}>
              <MessageSquare size={18} color={C.amber} />
            </View>
            <View className="flex-1 gap-1">
              <Text className="font-sans-medium text-xs uppercase tracking-wide" style={{ color: C.amberText }}>
                Comment
              </Text>
              <Text className="font-sans-semibold text-[15px] leading-5 text-foreground">{d.comment}</Text>
            </View>
          </View>
        ) : null}

        {/* Partial loads sharing this trailer */}
        {load.partials.length > 0 ? (
          <View className="gap-3 rounded-3xl bg-background p-4">
            <View className="flex-row items-center gap-2">
              <Layers size={18} color={C.foreground} />
              <Text className="flex-1 font-sans-semibold text-base text-foreground">Partial loads on this trailer</Text>
              <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: C.accent }}>
                <Text className="font-sans-medium text-xs" style={{ color: C.foreground }}>{load.partials.length}</Text>
              </View>
            </View>
            {load.partials.map((p) => (
              <View key={p.id} className="flex-row items-center gap-3 rounded-2xl bg-accent p-3">
                <View className="size-10 items-center justify-center rounded-2xl bg-background">
                  <Package size={18} color={C.foreground} />
                </View>
                <View className="flex-1">
                  <Text className="font-sans-medium text-base text-foreground" numberOfLines={1}>
                    #{p.id} · {p.commodity}
                  </Text>
                  <Text className="font-sans text-sm text-muted-foreground" numberOfLines={1}>
                    {p.route}
                  </Text>
                </View>
                <Text className="font-sans-medium text-sm text-foreground">{p.weight}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Route — all pickup / delivery stops with dates */}
        <View className="gap-4 rounded-3xl bg-background p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-semibold text-base text-foreground">Route</Text>
            <Text className="font-sans text-sm text-muted-foreground">
              {load.stops.length} stops{load.miles ? ` · ${load.miles}` : ''}
            </Text>
          </View>

          {/* itinerary timeline — GPS-derived history (arrived / en route / upcoming) */}
          <RouteTimeline stops={load.stops} delivered={done} />

          {/* route preview → full-screen map */}
          <View className="overflow-hidden rounded-2xl" style={{ height: 150 }}>
            <StopMiniMap coordinate={load.stops[0].coordinate} pickup />
            <Pressable
              onPress={() => router.push('/route-map')}
              accessibilityRole="button"
              accessibilityLabel="View route on map"
              hitSlop={8}
              className="absolute right-2 top-2 size-9 items-center justify-center rounded-full bg-primary active:opacity-90"
              style={shadowSm}
            >
              <Maximize2 size={16} color={C.primaryForeground} />
            </Pressable>
          </View>
        </View>

        {/* Dispatcher */}
        <View className="overflow-hidden rounded-3xl bg-background">
          <View className="flex-row items-center gap-3 bg-background p-4">
            <View className="size-10 items-center justify-center rounded-full" style={{ backgroundColor: C.primary }}>
              <Text className="font-sans-semibold text-sm text-primary-foreground">
                {load.dispatcher.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans text-xs text-muted-foreground">Dispatcher</Text>
              <Text className="font-sans-medium text-base text-foreground">{load.dispatcher.name}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View className="gap-3 rounded-3xl bg-background p-4">
          <Text className="font-sans text-sm text-muted-foreground">Notes</Text>
          {load.notes.map((n) => (
            <View key={n.title} className="gap-2 rounded-2xl bg-accent p-4">
              <Text className="font-sans-medium text-base text-foreground">{n.title}</Text>
              <Text className="font-sans text-sm leading-5 text-muted-foreground">{n.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      )}

      {/* Footer action (varies by status) — padding on an inner View (SafeAreaView
          inset padding overrides className horizontal padding on web) */}
      {!q.loading && !q.error && (variant === 'offered' ? (
        <SafeAreaView edges={['bottom']} className="border-t border-border bg-background">
          <View className="gap-2 px-4 pb-2 pt-3">
            <View className="flex-row items-center justify-center gap-1.5 pb-1">
              <Text className="font-sans text-sm text-muted-foreground">Respond before</Text>
              <Text className="font-sans-semibold text-sm text-foreground">4:30 PM</Text>
            </View>
            <SwipeButton
              label="Swipe to accept load"
              onConfirm={() =>
                router.replace({ pathname: '/load/[id]', params: { id: id ?? '', variant: 'scheduled' } })
              }
            />
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Decline load"
              className="h-16 flex-row items-center justify-center gap-2 rounded-2xl bg-accent active:opacity-80"
            >
              <Text className="font-sans-medium text-base" style={{ color: C.destructive }}>
                Decline
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      ) : variant === 'scheduled' ? (
        <SafeAreaView edges={['bottom']} className="bg-accent">
          <View className="px-4 pb-2 pt-2">
            <SwipeButton label="Swipe to start trip" onConfirm={() => router.replace('/map')} />
          </View>
        </SafeAreaView>
      ) : variant === 'current' ? (
        <SafeAreaView edges={['bottom']} className="bg-accent">
          <View className="px-4 pb-2 pt-2">
            <Pressable
              onPress={() => router.replace('/map')}
              accessibilityRole="button"
              accessibilityLabel="Open map"
              className="h-16 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-90"
            >
              <Navigation2 size={18} color={C.primaryForeground} fill={C.primaryForeground} />
              <Text className="font-sans-medium text-base text-primary-foreground">Open map</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      ) : (
        <SafeAreaView edges={['bottom']} className="bg-accent" />
      ))}
    </View>
  );
}
