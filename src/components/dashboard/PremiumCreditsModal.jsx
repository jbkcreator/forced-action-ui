/**
 * PremiumCreditsModal — Stage 5
 *
 * One-tap purchase of premium SKUs (Property Report / Lead Brief /
 * Skip-Trace Transfer / BYOL). Two payment paths in a single picker:
 *   - credits → POST /api/premium/purchase with payment_mode=credits
 *               (instant debit + fulfillment, 402 if balance short)
 *   - card    → returns Stripe client_secret; mounts the Payment Sheet
 *
 * Props:
 *   isOpen      — bool
 *   feedUuid    — subscriber's feed UUID
 *   propertyId  — required for report/brief/transfer; null for byol
 *   defaultSku  — preselected SKU on open (default 'report')
 *   walletBalance — current balance (used to show "you have X credits")
 *   onClose     — callback() on dismiss
 *   onSuccess   — callback({ sku, paid_via, ... }) when fulfillment succeeds
 */
import { useEffect, useState } from 'react';
import { purchasePremium, premiumReportDownloadUrl } from '../../api/stage5';
import PaymentSheetModal from '../common/PaymentSheetModal';
import Icon from '../ui/Icon';


const SKUS = [
  {
    key: 'report',
    label: 'Property Report',
    creditsCost: 3,
    cashCents: 700,
    blurb: 'Full distress + ownership + financials dossier.',
    requiresProperty: true,
  },
  {
    key: 'brief',
    label: 'Lead Brief',
    creditsCost: 5,
    cashCents: 1200,
    blurb: 'Investor-grade brief with talking points + comps.',
    requiresProperty: true,
  },
  {
    key: 'transfer',
    label: 'Skip-Trace Transfer',
    creditsCost: 26,
    cashCents: 6500,
    blurb: 'Mobile / landline / email + relatives.',
    requiresProperty: true,
  },
  {
    key: 'byol',
    label: 'BYOL Skip-Trace',
    creditsCost: 2,
    cashCents: 500,
    blurb: 'Bring your own lead — any address you supply.',
    requiresProperty: false,
  },
];


function formatCents(cents) {
  return `$${(cents / 100).toFixed(0)}`;
}


