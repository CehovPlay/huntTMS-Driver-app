import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { Logo } from '@/components/logo';
import { Pressable } from '@/components/pressable';
import { C, shadowXs } from '@/lib/theme';

const CODE_LENGTH = 5;

export default function EnterCode() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [seconds, setSeconds] = useState(59);
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] ?? '');
  const filled = code.length === CODE_LENGTH;

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const onChange = (t: string) => {
    setCode(t.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH));
    if (error) setError(false);
  };

  const submit = () => {
    if (!filled) return;
    // demo: 000000 is treated as invalid; any other code signs in
    if (code === '000000') setError(true);
    else router.replace('/loads');
  };

  const resend = () => {
    if (seconds > 0) return;
    setSeconds(59);
    setCode('');
    setError(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header: back + logo (pinned) */}
        <View className="flex-row items-center gap-3 px-8 pr-12 pt-5">
          <Pressable
            onPress={() => router.back()}
            className="size-12 items-center justify-center rounded-2xl active:bg-accent"
          >
            <ArrowLeft size={20} color={C.foreground} />
          </Pressable>
          <View className="flex-1 items-center">
            <Logo height={28} />
          </View>
        </View>

        {/* Verification section — scrolls if the keyboard squeezes the viewport,
            so it can never overlap the pinned CTA below. */}
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 px-8 py-8"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
            <View className="gap-2">
              <Text className="font-sans-semibold text-2xl leading-8 text-foreground">
                Enter verification code
              </Text>
              <Text className="font-sans text-base leading-6 text-muted-foreground">
                We sent a code to +1 (xxx) xxx-xxxx
              </Text>
            </View>

            {/* Code boxes */}
            <View className="gap-2">
              <Pressable onPress={() => inputRef.current?.focus()}>
                <View className="flex-row gap-2.5">
                  {digits.map((d, i) => {
                    const active = i === code.length;
                    const borderColor = error
                      ? C.destructive
                      : filled
                        ? C.teal
                        : active
                          ? C.foreground
                          : C.input;
                    return (
                      <View
                        key={i}
                        className="aspect-square flex-1 items-center justify-center rounded-2xl border bg-background"
                        style={{ borderColor, ...shadowXs }}
                      >
                        <Text className="font-sans-semibold text-2xl text-foreground">{d}</Text>
                      </View>
                    );
                  })}
                </View>
                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={onChange}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  maxLength={CODE_LENGTH}
                  autoFocus
                  className="absolute size-px opacity-0"
                />
              </Pressable>

              {error ? (
                <Text className="font-sans text-sm" style={{ color: C.destructive }}>
                  Invalid code, please try again
                </Text>
              ) : null}

              {/* Resend */}
              <Pressable
                onPress={resend}
                disabled={seconds > 0}
                className="mt-2 h-16 flex-row items-center justify-center rounded-2xl border border-input bg-background"
                style={{ ...shadowXs, opacity: seconds > 0 ? 0.5 : 1 }}
              >
                <Text className="font-sans-medium text-base text-foreground">
                  {seconds > 0 ? `Resend code (${seconds})` : 'Resend code'}
                </Text>
              </Pressable>
            </View>
        </ScrollView>

        {/* Enter app — pinned below the scroll area; never overlaps the content */}
        <View className="px-8 pb-8 pt-2">
          <Pressable
            onPress={submit}
            disabled={!filled || error}
            className="h-16 flex-row items-center justify-center rounded-2xl bg-primary"
            style={{ ...shadowXs, opacity: !filled || error ? 0.5 : 1 }}
          >
            <Text className="font-sans-medium text-base text-primary-foreground">Enter app</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
