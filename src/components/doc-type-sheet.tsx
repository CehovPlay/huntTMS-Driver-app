import { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from '@/components/pressable';
import { C } from '@/lib/theme';

const DOC_TYPES = ['Proof of delivery', 'Bill of landing', 'Lumper fee', 'Other'];

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (type: string) => void;
};

export function DocTypeSheet({ visible, onClose, onConfirm }: Props) {
  const [picked, setPicked] = useState(DOC_TYPES[0]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <SafeAreaView edges={['bottom']} className="rounded-t-3xl bg-background">
        <View className="gap-4 px-5 pb-4 pt-3">
          <View className="h-1 w-10 self-center rounded-full bg-border" />
          <Text className="font-sans-semibold text-2xl text-foreground">Select document type</Text>

          <View className="gap-2">
            {DOC_TYPES.map((t) => {
              const active = picked === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setPicked(t)}
                  className="h-16 flex-row items-center justify-between rounded-2xl border px-4"
                  style={{
                    borderColor: active ? C.foreground : C.border,
                    backgroundColor: active ? C.accent : C.background,
                  }}
                >
                  <Text className="font-sans-medium text-base text-foreground">{t}</Text>
                  <View
                    className="size-5 items-center justify-center rounded-full border"
                    style={{ borderColor: active ? C.foreground : C.input }}
                  >
                    {active ? (
                      <View className="size-2.5 rounded-full" style={{ backgroundColor: C.foreground }} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => onConfirm(picked)}
            className="h-16 flex-row items-center justify-center rounded-2xl bg-primary active:opacity-90"
          >
            <Text className="font-sans-medium text-base text-primary-foreground">Confirm</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
