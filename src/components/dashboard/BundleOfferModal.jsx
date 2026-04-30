/**
 * BundleOfferModal — Stage 5
 *
 * Surfaces when the dashboard is opened with `?bundle=<type>&variant=<a|b>`
 * (the SMS deep link the bundle dispatcher sends). Renders the offer with
 * the variant's pricing baked in, then completes through the existing
 * Payment Sheet flow.
 *
 * The variant value is forwarded to the backend via the PaymentIntent
 * metadata so the A/B framework attributes the conversion correctly.
 */
import { useEffect, useState } from 'react';
import { createPaymentIntent } from '../../api/phase2b';
import PaymentSheetModal from '../common/PaymentSheetModal';
import Icon from '../ui/Icon';


// Mirror of backend BUNDLES (config/revenue_ladder.py). Variant B is illustrative;
// the backend is the source of truth for the actual price the user is charged.
const BUNDLES = {
  weekend: {
    label: 'Weekend Pack',
    blurb: '5 bonus leads in your ZIP — Friday through Sunday only.',
    variantA: 1900,   // base
    variantB: 2200,   // sample +25% test variant
  },
  storm: {
    label: 'Storm Pack',
    blurb: '10 storm-affected property leads in your ZIP, valid 72h post-alert.',
    variantA: 3900,
    variantB: 4500,
  },
  zip_booster: {
    label: 'ZIP Booster',
    blurb: '10 extra leads in your existing ZIP for the next 48 hours.',
    variantA: 2900,
    variantB: 3400,
  },
  monthly_reload: {
    label: 'Monthly Reload',
    blurb: '30 credits — auto-recurring alternative to the wallet.',
    variantA: 8900,
    variantB: 7900,   // sample -11% downward variant
  },
};


function formatCents(cents) {
  return `$${(cents / 100).toFixed(0)}`;
}


export default function BundleOfferModal({
  isOpen,
  feedUuid,
  bundleType,
  variant = 'a',
  zipCode,
  vertical,
  countyId = 'hillsborough',
  onClose,
  onSuccess,
}) {
  const [stripe, setStripe] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStripe(null);
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen, bundleType]);

  if (!isOpen || !bundleType) return null;
  const cfg = BUNDLES[bundleType];
  if (!cfg) return null;

  const priceCents = variant === 'b' ? cfg.variantB : cfg.variantA;

  const handleStartPayment = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createPaymentIntent({
        feedUuid,
        amountCents: priceCents,
        description: `${cfg.label} — ${formatCents(priceCents)}`,
        saveCard: true,
        metadata: {
          product: 'bundle',
          bundle_type: bundleType,
          ab_variant: variant,
          zip_code: zipCode || '',
          vertical: vertical || '',
          county_id: countyId,
        },
      });
      setStripe({
        clientSecret: res.client_secret,
        publishableKey: res.publishable_key,
      });
    } catch (err) {
      setError(err?.detail || err?.message || 'Could not open payment.');
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
        amountLabel={formatCents(priceCents)}
        description={cfg.label}
        saveCardDefault
        onSuccess={(pi) => {
          onSuccess?.({ bundleType, variant, paymentIntent: pi });
          onClose?.();
        }}
        onClose={() => { setStripe(null); onClose?.(); }}
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
            <p className="text-slate-400 text-xs mt-1">{cfg.blurb}</p>
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
          <p className="text-3xl font-extrabold text-yellow-300">{formatCents(priceCents)}</p>
          <p className="text-xs text-slate-400 mt-1">One-time, charged to your saved card.</p>
        </div>

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
            disabled={submitting}
            type="button"
            className="cta-primary text-sm px-6 py-2 disabled:opacity-50"
          >
            {submitting ? 'Opening…' : `Buy for ${formatCents(priceCents)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
