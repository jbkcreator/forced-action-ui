import { useEffect, useState } from 'react';
import { fetchFoundingSpots } from '../../api/landing';
import { useLanding } from './LandingContext';

export default function PricingCard({ tier, isPopular, onCheckout }) {
  const { selectedVertical, countyId, pricing } = useLanding();

  // Direct fetch instead of usePolling so we can verify in the Network tab.
  // Logs at every step so a silent failure becomes visible.
  const [spots, setSpots] = useState(null);
  const [spotsError, setSpotsError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line no-console
    console.log(`[PricingCard:${tier}] fetching /api/founding-spots`, { tier, vertical: selectedVertical, countyId });
    fetchFoundingSpots(tier, selectedVertical, countyId)
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
  }, [tier, selectedVertical, countyId]);

  const tierPricing = pricing?.[tier];
  if (!tierPricing) return null;

  const { founding_amount: foundingAmount, regular_amount: regularAmount, label, features } = tierPricing;

  // Founding-spots poll is the source of truth for availability. Three states:
  //   - in flight, no error → optimistic founding banner ("Loading availability…")
  //   - resolved with data  → show real count or sold-out badge
  //   - errored (network/500/etc.) → assume founding available (don't penalize the user
  //     for a flaky DB), but flag the failure so we know something's wrong.
  const spotsReady = !!spots;
  const foundingAvailable = spots ? spots.founding_available : true;

  const mainPrice = foundingAvailable ? foundingAmount : regularAmount;
  const strikePrice = foundingAvailable && regularAmount != null ? regularAmount : null;
  const savingsText = foundingAvailable && foundingAmount != null && regularAmount != null
    ? `★ Save $${(regularAmount - foundingAmount).toLocaleString()}/mo forever`
    : foundingAvailable
      ? 'Founding rate locked forever'
      : 'Regular pricing';

  const buttonLabel = foundingAvailable ? 'Claim Founding Rate' : 'Subscribe';

  return (
    <div className={`pricing-card ${isPopular ? 'pricing-popular' : ''} ${tier === 'dominator' ? 'pricing-dominator' : ''} rounded-2xl p-8 card-glow flex flex-col ${isPopular ? 'relative' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-extrabold px-5 py-1.5 rounded-full shadow-lg shadow-yellow-400/20">
          Most Popular
        </div>
      )}
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{label}</span>

        {/* Founding-spots-left banner — always rendered so the card has a consistent height.
            States: data resolved → live count / sold-out; errored → optimistic founding pill;
            still in flight → "Loading availability…" placeholder. */}
        <div className="mt-3">
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
              {spots.founding_remaining} of {spots.founding_cap} founding {spots.founding_remaining === 1 ? 'spot' : 'spots'} left
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
              Founding spots sold out — regular pricing
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-5xl font-black">${mainPrice != null ? mainPrice.toLocaleString() : '—'}</span>
          <span className="text-slate-500 text-lg">/mo</span>
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
        onClick={() => onCheckout(tier)}
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
