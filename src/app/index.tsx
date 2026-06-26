import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Logo } from '@/components/logo';
import { useAuth } from '@/lib/auth/auth';
import { useSettings } from '@/lib/settings';
import { C } from '@/lib/theme';

export default function Splash() {
  const { onboarded } = useSettings();
  const { status } = useAuth();
  useEffect(() => {
    const t = setTimeout(() => {
      if (!onboarded) {
        router.replace('/onboarding');
      } else if (status === 'signed-in') {
        router.replace('/loads');
      } else if (status !== 'loading') {
        router.replace('/login');
      }
    }, 1600);
    return () => clearTimeout(t);
  }, [onboarded, status]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <View className="flex-1 items-center justify-center">
        <Logo height={40} />
      </View>
      <View className="absolute bottom-24 items-center gap-3">
        <ActivityIndicator color={C.mutedForeground} />
        <Text className="font-sans text-sm text-muted-foreground">Driver</Text>
      </View>
    </View>
  );
}
