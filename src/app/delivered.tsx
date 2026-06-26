import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, MapPin } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { DocsFlowSheet } from '@/components/docs-flow-sheet';
import { SuccessCheck } from '@/components/success-check';
import { Appear } from '@/components/appear';
import { REQUIRED_DOCS, useActiveLoad } from '@/lib/active-load';
import { updateDriverLoadStatus, uploadDriverLoadFile } from '@/lib/api/load-mutations';
import { useDriverLoads } from '@/lib/api/use-api-query';
import { C } from '@/lib/theme';

const DOC_LABEL: Record<string, string> = {
  'Bill of landing': 'Bill of Lading (BOL)',
  'Proof of delivery': 'Proof of Delivery (POD)',
};

// Mandatory documents step after the delivery swipe — completion is blocked
// until every required document is uploaded.
export default function Delivered() {
  const { docs, canDeliver, reset, markDelivered, addDoc } = useActiveLoad();
  const q = useDriverLoads();
  const load = q.data?.activeLoad;
  // The upload modal pops up on arrival (and can be reopened from the list).
  const [sheetOpen, setSheetOpen] = useState(true);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const uploadDoc = async (type: string, uri?: string) => {
    if (!load || !uri) return;
    await uploadDriverLoadFile({ loadId: load.id, uri, label: type });
    addDoc(type);
  };

  const complete = async () => {
    if (!load || !canDeliver || done || submitting) return;
    setSubmitting(true);
    try {
      await updateDriverLoadStatus(load.id, 'DELIVERED');
      await q.refetch();
      markDelivered(load.reference);
      setDone(true);
      // Let the success animation play before returning to the load list.
      setTimeout(() => {
        reset();
        router.replace('/loads');
      }, 1250);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View className="flex-1 items-center justify-center gap-5 bg-background">
        <SuccessCheck size={92} />
        <Appear delay={260} className="items-center gap-1">
          <Text className="font-sans-semibold text-2xl text-foreground">Load delivered</Text>
          <Text className="font-sans text-base text-muted-foreground">{load?.reference ?? 'Load'}</Text>
        </Appear>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-accent">
      <SafeAreaView edges={['top']} className="border-b border-border bg-background">
        <View className="h-12 items-center justify-center">
          <Text className="font-sans-semibold text-base text-foreground">Complete delivery</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerClassName="gap-5 p-4 pb-10" showsVerticalScrollIndicator={false}>
        {/* arrived */}
        <View className="items-center gap-3 rounded-3xl bg-background py-8">
          <View className="size-16 items-center justify-center rounded-full" style={{ backgroundColor: C.accent }}>
            <MapPin size={30} color={C.foreground} />
          </View>
          <Text className="font-sans-semibold text-xl text-foreground">Arrived at delivery</Text>
          <Text className="px-8 text-center font-sans text-base leading-6 text-muted-foreground">
            Upload the required documents to close load {load?.reference ?? '—'}.
          </Text>
        </View>

        {/* mandatory documents */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between px-1">
            <Text className="font-sans-medium text-sm text-muted-foreground">REQUIRED DOCUMENTS</Text>
            <Text className="font-sans-medium text-sm" style={{ color: canDeliver ? C.foreground : C.amberText }}>
              {REQUIRED_DOCS.filter((d) => docs.includes(d)).length}/{REQUIRED_DOCS.length}
            </Text>
          </View>
          <View className="gap-px overflow-hidden rounded-3xl bg-background">
            {REQUIRED_DOCS.map((d) => {
              const up = docs.includes(d);
              return (
                <Pressable
                  key={d}
                  onPress={() => {
                    if (up) return;
                    setSheetOpen(true);
                  }}
                  accessibilityRole={up ? undefined : 'button'}
                  accessibilityLabel={up ? `${DOC_LABEL[d] ?? d} uploaded` : `Upload ${DOC_LABEL[d] ?? d}`}
                  className="flex-row items-center gap-3 bg-background p-4 active:opacity-80"
                >
                  <View
                    className="size-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: up ? C.foreground : 'transparent', borderWidth: up ? 0 : 1.5, borderColor: C.border }}
                  >
                    {up ? <Check size={14} color={C.background} strokeWidth={3} /> : null}
                  </View>
                  <Text className="flex-1 font-sans-medium text-base text-foreground">{DOC_LABEL[d] ?? d}</Text>
                  <Text className="font-sans-medium text-sm" style={{ color: C.foreground }}>
                    {up ? 'Uploaded' : 'Upload'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="bg-accent">
        <View className="gap-1 px-4 pb-2 pt-2">
          <Pressable
            onPress={complete}
            disabled={!canDeliver || submitting || !load}
            accessibilityRole="button"
            accessibilityLabel="Complete delivery"
            className="h-16 items-center justify-center rounded-2xl bg-primary"
            style={{ opacity: canDeliver && !submitting && load ? 1 : 0.4 }}
          >
            <Text className="font-sans-medium text-base text-primary-foreground">
              {submitting ? 'Completing...' : 'Complete delivery'}
            </Text>
          </Pressable>
          {!canDeliver ? (
            <Text className="text-center font-sans text-xs text-muted-foreground">
              Upload BOL + POD to complete the load
            </Text>
          ) : null}
        </View>
      </SafeAreaView>

      <DocsFlowSheet
        visible={sheetOpen}
        required={[...REQUIRED_DOCS]}
        labels={DOC_LABEL}
        uploaded={docs}
        title="Upload delivery documents"
        onUpload={uploadDoc}
        onConfirm={() => setSheetOpen(false)}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}
