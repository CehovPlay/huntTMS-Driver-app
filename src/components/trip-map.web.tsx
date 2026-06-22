import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';

import { DRIVER_LOCATION, NAV_STOPS } from '@/lib/mock';
import { etaText, milesText, type RouteData, type LatLng } from '@/lib/route';
import { C } from '@/lib/theme';
import { useSettings } from '@/lib/settings';
import { tileUrl, TILE_SUBDOMAINS } from '@/lib/map-tiles';

const BLUE = '#1e9df1'; // route accent — mirrors the C.route token (map chrome is theme-agnostic)
const DIM = 'rgba(120,120,120,0.45)';
const DEAD = 'rgba(115,115,115,0.8)';

export type MapRoutes = { fastest: RouteData; alt?: RouteData; deadhead?: RouteData };

const ll = (c: LatLng): [number, number] => [c.latitude, c.longitude];
const mid = (c: LatLng[]): LatLng | null => (c.length ? c[Math.floor(c.length / 2)] : null);

function FitBounds({ routes }: { routes: MapRoutes | null }) {
  const map = useMap();
  useEffect(() => {
    if (!routes) return;
    const pts = [...(routes.deadhead?.coords ?? [DRIVER_LOCATION]), ...routes.fastest.coords].map(ll);
    if (pts.length) map.fitBounds(pts as [number, number][], { padding: [50, 60] });
  }, [routes, map]);
  return null;
}

function RecenterMe({ at }: { at?: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (at) map.setView(ll(at), 13, { animate: true });
  }, [at, map]);
  return null;
}

const myDotIcon = L.divIcon({
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  html: `<div style="width:20px;height:20px;border-radius:10px;border:2px solid #fff;background:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.25)"></div>`,
});

const stopIcon = (i: number) =>
  L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:14px;border:2px solid #fff;background:${i === 0 ? C.teal : C.foreground};color:#fff;font:700 12px -apple-system,sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.3)">${i + 1}</div>`,
  });

const driverIcon = L.divIcon({
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  html: `<div style="width:36px;height:36px;border-radius:18px;border:2px solid #fff;background:${BLUE};display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.3)"><div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:13px solid #fff"></div></div>`,
});

const badgeIcon = (title: string, sub: string, on: boolean, dead = false) =>
  L.divIcon({
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: dead
      ? `<div style="transform:translate(-50%,-50%);display:inline-block;white-space:nowrap;background:#fff;border:1px dashed ${C.border};border-radius:999px;padding:3px 10px;font:500 11px -apple-system,sans-serif;color:${C.mutedForeground};box-shadow:0 1px 5px rgba(0,0,0,.15)">${title} · ${sub}</div>`
      : `<div style="transform:translate(-50%,-50%);display:inline-block;text-align:center;white-space:nowrap;background:${on ? BLUE : '#fff'};border:1px solid ${on ? BLUE : C.border};border-radius:14px;padding:3px 10px;box-shadow:0 1px 5px rgba(0,0,0,.15)"><div style="font:500 10px -apple-system,sans-serif;color:${on ? 'rgba(255,255,255,.85)' : C.mutedForeground}">${title}</div><div style="font:600 12px -apple-system,sans-serif;color:${on ? '#fff' : C.foreground}">${sub}</div></div>`,
  });

type Props = {
  routes: MapRoutes | null;
  selected: number;
  onSelect: (i: number) => void;
  active: boolean;
  myLocation?: LatLng | null;
};

export function TripMap({ routes, selected, onSelect, active, myLocation }: Props) {
  const { scheme } = useSettings();
  const altDur = routes?.alt ? Math.max(routes.alt.duration, routes.fastest.duration * 1.1) : 0;
  const altDist = routes?.alt ? Math.max(routes.alt.distance, routes.fastest.distance * 1.05) : 0;
  const deadMid = routes?.deadhead ? mid(routes.deadhead.coords) : null;
  const fastMid = routes?.fastest ? mid(routes.fastest.coords) : null;
  const altMid = routes?.alt ? mid(routes.alt.coords) : null;

  return (
    <MapContainer
      center={[42.6, -87.9]}
      zoom={7}
      zoomControl={false}
      attributionControl={false}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
    >
      <TileLayer key={scheme} url={tileUrl(scheme)} subdomains={TILE_SUBDOMAINS} />
      <FitBounds routes={routes} />
      <RecenterMe at={myLocation} />
      {myLocation ? <Marker position={ll(myLocation)} icon={myDotIcon} /> : null}

      {active && routes?.deadhead ? (
        <Polyline positions={routes.deadhead.coords.map(ll)} pathOptions={{ color: DEAD, weight: 4, dashArray: '6 7' }} />
      ) : null}
      {active && routes?.alt ? (
        <Polyline
          positions={routes.alt.coords.map(ll)}
          pathOptions={{ color: selected === 1 ? BLUE : DIM, weight: selected === 1 ? 6 : 5 }}
          eventHandlers={{ click: () => onSelect(1) }}
        />
      ) : null}
      {active && routes?.fastest ? (
        <Polyline
          positions={routes.fastest.coords.map(ll)}
          pathOptions={{ color: selected === 0 ? BLUE : DIM, weight: selected === 0 ? 6 : 5 }}
          eventHandlers={{ click: () => onSelect(0) }}
        />
      ) : null}

      {active && deadMid ? (
        <Marker position={ll(deadMid)} icon={badgeIcon('Deadhead', milesText(routes!.deadhead!.distance), false, true)} />
      ) : null}
      {active && altMid && routes?.alt ? (
        <Marker position={ll(altMid)} icon={badgeIcon('Alt', `${etaText(altDur)} · ${milesText(altDist)}`, selected === 1)} eventHandlers={{ click: () => onSelect(1) }} />
      ) : null}
      {active && fastMid && routes?.fastest ? (
        <Marker position={ll(fastMid)} icon={badgeIcon('Fastest', `${etaText(routes.fastest.duration)} · ${milesText(routes.fastest.distance)}`, selected === 0)} eventHandlers={{ click: () => onSelect(0) }} />
      ) : null}

      {NAV_STOPS.map((s, i) => (
        <Marker key={i} position={ll(s.coordinate)} icon={stopIcon(i)} />
      ))}
      <Marker position={ll(DRIVER_LOCATION)} icon={driverIcon} />
    </MapContainer>
  );
}
