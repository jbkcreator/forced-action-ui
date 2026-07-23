import { useEffect, useState } from 'react';
import { fetchCountyScarcity } from '../../api/scarcity';
import { isAbortError } from '../../api/client';

/**
 * Real county-level territory scarcity bar (T-B12-02).
 *
 * Renders true open vs locked ZIP counts for the county a ZIP belongs to,
 * derived server-side from territory status. Exclusive model: one investor
 * per ZIP, so "open" is genuine remaining supply.
 *
 * e.g. "34619 is one of 12 open ZIPs in Pinellas — 35 locked."
 */
export default function CountyScarcityBar({ zip, vertical, onLockClick }) {
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

  if (!data || data.total_count <= 0) return null;

  const { open_count: open, locked_count: locked, total_count: total, county_name: county } = data;
  const lockedPct = total > 0 ? (locked / total) * 100 : 0;
  const scarce = open <= 5;

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <p className="text-white font-semibold text-sm">
          {open > 0 ? (
            <>
              {zip} is{' '}
              <span className={scarce ? 'text-red-400' : 'text-yellow-400'}>
                one of {open} open {open === 1 ? 'ZIP' : 'ZIPs'}
              </span>{' '}
              in {county}
            </>
          ) : (
            <>
              <span className="text-red-400">No open ZIPs left</span> in {county} — {zip} is fully claimed
            </>
          )}
        </p>
        <p className="text-slate-400 text-xs">{locked} locked</p>
      </div>
      <div
        className="w-full h-2 rounded-full bg-white/[0.06] mt-3 overflow-hidden"
        role="progressbar"
        aria-valuenow={locked}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${locked} of ${total} ZIPs locked in ${county}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-700"
          style={{ width: `${lockedPct}%` }}
        />
      </div>
      {onLockClick && open > 0 && (
        <button
          type="button"
          onClick={() => onLockClick(zip)}
          className="mt-3 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-lg text-xs transition-all"
        >
          Lock {zip} before it&apos;s gone
        </button>
      )}
    </div>
  );
}
