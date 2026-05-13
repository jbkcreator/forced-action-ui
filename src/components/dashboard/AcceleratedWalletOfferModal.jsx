/**
 * AcceleratedWalletOfferModal — fa016 Accelerated Wallet Push.
 *
 * Confirms an in-app wallet activation. POSTs to
 * `/api/wallet/accept-accelerated-offer/{uuid}` which kicks off an off-session
 * Stripe Subscription against the saved card. Webhook activates the wallet
 * asynchronously; the modal shows a "credits coming" success state.
 *
 * If Stripe returns `requires_action=true` (3DS / authentication needed) we
 * show a fallback message pointing the user to the standard checkout flow.
 */
import { useEffect, useState } from 'react';
import { acceptAcceleratedWalletOffer } from '../../api/wallet';
import Icon from '../ui/Icon';

export default function AcceleratedWalletOfferModal({
  isOpen,
  feedUuid,
  offerId,
  creditsOffered = 20,
  priceCents = 4900,
  savedCardLast4,
  onClose,
  onSuccess,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [needsAction, setNeedsAction] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubmitting(false);
      setError(null);
      setSuccess(null);
      setNeedsAction(false);
    }
  }, [isOpen]);

  // Auto-dismiss the success state after a few seconds so the modal doesn't
  // linger after the wallet is activated. User can still tap Done to close
  // immediately.
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => { onClose?.(); }, 3500);
    return () => clearTimeout(t);
  }, [success, onClose]);

  if (!isOpen) return null;

  const priceDollars = Math.round((priceCents || 4900) / 100);

  const handleActivate = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await acceptAcceleratedWalletOffer(feedUuid, offerId);
      if (res?.requires_action || res?.stripe_status === 'requires_action') {
        setNeedsAction(true);
      } else {
        setSuccess({
          credits: creditsOffered,
          subscription_id: res?.subscription_id,
        });
        onSuccess?.(res);
      }
    } catch (err) {
      setError(
        err?.detail?.error ||
          err?.detail?.message ||
          err?.message ||
          'Activation failed. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cardLabel = savedCardLast4
    ? `card ending ${savedCardLast4}`
    : 'your saved card';

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto flex items-start sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accel-wallet-offer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        data-testid="accelerated-wallet-offer-modal"
        className="max-w-md w-full my-8 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3
              id="accel-wallet-offer-title"
              className="text-white font-semibold text-lg"
            >
              Activate Starter Wallet
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              {creditsOffered} credits a month, billed to {cardLabel}.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            type="button"
            className="text-slate-400 hover:text-white"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center" aria-live="polite">
            <Icon
              name="check-circle"
              size={40}
              className="mx-auto text-emerald-400"
            />
            <p className="text-white font-semibold mt-3">
              Wallet activating — {success.credits} credits coming.
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Credits land within ~1 minute once payment clears.
            </p>
            <button
              onClick={onClose}
              type="button"
              className="cta-primary text-sm px-6 py-2 mt-5"
            >
              Done
            </button>
          </div>
        ) : needsAction ? (
          <div className="py-4 text-center" aria-live="polite">
            <p className="text-yellow-300 text-sm font-semibold mb-2">
              Bank needs to verify this charge.
            </p>
            <p className="text-slate-400 text-xs mb-4">
              We'll open a secure checkout so your card issuer can confirm. No
              new card details required.
            </p>
            <a
              href={`/save-card?uuid=${feedUuid}&from=accelerated_wallet`}
              className="cta-primary text-sm px-6 py-2 inline-block"
            >
              Open secure checkout
            </a>
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-white/5 border border-white/10 p-4 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Credits / month</span>
                <span className="text-white font-semibold">
                  {creditsOffered}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-400">Price</span>
                <span className="text-white font-semibold">
                  ${priceDollars} / mo
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-400">Auto-reload</span>
                <span className="text-white font-semibold">
                  When balance &lt; 5
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-400">Card on file</span>
                <span className="text-white font-semibold">
                  {savedCardLast4 ? `•••• ${savedCardLast4}` : 'Saved card'}
                </span>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3"
              >
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                type="button"
                className="text-slate-400 hover:text-white text-sm px-3 py-2"
              >
                Not now
              </button>
              <button
                onClick={handleActivate}
                disabled={submitting}
                type="button"
                data-testid="accelerated-wallet-offer-confirm"
                className="cta-primary text-sm px-6 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Activating…' : `Activate for $${priceDollars}/mo`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
