import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

type Coord = { latitude: number; longitude: number };

function urls({ latitude, longitude }: Coord) {
  return {
    apple: `maps://?daddr=${latitude},${longitude}&dirflg=d`,
    google: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`,
    waze: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
  };
}

// Open turn-by-turn directions in the driver's preferred external app.
// iOS: native action sheet (Apple Maps / Google Maps / Waze). Other native: Alert.
export function openDirections(coord: Coord, label?: string) {
  const u = urls(coord);
  const open = (url: string) => Linking.openURL(url).catch(() => {});

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: label ? `Directions to ${label}` : 'Get directions',
        options: ['Apple Maps', 'Google Maps', 'Waze', 'Cancel'],
        cancelButtonIndex: 3,
      },
      (i) => {
        if (i === 0) open(u.apple);
        else if (i === 1) open(u.google);
        else if (i === 2) open(u.waze);
      },
    );
    return;
  }

  Alert.alert(label ? `Directions to ${label}` : 'Get directions', undefined, [
    { text: 'Apple Maps', onPress: () => open(u.apple) },
    { text: 'Google Maps', onPress: () => open(u.google) },
    { text: 'Waze', onPress: () => open(u.waze) },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
