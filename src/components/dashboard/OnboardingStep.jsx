/**
 * OnboardingStep — one-time preference capture shown on first login.
 *
 * Blocking (no close button): DashboardPage renders this instead of the feed
 * while subscriber.onboarding_completed is false. Submitting flips the flag
 * server-side (PATCH /api/subscriber/onboarding/{feedUuid}), so it never
 * reappears for this subscriber.
 */
import { useState } from 'react';
import { submitOnboarding } from '../../api/subscriber';
import { trackEvent } from '../../utils/ga4';

const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'multi_family', label: 'Multi-Family' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Land' },
  { value: 'other', label: 'Other' },
];

const BUDGET_BANDS = [
  { value: 'under_50k', label: 'Under $50k' },
  { value: '50k_150k', label: '$50k – $150k' },
  { value: '150k_500k', label: '$150k – $500k' },
  { value: '500k_plus', label: '$500k+' },
];

function OptionGrid({ options, selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {options.map((opt) => {
        const sel = opt.value === selected;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            aria-pressed={sel}
            className={
              'rounded-lg px-3 py-3 border text-center text-sm font-medium transition-colors ' +
              (sel
                ? 'bg-yellow-400/20 border-yellow-400/60 text-white'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10')
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function OnboardingStep({ feedUuid, tier, onComplete }) {
  const [propertyType, setPropertyType] = useState(null);
  const [budgetBand, setBudgetBand] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = !!propertyType && !!budgetBand && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitOnboarding(feedUuid, { propertyType, budgetBand });
      trackEvent('onboarding_completed', { property_type: propertyType, budget: budgetBand, tier });
      onComplete?.();
    } catch (err) {
      setError(err?.detail?.message || err?.detail || err?.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto flex items-start sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
    >
      <div className="max-w-lg w-full my-8 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h3 id="onboarding-step-title" className="text-white font-semibold text-lg">
          Welcome — let's tailor your leads
        </h3>
        <p className="text-slate-400 text-xs mt-1 mb-5">
          Two quick questions so we can prioritize the right leads for you.
        </p>

        <div className="mb-5">
          <p className="text-sm text-slate-300 font-medium mb-2">What property type are you targeting?</p>
          <OptionGrid options={PROPERTY_TYPES} selected={propertyType} onSelect={setPropertyType} />
        </div>

        <div className="mb-5">
          <p className="text-sm text-slate-300 font-medium mb-2">What's your typical investment budget?</p>
          <OptionGrid options={BUDGET_BANDS} selected={budgetBand} onSelect={setBudgetBand} />
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3">
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            type="button"
            className="cta-primary text-sm px-6 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : 'Continue to my leads'}
          </button>
        </div>
      </div>
    </div>
  );
}
