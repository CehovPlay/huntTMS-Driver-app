// Local "AI copilot" engine — UI/demo only. No backend, no Claude API call: this
// is a deterministic intent matcher over the app's real mock stores, so every
// answer reflects live state (active load, HOS, expenses…). It mirrors how a real
// tool-using assistant would be wired — each capability is the local stand-in for
// a server-side tool. Swap runAssistant() for a streaming proxy + tool-use later.

import type { LoadDetail } from '@/lib/mock';
import type { ExpenseCategory } from '@/lib/expenses';
import { driveClock, hmText, remainingH, type HOS } from '@/lib/hos';

// Side-effecting handles the engine may call (the "tools").
export type AssistantCtx = {
  load: LoadDetail; // current active load detail
  hos: HOS;
  stage: 'pickup' | 'delivery' | 'delivered';
  missingDocs: string[];
  canDeliver: boolean;
  expensesTotal: number;
  // actions
  advance: () => void;
  addDoc: (type: string) => void;
  addExpense: (e: { category: ExpenseCategory; amount: number; note?: string }) => void;
  notifyDispatcher: (text: string) => void;
  go: (href: string) => void; // navigate to a route
  back: () => void; // router.back()
  closeCopilot: () => void; // leave the copilot tab
};

export type AssistantResult = {
  reply: string; // shown in the transcript
  speak?: string; // spoken via TTS (defaults to reply)
  chips?: string[]; // follow-up suggestions
};

// Mock ETA to the next delivery (would come from fetchRoutes in the real thing).
const ETA_MIN = 165; // 2h 45m

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w));

// Full app-control route lexicon — every screen the copilot can open by voice.
const NAV: { keys: string[]; href: string; label: string }[] = [
  { keys: ['loads', 'my loads', 'trips', 'home', 'dashboard'], href: '/loads', label: 'Loads' },
  { keys: ['map'], href: '/map', label: 'Map' },
  { keys: ['chat', 'messages', 'inbox', 'dispatcher chat'], href: '/chat', label: 'Chat' },
  { keys: ['profile', 'my account', 'account'], href: '/profile', label: 'Profile' },
  { keys: ['expenses', 'spending', 'receipts'], href: '/expenses', label: 'Expenses' },
  { keys: ['notifications', 'alerts'], href: '/notifications', label: 'Notifications' },
  { keys: ['inspection', 'dvir'], href: '/dvir', label: 'Inspection' },
  { keys: ['upload', 'documents screen', 'files'], href: '/upload', label: 'Upload' },
  { keys: ['load details', 'load detail', 'load screen'], href: '/load/1832888', label: 'Load details' },
];

type Capability = {
  id: string;
  match: (t: string) => boolean;
  run: (t: string, c: AssistantCtx) => AssistantResult;
};

