/**
 * AnnualOfferBanner — Stage 5
 *
 * One-tap acceptance of the annual lock offer. Surface this when the
 * subscriber is in an active annual-offer window (set by the backend
 * through `subscriber.annual_offer_active` or by a deep link from the
 * offer email landing them at /dashboard/{uuid}?annual=accept).
 *
 * Calls POST /api/annual/accept which switches the Stripe subscription
 * with proration. On success, sets tier=annual_lock and shows a brief
 * confirmation; the parent should refetch the feed to pick up the new
 * tier.
 */
import { useState } from 'react';
import { acceptAnnual } from '../../api/stage5';
import Icon from '../ui/Icon';


export default function AnnualOfferBanner({ feedUuid, onAccepted, onDismiss }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleAccept = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await acceptAnnual({ feedUuid });
      setDone(true);
      onAccepted?.(res);
    } catch (err) {
      setError(err?.detail || err?.message || 'Could not switch — try again or email support.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mb-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4 flex items-center gap-3">
        <Icon name="check-circle" size={20} className="text-emerald-400 shrink-0" />
        <div>
          <p className="text-white font-semibold text-sm">Annual lock confirmed.</p>
          <p className="text-slate-300 text-xs mt-0.5">Your subscription is now $1,970/yr — 12 months guaranteed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-yellow-400/40 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 p-5 flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <p className="text-white font-bold text-base">
          Lock in 12 months — save 2 months free.
        </p>
        <p className="text-slate-300 text-xs mt-1">
          $1,970/yr ($164/mo effective). Switch your plan with one tap; we
          handle Stripe proration automatically.
        </p>
        {error && <p className="text-red-300 text-xs mt-2">{error}</p>}
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
        <button
          onClick={handleAccept}
          disabled={submitting}
          type="button"
          className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-lg shadow-yellow-400/20 disabled:opacity-50"
        >
          {submitting ? 'Switching…' : 'Lock 12 months'}
        </button>
      </div>
    </div>
  );
}
