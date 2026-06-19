// DVIR — Driver Vehicle Inspection Report (mock). The component checklist a
// driver walks through before/after a trip (FMCSA §396.11 style).

export const DVIR_SECTIONS = [
  {
    title: 'Truck',
    items: [
      'Air compressor / lines',
      'Brakes (service & parking)',
      'Steering mechanism',
      'Lights & reflectors',
      'Tires',
      'Wheels & rims',
      'Horn',
      'Windshield wipers',
      'Mirrors',
      'Fluid levels',
    ],
  },
  {
    title: 'Trailer',
    items: [
      'Coupling / king pin',
      'Trailer brakes',
      'Trailer lights',
      'Doors & seals',
      'Tires & wheels',
      'Emergency equipment',
    ],
  },
] as const;

export const DVIR_ALL_ITEMS = DVIR_SECTIONS.flatMap((s) => s.items);
