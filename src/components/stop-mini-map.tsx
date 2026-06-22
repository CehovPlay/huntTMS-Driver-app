import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Package } from 'lucide-react-native';

import { type LatLng } from '@/lib/route';
import { C, shadowSm } from '@/lib/theme';
import { useSettings } from '@/lib/settings';

export function StopMiniMap({ coordinate, pickup }: { coordinate: LatLng; pickup: boolean }) {
  const { scheme } = useSettings();
  return (
    <MapView
      key={scheme}
      provider={PROVIDER_DEFAULT}
      userInterfaceStyle={scheme}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      initialRegion={{ latitude: coordinate.latitude, longitude: coordinate.longitude, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
    >
      <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }}>
        <View className="size-9 items-center justify-center rounded-full border-2 border-white" style={{ backgroundColor: pickup ? C.teal : C.foreground, ...shadowSm }}>
          <Package size={16} color="#fff" />
        </View>
      </Marker>
    </MapView>
  );
}
