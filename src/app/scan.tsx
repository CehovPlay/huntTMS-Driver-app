import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';

export default function Scan() {
  const [perm, requestPerm] = useCameraPermissions();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const ref = useRef<CameraView>(null);

  if (!perm) return <View className="flex-1 bg-black" />;

  if (!perm.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
        <Text className="text-center font-sans-medium text-lg text-foreground">
          Camera access is needed to scan documents
        </Text>
        <Pressable
          onPress={requestPerm}
          className="h-16 w-full flex-row items-center justify-center rounded-2xl bg-primary active:opacity-90"
        >
          <Text className="font-sans-medium text-base text-primary-foreground">Grant access</Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          hitSlop={8}
          className="py-2 active:opacity-60"
        >
          <Text className="font-sans text-base text-muted-foreground">Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const capture = async () => {
    const photo = await ref.current?.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) {
      router.replace({ pathname: '/confirm-scan', params: { uri: photo.uri, type: type ?? '' } });
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={ref} style={StyleSheet.absoluteFill} facing="back" />
      <SafeAreaView className="flex-1 justify-between">
        {/* header */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            hitSlop={8}
            className="size-12 items-center justify-center rounded-full bg-black/40 active:opacity-70"
          >
            <X size={22} color="#fff" />
          </Pressable>
          <Text className="font-sans-medium text-base text-white">Scan document</Text>
          <View className="size-10" />
        </View>

        {/* document frame guide */}
        <View className="mx-8 flex-1 my-6 rounded-3xl border-2 border-white/60" />

        {/* shutter */}
        <View className="items-center pb-6">
          <Pressable
            onPress={capture}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            className="size-[72px] items-center justify-center rounded-full border-4 border-white active:opacity-70"
          >
            <View className="size-14 rounded-full bg-white" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
