import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Check,
  DollarSign,
  Hash,
  Layers,
  MapPin,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Navigation2,
  Package,
  Phone,
  Route,
  Ruler,
  Scale,
  Thermometer,
  Truck,
  User,
} from 'lucide-react-native';

import { getLoadDetail } from '@/lib/mock';
import { StopMiniMap } from '@/components/stop-mini-map';
import { Pressable } from '@/components/pressable';
import { SwipeButton } from '@/components/swipe-button';
import { C, shadowSm } from '@/lib/theme';

type Variant = 'offered' | 'scheduled' | 'current' | 'delivered' | 'tonu';

const STATUS: Record<Variant, { label: string; bg: string; color: string }> = {
  offered: { label: 'New offer', bg: '#7a5af8', color: '#ffffff' },
  scheduled: { label: 'Scheduled', bg: '#f5f5f5', color: '#737373' },
  current: { label: 'Current load', bg: '#fbbf24', color: '#171717' },
  delivered: { label: 'Delivered', bg: '#0d9488', color: '#ffffff' },
  tonu: { label: 'Canceled', bg: '#ef4444', color: '#ffffff' },
};

function Spec({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return (
    <View className="flex-1 flex-row items-center gap-3">
      <Icon size={20} color={C.mutedForeground} />
      <View className="flex-1">
        <Text className="font-sans text-xs text-muted-foreground" numberOfLines={1}>
          {label}
        </Text>
        <Text className="font-sans-medium text-base text-foreground" numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function LoadDetailScreen() {
  const { id, variant: variantParam } = useLocalSearchParams<{ id: string; variant?: string }>();
  const variant: Variant =
    variantParam === 'current' ||
    variantParam === 'delivered' ||
    variantParam === 'tonu' ||
    variantParam === 'offered'
      ? variantParam
      : 'scheduled';
  const load = getLoadDetail(id ?? '');
  const status = STATUS[variant];
  const d = load.details;
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
            <ArrowLeft size={20} color="#171717" />
            <Text className="font-sans-medium text-base text-foreground">Back</Text>
          </Pressable>
          <View pointerEvents="none" className="absolute inset-x-0 flex-row items-center justify-center gap-2">
            <Package size={18} color="#171717" />
            <Text className="font-sans-medium text-base text-foreground">{load.id}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Body */}
      <ScrollView className="flex-1" contentContainerClassName="gap-3 p-4 pb-4" showsVerticalScrollIndicator={false}>
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

        {/* Highlighted comment */}
        {d.comment ? (
          <View className="flex-row gap-3 rounded-3xl bg-background p-4" style={{ borderWidth: 1, borderColor: `${C.amber}66` }}>
            <View className="relative">
              <MessageSquare size={20} color={C.amber} />
              <View className="absolute -right-1 -top-1 size-2 rounded-full" style={{ backgroundColor: C.amber }} />
            </View>
            <View className="flex-1">
              <Text className="font-sans text-xs text-muted-foreground">Comment</Text>
              <Text className="font-sans-medium text-base leading-6 text-foreground">{d.comment}</Text>
            </View>
          </View>
        ) : null}

        {/* Partial loads sharing this trailer */}
        {load.partials.length > 0 ? (
          <View className="gap-3 rounded-3xl bg-background p-4">
            <View className="flex-row items-center gap-2">
              <Layers size={18} color={C.purple} />
              <Text className="flex-1 font-sans-semibold text-base text-foreground">Partial loads on this trailer</Text>
              <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${C.purple}1A` }}>
                <Text className="font-sans-medium text-xs" style={{ color: C.purple }}>{load.partials.length}</Text>
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

          {/* itinerary timeline */}
          <View>
            {load.stops.map((s, i) => {
              const isLast = i === load.stops.length - 1;
              const isPickup = s.type === 'Pick up';
              return (
                <View key={i} className="flex-row gap-3">
                  <View className="items-center" style={{ width: 24 }}>
                    <View
                      className="size-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: isPickup ? C.foreground : C.teal }}
                    >
                      <Text className="font-sans-semibold text-white" style={{ fontSize: 11 }}>{i + 1}</Text>
                    </View>
                    {!isLast ? <View style={{ flex: 1, width: 1, minHeight: 18, backgroundColor: C.border }} /> : null}
                  </View>
                  <View className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
                    <View className="flex-row items-center gap-2">
                      <Text className="font-sans-medium text-xs" style={{ color: isPickup ? C.foreground : C.teal }}>
                        {s.type}
                      </Text>
                      {done && s.doneAt ? <Check size={13} color={C.teal} /> : null}
                    </View>
                    <Text className="font-sans-medium text-base leading-6 text-foreground">{s.address}</Text>
                    <View className="mt-0.5 flex-row items-center gap-1.5">
                      <Calendar size={13} color={C.mutedForeground} />
                      <Text className="font-sans text-sm text-muted-foreground">
                        {s.date} · {s.time}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* route preview → full-screen map */}
          <View className="overflow-hidden rounded-2xl" style={{ height: 150 }}>
            <StopMiniMap coordinate={load.stops[0].coordinate} pickup />
            <Pressable
              onPress={() => router.push('/route-map')}
              accessibilityRole="button"
              accessibilityLabel="View route on map"
              className="absolute bottom-2 left-1/2 -ml-16 w-32 flex-row items-center justify-center gap-2 rounded-full bg-primary py-2.5 active:opacity-90"
            >
              <Maximize2 size={14} color={C.primaryForeground} />
              <Text className="font-sans-medium text-sm text-primary-foreground">View on map</Text>
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
            <Pressable
              onPress={() => router.push('/chat')}
              accessibilityRole="button"
              accessibilityLabel={`Message ${load.dispatcher.name}`}
              className="size-12 items-center justify-center rounded-2xl bg-accent active:opacity-80"
            >
              <MessageCircle size={20} color="#171717" />
            </Pressable>
            <Pressable
              onPress={() => router.push('/call')}
              accessibilityRole="button"
              accessibilityLabel={`Call ${load.dispatcher.name}`}
              className="size-12 items-center justify-center rounded-2xl bg-accent active:opacity-80"
            >
              <Phone size={20} color="#171717" />
            </Pressable>
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

      {/* Footer action (varies by status) — padding on an inner View (SafeAreaView
          inset padding overrides className horizontal padding on web) */}
      {variant === 'offered' ? (
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
              <Navigation2 size={18} color="#fafafa" fill="#fafafa" />
              <Text className="font-sans-medium text-base text-primary-foreground">Open map</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      ) : (
        <SafeAreaView edges={['bottom']} className="bg-accent" />
      )}
    </View>
  );
}
