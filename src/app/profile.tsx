import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Camera,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Fingerprint,
  LogOut,
  MapPin,
  Mic,
  Moon,
  Phone,
  ReceiptText,
  Smartphone,
  Sun,
  Truck,
  WifiOff,
} from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { Switch } from '@/components/switch';
import { DocsFlowSheet } from '@/components/docs-flow-sheet';
import { useSettings, type ThemeMode } from '@/lib/settings';
import { useOffline, setOffline } from '@/lib/use-mock-query';
import { biometricAvailable } from '@/lib/biometric';
import { C } from '@/lib/theme';
import { docColor } from '@/lib/status';
import { Appear } from '@/components/appear';
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
    <Appear delay={delay} className="gap-2">
      <Text className="px-1 font-sans-medium text-sm text-muted-foreground">{title}</Text>
      <View className="gap-px overflow-hidden rounded-3xl bg-background">{children}</View>
    </Appear>
  );
}

function DocRow({ doc, status, onPress }: { doc: Doc; status: DocStatus; onPress: () => void }) {
  const s = docColor(status);
  const expiresText =
    status === 'missing'
      ? 'Not on file — tap to upload'
      : status === 'valid' && doc.status === 'missing'
        ? 'Uploaded · in review'
        : `Expires ${doc.expires}`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${doc.name}, ${s.label}. ${status === 'valid' ? 'Replace' : 'Upload'}`}
      className="flex-row items-center gap-3 bg-background px-4 py-3.5 active:opacity-80"
    >
      <FileText size={18} color={C.mutedForeground} />
      <View className="flex-1">
        <Text className="font-sans-medium text-base text-foreground">{doc.name}</Text>
        <Text className="font-sans text-sm text-muted-foreground">{expiresText}</Text>
      </View>
      <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${s.color}1A` }}>
        <Text className="font-sans-medium text-xs" style={{ color: s.color }}>
          {s.label}
        </Text>
      </View>
      <ChevronRight size={16} color={C.mutedForeground} />
    </Pressable>
  );
}

const THEME_OPTS: { val: ThemeMode; label: string; icon: typeof Sun }[] = [
  { val: 'system', label: 'System', icon: Smartphone },
  { val: 'light', label: 'Light', icon: Sun },
  { val: 'dark', label: 'Dark', icon: Moon },
];

