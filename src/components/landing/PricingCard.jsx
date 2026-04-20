import { PRICES, TIER_FEATURES, TIER_LABELS } from '../../config/pricing';
import usePolling from '../../hooks/usePolling';
import { fetchFoundingSpots } from '../../api/landing';
import { useLanding } from './LandingContext';

export default function PricingCard({ tier, isPopular, onCheckout }) {
  const { selectedVertical, countyId } = useLanding();

  const { data } = usePolling(
    () => fetchFoundingSpots(tier, selectedVertical, countyId),
    30000,
    [tier, selectedVertical, countyId],
  );

  const foundingAvailable = data?.founding_available ?? true;
  const price = foundingAvailable ? PRICES[tier].founding : PRICES[tier].regular;
  const crossedOut = foundingAvailable ? PRICES[tier].regular : PRICES[tier].future;
  const savingsText = foundingAvailable
    ? `★ Save $${(PRICES[tier].regular - PRICES[tier].founding).toLocaleString()}/mo forever`
    : 'Regular pricing';

  return (
    <div className={`pricing-card ${isPopular ? 'pricing-popular' : ''} ${tier === 'dominator' ? 'pricing-dominator' : ''} rounded-2xl p-8 card-glow flex flex-col ${isPopular ? 'relative' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-extrabold px-5 py-1.5 rounded-full shadow-lg shadow-yellow-400/20">
          Most Popular
        </div>
      )}
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{TIER_LABELS[tier]}</span>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-5xl font-black">${price.toLocaleString()}</span>
          <span className="text-slate-500 text-lg">/mo</span>
          <span className="text-sm text-slate-600 line-through">${crossedOut.toLocaleString()}/mo</span>
        </div>
        <p className={`text-xs mt-2 ${foundingAvailable ? 'text-yellow-400' : 'text-slate-400'}`}>
          {savingsText}
        </p>
        {data && (
          <div className="mt-2">
            {foundingAvailable ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(251,191,36,0.12)',
                  border: '1px solid rgba(251,191,36,0.35)',
                  borderRadius: '999px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fbbf24',
                }}
              >
                <span style={{ fontSize: '10px', opacity: 0.8 }}>&#9679;</span>
                {data.founding_remaining} founding spot{data.founding_remaining !== 1 ? 's' : ''} left
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(100,116,139,0.1)',
                  border: '1px solid rgba(100,116,139,0.2)',
                  borderRadius: '999px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#64748b',
                }}
              >
                Founding spots sold out
              </span>
            )}
          </div>
        )}
      </div>
      <ul className="space-y-3 text-sm text-slate-300 mb-8 flex-1">
        {TIER_FEATURES[tier].map((feat, i) => (
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
        Claim Founding Rate
      </button>
    </div>
  );
}
