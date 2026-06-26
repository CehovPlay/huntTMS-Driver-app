import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { setUnauthorizedHandler } from '@/lib/api/client';
import { clearToken, setToken } from '@/lib/api/token-store';
import {
  type DriverBasicInfo,
  webappAuth,
  webappLinkVerifySms,
} from '@/lib/api/endpoints';
import { getAuthInitData } from './auth-init-data';

type AuthStatus = 'loading' | 'needs-link' | 'signed-in' | 'error';

type AuthContextValue = {
  status: AuthStatus;
  driver: DriverBasicInfo | null;
  error: string | null;
  initData: string;
  linkVerify: (phoneNumber: string, code: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [driver, setDriver] = useState<DriverBasicInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initData, setInitData] = useState('');

  const signOut = useCallback(() => {
    clearToken();
    setDriver(null);
    setError(null);
    setStatus('needs-link');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const nextInitData = getAuthInitData();
      if (!cancelled) setInitData(nextInitData);
      if (!nextInitData) {
        if (!cancelled) {
          clearToken();
          setError('Open this app from Telegram to continue.');
          setStatus('error');
        }
        return;
      }

      try {
        const response = await webappAuth(nextInitData);
        if (cancelled) return;
        if (response.linked && response.jwtToken) {
          setToken(response.jwtToken);
          setDriver(response.driver ?? null);
          setError(null);
          setStatus('signed-in');
        } else {
          clearToken();
          setDriver(null);
          setError(null);
          setStatus('needs-link');
        }
      } catch (e) {
        if (cancelled) return;
        clearToken();
        setDriver(null);
        setError(e instanceof Error ? e.message : 'Telegram authentication failed.');
        setStatus('error');
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const linkVerify = useCallback(async (phoneNumber: string, code: string) => {
    const nextInitData = initData || getAuthInitData();
    if (!nextInitData) throw new Error('Open this app from Telegram to continue.');
    const response = await webappLinkVerifySms(nextInitData, phoneNumber, code);
    if (!response.linked || !response.jwtToken) throw new Error('Invalid verification response.');
    setToken(response.jwtToken);
    setInitData(nextInitData);
    setDriver(response.driver ?? null);
    setError(null);
    setStatus('signed-in');
  }, [initData]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      driver,
      error,
      initData,
      linkVerify,
      signOut,
    }),
    [driver, error, initData, linkVerify, signOut, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

