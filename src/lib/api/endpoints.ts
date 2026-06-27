import { apiFetch } from './client';

export type DriverBasicInfo = {
  driverId: number;
  username?: string | null;
  fullName?: string | null;
  companyId?: number | null;
  carrierId?: number | null;
  carrierName?: string | null;
  dispatcherId?: number | null;
  dispatcherName?: string | null;
  truckId?: number | null;
  truck?: string | null;
  trailerId?: number | null;
  trailer?: string | null;
};

export type WebAppAuthResponse = {
  linked: boolean;
  jwtToken?: string | null;
  driver?: DriverBasicInfo | null;
};

export function webappAuth(initData: string): Promise<WebAppAuthResponse> {
  return apiFetch('/api/bot/webapp/auth', {
    method: 'POST',
    body: { initData },
    retryOnUnauthorized: false,
  });
}

export function webappLinkRequestSms(initData: string, phoneNumber: string): Promise<void> {
  return apiFetch('/api/bot/webapp/link/request_sms', {
    method: 'POST',
    body: { initData, phoneNumber },
    retryOnUnauthorized: false,
  });
}

export function webappLinkVerifySms(
  initData: string,
  phoneNumber: string,
  code: string,
): Promise<WebAppAuthResponse> {
  return apiFetch('/api/bot/webapp/link/verify_sms', {
    method: 'POST',
    body: { initData, phoneNumber, code },
    retryOnUnauthorized: false,
  });
}

export function getMyLoads<T = unknown>(): Promise<T> {
  return apiFetch('/api/loads/mobile/all');
}

export function updateLoadStatus<T = unknown>(id: number | string, status: string): Promise<T> {
  return apiFetch(`/api/loads/mobile/status/${id}?status=${encodeURIComponent(status)}`, {
    method: 'POST',
  });
}

export type UploadLoadFileInput = {
  uri: string;
  name: string;
  mime: string;
  loadId: number | string;
  type: string;
  label: string;
};

export type MultipartUploadFile = {
  uri: string;
  name: string;
  mime: string;
};

export async function appendMultipartFile(
  form: FormData,
  field: string,
  file: MultipartUploadFile,
): Promise<void> {
  if (typeof window !== 'undefined') {
    const blob = await fetch(file.uri).then((response) => response.blob());
    form.append(field, blob, file.name);
  } else {
    form.append(field, {
      uri: file.uri,
      name: file.name,
      type: file.mime,
    } as unknown as Blob);
  }
}

export async function uploadLoadFile(input: UploadLoadFileInput): Promise<number> {
  const form = new FormData();
  await appendMultipartFile(form, 'file', input);
  form.append('loadId', String(input.loadId));
  form.append('type', input.type);
  form.append('label', input.label);
  return apiFetch('/api/loads/mobile/add_file', {
    method: 'POST',
    body: form,
    multipart: true,
  });
}

export type DriverLocationReport = {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
};

export function reportLocation(report: DriverLocationReport): Promise<void> {
  return apiFetch('/api/loads/mobile/location', {
    method: 'POST',
    body: report,
  });
}
