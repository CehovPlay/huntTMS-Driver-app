import { useCallback, useEffect, useState } from 'react';

import { apiFetch } from './client';
import { useApiQuery, type ApiQueryResult } from './use-api-query';

export type ChatSenderType = 'DRIVER' | 'OFFICE' | 'SYSTEM';
export type ChatMessageKind = 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'SYSTEM';
export const CHAT_ATTACHMENT_PLACEHOLDER = '📎 Attachment';

export type ChatMessageView = {
  id: number;
  loadId: number;
  senderType: ChatSenderType;
  senderUserId: number | null;
  senderDriverId: number | null;
  senderName: string | null;
  kind: ChatMessageKind;
  body: string | null;
  fileId: number | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  durationSeconds: number | null;
  replyToId: number | null;
  createdAt: number;
  mine: boolean;
};

export type ChatConversationView = {
  loadId: number;
  customerLoadId: string | null;
  status: string | null;
  counterpartName: string | null;
  lastMessagePreview: string | null;
  lastMessageKind: string | null;
  lastMessageTime: number;
  unread: number;
  mineLast: boolean;
};

const ROUTE = '/api/driver/chat';
const unreadListeners = new Set<() => void>();

export function getDriverChatConversations(): Promise<ChatConversationView[]> {
  return apiFetch(`${ROUTE}/conversations`);
}

export function getDriverChatMessages(
  loadId: number,
  before?: number,
  limit = 50,
): Promise<ChatMessageView[]> {
  const params = [`limit=${Math.min(limit, 50)}`];
  if (before !== undefined) params.push(`before=${before}`);
  return apiFetch(`${ROUTE}/${loadId}/messages?${params.join('&')}`);
}

export function sendDriverChatMessage(loadId: number, body: string): Promise<ChatMessageView> {
  return apiFetch(`${ROUTE}/${loadId}/messages`, {
    method: 'POST',
    body: { kind: 'TEXT', body },
  });
}

export function markDriverChatRead(loadId: number): Promise<void> {
  return apiFetch(`${ROUTE}/${loadId}/read`, { method: 'POST' });
}

export function getDriverChatUnreadCount(): Promise<number> {
  return apiFetch<{ unreadCount?: number }>(`${ROUTE}/unread-count`).then((data) =>
    Number(data.unreadCount ?? 0),
  );
}

export function notifyDriverChatUnreadChanged(): void {
  unreadListeners.forEach((listener) => listener());
}

export function useDriverChatConversations(): ApiQueryResult<ChatConversationView[]> {
  return useApiQuery(useCallback(() => getDriverChatConversations(), []));
}

export function useDriverChatThread(loadId: number | null): ApiQueryResult<ChatMessageView[]> {
  return useApiQuery(
    useCallback(
      () => (loadId === null ? Promise.resolve([]) : getDriverChatMessages(loadId)),
      [loadId],
    ),
  );
}

export function useDriverChatUnreadCount(): ApiQueryResult<number> {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const listener = () => setVersion((value) => value + 1);
    unreadListeners.add(listener);
    return () => {
      unreadListeners.delete(listener);
    };
  }, []);
  return useApiQuery(useCallback(() => getDriverChatUnreadCount(), [version]));
}
