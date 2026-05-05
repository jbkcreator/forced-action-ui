import { useEffect, useRef, useState } from 'react';
import { fetchZipActivity } from '../api/zipActivity';
import { isAbortError } from '../api/client';

/**
 * Polls /api/zip-activity once per unique ZIP (not per lead-card),
 * returning a map of `{ [zip]: { active_viewers, recent_volume } }`.
 *
 * Caller passes the visible ZIP set; the hook diffs against the prior set
 * so we don't restart timers when leads paginate within the same ZIP set.
 */
export default function useZipActivityMap(zips, vertical, intervalMs = 20000) {
  const [map, setMap] = useState({});
  const cancelRef = useRef([]);

  // Stable, sorted, deduplicated key for the ZIP set so deps are primitive.
  const key = Array.from(new Set((zips || []).filter(Boolean))).sort().join(',');

  useEffect(() => {
    cancelRef.current.forEach((c) => c());
    cancelRef.current = [];

    if (!key) {
      setMap({});
      return undefined;
    }

    const uniqueZips = key.split(',');
    let cancelled = false;
    const controllers = uniqueZips.map(() => new AbortController());

    async function pollOne(zip, controller) {
      try {
        const result = await fetchZipActivity(zip, vertical, { signal: controller.signal });
        if (!cancelled && !controller.signal.aborted) {
          setMap((prev) => ({ ...prev, [zip]: result || null }));
        }
      } catch (err) {
        if (isAbortError(err)) return;
        // Network errors degrade silently — badge just stays hidden.
      }
    }

    uniqueZips.forEach((zip, i) => pollOne(zip, controllers[i]));
    const timer = setInterval(() => {
      uniqueZips.forEach((zip, i) => {
        if (!controllers[i].signal.aborted) pollOne(zip, controllers[i]);
      });
    }, intervalMs);

    cancelRef.current = [
      () => { cancelled = true; clearInterval(timer); controllers.forEach((c) => c.abort()); },
    ];

    return () => {
      cancelled = true;
      clearInterval(timer);
      controllers.forEach((c) => c.abort());
    };
  }, [key, vertical, intervalMs]);

  return map;
}
