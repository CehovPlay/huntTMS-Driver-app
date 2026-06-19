import { useEffect, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, ChevronRight, FileText, Image as ImageIcon, ScanLine, Upload } from 'lucide-react-native';

import { Pressable } from '@/components/pressable';
import { C } from '@/lib/theme';

const DOC_TYPES = ['Proof of delivery', 'Bill of landing', 'Lumper fee', 'Other'];
type Step = 'attach' | 'docType' | 'docSource' | 'imageSource';

async function pickGallery(type?: string) {
  const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
  if (!res.canceled && res.assets[0]?.uri) {
    router.push({ pathname: '/confirm-scan', params: { uri: res.assets[0].uri, type: type ?? '' } });
  }
}

function Row({ icon: Icon, label, sub, onPress }: { icon: typeof Camera; label: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="h-16 flex-row items-center gap-3 rounded-2xl bg-accent px-4 active:opacity-80">
      <Icon size={20} color={C.foreground} />
      <Text className="flex-1 font-sans-medium text-base text-foreground">
        {label}
        {sub ? <Text className="font-sans text-sm text-muted-foreground">  {sub}</Text> : null}
      </Text>
      <ChevronRight size={18} color={C.mutedForeground} />
    </Pressable>
  );
}

export function UploadSheet({
  visible,
  onClose,
  presetType,
}: {
  visible: boolean;
  onClose: () => void;
  presetType?: string;
}) {
  const [step, setStep] = useState<Step>('attach');
  const [docType, setDocType] = useState(DOC_TYPES[0]);

  // when opened for a specific required doc, jump straight to source selection
  useEffect(() => {
    if (!visible) return;
    if (presetType) {
      setDocType(presetType);
      setStep('docSource');
    } else {
      setStep('attach');
    }
  }, [visible, presetType]);

  const close = () => {
    setStep('attach');
    onClose();
  };

  const Header = ({ title, back }: { title: string; back?: Step }) => (
    <View className="flex-row items-center">
      {back ? (
        <Pressable onPress={() => setStep(back)} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} className="-ml-1 size-8 items-center justify-center">
          <ArrowLeft size={20} color={C.foreground} />
        </Pressable>
      ) : null}
      <Text className="flex-1 font-sans-semibold text-2xl text-foreground">{title}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable className="flex-1 bg-black/40" onPress={close} />
      <SafeAreaView edges={['bottom']} className="rounded-t-3xl bg-background">
        <View className="gap-4 px-5 pb-4 pt-3">
          <View className="h-1 w-10 self-center rounded-full bg-border" />

          {step === 'attach' ? (
            <>
              <Header title="Upload file" />
              <View className="gap-2">
                <Row icon={FileText} label="Document" sub="POD, BOL, other" onPress={() => setStep('docType')} />
                <Row icon={ImageIcon} label="Image" onPress={() => setStep('imageSource')} />
              </View>
            </>
          ) : step === 'docType' ? (
            <>
              <Header title="Select document type" back="attach" />
              <View className="gap-2">
                {DOC_TYPES.map((t) => {
                  const active = docType === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setDocType(t)}
                      className="h-16 flex-row items-center justify-between rounded-2xl border px-4"
                      style={{ borderColor: active ? C.foreground : C.border, backgroundColor: active ? C.accent : C.background }}
                    >
                      <Text className="font-sans-medium text-base text-foreground">{t}</Text>
                      <View className="size-5 items-center justify-center rounded-full border" style={{ borderColor: active ? C.foreground : C.input }}>
                        {active ? <View className="size-2.5 rounded-full" style={{ backgroundColor: C.foreground }} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable onPress={() => setStep('docSource')} className="h-16 flex-row items-center justify-center rounded-2xl bg-primary active:opacity-90">
                <Text className="font-sans-medium text-base text-primary-foreground">Confirm</Text>
              </Pressable>
            </>
          ) : step === 'docSource' ? (
            <>
              <Header title="Upload document" back="docType" />
              <View className="gap-2">
                <Row icon={ScanLine} label="Scan" onPress={() => { close(); router.push({ pathname: '/scan', params: { type: docType } }); }} />
                <Row icon={Upload} label="Gallery" onPress={() => { close(); pickGallery(docType); }} />
              </View>
            </>
          ) : (
            <>
              <Header title="Upload image" back="attach" />
              <View className="gap-2">
                <Row icon={Camera} label="Camera" onPress={() => { close(); router.push('/scan'); }} />
                <Row icon={Upload} label="Gallery" onPress={() => { close(); pickGallery(); }} />
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
