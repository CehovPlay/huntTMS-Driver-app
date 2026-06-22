import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { Sparkles } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { useCopilot } from '@/lib/use-assistant';
import { C } from '@/lib/theme';

// Routes that DON'T need the floating button:
// - tab routes already show HuntBot in the center of the tab bar
// - auth + fullscreen flows own the whole screen
const HIDDEN = new Set([
  '/',
  '/login',
  '/verify',
  '/onboarding',
  '/scan',
  '/call',
  '/navigate',
  '/confirm-scan',
  '/loads',
  '/map',
  '/copilot',
  '/messages',
  '/notifications',
]);

// Global floating HuntBot launcher — gives access to the assistant from every
// stack screen (profile, load detail, chat, upload, expenses, DVIR, …) where the
// tab bar (and its center bot) isn't shown. Jumps to the HuntBot tab.
export function HuntBotFab() {
  const { openCopilot } = useCopilot();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  if (HIDDEN.has(pathname)) return null;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, bottom: insets.bottom + 150 }}>
      <Pressable
        onPress={openCopilot}
        accessibilityRole="button"
        accessibilityLabel="Open HuntBot"
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: C.teal,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Sparkles size={26} color="#fff" />
      </Pressable>
    </View>
  );
}
