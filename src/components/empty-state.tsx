import type { ComponentType } from 'react';
import { Text, View } from 'react-native';

import { Appear } from '@/components/appear';
import { Pressable } from '@/components/pressable';
import { C } from '@/lib/theme';

// Premium empty state: icon in a soft circle, title, optional subtitle + a
// single action. Consistent across loads / chat / expenses / notifications.
export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: ComponentType<{ size?: number; color?: string }>;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Appear className="flex-1 items-center justify-center gap-4 px-10 py-16">
      <View className="size-24 items-center justify-center">
        {/* faint outer ring for depth */}
        <View className="absolute size-24 rounded-full" style={{ borderWidth: 1, borderColor: C.border, opacity: 0.6 }} />
        <View className="size-16 items-center justify-center rounded-full bg-accent">
          <Icon size={26} color={C.mutedForeground} />
        </View>
      </View>
      <View className="gap-1.5">
        <Text className="text-center font-sans-semibold text-lg text-foreground">{title}</Text>
        {subtitle ? (
          <Text className="text-center font-sans text-sm leading-5 text-muted-foreground">{subtitle}</Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          className="mt-1 h-11 items-center justify-center rounded-2xl bg-primary px-6 active:opacity-90"
        >
          <Text className="font-sans-medium text-sm text-primary-foreground">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Appear>
  );
}
