// Web (Leaflet) basemap tiles. CARTO Positron / Dark Matter are clean, minimal
// basemaps that match the app's aesthetic and give a proper dark map in dark
// theme (raw OSM has no dark variant). Used with subdomains "abcd".
export function tileUrl(scheme: 'light' | 'dark'): string {
  return scheme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
}

export const TILE_SUBDOMAINS = 'abcd';
