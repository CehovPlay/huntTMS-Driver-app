import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
    <View className="flex-1 bg-accent">
      {/* faded map backdrop (matches Figma) */}
      <View pointerEvents="none" className="absolute inset-0">
        <Image
          source={require('../../assets/images/login-map.png')}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '66%' }}
          resizeMode="cover"
        />
        {/* fade the map into the accent background top + bottom */}
        <LinearGradient
          colors={[C.accent, `${C.accent}00`]}
          locations={[0, 0.3]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%' }}
        />
        <LinearGradient
          colors={[`${C.accent}00`, C.accent]}
          locations={[0, 0.5]}
          style={{ position: 'absolute', left: 0, right: 0, top: '22%', bottom: 0 }}
        />
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="flex-1 items-center gap-6 px-8 pb-14 pt-3">
            {/* Logo (top) */}
            <View className="h-9 flex-row items-center justify-center">
              <Logo height={30} />
            </View>

            {/* Form (bottom) */}
            <View className="w-full flex-1 items-center justify-end gap-5">
              <View className="w-full items-center gap-2">
                <Text className="text-center font-sans-medium text-2xl leading-8 text-foreground">
                  Sign in with phone
                </Text>
                <Text className="text-center font-sans text-base text-muted-foreground">
                  US phone numbers only
                </Text>
              </View>

              <View className="w-full gap-2">
                <View
                  className="h-14 flex-row items-center gap-3 bg-background px-4"
                  style={{ borderRadius: 10, borderWidth: 1, borderColor: error ? C.destructive : C.input, ...shadowXs }}
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
                  <Text className="px-1 font-sans text-sm" style={{ color: C.destructive }}>
                    Please enter a valid phone number
                  </Text>
                ) : null}
              </View>

              <Pressable
                className="h-14 w-full flex-row items-center justify-center bg-primary active:opacity-90"
                style={{ borderRadius: 10, ...shadowXs }}
                onPress={submit}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
              >
                <Text className="font-sans-medium text-base text-primary-foreground">Sign in</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
