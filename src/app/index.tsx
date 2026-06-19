import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Logo } from '@/components/logo';

export default function Splash() {
  useEffect(() => {
    const t = setTimeout(() => router.replace('/login'), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <View className="flex-1 items-center justify-center">
        <Logo height={40} />
      </View>
      <View className="absolute bottom-24 items-center gap-3">
        <ActivityIndicator color="#737373" />
        <Text className="font-sans text-sm text-muted-foreground">Driver</Text>
      </View>
    </View>
  );
}
