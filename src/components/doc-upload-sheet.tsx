import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Plus, RefreshCw, Trash2, TriangleAlert, X } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { haptics } from '@/lib/haptics';
import { C } from '@/lib/theme';

type FileStatus = 'uploading' | 'done' | 'error';
type DocFile = {
  id: string;
  name: string;
  uri?: string;
  status: FileStatus;
  progress: number; // 0..1
  error?: string;
  sizeMb: number;
};

let _seq = 0;
const nextId = () => `f${++_seq}`;

// Multi-page document collection sheet (Figma "Confirm document upload").
// Used to gather e.g. a multi-sheet POD before confirming the required doc.
export function DocUploadSheet({
  visible,
  title = 'Confirm document upload',
  onClose,
  onConfirm,
}: {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: (count: number) => void;
}) {
  const [files, setFiles] = useState<DocFile[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // reset when opened fresh
  useEffect(() => {
    if (visible) setFiles([]);
  }, [visible]);

  useEffect(
    () => () => {
      Object.values(timers.current).forEach(clearInterval);
    },
    [],
  );

  const simulateUpload = (id: string) => {
    timers.current[id] = setInterval(() => {
      setFiles((list) =>
        list.map((f) => {
          if (f.id !== id || f.status !== 'uploading') return f;
          const progress = Math.min(1, f.progress + 0.2);
          if (progress >= 1) {
            clearInterval(timers.current[id]);
            return { ...f, progress: 1, status: 'done' };
          }
          return { ...f, progress };
        }),
      );
    }, 350);
  };

  const addMore = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsMultipleSelection: true });
      if (res.canceled) return;
      const assets = res.assets ?? [];
      const added: DocFile[] = assets.map((a, i) => ({
        id: nextId(),
        name: `POD_page_${files.length + i + 1}.jpg`,
        uri: a.uri,
        status: 'uploading',
        progress: 0,
        sizeMb: Math.round((a.fileSize ? a.fileSize / 1e6 : 2 + Math.random() * 6) * 10) / 10,
      }));
      setFiles((list) => [...list, ...added]);
      added.forEach((f) => simulateUpload(f.id));
    } catch {}
  };

  const remove = (id: string) => {
    clearInterval(timers.current[id]);
    setFiles((list) => list.filter((f) => f.id !== id));
  };
  const retry = (id: string) => {
    setFiles((list) => list.map((f) => (f.id === id ? { ...f, status: 'uploading', progress: 0, error: undefined } : f)));
    simulateUpload(id);
  };

  const ready = files.length > 0 && files.every((f) => f.status === 'done');

  const confirm = () => {
    if (!ready) return;
    haptics.success();
    onConfirm(files.length);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="rounded-t-3xl bg-background">
        {/* grabber */}
        <View className="items-center py-3.5">
          <View className="h-1 w-9 rounded-full" style={{ backgroundColor: C.border }} />
        </View>

        <View className="gap-6 px-4 pb-2">
          <Text className="font-sans-semibold text-2xl text-foreground">{title}</Text>

          <ScrollView style={{ maxHeight: 320 }} contentContainerClassName="gap-2.5" showsVerticalScrollIndicator={false}>
            {files.length === 0 ? (
              <View className="items-center gap-2 py-8">
                <Text className="font-sans text-base text-muted-foreground">No files yet — add document pages</Text>
              </View>
            ) : (
              files.map((f) => (
                <View key={f.id} className="flex-row items-center gap-2 rounded-2xl bg-accent p-2">
                  {/* thumbnail / state */}
                  <View className="size-14 items-center justify-center overflow-hidden rounded-2xl bg-background">
                    {f.status === 'done' && f.uri ? (
                      <Image source={{ uri: f.uri }} style={{ width: 56, height: 56 }} resizeMode="cover" />
                    ) : f.status === 'uploading' ? (
                      <ActivityIndicator color={C.foreground} />
                    ) : (
                      <TriangleAlert size={20} color={C.destructive} />
                    )}
                  </View>

                  {/* info */}
                  <View className="h-14 flex-1 justify-center gap-1">
                    <Text className="font-sans-medium text-sm text-foreground" numberOfLines={1}>
                      {f.name}
                    </Text>
                    {f.status === 'uploading' ? (
                      <>
                        <View className="h-1 overflow-hidden rounded-full" style={{ backgroundColor: C.border }}>
                          <View style={{ height: 4, width: `${Math.round(f.progress * 100)}%`, backgroundColor: C.primary }} />
                        </View>
                        <Text className="font-sans-medium text-xs text-muted-foreground">
                          {(f.sizeMb * f.progress).toFixed(1)} mb / {f.sizeMb} mb
                        </Text>
                      </>
                    ) : f.status === 'error' ? (
                      <Text className="font-sans-medium text-sm" style={{ color: C.destructive }}>
                        {f.error ?? 'Upload failed'}
                      </Text>
                    ) : (
                      <Text className="font-sans-medium text-sm text-muted-foreground">
                        {f.sizeMb} mb / {f.sizeMb} mb
                      </Text>
                    )}
                  </View>

                  {/* action */}
                  <Pressable
                    onPress={() => (f.status === 'error' ? retry(f.id) : remove(f.id))}
                    accessibilityRole="button"
                    accessibilityLabel={f.status === 'error' ? 'Retry' : 'Remove'}
                    hitSlop={8}
                    className="size-12 items-center justify-center active:opacity-60"
                  >
                    {f.status === 'error' ? (
                      <RefreshCw size={18} color={C.foreground} />
                    ) : f.status === 'done' ? (
                      <Trash2 size={18} color={C.mutedForeground} />
                    ) : (
                      <X size={18} color={C.mutedForeground} />
                    )}
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>

          {/* actions */}
          <SafeAreaView edges={['bottom']}>
            <View className="gap-3">
              <Pressable
                onPress={confirm}
                disabled={!ready}
                accessibilityRole="button"
                accessibilityLabel="Confirm documents"
                className="h-14 items-center justify-center rounded-2xl bg-primary"
                style={{ opacity: ready ? 1 : 0.4 }}
              >
                <Text className="font-sans-medium text-base text-primary-foreground">Confirm</Text>
              </Pressable>
              <Pressable
                onPress={addMore}
                accessibilityRole="button"
                accessibilityLabel="Add more pages"
                className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-accent active:opacity-80"
              >
                <Plus size={18} color={C.foreground} />
                <Text className="font-sans-medium text-base text-foreground">Add more</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}
