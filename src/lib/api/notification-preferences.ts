import { useCallback } from 'react';

import { apiFetch } from './client';
import { useApiQuery, type ApiQueryResult } from './use-api-query';

export type DriverNotificationPreference = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
};

const PATH = '/api/driver/notification-preferences';

export function getNotificationPreferences(): Promise<DriverNotificationPreference[]> {
  return apiFetch(PATH);
}

export function updateNotificationPreferences(
  preferences: Record<string, boolean>,
): Promise<DriverNotificationPreference[]> {
  return apiFetch(PATH, {
    method: 'PUT',
    body: { preferences },
  });
}

export function useNotificationPreferences(): ApiQueryResult<DriverNotificationPreference[]> {
  return useApiQuery(useCallback(() => getNotificationPreferences(), []));
}
