// Shared types for the voice controller. Platform impls live in voice.ts (native
// stub) and voice.web.ts (real Web Speech API). Kept in a non-platform file so
// both implementations and the provider agree on the same shape.

export type VoiceMode =
  | 'off' // not listening
  | 'wake' // listening for the "Hey Bot" wake word
  | 'command' // wake heard — capturing a command
  | 'speaking'; // assistant is talking; mic paused to avoid echo

export type VoiceHandlers = {
  onWake: () => void; // wake word detected
  onCommand: (text: string) => void; // a full command was captured
  onPartial: (text: string) => void; // live interim transcript
  onMode: (mode: VoiceMode) => void; // mode changed (drives UI)
  onError: (message: string) => void;
};

export interface VoiceController {
  supported: boolean;
  enable: () => void; // start listening for the wake word (needs a user gesture on web)
  disable: () => void; // stop everything
  pauseForSpeech: () => void; // stop the mic while TTS plays
  afterSpeech: (followUp: boolean) => void; // resume; followUp=true opens a brief command window
  getMode: () => VoiceMode;
}