const CAPABILITIES: Capability[] = [
  // ── Help ────────────────────────────────────────────────────────────────
  {
    id: 'help',
    match: (t) => has(t, 'what can you', 'help me', 'how do you', 'what do you do'),
    run: () => ({
      reply:
        "I'm HuntBot, your driving assistant. Ask me about your next stop, drive hours, documents you still need, or say things like “mark picked up”, “log $40 fuel”, or “start navigation”.",
      speak: "I'm HuntBot, your driving assistant. Ask about your next stop, hours, documents, or tell me to mark a status, log an expense, or start navigation.",
      chips: ['Next stop?', 'Hours left?', 'What docs do I need?', 'Brief this load'],
    }),
  },

  // ── Load briefing / Q&A ─────────────────────────────────────────────────
  {
    id: 'briefing',
    match: (t) =>
      has(t, 'brief', 'tell me about', 'this load', 'hauling', 'commodity', 'weight', 'how heavy', 'hazmat', 'rate', 'how much pay', 'pieces', 'pallet', 'cargo', 'reference'),
    run: (t, c) => {
      const d = c.load.details;
      if (has(t, 'hazmat'))
        return { reply: d.hazmat ? '⚠️ Yes — this load is hazmat. Keep your placards and paperwork ready.' : 'No hazmat on this load.', chips: ['Weight?', 'Rate?'] };
      if (has(t, 'weight', 'how heavy'))
        return { reply: `${d.weight} of ${d.commodity.toLowerCase()} — ${d.pieces}.`, chips: ['Rate?', 'Next stop?'] };
      if (has(t, 'rate', 'how much pay'))
        return { reply: `This load pays ${d.rate} (${c.load.miles ?? '—'}).`, chips: ['Weight?', 'Next stop?'] };
      const reply = `Load ${c.load.id}: ${d.commodity}, ${d.weight}, ${d.pieces} on a ${d.equipment}. Rate ${d.rate}.${d.comment ? ` Note: ${d.comment}.` : ''}`;
      return { reply, chips: ['Next stop?', 'Hazmat?', 'What docs do I need?'] };
    },
  },

  // ── Next stop ───────────────────────────────────────────────────────────
  {
    id: 'next-stop',
    match: (t) => has(t, 'next stop', 'where to', 'where am i going', 'next pickup', 'next delivery', 'destination', "where's my"),
    run: (_t, c) => {
      if (c.stage === 'delivered') return { reply: 'This load is delivered — no active stop. Nice work. 🎉' };
      const stop = c.load.stops.find((s) => s.progress === 'current') ?? c.load.stops[c.stage === 'pickup' ? 0 : 1];
      const kind = c.stage === 'pickup' ? 'Pickup' : 'Delivery';
      return {
        reply: `Next ${kind}: ${stop.address}. Window ${stop.time}, ${stop.date}.`,
        speak: `Your next ${kind.toLowerCase()} is ${stop.address}, window ${stop.time}.`,
        chips: ['Will I make the window?', 'Start navigation'],
      };
    },
  },

  // ── ETA / make the window ───────────────────────────────────────────────
  {
    id: 'eta',
    match: (t) => has(t, 'make the window', 'on time', 'will i make', 'eta', 'how far', 'how long until', 'when will i'),
    run: (_t, c) => {
      const driveLeft = remainingH(driveClock(c.hos)) * 60;
      const etaTxt = hmText(ETA_MIN / 60);
      if (ETA_MIN > driveLeft) {
        const short = hmText((ETA_MIN - driveLeft) / 60);
        return {
          reply: `ETA is about ${etaTxt}, but you only have ${hmText(driveLeft / 60)} of drive time left — you'd run ${short} short. Plan a break and let your dispatcher know.`,
          speak: `Heads up — ETA is ${etaTxt} but you only have ${hmText(driveLeft / 60)} of drive time. You'd run ${short} short. Plan a break.`,
          chips: ['Tell dispatcher I’m running late', 'Hours left?'],
        };
      }
      return { reply: `ETA is about ${etaTxt}, and you have ${hmText(driveLeft / 60)} of drive time — you'll make it.`, chips: ['Start navigation'] };
    },
  },

  // ── HOS ─────────────────────────────────────────────────────────────────
  {
    id: 'hos',
    match: (t) => has(t, 'hours', 'hos', 'drive time', 'how long can i drive', 'how much driving', 'break', 'clock'),
    run: (_t, c) => {
      const drive = driveClock(c.hos);
      const left = remainingH(drive);
      const cycle = c.hos.clocks.find((x) => x.label === 'Cycle')!;
      return {
        reply: `You have ${hmText(left)} of drive time left (Drive ${drive.usedH}/${drive.maxH}h). Cycle: ${remainingH(cycle).toFixed(0)}h of 70 remaining. ${left < 3 ? 'Getting low — plan your break.' : ''}`.trim(),
        speak: `You have ${hmText(left)} of drive time left.${left < 3 ? ' Getting low — plan your break.' : ''}`,
        chips: ['Will I make the window?', 'Tell dispatcher I’m running late'],
      };
    },
  },

  // ── Document coach ──────────────────────────────────────────────────────
  {
    id: 'docs',
    match: (t) => has(t, 'document', 'docs', 'paperwork', 'what do i need', 'bol', 'pod', 'before i deliver', 'before delivery'),
    run: (_t, c) => {
      if (c.canDeliver)
        return { reply: 'All required documents are uploaded (BOL + POD). You’re clear to mark delivered.', chips: ['Mark delivered'] };
      const list = c.missingDocs.join(' and ');
      return {
        reply: `You still need: ${list}. You can’t close the load as delivered until both are uploaded.`,
        speak: `You still need ${list} before you can mark this delivered.`,
        chips: ['Scan a document'],
      };
    },
  },

  // ── Mark picked up ──────────────────────────────────────────────────────
  {
    id: 'pickup',
    match: (t) => has(t, 'picked up', 'loaded', 'got the load', 'mark pickup', 'pick up done', 'finished loading'),
    run: (_t, c) => {
      if (c.stage !== 'pickup') return { reply: 'Pickup is already done — you’re on the delivery leg.' };
      c.advance();
      c.notifyDispatcher('Loaded');
      return { reply: '✅ Marked as picked up. Dispatcher notified — drive safe to delivery.', speak: 'Done. Marked picked up and notified your dispatcher.', chips: ['Next stop?', 'Will I make the window?'] };
    },
  },

  // ── Mark delivered ──────────────────────────────────────────────────────
  {
    id: 'delivered',
    match: (t) => has(t, 'delivered', 'dropped', 'mark delivery', 'complete the load', 'finish the load', 'drop done'),
    run: (_t, c) => {
      if (c.stage === 'pickup') return { reply: 'You’re still on the pickup leg — mark picked up first.' };
      if (c.stage === 'delivered') return { reply: 'This load is already delivered. 🎉' };
      if (!c.canDeliver) {
        const list = c.missingDocs.join(' and ');
        return { reply: `Can’t close it yet — ${list} still missing. Upload both, then say “mark delivered”.`, chips: ['Scan a document'] };
      }
      c.advance();
      c.notifyDispatcher('Delivered');
      return { reply: '🎉 Marked delivered and dispatcher notified. Load complete!', speak: 'Done. Marked delivered and notified your dispatcher. Load complete.' };
    },
  },

  // ── Voice expense entry ─────────────────────────────────────────────────
  {
    id: 'expense',
    match: (t) => /\$\s?\d/.test(t) || (has(t, 'log', 'add', 'record', 'spent', 'paid') && has(t, 'fuel', 'diesel', 'gas', 'toll', 'scale', 'lumper', 'repair', 'parking', 'expense', 'receipt')),
    run: (t, c) => {
      const m = t.match(/\$?\s?(\d+(?:\.\d{1,2})?)/);
      if (!m) return { reply: 'How much was it? Try “log $42 fuel at Pilot”.' };
      const amount = parseFloat(m[1]);
      const category: ExpenseCategory = has(t, 'fuel', 'diesel', 'gas')
        ? 'Fuel'
        : has(t, 'toll')
        ? 'Tolls'
        : has(t, 'scale')
        ? 'Scale'
        : has(t, 'lumper')
        ? 'Lumper'
        : has(t, 'repair')
        ? 'Repair'
        : has(t, 'parking')
        ? 'Parking'
        : 'Other';
      const at = t.match(/\bat ([a-z0-9 '#-]+)$/);
      const note = at ? at[1].trim().replace(/\b\w/g, (s) => s.toUpperCase()) : undefined;
      c.addExpense({ category, amount, note });
      return {
        reply: `✅ Logged ${category} expense of $${amount.toFixed(2)}${note ? ` at ${note}` : ''}. Trip total is now $${(c.expensesTotal + amount).toFixed(2)}.`,
        speak: `Logged a ${category} expense of ${amount.toFixed(2)} dollars${note ? ` at ${note}` : ''}.`,
        chips: ['Scan the receipt', 'How much have I spent?'],
      };
    },
  },

  // ── Earnings / spend ────────────────────────────────────────────────────
  {
    id: 'earnings',
    match: (t) => has(t, 'earn', 'made', 'paycheck', 'settlement', 'per mile', 'how much have i spent', 'total expenses', 'spent so far'),
    run: (_t, c) => {
      if (has(_t, 'spent', 'expenses', 'how much have i spent'))
        return { reply: `Your trip expenses so far total $${c.expensesTotal.toFixed(2)}.`, chips: ['Log an expense'] };
      return { reply: `This load pays ${c.load.details.rate} over ${c.load.miles ?? '—'}. Your trip expenses are $${c.expensesTotal.toFixed(2)}.`, chips: ['How much have I spent?'] };
    },
  },

  // ── Navigation ──────────────────────────────────────────────────────────
  {
    id: 'navigate',
    match: (t) => has(t, 'start navigation', 'turn by turn', 'turn-by-turn', 'start route', 'directions', 'take me there', 'start driving', 'navigate to'),
    run: (_t, c) => {
      c.go('/navigate');
      return { reply: 'Opening turn-by-turn navigation. 🧭', speak: 'Starting navigation.' };
    },
  },

  // ── Scan / upload ───────────────────────────────────────────────────────
  {
    id: 'scan',
    match: (t) => has(t, 'scan', 'take a picture', 'photo of', 'snap', 'camera', 'upload a doc', 'upload document'),
    run: (_t, c) => {
      c.go('/scan');
      return { reply: 'Opening the camera to scan a document. 📄', speak: 'Opening the scanner.' };
    },
  },

  // ── DVIR ────────────────────────────────────────────────────────────────
  {
    id: 'dvir',
    match: (t) => has(t, 'dvir', 'inspection', 'pre-trip', 'pre trip', 'post-trip', 'defect'),
    run: (_t, c) => {
      c.go('/dvir');
      return { reply: 'Opening your vehicle inspection (DVIR). Walk the checklist and flag any defects. 🔧', speak: 'Opening your inspection report.' };
    },
  },

  // ── Dispatcher comms ────────────────────────────────────────────────────
  {
    id: 'dispatcher',
    match: (t) => has(t, 'dispatcher', 'tell ed', 'message dispatch', 'text dispatch', 'running late', 'on my way', 'let them know', 'notify dispatch'),
    run: (t, c) => {
      const msg = has(t, 'running late', 'late')
        ? 'Running ~30 min late'
        : has(t, 'on my way')
        ? 'On my way'
        : has(t, 'arrived')
        ? 'Arrived'
        : 'Quick update from the road';
      c.notifyDispatcher(msg);
      return { reply: `Sent to your dispatcher: “${msg}”.`, speak: `Sent your dispatcher: ${msg}.`, chips: ['Open chat'] };
    },
  },

  // ── Open any screen (full app control) ──────────────────────────────────
  {
    id: 'open-screen',
    match: (t) =>
      has(t, 'open', 'go to', 'show', 'take me to', 'switch to', 'bring up', 'pull up', 'jump to') &&
      NAV.some((n) => n.keys.some((k) => t.includes(k))),
    run: (t, c) => {
      const hit = NAV.find((n) => n.keys.some((k) => t.includes(k)))!;
      c.go(hit.href);
      return { reply: `Opening ${hit.label}.`, speak: `Opening ${hit.label}.` };
    },
  },

  // ── Go back ─────────────────────────────────────────────────────────────
  {
    id: 'go-back',
    match: (t) => has(t, 'go back', 'previous screen', 'navigate back') || t.trim() === 'back',
    run: (_t, c) => {
      c.back();
      return { reply: 'Going back.' };
    },
  },

  // ── Close / dismiss ─────────────────────────────────────────────────────
  {
    id: 'close',
    match: (t) => has(t, 'close copilot', 'dismiss', 'never mind', 'that is all', "that's all", 'goodbye', 'bye copilot', 'stop listening', 'go away', 'thanks copilot'),
    run: (_t, c) => {
      c.closeCopilot();
      return { reply: 'Okay — say “Hey Bot” whenever you need me.', speak: 'Okay. Say Hey Bot when you need me.' };
    },
  },
];

export function runAssistant(input: string, ctx: AssistantCtx): AssistantResult {
  const t = ` ${input.toLowerCase().trim()} `;
  for (const cap of CAPABILITIES) {
    if (cap.match(t)) return cap.run(t, ctx);
  }
  return {
    reply:
      "I didn't catch that. I can help with your next stop, drive hours, documents, expenses, navigation, or messaging your dispatcher.",
    chips: ['Next stop?', 'Hours left?', 'What docs do I need?'],
  };
}

// Starter prompts shown when the copilot opens.
export const STARTER_CHIPS = ['Next stop?', 'Hours left?', 'What docs do I need?', 'Brief this load'];
