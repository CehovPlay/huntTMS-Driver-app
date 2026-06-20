// Mock data — layout-first. Swap for real API later.

export type TripStop = {
  day: string;
  month: string;
  city: string;
  time: string;
  timeEnd?: string;
};

export type TripStatus = 'current' | 'scheduled' | 'tonu' | 'delivered';

export type Trip = {
  id: string;
  partial?: string;
  status: TripStatus;
  broker?: string;
  miles?: number;
  stops: TripStop[];
};

export type DetailStop = {
  type: 'Pick up' | 'Delivery';
  address: string;
  date: string;
  time: string;
  note?: string;
  doneAt?: string; // completion timestamp shown in Delivered variant
  // Route history (derived on-device from the driver's GPS / geofence crossings):
  progress?: 'done' | 'current' | 'upcoming';
  arrival?: string; // actual arrival time captured locally when GPS entered the stop
  leg?: string; // distance/time of the leg leading to this stop
  coordinate: { latitude: number; longitude: number };
};

export type LoadDetails = {
  orderNo: string;
  commodity: string;
  weight: string;
  dimensions: string;
  quantity: string;
  plate: string;
  coDriver: string;
  contact: { name: string; phone: string };
  comment?: string; // important highlighted note
  // extended freight info
  rate: string;
  reference: string; // PRO / PO number
  equipment: string; // trailer type
  temp: string; // reefer temp or 'Dry'
  pieces: string;
  hazmat: boolean;
  accessorials: string[];
};

export type PartialLoad = {
  id: string;
  commodity: string;
  route: string;
  weight: string;
};

export type LoadDetail = {
  id: string;
  status: 'En route' | 'Scheduled' | 'Delivered' | 'TONU';
  dispatcher: { name: string; phone: string };
  notes: { title: string; body: string }[];
  details: LoadDetails;
  stops: DetailStop[];
  miles?: string;
  partials: PartialLoad[];
  tonu?: { fee: string; reason: string; canceledAt: string }; // present for canceled (TONU) loads
};

// approximate city coordinates for mini-map previews (mock)
export const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  'Springfield, MO': { latitude: 37.209, longitude: -93.2923 },
  'Panama City, FL': { latitude: 30.1588, longitude: -85.6602 },
  'Kansas City, MO': { latitude: 39.0997, longitude: -94.5786 },
  'Pensacola, FL': { latitude: 30.4213, longitude: -87.2169 },
  'Des Moines, IA': { latitude: 41.5868, longitude: -93.625 },
  'Mobile, AL': { latitude: 30.6954, longitude: -88.0399 },
  'Sioux City, IA': { latitude: 42.4999, longitude: -96.4003 },
  'Baton Rouge, LA': { latitude: 30.4515, longitude: -91.1871 },
  'Omaha, NE': { latitude: 41.2565, longitude: -95.9345 },
  'Shreveport, LA': { latitude: 32.5252, longitude: -93.7502 },
  'New Berlin, WI': { latitude: 42.9764, longitude: -88.1084 },
  'Chicago, IL': { latitude: 41.8781, longitude: -87.6298 },
  'Dallas, TX': { latitude: 32.7767, longitude: -96.797 },
  'Memphis, TN': { latitude: 35.1495, longitude: -90.049 },
  'Denver, CO': { latitude: 39.7392, longitude: -104.9903 },
  'Salt Lake City, UT': { latitude: 40.7608, longitude: -111.891 },
  'Phoenix, AZ': { latitude: 33.4484, longitude: -112.074 },
  'Las Vegas, NV': { latitude: 36.1699, longitude: -115.1398 },
};

