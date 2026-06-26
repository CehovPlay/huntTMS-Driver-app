// Web / Telegram: request the browser permissions the driver tools
// need. Must be called from a user gesture (the modal's "Allow" button) — the
// browser only shows prompts in response to a tap. All best-effort: denied or
// unsupported just no-ops.

export type PermKind = 'camera' | 'location' | 'notifications';

async function getMedia(constraints: MediaStreamConstraints) {
  const md = (navigator as any)?.mediaDevices;
  if (!md?.getUserMedia) return;
  const stream: MediaStream = await md.getUserMedia(constraints);
  stream.getTracks().forEach((t) => t.stop()); // release immediately — we only wanted the grant
}

export async function requestAllPermissions(): Promise<void> {
  try {
    await getMedia({ video: true });
  } catch {}

  // Notifications
  try {
    const N = (window as any)?.Notification;
    if (N && N.permission === 'default') await N.requestPermission();
  } catch {}

  // Location
  try {
    (navigator as any)?.geolocation?.getCurrentPosition(
      () => {},
      () => {},
      { timeout: 8000 },
    );
  } catch {}
}
