import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Paperclip, Plus, ReceiptText } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { EXPENSE_META, money, useExpenses } from '@/lib/expenses';
import { C } from '@/lib/theme';

export default function Expenses() {
  const { expenses, total } = useExpenses();

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
            Expenses
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerClassName="gap-5 p-4 pb-28" showsVerticalScrollIndicator={false}>
        {/* total */}
        <View className="items-center gap-1 rounded-3xl bg-background py-7">
          <Text className="font-sans-medium text-sm text-muted-foreground">Logged this week</Text>
          <Text className="font-sans-bold text-foreground" style={{ fontSize: 40 }}>{money(total)}</Text>
          <Text className="font-sans text-sm text-muted-foreground">{expenses.length} expenses</Text>
        </View>

        {expenses.length === 0 ? (
          <View className="items-center gap-2 py-16">
            <ReceiptText size={32} color={C.border} />
            <Text className="font-sans text-base text-muted-foreground">No expenses yet</Text>
          </View>
        ) : (
          <View className="gap-px overflow-hidden rounded-3xl bg-background">
            {expenses.map((e) => {
              const Icon = EXPENSE_META[e.category].icon;
              return (
                <View key={e.id} className="flex-row items-center gap-3 bg-background px-4 py-3.5">
                  <View className="size-10 items-center justify-center rounded-2xl bg-accent">
                    <Icon size={18} color={C.foreground} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-sans-medium text-base text-foreground">{e.category}</Text>
                      {e.receiptUri ? <Paperclip size={13} color={C.mutedForeground} /> : null}
                    </View>
                    <Text className="font-sans text-sm text-muted-foreground" numberOfLines={1}>
                      {e.date}
                      {e.note ? ` · ${e.note}` : ''}
                      {e.loadId ? ` · #${e.loadId}` : ''}
                    </Text>
                  </View>
                  <Text className="font-sans-semibold text-base text-foreground">{money(e.amount)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="absolute inset-x-0 bottom-0">
        <View className="px-4 pb-2 pt-2">
          <Pressable
            onPress={() => router.push('/add-expense')}
            accessibilityRole="button"
            accessibilityLabel="Add expense"
            className="h-16 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-90"
          >
            <Plus size={20} color={C.primaryForeground} />
            <Text className="font-sans-medium text-base text-primary-foreground">Add expense</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