// Scheduled tab — mix of statuses so every flow variant is reachable by tapping.
export const SCHEDULED_TRIPS: Trip[] = [
  {
    id: '1832888',
    status: 'current', // active load → opens "Current load" detail (Open map)
    partial: '+ 2 partial loads',
    broker: 'TQL Logistics',
    miles: 486,
    stops: [
      { day: '13', month: 'MAR', city: 'New Berlin, WI', time: '10:00 AM' },
      { day: '14', month: 'MAR', city: 'Chicago, IL', time: '08:00 AM' },
    ],
  },
  {
    id: '3307613',
    status: 'scheduled', // → "Scheduled" detail (Swipe to start route)
    broker: 'Coyote Logistics',
    miles: 498,
    stops: [
      { day: '15', month: 'MAR', city: 'Kansas City, MO', time: '10:00 AM' },
      { day: '16', month: 'MAR', city: 'Pensacola, FL', time: '10:00 AM', timeEnd: '11:00 PM' },
    ],
  },
  {
    id: 'TRIP-70527',
    status: 'scheduled',
    partial: '+ 2 partial loads',
    broker: 'Echo Global',
    miles: 432,
    stops: [
      { day: '16', month: 'MAR', city: 'Des Moines, IA', time: '10:00 AM' },
      { day: '18', month: 'MAR', city: 'Mobile, AL', time: '10:00 AM', timeEnd: '11:00 PM' },
    ],
  },
  {
    id: '1071',
    status: 'scheduled',
    broker: 'Landstar',
    miles: 300,
    stops: [
      { day: '18', month: 'MAR', city: 'Sioux City, IA', time: '10:00 AM' },
      { day: '19', month: 'MAR', city: 'Baton Rouge, LA', time: '10:00 AM', timeEnd: '11:00 PM' },
    ],
  },
  {
    id: 'WH-5558617',
    status: 'tonu', // canceled → "Canceled" (TONU) detail
    partial: '+ 2 PTL loads',
    broker: 'JB Hunt',
    miles: 540,
    stops: [
      { day: '20', month: 'MAR', city: 'Omaha, NE', time: '10:00 AM' },
      { day: '21', month: 'MAR', city: 'Shreveport, LA', time: '10:00 AM', timeEnd: '11:00 PM' },
    ],
  },
];

// the active load, once delivered, surfaces here in the Completed tab
export const DELIVERED_CURRENT: Trip = {
  id: '#48213', // matches CURRENT_LOAD.reference
  status: 'delivered',
  stops: [
    { day: '13', month: 'MAR', city: 'New Berlin, WI', time: '10:00 AM' },
    { day: '14', month: 'MAR', city: 'Chicago, IL', time: '08:00 AM' },
  ],
};

export const COMPLETED_TRIPS: Trip[] = [
  {
    id: '1192034',
    status: 'delivered',
    stops: [
      { day: '2', month: 'MAR', city: 'Dallas, TX', time: '08:00 AM' },
      { day: '3', month: 'MAR', city: 'Memphis, TN', time: '06:00 PM' },
    ],
  },
  {
    id: 'TRIP-66120',
    status: 'delivered',
    stops: [
      { day: '28', month: 'FEB', city: 'Denver, CO', time: '09:30 AM' },
      { day: '1', month: 'MAR', city: 'Salt Lake City, UT', time: '04:00 PM' },
    ],
  },
  {
    id: '1180551',
    status: 'delivered',
    stops: [
      { day: '24', month: 'FEB', city: 'Phoenix, AZ', time: '07:00 AM' },
      { day: '25', month: 'FEB', city: 'Las Vegas, NV', time: '02:00 PM' },
    ],
  },
];

// --- per-load detail data (synced to each Trip by id) ---
const HOS_NOTE =
  'Complaints about hours of service will not be considered valid unless the carrier or driver calls our account payable at (551-273-3628) at the time of the perceived coercion. Escalation Number -718-314-4552.';

type DetailMeta = {
  dispatcher: string;
  phone: string;
  pickup: string;
  delivery: string;
  note?: string;
  // shipment spec (optional — falls back to sensible defaults)
  orderNo?: string;
  commodity?: string;
  weight?: string;
  dimensions?: string;
  quantity?: string;
  plate?: string;
  coDriver?: string;
  contactName?: string;
  rate?: string;
  reference?: string;
  temp?: string;
  hazmat?: boolean;
  accessorials?: string[];
  partials?: PartialLoad[];
};

