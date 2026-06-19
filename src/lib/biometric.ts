// Native biometric unlock via expo-local-authentication. Guarded requires so a
// missing/old native module never crashes the app.

export async function biometricAvailable(): Promise<{ available: boolean; label: string }> {
  try {
    const LA = require('expo-local-authentication');
    const [has, enrolled, types] = await Promise.all([
      LA.hasHardwareAsync(),
      LA.isEnrolledAsync(),
      LA.supportedAuthenticationTypesAsync(),
    ]);
    const faceId = Array.isArray(types) && types.includes(LA.AuthenticationType.FACIAL_RECOGNITION);
    return { available: !!has && !!enrolled, label: faceId ? 'Face ID' : 'Touch ID' };
  } catch {
    return { available: false, label: 'Biometrics' };
  }
}

export async function biometricAuth(reason: string): Promise<boolean> {
  try {
    const LA = require('expo-local-authentication');
    const r = await LA.authenticateAsync({ promptMessage: reason, disableDeviceFallback: false });
    return !!r?.success;
  } catch {
    return false;
  }
}
