import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowUp, CornerUpLeft, CornerUpRight, Flag, MapPin, Navigation2, Package, Pause, Play, Sparkles, Volume2, VolumeX, X } from 'lucide-react-native';

import { Speech } from '@/lib/speech';
import { useCopilot } from '@/lib/use-assistant';
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
import { QuickActions } from '@/components/quick-actions';
import { C, tnum } from '@/lib/theme';

export default function Navigate() {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [idx, setIdx] = useState(0); // driver position index along route coords
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const { openCopilot } = useCopilot();
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
    Speech.speak(phrase);
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
        style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 12) + 12 }]}
        className="justify-between"
      >
        {/* top row */}
        <View pointerEvents="box-none" className="flex-row items-start justify-between gap-2 px-3">
          {/* maneuver banner — enlarged for at-a-glance reading while driving */}
          <View className="flex-row items-center gap-3 rounded-2xl px-3.5 py-3" style={{ backgroundColor: C.primary, maxWidth: '60%' }}>
            <ManIcon size={26} color={C.primaryForeground} />
            <View className="shrink">
              <Text className="font-sans-bold text-xl text-primary-foreground" style={tnum}>
                {rerouting ? 'Rerouting…' : upcoming?.type === 'arrive' ? 'Arriving' : milesText(distToNext)}
              </Text>
              {!rerouting ? (
                <Text className="font-sans text-xs" style={{ color: `${C.primaryForeground}CC` }} numberOfLines={2}>
                  {upcoming?.instruction ?? 'Starting route…'}
                </Text>
              ) : null}
            </View>
          </View>

          {/* controls — compact icon-only cluster (one rounded bar) */}
          <View className="flex-row items-center gap-1 rounded-full bg-background p-1" style={SHADOW}>
            <Pressable
              onPress={togglePause}
              accessibilityRole="button"
              accessibilityLabel={paused ? 'Resume navigation' : 'Pause navigation'}
              className="size-10 items-center justify-center rounded-full active:opacity-70"
            >
              {paused ? <Play size={18} color={C.foreground} fill={C.foreground} /> : <Pause size={18} color={C.foreground} fill={C.foreground} />}
            </Pressable>
            <Pressable
              onPress={() => {
                if (!muted) Speech.stop();
                setMuted((m) => !m);
              }}
              accessibilityRole="button"
              accessibilityLabel={muted ? 'Unmute voice guidance' : 'Mute voice guidance'}
              className="size-10 items-center justify-center rounded-full active:opacity-70"
            >
              {muted ? <VolumeX size={18} color={C.mutedForeground} /> : <Volume2 size={18} color={C.foreground} />}
            </Pressable>
            <Pressable
              onPress={openCopilot}
              accessibilityRole="button"
              accessibilityLabel="Open HuntBot"
              className="size-10 items-center justify-center rounded-full"
              style={{ backgroundColor: C.teal }}
            >
              <Sparkles size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* quick actions — breakdown / add expense (active trip) */}
        <View pointerEvents="box-none" className="items-end px-3">
          <QuickActions variant="floating" />
        </View>

        {/* bottom sheet — slim: ETA-led stats + thin progress + end */}
        <View className="mx-3 gap-3.5 rounded-3xl bg-background p-4" style={SHADOW}>
          {/* stats — time left leads, distance + arrival beneath, exit at right */}
          <View className="flex-row items-center justify-between gap-3">
            <View className="shrink">
              <Text className="font-sans-bold text-3xl leading-9 text-foreground" style={tnum} numberOfLines={1}>
                {etaText(remEta)}
              </Text>
              <Text className="mt-0.5 font-sans text-sm text-muted-foreground" style={tnum} numberOfLines={1}>
                {milesText(remaining)} · arrive {arrival}
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="End navigation"
              className="size-10 items-center justify-center rounded-full active:opacity-70"
              style={{ backgroundColor: C.accent }}
            >
              <X size={18} color={C.destructive} />
            </Pressable>
          </View>

          {/* thin progress track with small endpoints */}
          <View className="flex-row items-center gap-2.5">
            <Package size={15} color={C.foreground} />
            <View className="flex-1 overflow-hidden rounded-full" style={{ height: 6, backgroundColor: C.border }}>
              <View className="rounded-full" style={{ height: 6, width: `${Math.max(4, progress * 100)}%`, backgroundColor: C.route }} />
            </View>
            <MapPin size={15} color={C.destructive} />
          </View>
        </View>
      </View>
    </View>
  );
}

const SHADOW = { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 };
