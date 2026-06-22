import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';

import { type LatLng } from '@/lib/route';
import { C } from '@/lib/theme';
import { useSettings } from '@/lib/settings';
import { tileUrl, TILE_SUBDOMAINS } from '@/lib/map-tiles';

const pin = (pickup: boolean) =>
  L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<div style="width:36px;height:36px;border-radius:18px;border:2px solid #fff;background:${pickup ? C.teal : C.foreground};display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.3)"><div style="width:13px;height:13px;border:2px solid #fff;border-radius:3px"></div></div>`,
  });

export function StopMiniMap({ coordinate, pickup }: { coordinate: LatLng; pickup: boolean }) {
  const { scheme } = useSettings();
  return (
    <MapContainer
      center={[coordinate.latitude, coordinate.longitude]}
      zoom={12}
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
    >
      <TileLayer key={scheme} url={tileUrl(scheme)} subdomains={TILE_SUBDOMAINS} />
      <Marker position={[coordinate.latitude, coordinate.longitude]} icon={pin(pickup)} />
    </MapContainer>
  );
}
