import '../global.css';

import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, ScrollView, Text, View, Text as RNText } from 'react-native';
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
import { SafeAreaProvider, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { cssInterop } from 'nativewind';
import * as SplashScreen from 'expo-splash-screen';

// WEB ONLY: register className support on reanimated's Animated.View. On native
// the nativewind babel JSX transform already maps className on every component
// (and calling cssInterop there double-registers and breaks rendering → blank
// screen); on web it's needed or animated containers drop their classes
// (flex-1/justify-end/border vanish and the layout collapses).
if (Platform.OS === 'web') {
  cssInterop(Animated.View, { className: 'style' });
}
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
import { CopilotProvider } from '@/lib/use-assistant';
import { biometricAuth } from '@/lib/biometric';
import { initTelegram } from '@/lib/telegram';
import { HuntBotFab } from '@/components/huntbot-fab';
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
  // Fade the shell in on mount. Because the tree remounts on every theme change
  // (key={scheme} below), this plays on each switch — a smooth crossfade that
  // hides the remount flash instead of a hard cut.
  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = withTiming(1, { duration: 240 });
  }, [fade]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  return (
    // NativeWind className tokens (bg-background…) resolve against these CSS
    // variables (the `.dark` selector is web-only, so native needs them set here).
    // `key={scheme}` remounts the whole navigator on theme change: the C color
    // proxy isn't reactive, and react-navigation memoizes inactive screens, so a
    // plain re-render leaves stale inline colors (avatars, status dots, badges) on
    // background tabs. Remounting guarantees every screen renders in the new theme
    // (on web expo-router restores the current route from the URL).
    <Animated.View key={scheme} style={[{ flex: 1 }, themeVars(scheme), fadeStyle]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <BiometricGate>
        <CopilotProvider>
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
          {/* HuntBot reachable from every stack screen (tab screens use the
              center bot in the tab bar instead) */}
          <HuntBotFab />
        </CopilotProvider>
      </BiometricGate>
    </Animated.View>
  );
}

// On web, Telegram already pads #root by the full safe area (device inset +
// Telegram's content inset; see telegram.web initTelegram). react-native-safe-
// area-context ALSO reads env(safe-area-inset-*) in the Telegram iOS webview, so
// SafeAreaView edges would add the notch a second time → a too-tall top gap.
// Make Telegram's #root padding the single source of truth on web by zeroing the
// safe-area context there; native is untouched.
const ZERO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
function WebSafeAreaReset({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return <SafeAreaInsetsContext.Provider value={ZERO_INSETS}>{children}</SafeAreaInsetsContext.Provider>;
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
        <WebSafeAreaReset>
        <SettingsProvider>
          <ActiveLoadProvider>
            <ExpensesProvider>
              <NotificationProvider>
                <ThemedShell />
              </NotificationProvider>
            </ExpensesProvider>
          </ActiveLoadProvider>
        </SettingsProvider>
        </WebSafeAreaReset>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
