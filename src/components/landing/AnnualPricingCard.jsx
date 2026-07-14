import { useLanding } from './LandingContext';

// Deliberately separate from PricingCard.jsx: annual_lock is a flat-rate
// product (no founding/regular race, so no founding-spots polling/banner
// needed here) — reusing PricingCard's founding-specific UI would just be
// dead weight and a source of confusion for a product with no founding tier.
export default function AnnualPricingCard({ onCheckout }) {
  const { pricing } = useLanding();

  const tierPricing = pricing?.annual_lock;
  if (!tierPricing) return null;

  const { regular_amount: amount, label, features } = tierPricing;

  return (
    <div className="pricing-card rounded-2xl p-8 card-glow flex flex-col border border-yellow-400/30">
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{label}</span>

        <div className="mt-3">
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
            2 months free
          </span>
        </div>

        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-5xl font-black">${amount != null ? amount.toLocaleString() : '—'}</span>
          <span className="text-slate-500 text-lg">/yr</span>
        </div>
        <p className="text-xs mt-2 text-yellow-400">
          Billed annually — locked in for a full year
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
        onClick={() => onCheckout('annual_lock')}
        className="btn-primary w-full font-bold py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black"
      >
        Lock In the Year
      </button>
    </div>
  );
}
