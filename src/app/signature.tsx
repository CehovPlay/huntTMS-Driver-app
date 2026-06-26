import { useRef, useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { ArrowLeft, Eraser } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { haptics } from '@/lib/haptics';
import { C } from '@/lib/theme';
import { useActiveLoad } from '@/lib/active-load';
import { uploadDriverLoadFile } from '@/lib/api/load-mutations';
import { useDriverLoads } from '@/lib/api/use-api-query';

// Receiver's signature for Proof of Delivery. Drawing uses RN's responder
// system (locationX/Y), which works identically on native and web (RNW), so a
// single implementation covers iOS and the Telegram Mini App.
export default function Signature() {
  const { addDoc } = useActiveLoad();
  const q = useDriverLoads();
  const [paths, setPaths] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const cur = useRef('');
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const point = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    return `${locationX.toFixed(1)},${locationY.toFixed(1)}`;
  };

  const onGrant = (e: GestureResponderEvent) => {
    cur.current = `M${point(e)}`;
    rerender();
  };
  const onMove = (e: GestureResponderEvent) => {
    cur.current += ` L${point(e)}`;
    rerender();
  };
  const onRelease = () => {
    if (cur.current) setPaths((p) => [...p, cur.current]);
    cur.current = '';
    rerender();
  };

  const clear = () => {
    cur.current = '';
    setPaths([]);
  };

  const hasInk = paths.length > 0 || cur.current.length > 0;

  const confirm = async () => {
    if (submitting || !q.data?.activeLoad) return;
    setSubmitting(true);
    haptics.success();
    try {
      await uploadDriverLoadFile({
        loadId: q.data.activeLoad.id,
        uri: signatureDataUri([...paths, cur.current].filter(Boolean)),
        label: 'Proof of delivery',
        name: 'proof-of-delivery-signature.svg',
        mime: 'image/svg+xml',
      });
      addDoc('Proof of delivery');
      router.back();
    } finally {
      setSubmitting(false);
    }
  };

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
            Receiver signature
          </Text>
        </View>
      </SafeAreaView>

      <View className="flex-1 gap-4 p-4">
        <Text className="font-sans text-sm text-muted-foreground">
          Ask the receiver to sign below to confirm delivery.
        </Text>

        {/* signing canvas */}
        <View className="flex-1 overflow-hidden rounded-3xl bg-background" style={{ borderWidth: 1, borderColor: C.border }}>
          <View
            className="flex-1"
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={onGrant}
            onResponderMove={onMove}
            onResponderRelease={onRelease}
            onResponderTerminate={onRelease}
          >
            <Svg style={{ flex: 1 }}>
              {paths.map((d, i) => (
                <Path key={i} d={d} stroke={C.foreground} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" fill="none" />
              ))}
              {cur.current ? (
                <Path d={cur.current} stroke={C.foreground} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" fill="none" />
              ) : null}
            </Svg>

            {!hasInk ? (
              <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
                <Text className="font-sans text-base text-muted-foreground">Sign here</Text>
              </View>
            ) : null}

            {/* signature baseline */}
            <View pointerEvents="none" className="absolute inset-x-6" style={{ bottom: 28, height: 1, backgroundColor: C.border }} />
            <Text pointerEvents="none" className="absolute font-sans text-xs text-muted-foreground" style={{ bottom: 10, left: 24 }}>
              ✕
            </Text>
          </View>
        </View>

        {/* clear */}
        <Pressable
          onPress={clear}
          disabled={!hasInk}
          accessibilityRole="button"
          accessibilityLabel="Clear signature"
          className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-background active:opacity-80"
          style={{ opacity: hasInk ? 1 : 0.5 }}
        >
          <Eraser size={16} color={C.mutedForeground} />
          <Text className="font-sans-medium text-sm text-muted-foreground">Clear</Text>
        </Pressable>
      </View>

      <SafeAreaView edges={['bottom']} className="bg-accent">
        <View className="px-4 pb-2 pt-2">
          <Pressable
            onPress={confirm}
            disabled={!hasInk || submitting}
            accessibilityRole="button"
            accessibilityLabel="Confirm signature"
            className="h-16 items-center justify-center rounded-2xl bg-primary"
            style={{ opacity: hasInk && !submitting ? 1 : 0.4 }}
          >
            <Text className="font-sans-medium text-base text-primary-foreground">
              {submitting ? 'Uploading...' : 'Confirm signature'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function signatureDataUri(paths: string[]): string {
  const body = paths
    .map((d) => `<path d="${escapeXml(d)}" stroke="black" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none"/>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420">${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
