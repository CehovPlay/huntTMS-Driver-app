import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Camera,
  ChevronRight,
  FileText,
  Fingerprint,
  LogOut,
  MapPin,
  Mic,
  Moon,
  ReceiptText,
  Smartphone,
  Sun,
  Truck,
  WifiOff,
} from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { Switch } from '@/components/switch';
import { DocsFlowSheet, type SelectedDocumentFile } from '@/components/docs-flow-sheet';
import { useSettings, type ThemeMode } from '@/lib/settings';
import { useOffline, setOffline } from '@/lib/use-mock-query';
import { biometricAvailable } from '@/lib/biometric';
import { useAuth } from '@/lib/auth/auth';
import { C } from '@/lib/theme';
import { docColor } from '@/lib/status';
import { Appear } from '@/components/appear';
import {
  NOTIFICATION_PREFS,
  PERMISSIONS,
  type Doc,
  type DocStatus,
} from '@/lib/profile';
import { useDriverEquipment, truckMakeModel, plateLabel } from '@/lib/api/equipment';
import {
  uploadDriverDocument,
  useDriverDocuments,
  type DriverDocumentItem,
} from '@/lib/api/documents';
import { useNotifications } from '@/lib/notifications';

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

function initials(name?: string | null): string {
  return (name ?? 'Driver')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDocDate(epochMs: number | null): string {
  if (!epochMs) return '—';
  const d = new Date(epochMs);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateInput(epochMs: number | null): string {
  if (!epochMs) return '';
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) return '';
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function parseDateInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const epochMs = Date.UTC(year, month - 1, day);
  const date = new Date(epochMs);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return epochMs;
}

function toDoc(item: DriverDocumentItem): Doc {
  const status = item.status.toLowerCase() as DocStatus;
  return {
    name: item.label,
    status,
    expires: status === 'missing' ? 'Not on file' : formatDocDate(item.expiryDate),
  };
}

function DocRow({
  doc,
  status,
  onPress,
  pending = false,
}: {
  doc: Doc;
  status: DocStatus;
  onPress?: () => void;
  pending?: boolean;
}) {
  const s = docColor(status);
  const expiresText = status === 'missing' ? 'Not on file' : `Expires ${doc.expires}`;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || pending}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${doc.name}, ${s.label}. ${expiresText}`}
      className="flex-row items-center gap-3 bg-background px-4 py-3.5"
    >
      <FileText size={18} color={C.mutedForeground} />
      <View className="flex-1">
        <Text className="font-sans-medium text-base text-foreground">{doc.name}</Text>
        <Text className="font-sans text-sm text-muted-foreground">{expiresText}</Text>
      </View>
      {pending ? (
        <ActivityIndicator size="small" color={C.foreground} />
      ) : (
        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${s.color}1A` }}>
          <Text className="font-sans-medium text-xs" style={{ color: s.color }}>
            {s.label}
          </Text>
        </View>
      )}
      {onPress && !pending ? <ChevronRight size={16} color={C.mutedForeground} /> : null}
    </Pressable>
  );
}

