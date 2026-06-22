import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { router } from 'expo-router';

import { useActiveLoad } from '@/lib/active-load';
import { useExpenses } from '@/lib/expenses';
import { useNotifications } from '@/lib/notifications';
import { getLoadDetail } from '@/lib/mock';
import { HOS_DATA } from '@/lib/hos';
import { Speech } from '@/lib/speech';
import { haptics } from '@/lib/haptics';
import { createVoice, voiceSupported } from '@/lib/voice';
import type { VoiceController, VoiceMode } from '@/lib/voice-types';
import { runAssistant, STARTER_CHIPS, type AssistantCtx } from '@/lib/assistant';

const ACTIVE_LOAD_ID = '1832888';
const COPILOT_TAB = '/copilot';

export type CopilotMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  chips?: string[];
  image?: string; // attached/scanned document preview (uri)
};

// Doc types the bot can recognise a scanned file as (match the upload sheet / gate).
function classifyDoc(hint: string): string {
  const t = hint.toLowerCase();
  if (/\bbol\b|lading|landing|bill of/.test(t)) return 'Bill of landing';
  if (/lumper/.test(t)) return 'Lumper fee';
  if (/\bpod\b|proof|delivery|delivered/.test(t)) return 'Proof of delivery';
  return 'Proof of delivery';
}

export type CopilotStatus = 'idle' | 'thinking';

type CopilotValue = {
  status: CopilotStatus;
  muted: boolean;
  messages: CopilotMessage[];
  starterChips: string[];
  // voice
  voiceSupported: boolean;
  voiceOn: boolean;
  voiceMode: VoiceMode;
  partial: string;
  voiceError: string | null;
  // actions
  openCopilot: () => void; // jump to the Copilot tab
  toggleMuted: () => void;
  send: (text: string, opts?: { voice?: boolean }) => void;
  attachDocument: (uri: string, hint?: string) => void; // upload → bot scans → attach to load
  enableVoice: () => void;
  disableVoice: () => void;
};

const Ctx = createContext<CopilotValue | null>(null);

let mid = 0;
const nextId = () => `m${++mid}`;

const GREETING: CopilotMessage = {
  id: 'greeting',
  role: 'assistant',
  text: 'Hey — I’m HuntBot, your driving assistant. Enable hands-free, then just say “Hey Bot…”. Or tap a question below.',
  chips: STARTER_CHIPS,
};

