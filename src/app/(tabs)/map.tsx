import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, LocateFixed, Navigation2, Upload } from 'lucide-react-native';

import { CURRENT_LOAD, DRIVER_LOCATION, NAV_STOPS } from '@/lib/mock';
import { fetchRoutes, type LatLng } from '@/lib/route';
import { locateOnce } from '@/lib/geo';
import { Pressable } from '@/components/pressable';
import { SwipeButton } from '@/components/swipe-button';
import { UploadSheet } from '@/components/upload-sheet';
import { DocsFlowSheet } from '@/components/docs-flow-sheet';
import { TripMap, type MapRoutes } from '@/components/trip-map';
import { REQUIRED_DOCS, useActiveLoad } from '@/lib/active-load';
import { useNotifications } from '@/lib/notifications';
import { C, shadowSm } from '@/lib/theme';

const DOC_LABEL: Record<string, string> = {
  'Bill of landing': 'Bill of Lading (BOL)',
  'Proof of delivery': 'Proof of Delivery (POD)',
};

export default function MapScreen() {
  const load = CURRENT_LOAD;
  const { stage, docs, advance, canDeliver, addDoc } = useActiveLoad();
  const { notify } = useNotifications();
  const [sheet, setSheet] = useState(false);
  const [uploadType, setUploadType] = useState<string | undefined>(undefined);
  const [pickupDocs, setPickupDocs] = useState(false);
  const [routes, setRoutes] = useState<MapRoutes | null>(null);
  const [selected, setSelected] = useState(0); // 0 = fastest, 1 = alt
  const [myLocation, setMyLocation] = useState<LatLng | null>(null);

  const stop = stage === 'pickup' ? load.pickup : load.delivery;
  const active = stage !== 'delivered';

  const locateMe = async () => {
    const loc = await locateOnce();
    if (loc) setMyLocation(loc);
  };

  // fetch deadhead (driver -> pickup) + loaded route (pickup -> deliveries) + a visual alternative
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const driver = DRIVER_LOCATION;
      const pickup = NAV_STOPS[0].coordinate;
      const dels = NAV_STOPS.slice(1).map((s) => s.coordinate);
      const last = NAV_STOPS[NAV_STOPS.length - 1].coordinate;
      const [loaded, altR, dead] = await Promise.all([
        fetchRoutes([pickup, ...dels]),
        fetchRoutes([pickup, last]),
        fetchRoutes([driver, pickup]),
      ]);
      if (!cancelled && loaded) {
        setRoutes({
          fastest: loaded.primary,
          alt: altR?.alt ?? altR?.primary,
          deadhead: dead?.primary,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finishPickup = () => {
    setPickupDocs(false);
    advance();
    notify({ type: 'success', title: 'Pickup confirmed', body: 'Status sent to dispatch · next: Delivery' });
  };

  const onSwipe = () => {
    if (stage === 'delivery') {
      // Docs are mandatory AFTER the swipe — the Delivered screen blocks
      // completion until BOL + POD are uploaded. Swipe itself is always allowed.
      advance();
      router.push('/delivered');
    } else {
      // Pickup (arrived + loaded): collect pickup docs (BOL) — but skippable.
      setPickupDocs(true);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <TripMap routes={routes} selected={selected} onSelect={setSelected} active={active} myLocation={myLocation} />

      {/* locate-me (real device GPS) */}
      <SafeAreaView edges={['top']} pointerEvents="box-none" className="absolute inset-x-0 top-0 items-end">
        <Pressable
          onPress={locateMe}
          accessibilityRole="button"
          accessibilityLabel="Center on my location"
          className="m-3 size-12 items-center justify-center rounded-full border border-border bg-background active:opacity-80"
          style={shadowSm}
        >
          <LocateFixed size={20} color={C.foreground} />
        </Pressable>
      </SafeAreaView>

      {/* bottom card */}
      <SafeAreaView edges={['bottom']} className="mt-auto">
        <View className="mx-3 mb-2 gap-3 rounded-3xl border border-border bg-background p-4" style={shadowSm}>
          {stage === 'delivered' ? (
            <Text className="py-2 text-center font-sans text-base text-muted-foreground">No active load</Text>
          ) : (
            <>
              <Pressable
                onPress={() => router.push({ pathname: '/load/[id]', params: { id: '1832888', variant: 'current' } })}
                className="gap-2 active:opacity-70"
              >
                <View className="flex-row items-center gap-2">
                  <Text className="font-sans-medium text-base text-teal">Next stop — {stop.type}</Text>
                  <Text className="font-sans text-base text-foreground">{stop.date}</Text>
                  <Text className="font-sans text-base text-foreground">{stop.time}</Text>
                </View>
                <Text className="font-sans text-base text-foreground">{stop.address}</Text>
              </Pressable>

              {/* delivery: docs checklist (optional to pre-upload; mandatory on the
                  Delivered step after the swipe); pickup: uploaded chips + skip hint */}
              {stage === 'delivery' ? (
                <View className="gap-2.5 rounded-2xl bg-accent p-3.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-sans-medium text-xs text-muted-foreground">DOCUMENTS</Text>
                    <Text className="font-sans-medium text-xs" style={{ color: canDeliver ? C.teal : C.mutedForeground }}>
                      {REQUIRED_DOCS.filter((d) => docs.includes(d)).length}/{REQUIRED_DOCS.length}
                    </Text>
                  </View>
                  {REQUIRED_DOCS.map((d) => {
                    const up = docs.includes(d);
                    return (
                      <Pressable
                        key={d}
                        onPress={() => {
                          if (up) return;
                          // PoD is captured as a receiver signature; BOL via the upload sheet.
                          if (d === 'Proof of delivery') {
                            router.push('/signature');
                            return;
                          }
                          setUploadType(d);
                          setSheet(true);
                        }}
                        accessibilityRole={up ? undefined : 'button'}
                        accessibilityLabel={up ? `${DOC_LABEL[d] ?? d} uploaded` : `Upload ${DOC_LABEL[d] ?? d}`}
                        className="flex-row items-center gap-2.5 active:opacity-70"
                      >
                        <View
                          className="size-5 items-center justify-center rounded-full"
                          style={{ backgroundColor: up ? C.teal : 'transparent', borderWidth: up ? 0 : 1.5, borderColor: C.border }}
                        >
                          {up ? <Check size={13} color="#fff" strokeWidth={3} /> : null}
                        </View>
                        <Text className={`flex-1 text-sm ${up ? 'font-sans-medium text-foreground' : 'font-sans text-muted-foreground'}`}>
                          {DOC_LABEL[d] ?? d}
                        </Text>
                        <Text className="font-sans-medium text-xs" style={{ color: up ? C.teal : C.foreground }}>
                          {up ? 'Uploaded' : 'Upload'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View className="gap-2">
                  {docs.length > 0 ? (
                    <View className="flex-row flex-wrap gap-2">
                      {docs.map((d) => (
                        <View key={d} className="flex-row items-center gap-1.5 rounded-full bg-accent px-3 py-1">
                          <Check size={14} color={C.teal} />
                          <Text className="font-sans-medium text-xs text-foreground">{d}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <Text className="font-sans text-xs text-muted-foreground">
                    Documents are optional at pickup — upload now or skip; they’re required at delivery.
                  </Text>
                </View>
              )}

              {/* navigate + upload */}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => router.push('/navigate')}
                  accessibilityRole="button"
                  accessibilityLabel="Start navigation"
                  className="h-16 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-90"
                >
                  <Navigation2 size={18} color={C.primaryForeground} fill={C.primaryForeground} />
                  <Text className="font-sans-medium text-base text-primary-foreground">Start navigation</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setUploadType(undefined);
                    setSheet(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Upload document"
                  className="size-16 items-center justify-center rounded-2xl bg-accent active:opacity-80"
                >
                  <Upload size={22} color={C.foreground} />
                </Pressable>
              </View>

              <SwipeButton
                variant="light"
                label={stage === 'pickup' ? 'Swipe to Picked up' : 'Swipe to Delivered'}
                onConfirm={onSwipe}
              />
              {stage === 'delivery' ? (
                <Text className="-mt-1 text-center font-sans text-xs text-muted-foreground">
                  You’ll confirm BOL + POD on the next step
                </Text>
              ) : null}
            </>
          )}
        </View>
      </SafeAreaView>

      <UploadSheet
        visible={sheet}
        presetType={uploadType}
        onClose={() => {
          setSheet(false);
          setUploadType(undefined);
        }}
      />

      {/* pickup documents — collected after "Picked up", but skippable */}
      <DocsFlowSheet
        visible={pickupDocs}
        required={['Bill of landing']}
        labels={DOC_LABEL}
        uploaded={docs}
        title="Upload pickup documents"
        onUpload={addDoc}
        onConfirm={finishPickup}
        onSkip={finishPickup}
        onClose={() => setPickupDocs(false)}
      />
    </View>
  );
}
