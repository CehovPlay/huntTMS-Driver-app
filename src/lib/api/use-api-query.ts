import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { getMyLoads } from './endpoints';
import { buildDriverLoadModels, type DriverLoadDTO, type DriverLoadModels } from './load-adapter';
import type { QueryResult } from '@/lib/use-mock-query';

export type ApiQueryResult<T> = QueryResult & {
  data: T | null;
};

let cachedDriverLoads: DriverLoadModels | null = null;
let driverLoadsInFlight: Promise<DriverLoadModels> | null = null;
let lastDriverLoadsFetchAt = 0;
let driverLoadsLifecycleUsers = 0;
let stopDriverLoadsLifecycle: (() => void) | null = null;
const driverLoadsListeners = new Set<(loads: DriverLoadModels) => void>();

const LOAD_REFRESH_COOLDOWN_MS = 1_500;
const LOAD_POLL_MS = 30_000;

export function getCachedDriverLoads(): DriverLoadModels | null {
  return cachedDriverLoads;
}

function publishDriverLoads(loads: DriverLoadModels): void {
  cachedDriverLoads = loads;
  driverLoadsListeners.forEach((listener) => listener(loads));
}

export function refreshDriverLoads(): Promise<DriverLoadModels> {
  if (driverLoadsInFlight) return driverLoadsInFlight;
  if (
    cachedDriverLoads &&
    Date.now() - lastDriverLoadsFetchAt < LOAD_REFRESH_COOLDOWN_MS
  ) {
    return Promise.resolve(cachedDriverLoads);
  }

  lastDriverLoadsFetchAt = Date.now();
  driverLoadsInFlight = getMyLoads<DriverLoadDTO[]>()
    .then((loads) => {
      const models = buildDriverLoadModels(loads);
      publishDriverLoads(models);
      return models;
    })
    .finally(() => {
      driverLoadsInFlight = null;
    });
  return driverLoadsInFlight;
}

function refreshDriverLoadsInBackground(): void {
  refreshDriverLoads().catch(() => undefined);
}

function startDriverLoadsLifecycle(): () => void {
  let nativeActive = AppState.currentState === 'active';
  let webVisible = typeof document === 'undefined' || document.visibilityState === 'visible';
  let active = nativeActive && webVisible;

  const updateActive = () => {
    const next = nativeActive && webVisible;
    if (next && !active) refreshDriverLoadsInBackground();
    active = next;
  };

  const appStateSubscription = AppState.addEventListener('change', (state) => {
    nativeActive = state === 'active';
    updateActive();
  });
  const onVisibilityChange = () => {
    webVisible = document.visibilityState === 'visible';
    updateActive();
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }
  const poll = setInterval(() => {
    if (active) refreshDriverLoadsInBackground();
  }, LOAD_POLL_MS);

  return () => {
    clearInterval(poll);
    appStateSubscription.remove();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  };
}

function retainDriverLoadsLifecycle(): () => void {
  driverLoadsLifecycleUsers += 1;
  if (driverLoadsLifecycleUsers === 1) {
    stopDriverLoadsLifecycle = startDriverLoadsLifecycle();
  }
  return () => {
    driverLoadsLifecycleUsers -= 1;
    if (driverLoadsLifecycleUsers === 0) {
      stopDriverLoadsLifecycle?.();
      stopDriverLoadsLifecycle = null;
    }
  };
}

export function useApiQuery<T>(queryFn: () => Promise<T>): ApiQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState({ loading: true, refreshing: false, error: false });
  const loadedOnce = useRef(false);

  const run = useCallback(async () => {
    setState({ loading: !loadedOnce.current, refreshing: loadedOnce.current, error: false });
    try {
      const next = await queryFn();
      loadedOnce.current = true;
      setData(next);
      setState({ loading: false, refreshing: false, error: false });
    } catch {
      loadedOnce.current = true;
      setState({ loading: false, refreshing: false, error: true });
    }
  }, [queryFn]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, ...state, refetch: run };
}

export function useDriverLoads(): ApiQueryResult<DriverLoadModels> {
  const [data, setData] = useState<DriverLoadModels | null>(cachedDriverLoads);
  const [state, setState] = useState({
    loading: cachedDriverLoads === null,
    refreshing: cachedDriverLoads !== null,
    error: false,
  });
  const loadedOnce = useRef(cachedDriverLoads !== null);

  const run = useCallback(async () => {
    const hasData = loadedOnce.current || cachedDriverLoads !== null;
    setState({ loading: !hasData, refreshing: hasData, error: false });
    try {
      const next = await refreshDriverLoads();
      loadedOnce.current = true;
      setData(next);
      setState({ loading: false, refreshing: false, error: false });
    } catch {
      const hasCachedData = cachedDriverLoads !== null;
      setState({ loading: false, refreshing: false, error: !hasCachedData });
    }
  }, []);

  useEffect(() => {
    const onLoads = (next: DriverLoadModels) => {
      loadedOnce.current = true;
      setData(next);
      setState({ loading: false, refreshing: false, error: false });
    };
    driverLoadsListeners.add(onLoads);
    const releaseLifecycle = retainDriverLoadsLifecycle();
    run();
    return () => {
      driverLoadsListeners.delete(onLoads);
      releaseLifecycle();
    };
  }, [run]);

  return { data: data ?? cachedDriverLoads, ...state, refetch: run };
}
