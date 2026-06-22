// Native stub for the voice controller. Real on-device STT on iOS/Android would
// need a native module (e.g. @react-native-voice/voice); not included in this
// UI-only build. On web, Metro resolves voice.web.ts instead (real Web Speech).

import type { VoiceController, VoiceHandlers } from '@/lib/voice-types';

export const voiceSupported = false;

export function createVoice(h: VoiceHandlers): VoiceController {
  return {
    supported: false,
    enable: () => h.onError('Hands-free voice runs on the web / Telegram build.'),
    disable: () => {},
    pauseForSpeech: () => {},
    afterSpeech: () => {},
    getMode: () => 'off',
  };
}
