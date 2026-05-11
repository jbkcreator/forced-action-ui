/**
 * FOMOIndicators — live social-proof / scarcity signals for a ZIP.
 *
 * Polls /api/zip-activity for the current `active_viewers` count and
 * renders a compact pill that pulses when other contractors are looking
 * at the same ZIP right now. The component is silent when there's no
 * signal worth surfacing (no other viewers and no recent unlocks), so
 * it never adds visual noise on quiet ZIPs.
 *
 * Designed to slot inline near a ZIP-scoped lead card or above the feed
 * filter bar. For the heavier ZIP-level upsell (lock-this-ZIP CTA) see
 * FlashScarcityBanner — this component is read-only FOMO, no CTA.
 *
 * Props:
 *   zipCode         — required, the ZIP being viewed (e.g. "33647")
 *   vertical        — optional, scopes activity to a vertical
 *   recentUnlock    — optional { city, minutesAgo } to render a "just unlocked" line
 *   pollIntervalMs  — defaults to 30s (matches usePolling default)
 *   className       — passthrough for layout tweaks
 */
import { memo } from 'react';
import usePolling from '../../hooks/usePolling';
import useReducedMotion from '../../hooks/useReducedMotion';
import { fetchZipActivity } from '../../api/phase2b';
import Icon from '../ui/Icon';


function ActiveViewersPill({ count, reduced }) {
  if (count < 2) return null;
  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border"
      style={{
        background: 'rgba(239,68,68,0.10)',
        color: '#fca5a5',
        borderColor: 'rgba(239,68,68,0.30)',
      }}
      title={`${count} contractors viewing this ZIP right now`}
    >
      <span
        aria-hidden
        className={`w-1.5 h-1.5 rounded-full ${reduced ? '' : 'animate-pulse'}`}
        style={{ background: '#f87171' }}
      />
      {count} viewing this ZIP
    </span>
  );
}


function RecentUnlockLine({ unlock }) {
  if (!unlock) return null;
  const when = unlock.minutesAgo != null
    ? unlock.minutesAgo < 1
      ? 'just now'
      : `${Math.round(unlock.minutesAgo)}m ago`
    : null;
  const where = unlock.city || 'a nearby ZIP';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300/90">
      <Icon name="check" size={12} />
      <span>
        Someone unlocked a lead in {where}
        {when ? <> · <span className="text-emerald-200">{when}</span></> : null}
      </span>
    </span>
  );
}


function FOMOIndicators({
  zipCode,
  vertical,
  recentUnlock = null,
  pollIntervalMs = 30000,
  className = '',
}) {
  const reduced = useReducedMotion();

  const { data } = usePolling(
    () => zipCode ? fetchZipActivity(zipCode, vertical) : Promise.resolve(null),
    pollIntervalMs,
    [zipCode, vertical],
  );

  if (!zipCode) return null;

  const viewers = Number(data?.active_viewers || 0);
  const hasViewerSignal = viewers >= 2;
  const hasUnlockSignal = !!recentUnlock;

  // Stay silent when there's nothing to say — avoids noise on quiet ZIPs.
  if (!hasViewerSignal && !hasUnlockSignal) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`}
      data-testid="fomo-indicators"
    >
      <ActiveViewersPill count={viewers} reduced={reduced} />
      <RecentUnlockLine unlock={recentUnlock} />
    </div>
  );
}

export default memo(FOMOIndicators);
