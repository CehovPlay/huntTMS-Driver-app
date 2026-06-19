// Web/Telegram: no device biometrics — report unavailable so the lock UI stays
// hidden, and never block access.
export async function biometricAvailable(): Promise<{ available: boolean; label: string }> {
  return { available: false, label: 'Biometrics' };
}
export async function biometricAuth(_reason: string): Promise<boolean> {
  return true;
}
