import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchDealRoom, createHoldCheckout } from '../api/dealRoom';

const POLL_INTERVAL_MS = 5000;

function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return '00:00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

function secondsUntil(isoString) {
  if (!isoString) return 0;
  return Math.max(0, Math.floor((new Date(isoString) - Date.now()) / 1000));
}

export default function DealRoomPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [holdLoading, setHoldLoading] = useState(false);
  const [holdError, setHoldError] = useState(null);

  const pollRef = useRef(null);
  const tickRef = useRef(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startCountdown = useCallback((expiresAt) => {
    stopTick();
    setCountdown(secondsUntil(expiresAt));
    tickRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(tickRef.current);
          tickRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTick]);

  const applyData = useCallback((d) => {
    setData(d);
    if (d.hold_state === 'held' && d.expires_at) {
      startCountdown(d.expires_at);
    }
  }, [startCountdown]);

  // Initial load
  useEffect(() => {
    fetchDealRoom(token)
      .then((d) => {
        applyData(d);
      })
      .catch((err) => {
        if (err?.status === 404) setNotFound(true);
        else setLoadError('Failed to load deal room. Please try again.');
      });
  }, [token, applyData]);

  // Pre-payment polling: runs while hold_state === 'available'
  useEffect(() => {
    if (!data) return;
    if (data.hold_state !== 'available') {
      stopPoll();
      return;
    }
    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(() => {
      fetchDealRoom(token)
        .then((d) => {
          applyData(d);
          if (d.hold_state !== 'available') stopPoll();
        })
        .catch(() => {/* silent — keep polling */});
    }, POLL_INTERVAL_MS);
    return () => stopPoll();
  }, [data?.hold_state, token, applyData, stopPoll]);

  // Cleanup on unmount
  useEffect(() => () => { stopPoll(); stopTick(); }, [stopPoll, stopTick]);

  const handleHold = async () => {
    setHoldLoading(true);
    setHoldError(null);
    try {
      const { url } = await createHoldCheckout(token);
      window.location.href = url;
    } catch (err) {
      setHoldError(err?.detail || 'Could not start checkout. Please try again.');
      setHoldLoading(false);
    }
  };

  // ── Render states ────────────────────────────────────────────────────────

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fa-bg-base">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-fa-text-primary mb-2">Link Not Found</h1>
          <p className="text-fa-text-secondary">This deal room link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fa-bg-base">
        <p className="text-fa-text-secondary">{loadError}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fa-bg-base">
        <p className="text-fa-text-secondary">Loading…</p>
      </div>
    );
  }

  const { prospect_name, zip, hold_state, properties = [], roi = [] } = data;
  const isAvailable = hold_state === 'available';
  const isHeld = hold_state === 'held';
  const isExpired = hold_state === 'expired';
  const isConverted = hold_state === 'converted';

  return (
    <div className="min-h-screen bg-fa-bg-base py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-fa-text-primary">
            Deal Room — {prospect_name}
          </h1>
          <p className="text-fa-text-secondary mt-1">ZIP {zip}</p>
        </div>

        {/* State banners */}
        {isConverted && (
          <div className="rounded-lg bg-green-900/30 border border-green-600 p-4 text-green-300 font-semibold text-center">
            Territory Secured — You're subscribed!
          </div>
        )}
        {isExpired && (
          <div className="rounded-lg bg-red-900/30 border border-red-600 p-4 text-red-300 font-semibold text-center">
            Territory Released
          </div>
        )}
        {isHeld && (
          <div className="rounded-lg border border-fa-border-default p-4 text-center">
            <p className="text-fa-text-secondary text-sm mb-1">Hold expires in</p>
            <p className="text-4xl font-mono font-bold text-fa-text-primary">
              {countdown > 0 ? formatCountdown(countdown) : 'Expired'}
            </p>
          </div>
        )}

        {/* Properties table */}
        <section>
          <h2 className="text-lg font-semibold text-fa-text-primary mb-3">
            Flagged Properties in ZIP {zip}
          </h2>
          {properties.length === 0 ? (
            <p className="text-fa-text-secondary text-sm">No properties on file.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-fa-border-default text-fa-text-secondary text-left">
                    <th className="py-2 pr-4 font-medium">Street</th>
                    <th className="py-2 pr-4 font-medium">Distress Type</th>
                    <th className="py-2 pr-4 font-medium">Tier</th>
                    <th className="py-2 font-medium">Date Flagged</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p, i) => (
                    <tr key={i} className="border-b border-fa-border-default">
                      <td className="py-2 pr-4 text-fa-text-primary">{p.street}</td>
                      <td className="py-2 pr-4 text-fa-text-secondary">{p.distress_type}</td>
                      <td className="py-2 pr-4 text-fa-text-secondary capitalize">{p.tier}</td>
                      <td className="py-2 text-fa-text-secondary">{p.date_flagged}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ROI table */}
        <section>
          <h2 className="text-lg font-semibold text-fa-text-primary mb-3">ROI by Tier</h2>
          {roi.length === 0 ? (
            <p className="text-fa-text-secondary text-sm">No ROI data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-fa-border-default text-fa-text-secondary text-left">
                    <th className="py-2 pr-4 font-medium">Tier</th>
                    <th className="py-2 pr-4 font-medium">Price / mo</th>
                    <th className="py-2 pr-4 font-medium">Payback Multiple</th>
                    <th className="py-2 font-medium">vs. Angi</th>
                  </tr>
                </thead>
                <tbody>
                  {roi.map((r, i) => (
                    <tr key={i} className="border-b border-fa-border-default">
                      <td className="py-2 pr-4 text-fa-text-primary capitalize">{r.tier}</td>
                      <td className="py-2 pr-4 text-fa-text-secondary">${r.price}</td>
                      <td className="py-2 pr-4 text-fa-text-secondary">{r.payback_multiple}×</td>
                      <td className="py-2 text-fa-text-secondary">{r.angi_comparison}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* CTA */}
        {!isConverted && !isExpired && (
          <section className="border border-fa-border-default rounded-lg p-6 space-y-4">
            <p className="text-xs text-fa-text-secondary leading-relaxed">
              <strong className="text-fa-text-primary">Disclosure:</strong> $97 secures this ZIP
              for 48 hours. Non-refundable. Credited to your first month if you subscribe.
            </p>
            {holdError && (
              <p className="text-red-400 text-sm">{holdError}</p>
            )}
            <button
              onClick={handleHold}
              disabled={!isAvailable || holdLoading}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-colors
                bg-fa-accent text-white
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:enabled:opacity-90"
            >
              {holdLoading
                ? 'Redirecting to checkout…'
                : isAvailable
                  ? 'Hold Territory Now — $97'
                  : isHeld
                    ? 'Territory On Hold'
                    : 'Unavailable'}
            </button>

            {/* Subscribe now — reuses the prefilled checkout URL (tier + ZIP + hold
                token threaded so the $97 is refunded on conversion, ADR 0035). */}
            {(isAvailable || isHeld) && (
              <a
                href={`/?start_tier=${encodeURIComponent(data.tier)}&zip=${encodeURIComponent(zip)}&hold=${encodeURIComponent(token)}`}
                className="block w-full text-center py-3 rounded-lg font-semibold text-sm
                  border border-fa-accent text-fa-accent hover:bg-fa-accent hover:text-white transition-colors"
              >
                Subscribe &amp; Keep This Territory
              </a>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
