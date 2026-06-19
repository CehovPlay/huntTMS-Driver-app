import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, ChevronRight, ScanLine, Upload } from 'lucide-react-native';

import { Logo } from '@/components/logo';
import { Pressable } from '@/components/pressable';
import { DocTypeSheet } from '@/components/doc-type-sheet';
import { C } from '@/lib/theme';

type Row = { icon: typeof Camera; label: string; onPress: () => void };

async function pickFromGallery(type?: string) {
  const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
  if (!res.canceled && res.assets[0]?.uri) {
    router.push({ pathname: '/confirm-scan', params: { uri: res.assets[0].uri, type: type ?? '' } });
  }
}

function OptionRow({ icon: Icon, label, onPress }: Row) {
  return (
    <Pressable
      onPress={onPress}
      className="h-16 flex-row items-center gap-3 rounded-2xl bg-accent px-4 active:opacity-80"
    >
      <Icon size={20} color={C.foreground} />
      <Text className="flex-1 font-sans-medium text-base text-foreground">{label}</Text>
      <ChevronRight size={18} color={C.mutedForeground} />
    </Pressable>
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <View className="gap-3 rounded-3xl bg-background p-4">
      <Text className="font-sans-semibold text-xl text-foreground">{title}</Text>
      {rows.map((r) => (
        <OptionRow key={r.label} {...r} />
      ))}
    </View>
  );
}

export default function UploadScreen() {
  const [sheet, setSheet] = useState(false);
  // which "document" action is pending a type selection
  const [pending, setPending] = useState<'scan' | 'gallery' | null>(null);

  const openDocType = (action: 'scan' | 'gallery') => {
    setPending(action);
    setSheet(true);
  };

  const onConfirmType = (type: string) => {
    setSheet(false);
    if (pending === 'scan') router.push({ pathname: '/scan', params: { type } });
    else if (pending === 'gallery') pickFromGallery(type);
    setPending(null);
  };

  return (
    <View className="flex-1 bg-accent">
      {/* Header */}
      <SafeAreaView edges={['top']} className="rounded-b-3xl border-b border-border bg-background">
        <View className="flex-row items-center gap-2 px-4 pb-3 pt-3">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            className="size-12 items-center justify-center rounded-2xl active:bg-accent"
          >
            <ArrowLeft size={20} color={C.foreground} />
          </Pressable>
          <View className="flex-1">
            <Logo height={24} />
          </View>
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            className="size-12 items-center justify-center rounded-full active:opacity-70"
            style={{ backgroundColor: C.primary }}
          >
            <Text className="font-sans-semibold text-xs text-primary-foreground">DC</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Body */}
      <ScrollView contentContainerClassName="gap-4 p-4" showsVerticalScrollIndicator={false}>
        <Section
          title="Upload document"
          rows={[
            { icon: ScanLine, label: 'Scan file', onPress: () => openDocType('scan') },
            { icon: Upload, label: 'From gallery', onPress: () => openDocType('gallery') },
          ]}
        />
        <Section
          title="Upload image"
          rows={[
            { icon: Camera, label: 'Camera', onPress: () => router.push('/scan') },
            { icon: Upload, label: 'From gallery', onPress: () => pickFromGallery() },
          ]}
        />
      </ScrollView>

      <DocTypeSheet
        visible={sheet}
        onClose={() => {
          setSheet(false);
          setPending(null);
        }}
        onConfirm={onConfirmType}
      />
    </View>
  );
}
