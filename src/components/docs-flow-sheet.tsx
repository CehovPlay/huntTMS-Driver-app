import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  ScanLine,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { haptics } from '@/lib/haptics';
import { C } from '@/lib/theme';

type Step = 'list' | 'source' | 'pages';
type PageStatus = 'uploading' | 'done' | 'error';
type Page = { id: string; uri?: string; name: string; status: PageStatus; progress: number; sizeMb: number };

let _seq = 0;
const nextId = () => `p${++_seq}`;

const SOURCES = [
  { key: 'scan', label: 'Scan document', icon: ScanLine, camera: true },
  { key: 'photo', label: 'Take a photo', icon: ImageIcon, camera: true },
  { key: 'gallery', label: 'Upload from gallery', icon: FileText, camera: false },
] as const;

// Guided document upload: pick a doc type → choose a source → collect pages
// (add more) → done returns to the type list showing uploaded vs remaining.
export function DocsFlowSheet({
  visible,
  required,
  labels,
  uploaded,
  title = 'Upload documents',
  onUpload,
  onConfirm,
  onClose,
  onSkip,
}: {
  visible: boolean;
  required: string[];
  labels: Record<string, string>;
  uploaded: string[];
  title?: string;
  onUpload: (type: string) => void;
  onConfirm?: () => void;
  onClose: () => void;
  onSkip?: () => void;
}) {
  const [step, setStep] = useState<Step>('list');
  const [activeType, setActiveType] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    if (visible) {
      setStep('list');
      setActiveType(null);
      setPages([]);
    }
  }, [visible]);
  useEffect(() => () => Object.values(timers.current).forEach(clearInterval), []);

  const allDone = required.every((r) => uploaded.includes(r));

  const simulate = (id: string) => {
    timers.current[id] = setInterval(() => {
      setPages((list) =>
        list.map((p) => {
          if (p.id !== id || p.status !== 'uploading') return p;
          const progress = Math.min(1, p.progress + 0.25);
          if (progress >= 1) {
            clearInterval(timers.current[id]);
            return { ...p, progress: 1, status: 'done' };
          }
          return { ...p, progress };
        }),
      );
    }, 300);
  };

  const openType = (type: string) => {
    setActiveType(type);
    setPages([]);
    setStep('source');
  };

  const addFrom = async (camera: boolean) => {
    try {
      const fn = camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
      let res;
      try {
        res = await fn({ quality: 0.7 });
      } catch {
        res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      }
      if (res.canceled) {
        if (pages.length === 0) setStep('source');
        return;
      }
      const a = res.assets[0];
      const page: Page = {
        id: nextId(),
        uri: a?.uri,
        name: `${labels[activeType ?? ''] ?? 'Document'} · page ${pages.length + 1}`,
        status: 'uploading',
        progress: 0,
        sizeMb: Math.round((a?.fileSize ? a.fileSize / 1e6 : 2 + Math.random() * 6) * 10) / 10,
      };
      setPages((list) => [...list, page]);
      simulate(page.id);
      setStep('pages');
    } catch {}
  };

  const removePage = (id: string) => {
    clearInterval(timers.current[id]);
    setPages((list) => list.filter((p) => p.id !== id));
  };
  const retryPage = (id: string) => {
    setPages((list) => list.map((p) => (p.id === id ? { ...p, status: 'uploading', progress: 0 } : p)));
    simulate(id);
  };

  const pagesReady = pages.length > 0 && pages.every((p) => p.status === 'done');

  const finishType = () => {
    if (!pagesReady || !activeType) return;
    haptics.success();
    onUpload(activeType);
    setStep('list');
    setActiveType(null);
    setPages([]);
  };

  const Header = ({ label, onBack }: { label: string; onBack?: () => void }) => (
    <View className="flex-row items-center gap-2">
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back" className="-ml-1 size-8 items-center justify-center">
          <ArrowLeft size={20} color={C.foreground} />
        </Pressable>
      ) : null}
      <Text className="flex-1 font-sans-semibold text-2xl text-foreground">{label}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="rounded-t-3xl bg-background">
        <View className="items-center py-3.5">
          <View className="h-1 w-9 rounded-full" style={{ backgroundColor: C.border }} />
        </View>

        <View className="gap-5 px-4 pb-2">
          {step === 'list' ? (
            <>
              <Header label={title} />
              <View className="gap-2">
                {required.map((type) => {
                  const up = uploaded.includes(type);
                  return (
                    <Pressable
                      key={type}
                      onPress={() => !up && openType(type)}
                      accessibilityRole={up ? undefined : 'button'}
                      accessibilityLabel={up ? `${labels[type] ?? type} uploaded` : `Upload ${labels[type] ?? type}`}
                      className="flex-row items-center gap-3 rounded-2xl bg-accent p-4 active:opacity-80"
                    >
                      <View
                        className="size-10 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: up ? C.teal : C.background }}
                      >
                        {up ? <Check size={18} color="#fff" strokeWidth={3} /> : <FileText size={18} color={C.foreground} />}
                      </View>
                      <View className="flex-1">
                        <Text className="font-sans-medium text-base text-foreground">{labels[type] ?? type}</Text>
                        <Text className="font-sans text-sm" style={{ color: up ? C.teal : C.mutedForeground }}>
                          {up ? 'Uploaded' : 'Required'}
                        </Text>
                      </View>
                      {up ? null : <ChevronRight size={18} color={C.mutedForeground} />}
                    </Pressable>
                  );
                })}
              </View>
              <SafeAreaView edges={['bottom']}>
                <View className="gap-3">
                  <Pressable
                    onPress={() => (onConfirm ? onConfirm() : onClose())}
                    disabled={!allDone}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm documents"
                    className="h-14 items-center justify-center rounded-2xl bg-primary"
                    style={{ opacity: allDone ? 1 : 0.4 }}
                  >
                    <Text className="font-sans-medium text-base text-primary-foreground">Confirm</Text>
                  </Pressable>
                  {onSkip ? (
                    <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip for now" className="h-10 items-center justify-center active:opacity-60">
                      <Text className="font-sans-medium text-sm text-muted-foreground">Skip for now</Text>
                    </Pressable>
                  ) : null}
                </View>
              </SafeAreaView>
            </>
          ) : step === 'source' ? (
            <>
              <Header label={`Add ${labels[activeType ?? ''] ?? 'document'}`} onBack={() => setStep('list')} />
              <SafeAreaView edges={['bottom']}>
                <View className="gap-2 pb-2">
                  {SOURCES.map((s) => (
                    <Pressable
                      key={s.key}
                      onPress={() => addFrom(s.camera)}
                      accessibilityRole="button"
                      accessibilityLabel={s.label}
                      className="h-16 flex-row items-center gap-3 rounded-2xl bg-accent px-4 active:opacity-80"
                    >
                      <s.icon size={20} color={C.foreground} />
                      <Text className="flex-1 font-sans-medium text-base text-foreground">{s.label}</Text>
                      <ChevronRight size={18} color={C.mutedForeground} />
                    </Pressable>
                  ))}
                </View>
              </SafeAreaView>
            </>
          ) : (
            <>
              <Header label={labels[activeType ?? ''] ?? 'Pages'} onBack={() => setStep('list')} />
              <ScrollView style={{ maxHeight: 300 }} contentContainerClassName="gap-2.5" showsVerticalScrollIndicator={false}>
                {pages.map((p) => (
                  <View key={p.id} className="flex-row items-center gap-2 rounded-2xl bg-accent p-2">
                    <View className="size-14 items-center justify-center overflow-hidden rounded-2xl bg-background">
                      {p.status === 'done' && p.uri ? (
                        <Image source={{ uri: p.uri }} style={{ width: 56, height: 56 }} resizeMode="cover" />
                      ) : p.status === 'uploading' ? (
                        <ActivityIndicator color={C.foreground} />
                      ) : (
                        <TriangleAlert size={20} color={C.destructive} />
                      )}
                    </View>
                    <View className="h-14 flex-1 justify-center gap-1">
                      <Text className="font-sans-medium text-sm text-foreground" numberOfLines={1}>{p.name}</Text>
                      {p.status === 'uploading' ? (
                        <View className="h-1 overflow-hidden rounded-full" style={{ backgroundColor: C.border }}>
                          <View style={{ height: 4, width: `${Math.round(p.progress * 100)}%`, backgroundColor: C.primary }} />
                        </View>
                      ) : (
                        <Text className="font-sans-medium text-xs text-muted-foreground">{p.sizeMb} mb</Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => (p.status === 'error' ? retryPage(p.id) : removePage(p.id))}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={p.status === 'error' ? 'Retry' : 'Remove'}
                      className="size-11 items-center justify-center active:opacity-60"
                    >
                      {p.status === 'error' ? (
                        <RefreshCw size={18} color={C.foreground} />
                      ) : p.status === 'done' ? (
                        <Trash2 size={18} color={C.mutedForeground} />
                      ) : (
                        <X size={18} color={C.mutedForeground} />
                      )}
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
              <SafeAreaView edges={['bottom']}>
                <View className="gap-3">
                  <Pressable
                    onPress={finishType}
                    disabled={!pagesReady}
                    accessibilityRole="button"
                    accessibilityLabel="Done"
                    className="h-14 items-center justify-center rounded-2xl bg-primary"
                    style={{ opacity: pagesReady ? 1 : 0.4 }}
                  >
                    <Text className="font-sans-medium text-base text-primary-foreground">Done</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setStep('source')}
                    accessibilityRole="button"
                    accessibilityLabel="Add more pages"
                    className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-accent active:opacity-80"
                  >
                    <Plus size={18} color={C.foreground} />
                    <Text className="font-sans-medium text-base text-foreground">Add more</Text>
                  </Pressable>
                </View>
              </SafeAreaView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
