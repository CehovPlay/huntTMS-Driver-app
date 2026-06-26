import { useCallback } from 'react';

import { apiFetch } from './client';
import { useApiQuery, type ApiQueryResult } from './use-api-query';

export type DriverTruck = {
  id: number;
  unit?: string | null;
  make?: string | null;
  model?: string | null;
  year?: string | null;
  vin?: string | null;
  plateNumber?: string | null;
  plateState?: string | null;
  plateCountry?: string | null;
  plateExpiration?: number | null; // epoch millis
};

export type DriverTrailer = {
  id: number;
  unit?: string | null;
  type?: string | null;
  make?: string | null;
  year?: string | null;
  vin?: string | null;
  plateNumber?: string | null;
  plateState?: string | null;
  plateCountry?: string | null;
};

export type DriverEquipment = {
  truck: DriverTruck | null;
  trailer: DriverTrailer | null;
};

export function getDriverEquipment(): Promise<DriverEquipment> {
  return apiFetch('/api/driver/equipment');
}

export function useDriverEquipment(): ApiQueryResult<DriverEquipment> {
  return useApiQuery(useCallback(() => getDriverEquipment(), []));
}

/** "Volkswagen T2 · 2009" — make/model/year, skipping blanks. */
export function truckMakeModel(t: DriverTruck): string {
  const mm = [t.make, t.model].filter(Boolean).join(' ');
  return [mm, t.year].filter(Boolean).join(' · ');
}

/** "IL · PW9832" — plate state + number, skipping blanks. */
export function plateLabel(p: { plateState?: string | null; plateNumber?: string | null }): string {
  return [p.plateState, p.plateNumber].filter(Boolean).join(' · ');
}