const DETAIL_META: Record<string, DetailMeta> = {
  '1832888': { dispatcher: 'Edward Dean', phone: '+1 (417) 555-0142', pickup: '1575 Lebanon School Rd', delivery: '820 W Beach Dr', note: 'DO NOT LEAVE LOAD UNATTENDED', orderNo: '699567 7217 1255017439', commodity: 'Radlader CAT 906 + Ladegabel', weight: '42,000 lb', dimensions: '53 ft dry van', quantity: '2 units', plate: 'HB-S-6000', coDriver: 'Jimmy Schmidt', contactName: 'Marianne Holdenbrück', rate: '$1,490', reference: 'PRO 4471-8829', temp: 'Dry', hazmat: false, accessorials: ['Driver assist', 'Liftgate at delivery'], partials: [
    { id: '1832890', commodity: 'Pallet jacks (4)', route: 'New Berlin, WI → Milwaukee, WI', weight: '3,200 lb' },
    { id: '1832894', commodity: 'Auto parts — palletized', route: 'New Berlin, WI → Chicago, IL', weight: '6,800 lb' },
  ] },
  '3307613': { dispatcher: 'Maria Lopez', phone: '+1 (816) 555-0188', pickup: '4200 Front St', delivery: '710 N Palafox St' },
  'TRIP-70527': { dispatcher: 'Carl Jensen', phone: '+1 (515) 555-0173', pickup: '2900 SE 6th Ave', delivery: '1500 Industrial Blvd', note: 'Appointment required — call on arrival' },
  '1071': { dispatcher: 'Dana White', phone: '+1 (712) 555-0119', pickup: '900 Commerce Dr', delivery: '4501 Choctaw Rd' },
  'WH-5558617': { dispatcher: 'Greg Hall', phone: '+1 (402) 555-0150', pickup: '1200 Warehouse Rd', delivery: '3300 Industrial Pkwy', note: 'Load canceled by broker (TONU)' },
  '1192034': { dispatcher: 'Dana White', phone: '+1 (214) 555-0101', pickup: '5550 Logistics Ct', delivery: '1700 Distribution Dr' },
  'TRIP-66120': { dispatcher: 'Maria Lopez', phone: '+1 (303) 555-0166', pickup: '800 Cargo Way', delivery: '2200 Warehouse Blvd' },
  '1180551': { dispatcher: 'Carl Jensen', phone: '+1 (602) 555-0177', pickup: '4100 Air Lane', delivery: '950 Vegas Logistics Dr' },
  '#48213': { dispatcher: 'Edward Dean', phone: '+1 (551) 273-3628', pickup: '16875 W Ryerson Rd', delivery: '4200 Industrial Blvd', note: 'DO NOT LEAVE LOAD UNATTENDED', orderNo: '699567 7217 1255017439', commodity: 'Medical equipment — palletized', weight: '12,640 lb', dimensions: '48 × 40 × 60 in', quantity: '24 pallets', plate: 'HB-S-6000', coDriver: 'Jimmy Schmidt', contactName: 'Marianne Holdenbrück', rate: '$1,490', reference: 'PRO 4471-8829', temp: 'Reefer · 36°F', hazmat: false, accessorials: ['Appointment required', 'Liftgate at delivery'] },
};

function allTrips(): Trip[] {
  return [...SCHEDULED_TRIPS, ...COMPLETED_TRIPS, DELIVERED_CURRENT];
}

