import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowUp, CornerUpLeft, CornerUpRight, Flag, MapPin, Navigation2, Package, Play, Volume2, VolumeX, X } from 'lucide-react-native';

import { Speech } from '@/lib/speech';
import { NavMap } from '@/components/nav-map';
import { DRIVER_LOCATION, NAV_STOPS } from '@/lib/mock';
import { fetchRoutes, etaText, milesText, type Maneuver, type RouteData, type LatLng } from '@/lib/route';

function maneuverIcon(m?: Maneuver) {
  if (!m) return Navigation2;
  if (m.type === 'arrive') return Flag;
  if (m.modifier.includes('left')) return CornerUpLeft;
  if (m.modifier.includes('right')) return CornerUpRight;
  return ArrowUp;
}
import { Pressable } from '@/components/pressable';
import { C } from '@/lib/theme';

export default function Navigate() {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [idx, setIdx] = useState(0); // driver position index along route coords
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rerouting, setRerouting] = useState(false);
  const spoken = useRef<number>(-1);
  const started = useRef(false);
  const insets = useSafeAreaInsets();

  // recalculate from a new origin (real off-route deviation, or tap-to-simulate)
  const recalc = async (from: LatLng) => {
    setRerouting(true);
    Speech.stop();
    const r = await fetchRoutes([from, ...NAV_STOPS.map((s) => s.coordinate)]);
    if (r) {
      setRoute(r.primary);
      setIdx(0);
      spoken.current = -1;
    }
    setRerouting(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pts = [DRIVER_LOCATION, ...NAV_STOPS.map((s) => s.coordinate)];
      const r = await fetchRoutes(pts);
      if (!cancelled && r) {
        setRoute(r.primary);
        // voice: announce route on start
        if (!started.current) {
          started.current = true;
          const last = NAV_STOPS[NAV_STOPS.length - 1];
          Speech.speak(
            `Starting route to ${last.city}. ${milesText(r.primary.distance)}, about ${etaText(r.primary.duration)}.`,
            { rate: 1.0 },
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const coords = route?.coords ?? [];

  // drive along the route — advance the puck index (camera follow lives in <NavMap>)
  useEffect(() => {
    if (!coords.length || paused || idx >= coords.length - 1) return;
    const t = setTimeout(() => setIdx((i) => Math.min(i + 2, coords.length - 1)), 700);
    return () => clearTimeout(t);
  }, [idx, coords.length, paused]);

  const progress = coords.length ? idx / (coords.length - 1) : 0;
  const traveled = route ? route.distance * progress : 0;
  const remaining = route ? route.distance - traveled : 0;
  const remEta = route ? route.duration * (1 - progress) : 0;
  const arrival = new Date(Date.now() + remEta * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  // real turn-by-turn: the next maneuver ahead of where we are + distance to it
  const upcoming = route?.steps.find((s) => s.offset > traveled + 8) ?? route?.steps[(route?.steps.length ?? 1) - 1];
  const distToNext = upcoming ? Math.max(0, upcoming.offset - traveled) : 0;
  const ManIcon = maneuverIcon(upcoming);
  const here = coords[Math.min(idx, Math.max(coords.length - 1, 0))] ?? DRIVER_LOCATION;
  const headingTo = coords[Math.min(idx + 3, Math.max(coords.length - 1, 0))] ?? here;

  // voice guidance: announce each maneuver once as it becomes the target
  useEffect(() => {
    if (muted || paused || rerouting || !upcoming) return;
    if (spoken.current === upcoming.offset) return;
    spoken.current = upcoming.offset;
    const phrase = upcoming.type === 'arrive' ? upcoming.instruction : `In ${milesText(distToNext)}, ${upcoming.instruction}`;
    Speech.stop();
    Speech.speak(phrase, { rate: 1.0, pitch: 1.0 });
  }, [upcoming?.offset, muted, paused, rerouting]);

  const togglePause = () => {
    setPaused((p) => {
      if (!p) Speech.stop();
      return !p;
    });
  };

  return (
    <View className="flex-1 bg-background">
      <NavMap coords={coords} here={here} headingTo={headingTo} onPress={recalc} />

      {/* overlay: compact maneuver chip + controls (top), progress sheet (bottom) */}
      <View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}
        className="justify-between"
      >
        {/* top row */}
        <View pointerEvents="box-none" className="flex-row items-start justify-between gap-2 px-3">
          {/* compact maneuver chip */}
          <View className="flex-row items-center gap-2.5 rounded-2xl px-3 py-2.5" style={{ backgroundColor: C.primary, maxWidth: '58%' }}>
            <ManIcon size={22} color="#fff" />
            <View className="shrink">
              <Text className="font-sans-semibold text-base text-primary-foreground">
                {rerouting ? 'Rerouting…' : upcoming?.type === 'arrive' ? 'Arriving' : milesText(distToNext)}
              </Text>
              {!rerouting ? (
                <Text className="font-sans text-xs" style={{ color: 'rgba(255,255,255,0.7)' }} numberOfLines={1}>
                  {upcoming?.instruction ?? 'Starting route…'}
                </Text>
              ) : null}
            </View>
          </View>

          {/* controls */}
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => {
                if (!muted) Speech.stop();
                setMuted((m) => !m);
              }}
              accessibilityRole="button"
              accessibilityLabel={muted ? 'Unmute voice guidance' : 'Mute voice guidance'}
              className="size-12 items-center justify-center rounded-full"
              style={{ backgroundColor: C.background, ...SHADOW }}
            >
              {muted ? <VolumeX size={20} color={C.foreground} /> : <Volume2 size={20} color={C.foreground} />}
            </Pressable>
            <Pressable
              onPress={togglePause}
              accessibilityRole="button"
              accessibilityLabel={paused ? 'Resume navigation' : 'Pause navigation'}
              className="h-12 flex-row items-center gap-1.5 rounded-full px-5 active:opacity-80"
              style={{ backgroundColor: C.background, ...SHADOW }}
            >
              {paused ? <Play size={16} color={C.foreground} fill={C.foreground} /> : null}
              <Text className="font-sans-medium text-base text-foreground">{paused ? 'Resume' : 'Pause'}</Text>
            </Pressable>
          </View>
        </View>

        {/* bottom sheet — one block: stats + progress track + end */}
        <View className="mx-3 gap-5 rounded-3xl bg-background p-5" style={SHADOW}>
          {/* 3 stats */}
          <View className="flex-row">
            <Stat value={milesText(remaining)} label="distance" />
            <Stat value={etaText(remEta)} label="time left" />
            <Stat value={arrival} label="arrival" />
          </View>

          {/* progress track: origin → filled progress → destination */}
          <View className="flex-row items-center gap-3" style={{ height: 48 }}>
            <View className="items-center justify-center rounded-full" style={{ width: 48, height: 48, backgroundColor: C.foreground }}>
              <Package size={22} color="#fff" />
            </View>
            <View className="flex-1 overflow-hidden rounded-full" style={{ height: 10, backgroundColor: C.border }}>
              <View
                className="rounded-full"
                style={{ height: 10, width: `${Math.max(6, progress * 100)}%`, backgroundColor: '#1e9df1' }}
              />
            </View>
            <View className="items-center justify-center rounded-full" style={{ width: 48, height: 48, backgroundColor: C.destructive }}>
              <MapPin size={22} color="#fff" />
            </View>
          </View>

          {/* end */}
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="End navigation"
            className="h-16 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-80"
            style={{ backgroundColor: C.accent }}
          >
            <X size={18} color={C.destructive} />
            <Text className="font-sans-medium text-base" style={{ color: C.destructive }}>
              End navigation
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const SHADOW = { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 };

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1">
      <Text className="font-sans-semibold text-xl text-foreground">{value}</Text>
      <Text className="font-sans text-sm text-muted-foreground">{label}</Text>
    </View>
  );
}
