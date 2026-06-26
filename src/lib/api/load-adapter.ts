import type { DetailStop, Load, LoadDetail, NavStop, PartialLoad, Trip, TripStatus } from '@/lib/mock';

export type DriverLoadContactDTO = {
  name: string | null;
  phone: string | null;
} | null;

export type DriverLoadDescriptionDTO = {
  description: string | null;
  weight: number | null;
  pieces: number | null;
  size: number | null;
  commodity: string | null;
  equipment: string | null;
} | null;

export type DriverStopDTO = {
  type: 'PICKUP' | 'DELIVERY';
  order: number;
  businessName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  contactName: string | null;
  contactPhone: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  scheduledFrom: string | null;
  scheduledTo: string | null;
};

export type DriverPartialLoadDTO = {
  loadId: number;
  referenceId: string | null;
  price: number | null;
  weight: number | null;
  commodity: string | null;
  route: string | null;
  stops: DriverStopDTO[];
};

export type DriverLoadDTO = {
  loadId: number;
  referenceId: string | null;
  status: string;
  price: number | null;
  totalMiles: number | null;
  loadMiles: number | null;
  ratePerMile: number | null;
  driveTime: number | null;
  partial: boolean;
  broker: DriverLoadContactDTO;
  dispatcher: DriverLoadContactDTO;
  description: DriverLoadDescriptionDTO;
  stops: DriverStopDTO[];
  partials: DriverPartialLoadDTO[];
};

export type DriverLoadModels = {
  raw: DriverLoadDTO[];
  trips: Trip[];
  scheduledTrips: Trip[];
  completedTrips: Trip[];
  details: Map<string, LoadDetail>;
  navStopsById: Map<string, NavStop[]>;
  mapLoads: Map<string, Load>;
  activeLoad: Load | null;
  activeNavStops: NavStop[];
};

const STATUS_TO_TRIP: Record<string, TripStatus> = {
  NEW: 'scheduled',
  ASSIGNED: 'scheduled',
  PICKED_UP: 'current',
  EN_ROUTE: 'current',
  DELIVERED: 'delivered',
  INVOICED: 'delivered',
  PAID: 'delivered',
  TONU: 'tonu',
};

const TRIP_TO_DETAIL_STATUS: Record<TripStatus, LoadDetail['status']> = {
  current: 'En route',
  scheduled: 'Scheduled',
  delivered: 'Delivered',
  tonu: 'TONU',
};

function displayId(load: DriverLoadDTO): string {
  return load.referenceId || String(load.loadId);
}

function miles(load: DriverLoadDTO): number | undefined {
  return load.totalMiles ?? load.loadMiles ?? undefined;
}

function tripStatus(load: DriverLoadDTO): TripStatus {
  return STATUS_TO_TRIP[load.status] ?? 'scheduled';
}

function fullCity(stop: DriverStopDTO): string {
  const city = stop.city?.trim();
  const state = stop.state?.trim();
  if (city && state) return `${city}, ${state}`;
  return city || state || '—';
}

function address(stop: DriverStopDTO): string {
  const base = stop.address || stop.businessName || fullCity(stop);
  const city = fullCity(stop);
  return base.includes(city) || city === '—' ? base : `${base}, ${city}`;
}

