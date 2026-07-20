import { useState } from 'react';
import { useLanding } from './LandingContext';

// Separate premium card (not in the main tier grid): founder is a flat-rate
// tier with a monthly/annual split, sourced from the backend `plans` catalog
// (pricing.founder = { monthly_amount, annual_amount, ... }). Mirrors
// AnnualPricingCard's flat-rate treatment. Passes the chosen interval up so
// checkout resolves the matching founder price. Placeholder copy comes from
// the backend TIER_DISPLAY['founder'] — product supplies final bullets.
export default function FounderPricingCard({ onCheckout }) {
  const { pricing } = useLanding();
  const [interval, setInterval] = useState('monthly');

  const tierPricing = pricing?.founder;
  if (!tierPricing) return null;

  const { monthly_amount, annual_amount, label, features = [] } = tierPricing;
  const amount = interval === 'annual' ? annual_amount : monthly_amount;
  const suffix = interval === 'annual' ? '/yr' : '/mo';

  return (
    <div className="mt-10 max-w-2xl mx-auto">
      <div className="pricing-card rounded-2xl p-8 card-glow flex flex-col border border-yellow-400/40">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-yellow-400">
            {label || 'Founder'}
          </span>

          <div className="mt-4 inline-flex rounded-lg border border-yellow-400/40 p-1">
            <button
              type="button"
              onClick={() => setInterval('monthly')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${
                interval === 'monthly' ? 'bg-yellow-400 text-black' : 'text-slate-300'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval('annual')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${
                interval === 'annual' ? 'bg-yellow-400 text-black' : 'text-slate-300'
              }`}
            >
              Annual — 2 months free
            </button>
          </div>

          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-5xl font-black">
              ${amount != null ? amount.toLocaleString() : '—'}
            </span>
            <span className="text-slate-500 text-lg">{suffix}</span>
          </div>
        </div>

        <ul className="space-y-3 text-sm text-slate-300 mb-8 flex-1">
          {features.map((feat, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className="text-yellow-400/70">&#10003;</span> {feat}
            </li>
          ))}
        </ul>

        <button
          onClick={() => onCheckout('founder', interval)}
          className="btn-primary w-full font-bold py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black"
        >
          Become a Founder
        </button>
      </div>
    </div>
  );
}
