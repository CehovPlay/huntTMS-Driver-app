import { useState } from 'react';
import { Alert, Linking, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Camera,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  LogOut,
  MapPin,
  Mic,
  Phone,
  Truck,
  Wallet,
} from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { C } from '@/lib/theme';
import { HOS, fmtHrs } from '@/lib/hos';
import { EARNINGS, money } from '@/lib/earnings';
import {
  CO_DRIVER,
  DRIVER,
  DRIVER_DOCS,
  NOTIFICATION_PREFS,
  PERMISSIONS,
  TRAILER,
  TRUCK,
  VEHICLE_DOCS,
  type Doc,
  type DocStatus,
} from '@/lib/profile';

const DOC_COLOR: Record<DocStatus, { label: string; color: string }> = {
  valid: { label: 'Valid', color: '#0d9488' },
  expiring: { label: 'Expiring', color: '#d97706' },
  expired: { label: 'Expired', color: '#ef4444' },
};

const PERM_ICON: Record<string, typeof Camera> = {
  camera: Camera,
  location: MapPin,
  microphone: Mic,
  notifications: Bell,
};

let sectionOrder = 0;
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const delay = (sectionOrder++ % 7) * 55;
  return (
    <View className="gap-2">
      <Text className="px-1 font-sans-medium text-sm text-muted-foreground">{title}</Text>
      <View className="gap-px overflow-hidden rounded-3xl bg-background">{children}</View>
    </View>
  );
}

