import { useState } from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import { Bell, Camera, Mic, MapPin, ShieldCheck } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { requestAllPermissions } from '@/lib/permissions';
import { C } from '@/lib/theme';

const ITEMS = [
  { icon: Mic, label: 'Microphone', body: 'Talk to HuntBot hands-free — “Hey Bot…”.' },
  { icon: Camera, label: 'Camera', body: 'Scan BOL / POD and capture proof of delivery.' },
  { icon: MapPin, label: 'Location', body: 'Live ETA and turn-by-turn navigation on a load.' },
  { icon: Bell, label: 'Notifications', body: 'Load offers, stop reminders, dispatcher messages.' },
];

// Centered modal shown once on entering the platform — primes and requests the
// browser/OS permissions HuntBot and the driver tools need. The actual prompts
// fire from the "Allow access" tap (browsers require a user gesture).
export function PermissionsModal({ onAllow, onSkip }: { onAllow: () => void; onSkip: () => void }) {
  const [busy, setBusy] = useState(false);

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
    <Modal visible transparent animationType="fade" onRequestClose={onSkip}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-md gap-5 rounded-3xl bg-background p-6" style={{ borderWidth: 1, borderColor: C.border }}>
          <View className="items-center gap-3">
            <View className="size-16 items-center justify-center rounded-3xl bg-accent">
              <ShieldCheck size={30} color={C.foreground} />
            </View>
            <Text className="text-center font-sans-bold text-2xl text-foreground">Enable HuntBot & tools</Text>
            <Text className="text-center font-sans text-sm leading-5 text-muted-foreground">
              Grant access so the assistant and driver tools work. Used only for the job — change anytime in Settings.
            </Text>
          </View>

          <View className="gap-px overflow-hidden rounded-2xl" style={{ borderWidth: 1, borderColor: C.border }}>
            {ITEMS.map((p) => {
              const Icon = p.icon;
              return (
                <View key={p.label} className="flex-row items-center gap-3 bg-accent p-3.5">
                  <View className="size-10 items-center justify-center rounded-2xl bg-background">
                    <Icon size={18} color={C.foreground} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-medium text-[15px] text-foreground">{p.label}</Text>
                    <Text className="font-sans text-[13px] leading-[18px] text-muted-foreground">{p.body}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View className="gap-2">
            <Pressable
              onPress={allow}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Allow access"
              className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-90"
              style={{ opacity: busy ? 0.7 : 1 }}
            >
              {busy ? <ActivityIndicator color={C.primaryForeground} /> : null}
              <Text className="font-sans-medium text-base text-primary-foreground">{busy ? 'Requesting…' : 'Allow access'}</Text>
            </Pressable>
            <Pressable
              onPress={onSkip}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Not now"
              className="h-12 items-center justify-center rounded-2xl active:opacity-60"
            >
              <Text className="font-sans-medium text-sm text-muted-foreground">Not now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
