import { useEffect, useState } from 'react';
import { fetchTerritoryMap, isAbortError } from '../api/territoryMap';

export default function useTerritoryMap(countyId, vertical, intervalMs = 60000) {
  const [state, setState] = useState({ zips: [], loading: true, error: null });

  useEffect(() => {
    if (!countyId || !vertical) return undefined;
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetchTerritoryMap(countyId, vertical, { signal: controller.signal });
        if (!cancelled) setState({ zips: res.zips || [], loading: false, error: null });
      } catch (err) {
        if (isAbortError(err)) return;
        if (!cancelled) setState((d) => ({ ...d, loading: false, error: err }));
      }
    }

    load();
    const t = setInterval(load, intervalMs);
    return () => { cancelled = true; clearInterval(t); controller.abort(); };
  }, [countyId, vertical, intervalMs]);

  return state;
}
