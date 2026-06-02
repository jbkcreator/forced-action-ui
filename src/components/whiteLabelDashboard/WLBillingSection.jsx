import { useState } from 'react';
import useApi from '../../hooks/useApi.js';
import { wlGetBillingStatus, wlCreateCheckout, wlGetBillingPortal } from '../../api/whiteLabelClient.js';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

const PLAN_LABELS = { standard: 'Standard', premium: 'Premium' };

export default function WLBillingSection() {
  const { data: billing, loading, error: fetchError } = useApi(wlGetBillingStatus, []);
  const [actionError, setActionError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(''); // plan tier being loaded

  async function handleCheckout(planTier) {
    setActionError('');
    setCheckoutLoading(planTier);
    try {
      const res = await wlCreateCheckout(planTier);
      if (!res?.url) throw new Error('No checkout URL returned from server.');
      window.location.href = res.url;
    } catch (err) {
      // Surface the server's detail message if present, otherwise fall back.
      const msg = err?.detail || err?.message || 'Failed to start checkout. Please try again.';
      setActionError(msg);
    } finally {
      setCheckoutLoading('');
    }
  }

  async function handleManageBilling() {
    setActionError('');
    try {
      const res = await wlGetBillingPortal();
      window.open(res.url, '_blank', 'noopener');
    } catch (err) {
      const msg = err?.detail || err?.message || 'Failed to open billing portal.';
      setActionError(msg);
    }
  }

  const error = fetchError;

  if (loading) return <LoadingSpinner />;

  const isActive = billing?.status === 'active';
  const isTrial = billing?.trial_ends_at && new Date(billing.trial_ends_at) > new Date();

  return (
    <div>
      <h2 className="text-xl font-bold text-fa-text-primary mb-6">Billing</h2>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Inline action error (checkout / portal failures) */}
      {actionError && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-800 bg-red-900/20 px-4 py-3">
          <span className="mt-0.5 text-red-400 flex-shrink-0">⚠</span>
          <div className="flex-1">
            <p className="text-red-400 text-sm font-medium">Action failed</p>
            <p className="text-red-300 text-xs mt-0.5">{actionError}</p>
          </div>
          <button onClick={() => setActionError('')} className="text-red-500 hover:text-red-300 text-xs flex-shrink-0">✕</button>
        </div>
      )}

      {/* Status card */}
      <div className="bg-fa-bg-card border border-fa-border-default rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-fa-text-muted text-sm">Current plan</p>
            <p className="text-2xl font-bold text-fa-text-primary mt-0.5">
              {billing?.plan_tier ? PLAN_LABELS[billing.plan_tier] : 'No active plan'}
            </p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              isActive ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
            }`}>
              {billing?.status || 'pending_verification'}
            </span>
          </div>
        </div>

        {billing?.plan_price_cents && (
          <p className="text-fa-text-secondary text-sm">
            ${(billing.plan_price_cents / 100).toLocaleString()}/month
          </p>
        )}

        {isTrial && (
          <div className="mt-3 p-3 bg-fa-primary/10 border border-fa-primary/20 rounded-lg">
            <p className="text-fa-primary text-sm font-medium">
              Trial active — ends {new Date(billing.trial_ends_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {billing?.activated_at && (
          <p className="text-fa-text-muted text-xs mt-3">
            Active since {new Date(billing.activated_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Actions */}
      {isActive && billing?.has_stripe_customer ? (
        <button onClick={handleManageBilling}
          className="bg-fa-bg-card border border-fa-border-default text-fa-text-primary font-medium px-5 py-2.5 rounded-lg hover:bg-fa-bg-base text-sm">
          Manage Billing & Invoices →
        </button>
      ) : isActive && !billing?.has_stripe_customer ? (
        <p className="text-fa-text-muted text-sm">
          This account was activated manually — there's no Stripe billing profile to manage yet.
        </p>
      ) : (
        <div>
          <p className="text-fa-text-muted text-sm mb-4">
            {billing?.intended_plan_tier
              ? <>You chose the <span className="text-fa-text-primary font-medium capitalize">{billing.intended_plan_tier}</span> plan at signup — start your 14-day trial:</>
              : 'Choose a plan to activate your account:'}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { tier: 'standard', price: '$2,500', label: 'Standard' },
              { tier: 'premium',  price: '$5,000', label: 'Premium' },
            ].map(plan => {
              const isIntended = billing?.intended_plan_tier === plan.tier;
              return (
                <button key={plan.tier} onClick={() => handleCheckout(plan.tier)}
                  disabled={!!checkoutLoading}
                  className={`relative rounded-lg p-5 text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    isIntended
                      ? 'bg-fa-bg-card border-2 border-fa-primary'
                      : 'bg-fa-bg-card border border-fa-border-default hover:border-fa-primary'
                  }`}>
                  {isIntended && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wide bg-fa-primary text-fa-bg-base px-1.5 py-0.5 rounded">
                      Your pick
                    </span>
                  )}
                  <p className="text-fa-primary font-bold text-xl">{plan.price}<span className="text-fa-text-muted text-sm font-normal">/mo</span></p>
                  <p className="text-fa-text-primary font-medium mt-1">{plan.label}</p>
                  <p className="text-fa-text-muted text-xs mt-2">14-day free trial included</p>
                  <p className="text-fa-primary text-sm font-medium mt-3">
                    {checkoutLoading === plan.tier
                      ? 'Opening Stripe…'
                      : isIntended ? 'Start trial →' : 'Subscribe →'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
