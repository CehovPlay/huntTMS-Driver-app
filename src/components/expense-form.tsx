import { useState } from 'react';
import { Image, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, X } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { haptics } from '@/lib/haptics';
import { EXPENSE_CATEGORIES, EXPENSE_META, useExpenses, type ExpenseCategory } from '@/lib/expenses';
import { CURRENT_LOAD } from '@/lib/mock';
import { C } from '@/lib/theme';

// Add-expense form — shared by the /add-expense route and the AddExpenseSheet
// modal. Receipt photo comes from the driver's own camera/library.
export function ExpenseForm({ onClose }: { onClose: () => void }) {
  const { add } = useExpenses();
  const [category, setCategory] = useState<ExpenseCategory>('Fuel');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [linkLoad, setLinkLoad] = useState(true);
  const [receiptUri, setReceiptUri] = useState<string | undefined>(undefined);

  const value = parseFloat(amount || '0');
  const valid = value > 0;

  const pickReceipt = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      if (!res.canceled && res.assets[0]?.uri) setReceiptUri(res.assets[0].uri);
    } catch {}
  };

  const save = () => {
    if (!valid) return;
    haptics.success();
    add({
      category,
      amount: Math.round(value * 100) / 100,
      date: 'Today',
      note: note.trim() || undefined,
      loadId: linkLoad ? CURRENT_LOAD.reference.replace(/^#/, '') : undefined,
      receiptUri,
    });
    onClose();
  };

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-5 p-4 pb-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* amount */}
        <View className="items-center gap-1.5 rounded-3xl bg-background py-6">
          <Text className="font-sans-medium text-xs uppercase tracking-wide text-muted-foreground">Amount</Text>
          <View className="flex-row items-baseline justify-center">
            <Text className="font-sans-semibold" style={{ fontSize: 24, color: C.mutedForeground, marginRight: 2 }}>$</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor={C.mutedForeground}
              keyboardType="decimal-pad"
              textAlign="center"
              className="font-sans-bold text-foreground"
              style={{ fontSize: 44, minWidth: 64, paddingVertical: 0 }}
            />
          </View>
        </View>

        {/* category */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">CATEGORY</Text>
          <View className="flex-row flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((c) => {
              const on = category === c;
              const Icon = EXPENSE_META[c].icon;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  className="flex-row items-center gap-2 rounded-2xl px-4 active:opacity-70"
                  style={{ height: 48, backgroundColor: on ? C.primary : C.background }}
                >
                  <Icon size={16} color={on ? C.primaryForeground : C.foreground} />
                  <Text className="font-sans-medium text-sm" style={{ color: on ? C.primaryForeground : C.foreground }}>
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* note */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">NOTE</Text>
          <View className="rounded-3xl bg-background px-4" style={{ minHeight: 56, justifyContent: 'center' }}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Pilot #482 · 96 gal"
              placeholderTextColor={C.mutedForeground}
              className="font-sans text-base text-foreground"
              style={{ paddingVertical: 16 }}
            />
          </View>
        </View>

        {/* link to current load */}
        <Pressable
          onPress={() => setLinkLoad((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ checked: linkLoad }}
          className="flex-row items-center gap-3 rounded-3xl bg-background p-4 active:opacity-80"
        >
          <View
            className="size-6 items-center justify-center rounded-md"
            style={{ backgroundColor: linkLoad ? C.primary : 'transparent', borderWidth: linkLoad ? 0 : 1.5, borderColor: C.border }}
          >
            {linkLoad ? <Check size={14} color={C.primaryForeground} strokeWidth={3} /> : null}
          </View>
          <Text className="flex-1 font-sans-medium text-base text-foreground">
            Link to load #{CURRENT_LOAD.reference.replace(/^#/, '')}
          </Text>
        </Pressable>

        {/* receipt */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">RECEIPT</Text>
          {receiptUri ? (
            <View className="overflow-hidden rounded-3xl bg-background">
              <Image source={{ uri: receiptUri }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
              <Pressable
                onPress={() => setReceiptUri(undefined)}
                accessibilityRole="button"
                accessibilityLabel="Remove receipt"
                className="absolute right-3 top-3 size-9 items-center justify-center rounded-full active:opacity-70"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              >
                <X size={18} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={pickReceipt}
              accessibilityRole="button"
              accessibilityLabel="Attach receipt"
              className="h-16 flex-row items-center justify-center gap-2 rounded-3xl bg-background active:opacity-80"
              style={{ borderWidth: 1, borderColor: C.border }}
            >
              <Camera size={18} color={C.foreground} />
              <Text className="font-sans-medium text-base text-foreground">Attach receipt photo</Text>
            </Pressable>
          )}
        </View>
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
            <Text className="font-sans-medium text-base text-primary-foreground">Save expense</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
