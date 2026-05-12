import { useEffect, useRef, useState } from 'react';
import { fetchLeadHoldStatus } from '../api/leadHold';
import { isAbortError } from '../api/client';

const POLL_MS = 15_000;

export default function useLeadHold(propertyId, feedUuid, enabled = true) {
  const [status, setStatus] = useState(null);
  const ctrlRef = useRef(null);

  useEffect(() => {
    if (!enabled || !propertyId) {
      setStatus(null);
      return undefined;
    }

    let cancelled = false;

    const tick = async () => {
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      try {
        const data = await fetchLeadHoldStatus(propertyId, feedUuid, { signal: ctrl.signal });
        if (!cancelled) setStatus(data);
      } catch (err) {
        if (!isAbortError(err) && !cancelled) setStatus(null);
      }
    };

    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      ctrlRef.current?.abort();
    };
  }, [propertyId, feedUuid, enabled]);

  return status;
}
