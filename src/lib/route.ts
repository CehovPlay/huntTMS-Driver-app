// Routing via OSRM (free, no key): multi-waypoint + alternatives + steps.

export type LatLng = { latitude: number; longitude: number };

export type Maneuver = {
  instruction: string;
  distance: number; // length of this step (meters)
  offset: number; // cumulative distance from route start to this maneuver (meters)
  type: string; // osrm maneuver type (turn/merge/arrive…)
  modifier: string; // left/right/straight…
};

export type RouteData = {
  coords: LatLng[];
  distance: number; // meters
  duration: number; // seconds
  steps: Maneuver[];
};

export type Routes = { primary: RouteData; alt?: RouteData };

export const milesText = (m: number) => `${(m / 1609.34).toFixed(m < 16093 ? 1 : 0)} mi`;
export const etaText = (s: number) => {
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
};

function maneuverText(step: any): string {
  const t = step?.maneuver?.type ?? 'continue';
  const mod = step?.maneuver?.modifier ?? '';
  const name = step?.name || 'the route';
  if (t === 'depart') return `Head ${mod || 'out'} on ${name}`;
  if (t === 'arrive') return `Arrive at ${name || 'destination'}`;
  if (t === 'turn') return `Turn ${mod} onto ${name}`;
  if (t === 'roundabout' || t === 'rotary') return `Take the roundabout onto ${name}`;
  if (t === 'merge') return `Merge onto ${name}`;
  if (t === 'on ramp') return `Take the ramp onto ${name}`;
  if (t === 'fork') return `Keep ${mod} at the fork`;
  return `Continue on ${name}`;
}

function buildSteps(r: any): Maneuver[] {
  const raw = (r.legs ?? []).flatMap((l: any) => l.steps ?? []);
  let acc = 0;
  return raw.map((s: any) => {
    const offset = acc;
    acc += s.distance ?? 0;
    return {
      instruction: maneuverText(s),
      distance: s.distance ?? 0,
      offset,
      type: s?.maneuver?.type ?? 'continue',
      modifier: s?.maneuver?.modifier ?? '',
    };
  });
}

const toRoute = (r: any): RouteData => ({
  coords: (r.geometry?.coordinates ?? []).map((c: [number, number]) => ({
    latitude: c[1],
    longitude: c[0],
  })),
  distance: r.distance ?? 0,
  duration: r.duration ?? 0,
  steps: buildSteps(r),
});

export async function fetchRoutes(points: LatLng[]): Promise<Routes | null> {
  try {
    const coordStr = points.map((p) => `${p.longitude},${p.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&alternatives=true&steps=true`;
    const res = await fetch(url);
    const json = await res.json();
    const routes = json?.routes ?? [];
    if (!routes.length) return null;
    return {
      primary: toRoute(routes[0]),
      alt: routes[1] ? toRoute(routes[1]) : undefined,
    };
  } catch {
    return null;
  }
}
