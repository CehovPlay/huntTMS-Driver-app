import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, FileCheck } from 'lucide-react-native';

import { CURRENT_LOAD } from '@/lib/mock';
import { Pressable } from '@/components/pressable';
import { useActiveLoad } from '@/lib/active-load';

export default function Delivered() {
  const { docs, reset, markDelivered } = useActiveLoad();

  useEffect(() => {
    markDelivered(CURRENT_LOAD.reference);
  }, []);

  const done = () => {
    reset();
    router.replace('/loads');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-6 px-8">
        {/* success mark */}
        <View
          className="size-20 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(13,148,136,0.12)' }}
        >
          <View
            className="size-14 items-center justify-center rounded-full"
            style={{ backgroundColor: '#0d9488' }}
          >
            <Check size={30} color="#ffffff" strokeWidth={3} />
          </View>
        </View>

        <View className="items-center gap-2">
          <Text className="font-sans-semibold text-2xl text-foreground">Load delivered</Text>
          <Text className="text-center font-sans text-base text-muted-foreground">
            Load {CURRENT_LOAD.reference} completed.{'\n'}All documents uploaded.
          </Text>
        </View>

        {/* uploaded docs summary */}
        {docs.length > 0 ? (
          <View className="w-full gap-2 rounded-3xl border border-border bg-background p-4">
            {docs.map((d) => (
              <View key={d} className="flex-row items-center gap-3">
                <FileCheck size={18} color="#0d9488" />
                <Text className="flex-1 font-sans text-base text-foreground">{d}</Text>
                <Check size={16} color="#0d9488" />
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <SafeAreaView edges={['bottom']} className="px-5 pt-3">
        <Pressable
          onPress={done}
          className="h-16 flex-row items-center justify-center rounded-2xl bg-primary active:opacity-90"
        >
          <Text className="font-sans-medium text-base text-primary-foreground">Done</Text>
        </Pressable>
      </SafeAreaView>
    </SafeAreaView>
  );
}
