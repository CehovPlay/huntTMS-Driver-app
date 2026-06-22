import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Navigation2 } from 'lucide-react-native';

import { DRIVER_LOCATION, NAV_STOPS } from '@/lib/mock';
import { type LatLng } from '@/lib/route';
import { C } from '@/lib/theme';
import { useSettings } from '@/lib/settings';

function bearing(a: LatLng, b: LatLng) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const y = Math.sin(toRad(b.longitude - a.longitude)) * Math.cos(toRad(b.latitude));
  const x =
    Math.cos(toRad(a.latitude)) * Math.sin(toRad(b.latitude)) -
    Math.sin(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.cos(toRad(b.longitude - a.longitude));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

type Props = {
  coords: LatLng[];
  here: LatLng;
  headingTo: LatLng;
  onPress?: (c: LatLng) => void;
};

export function NavMap({ coords, here, headingTo, onPress }: Props) {
  const mapRef = useRef<MapView>(null);
  const { scheme } = useSettings();

  // North-up follow-cam — the truck marker itself rotates to the travel heading.
  useEffect(() => {
    mapRef.current?.animateCamera(
      { center: here, pitch: 60, altitude: 320, zoom: 18, heading: 0 },
      { duration: 380 },
    );
  }, [here]);

  return (
    <MapView
      key={scheme}
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      userInterfaceStyle={scheme}
      style={StyleSheet.absoluteFill}
      showsCompass={false}
      showsBuildings
      pitchEnabled
      onPress={(e) => onPress?.(e.nativeEvent.coordinate)}
      initialRegion={{ latitude: DRIVER_LOCATION.latitude, longitude: DRIVER_LOCATION.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
    >
      {coords.length ? <Polyline coordinates={coords} strokeColor={C.route} strokeWidth={8} /> : null}
      {NAV_STOPS.map((s, i) => (
        <Marker key={i} coordinate={s.coordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View className="size-7 items-center justify-center rounded-full border-2 border-white" style={{ backgroundColor: i === 0 ? C.teal : C.foreground }}>
            <Text className="font-sans-bold text-xs text-white">{i + 1}</Text>
          </View>
        </Marker>
      ))}
      {/* puck — original arrow, rotates to the direction of travel */}
      <Marker coordinate={here} anchor={{ x: 0.5, y: 0.5 }} flat rotation={bearing(here, headingTo)} tracksViewChanges={false}>
        <View className="size-10 items-center justify-center rounded-full border-[3px] border-white" style={{ backgroundColor: C.route, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4 }}>
          <Navigation2 size={20} color="#fff" fill="#fff" />
        </View>
      </Marker>
    </MapView>
  );
}
