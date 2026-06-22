// Real hands-free voice on web / Telegram via the browser Web Speech API
// (webkitSpeechRecognition). No backend, no dependency. Runs continuously:
// listens for the "Hey Bot" wake word, then captures the next command.
// On native this module is replaced by voice.ts (a no-op stub).

import type { VoiceController, VoiceHandlers, VoiceMode } from '@/lib/voice-types';

const SR: any =
  typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;

export const voiceSupported = !!SR;

// Wake phrases — include common mishears so a quick "hey bot" still triggers.
const WAKE = ['hey bot', 'hey, bot', 'hey bought', 'hey bot.', 'a bot', 'okay bot', 'hey but'];

export function createVoice(h: VoiceHandlers): VoiceController {
  if (!voiceSupported) {
    return {
      supported: false,
      enable: () => h.onError('Speech recognition is not available in this browser.'),
      disable: () => {},
      pauseForSpeech: () => {},
      afterSpeech: () => {},
      getMode: () => 'off',
    };
  }

  let rec: any = null;
  let mode: VoiceMode = 'off';
  let running = false;
  let cmdTimer: ReturnType<typeof setTimeout> | null = null;

  const setMode = (m: VoiceMode) => {
    mode = m;
    h.onMode(m);
  };

  const start = () => {
    if (running || !rec || mode === 'off' || mode === 'speaking') return;
    try {
      rec.start();
      running = true;
    } catch {
      /* already started — ignore */
    }
  };
  const stop = () => {
    try {
      rec?.stop();
    } catch {
      /* ignore */
    }
    running = false;
  };

  const armCommandTimeout = () => {
    if (cmdTimer) clearTimeout(cmdTimer);
    // If nothing is said after the wake word, drop back to wake listening.
    cmdTimer = setTimeout(() => {
      if (mode === 'command') {
        h.onPartial('');
        setMode('wake');
      }
    }, 9000);
  };

  const build = () => {
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';

    r.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) final += res[0].transcript;
        else interim += res[0].transcript;
      }
      const text = (final || interim).trim();
      const low = text.toLowerCase();

      if (mode === 'wake') {
        if (WAKE.some((w) => low.includes(w))) {
          // Anything after the wake word in the SAME final phrase is the command.
          const rest = final ? low.replace(/^.*\bbo(?:t|ught|ut)\b/, '').trim() : '';
          h.onWake();
          if (rest) {
            setMode('speaking'); // stop capturing; provider will resume after TTS
            stop();
            h.onCommand(rest);
          } else {
            setMode('command');
            armCommandTimeout();
          }
        }
      } else if (mode === 'command') {
        h.onPartial(text);
        if (final.trim()) {
          if (cmdTimer) clearTimeout(cmdTimer);
          const cmd = final.trim();
          h.onPartial('');
          setMode('speaking');
          stop();
          h.onCommand(cmd);
        }
      }
    };

    r.onerror = (e: any) => {
      if (e.error && e.error !== 'no-speech' && e.error !== 'aborted') h.onError(e.error);
    };
    r.onend = () => {
      running = false;
      // Chrome ends the session on silence — keep it alive unless we're off/speaking.
      if (mode === 'wake' || mode === 'command') setTimeout(start, 250);
    };
    return r;
  };

  return {
    supported: true,
    enable() {
      if (!rec) rec = build();
      setMode('wake');
      start();
    },
    disable() {
      if (cmdTimer) clearTimeout(cmdTimer);
      setMode('off');
      stop();
    },
    pauseForSpeech() {
      if (cmdTimer) clearTimeout(cmdTimer);
      setMode('speaking');
      stop();
    },
    afterSpeech(followUp: boolean) {
      if (mode === 'off') return;
      if (followUp) {
        setMode('command'); // brief window for a follow-up without re-saying the wake word
        armCommandTimeout();
      } else {
        setMode('wake');
      }
      start();
    },
    getMode: () => mode,
  };
}
