import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, LocateFixed } from 'lucide-react-native';

import { useDriverLoads } from '@/lib/api/use-api-query';
import { fetchRoutes, type LatLng } from '@/lib/route';
import { locateOnce } from '@/lib/geo';
import { Pressable } from '@/components/pressable';
import { TripMap, type MapRoutes } from '@/components/trip-map';
import { C, shadowSm } from '@/lib/theme';

// Full-screen route preview — all stops + the optimal route, no action panel.
// Opened from the load detail "View on map".
export default function RouteMap() {
  const loads = useDriverLoads();
  const navStops = loads.data?.activeNavStops ?? [];
  const [routes, setRoutes] = useState<MapRoutes | null>(null);
  const [selected, setSelected] = useState(0);
  const [myLocation, setMyLocation] = useState<LatLng | null>(null);
  const driverLocation = myLocation ?? navStops[0]?.coordinate ?? null;

  const locateMe = async () => {
    const loc = await locateOnce();
    if (loc) setMyLocation(loc);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (navStops.length < 2) {
        setRoutes(null);
        return;
      }
      const loc = await locateOnce();
      if (!cancelled && loc) setMyLocation(loc);
      const origin = loc ?? navStops[0].coordinate;
      const pickup = navStops[0].coordinate;
      const dels = navStops.slice(1).map((s) => s.coordinate);
      const last = navStops[navStops.length - 1].coordinate;
      const [loaded, altR, dead] = await Promise.all([
        fetchRoutes([pickup, ...dels]),
        fetchRoutes([pickup, last]),
        fetchRoutes([origin, pickup]),
      ]);
      if (!cancelled && loaded) {
        setRoutes({ fastest: loaded.primary, alt: altR?.alt ?? altR?.primary, deadhead: dead?.primary });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navStops]);

  return (
    <View className="flex-1 bg-background">
      <TripMap routes={routes} selected={selected} onSelect={setSelected} active myLocation={myLocation} navStops={navStops} driverLocation={driverLocation} />

      {/* top controls: close + recenter */}
      <SafeAreaView edges={['top']} pointerEvents="box-none" className="absolute inset-x-0 top-0">
        <View pointerEvents="box-none" className="flex-row items-center justify-between p-3">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close map"
            className="size-12 items-center justify-center rounded-full border border-border bg-background active:opacity-80"
            style={shadowSm}
          >
            <ArrowLeft size={20} color={C.foreground} />
          </Pressable>
          <View className="rounded-full border border-border bg-background px-4 py-2" style={shadowSm}>
            <Text className="font-sans-medium text-sm text-foreground">
              {navStops.length > 1
                ? `${navStops.length} stops · ${navStops[0].city.split(',')[0]} → ${navStops[navStops.length - 1].city.split(',')[0]}`
                : 'No active route'}
            </Text>
          </View>
          <Pressable
            onPress={locateMe}
            accessibilityRole="button"
            accessibilityLabel="Center on my location"
            className="size-12 items-center justify-center rounded-full border border-border bg-background active:opacity-80"
            style={shadowSm}
          >
            <LocateFixed size={20} color={C.foreground} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
