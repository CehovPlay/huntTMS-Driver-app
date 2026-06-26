import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, Check, CircleDollarSign, Fuel, PackageOpen, ParkingCircle, ReceiptText, Shield, Wrench } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { SuccessCheck } from '@/components/success-check';
import { haptics } from '@/lib/haptics';
import {
  EXPENSE_CATEGORY_OPTIONS,
  createDriverExpense,
  money,
  type ExpenseCategoryName,
} from '@/lib/api/expenses';
import { useDriverLoads } from '@/lib/api/use-api-query';
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

// Add-expense form — shared by the /add-expense route and the AddExpenseSheet modal.
export function ExpenseForm({ onClose }: { onClose: () => void }) {
  const loads = useDriverLoads();
  const activeLoad = loads.data?.activeLoad;
  const [category, setCategory] = useState<ExpenseCategoryName>('FUEL');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [linkLoad, setLinkLoad] = useState(true);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [focus, setFocus] = useState<'amount' | 'note' | null>(null);

  const value = parseFloat(amount || '0');
  const valid = value > 0 && !saving;
  const linkedLoadId = linkLoad && activeLoad ? Number(activeLoad.id) : null;

  // Auto-dismiss shortly after the success confirmation.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(onClose, 1100);
    return () => clearTimeout(t);
  }, [done, onClose]);

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setError(false);
    try {
      await createDriverExpense({
        category,
        amount: Math.round(value * 100) / 100,
        notes: note.trim() || null,
        loadId: Number.isFinite(linkedLoadId) ? linkedLoadId : null,
      });
      haptics.success();
      setDone(true);
    } catch {
      setError(true);
      haptics.error();
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <SuccessCheck size={80} />
        <Text className="text-center font-sans-bold text-2xl text-foreground">Expense saved</Text>
        <Text className="text-center font-sans text-base text-muted-foreground" style={tnum}>
          {money(value)} · {category}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-5 p-4 pb-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* amount */}
        <View className="items-center gap-1.5 rounded-3xl bg-background py-6" style={{ borderWidth: 1.5, borderColor: focus === 'amount' ? C.foreground : C.border }}>
          <Text className="font-sans-medium text-xs uppercase tracking-wide text-muted-foreground">Amount</Text>
          <View className="w-full flex-row items-center justify-center">
            <Text className="font-sans-semibold" style={{ fontSize: 28, color: C.mutedForeground, marginRight: 2 }}>$</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor={C.mutedForeground}
              keyboardType="decimal-pad"
              textAlign="center"
              className="font-sans-bold text-foreground"
              style={[{ fontSize: 44, minWidth: 80, paddingVertical: 0, textAlign: 'center' }, tnum]}
              onFocus={() => setFocus('amount')}
              onBlur={() => setFocus(null)}
            />
          </View>
        </View>

        {/* category */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">CATEGORY</Text>
          <View className="flex-row flex-wrap gap-2">
            {EXPENSE_CATEGORY_OPTIONS.map((c) => {
              const on = category === c.name;
              const Icon = ICONS[c.name] ?? ReceiptText;
              return (
                <Pressable
                  key={c.name}
                  onPress={() => setCategory(c.name)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  className="flex-row items-center gap-2 rounded-2xl px-4 active:opacity-70"
                  style={{ height: 48, backgroundColor: on ? C.primary : C.background, borderWidth: on ? 0 : 1, borderColor: C.border }}
                >
                  <Icon size={16} color={on ? C.primaryForeground : C.foreground} />
                  <Text className="font-sans-medium text-sm" style={{ color: on ? C.primaryForeground : C.foreground }}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* note */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">NOTE</Text>
          <View className="rounded-3xl bg-background px-4" style={{ minHeight: 56, justifyContent: 'center', borderWidth: 1.5, borderColor: focus === 'note' ? C.foreground : C.border }}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Pilot #482 · 96 gal"
              placeholderTextColor={C.mutedForeground}
              className="font-sans text-base text-foreground"
              style={{ paddingVertical: 16 }}
              onFocus={() => setFocus('note')}
              onBlur={() => setFocus(null)}
            />
          </View>
        </View>

        {/* link to current load */}
        <Pressable
          onPress={() => activeLoad && setLinkLoad((v) => !v)}
          disabled={!activeLoad}
          accessibilityRole="button"
          accessibilityState={{ checked: linkLoad }}
          className="flex-row items-center gap-3 rounded-3xl bg-background p-4 active:opacity-80"
          style={{ borderWidth: 1, borderColor: C.border, opacity: activeLoad ? 1 : 0.55 }}
        >
          <View
            className="size-6 items-center justify-center rounded-md"
            style={{ backgroundColor: linkLoad ? C.primary : 'transparent', borderWidth: linkLoad ? 0 : 1.5, borderColor: C.border }}
          >
            {linkLoad ? <Check size={14} color={C.primaryForeground} strokeWidth={3} /> : null}
          </View>
          <Text className="flex-1 font-sans-medium text-base text-foreground">
            {activeLoad ? `Link to load #${activeLoad.id}` : 'No active load to link'}
          </Text>
        </Pressable>

        <View className="rounded-3xl bg-background p-4" style={{ borderWidth: 1, borderColor: C.border }}>
          <Text className="font-sans-medium text-base text-foreground">Receipt needed later</Text>
          <Text className="mt-1 font-sans text-sm text-muted-foreground">
            This milestone creates the expense only. It will show as NEEDS RECEIPT until receipt upload is wired.
          </Text>
        </View>

        {error ? (
          <Text className="px-1 text-center font-sans-medium text-sm" style={{ color: C.destructive }}>
            Expense was not saved. Check the details and try again.
          </Text>
        ) : null}
      </ScrollView>

      <SafeAreaView edges={['bottom']}>
        <View className="px-4 pb-2 pt-2">
          <Pressable
            onPress={save}
            disabled={!valid}
            accessibilityRole="button"
            accessibilityLabel="Save expense"
            className="h-16 items-center justify-center rounded-2xl bg-primary"
            style={{ opacity: valid ? 1 : 0.4 }}
          >
            <Text className="font-sans-medium text-base text-primary-foreground">{saving ? 'Saving...' : 'Save expense'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
