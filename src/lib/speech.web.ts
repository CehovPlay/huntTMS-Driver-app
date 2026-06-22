// Web TTS via the browser SpeechSynthesis API (the copilot speaks on web /
// Telegram). Mirrors lib/speech.ts's interface and adds onDone so the voice
// controller can resume listening only after the reply finishes — otherwise the
// mic would transcribe the assistant's own voice.

type SpeakOptions = { rate?: number; pitch?: number; language?: string; onDone?: () => void };

const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

export const isSpeechAvailable = !!synth;

export const Speech = {
  speak(text: string, options?: SpeakOptions) {
    if (!synth) {
      options?.onDone?.();
      return;
    }
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (options?.rate) u.rate = options.rate;
      if (options?.pitch) u.pitch = options.pitch;
      u.lang = options?.language ?? 'en-US';
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        options?.onDone?.();
      };
      u.onend = finish;
      u.onerror = finish;
      synth.speak(u);
    } catch {
      options?.onDone?.();
    }
  },
  stop() {
    try {
      synth?.cancel();
    } catch {
      /* ignore */
    }
  },
};
