import * as Location from 'expo-location';

import { type LatLng } from '@/lib/route';

// One-shot device location. Works on native (expo-location) and on web/Telegram
// (expo-location delegates to the browser Geolocation API over HTTPS). Returns
// null if permission is denied or location is unavailable.
export async function locateOnce(): Promise<LatLng | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
}
