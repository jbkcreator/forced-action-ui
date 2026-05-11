/**
 * BundleCTAs — discoverable row of bundle upsells on the dashboard.
 *
 * Sits alongside the lead feed and exposes all four bundle SKUs (weekend
 * pack, storm pack, ZIP booster, monthly reload) as compact CTAs. Tapping
 * one opens BundleOfferModal for that bundle, which already handles the
 * PaymentIntent + Payment Sheet flow.
 *
 * The four bundles previously could only be reached via the SMS deep link
 * (`?bundle=...&variant=...`). This component makes them browsable from
 * the dashboard itself — A/B variant defaults to "a" (base price) for
 * organic discovery; the SMS dispatcher still owns variant attribution
 * via the URL param.
 *
 * Props:
 *   feedUuid   — subscriber's feed UUID (required for PaymentIntent)
 *   vertical   — 'roofing' | 'remediation' | ...
 *   countyId   — defaults to 'hillsborough'
 *   zipCode    — optional, forwarded to PaymentIntent metadata
 *   bundles    — optional whitelist of bundle keys to show (defaults to all 4)
 *   onPurchase — callback({ bundleType, paymentIntent }) on successful buy
 */
import { useState } from 'react';
import BundleOfferModal from './BundleOfferModal';
import Icon from '../ui/Icon';

// Mirrors BundleOfferModal's BUNDLES (which itself mirrors the backend
// revenue_ladder.BUNDLES). Kept in sync intentionally so this row renders
// without a backend round-trip. Backend remains source of truth for the
// charged amount via /api/payment-intent.
const BUNDLE_CTAS = [
  {
    key: 'weekend',
    label: 'Weekend Pack',
    blurb: '5 bonus leads, Fri–Sun only',
    priceCents: 1900,
    icon: 'bolt',
    accent: 'border-emerald-400/30 hover:border-emerald-400/60 hover:bg-emerald-400/5',
  },
  {
    key: 'storm',
    label: 'Storm Pack',
    blurb: '10 storm-affected leads, 72h window',
    priceCents: 3900,
    icon: 'droplet',
    accent: 'border-sky-400/30 hover:border-sky-400/60 hover:bg-sky-400/5',
  },
  {
    key: 'zip_booster',
    label: 'ZIP Booster',
    blurb: '10 extra leads in your ZIP, 48h',
    priceCents: 2900,
    icon: 'map-pin',
    accent: 'border-yellow-400/30 hover:border-yellow-400/60 hover:bg-yellow-400/5',
  },
  {
    key: 'monthly_reload',
    label: 'Monthly Reload',
    blurb: '30 credits, auto-recurring',
    priceCents: 8900,
    icon: 'clock',
    accent: 'border-purple-400/30 hover:border-purple-400/60 hover:bg-purple-400/5',
  },
];


function formatCents(cents) {
  return `$${(cents / 100).toFixed(0)}`;
}


export default function BundleCTAs({
  feedUuid,
  vertical,
  countyId = 'hillsborough',
  zipCode,
  bundles,
  onPurchase,
}) {
  const [openBundle, setOpenBundle] = useState(null);

  if (!feedUuid) return null;

  const visible = bundles && bundles.length
    ? BUNDLE_CTAS.filter(b => bundles.includes(b.key))
    : BUNDLE_CTAS;

  if (visible.length === 0) return null;

  return (
    <>
      <section
        className="mb-6 rounded-xl border border-white/10 bg-slate-900/60 p-5"
        aria-labelledby="bundle-ctas-heading"
      >
        <div className="flex items-baseline justify-between mb-3">
          <h3 id="bundle-ctas-heading" className="text-white font-semibold text-base">
            Top up with a bundle
          </h3>
          <p className="text-slate-400 text-xs">One-time, charged to your saved card.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {visible.map(b => (
            <button
              key={b.key}
              type="button"
              onClick={() => setOpenBundle(b.key)}
              className={
                'group text-left rounded-lg border bg-white/5 p-4 transition-colors ' +
                'focus:outline-none focus:ring-2 focus:ring-yellow-400/60 ' +
                b.accent
              }
              aria-label={`Buy ${b.label} for ${formatCents(b.priceCents)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <Icon name={b.icon} size={18} className="text-slate-300 mt-0.5" />
                <span className="text-yellow-300 font-bold text-lg tabular-nums shrink-0">
                  {formatCents(b.priceCents)}
                </span>
              </div>
              <p className="text-white font-semibold text-sm mt-3">{b.label}</p>
              <p className="text-slate-400 text-xs mt-1">{b.blurb}</p>
              <p className="text-yellow-300/80 text-xs font-medium mt-3 group-hover:text-yellow-300">
                Buy now →
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
        zipCode={zipCode}
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
