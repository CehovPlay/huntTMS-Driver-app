import * as Location from 'expo-location';

import { type LatLng } from '@/lib/route';

// One-shot device location. Works on native (expo-location) and on web/Telegram
// (expo-location delegates to the browser Geolocation API over HTTPS). Returns
// null if permission is denied or location is unavailable.
export async function locateOnce(): Promise<LatLng | null> {
  return (await locateWithStatus()).location;
}

export type GpsPermission = 'granted' | 'denied' | 'unavailable';
export type LocateResult = { permission: GpsPermission; location: LatLng | null };

// One-shot device location WITH the permission outcome, so the UI can show a badge when GPS is off:
// 'denied' = the user/webview refused permission; 'unavailable' = granted but no fix (or the geolocation
// API threw, e.g. an insecure context). Works on native and on web/Telegram (over HTTPS).
export async function locateWithStatus(): Promise<LocateResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { permission: 'denied', location: null };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { permission: 'granted', location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } };
  } catch {
    return { permission: 'unavailable', location: null };
  }
}
