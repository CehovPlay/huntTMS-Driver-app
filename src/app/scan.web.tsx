import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, X } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';

// Web fallback for the native camera scanner: no live viewfinder in the browser /
// Telegram webview, so pick or capture a photo via a file input instead.
export default function ScanWeb() {
  const { type } = useLocalSearchParams<{ type?: string }>();

  const pickPhoto = () => {
    const w = globalThis as unknown as {
      document: { createElement: (t: string) => Record<string, unknown> };
      FileReader: new () => { onload: () => void; result: unknown; readAsDataURL: (f: unknown) => void };
    };
    const input = w.document.createElement('input') as Record<string, unknown> & {
      click: () => void;
      files: unknown[];
      onchange: () => void;
    };
    input.type = 'file';
    input.accept = 'image/*';
    (input as Record<string, unknown>).capture = 'environment';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new w.FileReader();
      reader.onload = () => {
        router.replace({ pathname: '/confirm-scan', params: { uri: String(reader.result), type: type ?? '' } });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1 justify-between">
        {/* header */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            className="size-12 items-center justify-center rounded-full bg-black/40"
          >
            <X size={22} color="#fff" />
          </Pressable>
          <Text className="font-sans-medium text-base text-white">Scan document</Text>
          <View className="size-12" />
        </View>

        {/* frame guide */}
        <View className="mx-8 my-6 flex-1 items-center justify-center gap-4 rounded-3xl border-2 border-white/60">
          <Camera size={40} color="rgba(255,255,255,0.7)" />
          <Text className="px-8 text-center font-sans text-sm text-white/70">
            Camera capture isn’t available on web — tap below to take or choose a photo.
          </Text>
        </View>

        {/* shutter / picker */}
        <View className="items-center pb-8">
          <Pressable
            onPress={pickPhoto}
            accessibilityRole="button"
            accessibilityLabel="Take or choose photo"
            className="h-16 w-4/5 flex-row items-center justify-center rounded-2xl bg-white active:opacity-80"
          >
            <Text className="font-sans-medium text-base text-black">Take / choose photo</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
