type Coord = { latitude: number; longitude: number };

// Web / Telegram: open Google Maps directions in a new tab (most universally
// available; Apple Maps / Waze deep-links don't reliably work in a browser).
export function openDirections({ latitude, longitude }: Coord, _label?: string) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
}
