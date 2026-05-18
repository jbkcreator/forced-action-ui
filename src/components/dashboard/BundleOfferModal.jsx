import { useEffect, useMemo, useState } from 'react';
import { bundleCheckout } from '../../api/bundles';
import { logBusinessEvent } from '../../api/phase2b';
import {
  formatBundlePrice,
  getBundleActionLabel,
  getBundleBillingCopy,
  getBundleMeta,
} from '../../config/bundles';
import PaymentSheetModal from '../common/PaymentSheetModal';
import Icon from '../ui/Icon';

function getInitialZip(bundleMeta, lockedZips, preferredZip) {
  if (!bundleMeta?.zipScoped) return '';
  if (preferredZip && lockedZips.includes(preferredZip)) return preferredZip;
  if (lockedZips.length === 1) return lockedZips[0];
  return '';
}

export default function BundleOfferModal({
  isOpen,
  feedUuid,
  bundleType,
  variant = 'a',
  zipCode,
  lockedZips = [],
  vertical,
  countyId = 'hillsborough',
  onClose,
  onSuccess,
}) {
  const [stripe, setStripe] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const cfg = getBundleMeta(bundleType);

  const [selectedZip, setSelectedZip] = useState(() => getInitialZip(cfg, lockedZips, zipCode));

  useEffect(() => {
    if (!isOpen || !cfg) return;
    setStripe(null);
    setError(null);
    setSubmitting(false);
    setSelectedZip(getInitialZip(cfg, lockedZips, zipCode));
  }, [isOpen, cfg, lockedZips, zipCode]);

  const needsZip = cfg?.zipScoped === true;
  const zipMissing = needsZip && !selectedZip;
  const priceLabel = formatBundlePrice(bundleType, variant);
  const targetZipLabel = useMemo(() => {
    if (!needsZip) return null;
    if (selectedZip) return `Target ZIP ${selectedZip}`;
    if (lockedZips.length > 1) return 'Choose a locked ZIP before checkout.';
    return 'A locked ZIP is required for this bundle.';
  }, [lockedZips.length, needsZip, selectedZip]);

  if (!isOpen || !cfg) return null;

  const handleStartPayment = async () => {
    if (submitting || zipMissing) return;
    setSubmitting(true);
    setError(null);
    logBusinessEvent('bundle_checkout_started', {
      feedUuid,
      payload: {
        bundle_type: bundleType,
        variant,
        zip_code: selectedZip || null,
        county_id: countyId,
      },
    });

    try {
      const res = await bundleCheckout({
        feedUuid,
        bundleType,
        zipCode: selectedZip || '',
        vertical: vertical || '',
        abVariant: variant,
      });
      setStripe({
        clientSecret: res.client_secret,
        publishableKey: res.publishable_key,
      });
    } catch (err) {
      const detail = err?.detail;
      if (detail?.error === 'bundle_unavailable') {
        const message = detail.message || 'This bundle is not available right now.';
        setError(message);
        logBusinessEvent('bundle_checkout_blocked', {
          feedUuid,
          payload: {
            bundle_type: bundleType,
            zip_code: selectedZip || null,
            reason: message,
          },
        });
      } else {
        setError(detail?.message || err?.message || 'Could not open payment.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (stripe?.clientSecret) {
    return (
      <PaymentSheetModal
        isOpen
        clientSecret={stripe.clientSecret}
        publishableKey={stripe.publishableKey}
        amountLabel={priceLabel}
        description={cfg.label}
        saveCardDefault
        onSuccess={(pi) => {
          logBusinessEvent('bundle_checkout_succeeded', {
            feedUuid,
            payload: {
              bundle_type: bundleType,
              variant,
              zip_code: selectedZip || null,
              payment_intent_id: pi?.id || null,
            },
          });
          onSuccess?.({ bundleType, variant, paymentIntent: pi, zipCode: selectedZip || null });
          onClose?.();
        }}
        onClose={() => {
          setStripe(null);
          onClose?.();
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-lg">{cfg.label}</h3>
            <p className="text-slate-400 text-xs mt-1">{cfg.modalBlurb}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-white"
            type="button"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-4 text-center">
          <p className="text-3xl font-extrabold text-yellow-300">{priceLabel}</p>
          <p className="text-xs text-slate-400 mt-1">{getBundleBillingCopy(bundleType)}</p>
        </div>

        {needsZip && (
          <div className="mt-4">
            <label htmlFor="bundle-zip-select" className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Target ZIP
            </label>
            <select
              id="bundle-zip-select"
              value={selectedZip}
              onChange={(e) => setSelectedZip(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400/50"
            >
              <option value="" disabled>
                {lockedZips.length > 1 ? 'Choose a locked ZIP' : 'No locked ZIP available'}
              </option>
              {lockedZips.map((zip) => (
                <option key={zip} value={zip} className="text-slate-900">
                  {zip}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-2">{targetZipLabel}</p>
          </div>
        )}

        {error && <p className="mt-3 text-red-400 text-xs text-center">{error}</p>}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            type="button"
            disabled={submitting}
            className="text-slate-400 hover:text-white text-sm px-3 py-2"
          >
            Not now
          </button>
          <button
            onClick={handleStartPayment}
            disabled={submitting || zipMissing}
            type="button"
            className="cta-primary text-sm px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Opening…' : getBundleActionLabel(bundleType, variant)}
          </button>
        </div>
      </div>
    </div>
  );
}