function DocRow({ doc }: { doc: Doc }) {
  const s = DOC_COLOR[doc.status];
  return (
    <View className="flex-row items-center gap-3 bg-background px-4 py-3.5">
      <FileText size={18} color={C.mutedForeground} />
      <View className="flex-1">
        <Text className="font-sans-medium text-base text-foreground">{doc.name}</Text>
        <Text className="font-sans text-sm text-muted-foreground">Expires {doc.expires}</Text>
      </View>
      <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${s.color}1A` }}>
        <Text className="font-sans-medium text-xs" style={{ color: s.color }}>
          {s.label}
        </Text>
      </View>
    </View>
  );
}

export default function Profile() {
  const [prefs, setPrefs] = useState(NOTIFICATION_PREFS);

  const toggle = (key: string) =>
    setPrefs((p) => p.map((x) => (x.key === key ? { ...x, on: !x.on } : x)));

  const signOut = () =>
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => router.replace('/login') },
    ]);

  return (
    <View className="flex-1 bg-accent">
      <SafeAreaView edges={['top']} className="border-b border-border bg-background">
        <View className="h-12 flex-row items-center px-4">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            className="flex-row items-center gap-1.5 active:opacity-60"
          >
            <ArrowLeft size={20} color={C.foreground} />
            <Text className="font-sans-medium text-base text-foreground">Back</Text>
          </Pressable>
          <Text pointerEvents="none" className="absolute inset-x-0 text-center font-sans-semibold text-base text-foreground">
            Profile
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerClassName="gap-5 p-4 pb-10" showsVerticalScrollIndicator={false}>
        {/* Driver card */}
        <View className="flex-row items-center gap-4 rounded-3xl bg-background p-4">
          <View className="size-16 items-center justify-center rounded-full" style={{ backgroundColor: C.primary }}>
            <Text className="font-sans-semibold text-xl text-primary-foreground">{DRIVER.initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-sans-semibold text-xl text-foreground">{DRIVER.name}</Text>
            <Text className="font-sans text-sm text-muted-foreground">{DRIVER.role}</Text>
            <Text className="font-sans text-sm text-muted-foreground">{DRIVER.cdl}</Text>
          </View>
        </View>

        {/* Hours of Service quick entry */}
        <Pressable
          onPress={() => router.push('/hos')}
          accessibilityRole="button"
          accessibilityLabel="Hours of Service"
          className="flex-row items-center gap-3 rounded-3xl bg-background p-4 active:opacity-90"
        >
          <View className="size-11 items-center justify-center rounded-2xl bg-accent">
            <Clock size={20} color={C.foreground} />
          </View>
          <View className="flex-1">
            <Text className="font-sans-medium text-base text-foreground">Hours of Service</Text>
            <Text className="font-sans text-sm text-muted-foreground">
              {HOS.current} · {fmtHrs(HOS.clocks[0].maxH - HOS.clocks[0].usedH)} drive left
            </Text>
          </View>
          <ChevronRight size={18} color={C.mutedForeground} />
        </Pressable>

        {/* Earnings quick entry */}
        <Pressable
          onPress={() => router.push('/earnings')}
          accessibilityRole="button"
          accessibilityLabel="Earnings"
          className="flex-row items-center gap-3 rounded-3xl bg-background p-4 active:opacity-90"
        >
          <View className="size-11 items-center justify-center rounded-2xl bg-accent">
            <Wallet size={20} color={C.foreground} />
          </View>
          <View className="flex-1">
            <Text className="font-sans-medium text-base text-foreground">Earnings</Text>
            <Text className="font-sans text-sm text-muted-foreground">
              This week · {money(EARNINGS.gross)} · {EARNINGS.loads} loads
            </Text>
          </View>
          <ChevronRight size={18} color={C.mutedForeground} />
        </Pressable>

        {/* DVIR quick entry */}
        <Pressable
          onPress={() => router.push('/dvir')}
          accessibilityRole="button"
          accessibilityLabel="Vehicle inspection"
          className="flex-row items-center gap-3 rounded-3xl bg-background p-4 active:opacity-90"
        >
          <View className="size-11 items-center justify-center rounded-2xl bg-accent">
            <ClipboardCheck size={20} color={C.foreground} />
          </View>
          <View className="flex-1">
            <Text className="font-sans-medium text-base text-foreground">Vehicle inspection</Text>
            <Text className="font-sans text-sm text-muted-foreground">DVIR · pre / post-trip checklist</Text>
          </View>
          <ChevronRight size={18} color={C.mutedForeground} />
        </Pressable>

        {/* Co-driver */}
        <Section title="CO-DRIVER">
          <View className="flex-row items-center gap-3 bg-background px-4 py-3.5">
            <View className="size-10 items-center justify-center rounded-full bg-accent">
              <Text className="font-sans-semibold text-sm text-foreground">{CO_DRIVER.initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans-medium text-base text-foreground">{CO_DRIVER.name}</Text>
              <Text className="font-sans text-sm text-muted-foreground">Co-driver</Text>
            </View>
            <Pressable
              onPress={() => router.push('/call')}
              accessibilityRole="button"
              accessibilityLabel={`Call ${CO_DRIVER.name}`}
              hitSlop={8}
              className="size-12 items-center justify-center rounded-full bg-accent active:opacity-80"
            >
              <Phone size={16} color={C.foreground} />
            </Pressable>
          </View>
        </Section>

        {/* Driver documents */}
        <Section title="DRIVER & MEDICAL DOCUMENTS">
          {DRIVER_DOCS.map((d) => (
            <DocRow key={d.name} doc={d} />
          ))}
        </Section>

        {/* Vehicle */}
        <Section title="TRUCK & TRAILER">
          <View className="flex-row items-center gap-3 bg-background px-4 py-3.5">
            <View className="size-10 items-center justify-center rounded-2xl bg-accent">
              <Truck size={18} color={C.foreground} />
            </View>
            <View className="flex-1">
              <Text className="font-sans-medium text-base text-foreground">{TRUCK.unit}</Text>
              <Text className="font-sans text-sm text-muted-foreground">
                {TRUCK.makeModel} · {TRUCK.year} · {TRUCK.plate}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3 bg-background px-4 py-3.5">
            <View className="size-10 items-center justify-center rounded-2xl bg-accent">
              <Truck size={18} color={C.foreground} />
            </View>
            <View className="flex-1">
              <Text className="font-sans-medium text-base text-foreground">{TRAILER.unit}</Text>
              <Text className="font-sans text-sm text-muted-foreground">
                {TRAILER.type} · {TRAILER.plate}
              </Text>
            </View>
          </View>
        </Section>

        <Section title="VEHICLE DOCUMENTS">
          {VEHICLE_DOCS.map((d) => (
            <DocRow key={d.name} doc={d} />
          ))}
        </Section>

        {/* Notifications */}
        <Section title="NOTIFICATIONS">
          {prefs.map((p) => (
            <View key={p.key} className="flex-row items-center gap-3 bg-background px-4 py-3">
              <View className="flex-1">
                <Text className="font-sans-medium text-base text-foreground">{p.label}</Text>
                <Text className="font-sans text-sm text-muted-foreground">{p.desc}</Text>
              </View>
              <Switch
                value={p.on}
                onValueChange={() => toggle(p.key)}
                trackColor={{ true: C.primary, false: '#e5e5e5' }}
                ios_backgroundColor="#e5e5e5"
              />
            </View>
          ))}
        </Section>

        {/* Permissions */}
        <Section title="PERMISSIONS & ACCESS">
          {PERMISSIONS.map((p) => {
            const Icon = PERM_ICON[p.key] ?? Camera;
            return (
              <Pressable
                key={p.key}
                onPress={() => Linking.openSettings()}
                className="flex-row items-center gap-3 bg-background px-4 py-3.5 active:opacity-70"
              >
                <Icon size={18} color={C.foreground} />
                <View className="flex-1">
                  <Text className="font-sans-medium text-base text-foreground">{p.label}</Text>
                  <Text className="font-sans text-sm text-muted-foreground">{p.desc}</Text>
                </View>
                <ChevronRight size={18} color={C.mutedForeground} />
              </Pressable>
            );
          })}
        </Section>
        <Text className="-mt-3 px-1 font-sans text-xs text-muted-foreground">
          Tap any item to manage access in iOS Settings.
        </Text>

        {/* Sign out */}
        <Pressable
          onPress={signOut}
          className="h-16 flex-row items-center justify-center gap-2 rounded-2xl bg-background active:opacity-80"
        >
          <LogOut size={18} color={C.destructive} />
          <Text className="font-sans-medium text-base" style={{ color: C.destructive }}>
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
