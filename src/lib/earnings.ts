// Earnings / pay — mock. Layout-first.

export const EARNINGS = {
  week: 'Mar 9 – Mar 15',
  gross: 4280,
  available: 3960, // cashable now
  miles: 1842,
  loads: 4,
  perMile: 2.32,
  activeHours: 52, // on-duty time this week
  deliveries: 9, // total deliveries this week
  trendPct: 12, // vs last week
  byDay: [
    { d: 'M', v: 620 },
    { d: 'T', v: 940 },
    { d: 'W', v: 0 },
    { d: 'T', v: 1120 },
    { d: 'F', v: 760 },
    { d: 'S', v: 840 },
    { d: 'S', v: 0 },
  ],
  paid: [
    { id: '1832888', route: 'New Berlin, WI → Chicago, IL', miles: 486, amount: 1490, date: 'Mar 14' },
    { id: '3307613', route: 'Kansas City, MO → Pensacola, FL', miles: 498, amount: 1180, date: 'Mar 12' },
    { id: 'TRIP-70527', route: 'Des Moines, IA → Mobile, AL', miles: 432, amount: 980, date: 'Mar 11' },
    { id: '1071', route: 'Sioux City, IA → Baton Rouge, LA', miles: 300, amount: 630, date: 'Mar 9' },
  ],
};

export const money = (n: number) => `$${n.toLocaleString('en-US')}`;

// Cash-out — mock payout options + destination.
export const CASHOUT = {
  available: EARNINGS.available,
  destination: { label: 'Debit card', last4: '4291' },
  methods: [
    { id: 'instant', label: 'Instant', sub: 'Arrives in minutes', feePct: 0.015 },
    { id: 'standard', label: 'Standard', sub: '1–3 business days', feePct: 0 },
  ],
} as const;

export type CashoutMethod = (typeof CASHOUT.methods)[number]['id'];

