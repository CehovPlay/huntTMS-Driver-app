import '../global.css';

import { useCallback, useEffect, useState } from 'react';
import { AppState, ScrollView, Text, View, Text as RNText } from 'react-native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Lock } from 'lucide-react-native';

// Dynamic Type: respect the user's font size but cap it so fixed-height layouts
// (buttons, badges, tab bar) don't break at the largest accessibility sizes.
const _td = (RNText as unknown as { defaultProps?: Record<string, unknown> });
_td.defaultProps = _td.defaultProps || {};
_td.defaultProps.maxFontSizeMultiplier = 1.35;
_td.defaultProps.allowFontScaling = true;
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';

import { ActiveLoadProvider } from '@/lib/active-load';
import { ExpensesProvider } from '@/lib/expenses';
import { NotificationProvider } from '@/lib/notifications';
import { SettingsProvider, useSettings } from '@/lib/settings';
import { biometricAuth } from '@/lib/biometric';
import { initTelegram } from '@/lib/telegram';
import { Pressable } from '@/components/pressable';
import { Logo } from '@/components/logo';
import { C, themeVars } from '@/lib/theme';

// Biometric app-lock gate. When enabled in Settings, the app locks on launch and
// whenever it returns from the background; Face/Touch ID (or web no-op) unlocks.
function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background px-10">
      <Logo height={26} />
      <View className="size-20 items-center justify-center rounded-full bg-accent">
        <Lock size={30} color={C.foreground} />
      </View>
      <Text className="text-center font-sans-semibold text-xl text-foreground">App locked</Text>
      <Pressable
        onPress={onUnlock}
        accessibilityRole="button"
        accessibilityLabel="Unlock"
        className="h-16 w-full items-center justify-center rounded-2xl bg-primary active:opacity-90"
      >
        <Text className="font-sans-medium text-base text-primary-foreground">Unlock</Text>
      </Pressable>
    </View>
  );
}

function BiometricGate({ children }: { children: React.ReactNode }) {
  const { appLock } = useSettings();
  const [locked, setLocked] = useState(appLock);

  useEffect(() => {
    setLocked(appLock);
  }, [appLock]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background' && appLock) setLocked(true);
    });
    return () => sub.remove();
  }, [appLock]);

  const unlock = useCallback(async () => {
    const ok = await biometricAuth('Unlock huntTMS Driver');
    if (ok) setLocked(false);
  }, []);

  useEffect(() => {
    if (locked) unlock();
  }, [locked, unlock]);

  if (!locked) return <>{children}</>;
  return <LockScreen onUnlock={unlock} />;
}

// Theme-aware app shell — StatusBar + screen-transition background follow the
// resolved color scheme so nothing flashes white in dark mode.
function ThemedShell() {
  const { scheme } = useSettings();
  const pageBg = scheme === 'dark' ? '#0a0a0b' : '#ffffff';
  return (
    // NativeWind className tokens (bg-background…) resolve against these CSS
    // variables. The `.dark` selector is web-only, so on native we set the
    // variables here per scheme; changing scheme re-renders this tree, flipping
    // every className token (and inline C.*) at once — no stale colors on switch.
    <View style={[{ flex: 1 }, themeVars(scheme)]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <BiometricGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: pageBg },
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        >
          {/* iOS: camera & call slide up full-screen; confirm-scan as a sheet */}
          <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="call" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="confirm-scan" options={{ presentation: 'modal' }} />
          <Stack.Screen name="navigate" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        </Stack>
      </BiometricGate>
    </View>
  );
}

SplashScreen.preventAutoHideAsync();

// Shows the real error on-screen instead of a white crash (diagnostic).
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: C.background, paddingHorizontal: 24, paddingTop: 80 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: C.destructive }}>App error</Text>
      <Text style={{ marginTop: 8, fontSize: 15, color: C.foreground }}>{error.message}</Text>
      <ScrollView style={{ marginTop: 12, flex: 1 }}>
        <Text style={{ fontSize: 12, color: C.mutedForeground }}>{error.stack}</Text>
      </ScrollView>
      <Text onPress={retry} style={{ marginVertical: 16, fontSize: 16, color: C.route }}>
        Tap to retry
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  // Telegram Mini App: expand to full screen on web (no-op on native / plain web)
  useEffect(() => {
    initTelegram();
  }, []);

  // Keep the navigator mounted while fonts load (native splash stays up until
  // hideAsync), so deep links never hit a missing navigation context.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <ActiveLoadProvider>
            <ExpensesProvider>
              <NotificationProvider>
                <ThemedShell />
              </NotificationProvider>
            </ExpensesProvider>
          </ActiveLoadProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
