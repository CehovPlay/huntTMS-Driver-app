import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text, View } from 'react-native';
import { X } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { C } from '@/lib/theme';

// Bottom-sheet modal shell (same pattern as docs-flow-sheet): dimmed overlay,
// rounded top, drag handle, title + close. Definite height so the embedded
// flex-1 form fills and scrolls; lifts above the keyboard for text inputs.
// Used for the Breakdown and Add-expense quick actions over Load Details /
// Navigation.
export function FormSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1 justify-end" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        <View className="rounded-t-3xl bg-background" style={{ height: '90%' }}>
          <View className="items-center py-3.5">
            <View className="h-1 w-9 rounded-full" style={{ backgroundColor: C.border }} />
          </View>
          <View className="flex-row items-center gap-2 px-4 pb-1">
            <Text className="flex-1 font-sans-semibold text-2xl text-foreground">{title}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="-mr-1 size-9 items-center justify-center rounded-full active:opacity-60"
            >
              <X size={20} color={C.mutedForeground} />
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
