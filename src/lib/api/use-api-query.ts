import { useCallback, useEffect, useRef, useState } from 'react';

import { getMyLoads } from './endpoints';
import { buildDriverLoadModels, type DriverLoadDTO, type DriverLoadModels } from './load-adapter';
import type { QueryResult } from '@/lib/use-mock-query';

export type ApiQueryResult<T> = QueryResult & {
  data: T | null;
};

let cachedDriverLoads: DriverLoadModels | null = null;

export function getCachedDriverLoads(): DriverLoadModels | null {
  return cachedDriverLoads;
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
  const query = useApiQuery(
    useCallback(async () => {
      const loads = await getMyLoads<DriverLoadDTO[]>();
      cachedDriverLoads = buildDriverLoadModels(loads);
      return cachedDriverLoads;
    }, []),
  );

  return {
    ...query,
    data: query.data ?? cachedDriverLoads,
  };
}
