import {
  reportLocation,
  updateLoadStatus,
  uploadLoadFile,
  type DriverLocationReport,
} from './endpoints';

export type DriverStatusUpdate = 'PICKED_UP' | 'EN_ROUTE' | 'DELIVERED' | 'TONU';
export type LoadFileLogicalType = 'CONFIRMATION' | 'BOL' | 'POD' | 'LUMPER' | 'OTHER';

const DOC_TYPE_MAP: Record<string, LoadFileLogicalType> = {
  'Bill of landing': 'BOL',
  'Proof of delivery': 'POD',
  'Lumper fee': 'LUMPER',
};

export function toLoadFileLogicalType(label?: string): LoadFileLogicalType {
  if (!label) return 'OTHER';
  return DOC_TYPE_MAP[label] ?? 'OTHER';
}

export function updateDriverLoadStatus(loadId: string | number, status: DriverStatusUpdate): Promise<unknown> {
  return updateLoadStatus(loadId, status);
}

export function uploadDriverLoadFile(input: {
  loadId: string | number;
  uri: string;
  label?: string;
  name?: string;
  mime?: string;
}): Promise<number> {
  const label = input.label || 'Other';
  return uploadLoadFile({
    uri: input.uri,
    name: input.name || defaultFileName(label),
    mime: input.mime || mimeFromUri(input.uri),
    loadId: input.loadId,
    type: toLoadFileLogicalType(label),
    label,
  });
}

export function reportDriverLocation(report: DriverLocationReport): Promise<void> {
  return reportLocation(report);
}

function defaultFileName(label: string): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'document';
  return `${slug}.jpg`;
}

function mimeFromUri(uri: string): string {
  if (uri.startsWith('data:')) {
    const match = /^data:([^;,]+)/.exec(uri);
    return match?.[1] ?? 'image/jpeg';
  }
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return 'image/jpeg';
}

