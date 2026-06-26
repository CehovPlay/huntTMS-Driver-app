import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Mock data-fetch layer. Screens render skeletons on first load, an error
// state when `offline` is on, and content otherwise. When the real API lands
// (see vault 14 - Backend Integration) this hook gets replaced by the query
// client; screens keep the same {loading, refreshing, error, refetch} shape.

let _offline = false;
const subs = new Set<() => void>();

export function setOffline(v: boolean) {
  _offline = v;
  subs.forEach((s) => s());
}
function getOffline() {
  return _offline;
}
function subscribe(cb: () => void) {
  subs.add(cb);
  return () => subs.delete(cb);
}
// Reactive read of the offline flag (e.g. for the Profile toggle).
export function useOffline() {
  return useSyncExternalStore(subscribe, getOffline, getOffline);
}

export type QueryResult = {
  loading: boolean; // first load, no data yet → show skeletons
  refreshing: boolean; // re-fetch with data already present → pull-to-refresh spinner
  error: boolean;
  refetch: () => void;
};

export function useMockQuery(delay = 800): QueryResult {
  const [state, setState] = useState({ loading: true, refreshing: false, error: false });
  const loadedOnce = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setState({ loading: !loadedOnce.current, refreshing: loadedOnce.current, error: false });
    timer.current = setTimeout(() => {
      loadedOnce.current = true;
      setState({ loading: false, refreshing: false, error: getOffline() });
    }, delay);
  }, [delay]);

  useEffect(() => {
    run();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [run]);

  return { ...state, refetch: run };
}
