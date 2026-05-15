import { useEffect, useMemo, useRef, useState } from 'react';
import { logBusinessEvent } from '../../api/phase2b';
import {
  BUNDLE_ORDER,
  formatBundlePrice,
  getBundleAvailability,
  getBundleCardMeta,
  getBundleZipSummary,
} from '../../config/bundles';
import BundleOfferModal from './BundleOfferModal';
import Icon from '../ui/Icon';

export default function BundleCTAs({
  feedUuid,
  vertical,
  countyId = 'hillsborough',
  lockedZips = [],
  bundles,
  onPurchase,
  stormStatus = 'unknown',
}) {
  const [openBundle, setOpenBundle] = useState(null);
  const viewedKeysRef = useRef(new Set());

  const visibleKeys = bundles && bundles.length ? bundles : BUNDLE_ORDER;
  const visibleBundles = useMemo(
    () => getBundleCardMeta(visibleKeys).map((bundle) => ({
      ...bundle,
      availability: getBundleAvailability(bundle.key, { lockedZips, stormStatus }),
      zipSummary: getBundleZipSummary(bundle.key, lockedZips),
    })),
    [visibleKeys, lockedZips, stormStatus],
  );

  useEffect(() => {
    if (!feedUuid) return;
    visibleBundles.forEach((bundle) => {
      if (viewedKeysRef.current.has(bundle.key)) return;
      viewedKeysRef.current.add(bundle.key);
      logBusinessEvent('bundle_card_viewed', {
        feedUuid,
        payload: {
          bundle_type: bundle.key,
          disabled: bundle.availability.disabled,
          reason: bundle.availability.reason,
        },
      });
    });
  }, [feedUuid, visibleBundles]);

  if (!feedUuid || visibleBundles.length === 0) return null;

  const handleOpenBundle = (bundle) => {
    if (bundle.availability.disabled) return;
    logBusinessEvent('bundle_card_clicked', {
      feedUuid,
      payload: {
        bundle_type: bundle.key,
        locked_zip_count: lockedZips.length,
      },
    });
    setOpenBundle(bundle.key);
  };

  return (
    <>
      <section
        className="mb-6 rounded-xl border border-white/10 bg-slate-900/60 p-5"
        aria-labelledby="bundle-ctas-heading"
      >
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h3 id="bundle-ctas-heading" className="text-white font-semibold text-base">
            Top up with a bundle
          </h3>
          <p className="text-slate-400 text-xs">
            Weekend, Storm, and ZIP Booster are one-time. Monthly Reload bills monthly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {visibleBundles.map((bundle) => (
            <button
              key={bundle.key}
              type="button"
              onClick={() => handleOpenBundle(bundle)}
              disabled={bundle.availability.disabled}
              className={
                'group text-left rounded-lg border bg-white/5 p-4 transition-colors ' +
                'focus:outline-none focus:ring-2 focus:ring-yellow-400/60 ' +
                'disabled:cursor-not-allowed disabled:opacity-70 ' +
                bundle.accent
              }
              aria-label={`${bundle.availability.disabled ? 'Unavailable' : 'Buy'} ${bundle.label} for ${formatBundlePrice(bundle.key)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <Icon name={bundle.icon} size={18} className="text-slate-300 mt-0.5" />
                <span className="text-yellow-300 font-bold text-lg tabular-nums shrink-0">
                  {formatBundlePrice(bundle.key)}
                </span>
              </div>
              <p className="text-white font-semibold text-sm mt-3">{bundle.label}</p>
              <p className="text-slate-400 text-xs mt-1">{bundle.cardBlurb}</p>
              <p className="text-slate-500 text-xs mt-2">{bundle.zipSummary}</p>
              {bundle.availability.reason && (
                <p className="mt-2 text-xs font-medium text-amber-300">{bundle.availability.reason}</p>
              )}
              {!bundle.availability.reason && bundle.availability.hint && (
                <p className="mt-2 text-xs text-sky-300/80">{bundle.availability.hint}</p>
              )}
              <p className="mt-3 text-xs font-medium text-yellow-300/80 group-hover:text-yellow-300">
                {bundle.availability.disabled ? 'Unavailable right now' : 'Choose bundle →'}
              </p>
            </button>
          ))}
        </div>
      </section>

      <BundleOfferModal
        isOpen={openBundle !== null}
        feedUuid={feedUuid}
        bundleType={openBundle}
        variant="a"
        lockedZips={lockedZips}
        vertical={vertical}
        countyId={countyId}
        onClose={() => setOpenBundle(null)}
        onSuccess={(result) => {
          onPurchase?.(result);
          setOpenBundle(null);
        }}
      />
    </>
  );
}
