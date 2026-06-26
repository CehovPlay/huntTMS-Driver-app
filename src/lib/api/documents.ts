import { useCallback } from 'react';

import { apiFetch } from './client';
import { useApiQuery, type ApiQueryResult } from './use-api-query';

export type DriverDocumentStatus = 'VALID' | 'EXPIRING' | 'EXPIRED' | 'MISSING';

export type DriverDocumentItem = {
  type: string;
  label: string;
  expiryDate: number | null;
  status: DriverDocumentStatus;
  fileId: number | null;
  hasFile: boolean;
};

export type DriverDocuments = {
  driver: DriverDocumentItem[];
  vehicle: DriverDocumentItem[];
};

export function getDriverDocuments(): Promise<DriverDocuments> {
  return apiFetch('/api/driver/documents');
}

export function useDriverDocuments(): ApiQueryResult<DriverDocuments> {
  return useApiQuery(useCallback(() => getDriverDocuments(), []));
}