export default function Profile() {
  const [prefs, setPrefs] = useState(NOTIFICATION_PREFS);
  const { theme, setTheme, appLock, setAppLock } = useSettings();
  const offline = useOffline();
  const [bio, setBio] = useState<{ available: boolean; label: string }>({ available: false, label: 'Face ID' });
  // Document status overrides + active upload (flips a doc to "valid" on confirm).
  const [docOverride, setDocOverride] = useState<Record<string, DocStatus>>({});
  const [uploadDoc, setUploadDoc] = useState<string | null>(null);
  const [uploadedTypes, setUploadedTypes] = useState<string[]>([]);
  const statusOf = (d: Doc): DocStatus => docOverride[d.name] ?? d.status;
  const openUpload = (d: Doc) => {
    setUploadedTypes([]);
    setUploadDoc(d.name);
  };

  useEffect(() => {
    biometricAvailable().then(setBio);
  }, []);

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

        {/* Expenses quick entry */}
        <Pressable
          onPress={() => router.push('/expenses')}
          accessibilityRole="button"
          accessibilityLabel="Expenses"
          className="flex-row items-center gap-3 rounded-3xl bg-background p-4 active:opacity-90"
        >
          <View className="size-11 items-center justify-center rounded-2xl bg-accent">
            <ReceiptText size={20} color={C.foreground} />
          </View>
          <View className="flex-1">
            <Text className="font-sans-medium text-base text-foreground">Expenses</Text>
            <Text className="font-sans text-sm text-muted-foreground">Fuel, tolls, repairs · attach receipts</Text>
          </View>
          <ChevronRight size={18} color={C.mutedForeground} />
        </Pressable>

        {/* Report a problem */}
        <Pressable
          onPress={() => router.push('/report-issue')}
          accessibilityRole="button"
          accessibilityLabel="Report a problem"
          className="flex-row items-center gap-3 rounded-3xl bg-background p-4 active:opacity-90"
        >
          <View className="size-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${C.destructive}14` }}>
            <AlertTriangle size={20} color={C.destructive} />
          </View>
          <View className="flex-1">
            <Text className="font-sans-medium text-base text-foreground">Report a problem</Text>
            <Text className="font-sans text-sm text-muted-foreground">Breakdown, flat tire, accident…</Text>
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
            <DocRow key={d.name} doc={d} status={statusOf(d)} onPress={() => openUpload(d)} />
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
            <DocRow key={d.name} doc={d} status={statusOf(d)} onPress={() => openUpload(d)} />
          ))}
        </Section>

        {/* Appearance + units */}
        <Section title="APPEARANCE">
          <View className="gap-3 bg-background p-4">
            <Text className="font-sans-medium text-base text-foreground">Theme</Text>
            <View className="h-12 flex-row items-center rounded-2xl bg-accent p-1">
              {THEME_OPTS.map(({ val, label, icon: Icon }) => {
                const on = theme === val;
                return (
                  <Pressable
                    key={val}
                    onPress={() => setTheme(val)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    className="h-full flex-1 flex-row items-center justify-center gap-1.5 rounded-xl"
                    style={{ backgroundColor: on ? C.background : 'transparent' }}
                  >
                    <Icon size={15} color={on ? C.foreground : C.mutedForeground} />
                    <Text className="font-sans-medium text-sm" style={{ color: on ? C.foreground : C.mutedForeground }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Section>

        {/* Security — only when the device has enrolled biometrics */}
        {bio.available ? (
          <Section title="SECURITY">
            <View className="flex-row items-center gap-3 bg-background px-4 py-3">
              <View className="size-10 items-center justify-center rounded-2xl bg-accent">
                <Fingerprint size={18} color={C.foreground} />
              </View>
              <View className="flex-1">
                <Text className="font-sans-medium text-base text-foreground">Unlock with {bio.label}</Text>
                <Text className="font-sans text-sm text-muted-foreground">Require {bio.label} to open the app</Text>
              </View>
              <Switch value={appLock} onValueChange={setAppLock} />
            </View>
          </Section>
        ) : null}

        {/* Notifications */}
        <Section title="NOTIFICATIONS">
          {prefs.map((p) => (
            <View key={p.key} className="flex-row items-center gap-3 bg-background px-4 py-3">
              <View className="flex-1">
                <Text className="font-sans-medium text-base text-foreground">{p.label}</Text>
                <Text className="font-sans text-sm text-muted-foreground">{p.desc}</Text>
              </View>
              <Switch value={p.on} onValueChange={() => toggle(p.key)} />
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

        {/* Demo — simulate a failed fetch to preview loading/error states */}
        <Section title="DEMO">
          <View className="flex-row items-center gap-3 bg-background px-4 py-3">
            <View className="size-10 items-center justify-center rounded-2xl bg-accent">
              <WifiOff size={18} color={C.foreground} />
            </View>
            <View className="flex-1">
              <Text className="font-sans-medium text-base text-foreground">Simulate offline</Text>
              <Text className="font-sans text-sm text-muted-foreground">Force load failures to preview error states</Text>
            </View>
            <Switch value={offline} onValueChange={setOffline} />
          </View>
        </Section>

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

      {/* single-document upload — flips the doc to "valid" on confirm */}
      <DocsFlowSheet
        visible={!!uploadDoc}
        required={uploadDoc ? [uploadDoc] : []}
        labels={{}}
        uploaded={uploadedTypes}
        title={uploadDoc ? `Upload ${uploadDoc}` : 'Upload document'}
        onUpload={(t) => setUploadedTypes((u) => (u.includes(t) ? u : [...u, t]))}
        onConfirm={() => {
          if (uploadDoc) setDocOverride((o) => ({ ...o, [uploadDoc]: 'valid' }));
          setUploadDoc(null);
        }}
        onClose={() => setUploadDoc(null)}
      />
    </View>
  );
}
