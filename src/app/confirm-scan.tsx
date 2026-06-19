import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';

import { Pressable } from '@/components/pressable';
import { useActiveLoad } from '@/lib/active-load';

export default function ConfirmScan() {
  const { uri, type } = useLocalSearchParams<{ uri?: string; type?: string }>();
  const { addDoc } = useActiveLoad();

  const onContinue = () => {
    if (type) {
      addDoc(type);
      router.replace('/map'); // came from the active-load upload flow
    } else {
      router.replace('/upload');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 gap-5 px-5 pt-4">
        <Text className="font-sans-semibold text-2xl text-foreground">Confirm document scan</Text>
        {type ? (
          <Text className="-mt-3 font-sans text-sm text-muted-foreground">{type}</Text>
        ) : null}

        {/* preview */}
        <View className="flex-1 overflow-hidden rounded-3xl bg-[#171717] p-3">
          {uri ? (
            <Image source={{ uri }} style={{ flex: 1, borderRadius: 12 }} contentFit="contain" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="font-sans text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
                No preview
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* actions */}
      <SafeAreaView edges={['bottom']}>
        <View className="gap-3 px-5 pb-2 pt-3">
          <Pressable
            onPress={onContinue}
            className="h-16 flex-row items-center justify-center rounded-2xl bg-primary active:opacity-90"
          >
            <Text className="font-sans-medium text-base text-primary-foreground">Continue</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace({ pathname: '/scan', params: { type: type ?? '' } })}
            className="h-16 flex-row items-center justify-center rounded-2xl bg-accent active:opacity-80"
          >
            <Text className="font-sans-medium text-base text-foreground">Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}
