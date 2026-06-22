import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import { NAV_STOPS } from '@/lib/mock';
import { type LatLng } from '@/lib/route';
import { C } from '@/lib/theme';
import { useSettings } from '@/lib/settings';
import { tileUrl, TILE_SUBDOMAINS } from '@/lib/map-tiles';

const ll = (c: LatLng): [number, number] => [c.latitude, c.longitude];

// Compass bearing a -> b, degrees clockwise from north (0 = north/up).
function bearing(a: LatLng, b: LatLng) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const y = Math.sin(toRad(b.longitude - a.longitude)) * Math.cos(toRad(b.latitude));
  const x =
    Math.cos(toRad(a.latitude)) * Math.sin(toRad(b.latitude)) -
    Math.sin(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.cos(toRad(b.longitude - a.longitude));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Top-down truck glyph (points up at 0°) inside the blue puck, rotated to heading.
function truckPuck(deg: number) {
  return L.divIcon({
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html:
      `<div style="width:40px;height:40px;border-radius:20px;border:3px solid #fff;background:#1e9df1;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35)">` +
      `<svg width="22" height="22" viewBox="0 0 24 24" style="transform:rotate(${deg}deg);transform-origin:50% 50%" fill="#fff">` +
      `<rect x="7" y="9" width="10" height="11" rx="2.5"></rect>` +
      `<rect x="8.5" y="3.5" width="7" height="6.5" rx="2"></rect>` +
      `</svg></div>`,
  });
}

function Follow({ here }: { here: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView(ll(here), 16, { animate: true });
  }, [here, map]);
  return null;
}

function Clicker({ onPress }: { onPress?: (c: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPress?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

const stopIcon = (i: number) =>
  L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:14px;border:2px solid #fff;background:${i === 0 ? C.teal : C.foreground};color:#fff;font:700 12px -apple-system,sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.3)">${i + 1}</div>`,
  });

type Props = {
  coords: LatLng[];
  here: LatLng;
  headingTo?: LatLng;
  onPress?: (c: LatLng) => void;
};

export function NavMap({ coords, here, headingTo, onPress }: Props) {
  const { scheme } = useSettings();
  return (
    <MapContainer
      center={ll(here)}
      zoom={16}
      zoomControl={false}
      attributionControl={false}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
    >
      <TileLayer key={scheme} url={tileUrl(scheme)} subdomains={TILE_SUBDOMAINS} />
      <Follow here={here} />
      <Clicker onPress={onPress} />
      {coords.length ? <Polyline positions={coords.map(ll)} pathOptions={{ color: C.route, weight: 8 }} /> : null}
      {NAV_STOPS.map((s, i) => (
        <Marker key={i} position={ll(s.coordinate)} icon={stopIcon(i)} />
      ))}
      <Marker position={ll(here)} icon={truckPuck(headingTo ? bearing(here, headingTo) : 0)} />
    </MapContainer>
  );
}
