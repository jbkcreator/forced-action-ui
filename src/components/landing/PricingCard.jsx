import { useEffect, useState } from 'react';
import { fetchFoundingSpots } from '../../api/landing';
import { useLanding } from './LandingContext';

const ANNUAL_TIERS = new Set(['starter', 'pro']);

export default function PricingCard({ tier, isPopular, onCheckout, vertical, countyId, pricing }) {
  // Landing page: reads vertical/countyId/pricing from LandingContext. Callers
  // outside a LandingProvider (e.g. the dashboard's free-tier upgrade flow)
  // pass these as props instead — props win when supplied.
  const landing = useLanding();
  const selectedVertical = vertical ?? landing?.selectedVertical;
  const resolvedCountyId = countyId ?? landing?.countyId;
  const resolvedPricing = pricing ?? landing?.pricing;

  const [billingInterval, setBillingInterval] = useState('monthly');

  // Direct fetch instead of usePolling so we can verify in the Network tab.
  // Logs at every step so a silent failure becomes visible.
  const [spots, setSpots] = useState(null);
  const [spotsError, setSpotsError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line no-console
    console.log(`[PricingCard:${tier}] fetching /api/founding-spots`, { tier, vertical: selectedVertical, countyId: resolvedCountyId });
    fetchFoundingSpots(tier, selectedVertical, resolvedCountyId)
      .then((res) => {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.log(`[PricingCard:${tier}] /api/founding-spots OK`, res);
        setSpots(res);
        setSpotsError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error(`[PricingCard:${tier}] /api/founding-spots FAILED`, err);
        setSpotsError(err);
      });
    return () => { cancelled = true; };
  }, [tier, selectedVertical, resolvedCountyId]);

  const tierPricing = resolvedPricing?.[tier];
  if (!tierPricing) return null;

  const { founding_amount: foundingAmount, regular_amount: regularAmount, annual_amount: annualAmount, label, features } = tierPricing;

  const hasAnnual = ANNUAL_TIERS.has(tier) && annualAmount != null;
  const isAnnual = hasAnnual && billingInterval === 'annual';

  // Founding-spots poll is the source of truth for availability. Three states:
  //   - in flight, no error → optimistic founding banner ("Loading availability…")
  //   - resolved with data  → show real count or sold-out badge
  //   - errored (network/500/etc.) → assume founding available (don't penalize the user
  //     for a flaky DB), but flag the failure so we know something's wrong.
  const spotsReady = !!spots;
  const foundingAvailable = !isAnnual && (spots ? spots.founding_available : true);

  const mainPrice = isAnnual ? annualAmount : (foundingAvailable ? foundingAmount : regularAmount);
  const priceSuffix = isAnnual ? '/yr' : '/mo';
  const strikePrice = !isAnnual && foundingAvailable && regularAmount != null ? regularAmount : null;
  const savingsText = isAnnual
    ? '2 months free vs monthly'
    : foundingAvailable && foundingAmount != null && regularAmount != null
      ? `★ Save $${(regularAmount - foundingAmount).toLocaleString()}/mo forever`
      : foundingAvailable
        ? 'Founding rate locked forever'
        : 'Regular pricing';

  const buttonLabel = isAnnual ? 'Lock In the Year' : (foundingAvailable ? 'Claim Founding Rate' : 'Subscribe');

  return (
    <div className={`pricing-card ${isPopular ? 'pricing-popular' : ''} ${tier === 'dominator' ? 'pricing-dominator' : ''} rounded-2xl p-8 card-glow flex flex-col ${isPopular ? 'relative' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-extrabold px-5 py-1.5 rounded-full shadow-lg shadow-yellow-400/20">
          Most Popular
        </div>
      )}
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{label}</span>

        {hasAnnual && (
          <div className="mt-3 inline-flex rounded-lg border border-yellow-400/40 p-1">
            <button
              type="button"
              onClick={() => setBillingInterval('monthly')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                billingInterval === 'monthly' ? 'bg-yellow-400 text-black' : 'text-slate-300'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('annual')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                billingInterval === 'annual' ? 'bg-yellow-400 text-black' : 'text-slate-300'
              }`}
            >
              Annual — 2 months free
            </button>
          </div>
        )}

        {/* Founding-spots-left banner — hidden in annual mode (no founding mechanic for annual).
            States: data resolved → live count / sold-out; errored → optimistic founding pill;
            still in flight → "Loading availability…" placeholder. */}
        <div className={`mt-3${isAnnual ? ' hidden' : ''}`}>
          {!spotsReady && !spotsError ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '999px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
              }}
            >
              Loading availability…
            </span>
          ) : !spotsReady && spotsError ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(251,191,36,0.15)',
                border: '1px solid rgba(251,191,36,0.45)',
                borderRadius: '999px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 800,
                color: '#fbbf24',
                boxShadow: '0 0 16px rgba(251,191,36,0.15)',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '999px',
                  background: '#fbbf24',
                  boxShadow: '0 0 8px #fbbf24',
                }}
              />
              Founding rate available
            </span>
          ) : foundingAvailable ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(251,191,36,0.15)',
                border: '1px solid rgba(251,191,36,0.45)',
                borderRadius: '999px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 800,
                color: '#fbbf24',
                boxShadow: '0 0 16px rgba(251,191,36,0.15)',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '999px',
                  background: '#fbbf24',
                  boxShadow: '0 0 8px #fbbf24',
                }}
              />
              {spots.founding_remaining < spots.founding_cap
                ? `${spots.founding_remaining} of ${spots.founding_cap} founding ${spots.founding_remaining === 1 ? 'spot' : 'spots'} left`
                : `${spots.founding_cap} founding spots available`}
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(100,116,139,0.12)',
                border: '1px solid rgba(100,116,139,0.25)',
                borderRadius: '999px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#94a3b8',
              }}
            >
              {spots.deadline_passed ? 'Founding pricing has ended — regular pricing' : 'Founding spots sold out — regular pricing'}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-5xl font-black">${mainPrice != null ? mainPrice.toLocaleString() : '—'}</span>
          <span className="text-slate-500 text-lg">{priceSuffix}</span>
          {strikePrice != null && (
            <span className="text-sm text-slate-600 line-through">${strikePrice.toLocaleString()}/mo</span>
          )}
        </div>
        <p className={`text-xs mt-2 ${foundingAvailable ? 'text-yellow-400' : 'text-slate-400'}`}>
          {savingsText}
        </p>
      </div>
      <ul className="space-y-3 text-sm text-slate-300 mb-8 flex-1">
        {features.map((feat, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <span className="text-yellow-400/70">&#10003;</span> {feat}
          </li>
        ))}
      </ul>
      <button
        onClick={() => onCheckout(tier, isAnnual ? 'annual' : 'monthly')}
        className={`btn-primary w-full font-bold py-3.5 rounded-xl ${
          isPopular
            ? 'bg-yellow-400 hover:bg-yellow-300 text-black'
            : 'bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.1]'
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
