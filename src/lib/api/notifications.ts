import { useCallback, useEffect, useState } from 'react';

import { apiFetch } from './client';
import { useApiQuery, type ApiQueryResult } from './use-api-query';

export type DriverNotification = {
  id: number;
  title: string;
  body?: string | null;
  type?: string | null;
  entityType?: string | null;
  entityId?: number | string | null;
  createdAt?: string | number | null;
  readAt?: string | number | null;
  read?: boolean | null;
};

export function getDriverNotifications(): Promise<DriverNotification[]> {
  return apiFetch('/api/driver/notifications');
}

export function getDriverNotificationUnreadCount(): Promise<number> {
  return apiFetch<number | { count?: number }>('/api/driver/notifications/unread-count').then((data) =>
    typeof data === 'number' ? data : Number(data?.count ?? 0),
  );
}

export function markDriverNotificationRead(id: number | string): Promise<void> {
  return apiFetch(`/api/driver/notifications/${id}/read`, { method: 'POST' });
}

const unreadListeners = new Set<() => void>();

export function notifyDriverNotificationUnreadChanged(): void {
  unreadListeners.forEach((listener) => listener());
}

export function useDriverNotifications(): ApiQueryResult<DriverNotification[]> {
  return useApiQuery(useCallback(() => getDriverNotifications(), []));
}

export function useDriverNotificationUnreadCount(): ApiQueryResult<number> {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    unreadListeners.add(listener);
    return () => {
      unreadListeners.delete(listener);
    };
  }, []);
  return useApiQuery(useCallback(() => getDriverNotificationUnreadCount(), [version]));
}
