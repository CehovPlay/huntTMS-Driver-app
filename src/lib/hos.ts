// Hours of Service (ELD) — mock. Layout-first.

export type DutyStatus = 'Off Duty' | 'Sleeper' | 'Driving' | 'On Duty';

export const DUTY: { key: DutyStatus; short: string; color: string }[] = [
  { key: 'Off Duty', short: 'OFF', color: '#737373' },
  { key: 'Sleeper', short: 'SB', color: '#7a5af8' },
  { key: 'Driving', short: 'D', color: '#0d9488' },
  { key: 'On Duty', short: 'ON', color: '#d97706' },
];

export type Clock = { label: string; usedH: number; maxH: number; note?: string };

export const HOS = {
  current: 'Driving' as DutyStatus,
  clocks: [
    { label: 'Drive', usedH: 6.2, maxH: 11 },
    { label: 'Shift', usedH: 8.5, maxH: 14 },
    { label: 'Cycle', usedH: 42, maxH: 70 },
    { label: 'Break in', usedH: 6.2, maxH: 8, note: '30-min break' },
  ] as Clock[],
  today: [
    { status: 'Off Duty' as DutyStatus, from: '12:00a', to: '6:00a' },
    { status: 'On Duty' as DutyStatus, from: '6:00a', to: '6:30a' },
    { status: 'Driving' as DutyStatus, from: '6:30a', to: '10:00a' },
    { status: 'On Duty' as DutyStatus, from: '10:00a', to: '10:30a' },
    { status: 'Driving' as DutyStatus, from: '10:30a', to: 'now' },
  ],
};

export const fmtHrs = (h: number) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm ? `${hh}h ${mm}m` : `${hh}h`;
};
