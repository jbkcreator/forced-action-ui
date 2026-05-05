/**
 * WalletTopupModal — Stage 5+ (fa004, 2026-05-04)
 *
 * One-tap wallet top-up via Stripe Payment Sheet. Three preset packages
 * map to whitelisted backend amounts; webhook credits the wallet on
 * payment_intent.succeeded.
 *
 * Used in two places:
 *   1. Settings page (always-on top-up tile)
 *   2. ?wallet=topup deep link from a 402 insufficient-credits response
 */
import { useEffect, useState } from 'react';
import { createWalletTopup, WALLET_TOPUP_PACKAGES } from '../../api/account';
import PaymentSheetModal from '../common/PaymentSheetModal';
import Icon from '../ui/Icon';


export default function WalletTopupModal({
  isOpen,
  feedUuid,
  defaultAmountCents = 5000,
  onClose,
  onSuccess,
}) {
  const [selected, setSelected] = useState(defaultAmountCents);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelected(defaultAmountCents);
      setSubmitting(false);
      setError(null);
      setStripe(null);
      setSuccess(null);
    }
  }, [isOpen, defaultAmountCents]);

  if (!isOpen) return null;

  const pkg = WALLET_TOPUP_PACKAGES.find((p) => p.amountCents === selected) || WALLET_TOPUP_PACKAGES[0];

  const handleStart = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createWalletTopup({ feedUuid, amountCents: selected });
      setStripe({
        clientSecret: res.client_secret,
        publishableKey: res.publishable_key,
        amountCents: res.amount,
        credits: res.credits,
      });
    } catch (err) {
      setError(err?.detail?.message || err?.detail || err?.message || 'Topup failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStripeSuccess = (paymentIntent) => {
    // Webhook credits the wallet asynchronously — poll-friendly UX.
    setSuccess({ amountCents: stripe?.amountCents, credits: stripe?.credits, payment_intent_id: paymentIntent?.id });
    onSuccess?.({ amountCents: stripe?.amountCents, credits: stripe?.credits });
  };

  if (stripe?.clientSecret && !success) {
    return (
      <PaymentSheetModal
        isOpen
        clientSecret={stripe.clientSecret}
        publishableKey={stripe.publishableKey}
        amountLabel={`$${(stripe.amountCents / 100).toFixed(0)}`}
        description={`Wallet top-up — ${stripe.credits} credits`}
        saveCardDefault
        onSuccess={handleStripeSuccess}
        onClose={() => { setStripe(null); onClose?.(); }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto flex items-start sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-topup-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="max-w-md w-full my-8 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 id="wallet-topup-title" className="text-white font-semibold text-lg">
              Top up wallet
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Pick a package. Credits land instantly when payment clears.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" type="button" className="text-slate-400 hover:text-white">
            <Icon name="x" size={16} />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center" aria-live="polite">
            <Icon name="check-circle" size={40} className="mx-auto text-emerald-400" />
            <p className="text-white font-semibold mt-3">
              Top-up successful — {success.credits} credits added.
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Balance updates within a few seconds.
            </p>
            <button
              onClick={onClose}
              type="button"
              className="cta-primary text-sm px-6 py-2 mt-5"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {WALLET_TOPUP_PACKAGES.map((p) => {
                const sel = p.amountCents === selected;
                return (
                  <button
                    key={p.amountCents}
                    type="button"
                    onClick={() => setSelected(p.amountCents)}
                    aria-pressed={sel}
                    className={
                      'rounded-lg px-3 py-3 border text-center transition-colors ' +
                      (sel
                        ? 'bg-yellow-400/20 border-yellow-400/60 text-white'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10')
                    }
                  >
                    <div className="font-semibold text-sm">{p.label}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{p.credits} credits</div>
                    {p.bonusLabel && (
                      <div className="text-[10px] text-emerald-400 mt-0.5">{p.bonusLabel}</div>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              You'll pay <span className="text-white font-semibold">${(pkg.amountCents / 100).toFixed(0)}</span>{' '}
              for <span className="text-white font-semibold">{pkg.credits} credits</span>{' '}
              (~${(pkg.amountCents / pkg.credits / 100).toFixed(2)}/credit).
            </p>

            {error && (
              <div role="alert" className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3">
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                type="button"
                className="text-slate-400 hover:text-white text-sm px-3 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                disabled={submitting}
                type="button"
                className="cta-primary text-sm px-6 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Loading…' : `Top up ${pkg.label}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
