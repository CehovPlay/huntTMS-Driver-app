// Safe wrapper around expo-speech.
// On a stale build that predates the native module (e.g. an old simulator app),
// `requireNativeModule('ExpoSpeech')` throws at import time and crashes the whole
// app. Loading it behind try/catch makes TTS gracefully no-op instead.

import { Platform } from 'react-native';

type SpeakOptions = { rate?: number; pitch?: number; language?: string; onDone?: () => void };

let mod: { speak: (t: string, o?: SpeakOptions) => void; stop: () => void } | null = null;
// Web/Telegram webview TTS is unreliable — keep voice native-only.
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('expo-speech');
  } catch {
    mod = null;
  }
}

export const isSpeechAvailable = mod != null;

export const Speech = {
  speak(text: string, options?: SpeakOptions) {
    try {
      mod?.speak(text, options);
    } catch {
      /* native module unavailable — ignore */
    }
  },
  stop() {
    try {
      mod?.stop();
    } catch {
      /* ignore */
    }
  },
};
