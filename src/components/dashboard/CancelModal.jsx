import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { acceptSaveOffer, createPortalSession, logEvent } from '../../api/dashboard';
import { pauseSubscription } from '../../api/pause';

export default function CancelModal({ isOpen, onClose, onConfirm, feedUuid, tier, isPaused, onRetentionAccepted, onDismiss }) {
  const skipOffer = tier === 'data_only' || isPaused;
  const [step, setStep] = useState(skipOffer ? 'confirm' : 'offer');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [billingBlocked, setBillingBlocked] = useState(null);
  const [accepted, setAccepted] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setBillingBlocked(null);
    setAccepted(null);
    setSubmitting(false);
    if (skipOffer) {
      setStep('confirm');
    } else {
      setStep('offer');
      logEvent('cancel_save_offer_shown', feedUuid);
    }
  }, [isOpen, skipOffer, feedUuid]);

  const handleSwitchToDataOnly = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setBillingBlocked(null);
    try {
      await acceptSaveOffer(feedUuid);
      await logEvent('cancel_save_offer_accepted', feedUuid);
      setAccepted('data_only');
      onRetentionAccepted?.();
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

  const handlePauseInstead = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await pauseSubscription(feedUuid, 60);
      await logEvent('cancel_paused_instead', feedUuid);
      setAccepted('paused');
      onRetentionAccepted?.();
    } catch (err) {
      setError(err?.detail?.message || err?.message || 'Pause failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFixBilling = async () => {
    try {
      const { url } = await createPortalSession(feedUuid);
      window.location.href = url;
    } catch {
      setError('Could not open the billing portal. Email info@forcedactionleads.com.');
    }
  };

  if (accepted) {
    return (
      <Modal isOpen={isOpen} onClose={onDismiss}>
        <div className="glass-strong rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-black/50">
          <h2 className="text-xl font-bold mb-3">
            {accepted === 'data_only' ? 'Switched to Data-Only.' : 'Paused for 60 days.'}
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            {accepted === 'data_only'
              ? 'Your data feed continues at $97/mo — full property data, no enrichment fees.'
              : 'Billing pauses immediately. Your territory stays reserved and everything resumes automatically.'}
          </p>
          <button
            onClick={onDismiss}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-medium transition-all duration-200"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  if (step === 'offer') {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="glass-strong rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-black/50">
          <h2 className="text-xl font-bold mb-2">Before you go…</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-5">
            Two cheaper options before you cancel outright.
          </p>

          <div className="rounded-xl border border-yellow-400/40 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 p-4 mb-4">
            <p className="text-white font-bold text-sm mb-1">Keep your leads for $97/mo</p>
            <p className="text-slate-300 text-xs mb-3">Full property data feed, no enrichment fees, cancel anytime.</p>
            {billingBlocked && (
              <p className="text-amber-300 text-xs mb-2" role="alert">
                Your account is in <strong>{billingBlocked.current_status}</strong> status — update your card first, then retry.
              </p>
            )}
            <button
              onClick={billingBlocked ? handleFixBilling : handleSwitchToDataOnly}
              disabled={submitting}
              type="button"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-bold text-sm transition-all disabled:opacity-50"
            >
              {billingBlocked ? 'Fix billing →' : submitting ? 'Switching…' : 'Switch to Data-Only ($97/mo)'}
            </button>
          </div>

          <button
            onClick={handlePauseInstead}
            disabled={submitting}
            type="button"
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-medium transition-all duration-200 disabled:opacity-50 mb-4"
          >
            {submitting ? 'Pausing…' : 'Pause for 60 days instead'}
          </button>

          {error && <p className="text-red-300 text-xs mb-3">{error}</p>}

          <button
            onClick={() => setStep('confirm')}
            type="button"
            className="w-full text-center text-slate-500 hover:text-slate-300 text-xs transition-colors"
          >
            Continue cancelling
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="glass-strong rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Are you sure you want to cancel?</h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          Cancelling forfeits your Founding Member rate lock permanently.
          If you resubscribe, you will pay the current regular price.
          There are no refunds for the current billing period.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-red-500/20"
          >
            Yes, cancel my subscription
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-medium transition-all duration-200"
          >
            Keep my subscription
          </button>
        </div>
      </div>
    </Modal>
  );
}
