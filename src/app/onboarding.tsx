import { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Bell, Camera, FileSignature, MapPin, Navigation2, Package, ShieldCheck, Truck } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { Logo } from '@/components/logo';
import { Appear } from '@/components/appear';
import { haptics } from '@/lib/haptics';
import { useSettings } from '@/lib/settings';
import { C } from '@/lib/theme';

// Page indicator dot — the active dot springs wider.
function Dot({ active }: { active: boolean }) {
  const w = useSharedValue(active ? 22 : 7);
  useEffect(() => {
    w.value = withSpring(active ? 22 : 7, { damping: 16, stiffness: 240 });
  }, [active, w]);
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return (
    <Animated.View
      style={[{ height: 7, borderRadius: 4, backgroundColor: active ? C.primary : C.border }, style]}
    />
  );
}

type Slide = { icon: typeof Truck; title: string; body: string };

const SLIDES: Slide[] = [
  { icon: Package, title: 'Your loads, organized', body: 'See scheduled and completed loads, accept new offers, and track every stop in one place.' },
  { icon: Navigation2, title: 'Navigate & stay on time', body: 'Turn-by-turn navigation, your full route, and a live ETA to every stop.' },
  { icon: FileSignature, title: 'Paperwork made easy', body: 'Scan BOL / POD, capture the receiver’s signature, and message your dispatcher instantly.' },
];

const PERMS = [
  { icon: MapPin, label: 'Location', body: 'Share live location while on a load so dispatch can track ETA.' },
  { icon: Camera, label: 'Camera', body: 'Scan documents and capture proof of delivery.' },
  { icon: Bell, label: 'Notifications', body: 'Get load offers, stop reminders, and dispatcher messages.' },
];

async function requestPermissions() {
  if (Platform.OS === 'web') return;
  try {
    const Location = require('expo-location');
    await Location.requestForegroundPermissionsAsync();
  } catch {}
  try {
    const { Camera: Cam } = require('expo-camera');
    await Cam?.requestCameraPermissionsAsync?.();
  } catch {}
}

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const { setOnboarded } = useSettings();
  const scroller = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const total = SLIDES.length + 1; // + permissions step
  const last = page === total - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  };

  const next = async () => {
    haptics.light();
    if (last) {
      await requestPermissions();
      setOnboarded(true);
      router.replace('/login');
      return;
    }
    scroller.current?.scrollTo({ x: width * (page + 1), animated: true });
    setPage((p) => p + 1);
  };

  const skip = () => {
    setOnboarded(true);
    router.replace('/login');
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={['top']} className="bg-background">
        <View className="h-12 flex-row items-center justify-between px-5">
          <Logo height={22} />
          {!last ? (
            <Pressable onPress={skip} hitSlop={8} accessibilityRole="button" accessibilityLabel="Skip">
              <Text className="font-sans-medium text-sm text-muted-foreground">Skip</Text>
            </Pressable>
          ) : (
            <View className="w-10" />
          )}
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {SLIDES.map((s) => {
          const Icon = s.icon;
          return (
            <View key={s.title} style={{ width }} className="flex-1 items-center justify-center px-10">
              <Appear delay={120} className="items-center gap-6">
                <View className="size-24 items-center justify-center rounded-4xl bg-accent">
                  <Icon size={44} color={C.foreground} />
                </View>
                <View className="gap-3">
                  <Text className="text-center font-sans-bold text-2xl text-foreground">{s.title}</Text>
                  <Text className="text-center font-sans text-base leading-6 text-muted-foreground">{s.body}</Text>
                </View>
              </Appear>
            </View>
          );
        })}

        {/* permissions priming step */}
        <View style={{ width }} className="flex-1 justify-center gap-6 px-8">
          <View className="items-center gap-3">
            <View className="size-24 items-center justify-center rounded-4xl bg-accent">
              <ShieldCheck size={44} color={C.foreground} />
            </View>
            <Text className="text-center font-sans-bold text-2xl text-foreground">A few permissions</Text>
            <Text className="text-center font-sans text-base leading-6 text-muted-foreground">
              We only use these to do the job — you can change them anytime in Settings.
            </Text>
          </View>
          <View className="gap-px overflow-hidden rounded-3xl bg-accent">
            {PERMS.map((p) => {
              const Icon = p.icon;
              return (
                <View key={p.label} className="flex-row items-center gap-3 bg-accent p-4">
                  <View className="size-10 items-center justify-center rounded-2xl bg-background">
                    <Icon size={18} color={C.foreground} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-medium text-base text-foreground">{p.label}</Text>
                    <Text className="font-sans text-sm leading-5 text-muted-foreground">{p.body}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* dots + CTA */}
      <SafeAreaView edges={['bottom']} className="bg-background">
        <View className="gap-5 px-8 pb-2 pt-3">
          <View className="flex-row items-center justify-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <Dot key={i} active={i === page} />
            ))}
          </View>
          <Pressable
            onPress={next}
            accessibilityRole="button"
            accessibilityLabel={last ? 'Allow access and continue' : 'Next'}
            className="h-16 items-center justify-center rounded-2xl bg-primary active:opacity-90"
          >
            <Text className="font-sans-medium text-base text-primary-foreground">
              {last ? 'Allow access & continue' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
