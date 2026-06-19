import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import { NAV_STOPS } from '@/lib/mock';
import { type LatLng } from '@/lib/route';
import { C } from '@/lib/theme';

const ll = (c: LatLng): [number, number] => [c.latitude, c.longitude];

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

const puckIcon = L.divIcon({
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  html: `<div style="width:40px;height:40px;border-radius:20px;border:3px solid #fff;background:#1e9df1;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35)"><div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:14px solid #fff"></div></div>`,
});

type Props = {
  coords: LatLng[];
  here: LatLng;
  headingTo?: LatLng;
  onPress?: (c: LatLng) => void;
};

export function NavMap({ coords, here, onPress }: Props) {
  return (
    <MapContainer
      center={ll(here)}
      zoom={16}
      zoomControl={false}
      attributionControl={false}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Follow here={here} />
      <Clicker onPress={onPress} />
      {coords.length ? <Polyline positions={coords.map(ll)} pathOptions={{ color: '#1e9df1', weight: 8 }} /> : null}
      {NAV_STOPS.map((s, i) => (
        <Marker key={i} position={ll(s.coordinate)} icon={stopIcon(i)} />
      ))}
      <Marker position={ll(here)} icon={puckIcon} />
    </MapContainer>
  );
}