export default function PremiumCreditsModal({
  isOpen,
  feedUuid,
  propertyId,
  propertyAddress,
  defaultSku = 'report',
  walletBalance = 0,
  onClose,
  onSuccess,
}) {
  const [selectedSku, setSelectedSku] = useState(defaultSku);
  const [paymentMode, setPaymentMode] = useState('credits');
  const [targetAddress, setTargetAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [topupUrl, setTopupUrl] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stripe, setStripe] = useState(null);   // { clientSecret, publishableKey, amountCents }

  useEffect(() => {
    if (isOpen) {
      setSelectedSku(defaultSku);
      setPaymentMode('credits');
      setTargetAddress('');
      setError(null);
      setTopupUrl(null);
      setSuccess(null);
      setStripe(null);
    }
  }, [isOpen, defaultSku]);

  if (!isOpen) return null;

  const sku = SKUS.find(s => s.key === selectedSku) || SKUS[0];
  const canBuyWithCredits = walletBalance >= sku.creditsCost;
  const byolReady = sku.key !== 'byol' || targetAddress.trim().length >= 5;
  const propReady = !sku.requiresProperty || !!propertyId;

  const handleSubmit = async () => {
    if (submitting) return;
    if (!byolReady) {
      setError('Enter a property address for BYOL.');
      return;
    }
    if (!propReady) {
      setError('Select a lead first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setTopupUrl(null);

    try {
      const res = await purchasePremium({
        feedUuid,
        sku: sku.key,
        paymentMode,
        propertyId: sku.requiresProperty ? propertyId : null,
        targetAddress: sku.key === 'byol' ? targetAddress.trim() : null,
      });

      if (paymentMode === 'credits') {
        setSuccess(res);
        onSuccess?.(res);
      } else {
        setStripe({
          clientSecret: res.client_secret,
          publishableKey: res.publishable_key,
          amountCents: res.amount,
        });
      }
    } catch (err) {
      if (err?.status === 402 && err?.error === 'insufficient_credits') {
        setError(`You have ${err.balance} credits, this SKU needs ${err.required}.`);
        if (err.topup_url) setTopupUrl(err.topup_url);
      } else {
        setError(err?.message || err?.detail || 'Purchase failed. Try again?');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStripeSuccess = (paymentIntent) => {
    // Webhook handles persistence + fulfillment; we just close on success.
    setSuccess({ paid_via: 'card', sku: sku.key, payment_intent_id: paymentIntent?.id });
    onSuccess?.({ paid_via: 'card', sku: sku.key });
  };

  // Stripe Payment Sheet open — let it own the screen
  if (stripe?.clientSecret) {
    return (
      <PaymentSheetModal
        isOpen
        clientSecret={stripe.clientSecret}
        publishableKey={stripe.publishableKey}
        amountLabel={formatCents(stripe.amountCents)}
        description={`${sku.label} — ${propertyAddress || 'lead'}`}
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
      aria-labelledby="premium-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="max-w-lg w-full my-8 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 id="premium-modal-title" className="text-white font-semibold text-lg">Premium Action</h3>
            <p className="text-slate-400 text-xs mt-1">Buy with wallet credits or one-tap card.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-white"
            type="button"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center">
            <Icon name="check-circle" size={40} className="mx-auto text-emerald-400" />
            <p className="text-white font-semibold mt-3">{sku.label} delivered.</p>
            <p className="text-slate-400 text-xs mt-1">
              {success.paid_via === 'credits'
                ? `${success.credits_spent} credits debited.`
                : 'Payment processed.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {(sku.key === 'report' || sku.key === 'brief') && success.purchase_id && (
                <a
                  href={premiumReportDownloadUrl(success.purchase_id, feedUuid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-primary text-sm px-6 py-2"
                >
                  ⬇ Download PDF
                </a>
              )}
              <button
                onClick={onClose}
                type="button"
                className="text-slate-400 hover:text-white text-sm px-4 py-2"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* SKU picker */}
            <div className="grid grid-cols-2 gap-2">
              {SKUS.map(s => {
                const selected = s.key === selectedSku;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSelectedSku(s.key)}
                    aria-pressed={selected}
                    className={
                      'text-left rounded-lg px-3 py-3 border transition-colors ' +
                      (selected
                        ? 'bg-yellow-400/20 border-yellow-400/60 text-white'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10')
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{s.label}</span>
                      <span className="text-xs text-slate-400">{formatCents(s.cashCents)} · {s.creditsCost}cr</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">{s.blurb}</p>
                  </button>
                );
              })}
            </div>

            {/* BYOL: target address */}
            {sku.key === 'byol' && (
              <label className="mt-4 block">
                <span className="text-xs text-slate-400">Property address</span>
                <input
                  type="text"
                  placeholder="e.g. 123 Main St, Tampa FL 33601"
                  value={targetAddress}
                  onChange={e => setTargetAddress(e.target.value)}
                  className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:border-yellow-400/60 focus:outline-none"
                />
              </label>
            )}

            {/* Required-property warning */}
            {sku.requiresProperty && !propertyId && (
              <p className="mt-3 text-amber-300 text-xs">
                Select a lead from the feed before buying a {sku.label.toLowerCase()}.
              </p>
            )}

            {/* Property hint */}
            {sku.requiresProperty && propertyAddress && (
              <p className="mt-3 text-slate-400 text-xs truncate">
                For lead: <span className="text-slate-200">{propertyAddress}</span>
              </p>
            )}

            {/* Payment mode picker */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('credits')}
                aria-pressed={paymentMode === 'credits'}
                className={
                  'rounded-lg px-3 py-2.5 border text-sm transition-colors ' +
                  (paymentMode === 'credits'
                    ? 'bg-emerald-400/15 border-emerald-400/50 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10')
                }
              >
                Use credits
                <div className="text-[11px] mt-0.5">
                  <span className={canBuyWithCredits ? 'text-emerald-400' : 'text-amber-300'}>
                    {walletBalance} have / {sku.creditsCost} need
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('card')}
                aria-pressed={paymentMode === 'card'}
                className={
                  'rounded-lg px-3 py-2.5 border text-sm transition-colors ' +
                  (paymentMode === 'card'
                    ? 'bg-yellow-400/15 border-yellow-400/50 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10')
                }
              >
                Pay {formatCents(sku.cashCents)}
                <div className="text-[11px] text-slate-400 mt-0.5">Card / Apple Pay</div>
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3">
                <p className="text-red-300 text-xs">{error}</p>
                {topupUrl && (
                  <a
                    href={topupUrl}
                    className="text-yellow-300 hover:text-yellow-200 underline text-xs mt-1 inline-block"
                  >
                    Top up wallet →
                  </a>
                )}
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
                onClick={handleSubmit}
                disabled={submitting || (!byolReady && sku.key === 'byol') || !propReady}
                type="button"
                className="cta-primary text-sm px-6 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting
                  ? 'Processing…'
                  : paymentMode === 'credits'
                    ? `Pay ${sku.creditsCost}cr`
                    : `Pay ${formatCents(sku.cashCents)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
