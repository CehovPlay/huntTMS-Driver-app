import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';

import { PermissionsModal } from '@/components/permissions-modal';

const KEY = 'driver.permsPrompted.v1';
// Routes that are NOT "inside the platform" — don't prompt here.
const OUTSIDE = new Set(['/', '/login', '/verify', '/onboarding']);

// Shows the permissions modal once, the first time the user lands inside the app
// (after auth/onboarding). Persists a flag so it never nags again.
export function PermissionsGate() {
  const pathname = usePathname();
  const [loaded, setLoaded] = useState(false);
  const [prompted, setPrompted] = useState(true); // assume done until storage says otherwise
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setPrompted(!!v))
      .catch(() => setPrompted(false))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded || prompted || visible) return;
    if (!OUTSIDE.has(pathname)) setVisible(true); // entered the platform
  }, [loaded, prompted, visible, pathname]);

  const finish = () => {
    setVisible(false);
    setPrompted(true);
    AsyncStorage.setItem(KEY, '1').catch(() => {});
  };

  if (!visible) return null;
  return <PermissionsModal onAllow={finish} onSkip={finish} />;
}
