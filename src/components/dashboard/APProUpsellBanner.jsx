/**
 * APProUpsellBanner — Stage 5
 *
 * Surfaces when an AutoPilot Lite subscriber qualifies for the Pro upgrade
 * (30+ days on Lite + 30-day close rate >= 15%). The backend daily job
 * sends the email offer with a one-tap link; if the user lands on the
 * dashboard with `?upgrade=autopilot_pro` we render this banner.
 *
 * Calls POST /api/upgrade with tier=autopilot_pro. On success, the local
 * subscriber tier flips and Lifecycle's 5-touch + appointment-setting workflow
 * activates in GHL.
 */
import { useState } from 'react';
import { upgradeTier } from '../../api/stage5';
import { createPortalSession } from '../../api/dashboard';
import Icon from '../ui/Icon';


export default function APProUpsellBanner({ feedUuid, onUpgraded, onDismiss }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [billingBlocked, setBillingBlocked] = useState(null);
  const [done, setDone] = useState(false);

  const handleUpgrade = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setBillingBlocked(null);
    try {
      const res = await upgradeTier({ feedUuid, tier: 'autopilot_pro' });
      setDone(true);
      onUpgraded?.(res);
    } catch (err) {
      if (err?.status === 409 && err?.detail?.error === 'billing_status_blocked') {
        setBillingBlocked(err.detail);
      } else {
        const detail = err?.detail;
        const msg = (typeof detail === 'string' ? detail : detail?.message)
          || err?.message
          || 'Upgrade failed - try again.';
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFixBilling = async () => {
    try {
      const { url } = await createPortalSession(feedUuid);
      window.location.href = url;
    } catch {
      setError('Could not open the billing portal. Email support@forcedaction.io.');
    }
  };

  if (done) {
    return (
      <div className="mb-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4 flex items-center gap-3">
        <Icon name="check-circle" size={20} className="text-emerald-400 shrink-0" />
        <div>
          <p className="text-white font-semibold text-sm">Welcome to AutoPilot Pro.</p>
          <p className="text-slate-300 text-xs mt-0.5">5-touch sequences + appointment setting are now live on every lead.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-purple-400/40 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 p-5 flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <p className="text-white font-bold text-base">
          You earned AutoPilot Pro.
        </p>
        <p className="text-slate-300 text-xs mt-1 max-w-md">
          Your close rate cleared the threshold. Pro adds 5-touch outbound
          sequences, premium routing (Immediate-tier first), and Lifecycle-handled
          appointment setting.
        </p>
        {error && <p className="text-red-300 text-xs mt-2">{error}</p>}
        {billingBlocked && (
          <p className="text-amber-300 text-xs mt-2" role="alert">
            Your account is in <strong>{billingBlocked.current_status}</strong> status — update your card first, then retry.
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {onDismiss && (
          <button
            onClick={onDismiss}
            type="button"
            disabled={submitting}
            className="text-slate-400 hover:text-white text-sm"
          >
            Not now
          </button>
        )}
        {billingBlocked ? (
          <button
            onClick={handleFixBilling}
            type="button"
            className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-400/20"
          >
            Fix billing →
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={submitting}
            type="button"
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {submitting ? 'Upgrading…' : 'Upgrade to Pro — $497/mo'}
          </button>
        )}
      </div>
    </div>
  );
}
