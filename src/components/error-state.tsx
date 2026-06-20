import { Text, View } from 'react-native';
import { CloudOff, RefreshCw, type LucideIcon } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { C } from '@/lib/theme';

// Full-area "couldn't load" placeholder with a retry action. Drop into the
// body of a data screen when a query fails.
export function ErrorState({
  title = 'Couldn’t load',
  message = 'Check your connection and try again.',
  icon: Icon = CloudOff,
  onRetry,
}: {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  onRetry?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 py-16">
      <View className="size-16 items-center justify-center rounded-full bg-accent">
        <Icon size={28} color={C.mutedForeground} />
      </View>
      <View className="gap-1">
        <Text className="text-center font-sans-semibold text-lg text-foreground">{title}</Text>
        <Text className="text-center font-sans text-sm leading-5 text-muted-foreground">{message}</Text>
      </View>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          className="h-12 flex-row items-center gap-2 rounded-2xl bg-primary px-6 active:opacity-90"
        >
          <RefreshCw size={16} color={C.primaryForeground} />
          <Text className="font-sans-medium text-base text-primary-foreground">Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
