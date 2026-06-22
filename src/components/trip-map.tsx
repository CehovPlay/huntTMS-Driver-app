import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Navigation2 } from 'lucide-react-native';

import { DRIVER_LOCATION, NAV_STOPS } from '@/lib/mock';
import { etaText, milesText, type RouteData, type LatLng } from '@/lib/route';
import { C, shadowSm } from '@/lib/theme';
import { useSettings } from '@/lib/settings';

const BLUE = '#1e9df1'; // route accent — mirrors the C.route token (map chrome is theme-agnostic)
const DIM = 'rgba(120,120,120,0.4)';
const DEAD = 'rgba(115,115,115,0.75)';

export type MapRoutes = { fastest: RouteData; alt?: RouteData; deadhead?: RouteData };

const mid = (c: LatLng[]): LatLng | null => (c.length ? c[Math.floor(c.length / 2)] : null);

type Props = {
  routes: MapRoutes | null;
  selected: number;
  onSelect: (i: number) => void;
  active: boolean;
  myLocation?: LatLng | null;
};

export function TripMap({ routes, selected, onSelect, active, myLocation }: Props) {
  const mapRef = useRef<MapView>(null);
  const { scheme } = useSettings();
  const [drawn, setDrawn] = useState<LatLng[]>([]);

  // recenter on the real device location when it's captured
  useEffect(() => {
    if (myLocation) mapRef.current?.animateCamera({ center: myLocation, zoom: 13 }, { duration: 600 });
  }, [myLocation]);

  const sel = selected === 1 && routes?.alt ? routes.alt : routes?.fastest;
  const altDur = routes?.alt ? Math.max(routes.alt.duration, routes.fastest.duration * 1.1) : 0;
  const altDist = routes?.alt ? Math.max(routes.alt.distance, routes.fastest.distance * 1.05) : 0;

  // fit to the whole run when routes arrive
  useEffect(() => {
    if (!routes) return;
    const fit = [...(routes.deadhead?.coords ?? [DRIVER_LOCATION]), ...routes.fastest.coords];
    mapRef.current?.fitToCoordinates(fit, {
      edgePadding: { top: 130, bottom: 320, left: 60, right: 60 },
      animated: true,
    });
  }, [routes]);

  // animated reveal of the selected route
  useEffect(() => {
    if (!sel?.coords?.length) return;
    const full = sel.coords;
    const STEPS = 28;
    let i = 0;
    setDrawn([]);
    const t = setInterval(() => {
      i += 1;
      const n = Math.ceil((full.length * i) / STEPS);
      setDrawn(full.slice(0, n));
      if (i >= STEPS) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, [sel]);

  const deadMid = routes?.deadhead ? mid(routes.deadhead.coords) : null;
  const fastMid = routes?.fastest ? mid(routes.fastest.coords) : null;
  const altMid = routes?.alt ? mid(routes.alt.coords) : null;

  return (
    <MapView
      key={scheme}
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      userInterfaceStyle={scheme}
      style={StyleSheet.absoluteFill}
      showsCompass={false}
      initialRegion={{ latitude: 42.6, longitude: -87.9, latitudeDelta: 1.4, longitudeDelta: 1.4 }}
    >
      {active && routes?.deadhead ? (
        <Polyline coordinates={routes.deadhead.coords} strokeColor={DEAD} strokeWidth={4} lineDashPattern={[6, 7]} />
      ) : null}

      {active && routes?.alt ? (
        <Polyline
          coordinates={routes.alt.coords}
          strokeColor={selected === 1 ? BLUE : DIM}
          strokeWidth={selected === 1 ? 6 : 5}
          tappable
          onPress={() => onSelect(1)}
        />
      ) : null}

      {active && routes?.fastest ? (
        <Polyline
          coordinates={selected === 0 ? drawn : routes.fastest.coords}
          strokeColor={selected === 0 ? BLUE : DIM}
          strokeWidth={selected === 0 ? 6 : 5}
          tappable
          onPress={() => onSelect(0)}
        />
      ) : null}

      {active && deadMid ? (
        <Marker coordinate={deadMid} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <MidBadge kind="deadhead" title="Deadhead" sub={milesText(routes!.deadhead!.distance)} on={false} />
        </Marker>
      ) : null}
      {active && altMid && routes?.alt ? (
        <Marker coordinate={altMid} anchor={{ x: 0.5, y: 0.5 }} onPress={() => onSelect(1)} zIndex={selected === 1 ? 3 : 1} tracksViewChanges>
          <MidBadge kind="alt" title="Alt" sub={`${etaText(altDur)} · ${milesText(altDist)}`} on={selected === 1} />
        </Marker>
      ) : null}
      {active && fastMid && routes?.fastest ? (
        <Marker coordinate={fastMid} anchor={{ x: 0.5, y: 0.5 }} onPress={() => onSelect(0)} zIndex={selected === 0 ? 3 : 2} tracksViewChanges>
          <MidBadge kind="fastest" title="Fastest" sub={`${etaText(routes.fastest.duration)} · ${milesText(routes.fastest.distance)}`} on={selected === 0} />
        </Marker>
      ) : null}

      {NAV_STOPS.map((s, i) => (
        <Marker key={i} coordinate={s.coordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View className="size-7 items-center justify-center rounded-full border-2 border-white" style={{ backgroundColor: i === 0 ? C.teal : C.foreground, ...shadowSm }}>
            <Text className="font-sans-bold text-xs text-white">{i + 1}</Text>
          </View>
        </Marker>
      ))}

      <Marker coordinate={DRIVER_LOCATION} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
        <View className="size-9 items-center justify-center rounded-full border-2 border-white shadow" style={{ backgroundColor: BLUE }}>
          <Navigation2 size={18} color="#fff" fill="#fff" />
        </View>
      </Marker>

      {myLocation ? (
        <Marker coordinate={myLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View className="size-5 rounded-full border-2 border-white" style={{ backgroundColor: '#2563eb', ...shadowSm }} />
        </Marker>
      ) : null}
    </MapView>
  );
}

function MidBadge({ kind, title, sub, on }: { kind: 'fastest' | 'alt' | 'deadhead'; title: string; sub: string; on: boolean }) {
  if (kind === 'deadhead') {
    return (
      <View className="flex-row items-center gap-1 rounded-full border px-2.5 py-1" style={{ backgroundColor: C.background, borderColor: C.border, borderStyle: 'dashed', ...shadowSm }}>
        <Text className="font-sans-medium text-[11px]" style={{ color: C.mutedForeground }}>
          {title} · {sub}
        </Text>
      </View>
    );
  }
  return (
    <View className="items-center rounded-2xl px-2.5 py-1" style={{ backgroundColor: on ? BLUE : C.background, borderWidth: 1, borderColor: on ? BLUE : C.border, ...shadowSm }}>
      <Text className="font-sans-medium text-[10px]" style={{ color: on ? 'rgba(255,255,255,0.8)' : C.mutedForeground }}>
        {title}
      </Text>
      <Text className="font-sans-semibold text-xs" style={{ color: on ? '#fff' : C.foreground }}>
        {sub}
      </Text>
    </View>
  );
}
