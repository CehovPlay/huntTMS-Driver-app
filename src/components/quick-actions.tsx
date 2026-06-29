import { useState } from 'react';
import { Text, View } from 'react-native';
import { ReceiptText } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { FormSheet } from '@/components/form-sheet';
import { ExpenseForm } from '@/components/expense-form';
import { haptics } from '@/lib/haptics';
import { C, shadowSm } from '@/lib/theme';

type Sheet = 'expense' | null;

// Quick actions for a load.
// `floating` = round FAB stack over the navigation map (links to the active trip); `inline` = a labelled
// button row inside Load Details (pass `load` to link a new expense to that specific load).
export function QuickActions({
  variant,
  load,
}: {
  variant: 'floating' | 'inline';
  load?: { id: number; label?: string };
}) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const open = (s: Sheet) => {
    haptics.light();
    setSheet(s);
  };
  const close = () => setSheet(null);

  const sheets = (
    <>
      <FormSheet visible={sheet === 'expense'} title="Add expense" onClose={close}>
        <ExpenseForm onClose={close} load={load} />
      </FormSheet>
    </>
  );

  if (variant === 'floating') {
    return (
      <>
        <View className="gap-2.5">
          <Pressable
            onPress={() => open('expense')}
            accessibilityRole="button"
            accessibilityLabel="Add expense"
            className="size-14 items-center justify-center rounded-full bg-background active:opacity-80"
            style={shadowSm}
          >
            <ReceiptText size={22} color={C.foreground} />
          </Pressable>
        </View>
        {sheets}
      </>
    );
  }

  return (
    <>
      <View className="flex-row gap-3">
        <Pressable
          onPress={() => open('expense')}
          accessibilityRole="button"
          accessibilityLabel="Add expense"
          className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-accent active:opacity-80"
        >
          <ReceiptText size={18} color={C.foreground} />
          <Text className="font-sans-medium text-sm text-foreground">Add expense</Text>
        </Pressable>
      </View>
      {sheets}
    </>
  );
}
