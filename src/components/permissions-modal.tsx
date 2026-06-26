import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Bell, Camera, Lock, MapPin } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { requestAllPermissions } from '@/lib/permissions';
import { C } from '@/lib/theme';

const ITEMS = [
  { icon: Camera, label: 'Camera', body: 'Scan BOL / POD and capture proof of delivery' },
  { icon: MapPin, label: 'Location', body: 'Live ETA and turn-by-turn while on a load' },
  { icon: Bell, label: 'Notifications', body: 'Load offers, stop reminders, dispatcher' },
];

// Permission priming shown once on entering the platform. Branded hero, clean
// hairline rows, spring-in entrance. The real prompts fire from the Allow tap.
export function PermissionsModal({ onAllow, onSkip }: { onAllow: () => void; onSkip: () => void }) {
  const [busy, setBusy] = useState(false);

  // Pop-in entrance (scale + fade).
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [p]);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: 0.94 + p.value * 0.06 }, { translateY: (1 - p.value) * 16 }],
  }));

  const allow = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await requestAllPermissions();
    } finally {
      onAllow();
    }
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onSkip}>
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <Animated.View
          style={[cardStyle, { width: '100%', maxWidth: 380, borderRadius: 18 }]}
          className="overflow-hidden bg-background"
        >
          {/* hero */}
          <View className="items-center gap-3 px-6 pb-1 pt-7">
            <View
              className="size-16 items-center justify-center"
              style={{ backgroundColor: C.teal, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}
            >
              <MapPin size={30} color="#fff" strokeWidth={2.2} />
            </View>
            <Text className="text-center font-sans-bold text-[22px] leading-7 text-foreground">Set up driver tools</Text>
            <Text className="px-2 text-center font-sans text-sm leading-5 text-muted-foreground">
              A couple of permissions so navigation and document capture work properly.
            </Text>
          </View>

          {/* permission rows */}
          <View className="px-5 py-4">
            {ITEMS.map((it, i) => {
              const Icon = it.icon;
              return (
                <View
                  key={it.label}
                  className="flex-row items-center gap-3.5 py-3"
                  style={i > 0 ? { borderTopWidth: 1, borderTopColor: C.border } : undefined}
                >
                  <View className="size-11 items-center justify-center rounded-full bg-accent">
                    <Icon size={19} color={C.foreground} strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-[15px] text-foreground">{it.label}</Text>
                    <Text className="font-sans text-[13px] leading-[18px] text-muted-foreground">{it.body}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* privacy note */}
          <View className="mx-5 mb-4 flex-row items-center gap-2 rounded-2xl bg-accent px-3.5 py-2.5">
            <Lock size={14} color={C.mutedForeground} />
            <Text className="flex-1 font-sans text-xs leading-4 text-muted-foreground">
              Used only while you drive. Change anytime in Settings.
            </Text>
          </View>

          {/* actions */}
          <View className="gap-1.5 px-5 pb-5">
            <Pressable
              onPress={allow}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Allow access"
              className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-90"
              style={{ opacity: busy ? 0.7 : 1 }}
            >
              {busy ? <ActivityIndicator size="small" color={C.primaryForeground} /> : null}
              <Text className="font-sans-semibold text-base text-primary-foreground">{busy ? 'Requesting…' : 'Allow access'}</Text>
            </Pressable>
            <Pressable
              onPress={onSkip}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Not now"
              className="h-11 items-center justify-center rounded-2xl active:opacity-60"
            >
              <Text className="font-sans-medium text-sm text-muted-foreground">Not now</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
