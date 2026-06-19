import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Logo } from '@/components/logo';
import { Pressable } from '@/components/pressable';
import { C, shadowXs } from '@/lib/theme';

export default function LogIn() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(false);

  const digits = phone.replace(/[^0-9]/g, '');

  const onChange = (t: string) => {
    setPhone(t);
    if (error) setError(false);
  };

  const submit = () => {
    if (digits.length < 10) {
      setError(true);
      return;
    }
    router.push('/verify');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 px-8 pb-8 pt-5">
          {/* Logo */}
          <View className="items-center pt-2">
            <Logo height={36} />
          </View>

          {/* Verification section */}
          <View className="flex-1 justify-start gap-5 py-10">
            <Text className="font-sans-semibold text-2xl leading-8 text-foreground">
              Sign in with phone number
            </Text>

            <View className="gap-2">
              <View
                className="h-16 flex-row items-center gap-3 rounded-2xl border bg-background px-4"
                style={{ borderColor: error ? C.destructive : C.input, ...shadowXs }}
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
                  value={phone}
                  onChangeText={onChange}
                />
              </View>
              {error ? (
                <Text className="font-sans text-sm" style={{ color: C.destructive }}>
                  Please enter a valid phone number
                </Text>
              ) : null}
            </View>
          </View>

          {/* Sign in button */}
          <Pressable
            className="h-16 flex-row items-center justify-center rounded-2xl bg-primary active:opacity-90"
            style={shadowXs}
            onPress={submit}
          >
            <Text className="font-sans-medium text-base text-primary-foreground">Sign in</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
