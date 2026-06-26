import { getInitData } from '@/lib/telegram';

const DEV_INIT_DATA = 'user=%7B%22id%22%3A777000777%7D';

export function getAuthInitData(): string {
  const telegramInitData = getInitData();
  if (telegramInitData) return telegramInitData;

  const envInitData = process.env.EXPO_PUBLIC_TELEGRAM_INIT_DATA;
  if (envInitData) return envInitData;

  if (typeof __DEV__ !== 'undefined' && __DEV__) return DEV_INIT_DATA;
  return '';
}

