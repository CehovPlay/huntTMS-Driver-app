// Distance units (mi/km). Components that have the settings context pass `units`
// explicitly (reactive); pure helpers without context read the module-level
// value, which the SettingsProvider keeps in sync.

export type Units = 'mi' | 'km';

const MI_TO_KM = 1.60934;

let _units: Units = 'mi';
export function setUnitsValue(u: Units) {
  _units = u;
}

// miles → display string, e.g. 486 → "486 mi" / "782 km"
export function fmtMi(mi: number, units: Units = _units): string {
  if (units === 'km') return `${Math.round(mi * MI_TO_KM).toLocaleString('en-US')} km`;
  return `${mi.toLocaleString('en-US')} mi`;
}

// meters → display string (used by the map/navigation route helpers)
export function fmtMeters(m: number, units: Units = _units): string {
  if (units === 'km') {
    const km = m / 1000;
    return `${km.toFixed(km < 10 ? 1 : 0)} km`;
  }
  const mi = m / 1609.34;
  return `${mi.toFixed(mi < 10 ? 1 : 0)} mi`;
}
