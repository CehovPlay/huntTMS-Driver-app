import { useCallback } from 'react';

import { apiFetch } from './client';
import { useApiQuery, type ApiQueryResult } from './use-api-query';

export type DvirInspectionType = 'PRE_TRIP' | 'POST_TRIP';

export type DvirDefect = {
  item: string;
  note?: string;
};

export type SubmitDvirRequest = {
  inspectionType: DvirInspectionType;
  odometer?: number;
  notes?: string;
  defects: DvirDefect[];
};

export type DvirReportView = {
  id: number;
  inspectionType: DvirInspectionType;
  odometer: number | null;
  defectsFound: boolean;
  notes: string | null;
  vehicleId: number | null;
  trailerId: number | null;
  createdAt: number;
  defects: DvirDefect[];
};

const PATH = '/api/driver/dvir';

export function submitDvir(request: SubmitDvirRequest): Promise<DvirReportView> {
  return apiFetch(PATH, { method: 'POST', body: request });
}

export function getDvirReports(): Promise<DvirReportView[]> {
  return apiFetch(PATH);
}

export function useDvirReports(): ApiQueryResult<DvirReportView[]> {
  return useApiQuery(useCallback(() => getDvirReports(), []));
}