function stopDate(stop: DriverStopDTO): Date | null {
  const value = stop.scheduledFrom || stop.scheduledTo;
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDay(stop: DriverStopDTO): string {
  return stopDate(stop)?.getDate().toString() ?? '—';
}

function formatMonth(stop: DriverStopDTO): string {
  const d = stopDate(stop);
  return d ? d.toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBD';
}

function formatDate(stop: DriverStopDTO): string {
  const d = stopDate(stop);
  return d
    ? d.toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'TBD';
}

function formatTimeValue(value: string | null): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatTime(stop: DriverStopDTO): string {
  return formatTimeValue(stop.scheduledFrom) ?? formatTimeValue(stop.scheduledTo) ?? 'TBD';
}

function formatWindow(stop: DriverStopDTO): string {
  const start = formatTimeValue(stop.scheduledFrom);
  const end = formatTimeValue(stop.scheduledTo);
  if (start && end && start !== end) return `${start} - ${end}`;
  return start || end || 'TBD';
}

function normalizeCoordinate(stop: DriverStopDTO): { latitude: number; longitude: number } {
  const lat = stop.latitude;
  const lng = stop.longitude;
  if (lat == null || lng == null) return { latitude: 39.5, longitude: -98.35 };

  // The backend LoadInfo stores coordinates CONSISTENTLY swapped — the longitude is in the latitude
  // column and vice-versa (e.g. Jersey City came back latitude=-74.08, longitude=40.72). Always swap
  // back to real {latitude, longitude}. (A value-range guess fails for east-coast longitudes, |lng| <= 90.)
  return { latitude: lng, longitude: lat };
}

function firstStop(load: DriverLoadDTO, type: DriverStopDTO['type']): DriverStopDTO | undefined {
  return load.stops.find((s) => s.type === type);
}

function toTripStop(stop: DriverStopDTO) {
  return {
    day: formatDay(stop),
    month: formatMonth(stop),
    city: fullCity(stop),
    time: formatTime(stop),
    timeEnd: formatTimeValue(stop.scheduledTo),
  };
}

export function toTrip(load: DriverLoadDTO): Trip {
  const partialCount = load.partials?.length ?? 0;
  return {
    id: displayId(load),
    loadId: load.loadId,
    status: tripStatus(load),
    partial: load.partial || partialCount > 0 ? `+ ${partialCount || 1} partial load${partialCount === 1 ? '' : 's'}` : undefined,
    broker: load.broker?.name ?? undefined,
    miles: miles(load),
    stops: load.stops.map(toTripStop),
  };
}

function toPartial(partial: DriverPartialLoadDTO): PartialLoad {
  return {
    id: partial.referenceId || String(partial.loadId),
    commodity: partial.commodity || '—',
    route: partial.route || routeLabel(partial.stops),
    weight: partial.weight != null ? `${partial.weight.toLocaleString()} lb` : '—',
  };
}

function routeLabel(stops: DriverStopDTO[]): string {
  const pickup = stops.find((s) => s.type === 'PICKUP');
  const delivery = [...stops].reverse().find((s) => s.type === 'DELIVERY');
  return [pickup ? fullCity(pickup) : null, delivery ? fullCity(delivery) : null].filter(Boolean).join(' -> ') || '—';
}

function toDetailStop(stop: DriverStopDTO, index: number, status: TripStatus): DetailStop {
  return {
    type: stop.type === 'PICKUP' ? 'Pick up' : 'Delivery',
    address: address(stop),
    date: formatDate(stop),
    time: formatWindow(stop),
    note: stop.notes ?? undefined,
    doneAt: `${formatDate(stop)} • ${formatTime(stop)}`,
    progress:
      status === 'delivered'
        ? 'done'
        : status === 'current'
          ? index === 0
            ? 'done'
            : index === 1
              ? 'current'
              : 'upcoming'
          : 'upcoming',
    coordinate: normalizeCoordinate(stop),
  };
}

export function toLoadDetail(load: DriverLoadDTO): LoadDetail {
  const status = tripStatus(load);
  const desc = load.description;
  const dispatcherName = load.dispatcher?.name || '—';
  const dispatcherPhone = load.dispatcher?.phone || '—';
  const pickupContact = firstStop(load, 'PICKUP');
  const comment = load.stops.find((s) => s.notes)?.notes ?? desc?.description ?? undefined;

  return {
    id: displayId(load),
    status: TRIP_TO_DETAIL_STATUS[status],
    dispatcher: { name: dispatcherName, phone: dispatcherPhone },
    notes: comment ? [{ title: 'Load notes', body: comment }] : [],
    details: {
      orderNo: displayId(load),
      commodity: desc?.commodity || desc?.description || '—',
      weight: desc?.weight != null ? `${desc.weight.toLocaleString()} lb` : '—',
      dimensions: desc?.size != null ? String(desc.size) : '—',
      quantity: desc?.pieces != null ? String(desc.pieces) : '—',
      plate: '—',
      coDriver: '—',
      contact: {
        name: pickupContact?.contactName || load.broker?.name || '—',
        phone: pickupContact?.contactPhone || load.broker?.phone || '—',
      },
      comment,
      rate: load.price != null ? `$${load.price.toLocaleString()}` : '—',
      reference: displayId(load),
      equipment: desc?.equipment || '—',
      temp: '—',
      pieces: desc?.pieces != null ? String(desc.pieces) : '—',
      hazmat: false,
      accessorials: [],
    },
    stops: load.stops.map((s, i) => toDetailStop(s, i, status)),
    miles: miles(load) != null ? `${miles(load)} mi` : undefined,
    partials: (load.partials ?? []).map(toPartial),
    tonu: status === 'tonu' ? { fee: '—', reason: 'Canceled load', canceledAt: '—' } : undefined,
  };
}

export function toNavStop(stop: DriverStopDTO): NavStop {
  return {
    kind: stop.type === 'PICKUP' ? 'Pickup' : 'Delivery',
    city: fullCity(stop),
    address: address(stop),
    date: formatDate(stop),
    window: formatWindow(stop),
    coordinate: normalizeCoordinate(stop),
  };
}

export function toMapLoad(load: DriverLoadDTO): Load {
  const pickup = firstStop(load, 'PICKUP') ?? load.stops[0];
  const delivery = firstStop(load, 'DELIVERY') ?? load.stops[load.stops.length - 1] ?? pickup;
  const next = tripStatus(load) === 'current' ? delivery : pickup;
  const mk = (stop: DriverStopDTO | undefined, type: 'Pick up' | 'Delivery') => ({
    type,
    date: stop ? formatDate(stop) : 'TBD',
    time: stop ? formatWindow(stop) : 'TBD',
    address: stop ? address(stop) : '—',
    coordinate: stop ? normalizeCoordinate(stop) : { latitude: 39.5, longitude: -98.35 },
  });

  return {
    id: String(load.loadId),
    reference: displayId(load),
    status: TRIP_TO_DETAIL_STATUS[tripStatus(load)],
    broker: load.broker?.name || '—',
    rate: load.price != null ? `$${load.price.toLocaleString()}` : '—',
    miles: miles(load) != null ? `${miles(load)} mi` : '—',
    nextStop: mk(next, next?.type === 'DELIVERY' ? 'Delivery' : 'Pick up'),
    pickup: mk(pickup, 'Pick up'),
    delivery: mk(delivery, 'Delivery'),
  };
}

export function buildDriverLoadModels(loads: DriverLoadDTO[]): DriverLoadModels {
  const trips = loads.map(toTrip);
  const details = new Map<string, LoadDetail>();
  const navStopsById = new Map<string, NavStop[]>();
  const mapLoads = new Map<string, Load>();

  for (const load of loads) {
    // Key by the UNIQUE loadId only. referenceId is NOT unique (multiple loads share it), so keying by
    // it collides — earlier rows get silently overwritten and detail/map lookups return the wrong load.
    const key = String(load.loadId);
    details.set(key, toLoadDetail(load));
    navStopsById.set(key, load.stops.map(toNavStop));
    mapLoads.set(key, toMapLoad(load));
  }

  const scheduledTrips = trips.filter((t) => t.status === 'scheduled' || t.status === 'current' || t.status === 'tonu');
  const completedTrips = trips.filter((t) => t.status === 'delivered');
  const activeRaw =
    loads.find((l) => tripStatus(l) === 'current') ??
    loads.find((l) => tripStatus(l) === 'scheduled') ??
    loads[0];

  return {
    raw: loads,
    trips,
    scheduledTrips,
    completedTrips,
    details,
    navStopsById,
    mapLoads,
    activeLoad: activeRaw ? toMapLoad(activeRaw) : null,
    activeNavStops: activeRaw ? activeRaw.stops.map(toNavStop) : [],
  };
}

