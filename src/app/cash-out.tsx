import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Check, CreditCard, Zap } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { C } from '@/lib/theme';
import { CASHOUT, money, type CashoutMethod } from '@/lib/earnings';

export default function CashOut() {
  const [method, setMethod] = useState<CashoutMethod>('instant');
  const [done, setDone] = useState(false);

  const selected = CASHOUT.methods.find((m) => m.id === method)!;
  const fee = Math.round(CASHOUT.available * selected.feePct);
  const receive = CASHOUT.available - fee;

  const confirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setDone(true);
  };

  if (done) {
    return (
      <View className="flex-1 bg-background">
        <SafeAreaView edges={['top', 'bottom']} className="flex-1">
          <View className="flex-1 items-center justify-center gap-4 px-8">
            <View className="size-20 items-center justify-center rounded-full" style={{ backgroundColor: `${C.teal}1A` }}>
              <Check size={40} color={C.teal} />
            </View>
            <Text className="text-center font-sans-bold text-2xl text-foreground">Cash out sent</Text>
            <Text className="text-center font-sans text-base text-muted-foreground">
              {money(receive)} is on its way to your {CASHOUT.destination.label.toLowerCase()} ····{' '}
              {CASHOUT.destination.last4}.
              {method === 'instant' ? ' Arrives in a few minutes.' : ' Arrives in 1–3 business days.'}
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
            Cash out
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerClassName="gap-5 p-4 pb-10" showsVerticalScrollIndicator={false}>
        {/* available amount */}
        <View className="items-center gap-1 rounded-3xl bg-background py-8">
          <Text className="font-sans-medium text-sm text-muted-foreground">Available to cash out</Text>
          <Text className="font-sans-bold text-foreground" style={{ fontSize: 44 }}>{money(CASHOUT.available)}</Text>
        </View>

        {/* method */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">PAYOUT SPEED</Text>
          <View className="gap-px overflow-hidden rounded-3xl bg-background">
            {CASHOUT.methods.map((m) => {
              const on = m.id === method;
              const mFee = Math.round(CASHOUT.available * m.feePct);
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setMethod(m.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  className="flex-row items-center gap-3 bg-background p-4 active:opacity-80"
                >
                  <View className="size-10 items-center justify-center rounded-2xl bg-accent">
                    {m.id === 'instant' ? <Zap size={18} color={C.foreground} /> : <CreditCard size={18} color={C.foreground} />}
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-medium text-base text-foreground">{m.label}</Text>
                    <Text className="font-sans text-sm text-muted-foreground">{m.sub}</Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="font-sans-medium text-sm text-foreground">{mFee ? `Fee ${money(mFee)}` : 'Free'}</Text>
                    <View
                      className="size-5 items-center justify-center rounded-full border-2"
                      style={{ borderColor: on ? C.primary : C.border, backgroundColor: on ? C.primary : 'transparent' }}
                    >
                      {on ? <Check size={12} color="#fafafa" /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* destination */}
        <View className="gap-2">
          <Text className="px-1 font-sans-medium text-sm text-muted-foreground">TO</Text>
          <View className="flex-row items-center gap-3 rounded-3xl bg-background p-4">
            <View className="size-10 items-center justify-center rounded-2xl bg-accent">
              <CreditCard size={18} color={C.foreground} />
            </View>
            <View className="flex-1">
              <Text className="font-sans-medium text-base text-foreground">{CASHOUT.destination.label}</Text>
              <Text className="font-sans text-sm text-muted-foreground">···· {CASHOUT.destination.last4}</Text>
            </View>
          </View>
        </View>

        {/* summary */}
        <View className="gap-3 rounded-3xl bg-background p-4">
          <View className="flex-row justify-between">
            <Text className="font-sans text-sm text-muted-foreground">Amount</Text>
            <Text className="font-sans-medium text-sm text-foreground">{money(CASHOUT.available)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-sans text-sm text-muted-foreground">Fee</Text>
            <Text className="font-sans-medium text-sm text-foreground">{fee ? `– ${money(fee)}` : 'Free'}</Text>
          </View>
          <View className="flex-row justify-between border-t border-border pt-3">
            <Text className="font-sans-semibold text-base text-foreground">You'll receive</Text>
            <Text className="font-sans-semibold text-base text-foreground">{money(receive)}</Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="bg-accent">
        <View className="px-4 pb-2 pt-2">
          <Pressable
            onPress={confirm}
            accessibilityRole="button"
            accessibilityLabel={`Cash out ${money(receive)}`}
            className="h-16 items-center justify-center rounded-2xl bg-primary active:opacity-90"
          >
            <Text className="font-sans-medium text-base text-primary-foreground">Cash out {money(receive)}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
