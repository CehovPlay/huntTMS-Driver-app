import '../global.css';

import { useEffect } from 'react';
import { ScrollView, Text, View, Text as RNText } from 'react-native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

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
import { NotificationProvider } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

// Shows the real error on-screen instead of a white crash (diagnostic).
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 80 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#ef4444' }}>App error</Text>
      <Text style={{ marginTop: 8, fontSize: 15, color: '#171717' }}>{error.message}</Text>
      <ScrollView style={{ marginTop: 12, flex: 1 }}>
        <Text style={{ fontSize: 12, color: '#737373' }}>{error.stack}</Text>
      </ScrollView>
      <Text onPress={retry} style={{ marginVertical: 16, fontSize: 16, color: '#1e9df1' }}>
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

  // Keep the navigator mounted while fonts load (native splash stays up until
  // hideAsync), so deep links never hit a missing navigation context.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ActiveLoadProvider>
          <NotificationProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#ffffff' },
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
          </NotificationProvider>
        </ActiveLoadProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
