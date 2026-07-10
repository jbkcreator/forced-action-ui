import Icon from '../ui/Icon';

const TIER_LABELS = { starter: 'Starter', pro: 'Pro', dominator: 'Dominator' };

function formatMonthlyPrice(amountCents, currency = 'usd') {
  if (!amountCents) return '';
  const dollars = amountCents / 100;
  const formatted = Number.isInteger(dollars) ? dollars : dollars.toFixed(2);
  return `${currency.toUpperCase() === 'USD' ? '$' : ''}${formatted}/mo`;
}

export default function SubscribeInsteadModal({
  isOpen,
  offer,
  zipCode,
  vertical,
  submitting = false,
  onAccept,
  onDecline,
  onClose,
}) {
  if (!isOpen || !offer) return null;

  const tierLabel = TIER_LABELS[offer.tier] || offer.tier;
  const priceLabel = formatMonthlyPrice(offer.amount, offer.currency);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscribe-instead-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="max-w-md w-full rounded-2xl border border-yellow-400/30 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 id="subscribe-instead-title" className="text-white font-semibold text-lg">
              Skip the one-time buy — subscribe instead
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              ZIP {zipCode} — {vertical}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" type="button" className="text-slate-400 hover:text-white">
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-4 mb-4">
          <p className="text-3xl font-extrabold text-yellow-300">{priceLabel}</p>
          <p className="text-xs text-slate-400 mt-1">
            {tierLabel} plan{offer.is_founding ? ' — founding rate, locked forever' : ''}
          </p>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed mb-5">
          Lock this ZIP into your feed for {priceLabel} instead of paying $99 once — you'll get
          every new lead here going forward, not just this one batch of 5.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onDecline}
            type="button"
            disabled={submitting}
            className="text-slate-400 hover:text-white text-sm px-3 py-2"
          >
            No thanks, continue with $99 lead pack
          </button>
          <button
            onClick={onAccept}
            disabled={submitting}
            type="button"
            className="cta-primary text-sm px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Opening…' : 'Subscribe now'}
          </button>
        </div>
      </div>
    </div>
  );
}
