import { useState } from 'react';
import { Text, View } from 'react-native';
import { ReceiptText, TriangleAlert } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { FormSheet } from '@/components/form-sheet';
import { IssueForm } from '@/components/issue-form';
import { ExpenseForm } from '@/components/expense-form';
import { haptics } from '@/lib/haptics';
import { C, shadowSm } from '@/lib/theme';

type Sheet = 'issue' | 'expense' | null;

// Quick actions for the active trip: report a breakdown / add an expense.
// `floating` = round FAB stack over the navigation map; `inline` = a labelled
// button row inside Load Details. Both open the same modal forms.
export function QuickActions({ variant }: { variant: 'floating' | 'inline' }) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const open = (s: Sheet) => {
    haptics.light();
    setSheet(s);
  };
  const close = () => setSheet(null);

  const sheets = (
    <>
      <FormSheet visible={sheet === 'issue'} title="Report a problem" onClose={close}>
        <IssueForm onClose={close} />
      </FormSheet>
      <FormSheet visible={sheet === 'expense'} title="Add expense" onClose={close}>
        <ExpenseForm onClose={close} />
      </FormSheet>
    </>
  );

  if (variant === 'floating') {
    return (
      <>
        <View className="gap-2.5">
          <Pressable
            onPress={() => open('issue')}
            accessibilityRole="button"
            accessibilityLabel="Report a problem"
            className="size-14 items-center justify-center rounded-full bg-background active:opacity-80"
            style={shadowSm}
          >
            <TriangleAlert size={22} color={C.destructive} />
          </Pressable>
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
          onPress={() => open('issue')}
          accessibilityRole="button"
          accessibilityLabel="Report a problem"
          className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-80"
          style={{ backgroundColor: `${C.destructive}14` }}
        >
          <TriangleAlert size={18} color={C.destructive} />
          <Text className="font-sans-medium text-sm" style={{ color: C.destructive }}>
            Report problem
          </Text>
        </Pressable>
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
