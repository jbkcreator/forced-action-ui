import { useEffect, useRef, useState, useCallback } from 'react';
import { isAbortError } from '../api/client';

export default function usePolling(fetcher, intervalMs = 30000, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const controllerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const execute = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const result = await fetcher(controller.signal);
      if (!controller.signal.aborted && mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (isAbortError(err) || controller.signal.aborted) return;
      if (mountedRef.current) setError(err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
    timerRef.current = setInterval(execute, intervalMs);
    return () => {
      clearInterval(timerRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [execute, intervalMs]);

  return { data, error };
}