export function getLoadDetail(id: string): LoadDetail {
  const trip = allTrips().find((t) => t.id === id) ?? SCHEDULED_TRIPS[0];
  const meta = DETAIL_META[trip.id] ?? DETAIL_META['1832888'];
  const mk = (s: TripStop, kind: 'Pick up' | 'Delivery'): DetailStop => ({
    type: kind,
    address: `${kind === 'Pick up' ? meta.pickup : meta.delivery}, ${s.city}`,
    date: `${s.day} ${s.month} 2026`,
    time: s.time,
    note: kind === 'Pick up' ? meta.note : undefined,
    doneAt: `${s.day} ${s.month} 2026 • ${s.time}`,
    coordinate: CITY_COORDS[s.city] ?? DRIVER_LOCATION,
  });
  const pickup = trip.stops[0];
  const delivery = trip.stops[1] ?? trip.stops[0];
  // The active/partial load shows its full multi-stop itinerary (synced with the
  // Map tab + full-route map via NAV_STOPS); other loads show pickup + delivery.
  const isActive = trip.id === '1832888' || trip.id === '#48213';
  // Route history is derived on-device from the driver's GPS: stop 0 already
  // visited (actual arrival captured at the geofence), stop 1 in progress, the
  // rest still ahead. Leg distances are the on-device route segments.
  const LEGS = [undefined, '128 mi · 2h 10m', '92 mi · 1h 35m', '64 mi · 1h 05m'];
  const ARRIVALS = ['13 Mar · 10:04 AM'];
  const stops: DetailStop[] = isActive
    ? NAV_STOPS.map((s, i) => ({
        type: (s.kind === 'Pickup' ? 'Pick up' : 'Delivery') as 'Pick up' | 'Delivery',
        address: `${s.address}, ${s.city}`,
        date: s.date,
        time: s.window,
        doneAt: `${s.date} • ${s.window}`,
        progress: (i === 0 ? 'done' : i === 1 ? 'current' : 'upcoming') as 'done' | 'current' | 'upcoming',
        arrival: ARRIVALS[i],
        leg: LEGS[i],
        coordinate: s.coordinate,
      }))
    : [mk(pickup, 'Pick up'), mk(delivery, 'Delivery')];
  return {
    id: trip.id,
    status: 'Scheduled',
    dispatcher: { name: meta.dispatcher, phone: meta.phone },
    notes: [{ title: 'Hours of Service', body: HOS_NOTE }],
    details: {
      orderNo: meta.orderNo ?? '699567 7217 1255017439',
      commodity: meta.commodity ?? 'General freight — palletized',
      weight: meta.weight ?? '38,500 lb',
      dimensions: meta.dimensions ?? '53 ft dry van',
      quantity: meta.quantity ?? '26 pallets',
      plate: meta.plate ?? 'HB-S-6000',
      coDriver: meta.coDriver ?? 'Jimmy Schmidt',
      contact: { name: meta.contactName ?? 'Marianne Holdenbrück', phone: meta.phone },
      comment: meta.note,
      rate: meta.rate ?? '$1,250',
      reference: meta.reference ?? 'PRO 0000-0000',
      equipment: meta.dimensions ?? '53 ft dry van',
      temp: meta.temp ?? 'Dry',
      pieces: meta.quantity ?? '26 pallets',
      hazmat: meta.hazmat ?? false,
      accessorials: meta.accessorials ?? [],
    },
    stops,
    miles: trip.miles ? `${trip.miles} mi` : undefined,
    partials: meta.partials ?? [],
    tonu:
      trip.status === 'tonu'
        ? { fee: '$150.00', reason: 'Canceled by broker before pickup', canceledAt: '20 MAR 2026 · 8:12 AM' }
        : undefined,
  };
}

export type LoadStop = {
  type: 'Pick up' | 'Delivery';
  date: string;
  time: string;
  address: string;
  coordinate: { latitude: number; longitude: number };
};

export type Load = {
  id: string;
  reference: string;
  status: 'En route' | 'Scheduled' | 'Delivered' | 'TONU';
  broker: string;
  rate: string;
  miles: string;
  nextStop: LoadStop;
  pickup: LoadStop;
  delivery: LoadStop;
};

// New Berlin, WI area (matches Figma address)
export const DRIVER_LOCATION = { latitude: 42.9745, longitude: -88.1248 };

// Multi-stop run for navigation (pickup + 2 deliveries) — real coords for routing
export type NavStop = {
  kind: 'Pickup' | 'Delivery';
  city: string;
  address: string;
  date: string;
  window: string;
  coordinate: { latitude: number; longitude: number };
};

