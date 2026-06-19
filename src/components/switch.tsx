import { View } from 'react-native';

import { Pressable } from '@/components/pressable';
import { C, shadowXs } from '@/lib/theme';

// shadcn-style switch — fully token-driven and consistent across web/native
// (RN's <Switch> renders an off-brand teal thumb on web). Track flips to the
// primary color when on; the thumb is a white circle that sits left/right.
export function Switch({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      hitSlop={8}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        padding: 3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: value ? 'flex-end' : 'flex-start',
        backgroundColor: value ? C.primary : C.input,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff', ...shadowXs }} />
    </Pressable>
  );
}
