// Hours of Service (ELD) — mock. No HOS screen exists yet (roadmap), but the AI
// copilot's HOS advisor needs a source of truth so its answers are real, not
// canned. Shape mirrors the planned `GET /hos` contract (see Data Models doc):
// clocks for Drive(11) / Shift(14) / Cycle(70) / Break(8), hours used vs max.

export type DutyStatus = 'Off Duty' | 'Sleeper' | 'Driving' | 'On Duty';

export type Clock = { label: 'Drive' | 'Shift' | 'Cycle' | 'Break'; usedH: number; maxH: number; note?: string };

export type HOS = {
  current: DutyStatus;
  clocks: Clock[];
};

// Driver is mid-shift: ~2.6h of drive time left, tight against a delivery still
// ~2h45m out — exactly the situation the advisor should flag.
export const HOS_DATA: HOS = {
  current: 'Driving',
  clocks: [
    { label: 'Drive', usedH: 8.4, maxH: 11 },
    { label: 'Shift', usedH: 10.1, maxH: 14 },
    { label: 'Cycle', usedH: 52, maxH: 70 },
    { label: 'Break', usedH: 6.8, maxH: 8, note: '30-min break due in 1h 12m' },
  ],
};

export const remainingH = (c: Clock) => Math.max(0, c.maxH - c.usedH);

// "2h 36m" from 2.6 decimal hours.
export function hmText(decimalHours: number): string {
  const total = Math.round(decimalHours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function driveClock(hos: HOS = HOS_DATA): Clock {
  return hos.clocks.find((c) => c.label === 'Drive')!;
}
