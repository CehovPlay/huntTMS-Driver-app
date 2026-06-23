import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AlertTriangle, Camera, Check, TriangleAlert, X } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { SuccessCheck } from '@/components/success-check';
import { haptics } from '@/lib/haptics';
import { useNotifications } from '@/lib/notifications';
import { C } from '@/lib/theme';

const TYPES = ['Breakdown', 'Flat tire', 'Engine', 'Accident', 'Other'] as const;
type IssueType = (typeof TYPES)[number];

// Breakdown / issue report — shared by the /report-issue route and the
// ReportIssueSheet modal (Load Details + Navigation quick actions).
// Photos come from the driver's own camera/library; location is the phone's GPS.
export function IssueForm({ onClose }: { onClose: () => void }) {
  const { notify } = useNotifications();
  const [type, setType] = useState<IssueType>('Breakdown');
  const [cantDrive, setCantDrive] = useState(true);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [detailsFocus, setDetailsFocus] = useState(false);

  const addPhoto = async () => {
    if (photos.length >= 3) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      if (!res.canceled && res.assets[0]?.uri) setPhotos((p) => [...p, res.assets[0].uri]);
    } catch {}
  };

  const submit = () => {
    if (busy) return;
    haptics.warning();
    setBusy(true);
    // Brief sending state (real API would resolve here).
    setTimeout(() => {
      notify({
        type: 'alert',
        title: `${type} reported`,
        body: cantDrive ? 'Sent with your location — truck cannot continue.' : 'Sent with your location.',
      });
      setBusy(false);
      setDone(true);
    }, 650);
  };

  if (done) {
    return (
      <View className="flex-1">
        <View className="flex-1 items-center justify-center gap-4 px-8 py-10">
          <SuccessCheck size={80} color={C.amber} iconColor="#171717" />
          <Text className="text-center font-sans-bold text-2xl text-foreground">Issue reported</Text>
          <Text className="text-center font-sans text-base leading-6 text-muted-foreground">
            Your report{cantDrive ? ' (truck down)' : ''} was sent with your current location. Dispatch and the safety
            team will reach out shortly.
          </Text>
        </View>
        <SafeAreaView edges={['bottom']}>
          <View className="px-4 pb-2 pt-2">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Done"
              className="h-16 items-center justify-center rounded-2xl bg-primary active:opacity-90"
            >
              <Text className="font-sans-medium text-base text-primary-foreground">Done</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-5 p-4 pb-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center gap-3 rounded-3xl p-4" style={{ backgroundColor: `${C.destructive}14` }}>
          <AlertTriangle size={20} color={C.destructive} />
          <Text className="flex-1 font-sans-medium text-sm" style={{ color: C.destructive }}>
            For a medical or roadside emergency, call 911 first.
          </Text>
        </View>

        {/* type */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">WHAT HAPPENED</Text>
          <View className="flex-row flex-wrap gap-2">
            {TYPES.map((t) => {
              const on = type === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  className="items-center justify-center rounded-2xl px-4 active:opacity-70"
                  style={{ height: 48, backgroundColor: on ? C.primary : C.background, borderWidth: on ? 0 : 1, borderColor: C.border }}
                >
                  <Text className="font-sans-medium text-sm" style={{ color: on ? C.primaryForeground : C.foreground }}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* can't drive */}
        <Pressable
          onPress={() => setCantDrive((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ checked: cantDrive }}
          className="flex-row items-center gap-3 rounded-3xl bg-background p-4 active:opacity-80"
          style={{ borderWidth: 1, borderColor: C.border }}
        >
          <View className="size-10 items-center justify-center rounded-2xl bg-accent">
            <TriangleAlert size={18} color={cantDrive ? C.destructive : C.mutedForeground} />
          </View>
          <View className="flex-1">
            <Text className="font-sans-medium text-base text-foreground">Truck can’t continue</Text>
            <Text className="font-sans text-sm text-muted-foreground">Marks the load as blocked for dispatch</Text>
          </View>
          <View
            className="size-6 items-center justify-center rounded-md"
            style={{ backgroundColor: cantDrive ? C.destructive : 'transparent', borderWidth: cantDrive ? 0 : 1.5, borderColor: C.border }}
          >
            {cantDrive ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
          </View>
        </Pressable>

        {/* photos */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">PHOTOS</Text>
          {photos.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {photos.map((uri, i) => (
                <View key={i} className="overflow-hidden rounded-2xl" style={{ width: 96, height: 96 }}>
                  <Image source={{ uri }} style={{ width: 96, height: 96 }} resizeMode="cover" />
                  <Pressable
                    onPress={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                    className="absolute right-1 top-1 size-7 items-center justify-center rounded-full active:opacity-70"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <X size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          {photos.length < 3 ? (
            <Pressable
              onPress={addPhoto}
              accessibilityRole="button"
              accessibilityLabel="Add photo"
              className="h-16 flex-row items-center justify-center gap-2 rounded-2xl bg-background active:opacity-80"
              style={{ borderWidth: 1, borderColor: C.border }}
            >
              <Camera size={18} color={C.foreground} />
              <Text className="font-sans-medium text-base text-foreground">Add photo</Text>
            </Pressable>
          ) : null}
        </View>

        {/* comment */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">DETAILS</Text>
          <View className="rounded-3xl bg-background p-4" style={{ borderWidth: 1.5, borderColor: detailsFocus ? C.foreground : C.border }}>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Describe what happened, anything dispatch should know…"
              placeholderTextColor={C.mutedForeground}
              multiline
              className="font-sans text-base text-foreground"
              style={{ minHeight: 96, textAlignVertical: 'top' }}
              onFocus={() => setDetailsFocus(true)}
              onBlur={() => setDetailsFocus(false)}
            />
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']}>
        <View className="px-4 pb-2 pt-2">
          <Pressable
            onPress={submit}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Send report"
            className="h-16 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-90"
            style={{ backgroundColor: C.destructive, opacity: busy ? 0.85 : 1 }}
          >
            {busy ? <ActivityIndicator size="small" color="#fff" /> : null}
            <Text className="font-sans-medium text-base text-white">{busy ? 'Sending…' : 'Send report to dispatch'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