function DocumentRows({
  docs,
  loading,
  error,
  onRetry,
  onSelect,
  pendingType,
}: {
  docs: DriverDocumentItem[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (item: DriverDocumentItem) => void;
  pendingType: string | null;
}) {
  if (loading) {
    return (
      <View className="bg-background px-4 py-3.5">
        <Text className="font-sans text-sm text-muted-foreground">Loading documents...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <Pressable onPress={onRetry} className="bg-background px-4 py-3.5 active:opacity-70">
        <Text className="font-sans text-sm text-muted-foreground">Could not load documents. Tap to retry.</Text>
      </Pressable>
    );
  }
  if (!docs.length) {
    return (
      <View className="bg-background px-4 py-3.5">
        <Text className="font-sans text-sm text-muted-foreground">No document checklist available</Text>
      </View>
    );
  }
  return (
    <>
      {docs.map((item) => {
        const doc = toDoc(item);
        return (
          <DocRow
            key={item.type}
            doc={doc}
            status={doc.status}
            pending={pendingType === item.type}
            onPress={() => onSelect(item)}
          />
        );
      })}
    </>
  );
}

const THEME_OPTS: { val: ThemeMode; label: string; icon: typeof Sun }[] = [
  { val: 'system', label: 'System', icon: Smartphone },
  { val: 'light', label: 'Light', icon: Sun },
  { val: 'dark', label: 'Dark', icon: Moon },
];

export default function Profile() {
  const { driver, signOut: authSignOut } = useAuth();
  const equipment = useDriverEquipment();
  const documents = useDriverDocuments();
  const { notify } = useNotifications();
  const truck = equipment.data?.truck ?? null;
  const trailer = equipment.data?.trailer ?? null;
  const driverName = driver?.fullName || driver?.username || 'Driver';
  const [prefs, setPrefs] = useState(NOTIFICATION_PREFS.filter((p) => p.key !== 'messages'));
  const { theme, setTheme, appLock, setAppLock } = useSettings();
  const offline = useOffline();
  const [bio, setBio] = useState<{ available: boolean; label: string }>({ available: false, label: 'Face ID' });
  const [uploadDoc, setUploadDoc] = useState<DriverDocumentItem | null>(null);
  const [uploadFile, setUploadFile] = useState<SelectedDocumentFile | undefined>();
  const [expiryDate, setExpiryDate] = useState('');
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  useEffect(() => {
    biometricAvailable().then(setBio);
  }, []);

  const toggle = (key: string) =>
    setPrefs((p) => p.map((x) => (x.key === key ? { ...x, on: !x.on } : x)));

  const openDocumentUpload = (item: DriverDocumentItem) => {
    setUploadFile(undefined);
    setExpiryDate(formatDateInput(item.expiryDate));
    setUploadDoc(item);
  };

  const submitDocument = async () => {
    if (!uploadDoc || uploadingType) return;
    const expiry = parseDateInput(expiryDate);
    if (expiryDate.trim() && expiry === undefined) {
      notify({ type: 'alert', title: 'Invalid expiry date', body: 'Use YYYY-MM-DD.' });
      return;
    }
    if (!uploadFile && expiry === undefined) return;

    const item = uploadDoc;
    setUploadingType(item.type);
    setUploadDoc(null);
    try {
      await uploadDriverDocument({ docType: item.type, expiryDate: expiry, file: uploadFile });
      await documents.refetch();
      notify({ type: 'success', title: 'Document updated', body: item.label });
    } catch {
      notify({ type: 'alert', title: 'Upload failed', body: `${item.label} was not updated. Try again.` });
    } finally {
      setUploadingType(null);
      setUploadFile(undefined);
    }
  };

  const signOut = () =>
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: authSignOut },
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
          <View className="size-16 items-center justify-center rounded-full" style={{ backgroundColor: C.border }}>
            <Text className="font-sans-semibold text-xl text-foreground">{initials(driverName)}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-sans-semibold text-xl text-foreground">{driverName}</Text>
            <Text className="font-sans text-sm text-muted-foreground">
              {driver?.carrierName ?? (driver?.carrierId ? `Carrier #${driver.carrierId}` : 'Driver')}
            </Text>
            <Text className="font-sans text-sm text-muted-foreground">
              Driver #{driver?.driverId ?? '—'}
              {driver?.username ? ` · ${driver.username}` : ''}
            </Text>
          </View>
        </View>

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
            <Text className="font-sans text-sm text-muted-foreground">Fuel, tolls, repairs</Text>
          </View>
          <ChevronRight size={18} color={C.mutedForeground} />
        </Pressable>

        {/* Driver documents */}
        <Section title="DRIVER & MEDICAL DOCUMENTS">
          <DocumentRows
            docs={documents.data?.driver ?? []}
            loading={documents.loading}
            error={documents.error}
            onRetry={documents.refetch}
            onSelect={openDocumentUpload}
            pendingType={uploadingType}
          />
        </Section>

        {/* Vehicle — real assigned equipment (/api/driver/equipment) */}
        <Section title="TRUCK & TRAILER">
          {truck ? (
            <View className="flex-row items-center gap-3 bg-background px-4 py-3.5">
              <View className="size-10 items-center justify-center rounded-2xl bg-accent">
                <Truck size={18} color={C.foreground} />
              </View>
              <View className="flex-1">
                <Text className="font-sans-medium text-base text-foreground">{truck.unit || 'Truck'}</Text>
                <Text className="font-sans text-sm text-muted-foreground">
                  {[truckMakeModel(truck), plateLabel(truck)].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
          ) : equipment.loading ? null : (
            <View className="bg-background px-4 py-3.5">
              <Text className="font-sans text-sm text-muted-foreground">No truck assigned</Text>
            </View>
          )}
          {trailer ? (
            <View className="flex-row items-center gap-3 bg-background px-4 py-3.5">
              <View className="size-10 items-center justify-center rounded-2xl bg-accent">
                <Truck size={18} color={C.foreground} />
              </View>
              <View className="flex-1">
                <Text className="font-sans-medium text-base text-foreground">{trailer.unit || 'Trailer'}</Text>
                <Text className="font-sans text-sm text-muted-foreground">
                  {[trailer.type, plateLabel(trailer)].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
          ) : equipment.loading ? null : (
            <View className="bg-background px-4 py-3.5">
              <Text className="font-sans text-sm text-muted-foreground">No trailer assigned</Text>
            </View>
          )}
        </Section>

        <Section title="VEHICLE DOCUMENTS">
          <DocumentRows
            docs={documents.data?.vehicle ?? []}
            loading={documents.loading}
            error={documents.error}
            onRetry={documents.refetch}
            onSelect={openDocumentUpload}
            pendingType={uploadingType}
          />
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
          {PERMISSIONS.filter((p) => p.key !== 'microphone').map((p) => {
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

      {/* Single-document upload; the server derives ownership from docType. */}
      <DocsFlowSheet
        visible={!!uploadDoc}
        required={uploadDoc ? [uploadDoc.type] : []}
        labels={uploadDoc ? { [uploadDoc.type]: uploadDoc.label } : {}}
        uploaded={uploadDoc && uploadFile ? [uploadDoc.type] : []}
        title={uploadDoc ? `Update ${uploadDoc.label}` : 'Update document'}
        onUpload={() => {}}
        onFileSelected={(_type, file) => setUploadFile(file)}
        expiryDate={expiryDate}
        onExpiryDateChange={setExpiryDate}
        canConfirm={!!expiryDate.trim()}
        confirmPending={!!uploadDoc && uploadingType === uploadDoc.type}
        onConfirm={submitDocument}
        onClose={() => setUploadDoc(null)}
      />
    </View>
  );
}
