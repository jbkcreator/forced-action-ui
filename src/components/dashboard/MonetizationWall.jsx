/**
 * MonetizationWall — first-session countdown + ROI framing for new subscribers.
 *
 * Behaviour:
 *   1. On mount, opens a wall session via POST /api/wall/session (or reuses
 *      an existing session_id in localStorage).
 *   2. Polls GET /api/wall/{session_id} every 10 seconds to keep the state
 *      + countdown live.
 *   3. Renders: 15-minute countdown, vertical-specific ROI frame, live
 *      qualified-lead count, Unlock CTA that triggers onUnlock().
 *   4. When `converted === true` appears in state, fires onConverted() and
 *      unmounts itself.
 *
 * Designed to sit above the lead feed on the dashboard for brand-new
 * subscribers in their first 24 hours. For users outside the 24-hour
 * window the component silently returns null.
 *
 * Props:
 *   subscriberId   — numeric id (from JWT / dashboard context)
 *   vertical       — 'roofing' | 'remediation' | ...
 *   countyId       — 'hillsborough' by default
 *   feedUuid       — used by the Unlock CTA to create a PaymentIntent
 *   onUnlock       — callback(leadContext) when user taps the main CTA
 *   onConverted    — callback() once the wall flips to converted
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { openWallSession, fetchWallSession } from '../../api/phase2b';
import Icon from '../ui/Icon';

const STORAGE_KEY_PREFIX = 'fa.wall.session.';
const POLL_MS = 10_000;
const COUNTDOWN_FLOOR_MS = 0;


function formatCountdown(ms) {
  if (ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}


export default function MonetizationWall({
  subscriberId,
  vertical = 'roofing',
  countyId = 'hillsborough',
  onUnlock,
  onConverted,
}) {
  const [state, setState] = useState(null);
  const [roi, setRoi] = useState(null);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const pollTimer = useRef(null);
  const sessionIdRef = useRef(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // ─── Session init ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!subscriberId) return;
    const storageKey = STORAGE_KEY_PREFIX + subscriberId;
    let cancelled = false;

    async function init() {
      try {
        let sessionId = localStorage.getItem(storageKey);
        if (!sessionId) {
          sessionId = `wall-${subscriberId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          localStorage.setItem(storageKey, sessionId);
        }
        sessionIdRef.current = sessionId;

        // Try to fetch existing session state first
        let session = null;
        try {
          session = await fetchWallSession(sessionId);
        } catch (e) {
          if (e.status !== 404) throw e;
        }

        if (!session) {
          const created = await openWallSession({
            subscriberId,
            sessionId,
            vertical,
            countyId,
          });
          if (cancelled) return;
          setState(created.session);
          setRoi(created.roi_frame);
        } else {
          if (cancelled) return;
          setState(session);
          // ROI frame is only returned on creation. For subsequent loads we
          // don't have it. The UI still works — ROI is optional polish.
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not open wall session');
      }
    }

    init();
    return () => { cancelled = true; };
  }, [subscriberId, vertical, countyId]);

  // ─── Polling ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state || state.converted) return;
    pollTimer.current = setInterval(async () => {
      try {
        const fresh = await fetchWallSession(sessionIdRef.current);
        setState(fresh);
      } catch (err) {
        // On 404 the session expired — remove from storage so next mount creates new
        if (err.status === 404) {
          localStorage.removeItem(STORAGE_KEY_PREFIX + subscriberId);
          clearInterval(pollTimer.current);
        }
      }
    }, POLL_MS);
    return () => clearInterval(pollTimer.current);
  }, [state?.converted, subscriberId]);

  // ─── 1-second clock tick for the countdown ──────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // ─── React to conversion ────────────────────────────────────────────────
  useEffect(() => {
    if (state?.converted) {
      onConverted?.();
    }
  }, [state?.converted, onConverted]);

  // ─── Derived ────────────────────────────────────────────────────────────
  const countdownMs = useMemo(() => {
    // Backend returns `countdown_expires` (ISO string).
    const expiresAt = state?.countdown_expires || state?.countdown_expires_at;
    if (!expiresAt) return COUNTDOWN_FLOOR_MS;
    return Math.max(
      COUNTDOWN_FLOOR_MS,
      new Date(expiresAt).getTime() - nowMs,
    );
  }, [state?.countdown_expires, state?.countdown_expires_at, nowMs]);

  // ─── Render conditions ──────────────────────────────────────────────────
  if (!subscriberId) return null;
  if (dismissed) return null;
  if (state?.converted) return null;   // silent removal once user pays
  if (error) {
    // Don't block the dashboard over a wall error — log + hide.
    // eslint-disable-next-line no-console
    console.warn('MonetizationWall error:', error);
    return null;
  }
  if (!state) return null;  // still loading

  // Backend field names: roi.live_lead_count, roi.avg_job_value, roi.monthly_revenue.
  const leadCount = roi?.live_lead_count ?? state?.qualified_lead_count ?? '—';
  const avgJobValue = roi?.avg_job_value ?? roi?.avg_deal_value;
  const monthlyRevenue = roi?.monthly_revenue;
  const verticalLabel = vertical.charAt(0).toUpperCase() + vertical.slice(1);

  return (
    <section
      className="relative mb-6 rounded-xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-amber-600/10 p-5"
      aria-live="polite"
    >
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-slate-400 hover:text-white"
        type="button"
      >
        <Icon name="x" size={14} />
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon name="bolt" size={16} className="text-yellow-400" />
            <h3 className="text-white font-semibold text-base">
              Your first unlock window
            </h3>
          </div>
          <p className="text-slate-300 text-sm mt-1">
            <span className="text-yellow-400 font-semibold">{leadCount}</span> qualified {verticalLabel.toLowerCase()} leads
            active in your area right now.
            {avgJobValue && (
              <> One closed job ≈ <span className="text-white font-semibold">${avgJobValue.toLocaleString()}</span> (industry avg).</>
            )}
          </p>
          {monthlyRevenue && (
            <p className="text-slate-400 text-xs mt-1">
              Typical top-quartile {verticalLabel.toLowerCase()} contractor: ≈ ${monthlyRevenue.toLocaleString()}/mo (industry avg — your results will vary).
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Window</div>
            <div className="text-2xl font-mono font-bold text-yellow-400 tabular-nums">
              {formatCountdown(countdownMs)}
            </div>
          </div>
          <button
            onClick={onUnlock}
            className="cta-primary text-sm px-5 py-2 shrink-0"
            type="button"
          >
            Unlock a lead
          </button>
        </div>
      </div>
    </section>
  );
}
