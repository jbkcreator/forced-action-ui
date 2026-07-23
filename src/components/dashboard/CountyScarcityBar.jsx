import { useEffect, useState } from 'react';
import { fetchCountyScarcity } from '../../api/scarcity';
import { isAbortError } from '../../api/client';

/**
 * Real county-level territory scarcity bar (T-B12-02).
 *
 * Renders true open vs locked vs grace ZIP counts for the county a ZIP
 * belongs to, derived server-side from territory status. Exclusive model:
 * one investor per ZIP, so "open" is genuine remaining supply.
 *
 * Grace ZIPs are pressure (not freely lockable right now) but NOT the same
 * as hard-locked — they may reopen — so they're shown as their own segment
 * rather than folded silently into "locked".
 *
 * e.g. "34619 is one of 12 open ZIPs in Pinellas — 30 locked, 5 in grace."
 */
export default function CountyScarcityBar({ zip, vertical, onLockClick, onZeroOpen }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!zip) return undefined;
    const controller = new AbortController();
    fetchCountyScarcity(zip, { vertical, signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (!isAbortError(err)) setData(null);
      });
    return () => controller.abort();
  }, [zip, vertical]);

  useEffect(() => {
    if (data && data.total_count > 0 && data.open_count <= 0 && onZeroOpen) {
      onZeroOpen(zip);
    }
  }, [data, zip, onZeroOpen]);

  if (!data || data.total_count <= 0) return null;

  const {
    open_count: open,
    locked_count: locked,
    grace_count: grace = 0,
    total_count: total,
    county_name: county,
  } = data;
  const lockedPct = total > 0 ? (locked / total) * 100 : 0;
  const gracePct = total > 0 ? (grace / total) * 100 : 0;
  const scarce = open <= 5;

  return (
    <div className="mb-4 rounded-fa-md border border-fa-border-default bg-fa-bg-card p-4">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <p className="text-fa-text-primary font-semibold text-sm">
          {open > 0 ? (
            <>
              {zip} is{' '}
              <span className={scarce ? 'text-fa-status-taken' : 'text-fa-status-grace'}>
                one of {open} open {open === 1 ? 'ZIP' : 'ZIPs'}
              </span>{' '}
              in {county}
            </>
          ) : (
            <>
              <span className="text-fa-status-taken">No open ZIPs left</span> in {county} —{' '}
              {zip} is fully claimed
            </>
          )}
        </p>
        <p className="text-fa-text-secondary text-xs">
          {locked} locked{grace > 0 ? `, ${grace} in grace` : ''}
        </p>
      </div>
      <div
        className="w-full h-2 rounded-full bg-fa-bg-surface-light mt-3 overflow-hidden flex"
        role="progressbar"
        aria-valuenow={locked + grace}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${locked} locked, ${grace} in grace, of ${total} ZIPs in ${county}`}
      >
        <div
          className="h-full bg-fa-status-taken transition-all duration-700"
          style={{ width: `${lockedPct}%` }}
        />
        {grace > 0 && (
          <div
            className="h-full bg-fa-status-grace transition-all duration-700"
            style={{ width: `${gracePct}%` }}
          />
        )}
      </div>
      {onLockClick && open > 0 && (
        <button
          type="button"
          onClick={() => onLockClick(zip)}
          className="mt-3 px-4 py-2 bg-fa-primary hover:bg-fa-primary-hover text-fa-bg-base font-bold rounded-fa-sm text-xs transition-all"
        >
          Lock {zip} before it&apos;s gone
        </button>
      )}
    </div>
  );
}
