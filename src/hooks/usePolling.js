import { useEffect, useRef, useState, useCallback } from 'react';

export default function usePolling(fetcher, intervalMs = 30000, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const execute = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, deps);

  useEffect(() => {
    execute();
    timerRef.current = setInterval(execute, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [execute, intervalMs]);

  return { data, error };
}
