// Mock chat data — driver <-> dispatcher. Layout-first; swap for realtime API later.

export type ChatMessage = {
  id: string;
  mine: boolean; // true = driver (outgoing)
  kind: 'text' | 'image' | 'file' | 'voice' | 'system';
  text?: string;
  time: string;
  read?: boolean; // outgoing read receipt
  replyTo?: { name: string; text: string };
  reactions?: string[];
  // image
  imageUrl?: string;
  // file
  fileName?: string;
  fileSize?: string;
  // voice
  duration?: string; // mm:ss
};

export const DISPATCHER = {
  name: 'Edward Dean',
  role: 'Dispatcher',
  initials: 'ED',
  online: true,
};

export const QUICK_REPLIES = [
  'On my way',
  'Arrived',
  'Loaded',
  'Running ~30 min late',
  'Delivered',
];

export const CHAT_MESSAGES: ChatMessage[] = [
  { id: 's1', mine: false, kind: 'system', text: 'Load #48213 assigned to you', time: '8:00 AM' },
  {
    id: 'm1',
    mine: false,
    kind: 'text',
    text: 'Morning! You good to take the New Berlin pickup at 10?',
    time: '8:02 AM',
  },
  { id: 'm2', mine: true, kind: 'text', text: 'Yep, heading there now 👍', time: '8:03 AM', read: true, reactions: ['👍'] },
  {
    id: 'm3',
    mine: false,
    kind: 'text',
    text: 'Great. Watch the dock — they can be slow with paperwork.',
    time: '8:04 AM',
  },
  {
    id: 'm4',
    mine: false,
    kind: 'file',
    fileName: 'Rate_Confirmation.pdf',
    fileSize: '248 KB',
    time: '8:05 AM',
  },
  {
    id: 'm5',
    mine: true,
    kind: 'text',
    text: 'Got it, thanks',
    time: '8:06 AM',
    read: true,
    replyTo: { name: 'Edward Dean', text: 'Rate_Confirmation.pdf' },
  },
  { id: 'm6', mine: false, kind: 'voice', duration: '0:12', time: '8:10 AM' },
  {
    id: 'm7',
    mine: true,
    kind: 'image',
    imageUrl: 'https://picsum.photos/seed/bol/600/800',
    text: 'BOL signed at pickup',
    time: '10:14 AM',
    read: true,
  },
  { id: 'm8', mine: false, kind: 'text', text: 'Perfect, safe drive 🚛', time: '10:15 AM', reactions: ['❤️'] },
];

export const REACTIONS = ['👍', '❤️', '😂', '😮', '🙏', '🔥'];

// --- Chat list (multiple dispatcher conversations, tied to loads) ---

export type ConvStatus = 'En route' | 'Scheduled' | 'Delivered' | 'TONU';

export type Conversation = {
  id: string;
  dispatcher: { name: string; initials: string; role: string; online: boolean };
  load: { id: string; route: string; status: ConvStatus };
  lastKind: 'text' | 'image' | 'file' | 'voice';
  preview: string;
  time: string;
  unread: number;
  mineLast?: boolean; // last message was sent by the driver (shows read ticks instead of unread)
};

export const CONVERSATIONS: Conversation[] = [
  {
    id: '48213',
    dispatcher: { name: 'Edward Dean', initials: 'ED', role: 'Dispatcher', online: true },
    load: { id: '#48213', route: 'New Berlin, WI → Chicago, IL', status: 'En route' },
    lastKind: 'text',
    preview: 'Perfect, safe drive 🚛',
    time: '10:15 AM',
    unread: 2,
  },
  {
    id: '3307613',
    dispatcher: { name: 'Maria Lopez', initials: 'ML', role: 'Dispatcher', online: true },
    load: { id: '3307613', route: 'Kansas City, MO → Pensacola, FL', status: 'Scheduled' },
    lastKind: 'file',
    preview: 'Rate confirmation sent',
    time: '9:48 AM',
    unread: 0,
    mineLast: true,
  },
  {
    id: 'TRIP-70527',
    dispatcher: { name: 'Carl Jensen', initials: 'CJ', role: 'Dispatcher', online: false },
    load: { id: 'TRIP-70527', route: 'Des Moines, IA → Mobile, AL', status: 'Scheduled' },
    lastKind: 'text',
    preview: 'Appointment is confirmed for 8 AM',
    time: 'Yesterday',
    unread: 1,
  },
  {
    id: '1192034',
    dispatcher: { name: 'Dana White', initials: 'DW', role: 'Dispatcher', online: false },
    load: { id: '1192034', route: 'Dallas, TX → Memphis, TN', status: 'Delivered' },
    lastKind: 'voice',
    preview: 'Voice message · 0:18',
    time: 'Mon',
    unread: 0,
    mineLast: true,
  },
];

export const CONV_UNREAD = CONVERSATIONS.reduce((n, c) => n + c.unread, 0);

export function getConversation(id?: string): Conversation {
  return CONVERSATIONS.find((c) => c.id === id) ?? CONVERSATIONS[0];
}