// Single source of truth for the active load's multi-stop itinerary (pickup +
// 2 partial deliveries). Used by the load detail, the live Map tab and the
// full-route map so they always stay in sync.
export const NAV_STOPS: NavStop[] = [
  { kind: 'Pickup', city: 'New Berlin, WI', address: '16875 W Ryerson Rd', date: '13 Mar 2026', window: '10:00 AM', coordinate: { latitude: 42.9912, longitude: -88.142 } },
  { kind: 'Delivery', city: 'Milwaukee, WI', address: '2200 Warehouse Rd', date: '13 Mar 2026', window: '01:00 PM', coordinate: { latitude: 43.0389, longitude: -87.9065 } },
  { kind: 'Delivery', city: 'Chicago, IL', address: '4200 Industrial Blvd', date: '14 Mar 2026', window: '06:00 PM', coordinate: { latitude: 41.8781, longitude: -87.6298 } },
];

export const ROUTE: { latitude: number; longitude: number }[] = [
  { latitude: 42.9912, longitude: -88.142 },
  { latitude: 42.9912, longitude: -88.1248 },
  { latitude: 42.9745, longitude: -88.1248 },
];

export const CURRENT_LOAD: Load = {
  id: 'L-48213',
  reference: '#48213',
  status: 'En route',
  broker: 'TQL Logistics',
  rate: '$2,450',
  miles: '486 mi',
  nextStop: {
    type: 'Pick up',
    date: '13 Mar',
    time: '10:00 AM',
    address: '16875 W Ryerson Road, NEW BERLIN, WI 53151',
    coordinate: { latitude: 42.9912, longitude: -88.142 },
  },
  pickup: {
    type: 'Pick up',
    date: '13 Mar',
    time: '10:00 AM',
    address: '16875 W Ryerson Road, NEW BERLIN, WI 53151',
    coordinate: { latitude: 42.9912, longitude: -88.142 },
  },
  delivery: {
    type: 'Delivery',
    date: '14 Mar',
    time: '08:00 AM',
    address: '4200 Industrial Blvd, CHICAGO, IL 60609',
    coordinate: { latitude: 41.8205, longitude: -87.6553 },
  },
};

export const SCHEDULED_LOADS: Load[] = [
  CURRENT_LOAD,
  {
    id: 'L-48330',
    reference: '#48330',
    status: 'Scheduled',
    broker: 'Coyote Logistics',
    rate: '$1,890',
    miles: '312 mi',
    nextStop: {
      type: 'Pick up',
      date: '16 Mar',
      time: '07:30 AM',
      address: '900 Commerce Dr, AURORA, IL 60504',
      coordinate: { latitude: 41.76, longitude: -88.32 },
    },
    pickup: {
      type: 'Pick up',
      date: '16 Mar',
      time: '07:30 AM',
      address: '900 Commerce Dr, AURORA, IL 60504',
      coordinate: { latitude: 41.76, longitude: -88.32 },
    },
    delivery: {
      type: 'Delivery',
      date: '16 Mar',
      time: '06:00 PM',
      address: '1500 Logistics Pkwy, INDIANAPOLIS, IN 46241',
      coordinate: { latitude: 39.71, longitude: -86.29 },
    },
  },
  {
    id: 'L-48402',
    reference: '#48402',
    status: 'Scheduled',
    broker: 'JB Hunt',
    rate: '$3,120',
    miles: '540 mi',
    nextStop: {
      type: 'Pick up',
      date: '18 Mar',
      time: '09:00 AM',
      address: '2200 Warehouse Rd, MILWAUKEE, WI 53218',
      coordinate: { latitude: 43.11, longitude: -87.97 },
    },
    pickup: {
      type: 'Pick up',
      date: '18 Mar',
      time: '09:00 AM',
      address: '2200 Warehouse Rd, MILWAUKEE, WI 53218',
      coordinate: { latitude: 43.11, longitude: -87.97 },
    },
    delivery: {
      type: 'Delivery',
      date: '19 Mar',
      time: '02:00 PM',
      address: '700 Distribution Ct, COLUMBUS, OH 43228',
      coordinate: { latitude: 39.93, longitude: -83.13 },
    },
  },
];
