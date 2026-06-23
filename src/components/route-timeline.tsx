import { Text, View } from 'react-native';
import { Check, MapPin } from 'lucide-react-native';

import type { DetailStop } from '@/lib/mock';
import { C } from '@/lib/theme';

type Progress = 'done' | 'current' | 'upcoming';

// Vertical route history. State per stop is derived from the driver's phone GPS
// (geofence arrival → actual timestamp); falls back to the load variant when a
// stop has no recorded progress (delivered = all done, otherwise upcoming).
export function RouteTimeline({ stops, delivered }: { stops: DetailStop[]; delivered?: boolean }) {
  const stateOf = (s: DetailStop): Progress => s.progress ?? (delivered ? 'done' : 'upcoming');

  return (
    <View>
      {stops.map((s, i) => {
        const state = stateOf(s);
        const isLast = i === stops.length - 1;
        const accent = C.foreground;
        // connector below this dot is "travelled" only when this stop is done
        const lineColor = state === 'done' ? C.foreground : C.border;

        return (
          <View key={i} className="flex-row gap-3">
            {/* timeline rail */}
            <View className="items-center" style={{ width: 26 }}>
              <Dot state={state} accent={accent} />
              {!isLast ? <View style={{ flex: 1, width: 2, minHeight: 26, backgroundColor: lineColor, opacity: 0.6 }} /> : null}
            </View>

            {/* content */}
            <View className={`flex-1 ${isLast ? '' : 'pb-5'}`}>
              {/* leg leading into this stop */}
              {s.leg ? (
                <Text className="mb-1.5 font-sans text-xs text-muted-foreground">{s.leg}</Text>
              ) : null}

              <View className="flex-row items-center gap-2">
                <Text className="font-sans-medium text-xs" style={{ color: accent }}>
                  {s.type}
                </Text>
                {state === 'current' ? (
                  <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${C.primary}1A` }}>
                    <Text className="font-sans-medium text-[10px] text-foreground">In progress</Text>
                  </View>
                ) : null}
              </View>

              <Text className="font-sans-medium text-base leading-6 text-foreground">{s.address}</Text>

              {/* status line — actual arrival (GPS) vs scheduled window */}
              {state === 'done' ? (
                <View className="mt-0.5 flex-row items-center gap-1.5">
                  <Check size={13} color={C.foreground} />
                  <Text className="font-sans-medium text-sm" style={{ color: C.foreground }}>
                    Arrived {s.arrival ?? s.doneAt ?? s.time}
                  </Text>
                </View>
              ) : state === 'current' ? (
                <Text className="mt-0.5 font-sans-medium text-sm text-foreground">En route · ETA {s.time}</Text>
              ) : (
                <Text className="mt-0.5 font-sans text-sm text-muted-foreground">
                  {s.date} · {s.time}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Dot({ state, accent }: { state: Progress; accent: string }) {
  if (state === 'done') {
    return (
      <View className="size-6 items-center justify-center rounded-full" style={{ backgroundColor: C.foreground }}>
        <Check size={14} color={C.background} strokeWidth={3} />
      </View>
    );
  }
  if (state === 'current') {
    return (
      <View className="size-6 items-center justify-center rounded-full" style={{ borderWidth: 2, borderColor: C.primary, backgroundColor: C.background }}>
        <View className="size-2.5 rounded-full" style={{ backgroundColor: C.primary }} />
      </View>
    );
  }
  // upcoming
  return (
    <View className="size-6 items-center justify-center rounded-full" style={{ borderWidth: 2, borderColor: C.border, backgroundColor: C.background }}>
      <MapPin size={12} color={C.mutedForeground} />
    </View>
  );
}
