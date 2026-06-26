import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, Clock, LocateFixed, Navigation2, Upload } from 'lucide-react-native';

import { useDriverLoads } from '@/lib/api/use-api-query';
import {
  reportDriverLocation,
  updateDriverLoadStatus,
  uploadDriverLoadFile,
} from '@/lib/api/load-mutations';
import { fetchRoutes, etaText, milesText, type LatLng } from '@/lib/route';
import { locateOnce } from '@/lib/geo';
import { Pressable } from '@/components/pressable';
import { SwipeButton } from '@/components/swipe-button';
import { SuccessCheck } from '@/components/success-check';
import { UploadSheet } from '@/components/upload-sheet';
import { DocsFlowSheet } from '@/components/docs-flow-sheet';
import { TripMap, type MapRoutes } from '@/components/trip-map';
import { REQUIRED_DOCS, useActiveLoad } from '@/lib/active-load';
import { useNotifications } from '@/lib/notifications';
import { C, shadowSm, tnum } from '@/lib/theme';
import { useCountUp } from '@/lib/use-count-up';

const DOC_LABEL: Record<string, string> = {
  'Bill of landing': 'Bill of Lading (BOL)',
  'Proof of delivery': 'Proof of Delivery (POD)',
};

// Isolated so the count-up's re-renders don't touch the heavy map tree.
function EtaDistance({ meters }: { meters: number }) {
  const m = useCountUp(meters, 800);
  return <Text className="font-sans text-sm text-muted-foreground" style={tnum}>{milesText(m)}</Text>;
}

