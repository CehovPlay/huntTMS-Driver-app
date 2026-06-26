import { API_URL } from './config';
import { clearToken, getToken, setToken } from './token-store';
import { getAuthInitData } from '@/lib/auth/auth-init-data';

type ApiFetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  multipart?: boolean;
  retryOnUnauthorized?: boolean;
};

type WebAppAuthResponse = {
  linked: boolean;
  jwtToken?: string | null;
};

let unauthorizedHandler: (() => void) | null = null;
let reauthPromise: Promise<boolean> | null = null;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function urlFor(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }
  if (!response.ok) {
    const body = data as { message?: unknown; error?: unknown } | undefined;
    const message =
      typeof body?.message === 'string'
        ? body.message
        : typeof body?.error === 'string'
          ? body.error
          : text || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }
  return data as T;
}

async function exchangeInitData(): Promise<boolean> {
  const initData = getAuthInitData();
  if (!initData) return false;

  const response = await fetch(urlFor('/api/bot/webapp/auth'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });
  const data = await parseResponse<WebAppAuthResponse>(response);
  if (!data.linked || !data.jwtToken) return false;
  setToken(data.jwtToken);
  return true;
}

async function reauthOnce(): Promise<boolean> {
  if (!reauthPromise) {
    reauthPromise = exchangeInitData().finally(() => {
      reauthPromise = null;
    });
  }
  return reauthPromise;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, multipart = false, retryOnUnauthorized = true } = options;
  const token = getToken();
  const requestHeaders: Record<string, string> = { ...headers };
  let requestBody: BodyInit | undefined;

  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    if (multipart) {
      requestBody = body as BodyInit;
    } else {
      requestHeaders['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(urlFor(path), {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  if (response.status === 401 && retryOnUnauthorized) {
    clearToken();
    const reauthed = await reauthOnce().catch(() => false);
    if (reauthed) return apiFetch<T>(path, { ...options, retryOnUnauthorized: false });
    unauthorizedHandler?.();
  }

  return parseResponse<T>(response);
}
