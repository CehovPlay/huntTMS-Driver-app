import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Bell, CheckCircle2, MessageCircle, Package, TriangleAlert } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { C } from '@/lib/theme';

export type NotifType = 'load' | 'message' | 'alert' | 'success';

export type Notif = {
  id: string;
  type: NotifType;
  title: string;
  body?: string;
  time: string;
  read: boolean;
  href?: string;
};

// Icon component is static; the color must be resolved at render (not here at
// module load) so it reads the live theme via the C proxy — otherwise it freezes
// to the boot-time (light) palette.
const ICON_COMP: Record<NotifType, typeof Bell> = {
  load: Package,
  message: MessageCircle,
  alert: TriangleAlert,
  success: CheckCircle2,
};
// Monochrome: all notification icons share the neutral ink color on a gray
// chip — no per-type color (keeps the feed calm).
function iconColor(_type: NotifType): string {
  return C.foreground;
}

const SEED: Notif[] = [
  { id: 'n1', type: 'load', title: 'New load assigned', body: 'Load #48213 · New Berlin, WI → Chicago, IL', time: '8:00 AM', read: false, href: '/load/1832888?variant=current' },
  { id: 'n2', type: 'message', title: 'Edward Dean', body: 'Morning! You good to take the New Berlin pickup at 10?', time: '8:02 AM', read: false, href: '/chat' },
  { id: 'n3', type: 'alert', title: 'Document expiring', body: 'Medical examiner certificate expires 02 Jul 2026', time: 'Yesterday', read: true, href: '/profile' },
];

type Ctx = {
  feed: Notif[];
  unread: number;
  notify: (n: Omit<Notif, 'id' | 'time' | 'read'>) => void;
  markAllRead: () => void;
};

const NotifCtx = createContext<Ctx | null>(null);
export const useNotifications = () => {
  const c = useContext(NotifCtx);
  if (!c) throw new Error('useNotifications must be used within NotificationProvider');
  return c;
};

let counter = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [feed, setFeed] = useState<Notif[]>(SEED);
  const [toasts, setToasts] = useState<Notif[]>([]);
  const unread = feed.filter((n) => !n.read).length;

  const notify: Ctx['notify'] = (n) => {
    counter += 1;
    const item: Notif = { ...n, id: `t${counter}`, time: 'now', read: false };
    setFeed((f) => [item, ...f]);
    setToasts((t) => [...t, item]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== item.id)), 3800);
  };

  const markAllRead = () => setFeed((f) => f.map((n) => ({ ...n, read: true })));

  return (
    <NotifCtx.Provider value={{ feed, unread, notify, markAllRead }}>
      {children}
      <ToastHost toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </NotifCtx.Provider>
  );
}

function ToastHost({ toasts, onDismiss }: { toasts: Notif[]; onDismiss: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 6, left: 0, right: 0 }}>
      {toasts.map((t) => (
        <ToastCard key={t.id} n={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </View>
  );
}

function ToastCard({ n, onDismiss }: { n: Notif; onDismiss: () => void }) {
  const reduce = useReducedMotion();
  const ty = useSharedValue(reduce ? 0 : -160);
  const Icon = ICON_COMP[n.type];
  const color = iconColor(n.type);

  useEffect(() => {
    if (reduce) {
      ty.value = 0;
      return;
    }
    ty.value = withSpring(0, { damping: 16, stiffness: 320, mass: 0.5 });
  }, [reduce]);

  const close = () => {
    if (reduce) {
      onDismiss();
      return;
    }
    ty.value = withTiming(-180, { duration: 140 });
    setTimeout(onDismiss, 140);
  };

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={() => {
          close();
          if (n.href) router.push(n.href as never);
        }}
        className="mx-3 mb-2 flex-row items-center gap-3 rounded-2xl bg-background p-3"
        style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}
      >
        <View className="size-9 items-center justify-center rounded-full" style={{ backgroundColor: C.accent }}>
          <Icon size={18} color={color} />
        </View>
        <View className="flex-1">
          <Text className="font-sans-semibold text-sm text-foreground" numberOfLines={1}>
            {n.title}
          </Text>
          {n.body ? (
            <Text className="font-sans text-sm text-muted-foreground" numberOfLines={1}>
              {n.body}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Resolves the icon + live theme color for a notification type. Call at render.
export function notifIcon(type: NotifType): { icon: typeof Bell; color: string } {
  return { icon: ICON_COMP[type], color: iconColor(type) };
}