export default function MapScreen() {
  const q = useDriverLoads();
  const load = q.data?.activeLoad;
  const navStops = q.data?.activeNavStops ?? [];
  const { stage, setStage, docs, advance, canDeliver, addDoc } = useActiveLoad();
  const { notify } = useNotifications();
  const [sheet, setSheet] = useState(false);
  const [uploadType, setUploadType] = useState<string | undefined>(undefined);
  const [pickupDocs, setPickupDocs] = useState(false);
  const [pickupDone, setPickupDone] = useState(false);
  const [routes, setRoutes] = useState<MapRoutes | null>(null);
  const [selected, setSelected] = useState(0); // 0 = fastest, 1 = alt
  const [myLocation, setMyLocation] = useState<LatLng | null>(null);
  const [mutating, setMutating] = useState(false);

  const stop = load ? (stage === 'pickup' ? load.pickup : load.delivery) : null;
  const active = !!load && stage !== 'delivered';
  const driverLocation = myLocation ?? navStops[0]?.coordinate ?? null;

  const locateMe = async () => {
    const loc = await locateOnce();
    if (!loc) return;
    setMyLocation(loc);
    reportDriverLocation(loc).catch(() => {
      notify({ type: 'alert', title: 'Location not sent', body: 'Dispatch will keep the previous GPS point.' });
    });
  };

  useEffect(() => {
    locateOnce().then((loc) => {
      if (loc) setMyLocation(loc);
    });
  }, []);

  useEffect(() => {
    if (!load) return;
    if (pickupDocs) return;
    if (load.status === 'Scheduled') setStage('pickup');
    else if (load.status === 'En route') setStage('delivery');
    else if (load.status === 'Delivered') setStage('delivered');
  }, [load?.id, load?.status, pickupDocs, setStage]);

  // fetch deadhead (driver -> pickup) + loaded route (pickup -> deliveries) + a visual alternative
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (navStops.length < 2) {
        setRoutes(null);
        return;
      }
      const pickup = navStops[0].coordinate;
      const dels = navStops.slice(1).map((s) => s.coordinate);
      const last = navStops[navStops.length - 1].coordinate;
      const [loaded, altR, dead] = await Promise.all([
        fetchRoutes([pickup, ...dels]),
        fetchRoutes([pickup, last]),
        driverLocation ? fetchRoutes([driverLocation, pickup]) : Promise.resolve(null),
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
  }, [driverLocation, navStops]);

  const finishPickup = async () => {
    if (mutating) return;
    setPickupDocs(false);
    advance();
    notify({ type: 'success', title: 'Pickup confirmed', body: 'Status sent to dispatch · next: Delivery' });
    setPickupDone(true);
    setTimeout(() => setPickupDone(false), 1300);
  };

  const uploadDoc = async (type: string, uri?: string) => {
    if (!load || !uri) return;
    await uploadDriverLoadFile({ loadId: load.id, uri, label: type });
    addDoc(type);
  };

  const onSwipe = async () => {
    if (!load || mutating) return;
    if (stage === 'delivery') {
      // Docs are mandatory AFTER the swipe — the Delivered screen blocks
      // completion until BOL + POD are uploaded. Swipe itself is always allowed.
      advance();
      router.push('/delivered');
      return;
    }

    setMutating(true);
    try {
      await updateDriverLoadStatus(load.id, 'EN_ROUTE');
      setPickupDocs(true);
      await q.refetch();
    } catch {
      notify({ type: 'alert', title: 'Status not sent', body: 'Try again before confirming pickup.' });
    } finally {
      setMutating(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <TripMap
        routes={routes}
        selected={selected}
        onSelect={setSelected}
        active={active}
        myLocation={myLocation}
        navStops={navStops}
        driverLocation={driverLocation}
      />

      {/* ETA pill (remaining time + distance for the active route) */}
      {active && routes?.fastest ? (
        <SafeAreaView edges={['top']} pointerEvents="none" className="absolute inset-x-0 top-0 items-center">
          <View
            className="m-3 flex-row items-center gap-2 rounded-full bg-background px-4 py-2"
            style={shadowSm}
            accessibilityLabel={`Estimated ${etaText(routes.fastest.duration)}, ${milesText(routes.fastest.distance)} remaining`}
          >
            <Clock size={15} color={C.foreground} />
            <Text className="font-sans-semibold text-sm text-foreground" style={tnum}>{etaText(routes.fastest.duration)}</Text>
            <View className="size-1 rounded-full" style={{ backgroundColor: C.mutedForeground }} />
            <EtaDistance meters={routes.fastest.distance} />
          </View>
        </SafeAreaView>
      ) : null}

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

      {/* bottom card — sits above the floating tab bar (≈ bar height clearance) */}
      <SafeAreaView edges={['bottom']} className="mt-auto">
        <View className="mx-3 gap-3 rounded-3xl border border-border bg-background p-4" style={[shadowSm, { marginBottom: 108 }]}>
          {q.loading && !load ? (
            <Text className="py-2 text-center font-sans text-base text-muted-foreground">Loading route…</Text>
          ) : q.error ? (
            <Pressable onPress={q.refetch} className="py-2 active:opacity-70">
              <Text className="text-center font-sans text-base text-muted-foreground">Could not load route. Tap to retry.</Text>
            </Pressable>
          ) : stage === 'delivered' || !load || !stop ? (
            <Text className="py-2 text-center font-sans text-base text-muted-foreground">No active load</Text>
          ) : (
            <>
              <Pressable
                onPress={() => router.push({ pathname: '/load/[id]', params: { id: load.id, variant: 'current' } })}
                className="gap-2 active:opacity-70"
              >
                <View className="flex-row items-center gap-2">
                  <Text className="font-sans-medium text-base text-foreground">Next stop — {stop.type}</Text>
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
                    <Text className="font-sans-medium text-xs" style={{ color: canDeliver ? C.foreground : C.mutedForeground }}>
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
                          style={{ backgroundColor: up ? C.foreground : 'transparent', borderWidth: up ? 0 : 1.5, borderColor: C.border }}
                        >
                          {up ? <Check size={13} color={C.background} strokeWidth={3} /> : null}
                        </View>
                        <Text className={`flex-1 text-sm ${up ? 'font-sans-medium text-foreground' : 'font-sans text-muted-foreground'}`}>
                          {DOC_LABEL[d] ?? d}
                        </Text>
                        <Text className="font-sans-medium text-xs" style={{ color: C.foreground }}>
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
                          <Check size={14} color={C.foreground} />
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
                label={mutating ? 'Sending status...' : stage === 'pickup' ? 'Swipe to Picked up' : 'Swipe to Delivered'}
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
        onUpload={uploadDoc}
        onConfirm={finishPickup}
        onSkip={finishPickup}
        onClose={() => setPickupDocs(false)}
      />

      {/* pickup success confirmation */}
      {pickupDone ? (
        <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} pointerEvents="none">
          <View className="items-center gap-4 rounded-3xl bg-background px-10 py-8" style={shadowSm}>
            <SuccessCheck size={84} />
            <Text className="font-sans-semibold text-xl text-foreground">Picked up</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
