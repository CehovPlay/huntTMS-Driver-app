// Mock profile data — driver, co-driver, documents, vehicle. Layout-first.

export type DocStatus = 'valid' | 'expiring' | 'expired';
export type Doc = { name: string; status: DocStatus; expires: string };

export const DRIVER = {
  name: 'Dmitry Chekhov',
  initials: 'DC',
  role: 'Company driver',
  cdl: 'CDL #D824-5567-1190 (Class A)',
  phone: '+1 (551) 555-0162',
  email: 'd.chekhov@hunttms.com',
};

export const CO_DRIVER = {
  name: 'Marcus Bell',
  initials: 'MB',
  phone: '+1 (551) 555-0144',
};

export const DRIVER_DOCS: Doc[] = [
  { name: "Driver's license (CDL-A)", status: 'valid', expires: '14 Aug 2028' },
  { name: 'Medical examiner certificate', status: 'expiring', expires: '02 Jul 2026' },
  { name: 'TWIC card', status: 'valid', expires: '21 Mar 2029' },
  { name: 'Hazmat endorsement', status: 'expired', expires: '10 Jan 2026' },
];

export const TRUCK = {
  unit: 'Unit 4471',
  makeModel: 'Freightliner Cascadia',
  year: '2022',
  plate: 'WI · TRK-4471',
  vin: '1FUJGLDR4NLAA1234',
};

export const TRAILER = {
  unit: 'Trailer 88-12',
  type: 'Dry Van · 53 ft',
  plate: 'WI · TRL-8812',
};

export const VEHICLE_DOCS: Doc[] = [
  { name: 'Truck registration', status: 'valid', expires: '31 Dec 2026' },
  { name: 'Insurance (COI)', status: 'valid', expires: '30 Sep 2026' },
  { name: 'Annual DOT inspection', status: 'expiring', expires: '18 Jul 2026' },
  { name: 'Trailer registration', status: 'valid', expires: '31 Dec 2026' },
];

export const NOTIFICATION_PREFS = [
  { key: 'loads', label: 'New loads', desc: 'When a load is assigned to you', on: true },
  { key: 'messages', label: 'Messages', desc: 'Chat from your dispatcher', on: true },
  { key: 'route', label: 'Route alerts', desc: 'Traffic, ETA and stop reminders', on: true },
  { key: 'docs', label: 'Document reminders', desc: 'Expiring licenses & permits', on: false },
];

export const PERMISSIONS = [
  { key: 'camera', label: 'Camera', desc: 'Scan & upload documents' },
  { key: 'location', label: 'Location', desc: 'Live tracking & navigation' },
  { key: 'microphone', label: 'Microphone', desc: 'Voice messages & calls' },
  { key: 'notifications', label: 'Notifications', desc: 'Loads, messages, alerts' },
];
