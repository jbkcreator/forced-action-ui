import { useState } from 'react';
import { createPortalSession } from '../../api/dashboard';
import Icon from '../ui/Icon';

export default function PaymentFailedBanner({
  feedUuid,
  paymentFailedAt,
  recoveryDay3Sent,
  missedLeadCount,
  onSwitchDataOnly,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const urgency = !!recoveryDay3Sent;
  const failedDate = paymentFailedAt ? new Date(paymentFailedAt) : null;
  const daysSince = failedDate
    ? Math.max(0, Math.floor((Date.now() - failedDate.getTime()) / (24 * 3600 * 1000)))
    : null;

  const openPortal = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await createPortalSession(feedUuid);
      window.location.href = url;
    } catch {
      setError('Could not open billing portal. Email support@forcedaction.io.');
      setBusy(false);
    }
  };

  const tone = urgency
    ? 'border-red-400/50 bg-gradient-to-r from-red-500/15 to-orange-500/10'
    : 'border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-yellow-500/10';

  return (
    <div
      role="alert"
      data-testid="payment-failed-banner"
      data-stage={urgency ? 'urgency' : 'soft'}
      className={`mb-4 rounded-xl border ${tone} p-5 flex items-center justify-between gap-4 flex-wrap`}
    >
      <div className="min-w-0 flex items-start gap-3">
        <Icon
          name={urgency ? 'alert-triangle' : 'credit-card'}
          size={22}
          className={`shrink-0 mt-0.5 ${urgency ? 'text-red-300' : 'text-amber-300'}`}
        />
        <div>
          <p className="text-white font-bold text-base">
            {urgency ? 'Last chance — your card is still declined' : 'Your card was declined'}
          </p>
          <p className="text-slate-300 text-xs mt-1 max-w-lg">
            {urgency ? (
              <>
                {daysSince !== null && <>It's been <strong>{daysSince} day{daysSince === 1 ? '' : 's'}</strong> since the failed charge. </>}
                {missedLeadCount > 0 ? (
                  <>You've already missed <strong className="text-white">{missedLeadCount}</strong> gold lead{missedLeadCount === 1 ? '' : 's'} while billing is paused. </>
                ) : (
                  <>Leads are still flowing — but your access cuts off soon. </>
                )}
                Update your card now or downshift to Data-Only to keep going.
              </>
            ) : (
              <>We couldn't process your last subscription charge. Update your payment method to avoid losing your locked ZIP territories.</>
            )}
          </p>
          {error && <p className="text-red-300 text-xs mt-2">{error}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {urgency && onSwitchDataOnly && (
          <button
            type="button"
            onClick={onSwitchDataOnly}
            disabled={busy}
            className="px-4 py-2 text-slate-200 hover:text-white text-sm rounded-lg border border-slate-600 hover:border-slate-400 disabled:opacity-50"
          >
            Switch to Data-Only
          </button>
        )}
        <button
          type="button"
          onClick={openPortal}
          disabled={busy}
          className={`px-5 py-2.5 font-bold rounded-xl text-sm shadow-lg disabled:opacity-50 transition-all ${
            urgency
              ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white shadow-red-500/20'
              : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900'
          }`}
        >
          {busy ? 'Opening…' : 'Update payment method →'}
        </button>
      </div>
    </div>
  );
}
