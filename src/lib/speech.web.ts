// Web TTS via the browser SpeechSynthesis API — free, built in. The default
// voice is robotic, so we pick the most natural voice the platform ships
// (Google / Microsoft "Natural" / Apple Samantha-Siri) and tune rate/pitch.
// Mirrors lib/speech.ts's interface and adds onDone.

type SpeakOptions = { rate?: number; pitch?: number; language?: string; onDone?: () => void };

const synth: SpeechSynthesis | undefined = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

export const isSpeechAvailable = !!synth;

// Highest-quality free voices first. Names vary by browser/OS; we match exact
// then by substring, then fall back to any natural/en-US voice.
const PREFERRED = [
  // Cloud neural voices (most natural when available)
  'Microsoft Aria Online (Natural)',
  'Microsoft Jenny Online (Natural)',
  'Microsoft Emma Online (Natural)',
  'Google US English',
  // Apple premium / enhanced local voices (macOS / iOS, far less robotic)
  'Ava (Premium)',
  'Zoe (Premium)',
  'Evan (Enhanced)',
  'Samantha (Enhanced)',
  'Allison (Enhanced)',
  // Apple Siri voices (show up as plain first names in Chrome on macOS)
  'Aaron',
  'Nicky',
  // Compact fallbacks
  'Samantha',
  'Ava',
  'Allison',
  'Google UK English Female',
];

let chosen: any = null;

function pickVoice() {
  if (!synth) return;
  const voices = synth.getVoices();
  if (!voices.length) return;
  const find = (needle: string) =>
    voices.find((v) => v.name === needle) || voices.find((v) => v.name.toLowerCase().includes(needle.toLowerCase()));
  for (const p of PREFERRED) {
    const v = find(p);
    if (v) {
      chosen = v;
      return;
    }
  }
  // Fallbacks: a "natural"/known-good en-US voice, then any en-US, then any en.
  chosen =
    voices.find((v) => /en[-_]us/i.test(v.lang) && /natural|google|siri|samantha|premium|enhanced/i.test(v.name)) ||
    voices.find((v) => /en[-_]us/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    voices[0];
}

if (synth) {
  pickVoice();
  // Voice list often loads async — refine once it's ready.
  try {
    synth.addEventListener('voiceschanged', pickVoice);
  } catch {
    (synth as any).onvoiceschanged = pickVoice;
  }
}

export const Speech = {
  speak(text: string, options?: SpeakOptions) {
    if (!synth) {
      options?.onDone?.();
      return;
    }
    try {
      synth.cancel();
      if (!chosen) pickVoice();
      const u = new SpeechSynthesisUtterance(text);
      if (chosen) u.voice = chosen;
      u.lang = chosen?.lang || options?.language || 'en-US';
      // Slightly slower + a touch lower pitch reads warmer / less robotic than
      // the synth defaults.
      u.rate = options?.rate ?? 0.95;
      u.pitch = options?.pitch ?? 0.94;
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
