import { useState } from 'react';
import { acceptSaveOffer } from '../../api/dashboard';
import { createPortalSession } from '../../api/dashboard';
import Icon from '../ui/Icon';

export default function DataOnlySaveOfferBanner({ feedUuid, onAccepted, onDismiss }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [billingBlocked, setBillingBlocked] = useState(null);
  const [done, setDone] = useState(false);

  const handleAccept = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setBillingBlocked(null);
    try {
      const res = await acceptSaveOffer(feedUuid);
      setDone(true);
      onAccepted?.(res);
    } catch (err) {
      if (err?.status === 409 && err?.detail?.error === 'billing_status_blocked') {
        setBillingBlocked(err.detail);
      } else {
        const detail = err?.detail;
        const msg = (typeof detail === 'string' ? detail : detail?.message)
          || err?.message
          || 'Could not switch — try again or email support.';
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
          <p className="text-white font-semibold text-sm">Switched to Data-Only.</p>
          <p className="text-slate-300 text-xs mt-0.5">Your data feed continues at $97/mo — full property data, no enrichment fees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-yellow-400/40 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 p-5 flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <p className="text-white font-bold text-base">
          Keep your leads for $97/mo — Data-Only access.
        </p>
        <p className="text-slate-300 text-xs mt-1">
          Full property data feed, no enrichment fees, cancel anytime. Switch with one tap.
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
            onClick={handleAccept}
            disabled={submitting}
            type="button"
            className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-lg shadow-yellow-400/20 disabled:opacity-50"
          >
            {submitting ? 'Switching…' : 'Switch to Data-Only ($97/mo)'}
          </button>
        )}
      </div>
    </div>
  );
}
