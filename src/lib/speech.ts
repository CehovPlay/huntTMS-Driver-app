// Safe wrapper around expo-speech.
// On a stale build that predates the native module (e.g. an old simulator app),
// `requireNativeModule('ExpoSpeech')` throws at import time and crashes the whole
// app. Loading it behind try/catch makes TTS gracefully no-op instead.

import { Platform } from 'react-native';

type SpeakOptions = { rate?: number; pitch?: number; language?: string; voice?: string; onDone?: () => void };

type Voice = { identifier: string; name: string; quality?: string; language: string };
let mod:
  | {
      speak: (t: string, o?: SpeakOptions) => void;
      stop: () => void;
      getAvailableVoicesAsync?: () => Promise<Voice[]>;
      VoiceQuality?: { Enhanced?: string };
    }
  | null = null;
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

// Prefer an Enhanced English system voice — the compact default is the robotic
// one. Resolved once, best-effort; falls back to the platform default.
let preferredVoice: string | undefined;
(async () => {
  try {
    const voices = (await mod?.getAvailableVoicesAsync?.()) ?? [];
    const enhanced = mod?.VoiceQuality?.Enhanced ?? 'Enhanced';
    const en = voices.filter((v) => /^en/i.test(v.language));
    const pick =
      en.find((v) => v.quality === enhanced && /en[-_]us/i.test(v.language)) ||
      en.find((v) => v.quality === enhanced) ||
      en.find((v) => /en[-_]us/i.test(v.language)) ||
      en[0];
    preferredVoice = pick?.identifier;
  } catch {
    /* voice enumeration unsupported — use platform default */
  }
})();

export const Speech = {
  speak(text: string, options?: SpeakOptions) {
    try {
      // Warmer defaults than the synth baseline (1.0/1.0); caller can override.
      mod?.speak(text, { rate: 0.95, pitch: 0.97, voice: preferredVoice, ...options });
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
