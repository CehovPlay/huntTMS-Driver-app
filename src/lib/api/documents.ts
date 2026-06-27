import { useCallback } from 'react';

import { apiFetch } from './client';
import { appendMultipartFile, type MultipartUploadFile } from './endpoints';
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

export type UploadDriverDocumentInput = {
  docType: string;
  expiryDate?: number;
  file?: MultipartUploadFile;
};

export async function uploadDriverDocument(
  input: UploadDriverDocumentInput,
): Promise<DriverDocumentItem> {
  const form = new FormData();
  form.append('docType', input.docType);
  if (input.expiryDate !== undefined) form.append('expiryDate', String(input.expiryDate));
  if (input.file) await appendMultipartFile(form, 'file', input.file);
  return apiFetch('/api/driver/documents', {
    method: 'POST',
    body: form,
    multipart: true,
  });
}

export function useDriverDocuments(): ApiQueryResult<DriverDocuments> {
  return useApiQuery(useCallback(() => getDriverDocuments(), []));
}
