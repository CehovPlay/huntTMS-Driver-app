import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { ExpenseForm } from '@/components/expense-form';
import { C } from '@/lib/theme';

export default function AddExpense() {
  return (
    <View className="flex-1 bg-accent">
      <SafeAreaView edges={['top']} className="border-b border-border bg-background">
        <View className="h-12 flex-row items-center px-4">
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back" className="flex-row items-center gap-1.5 active:opacity-60">
            <ArrowLeft size={20} color={C.foreground} />
            <Text className="font-sans-medium text-base text-foreground">Back</Text>
          </Pressable>
          <Text pointerEvents="none" className="absolute inset-x-0 text-center font-sans-semibold text-base text-foreground">
            Add expense
          </Text>
        </View>
      </SafeAreaView>

      <ExpenseForm onClose={() => router.back()} />
    </View>
  );
}
