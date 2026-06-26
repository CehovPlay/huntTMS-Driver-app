// Native: request the permissions the driver tools need, via the
// expo modules the app already uses. Web is handled by permissions.web.ts.
// All best-effort and guarded — a missing module or denial just no-ops.

export type PermKind = 'camera' | 'location' | 'notifications';

export async function requestAllPermissions(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Cam: any = require('expo-camera');
    await Cam?.requestCameraPermissionsAsync?.();
  } catch {}
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Location: any = require('expo-location');
    await Location?.requestForegroundPermissionsAsync?.();
  } catch {}
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImagePicker: any = require('expo-image-picker');
    await ImagePicker?.requestMediaLibraryPermissionsAsync?.();
  } catch {}
}
