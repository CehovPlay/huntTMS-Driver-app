import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Check, ClipboardCheck, TriangleAlert } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { haptics } from '@/lib/haptics';
import { C } from '@/lib/theme';
import { DVIR_ALL_ITEMS, DVIR_SECTIONS } from '@/lib/dvir';

type ItemState = 'ok' | 'defect';

export default function Dvir() {
  const [type, setType] = useState<'Pre-trip' | 'Post-trip'>('Pre-trip');
  const [odometer, setOdometer] = useState('');
  const [states, setStates] = useState<Record<string, ItemState>>({});
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);

  const defects = useMemo(
    () => DVIR_ALL_ITEMS.filter((i) => states[i] === 'defect'),
    [states],
  );
  const safe = defects.length === 0;

  const submit = () => {
    haptics.success();
    setDone(true);
  };

  if (done) {
    return (
      <View className="flex-1 bg-background">
        <SafeAreaView edges={['top', 'bottom']} className="flex-1">
          <View className="flex-1 items-center justify-center gap-4 px-8">
            <View
              className="size-20 items-center justify-center rounded-full"
              style={{ backgroundColor: `${safe ? C.teal : C.amber}1A` }}
            >
              {safe ? <Check size={40} color={C.teal} /> : <TriangleAlert size={40} color={C.amber} />}
            </View>
            <Text className="text-center font-sans-bold text-2xl text-foreground">Inspection submitted</Text>
            <Text className="text-center font-sans text-base text-muted-foreground">
              {type} report logged{odometer ? ` at ${odometer} mi` : ''}.{' '}
              {safe
                ? 'No defects — vehicle is safe to operate.'
                : `${defects.length} defect${defects.length > 1 ? 's' : ''} reported to your fleet manager.`}
            </Text>
          </View>
          <View className="px-4 pb-2">
            <Pressable
              onPress={() => router.back()}
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
    <View className="flex-1 bg-accent">
      <SafeAreaView edges={['top']} className="border-b border-border bg-background">
        <View className="h-12 flex-row items-center px-4">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="flex-row items-center gap-1.5 active:opacity-60"
          >
            <ArrowLeft size={20} color={C.foreground} />
            <Text className="font-sans-medium text-base text-foreground">Back</Text>
          </Pressable>
          <Text pointerEvents="none" className="absolute inset-x-0 text-center font-sans-semibold text-base text-foreground">
            Vehicle inspection
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerClassName="gap-5 p-4 pb-10" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* type toggle */}
        <View className="h-16 flex-row items-center rounded-2xl bg-background p-1">
          {(['Pre-trip', 'Post-trip'] as const).map((t) => {
            const on = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                className="h-full flex-1 items-center justify-center rounded-xl"
                style={{ backgroundColor: on ? C.primary : 'transparent' }}
              >
                <Text className="font-sans-medium text-sm" style={{ color: on ? '#fafafa' : C.mutedForeground }}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* odometer */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">ODOMETER</Text>
          <View className="flex-row items-center gap-2 rounded-3xl bg-background px-4" style={{ height: 56 }}>
            <TextInput
              value={odometer}
              onChangeText={(t) => setOdometer(t.replace(/[^0-9]/g, ''))}
              placeholder="Current mileage"
              placeholderTextColor={C.mutedForeground}
              keyboardType="number-pad"
              className="flex-1 font-sans text-base text-foreground"
              style={{ paddingVertical: 0 }}
            />
            <Text className="font-sans text-sm text-muted-foreground">mi</Text>
          </View>
        </View>

        {/* checklist */}
        {DVIR_SECTIONS.map((section) => (
          <View key={section.title} className="gap-2">
            <Text className="px-1 font-sans-medium text-sm text-muted-foreground">{section.title.toUpperCase()}</Text>
            <View className="gap-px overflow-hidden rounded-3xl bg-background">
              {section.items.map((item) => {
                const st = states[item] ?? 'ok';
                return (
                  <View key={item} className="flex-row items-center gap-3 bg-background px-4 py-3">
                    <Text className="flex-1 font-sans-medium text-base text-foreground">{item}</Text>
                    {(['ok', 'defect'] as const).map((v) => {
                      const active = st === v;
                      const color = v === 'ok' ? C.teal : C.destructive;
                      return (
                        <Pressable
                          key={v}
                          onPress={() => setStates((s) => ({ ...s, [item]: v }))}
                          accessibilityRole="button"
                          accessibilityLabel={`${item} ${v === 'ok' ? 'OK' : 'defect'}`}
                          accessibilityState={{ selected: active }}
                          hitSlop={6}
                          className="rounded-full px-3"
                          style={{
                            height: 34,
                            justifyContent: 'center',
                            backgroundColor: active ? color : C.accent,
                          }}
                        >
                          <Text
                            className="font-sans-medium text-xs"
                            style={{ color: active ? '#ffffff' : C.mutedForeground }}
                          >
                            {v === 'ok' ? 'OK' : 'Defect'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* defect notes (only when something is flagged) */}
        {defects.length > 0 ? (
          <View className="gap-2">
            <Text className="px-1 font-sans-medium text-sm text-muted-foreground">DEFECT NOTES</Text>
            <View className="rounded-3xl bg-background p-4">
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={`Describe the ${defects.length} defect${defects.length > 1 ? 's' : ''}…`}
                placeholderTextColor={C.mutedForeground}
                multiline
                className="font-sans text-base text-foreground"
                style={{ minHeight: 72, textAlignVertical: 'top' }}
              />
            </View>
          </View>
        ) : null}

        {/* status summary */}
        <View
          className="flex-row items-center gap-3 rounded-3xl p-4"
          style={{ backgroundColor: `${safe ? C.teal : C.amber}14` }}
        >
          {safe ? <ClipboardCheck size={20} color={C.teal} /> : <TriangleAlert size={20} color={C.amber} />}
          <Text className="flex-1 font-sans-medium text-sm" style={{ color: safe ? C.teal : '#b45309' }}>
            {safe
              ? 'No defects found. Vehicle is safe to operate.'
              : `${defects.length} defect${defects.length > 1 ? 's' : ''} flagged — must be reviewed before operating.`}
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="bg-accent">
        <View className="px-4 pb-2 pt-2">
          <Pressable
            onPress={submit}
            accessibilityRole="button"
            accessibilityLabel="Submit inspection"
            className="h-16 items-center justify-center rounded-2xl bg-primary active:opacity-90"
          >
            <Text className="font-sans-medium text-base text-primary-foreground">Submit inspection</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