export function CopilotProvider({ children }: { children: ReactNode }) {
  const activeLoad = useActiveLoad();
  const expenses = useExpenses();
  const { notify } = useNotifications();

  const [status, setStatus] = useState<CopilotStatus>('idle');
  const [muted, setMuted] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([GREETING]);
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('off');
  const [partial, setPartial] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceRef = useRef<VoiceController | null>(null);
  const sendRef = useRef<(t: string, opts?: { voice?: boolean }) => void>(() => {});
  const mutedRef = useRef(muted);
  const voiceOnRef = useRef(voiceOn);
  useEffect(() => void (mutedRef.current = muted), [muted]);
  useEffect(() => void (voiceOnRef.current = voiceOn), [voiceOn]);

  const openCopilot = useCallback(() => router.navigate(COPILOT_TAB as never), []);

  // Build the voice controller once. Wake word → jump to the Copilot tab; a
  // captured command is routed through the latest send().
  useEffect(() => {
    if (!voiceSupported) return;
    const v = createVoice({
      onWake: () => {
        haptics.success();
        setVoiceError(null);
        router.navigate(COPILOT_TAB as never);
      },
      onCommand: (t) => sendRef.current(t, { voice: true }),
      onPartial: setPartial,
      onMode: setVoiceMode,
      onError: (m) => setVoiceError(m),
    });
    voiceRef.current = v;
    return () => v.disable();
  }, []);

  const enableVoice = useCallback(() => {
    if (!voiceSupported) {
      setVoiceError('Hands-free voice runs on the web / Telegram build.');
      return;
    }
    voiceRef.current?.enable();
    setVoiceOn(true);
    setVoiceError(null);
  }, []);

  const disableVoice = useCallback(() => {
    voiceRef.current?.disable();
    setVoiceOn(false);
    setPartial('');
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((m) => {
      if (!m) Speech.stop();
      return !m;
    });
  }, []);

  const send = useCallback(
    (raw: string, opts?: { voice?: boolean }) => {
      const text = raw.trim();
      if (!text) return;
      if (timer.current) clearTimeout(timer.current);
      const fromVoice = !!opts?.voice;

      setMessages((m) => [...m, { id: nextId(), role: 'user', text }]);
      setStatus('thinking');

      // Fresh tool context each turn so answers reflect current live state.
      const ctx: AssistantCtx = {
        load: getLoadDetail(ACTIVE_LOAD_ID),
        hos: HOS_DATA,
        stage: activeLoad.stage,
        missingDocs: activeLoad.missingDocs,
        canDeliver: activeLoad.canDeliver,
        expensesTotal: expenses.total,
        advance: activeLoad.advance,
        addDoc: activeLoad.addDoc,
        addExpense: (e) => expenses.add({ ...e, date: 'now', loadId: ACTIVE_LOAD_ID }),
        notifyDispatcher: (msg) =>
          notify({ type: 'message', title: 'Edward Dean · Dispatcher', body: msg, href: '/chat' }),
        go: (href) => router.push(href as never),
        back: () => {
          if (router.canGoBack()) router.back();
          else router.navigate('/loads' as never);
        },
        closeCopilot: () => router.navigate('/loads' as never),
      };

      timer.current = setTimeout(() => {
        const res = runAssistant(text, ctx);
        setMessages((m) => [...m, { id: nextId(), role: 'assistant', text: res.reply, chips: res.chips }]);
        setStatus('idle');

        // Pause the mic while we talk; resume after (followUp window if the
        // command came from voice) so we never transcribe our own reply.
        if (voiceOnRef.current) voiceRef.current?.pauseForSpeech();
        if (!mutedRef.current) {
          Speech.speak(res.speak ?? res.reply, {
            rate: 1.0,
            pitch: 1.0,
            onDone: () => {
              if (voiceOnRef.current) voiceRef.current?.afterSpeech(fromVoice);
            },
          });
        } else if (voiceOnRef.current) {
          voiceRef.current?.afterSpeech(fromVoice);
        }
      }, 480);
    },
    [activeLoad, expenses, notify],
  );
  useEffect(() => void (sendRef.current = send), [send]);

  // Upload a file → bot "scans" it, recognises the doc type, attaches it to the
  // active load (feeds the delivery-docs gate), and confirms what's still needed.
  const attachDocument = useCallback(
    (uri: string, hint?: string) => {
      if (timer.current) clearTimeout(timer.current);
      const docType = classifyDoc(hint ?? '');

      setMessages((m) => [...m, { id: nextId(), role: 'user', text: hint?.trim() || 'Scan this and add it to my load', image: uri }]);
      setStatus('thinking');

      // Optimistically compute what's left (state update isn't sync).
      const newMissing = activeLoad.missingDocs.filter((d) => d !== docType);
      activeLoad.addDoc(docType);
      notify({ type: 'success', title: 'Document attached', body: `${docType} added to load #${ACTIVE_LOAD_ID}`, href: '/load/1832888?variant=current' });

      const reply = `📄 Scanned it — looks like a ${docType}. Attached to load ${ACTIVE_LOAD_ID}. ${
        newMissing.length ? `Still need: ${newMissing.join(' and ')}.` : 'All required documents are in — you’re clear to mark delivered. ✅'
      }`;
      const speak = `Scanned it. Looks like a ${docType}. Attached to your load. ${newMissing.length ? `Still need ${newMissing.join(' and ')}.` : "That's all required documents — you're clear to deliver."}`;

      if (voiceOnRef.current) voiceRef.current?.pauseForSpeech();
      timer.current = setTimeout(() => {
        setMessages((m) => [...m, { id: nextId(), role: 'assistant', text: reply, chips: newMissing.length ? ['Scan another'] : ['Mark delivered'] }]);
        setStatus('idle');
        if (!mutedRef.current) {
          Speech.speak(speak, { rate: 1.0, pitch: 1.0, onDone: () => voiceOnRef.current && voiceRef.current?.afterSpeech(false) });
        } else if (voiceOnRef.current) {
          voiceRef.current?.afterSpeech(false);
        }
      }, 700);
    },
    [activeLoad, notify],
  );

  return (
    <Ctx.Provider
      value={{
        status,
        muted,
        messages,
        starterChips: STARTER_CHIPS,
        voiceSupported,
        voiceOn,
        voiceMode,
        partial,
        voiceError,
        openCopilot,
        toggleMuted,
        send,
        attachDocument,
        enableVoice,
        disableVoice,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCopilot(): CopilotValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCopilot must be used within CopilotProvider');
  return c;
}
