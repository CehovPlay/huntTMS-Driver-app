import { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Building2, CircleDollarSign, Fuel, PackageOpen, ParkingCircle, Plus, ReceiptText, Shield, Wrench } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { EmptyState } from '@/components/empty-state';
import {
  expenseCategoryLabel,
  money,
  useDriverExpenses,
  type DriverExpense,
  type ExpenseCategoryName,
} from '@/lib/api/expenses';
import { C, tnum } from '@/lib/theme';

const ICONS: Record<ExpenseCategoryName, typeof Fuel> = {
  FUEL: Fuel,
  TRUCK_LEASE: PackageOpen,
  MAINTENANCE: Wrench,
  REPAIR: Wrench,
  TOLL: CircleDollarSign,
  OFFICE: Building2,
  INSURANCE: Shield,
  PARKING: ParkingCircle,
  LUMPER: PackageOpen,
  PERMIT: ReceiptText,
  OTHER: ReceiptText,
};

function expenseDate(e: DriverExpense): string {
  if (!e.expenseDate) return 'Today';
  const d = new Date(e.expenseDate);
  return Number.isNaN(d.getTime()) ? String(e.expenseDate) : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Expenses() {
  const q = useDriverExpenses();
  const expenses = q.data ?? [];
  const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  useFocusEffect(
    useCallback(() => {
      q.refetch();
    }, [q.refetch]),
  );

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
        <View className="items-center gap-1 rounded-3xl bg-background py-7">
          <Text className="font-sans-medium text-sm text-muted-foreground">Logged expenses</Text>
          <Text className="font-sans-bold text-foreground" style={[{ fontSize: 40 }, tnum]}>{money(total)}</Text>
          <Text className="font-sans text-sm text-muted-foreground">{expenses.length} expenses</Text>
        </View>

        {q.loading ? (
          <Text className="py-6 text-center font-sans text-base text-muted-foreground">Loading expenses...</Text>
        ) : q.error ? (
          <Pressable onPress={q.refetch} className="rounded-3xl bg-background p-5 active:opacity-70">
            <Text className="text-center font-sans text-base text-muted-foreground">Could not load expenses. Tap to retry.</Text>
          </Pressable>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No expenses yet"
            subtitle="Log fuel, tolls, parking and more."
            actionLabel="Add expense"
            onAction={() => router.push('/add-expense')}
          />
        ) : (
          <View className="gap-px overflow-hidden rounded-3xl bg-background">
            {expenses.map((e) => {
              const Icon = ICONS[e.category] ?? ReceiptText;
              const status = e.status ?? 'NEEDS_RECEIPT';
              return (
                <View key={e.id} className="flex-row items-center gap-3 bg-background px-4 py-3.5">
                  <View className="size-10 items-center justify-center rounded-2xl bg-accent">
                    <Icon size={18} color={C.foreground} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-sans-medium text-base text-foreground">{expenseCategoryLabel(e.category)}</Text>
                      <View className="rounded-full bg-accent px-2 py-0.5">
                        <Text className="font-sans-medium text-[10px] text-muted-foreground">{String(status).replaceAll('_', ' ')}</Text>
                      </View>
                    </View>
                    <Text className="font-sans text-sm text-muted-foreground" numberOfLines={1}>
                      {expenseDate(e)}
                      {e.notes ? ` · ${e.notes}` : ''}
                      {e.loadId ? ` · #${e.loadId}` : ''}
                    </Text>
                  </View>
                  <Text className="font-sans-semibold text-base text-foreground" style={tnum}>{money(e.amount)}</Text>
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
