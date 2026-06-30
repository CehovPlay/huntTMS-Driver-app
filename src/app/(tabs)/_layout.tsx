import { Tabs } from 'expo-router';

import { TabBar } from '@/components/tab-bar';

// HuntBot remains hidden until backend support exists.
export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="loads"
      // The custom TabBar positions itself as a transparent absolute overlay, so
      // screen content fills full height and scrolls UNDER the floating bar.
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...(props as any)} />}
    >
      <Tabs.Screen name="loads" options={{ title: 'Loads' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Tabs.Screen name="copilot" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
    </Tabs>
  );
}
