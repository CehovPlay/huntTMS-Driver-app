import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';

import { Logo } from '@/components/logo';
import { Pressable } from '@/components/pressable';
import { Appear } from '@/components/appear';
import { webappLinkRequestSms } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth/auth';
import { getAuthInitData } from '@/lib/auth/auth-init-data';
import { C, shadowXs } from '@/lib/theme';

export default function LogIn() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { initData, error: authError } = useAuth();
  const focus = useSharedValue(0);

  // Read tokens on the JS thread — the `C` proxy isn't available inside the
  // worklet (UI thread), so capture plain color strings here and close over them.
  const inputC = C.input;
  const fgC = C.foreground;
  const destC = C.destructive;
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: error ? destC : interpolateColor(focus.value, [0, 1], [inputC, fgC]),
  }));

  const digits = phone.replace(/[^0-9]/g, '');
  const normalizedDigits = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  const phoneNumber = `+1${normalizedDigits}`;

  const onChange = (t: string) => {
    setPhone(t);
    if (error) setError('');
  };

  const submit = async () => {
    if (normalizedDigits.length !== 10) {
      setError('Please enter a valid phone number');
      return;
    }
    const nextInitData = initData || getAuthInitData();
    if (!nextInitData) {
      setError('Open this app from Telegram to continue.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await webappLinkRequestSms(nextInitData, phoneNumber);
      router.push({ pathname: '/verify', params: { phone: phoneNumber } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send verification code');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-accent">
      {/* faded map backdrop — Figma background export (fades baked in) */}
      <Image
        source={require('../../assets/images/login-bg.png')}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        resizeMode="cover"
      />

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="flex-1 items-center gap-6 px-8 pb-14 pt-3">
            {/* Logo (top) */}
            <View className="h-9 flex-row items-center justify-center">
              <Logo height={30} />
            </View>

            {/* Form (bottom) */}
            <Appear delay={120} className="w-full flex-1 items-center justify-end gap-5">
              <View className="w-full items-center gap-2">
                <Text className="text-center font-sans-medium text-2xl leading-8 text-foreground">
                  Link your driver account
                </Text>
                <Text className="text-center font-sans text-base text-muted-foreground">
                  Enter the US phone number on your driver profile
                </Text>
              </View>

              <View className="w-full gap-2">
                <Animated.View
                  className="h-16 flex-row items-center gap-3 rounded-2xl border bg-background px-4"
                  style={[{ ...shadowXs }, borderStyle]}
                >
                  <Text className="font-sans text-base text-foreground">+1</Text>
                  <TextInput
                    className="flex-1 font-sans text-base text-foreground"
                    style={{ paddingVertical: 0, height: 24 }}
                    placeholder="(xxx) xxx-xxxx"
                    placeholderTextColor={C.mutedForeground}
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    returnKeyType="done"
                    onSubmitEditing={submit}
                    onFocus={() => { focus.value = withTiming(1, { duration: 180 }); }}
                    onBlur={() => { focus.value = withTiming(0, { duration: 180 }); }}
                    value={phone}
                    onChangeText={onChange}
                  />
                </Animated.View>
                {error || authError ? (
                  <Text className="px-1 font-sans text-sm" style={{ color: C.destructive }}>
                    {error || authError}
                  </Text>
                ) : null}
              </View>

              <Pressable
                className="h-16 w-full flex-row items-center justify-center rounded-2xl bg-primary active:opacity-90"
                style={{ ...shadowXs, opacity: submitting ? 0.6 : 1 }}
                onPress={submit}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Send verification code"
              >
                <Text className="font-sans-medium text-base text-primary-foreground">
                  {submitting ? 'Sending...' : 'Send code'}
                </Text>
              </Pressable>
            </Appear>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
